drop policy if exists "sops_owner_select" on public.sops;
drop policy if exists "sops_public_active_select" on public.sops;

create policy "sops_read_access"
on public.sops
for select
to anon, authenticated
using (
  status = 'active'
  or (
    (select auth.uid()) is not null
    and owner_id = (select auth.uid())
  )
);

drop policy if exists "quiz_questions_public_active_select" on public.quiz_questions;
drop policy if exists "quiz_questions_owner_all" on public.quiz_questions;

create policy "quiz_questions_owner_insert"
on public.quiz_questions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sops
    where sops.id = quiz_questions.sop_id
      and sops.owner_id = (select auth.uid())
  )
);

create policy "quiz_questions_owner_update"
on public.quiz_questions
for update
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

create policy "quiz_questions_owner_delete"
on public.quiz_questions
for delete
to authenticated
using (
  exists (
    select 1
    from public.sops
    where sops.id = quiz_questions.sop_id
      and sops.owner_id = (select auth.uid())
  )
);

create policy "quiz_questions_read_access"
on public.quiz_questions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.sops
    where sops.id = quiz_questions.sop_id
      and (
        sops.status = 'active'
        or (
          (select auth.uid()) is not null
          and sops.owner_id = (select auth.uid())
        )
      )
  )
);
