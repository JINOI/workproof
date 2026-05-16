create or replace function private.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, organization_name)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    nullif(new.raw_user_meta_data ->> 'organization_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists create_profile_on_signup on auth.users;

create trigger create_profile_on_signup
after insert on auth.users
for each row execute function private.create_profile_for_new_user();

revoke insert on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name, organization_name) on public.profiles to authenticated;

drop policy if exists "profiles_insert_own" on public.profiles;
