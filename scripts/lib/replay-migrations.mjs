// Memutar ulang semua migration lokal ke PGlite dengan stub minimal Supabase
// (auth, storage). Dipakai tes dan skrip audit skema; bukan pengganti Supabase lokal.
import { readdir, readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

export const SUPABASE_STUB_SQL = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create schema storage;
  create table storage.buckets (
    id text primary key, name text not null, public boolean not null,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (bucket_id text not null, name text not null, primary key (bucket_id, name));
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant select, insert, delete on storage.objects to anon, authenticated;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb not null default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
  $$;
  create function public.rls_auto_enable() returns event_trigger
    language plpgsql security definer as $$ begin return; end; $$;
  grant usage on schema auth, public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`

export async function replayMigrations() {
  const db = new PGlite()
  await db.exec(SUPABASE_STUB_SQL)
  const dir = new URL('../../supabase/migrations/', import.meta.url)
  for (const name of (await readdir(dir)).filter(file => file.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(name, dir), 'utf8'))
  }
  return db
}

// Foreign key yang kolom-kolomnya bukan awalan (prefix) dari index mana pun.
export const UNINDEXED_FK_SQL = `
  select c.conrelid::regclass::text as table_name, c.conname,
         array_to_string(array(select a.attname from unnest(c.conkey) with ordinality k(attnum, ord)
           join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum order by k.ord), ',') as columns
  from pg_constraint c
  join pg_namespace n on n.oid = c.connamespace
  where c.contype = 'f' and n.nspname = 'public'
    and not exists (
      select 1 from pg_index i
      where i.indrelid = c.conrelid
        and (i.indkey::int2[])[0:cardinality(c.conkey) - 1] @> c.conkey
        and (i.indkey::int2[])[0:cardinality(c.conkey) - 1] <@ c.conkey
    )
  order by 1, 2`
