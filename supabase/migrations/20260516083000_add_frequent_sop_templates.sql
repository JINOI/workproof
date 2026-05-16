create table if not exists public.frequent_sop_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  title text not null,
  description text,
  source_sop_id uuid references public.sops(id) on delete set null,
  ai_summary jsonb not null default '{}'::jsonb,
  education_cards jsonb not null default '[]'::jsonb,
  languages text[] not null default array['ko'],
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (display_order)
);

create table if not exists public.frequent_sop_template_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.frequent_sop_templates(id) on delete cascade,
  language text not null default 'ko',
  position integer not null,
  type public.question_type not null,
  prompt text not null,
  options jsonb,
  correct_answer jsonb not null,
  explanation text,
  created_at timestamptz not null default now(),
  unique (template_id, language, position),
  constraint frequent_sop_template_options_shape check (
    (type = 'ox' and options is null)
    or
    (type = 'multiple' and jsonb_typeof(options) = 'array')
  )
);

drop trigger if exists frequent_sop_templates_set_updated_at on public.frequent_sop_templates;
create trigger frequent_sop_templates_set_updated_at
before update on public.frequent_sop_templates
for each row execute function private.set_updated_at();

alter table public.sops
add column if not exists source_template_key text;

do $$
begin
  alter table public.sops
  add constraint sops_source_template_key_fkey
  foreign key (source_template_key)
  references public.frequent_sop_templates(template_key)
  on delete set null;
exception
  when duplicate_object then null;
end;
$$;

create index if not exists frequent_sop_templates_display_order_idx
on public.frequent_sop_templates(display_order);

create index if not exists frequent_sop_template_questions_template_position_idx
on public.frequent_sop_template_questions(template_id, language, position);

create unique index if not exists sops_owner_source_template_key_key
on public.sops(owner_id, source_template_key)
where source_template_key is not null;

alter table public.frequent_sop_templates enable row level security;
alter table public.frequent_sop_template_questions enable row level security;

grant select on public.frequent_sop_templates, public.frequent_sop_template_questions to anon, authenticated;

drop policy if exists "frequent_sop_templates_read" on public.frequent_sop_templates;
create policy "frequent_sop_templates_read"
on public.frequent_sop_templates
for select
to anon, authenticated
using (true);

drop policy if exists "frequent_sop_template_questions_read" on public.frequent_sop_template_questions;
create policy "frequent_sop_template_questions_read"
on public.frequent_sop_template_questions
for select
to anon, authenticated
using (true);

with requested_templates(template_key, display_order, title_pattern) as (
  values
    ('loto', 1, '%loto%'),
    ('scaffold', 2, '%비계%'),
    ('ppe', 3, '%보호구%')
),
source_sops as (
  select distinct on (requested_templates.template_key)
    requested_templates.template_key,
    requested_templates.display_order,
    sops.id,
    sops.title,
    sops.description,
    sops.ai_summary,
    sops.education_cards,
    sops.languages,
    sops.created_at
  from requested_templates
  join public.sops on sops.title ilike requested_templates.title_pattern
  where sops.status = 'active'
  order by requested_templates.template_key, sops.created_at desc
)
insert into public.frequent_sop_templates (
  template_key,
  display_order,
  title,
  description,
  source_sop_id,
  ai_summary,
  education_cards,
  languages
)
select
  template_key,
  display_order,
  title,
  description,
  id,
  ai_summary,
  education_cards,
  languages
from source_sops
on conflict (template_key) do update
set
  display_order = excluded.display_order,
  title = excluded.title,
  description = excluded.description,
  source_sop_id = excluded.source_sop_id,
  ai_summary = excluded.ai_summary,
  education_cards = excluded.education_cards,
  languages = excluded.languages,
  updated_at = now();

delete from public.frequent_sop_template_questions as template_questions
using public.frequent_sop_templates as templates
where template_questions.template_id = templates.id
  and templates.template_key in ('loto', 'scaffold', 'ppe');

insert into public.frequent_sop_template_questions (
  template_id,
  language,
  position,
  type,
  prompt,
  options,
  correct_answer,
  explanation
)
select
  templates.id,
  quiz_questions.language,
  quiz_questions.position,
  quiz_questions.type,
  quiz_questions.prompt,
  quiz_questions.options,
  quiz_questions.correct_answer,
  quiz_questions.explanation
from public.frequent_sop_templates as templates
join public.quiz_questions on quiz_questions.sop_id = templates.source_sop_id
where templates.template_key in ('loto', 'scaffold', 'ppe');
