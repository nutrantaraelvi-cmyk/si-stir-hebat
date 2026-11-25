import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { replayMigrations, UNINDEXED_FK_SQL } from '../scripts/lib/replay-migrations.mjs'

// Penjaga skema setelah seluruh migration diputar ulang. Gagal bila migration baru
// menambah FK tanpa index atau fungsi SECURITY DEFINER tanpa search_path tetap.
let db
before(async () => { db = await replayMigrations() })
after(() => db?.close())

test('setiap foreign key di schema public punya index penutup', async () => {
  const { rows } = await db.query(UNINDEXED_FK_SQL)
  assert.deepEqual(rows, [], 'tambahkan index untuk FK di atas pada migration yang sama')
})

test('fungsi SECURITY DEFINER di public dan school_private menetapkan search_path', async () => {
  const { rows } = await db.query(`
    select p.oid::regprocedure::text as fn
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where p.prosecdef and n.nspname in ('public', 'school_private')
      and p.proname <> 'rls_auto_enable' -- stub harness pengganti fungsi bawaan Supabase
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
    order by 1`)
  assert.deepEqual(rows, [])
})

test('schema karantina drift tidak dapat diakses peran API', async () => {
  const { rows: [usage] } = await db.query(`select
    has_schema_privilege('anon', 'drift_archive', 'usage') as anon,
    has_schema_privilege('authenticated', 'drift_archive', 'usage') as authenticated`)
  assert.deepEqual(usage, { anon: false, authenticated: false })
})
