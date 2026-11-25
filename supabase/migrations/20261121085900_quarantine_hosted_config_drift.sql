-- Karantina drift skema hosted sebelum 20261121090000_school_configuration.
--
-- Konteks: project hosted sudah memiliki enam tabel konfigurasi dengan kolom,
-- CHECK, policy, dan fungsi yang berbeda dari migration lokal (lihat
-- docs/HOSTED_MIGRATION_RECONCILIATION_2026-11-22.md). Menjalankan migration
-- konfigurasi apa adanya akan gagal karena tabel sudah ada, sedangkan mengubah
-- tabel hosted di tempat akan mengubah semantik retensi/penghapusan tanpa
-- keputusan pemilik.
--
-- Langkah ini forward-only dan tidak menghapus data:
-- * Pada database bersih (lokal/CI/staging baru) tidak ada tabel tersebut, jadi
--   migration ini tidak melakukan apa pun selain membuat schema kosong.
-- * Pada hosted, setiap tabel drift dipindahkan utuh (baris, index, constraint,
--   policy, trigger) ke schema `drift_archive` yang tidak diekspos Data API dan
--   dicabut aksesnya dari anon/authenticated. Migration berikutnya lalu membuat
--   tabel sesuai definisi lokal. Pemindahan baris lama ke tabel baru dilakukan
--   operator setelah pemilik memutuskan pemetaan kategori (prosedur di
--   docs/RUNBOOK_STAGING_DAN_MIGRASI.md).
-- * Migration berhenti (rollback penuh) bila ada view atau foreign key dari luar
--   tabel tersebut yang bergantung padanya, karena objek itu akan diam-diam
--   menunjuk ke tabel karantina.
begin;

create schema if not exists drift_archive;
revoke all on schema drift_archive from public, anon, authenticated;
comment on schema drift_archive is
  'Tabel drift hosted yang dikarantina; tidak diekspos Data API. Lihat docs/RUNBOOK_STAGING_DAN_MIGRASI.md.';

do $$
declare
  target text;
  rel regclass;
  dependents text;
begin
  foreach target in array array[
    'grading_settings', 'retention_policies', 'teacher_attendance_status_types',
    'teacher_document_types', 'school_calendar_events', 'deletion_requests'
  ] loop
    rel := to_regclass(format('public.%I', target));
    continue when rel is null;

    if to_regclass(format('drift_archive.%I', target)) is not null then
      raise exception 'drift_archive.% sudah ada; periksa manual sebelum melanjutkan', target
        using errcode = '55000';
    end if;

    select string_agg(distinct dependent::text, ', ') into dependents
    from (
      select r.ev_class::regclass as dependent
      from pg_depend d
      join pg_rewrite r on r.oid = d.objid
      where d.refobjid = rel and d.classid = 'pg_rewrite'::regclass and r.ev_class <> rel
      union
      select c.conrelid::regclass
      from pg_constraint c
      where c.contype = 'f' and c.confrelid = rel and c.conrelid <> rel
    ) found;
    if dependents is not null then
      raise exception 'Tabel public.% dirujuk oleh %; karantina dibatalkan', target, dependents
        using errcode = '55000';
    end if;

    execute format('alter table public.%I set schema drift_archive', target);
    execute format('revoke all on drift_archive.%I from public, anon, authenticated', target);
    execute format('comment on table drift_archive.%I is %L', target,
      'Dikarantina oleh 20261121085900: bentuk hosted berbeda dari migration lokal. Jangan dipakai aplikasi.');
    raise notice 'public.% dipindahkan ke drift_archive', target;
  end loop;
end;
$$;

commit;
