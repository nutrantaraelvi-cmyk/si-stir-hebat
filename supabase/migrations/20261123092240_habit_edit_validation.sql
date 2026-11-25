begin;

-- RLS scopes rows. The trigger separates the guardian and teacher fields on each row.
create or replace function school_private.guard_habits() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.record_date > (now() at time zone 'Asia/Jakarta')::date then
    raise exception 'Future observation not allowed' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    if new.revision <> old.revision + 1 then
      raise exception 'Revision changed' using errcode = '40001';
    end if;

    if school_private.can_write_habits(old.student_id) then
      if (new.validation_status, new.validation_note) is distinct from
         (old.validation_status, old.validation_note) then
        raise insufficient_privilege using message = 'Habit validation requires an assigned teacher';
      end if;
      if (new.habits, new.notes) is distinct from (old.habits, old.notes) then
        new.validation_status := 'pending';
        new.validation_note := '';
        new.validated_by := null;
        new.validated_at := null;
      end if;
    else
      if not school_private.can_validate_habits(old.student_id)
         or (new.habits, new.notes) is distinct from (old.habits, old.notes) then
        raise insufficient_privilege using message = 'Only the linked guardian may edit the observation';
      end if;
      if new.validation_status = 'validated' then
        if btrim(new.validation_note) = '' then
          raise check_violation using message = 'A review note is required';
        end if;
        new.validated_by := (select auth.uid());
        new.validated_at := now();
      else
        new.validation_note := '';
        new.validated_by := null;
        new.validated_at := null;
      end if;
    end if;
  end if;

  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

commit;
