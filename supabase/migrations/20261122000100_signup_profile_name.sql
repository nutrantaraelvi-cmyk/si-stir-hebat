begin;

-- A self-registered account may provide its display name, but never its role.
create or replace function public.create_school_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  submitted_name text;
begin
  submitted_name := left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120);
  insert into public.profiles (id, full_name, role)
  values (new.id, submitted_name, 'pending');
  return new;
end;
$$;

revoke all on function public.create_school_profile() from public, anon, authenticated;

commit;
