This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


Upgrade BYTECH CRM to support multiple business sectors using a Master Settings system.

Goal:
Transform the CRM from a fixed system into a flexible, multi-sector platform (Retail, Pharmacy, Care, SME).

Requirements:

1. Add a Master Settings module
   - Global app settings (company name, default sector, currency)
   - Sector selection (Retail, Pharmacy, Care, etc.)

2. Implement sector-based configuration
   - Dynamic labels (e.g., Leads → Patients, Customers → Clients)
   - Custom status pipelines per sector
   - Configurable task types per sector
   - Enable/disable modules based on sector

3. Add database tables:
   - sectors
   - sector_configs (json-based config)
   - app_settings

4. UI behavior:
   - System adapts based on selected sector
   - Forms show/hide fields depending on sector
   - Dashboard metrics change per sector

5. Maintain backward compatibility
   - Existing data (leads, customers, tasks) must still work
   - No breaking changes to current modules

6. Architecture:
   - Keep core CRM unchanged
   - Add a configuration layer on top (no duplication of modules)

7. Optional (Phase 2):
   - Custom fields builder
   - Role-based field visibility
   - Multi-branch sector support

Outcome:
A single CRM platform that can adapt to different industries without rewriting the system.



Perfect — here’s a clean, professional README prompt you can paste directly into your project 👇

⸻

🚀 Future Upgrade Plan — Quotations System (Post-MVP)

After completing the MVP quotation module, we will upgrade the system to support a full professional proposal engine aligned with BYTECH’s real-world quotation format.

🎯 Objective

Transform the quotation module from a simple item-based system into a complete business proposal generator that matches BYTECH’s official quotation documents.

⸻

🧩 Planned Enhancements

1. Quotation Structure Upgrade

Introduce structured sections within quotations:
	•	Software & System Setup
	•	Hardware Supply & Installation
	•	Domain & Hosting
	•	Custom sections (dynamic)

New table (future):

quotation_sections
- id
- quotation_id
- title
- sort_order

Update:
	•	Link quotation_items to quotation_sections

⸻

2. Proposal Content Blocks

Add rich business content to quotations:
	•	Payment Terms
	•	Bank Details
	•	Implementation Timeline
	•	After-Sales Support
	•	Warranty Terms
	•	Terms & Conditions

New table (future):

quotation_meta
- quotation_id
- payment_terms
- bank_details
- implementation_timeline
- after_sales_support
- warranty_terms
- terms_and_conditions


⸻

3. Advanced Print / PDF Layout

Build a professional quotation template:
	•	BYTECH branded header
	•	Reference number + date
	•	Client information block
	•	Sectioned pricing tables
	•	Subtotals + total project cost
	•	Payment breakdown
	•	Structured proposal sections
	•	Signature / authorization footer

⸻

4. PDF Export System

Enable:
	•	Download quotation as PDF
	•	Share via link
	•	Send to client via email

Tools to use:
	•	react-pdf OR
	•	server-side PDF generation (later phase)

⸻

5. Quotation → Invoice Conversion

Allow direct conversion:
	•	Accepted quotation → invoice
	•	Auto-fill invoice from quotation
	•	Preserve item breakdown

⸻

6. Versioning System

Track quotation revisions:
	•	Version history
	•	Duplicate/edit quotations
	•	Maintain audit trail

⸻

7. Status Automation

Enhance lifecycle:
	•	draft → sent → accepted → rejected → expired
	•	Auto-expire based on validity date
	•	Trigger notifications

⸻

8. Analytics & Reporting

Add insights:
	•	Conversion rate (quotation → customer)
	•	Revenue tracking from quotations
	•	Sales performance per staff

⸻

🧠 Design Principle

MVP first → Revenue next → Automation later → Perfection last

⸻

✅ Current State (MVP)
	•	Quotations table ✔
	•	Quotation items ✔
	•	Create / list / view ✔
	•	Basic totals ✔

⸻

🔜 Next Evolution

Focus on:
	•	Professional presentation
	•	Sales effectiveness
	•	Automation of business workflow

⸻

If you want, next I’ll help you:

👉 Turn your exact uploaded quotation into a live print page design inside your app (this will make your system feel like a real product instantly)