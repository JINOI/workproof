alter table public.profiles
add column if not exists company_public_token uuid;

update public.profiles
set company_public_token = gen_random_uuid()
where company_public_token is null;

alter table public.profiles
alter column company_public_token set default gen_random_uuid();

alter table public.profiles
alter column company_public_token set not null;

create unique index if not exists profiles_company_public_token_key
on public.profiles(company_public_token);

insert into public.profiles (id)
select distinct sops.owner_id
from public.sops
where not exists (
  select 1
  from public.profiles
  where profiles.id = sops.owner_id
)
on conflict (id) do nothing;

alter table public.sops
add column if not exists company_public_token uuid;

update public.sops
set company_public_token = profiles.company_public_token
from public.profiles
where public.sops.owner_id = profiles.id
  and public.sops.company_public_token is null;

alter table public.sops
alter column company_public_token set not null;

create index if not exists sops_company_public_token_status_idx
on public.sops(company_public_token, status);
