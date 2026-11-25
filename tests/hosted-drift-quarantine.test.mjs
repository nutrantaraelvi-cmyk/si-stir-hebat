import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const QUARANTINE = readFileSync('supabase/migrations/20261121085900_quarantine_hosted_config_drift.sql', 'utf8');
const CONFIG = readFileSync('supabase/migrations/20261121090000_school_configuration.sql', 'utf8');
const ADMIN = '00000000-0000-0000-0000-0000000000a1';

async function baseDb() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
    create table public.profiles (id uuid primary key, role text not null);
    grant usage on schema public to anon, authenticated;
    grant select on public.profiles to authenticated;
    insert into public.profiles values ('${ADMIN}', 'administrator');
  `);
  return db;
}

// Bentuk hosted menurut inventaris metadata 22 November 2026 (disederhanakan).
const HOSTED_DRIFT = `
  create table public.retention_policies (
    category text primary key check (category in ('assessment','learning','communication','habits','teacher_documents','audit')),
    retention_years integer check (retention_years >= 1),
    action text not null check (action in ('delete','archive','anonymize')),
    created_by uuid, created_at timestamptz default now()
  );
  insert into public.retention_policies values ('assessment', null, 'anonymize', null, now());
  alter table public.retention_policies enable row level security;
  grant select on public.retention_policies to authenticated;
  create policy retention_read on public.retention_policies for select to authenticated using (true);
  create table public.deletion_requests (
    id uuid primary key default gen_random_uuid(),
    subject_type text not null check (subject_type in ('student','teacher','guardian','other')),
    reason text not null check (char_length(reason) between 5 and 500)
  );
  insert into public.deletion_requests(subject_type, reason) values ('guardian', 'Data Contoh alasan');
  create table public.teacher_document_types (id uuid primary key default gen_random_uuid(), name text not null, is_required boolean not null);
  create unique index teacher_document_types_name_lower_uq on public.teacher_document_types (lower(name));
`;

test('database bersih: karantina tidak memindahkan apa pun dan konfigurasi tetap terpasang', async () => {
  const db = await baseDb();
  await db.exec(QUARANTINE);
  await db.exec(CONFIG);
  const archived = await db.query("select count(*)::int n from pg_tables where schemaname = 'drift_archive'");
  assert.equal(archived.rows[0].n, 0);
  const seeded = await db.query('select count(*)::int n from public.retention_policies');
  assert.equal(seeded.rows[0].n, 7);
});

test('drift hosted dipindah utuh ke drift_archive lalu tabel lokal dibuat ulang', async () => {
  const db = await baseDb();
  await db.exec(HOSTED_DRIFT);
  await db.exec(QUARANTINE);
  await db.exec(CONFIG);

  const kept = await db.query('select category, action from drift_archive.retention_policies');
  assert.deepEqual(kept.rows, [{ category: 'assessment', action: 'anonymize' }]);
  const guardian = await db.query('select subject_type from drift_archive.deletion_requests');
  assert.deepEqual(guardian.rows, [{ subject_type: 'guardian' }]);

  const local = await db.query("select retention_years from public.retention_policies where category = 'supervision_evidence'");
  assert.equal(local.rows[0].retention_years, 1);
  const docTypes = await db.query("select column_name from information_schema.columns where table_schema = 'public' and table_name = 'teacher_document_types' and column_name = 'is_required'");
  assert.equal(docTypes.rows.length, 0, 'tabel public baru mengikuti definisi lokal');

  await db.exec(`set role authenticated; select set_config('test.uid', '${ADMIN}', false);`);
  try {
    await assert.rejects(db.query('select * from drift_archive.retention_policies'), /permission denied/i);
  } finally {
    await db.exec('reset role;');
  }
});

test('karantina dibatalkan bila ada view yang bergantung pada tabel drift', async () => {
  const db = await baseDb();
  await db.exec(HOSTED_DRIFT);
  await db.exec('create view public.retention_overview as select category from public.retention_policies;');
  await assert.rejects(db.exec(QUARANTINE), /dirujuk oleh/);
  await db.exec('rollback;');
  const still = await db.query("select to_regclass('public.retention_policies') is not null as present");
  assert.equal(still.rows[0].present, true, 'rollback mempertahankan tabel di public');
});
