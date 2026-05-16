create extension if not exists "pgcrypto";

create schema if not exists private;

create type public.profile_role as enum ('admin', 'manager');
create type public.sop_status as enum ('draft', 'active', 'archived');
create type public.question_type as enum ('ox', 'multiple');
create type public.education_status as enum ('pending', 'safe', 'warning', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.profile_role not null default 'manager',
  display_name text,
  organization_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  source_file_path text,
  source_file_name text,
  source_file_mime text,
  ai_summary jsonb not null default '{}'::jsonb,
  education_cards jsonb not null default '[]'::jsonb,
  languages text[] not null default array['ko'],
  public_token uuid not null default gen_random_uuid(),
  status public.sop_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (public_token)
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  sop_id uuid not null references public.sops(id) on delete cascade,
  position integer not null,
  type public.question_type not null,
  prompt text not null,
  options jsonb,
  correct_answer jsonb not null,
  explanation text,
  created_at timestamptz not null default now(),
  unique (sop_id, position),
  constraint quiz_options_shape check (
    (type = 'ox' and options is null)
    or
    (type = 'multiple' and jsonb_typeof(options) = 'array')
  )
);

create table public.education_logs (
  id uuid primary key default gen_random_uuid(),
  sop_id uuid not null references public.sops(id) on delete cascade,
  worker_name text not null,
  worker_birth_date date not null,
  language text not null default 'ko',
  status public.education_status not null default 'pending',
  attempts integer not null default 1 check (attempts > 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  elapsed_seconds integer check (elapsed_seconds is null or elapsed_seconds >= 0),
  wrong_question_ids uuid[] not null default '{}',
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sops_owner_id_idx on public.sops(owner_id);
create index sops_public_token_idx on public.sops(public_token);
create index sops_status_idx on public.sops(status);
create index quiz_questions_sop_position_idx on public.quiz_questions(sop_id, position);
create index education_logs_sop_id_idx on public.education_logs(sop_id);
create index education_logs_status_idx on public.education_logs(status);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger sops_set_updated_at
before update on public.sops
for each row execute function private.set_updated_at();

create trigger education_logs_set_updated_at
before update on public.education_logs
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.sops enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.education_logs enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.sops, public.quiz_questions to anon;
grant select, insert, update, delete on public.sops, public.quiz_questions to authenticated;
grant insert on public.education_logs to anon;
grant select, insert, update on public.education_logs to authenticated;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "sops_owner_select"
on public.sops
for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "sops_owner_insert"
on public.sops
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "sops_owner_update"
on public.sops
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "sops_owner_delete"
on public.sops
for delete
to authenticated
using ((select auth.uid()) = owner_id);

create policy "sops_public_active_select"
on public.sops
for select
to anon, authenticated
using (status = 'active');

create policy "quiz_questions_owner_all"
on public.quiz_questions
for all
to authenticated
using (
  exists (
    select 1
    from public.sops
    where sops.id = quiz_questions.sop_id
      and sops.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.sops
    where sops.id = quiz_questions.sop_id
      and sops.owner_id = (select auth.uid())
  )
);

create policy "quiz_questions_public_active_select"
on public.quiz_questions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.sops
    where sops.id = quiz_questions.sop_id
      and sops.status = 'active'
  )
);

create policy "education_logs_owner_select"
on public.education_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.sops
    where sops.id = education_logs.sop_id
      and sops.owner_id = (select auth.uid())
  )
);

create policy "education_logs_owner_update"
on public.education_logs
for update
to authenticated
using (
  exists (
    select 1
    from public.sops
    where sops.id = education_logs.sop_id
      and sops.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.sops
    where sops.id = education_logs.sop_id
      and sops.owner_id = (select auth.uid())
  )
);

create policy "education_logs_public_completion_insert"
on public.education_logs
for insert
to anon, authenticated
with check (
  status in ('safe', 'warning', 'failed')
  and exists (
    select 1
    from public.sops
    where sops.id = education_logs.sop_id
      and sops.status = 'active'
  )
);

insert into storage.buckets (id, name, public)
values ('sop-files', 'sop-files', false)
on conflict (id) do nothing;

create policy "sop_files_owner_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'sop-files'
  and owner = (select auth.uid())
);

create policy "sop_files_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'sop-files'
  and owner = (select auth.uid())
);

create policy "sop_files_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'sop-files'
  and owner = (select auth.uid())
)
with check (
  bucket_id = 'sop-files'
  and owner = (select auth.uid())
);

create policy "sop_files_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'sop-files'
  and owner = (select auth.uid())
);
