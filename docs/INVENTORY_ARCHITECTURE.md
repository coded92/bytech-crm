# BYTECH CRM Inventory Architecture

## 1. Overview

This document defines the official inventory architecture for BYTECH CRM.

BYTECH CRM owns the `public` PostgreSQL schema. NEXUS owns the `nexus` and `ai` schemas and is explicitly out of scope for this document. Inventory architecture decisions in this document apply only to BYTECH CRM public-schema inventory, field-job, restocking, and future finance integration workflows.

During Phase 5 stabilization, inventory behavior was found to be more complex than the application code originally implied. The system has an existing database-side trigger on `inventory_movements` that updates `inventory_items.current_quantity`. Historical app-side logic also updated quantities directly. This caused double-update risks, hidden side effects, and historical drift.

The architecture is now transitioning toward an enterprise-grade transactional model where inventory movements are ledger entries, cached quantities are derived balances, and RPCs become the controlled mutation boundary.

## 2. Inventory Philosophy

Inventory must be treated as a financial-grade operational ledger, not as a simple editable quantity field.

The system must answer:

- what stock changed
- why it changed
- who changed it
- when it changed
- which business process caused it
- what the previous and resulting quantities were
- whether stored balances match movement history

Manual quantity updates are unsafe unless they are represented by an auditable correction movement or controlled reconciliation procedure.

## 3. Canonical Source of Truth

`inventory_movements` is the canonical inventory ledger.

`inventory_items.current_quantity` is a cached aggregate balance. It is useful for fast reads, dashboards, forms, and operational availability checks, but it must not be treated as the primary source of truth.

If movement history and stored quantity disagree, the system is in drift. Drift must be investigated and reconciled. The answer is not automatically to trust the stored quantity.

## 4. Current Inventory Tables

The current inventory domain primarily uses:

- `inventory_items`: item master and cached stock balance
- `inventory_movements`: canonical stock movement ledger
- `field_job_inventory_usage`: inventory issued to field jobs
- `inventory_restock_orders`: restock order header
- `inventory_restock_order_items`: restock order lines
- `activity_logs`: audit trail for operational actions

Related modules include field jobs, suppliers, expenses, payments, invoices, and future finance ledger work.

## 5. Inventory Movement Ledger Model

Every inventory-changing event should be represented as a movement row.

Movement rows should be append-oriented. They should not be casually edited or deleted after production posting. Corrections should normally be represented by reversing or correcting movements.

The ledger must support:

- stock received
- stock issued
- field-job usage
- restock receiving
- reconciliation corrections
- future physical counts
- future transfer and warehouse workflows

The ledger should eventually record previous quantity, new quantity, source module, source record, actor, approval state, and posting metadata.

## 6. Cached Aggregate Model

`inventory_items.current_quantity` is a cached aggregate of the movement ledger.

It exists because operational screens need fast quantity reads. However, cached balances can drift if any process writes outside the controlled inventory mutation path.

The system must maintain tools to:

- compare cached quantity against movement-derived quantity
- detect drift
- report drift by item
- reconcile safely
- prevent direct uncontrolled updates

## 7. Trigger Architecture

The live database has an existing trigger on `inventory_movements`:

- trigger: `trg_apply_inventory_movement`
- function: `apply_inventory_movement()`
- effect: updates `inventory_items.current_quantity` when movement rows are inserted

This trigger is a hidden mutation path from the perspective of application code. It must be treated as active production behavior until intentionally replaced or retired.

Current RPCs must be trigger-aware. They should not blindly update `inventory_items.current_quantity` and then insert `inventory_movements`, because the trigger may apply the same movement again.

## 8. Current Trigger Risks

The current trigger behavior has known risks:

- `stock_out` uses `greatest(0, current_quantity - new.quantity)`
- insufficient stock is silently clamped to zero
- `adjustment` behavior is semantically ambiguous
- app code may not know whether the trigger already applied a balance update
- historical code paths may have updated both movement rows and item balances

Silent clamping is not enterprise-safe. A stock-out of `999999` against quantity `5` should fail. It should not create a movement row for `999999` and quietly set stock to zero.

## 9. RPC Architecture

RPCs are the future mutation boundary for inventory.

Current and planned RPCs include:

- `public.post_inventory_movement`
- `public.issue_field_job_inventory`
- future restock receiving RPC
- future stock correction RPC
- future physical count RPC
- future finance-linked inventory posting RPCs

RPCs must:

- validate inputs
- validate actor identity
- lock affected rows
- reject invalid states
- write the correct ledger rows
- verify cached aggregate outcomes
- write activity logs
- return deterministic result data

RPCs should use `security invoker` unless a specific production review approves `security definer` with hardened access checks.

## 10. Inventory Mutation Rules

