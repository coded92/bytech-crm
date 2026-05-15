DATABASE OWNERSHIP RULES

BYTECH CRM owns:
- public schema
- analytics schema

Nexus owns:
- nexus schema
- ai schema

DO NOT create Nexus tables in public.
DO NOT create CRM tables in nexus.
DO NOT create AI tables in public.

Shared Supabase project architecture enforced.