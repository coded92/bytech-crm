# BYTECH ENTERPRISE PLATFORM ARCHITECTURE

## Shared Supabase Project

This project shares ONE Supabase backend with multiple systems.

---

# Schema Ownership

## public

Owned by:

* BYTECH CRM / ERP

Contains:

* CRM
* Projects
* Finance
* Inventory
* HR
* Support
* Operations

DO NOT create:

* Nexus tables
* AI vector tables
  inside public schema.

---

## analytics

Owned by:

* Reporting
* BI
* Dashboard materialized views
* Aggregated metrics

Used by:

* CRM
* Nexus
* Future analytics systems

---

# Storage Ownership

## crm-private

Internal ERP documents

## crm-public

Public branding/assets

## payment-proofs

Payment confirmations

## attachments

ERP attachments

---

# Rules

* All migrations must be committed
* Never edit production DB manually without migration
* Never create Nexus tables in public
* Never create AI tables in public
* Never bypass RLS intentionally
* Financial and inventory actions must become transactional