Inventory-changing operations must follow these rules:

- do not update `inventory_items.current_quantity` directly from UI actions
- do not insert movement rows without validating stock rules
- do not rely on UI hiding buttons for authorization
- do not allow stock to silently go negative or silently clamp to zero
- do not allow duplicate movement creation for one business event
- do not split usage records and stock movements across non-atomic app calls long term
- do not use SQL Editor for authenticated RPC tests that rely on `auth.uid()`

All production mutations should eventually route through RPCs.

## 11. Inventory Movement Types

Current movement types include:

- `stock_in`
- `stock_out`
- `adjustment`

These are not sufficient for a mature enterprise inventory system. Future movement taxonomy should include:

- `stock_in`
- `stock_out`
- `restock_received`
- `field_job_issue`
- `field_job_return`
- `adjustment_in`
- `adjustment_out`
- `physical_count`
- `transfer_in`
- `transfer_out`
- `write_off`

Until schema changes are approved, current movement types must be interpreted consistently.

## 12. Adjustment Semantics

Adjustment semantics are currently ambiguous.

There are two common models:

Additive adjustment:

```text
new quantity = current quantity + adjustment quantity
```

Absolute adjustment:

```text
new quantity = adjustment quantity
```

The existing trigger has treated `adjustment` as absolute in at least one observed design, while app logic historically treated adjustment more like an additive stock-in. This mismatch can create drift.

Enterprise recommendation:

- do not overload `adjustment`
- introduce explicit correction movement types later
- use `physical_count` when setting stock to a counted absolute value
- use `adjustment_in` or `adjustment_out` for additive corrections

## 13. Reconciliation Strategy

Reconciliation must start by comparing stored quantity against movement-derived quantity.

For each item:

- compute ledger-derived quantity
- compare with `inventory_items.current_quantity`
- identify drift
- classify cause
- decide whether ledger or physical count is correct
- repair using a controlled process

Drift causes may include:

- historical double updates
- trigger and app both updating quantity
- direct manual quantity edits
- missing opening stock movements
- incorrect adjustment semantics
- clamped stock-outs
- failed compensating rollback logic

## 14. Drift Detection

Drift detection should become a routine operational audit.

Core metric:

```text
drift = inventory_items.current_quantity - movement-derived quantity
```

Drift should be reported by:

- item
- category
- absolute value
- financial value
- last movement date
- last actor
- related business process

Any non-zero drift is an operational control exception.

## 15. Concurrency & Locking

Inventory writes require row-level locking.

RPCs should lock rows in consistent order:

1. source business record, if applicable
2. `inventory_items`
3. dependent insert rows

For field-job inventory issue:

1. lock `field_jobs`
2. lock `inventory_items`
3. insert `field_job_inventory_usage`
4. insert `inventory_movements`
5. verify resulting quantity

Consistent lock order reduces deadlock risk.

## 16. RLS & Security

Inventory RPCs should respect Supabase Auth and RLS.

Required principles:

- use authenticated Supabase server clients
- default actor to `auth.uid()`
- reject null actor
- reject mismatched caller-provided actor ids
- require server-side authorization before app actions call RPCs
- eventually restrict direct table writes

RLS must allow legitimate RPC operations while preventing unauthorized direct inserts, updates, and deletes.

## 17. Audit Logging

Every inventory mutation should produce an audit trail.

Current system writes to `activity_logs`. Future ledger design should also include richer audit metadata directly on inventory movement rows.

Audit logs should capture:

- actor
- entity type
- entity id
- action
- description
- timestamp
- source module
- source record id

Activity logs are useful, but inventory movements themselves should eventually carry enough information to audit stock independently.

## 18. Rollback Philosophy

Production inventory should prefer correcting entries over destructive rollback.

For test data, limited cleanup may be acceptable during controlled stabilization. For production operational history:

- avoid deleting movement rows
- avoid editing historical movement quantities
- post reversal movements
- post correction movements
- retain reason notes
- retain actor identity

Rollback of a failed database operation should occur transactionally inside RPCs. Rollback of an already-posted business event should usually be represented by another ledger entry.

## 19. Inventory Correction Procedures

Correction procedure depends on which truth is correct.

If movement ledger is correct and cached quantity is wrong:

- repair `inventory_items.current_quantity` through a controlled cache reconciliation procedure
- record audit log
- preserve ledger unchanged

If physical count is correct and ledger is missing reality:

- post a correction movement
- document reason
- include actor
- include approval metadata in future schema

If a historical movement is wrong:

- do not edit it casually
- post an offsetting movement
- document the correction

## 20. Field-Job Inventory Integration

Field-job inventory usage must become atomic.

Current app-side flow has historically inserted usage first and then posted stock movement separately. That is not enterprise-safe because partial failure can leave usage and movement out of sync.

