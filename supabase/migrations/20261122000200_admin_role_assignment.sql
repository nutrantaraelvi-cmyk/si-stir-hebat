begin;

create table public.profile_role_changes (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  old_role text not null check (old_role = 'pending'),
  new_role text not null check (new_role in ('principal', 'teacher', 'student', 'parent')),
  changed_at timestamptz not null default now()
);

alter table public.profile_role_changes enable row level security;
revoke all on table public.profile_role_changes from anon, authenticated;
grant select on table public.profile_role_changes to authenticated;

create policy profile_role_changes_admin_read on public.profile_role_changes
  for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'administrator'
  ));

create function public.list_pending_school_accounts()
returns table(profile_id uuid, full_name text, email text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'administrator'
  ) then
    raise insufficient_privilege using message = 'Administrator role required';
  end if;

  return query
  select p.id, p.full_name, u.email::text, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'pending'
    and u.email_confirmed_at is not null
  order by p.created_at asc
  limit 200;
end;
$$;

create function public.assign_school_role(target_profile_id uuid, next_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected integer;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'administrator'
  ) then
    raise insufficient_privilege using message = 'Administrator role required';
  end if;

  if next_role not in ('principal', 'teacher', 'student', 'parent') then
    raise check_violation using message = 'Role is not assignable';
  end if;

  update public.profiles p
  set role = next_role
  where p.id = target_profile_id
    and p.role = 'pending'
    and exists (
      select 1 from auth.users u
      where u.id = p.id and u.email_confirmed_at is not null
    );
  get diagnostics affected = row_count;

  if affected <> 1 then
    raise no_data_found using message = 'Account is missing, unverified, or already assigned';
  end if;

  insert into public.profile_role_changes (profile_id, changed_by, old_role, new_role)
  values (target_profile_id, (select auth.uid()), 'pending', next_role);
end;
$$;

revoke all on function public.list_pending_school_accounts() from public, anon, authenticated;
revoke all on function public.assign_school_role(uuid, text) from public, anon, authenticated;
grant execute on function public.list_pending_school_accounts() to authenticated;
grant execute on function public.assign_school_role(uuid, text) to authenticated;

commit;
