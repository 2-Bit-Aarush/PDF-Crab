# PDF-Crab — Authentication & Authorization Architecture

This document describes the canonical, unified authorization architecture for the PDF-Crab platform.

---

## 1. Authentication Gate
- Access control relies entirely on Supabase Auth.
- All RLS policies specify `to authenticated` user constraints. Anonymous public access is disabled on all relations.
- User registration is handled dynamically through the `handle_new_user` auth trigger synchronizer, which populates the `profiles` table.

---

## 2. Row Level Security Policies Layout
To prevent infinite recursion and ambiguous column references, the database has been rebuilt using the following model:

- **Profiles (`profiles`)**: Viewable by all authenticated users to allow invite mapping lookup, but updatable only by the owner (`auth.uid() = id`).
- **Vaults (`vaults`)**: Viewable by the owner or invited members via `has_vault_access(id, auth.uid())`. Managed (insert, update, delete) solely by the owner (`owner_id = auth.uid()`).
- **Members (`vault_members`)**: Viewable by members of the vault. Insert/update/delete operations are restricted to the vault owner (`public.is_vault_owner(vault_id, auth.uid())`).
- **Assets (`documents`, `master_notes`, `note_sections`, `ocr_jobs`, `compile_jobs`, `compilation_reports`, `exports`)**: Read and write capabilities are gated by verifying membership or ownership of the parent vault via `public.has_vault_access(vault_id, auth.uid())`.

---

## 3. Recursion Protection (Security Definer)
Database policies must not execute queries on tables they protect without proper isolation, otherwise PostgreSQL raises an infinite RLS recursion exception.

To address this, all RLS policy queries point to two functions defined with `SECURITY DEFINER` constraints:
1. `public.has_vault_access(p_vault_id, p_user_id)`
2. `public.is_vault_owner(p_vault_id, p_user_id)`

Because `SECURITY DEFINER` executes nested statements with the context of the function creator (`postgres` superuser), the internal select queries bypass the tables' row-level security checks, preventing evaluation loops.