Future direction:

- use `public.issue_field_job_inventory`
- lock field job
- lock inventory item
- validate stock
- insert usage
- insert one stock-out movement
- rely on hardened movement behavior to update cached stock
- verify resulting quantity
- write activity log

No trigger currently exists on `field_job_inventory_usage`, based on the live audit provided. If that changes, the RPC must be reviewed again to avoid duplicate movement inserts.

## 21. Restock Integration

Restock receiving should eventually use an RPC.

The restock RPC should:

- lock restock order
- lock restock lines
- lock inventory items in deterministic order
- validate order status
- insert stock-in movement rows
- verify resulting quantities
- mark order received
- write activity logs

Restock receiving must avoid multi-step Supabase JS writes for production posting.

## 22. Future Finance Integration

Inventory has financial implications.

Future finance integration should connect:

- restock receiving
- supplier expenses
- supplier payments
- inventory valuation
- cost of goods issued to field jobs
- project profitability
- write-offs

Do not introduce accounting ledger coupling until inventory mutation integrity is stable.

## 23. Enterprise Scaling Direction

Enterprise inventory should support:

- multiple warehouses
- stock locations
- serialized assets
- batch/lot tracking
- stock reservations
- approval workflows
- physical counts
- cycle counting
- reorder rules
- valuation layers
- landed cost
- audit exports

BYTECH CRM should evolve toward this incrementally, starting with a trustworthy movement ledger and strict mutation boundaries.

## 24. Recommended Future Constraints

Future constraints should include:

- movement quantity greater than zero
- allowed movement type constraint or enum
- non-negative item current quantity
- valid unit cost non-negative
- foreign keys from movements to items
- foreign keys from field-job usage to jobs and items
- created_by references profiles or auth users where appropriate
- no direct delete of posted movement rows, or delete restricted by role

Constraints should be introduced only after drift is reconciled.

## 25. Recommended Future Materialized Views

Recommended views:

- inventory ledger balance by item
- inventory drift report
- low stock report
- inventory valuation summary
- field-job inventory cost by job
- restock received vs ordered
- stock movement audit by actor

Recommended materialized views:

- movement-derived quantity by item
- monthly inventory valuation
- field-job inventory cost summary

Materialized views should have refresh strategy and monitoring.

## 26. Future Inventory Ledger Direction

The inventory ledger should eventually include:

- previous quantity
- new quantity
- source module
- source table
- source id
- approval status
- reversal reference
- correction reason
- posted_at
- posted_by
- idempotency key

This will reduce dependence on inferred history and make enterprise audit easier.

## 27. Migration Strategy

Migration must be incremental.

Recommended sequence:

1. document current behavior
2. audit triggers and drift
3. reconcile historical drift
4. harden trigger behavior
5. keep existing RPC verification
6. migrate app actions behind RPC feature flags
7. restrict direct writes
8. introduce stronger constraints
9. introduce richer ledger schema
10. retire unsafe legacy paths

Do not combine reconciliation, trigger replacement, and app rollout in one uncontrolled release.

## 28. Trigger Hardening Strategy

The current trigger should be hardened before broad rollout.

Required hardening:

- reject unknown movement types
- reject quantity less than or equal to zero
- reject insufficient stock-out
- remove silent `greatest(0, ...)` clamping
- define `adjustment` semantics clearly
- update `updated_at` consistently

Short term, keep RPCs trigger-aware and verify resulting quantity.

Long term, consider moving business logic fully into RPCs and retiring generic mutation triggers.

## 29. Operational Monitoring

Inventory monitoring should include:

- count of items with drift
- total absolute quantity drift
- total estimated value drift
- failed RPC calls
- insufficient stock attempts
- negative or clamped stock attempts
- movements without source reference
- field-job usage without movement
- movement without expected business source
- direct updates to `inventory_items.current_quantity`

Inventory drift should be reviewed regularly until the architecture is fully hardened.

## 30. Production Safety Rules

Production safety rules:

- never run inventory repair SQL without a pre-repair export
- never use SQL Editor for authenticated RPC behavior that depends on `auth.uid()`
- never deploy trigger changes without testing invalid stock-out
- never manually edit `current_quantity` without documenting reconciliation intent
- never allow both app logic and trigger logic to apply the same quantity delta
- never rely on UI-only permission checks
- never assume generated types include live triggers
- never modify Nexus or AI schemas from BYTECH CRM inventory work
- keep feature flags available during rollout
- prefer small reversible changes over large mixed migrations

The target state is simple:

```text
inventory_movements = canonical ledger
inventory_items.current_quantity = cached aggregate
RPCs = controlled mutation boundary
direct table writes = restricted
drift = monitored and exceptional
```

