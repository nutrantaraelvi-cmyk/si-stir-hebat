begin;

alter table public.habit_records
  add column validation_status text not null default 'pending'
    check (validation_status in ('pending','validated')),
  add column validated_by uuid references public.profiles(id),
  add column validated_at timestamptz,
  add column validation_note text not null default ''
    check (char_length(validation_note) <= 1000);

create or replace function school_private.can_read_habits(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.students s join public.profiles p on p.id=(select auth.uid())
    where s.id=target and s.is_active and (
      p.role in ('administrator','principal')
      or (p.role='student' and s.profile_id=p.id)
      or (p.role='parent' and exists(select 1 from public.parent_student_relationships r where r.student_id=s.id and r.parent_profile_id=p.id))
      or (p.role='teacher' and exists(select 1 from public.class_enrollments e
        join public.teacher_assignments a on a.class_id=e.class_id
        where e.student_id=s.id and e.is_active and school_private.can_write_journal(a.id)))
    ));
$$;

create or replace function school_private.can_write_habits(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.profiles p join public.parent_student_relationships r on r.parent_profile_id=p.id
    join public.students s on s.id=r.student_id and s.is_active
    where p.id=(select auth.uid()) and p.role='parent' and s.id=target);
$$;

create or replace function school_private.can_validate_habits(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.students s join public.profiles p on p.id=(select auth.uid())
    where s.id=target and s.is_active and p.role='teacher' and exists(select 1 from public.class_enrollments e
      join public.teacher_assignments a on a.class_id=e.class_id
      join public.teachers t on t.id=a.teacher_id
      where e.student_id=s.id and e.is_active and a.is_active and t.profile_id=p.id and t.is_active));
$$;

drop policy habits_read on public.habit_records;
create policy habits_read on public.habit_records for select to authenticated
  using(school_private.can_read_habits(student_id));
drop policy habits_update on public.habit_records;
create policy habits_update on public.habit_records for update to authenticated
  using(school_private.can_write_habits(student_id)) with check(school_private.can_write_habits(student_id));
create policy habits_validate on public.habit_records for update to authenticated
  using(school_private.can_validate_habits(student_id)) with check(school_private.can_validate_habits(student_id));

grant update(validation_status,validation_note,revision) on public.habit_records to authenticated;

create or replace function school_private.guard_habits() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if new.record_date > (now() at time zone 'Asia/Jakarta')::date then
    raise exception 'Future observation not allowed' using errcode='23514';
  end if;
  if tg_op='UPDATE' and new.revision<>old.revision+1 then
    raise exception 'Revision changed' using errcode='40001';
  end if;
  if tg_op='UPDATE' and (new.validation_status is distinct from old.validation_status or new.validation_note is distinct from old.validation_note)
     and not school_private.can_validate_habits(old.student_id) then
    raise exception 'Habit validation requires an assigned teacher' using errcode='42501';
  end if;
  if tg_op='UPDATE' and new.validation_status='validated' then
    new.validated_by=(select auth.uid()); new.validated_at=now();
  end if;
  new.updated_by=(select auth.uid()); new.updated_at=now();
  return new;
end; $$;

revoke all on function school_private.can_read_habits(uuid),school_private.can_write_habits(uuid),school_private.can_validate_habits(uuid) from public,anon,authenticated;
grant execute on function school_private.can_read_habits(uuid),school_private.can_write_habits(uuid),school_private.can_validate_habits(uuid) to authenticated;

commit;
