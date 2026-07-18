-- -------------------------------------------------------------
-- MIGRATION: FIX VAULTS RLS & ENABLE DOCUMENT UPDATES
-- -------------------------------------------------------------

-- 1. Drop existing SELECT policy on vaults
drop policy if exists "Users can view vaults they have access to" on public.vaults;

-- 2. Recreate SELECT policy on vaults with short-circuiting direct owner check
create policy "Users can view vaults they have access to" on public.vaults
  for select to authenticated using (
    owner_id = auth.uid() or public.has_vault_access(id, auth.uid())
  );

-- 3. Add UPDATE policy on documents to allow users to rename/replace sources
drop policy if exists "Users can update documents in vaults they access" on public.documents;
create policy "Users can update documents in vaults they access" on public.documents
  for update to authenticated using (
    public.has_vault_access(vault_id, auth.uid())
  );
