-- PRD 6.3 (manajemen sesi) dan 6.4 (audit log).
-- * security_audit_events: login, logout, logout semua perangkat, dan pencabutan
--   sesi oleh administrator. Tidak menyimpan IP, user agent, atau isi data.
-- * record_auth_event(): dicatat oleh akun itu sendiri setelah login/logout.
--   Ini catatan dari klien (bukan bukti forensik); log Auth Supabase tetap acuan
--   untuk investigasi.
-- * admin_revoke_sessions(): administrator mencabut semua sesi/refresh token akun
--   lain. Token akses yang sudah terbit tetap berlaku sampai kedaluwarsa (default
--   1 jam). Verifikasi hak DML role pemilik fungsi atas auth.sessions di staging.
-- * audit_log: view gabungan event modul yang sudah ada, hanya untuk
--   administrator dan kepala sekolah. security_invoker memastikan RLS tiap tabel
--   sumber tetap berlaku; kolom isi (nilai, alasan, catatan) sengaja tidak dibawa.
begin;

create table public.security_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in ('login', 'logout', 'logout_all', 'sessions_revoked')),
  target_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((action = 'sessions_revoked') = (target_profile_id is not null))
);
create index security_audit_events_created_idx on public.security_audit_events (created_at desc, id desc);
create index security_audit_events_actor_id_fk_idx on public.security_audit_events (actor_id);
create index security_audit_events_target_profile_id_fk_idx on public.security_audit_events (target_profile_id);

alter table public.security_audit_events enable row level security;
revoke all on public.security_audit_events from public, anon, authenticated;
grant select on public.security_audit_events to authenticated;
create policy security_audit_events_oversight_read on public.security_audit_events for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('administrator', 'principal')));

create function public.record_auth_event(event text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not exists (select 1 from public.profiles p where p.id = (select auth.uid())) then
    raise exception 'Sesi tidak valid' using errcode = '42501';
  end if;
  if event is null or event not in ('login', 'logout', 'logout_all') then
    raise exception 'Jenis kejadian tidak valid' using errcode = '22023';
  end if;
  insert into public.security_audit_events (actor_id, action) values ((select auth.uid()), event);
end;
$$;

create function public.admin_revoke_sessions(target uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  revoked integer;
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'administrator') then
    raise exception 'Hanya administrator dapat mencabut sesi' using errcode = '42501';
  end if;
  if target is null or not exists (select 1 from public.profiles p where p.id = target) then
    raise exception 'Akun tidak ditemukan' using errcode = '22023';
  end if;
  delete from auth.sessions s where s.user_id = target;
  get diagnostics revoked = row_count;
  insert into public.security_audit_events (actor_id, action, target_profile_id)
  values ((select auth.uid()), 'sessions_revoked', target);
  return revoked;
end;
$$;

-- Nama pelaku untuk tampilan audit; dibatasi 100 ID per panggilan.
create function public.audit_actor_names(actor_ids uuid[])
returns table (id uuid, full_name text) language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('administrator', 'principal')) then
    raise exception 'Hanya administrator atau kepala sekolah' using errcode = '42501';
  end if;
  if cardinality(actor_ids) > 100 then
    raise exception 'Terlalu banyak ID' using errcode = '22023';
  end if;
  return query select p.id, p.full_name from public.profiles p where p.id = any(actor_ids);
end;
$$;

revoke all on function public.record_auth_event(text), public.admin_revoke_sessions(uuid), public.audit_actor_names(uuid[]) from public, anon, authenticated;
grant execute on function public.record_auth_event(text), public.admin_revoke_sessions(uuid), public.audit_actor_names(uuid[]) to authenticated;

create view public.audit_log with (security_invoker = on) as
select * from (
  select 'keamanan'::text as module, e.action as action, e.target_profile_id as record_id, e.actor_id, e.created_at as occurred_at
    from public.security_audit_events e
  union all
  select 'peran', r.old_role || ' → ' || r.new_role, r.profile_id, r.changed_by, r.changed_at from public.profile_role_changes r
  union all
  select 'tautan_akun', case when a.active then 'ditautkan' else 'dilepas' end, a.registry_id, a.actor_id, a.created_at
    from public.account_relationship_events a
  union all
  select 'supervisi', 'tahap ' || s.stage || case when s.published then ' (terbit)' else '' end, s.supervision_id, s.actor_id, s.created_at
    from public.academic_supervision_events s
  union all
  select 'nilai', 'revisi ' || n.revision, n.result_id, n.actor_id, n.created_at from public.assessment_result_events n
  union all
  select 'absensi', coalesce(c.old_status, 'kosong') || ' → ' || c.new_status, c.record_id, c.actor_id, c.created_at
    from public.attendance_changes c
  union all
  select 'kebiasaan', 'perubahan catatan', h.record_id, h.actor_id, h.created_at from public.habit_events h
  union all
  select 'jadwal', 'perubahan jadwal', l.schedule_id, l.actor_id, l.created_at from public.lesson_schedule_events l
  union all
  select 'dokumen', d.event_type, d.document_id, d.actor_profile_id, d.created_at from public.school_document_events d
  union all
  select 'umpan_balik', f.status, f.feedback_id, f.actor_id, f.created_at from public.task_feedback_events f
  union all
  select 'absensi_guru', t.event_type, t.attendance_id, t.actor_profile_id, t.created_at from public.teacher_attendance_events t
  union all
  select 'modul_ajar', m.status, m.module_id, m.actor_id, m.created_at from public.teaching_module_events m
) events
where exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('administrator', 'principal'));

revoke all on public.audit_log from public, anon, authenticated;
grant select on public.audit_log to authenticated;
comment on view public.audit_log is
  'Audit gabungan untuk administrator/kepala sekolah. RLS tabel sumber tetap berlaku (security_invoker).';

commit;
