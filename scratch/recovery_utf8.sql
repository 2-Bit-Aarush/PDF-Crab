-- =============================================================
-- FINAL CANONICAL DATABASE RECOVERY (RLS & AUTHORIZATION)
-- =============================================================
-- This script replaces the entire RLS policies layout with a clean,
-- internally consistent, and recursion-free authorization model.
-- Run this in your Supabase Dashboard SQL Editor.
-- =============================================================

-- -------------------------------------------------------------
-- 1. DROP ALL DEPENDENT RLS POLICIES (TO RESOLVE SIGNATURE DEPENDENCIES)
-- -------------------------------------------------------------
-- profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- vaults
drop policy if exists "Users can view vaults they have access to" on public.vaults;
drop policy if exists "Users can view vaults they own or are members of" on public.vaults;
drop policy if exists "Users can insert vaults they own" on public.vaults;
drop policy if exists "Users can update vaults they own" on public.vaults;
drop policy if exists "Users can delete vaults they own" on public.vaults;
drop policy if exists "Owners can update vaults" on public.vaults;
drop policy if exists "Owners can delete vaults" on public.vaults;

-- vault_members
drop policy if exists "Members see list of shares" on public.vault_members;
drop policy if exists "Owners manage shares" on public.vault_members;

-- documents
drop policy if exists "Users can view documents in vaults they access" on public.documents;
drop policy if exists "Users can insert documents in vaults they access" on public.documents;
drop policy if exists "Users can delete documents in vaults they access" on public.documents;

-- master_notes
drop policy if exists "Users can view notes in vaults they access" on public.master_notes;
drop policy if exists "Users can manage notes in vaults they access" on public.master_notes;

-- note_sections
drop policy if exists "Users can view sections of notes they access" on public.note_sections;
drop policy if exists "Users can manage sections of notes they access" on public.note_sections;

-- ocr_jobs
drop policy if exists "Users can view OCR jobs for documents they access" on public.ocr_jobs;
drop policy if exists "Users can manage OCR jobs for documents they access" on public.ocr_jobs;

-- compile_jobs
drop policy if exists "Users can view compile jobs for notes they access" on public.compile_jobs;
drop policy if exists "Users can manage compile jobs for notes they access" on public.compile_jobs;

-- compilation_reports
drop policy if exists "Users can view compilation reports for notes they access" on public.compilation_reports;

-- exports
drop policy if exists "Users can view exports for notes they access" on public.exports;
drop policy if exists "Users can manage exports for notes they access" on public.exports;


-- -------------------------------------------------------------
-- 2. DROP AND RE-CREATE HELPER FUNCTIONS WITH SECURITY DEFINER
-- -------------------------------------------------------------
drop function if exists public.has_vault_access(uuid, uuid);
drop function if exists public.is_vault_owner(uuid, uuid);

-- Access helper: queries public.vaults and public.vault_members.
-- security definer runs with postgres privileges to bypass RLS and avoid recursion.
create or replace function public.has_vault_access(p_vault_id uuid, p_user_id uuid)
returns boolean security definer language plpgsql as $$
begin
  return exists (
    select 1 from public.vaults where id = p_vault_id and owner_id = p_user_id
  ) or exists (
    select 1 from public.vault_members where vault_id = p_vault_id and profile_id = p_user_id
  );
end;
$$;

-- Owner helper: queries public.vaults to see if the user is owner.
-- security definer runs with postgres privileges to bypass RLS.
create or replace function public.is_vault_owner(p_vault_id uuid, p_user_id uuid)
returns boolean security definer language plpgsql as $$
begin
  return exists (
    select 1 from public.vaults where id = p_vault_id and owner_id = p_user_id
  );
end;
$$;


-- -------------------------------------------------------------
-- 3. ENSURE ROW LEVEL SECURITY IS ACTIVE FOR ALL TABLES
-- -------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.vaults enable row level security;
alter table public.vault_members enable row level security;
alter table public.documents enable row level security;
alter table public.master_notes enable row level security;
alter table public.note_sections enable row level security;
alter table public.ocr_jobs enable row level security;
alter table public.compile_jobs enable row level security;
alter table public.compilation_reports enable row level security;
alter table public.exports enable row level security;


-- -------------------------------------------------------------
-- 4. ESTABLISH THE UNIFIED RECURSION-FREE POLICIES
-- -------------------------------------------------------------

-- public.profiles
create policy "Profiles are viewable by authenticated users" on public.profiles
  for select to authenticated using (true);

create policy "Users can update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- public.vaults
create policy "Users can view vaults they have access to" on public.vaults
  for select to authenticated using (public.has_vault_access(id, auth.uid()));

create policy "Users can insert vaults they own" on public.vaults
  for insert to authenticated with check (owner_id = auth.uid());

create policy "Owners can update vaults" on public.vaults
  for update to authenticated using (owner_id = auth.uid());

create policy "Owners can delete vaults" on public.vaults
  for delete to authenticated using (owner_id = auth.uid());

-- public.vault_members
create policy "Members see list of shares" on public.vault_members
  for select to authenticated using (public.has_vault_access(vault_id, auth.uid()));

create policy "Owners manage shares" on public.vault_members
  for all to authenticated using (public.is_vault_owner(vault_id, auth.uid()));

-- public.documents
create policy "Users can view documents in vaults they access" on public.documents
  for select to authenticated using (public.has_vault_access(vault_id, auth.uid()));

create policy "Users can insert documents in vaults they access" on public.documents
  for insert to authenticated with check (
    public.has_vault_access(vault_id, auth.uid()) and owner_id = auth.uid()
  );

create policy "Users can delete documents in vaults they access" on public.documents
  for delete to authenticated using (public.has_vault_access(vault_id, auth.uid()));

-- public.master_notes
create policy "Users can view notes in vaults they access" on public.master_notes
  for select to authenticated using (public.has_vault_access(vault_id, auth.uid()));

create policy "Users can manage notes in vaults they access" on public.master_notes
  for all to authenticated using (public.has_vault_access(vault_id, auth.uid()));

-- public.note_sections
create policy "Users can view sections of notes they access" on public.note_sections
  for select to authenticated using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );

create policy "Users can manage sections of notes they access" on public.note_sections
  for all to authenticated using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );

-- public.ocr_jobs
create policy "Users can view OCR jobs for documents they access" on public.ocr_jobs
  for select to authenticated using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and public.has_vault_access(d.vault_id, auth.uid())
    )
  );

create policy "Users can manage OCR jobs for documents they access" on public.ocr_jobs
  for all to authenticated using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and public.has_vault_access(d.vault_id, auth.uid())
    )
  );

-- public.compile_jobs
create policy "Users can view compile jobs for notes they access" on public.compile_jobs
  for select to authenticated using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );

create policy "Users can manage compile jobs for notes they access" on public.compile_jobs
  for all to authenticated using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );

-- public.compilation_reports
create policy "Users can view compilation reports for notes they access" on public.compilation_reports
  for select to authenticated using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );

-- public.exports
create policy "Users can view exports for notes they access" on public.exports
  for select to authenticated using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );

create policy "Users can manage exports for notes they access" on public.exports
  for all to authenticated using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );
