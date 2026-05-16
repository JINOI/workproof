alter table public.quiz_questions
add column if not exists language text not null default 'ko';

alter table public.quiz_questions
drop constraint if exists quiz_questions_sop_id_position_key;

create unique index if not exists quiz_questions_sop_language_position_key
on public.quiz_questions(sop_id, language, position);

create index if not exists quiz_questions_sop_language_position_idx
on public.quiz_questions(sop_id, language, position);
