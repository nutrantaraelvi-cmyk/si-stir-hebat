import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { replayMigrations } from '../scripts/lib/replay-migrations.mjs'

const ids = {
  administrator: '20000000-0000-4000-8000-000000000001',
  principal: '20000000-0000-4000-8000-000000000002',
  teacher: '20000000-0000-4000-8000-000000000003',
  student: '20000000-0000-4000-8000-000000000004',
  parent: '20000000-0000-4000-8000-000000000005',
  pending: '20000000-0000-4000-8000-000000000006',
}
let db

async function as(role) {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [ids[role] ?? ''])
  await db.exec(role === 'anon' ? 'set role anon' : 'set role authenticated')
}
const denied = { code: '42501' }

before(async () => {
  db = await replayMigrations()
  // Stub minimal tabel sesi Supabase Auth.
  await db.exec('create table auth.sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null)')
  for (const [role, id] of Object.entries(ids)) {
    await db.query('insert into auth.users (id) values ($1)', [id])
    await db.query('update public.profiles set role = $1 where id = $2', [role, id])
  }
  await db.query('insert into auth.sessions (user_id) values ($1), ($1), ($2)', [ids.teacher, ids.parent])
})
after(() => db?.close())

test('setiap akun mencatat login/logout miliknya sendiri; jenis lain ditolak', async () => {
  await as('teacher')
  await db.query("select public.record_auth_event('login')")
  await db.query("select public.record_auth_event('logout_all')")
  await assert.rejects(db.query("select public.record_auth_event('sessions_revoked')"), { code: '22023' })
  await assert.rejects(db.query('insert into public.security_audit_events (actor_id, action) values ($1, $2)', [ids.teacher, 'login']), denied)
  await as('anon')
  await assert.rejects(db.query("select public.record_auth_event('login')"), denied)
  await db.exec('reset role')
  const { rows } = await db.query('select actor_id, action from public.security_audit_events order by id')
  assert.deepEqual(rows, [
    { actor_id: ids.teacher, action: 'login' },
    { actor_id: ids.teacher, action: 'logout_all' },
  ])
})

test('hanya administrator mencabut sesi akun lain dan tindakan itu tercatat', async () => {
  for (const role of ['principal', 'teacher', 'parent', 'pending']) {
    await as(role)
    await assert.rejects(db.query('select public.admin_revoke_sessions($1)', [ids.teacher]), denied, role)
  }
  await as('administrator')
  await assert.rejects(db.query('select public.admin_revoke_sessions($1)', ['20000000-0000-4000-8000-0000000000ff']), { code: '22023' })
  const { rows: [result] } = await db.query('select public.admin_revoke_sessions($1) as revoked', [ids.teacher])
  assert.equal(result.revoked, 2)
  await db.exec('reset role')
  const sessions = await db.query('select user_id from auth.sessions')
  assert.deepEqual(sessions.rows, [{ user_id: ids.parent }], 'sesi akun lain tidak tersentuh')
  const { rows: [event] } = await db.query("select actor_id, target_profile_id from public.security_audit_events where action = 'sessions_revoked'")
  assert.deepEqual(event, { actor_id: ids.administrator, target_profile_id: ids.teacher })
})

test('audit_log hanya terbaca administrator dan kepala sekolah', async () => {
  for (const role of ['administrator', 'principal']) {
    await as(role)
    const { rows } = await db.query("select module, action from public.audit_log where module = 'keamanan' order by occurred_at, action")
    assert.ok(rows.length >= 3, `${role} melihat kejadian keamanan`)
  }
  await db.exec('reset role')
  await db.query("insert into public.profile_role_changes (profile_id, changed_by, old_role, new_role) values ($1, $2, 'pending', 'teacher')", [ids.teacher, ids.administrator])
  await as('administrator')
  const roles =await db.query("select count(*)::int n from public.audit_log where module = 'peran'")
  assert.ok(roles.rows[0].n >= 1, 'perubahan peran ikut tergabung')
  for (const role of ['teacher', 'student', 'parent', 'pending']) {
    await as(role)
    assert.equal((await db.query('select * from public.audit_log')).rows.length, 0, role)
    assert.equal((await db.query('select * from public.security_audit_events')).rows.length, 0, role)
  }
  await as('anon')
  await assert.rejects(db.query('select * from public.audit_log'), denied)
  await db.exec('reset role')
})

test('nama pelaku audit hanya untuk administrator/kepala sekolah', async () => {
  await db.exec('reset role')
  await db.query("update public.profiles set full_name = 'Data Contoh Guru' where id = $1", [ids.teacher])
  await as('principal')
  const { rows } = await db.query('select id, full_name from public.audit_actor_names($1::uuid[])', [[ids.teacher]])
  assert.deepEqual(rows, [{ id: ids.teacher, full_name: 'Data Contoh Guru' }])
  await as('teacher')
  await assert.rejects(db.query('select * from public.audit_actor_names($1::uuid[])', [[ids.teacher]]), denied)
  await db.exec('reset role')
})
