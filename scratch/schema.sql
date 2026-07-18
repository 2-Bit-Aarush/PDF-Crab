-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------------
-- UPDATED_AT COLUMN TRIGGER
-- -------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- -------------------------------------------------------------
-- PROFILES TABLE
-- -------------------------------------------------------------
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  email text not null,
  avatar_url text,
  full_name text,
  telegram_chat_id text unique,
  telegram_username text,
  telegram_link_code text unique,
  tg_default_vault_id uuid,
  tg_auto_compile boolean default false not null,
  tg_notifications boolean default true not null,
  tg_ocr_lang text default 'en' not null
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute procedure public.update_updated_at_column();

-- -------------------------------------------------------------
-- AUTH NEW USER TRIGGER
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -------------------------------------------------------------
-- VAULTS TABLE
-- -------------------------------------------------------------
create table public.vaults (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null
);

alter table public.vaults enable row level security;

create trigger set_updated_at_vaults
  before update on public.vaults
  for each row execute procedure public.update_updated_at_column();

-- -------------------------------------------------------------
-- VAULT MEMBERS TABLE
-- -------------------------------------------------------------
create table public.vault_members (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  vault_id uuid references public.vaults(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  unique(vault_id, profile_id)
);

alter table public.vault_members enable row level security;

create trigger set_updated_at_vault_members
  before update on public.vault_members
  for each row execute procedure public.update_updated_at_column();

-- -------------------------------------------------------------
-- ACCESS HELPER FUNCTIONS
-- -------------------------------------------------------------
create or replace function public.has_vault_access(vault_id uuid, user_id uuid)
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.vaults where id = vault_id and owner_id = user_id
  ) or exists (
    select 1 from public.vault_members where vault_id = $1 and profile_id = $2
  );
end;
$$ language plpgsql;

-- Vault Policies
create policy "Users can view vaults they have access to" on public.vaults
  for select using (public.has_vault_access(id, auth.uid()));

create policy "Users can insert vaults they own" on public.vaults
  for insert with check (owner_id = auth.uid());

create policy "Users can update vaults they own" on public.vaults
  for update using (owner_id = auth.uid());

create policy "Users can delete vaults they own" on public.vaults
  for delete using (owner_id = auth.uid());

-- Vault Members Policies
create policy "Members see list of shares" on public.vault_members
  for select using (public.has_vault_access(vault_id, auth.uid()));

create policy "Owners manage shares" on public.vault_members
  for all using (
    exists (
      select 1 from public.vaults where id = vault_id and owner_id = auth.uid()
    )
  );

-- -------------------------------------------------------------
-- DOCUMENTS TABLE
-- -------------------------------------------------------------
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  vault_id uuid references public.vaults(id) on delete cascade not null,
  name text not null,
  storage_path text not null,
  size bigint not null,
  mime_type text not null,
  page_count integer default 0,
  checksum text,
  ocr_text_hash text,
  owner_id uuid references public.profiles(id) on delete cascade not null
);

alter table public.documents enable row level security;

create trigger set_updated_at_documents
  before update on public.documents
  for each row execute procedure public.update_updated_at_column();

create policy "Users can view documents in vaults they access" on public.documents
  for select using (public.has_vault_access(vault_id, auth.uid()));

create policy "Users can insert documents in vaults they access" on public.documents
  for insert with check (
    public.has_vault_access(vault_id, auth.uid()) and owner_id = auth.uid()
  );

create policy "Users can delete documents in vaults they access" on public.documents
  for delete using (
    public.has_vault_access(vault_id, auth.uid()) or owner_id = auth.uid()
  );

-- -------------------------------------------------------------
-- MASTER NOTES TABLE (VERSIONED)
-- -------------------------------------------------------------
create table public.master_notes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  vault_id uuid references public.vaults(id) on delete cascade not null,
  title text not null,
  coverage integer default 0 not null,
  generated boolean default false not null,
  version integer default 1 not null,
  ai_model text,
  ocr_provider text,
  source_document_hashes text[],
  active boolean default true not null
);

alter table public.master_notes enable row level security;

create trigger set_updated_at_master_notes
  before update on public.master_notes
  for each row execute procedure public.update_updated_at_column();

create policy "Users can view notes in vaults they access" on public.master_notes
  for select using (public.has_vault_access(vault_id, auth.uid()));

create policy "Users can manage notes in vaults they access" on public.master_notes
  for all using (public.has_vault_access(vault_id, auth.uid()));

-- -------------------------------------------------------------
-- NOTE SECTIONS TABLE (TRACEABLE)
-- -------------------------------------------------------------
create table public.note_sections (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  master_note_id uuid references public.master_notes(id) on delete cascade not null,
  heading text not null,
  body text not null,
  display_order integer not null,
  source_document_id uuid references public.documents(id) on delete set null,
  page_numbers integer[],
  ocr_source text,
  compile_version integer default 1
);

alter table public.note_sections enable row level security;

create trigger set_updated_at_note_sections
  before update on public.note_sections
  for each row execute procedure public.update_updated_at_column();

create policy "Users can view sections of notes they access" on public.note_sections
  for select using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );

create policy "Users can manage sections of notes they access" on public.note_sections
  for all using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );

-- -------------------------------------------------------------
-- OCR JOBS TABLE
-- -------------------------------------------------------------
create table public.ocr_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  document_id uuid references public.documents(id) on delete cascade not null,
  status text not null, -- 'queued' | 'processing' | 'completed' | 'failed'
  raw_text text,
  processed_text text,
  page_count integer default 0,
  confidence_score numeric(5,2),
  error_message text,
  retry_count integer default 0 not null
);

alter table public.ocr_jobs enable row level security;

create trigger set_updated_at_ocr_jobs
  before update on public.ocr_jobs
  for each row execute procedure public.update_updated_at_column();

create policy "Users can view OCR jobs for documents they access" on public.ocr_jobs
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and public.has_vault_access(d.vault_id, auth.uid())
    )
  );

-- -------------------------------------------------------------
-- COMPILE JOBS TABLE
-- -------------------------------------------------------------
create table public.compile_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  master_note_id uuid references public.master_notes(id) on delete cascade not null,
  status text not null, -- 'queued' | 'processing' | 'completed' | 'failed'
  phase text not null, -- 'Indexing Sources' | 'Reading Documents' | 'Comparing Information' | 'Building Knowledge Graph' | 'Compiling Master Note'
  progress integer default 0 not null,
  error_message text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  duration numeric(10,2)
);

alter table public.compile_jobs enable row level security;

create trigger set_updated_at_compile_jobs
  before update on public.compile_jobs
  for each row execute procedure public.update_updated_at_column();

create policy "Users can view compile jobs for notes they access" on public.compile_jobs
  for select using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );

-- -------------------------------------------------------------
-- COMPILATION REPORTS TABLE
-- -------------------------------------------------------------
create table public.compilation_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  master_note_id uuid references public.master_notes(id) on delete cascade not null,
  ai_provider text not null,
  ai_model text not null,
  ocr_provider text not null,
  compile_duration numeric(10,2) not null,
  input_tokens integer default 0 not null,
  output_tokens integer default 0 not null,
  duplicates_removed integer default 0 not null,
  pages_processed integer default 0 not null,
  warnings text[],
  errors text[]
);

alter table public.compilation_reports enable row level security;

create policy "Users can view compilation reports for notes they access" on public.compilation_reports
  for select using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );

-- -------------------------------------------------------------
-- EXPORTS TABLE
-- -------------------------------------------------------------
create table public.exports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  master_note_id uuid references public.master_notes(id) on delete cascade not null,
  format text not null, -- 'markdown' | 'pdf' | 'docx' | 'txt'
  storage_path text not null
);

alter table public.exports enable row level security;

create trigger set_updated_at_exports
  before update on public.exports
  for each row execute procedure public.update_updated_at_column();

create policy "Users can view exports for notes they access" on public.exports
  for select using (
    exists (
      select 1 from public.master_notes mn
      where mn.id = master_note_id and public.has_vault_access(mn.vault_id, auth.uid())
    )
  );

-- -------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- -------------------------------------------------------------
create index idx_vaults_owner on public.vaults(owner_id);
create index idx_vault_members_vault on public.vault_members(vault_id);
create index idx_vault_members_profile on public.vault_members(profile_id);
create index idx_documents_vault on public.documents(vault_id);
create index idx_documents_checksum on public.documents(checksum);
create index idx_master_notes_vault on public.master_notes(vault_id);
create index idx_note_sections_note on public.note_sections(master_note_id);
create index idx_ocr_jobs_doc on public.ocr_jobs(document_id);
create index idx_compile_jobs_note on public.compile_jobs(master_note_id);
create index idx_compilation_reports_note on public.compilation_reports(master_note_id);
create index idx_exports_note on public.exports(master_note_id);
