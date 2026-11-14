import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

// Isolated PostgreSQL with a minimal Supabase Auth contract. No hosted connection.
test('migrations and database permissions', async t => {
  const db = new PGlite()
  t.after(() => db.close())
  await db.exec(`
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
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    create function public.rls_auto_enable() returns event_trigger
      language plpgsql security definer as $$ begin return; end; $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  `)
  const migrationDir = new URL('../supabase/migrations/', import.meta.url)
  for (const name of (await readdir(migrationDir)).filter(name => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(name, migrationDir), 'utf8'))
  }
  await t.test('existing and new users receive pending profiles', async () => {
    const { rows } = await db.query("select role from public.profiles where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'")
    assert.equal(rows[0].role, 'pending')
    await db.exec(await readFile(new URL('../supabase/tests/profiles.sql', import.meta.url), 'utf8'))
  })
  await t.test('managed event-trigger function is not executable by client roles', async () => {
    for (const role of ['anon', 'authenticated']) {
      const { rows } = await db.query("select has_function_privilege($1, 'public.rls_auto_enable()', 'EXECUTE') as allowed", [role])
      assert.equal(rows[0].allowed, false)
    }
  })

  const ids = {
    administrator: '10000000-0000-4000-8000-000000000001',
    principal: '10000000-0000-4000-8000-000000000002',
    teacher: '10000000-0000-4000-8000-000000000003',
    student: '10000000-0000-4000-8000-000000000004',
    parent: '10000000-0000-4000-8000-000000000005',
    pending: '10000000-0000-4000-8000-000000000006',
  }
  for (const [role, id] of Object.entries(ids)) {
    await db.query('insert into auth.users (id) values ($1)', [id])
    await db.query('update public.profiles set role = $1 where id = $2', [role, id])
  }
  async function as(role) {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [ids[role] ?? ''])
    await db.exec(role === 'anon' ? 'set role anon' : 'set role authenticated')
  }
  const permissionDenied = { code: '42501' }
  await t.test('account relationships enforce role and audit only committed changes', async () => {
    await as('administrator')
    const { rows: [student] } = await db.query(
      "insert into public.students (code, name) values ('LINK_TEST', 'Data Contoh') returning id",
    )
    const link = async (kind, profile, active) => {
      const { rows } = await db.query(
        'select public.set_account_relationship($1, $2, $3, $4, $5) as changed',
        [kind, student.id, profile, active, 'Verifikasi data contoh'],
      )
      return rows[0].changed
    }
    await assert.rejects(link('student', ids.parent, true), { code: '23514' })
    assert.equal(await link('student', ids.student, true), true)
    assert.equal(await link('student', ids.student, true), false)
    assert.equal(await link('parent', ids.parent, true), true)
    assert.equal(await link('parent', ids.parent, true), false)
    assert.equal((await db.query('select * from public.parent_student_relationships')).rows.length, 1)
    await assert.rejects(db.query('delete from public.parent_student_relationships'), permissionDenied)
    await as('parent')
    assert.equal((await db.query('select * from public.parent_student_relationships')).rows.length, 0)
    await assert.rejects(link('parent', ids.parent, false), permissionDenied)
    await as('principal')
    await assert.rejects(link('student', ids.student, false), permissionDenied)
    await as('anon')
    await assert.rejects(link('parent', ids.parent, false), permissionDenied)
    await as('administrator')
    assert.equal(await link('parent', ids.parent, false), true)
    assert.equal(await link('student', ids.student, false), true)
    assert.equal((await db.query('select * from public.account_relationship_events')).rows.length, 4)
    await db.exec('reset role')
    await db.query('delete from public.students where id = $1', [student.id])
  })
  await t.test('administrator creates a draft, published item, and archive', async () => {
    await as('administrator')
    for (const status of ['draft', 'published', 'archived']) {
      await db.query('insert into public.announcements (title, body, status) values ($1, $2, $3)', [`Pengumuman ${status}`, 'Isi pengumuman', status])
    }
    const { rows } = await db.query('select * from public.announcements')
    assert.equal(rows.length, 3)
  })
  for (const role of ['teacher', 'student', 'parent']) {
    await t.test(`${role} reads published announcements and cannot write`, async () => {
      await as(role)
      const { rows } = await db.query('select status from public.announcements')
      assert.deepEqual(rows, [{ status: 'published' }])
      await assert.rejects(db.query("insert into public.announcements (title, body) values ('Judul', 'Isi')"), permissionDenied)
      const result = await db.query("update public.announcements set title = 'Dilarang' returning id")
      assert.equal(result.rows.length, 0)
      await assert.rejects(db.query('delete from public.announcements'), permissionDenied)
    })
  }
  await t.test('pending users see no announcements', async () => {
    await as('pending')
    assert.equal((await db.query('select * from public.announcements')).rows.length, 0)
    await assert.rejects(db.query("insert into public.announcements (title, body) values ('Judul', 'Isi')"), permissionDenied)
  })
  await t.test('anonymous users have no table access', async () => {
    await as('anon')
    await assert.rejects(db.query('select * from public.announcements'), permissionDenied)
  })
  await t.test('principal can edit and archive announcements without changing authorship', async () => {
    await as('principal')
    assert.equal((await db.query('select * from public.announcements')).rows.length, 3)
    const { rows } = await db.query("update public.announcements set title = 'Diperbarui', status = 'archived' where status = 'published' returning title, status")
    assert.deepEqual(rows, [{ title: 'Diperbarui', status: 'archived' }])
    await assert.rejects(db.query('update public.announcements set created_by = $1', [ids.principal]), permissionDenied)
    await assert.rejects(db.query('insert into public.announcements (title, body, created_by) values ($1, $2, $3)', ['Judul', 'Isi', ids.administrator]), permissionDenied)
    await assert.rejects(db.query('delete from public.announcements'), permissionDenied)
  })
  await t.test('database rejects blank content and invalid statuses', async () => {
    await as('administrator')
    await assert.rejects(db.query("insert into public.announcements (title, body) values (' ', 'Isi')"), { code: '23514' })
    await assert.rejects(db.query('insert into public.announcements (title, body) values ($1, $2)', ['Judul', '\n\t']), { code: '23514' })
    await assert.rejects(db.query("insert into public.announcements (title, body, status) values ('Judul', 'Isi', 'invalid')"), { code: '23514' })
  })
  let yearId
  await t.test('administrator creates non-personal master data with enforced constraints', async () => {
    await as('administrator')
    await db.query("insert into public.school_settings (name, npsn) values ('Data Contoh Sekolah', '12345678')")
    yearId = (await db.query("insert into public.academic_years (name, starts_on, ends_on, is_active) values ('Data Contoh 2026/2027', '2026-07-01', '2027-06-30', true) returning id")).rows[0].id
    await db.query("insert into public.semesters (academic_year_id, number, starts_on, ends_on, is_active) values ($1, 1, '2026-07-01', '2026-12-31', true)", [yearId])
    await db.query("insert into public.subjects (code, name) values ('TEST', 'Data Contoh Mata Pelajaran')")
    await db.query("insert into public.school_classes (academic_year_id, name, grade, capacity) values ($1, 'Data Contoh Kelas', 1, 30)", [yearId])
    await assert.rejects(db.query("insert into public.school_settings (name) values ('Sekolah Kedua')"), { code: '23505' })
    await assert.rejects(db.query("insert into public.academic_years (name, starts_on, ends_on, is_active) values ('Tahun lain', '2027-07-01', '2028-06-30', true)"), { code: '23505' })
    await assert.rejects(db.query("insert into public.semesters (academic_year_id, number, starts_on, ends_on) values ($1, 2, '2027-01-01', '2027-07-31')", [yearId]), { code: '23514' })
    await assert.rejects(db.query("update public.academic_years set starts_on = '2026-08-01' where id = $1", [yearId]), { code: '23514' })
    await assert.rejects(db.query("insert into public.school_classes (academic_year_id, name, grade, capacity) values ($1, 'Kelas Salah', 7, 30)", [yearId]), { code: '23514' })
    await assert.rejects(db.query("insert into public.subjects (code, name) values ('lowercase', 'Data Contoh')"), { code: '23514' })
    await assert.rejects(db.query("update public.subjects set id = gen_random_uuid()"), permissionDenied)
  })
  const masterTables = ['school_settings', 'academic_years', 'semesters', 'subjects', 'school_classes']
  for (const role of ['principal', 'teacher', 'student', 'parent']) {
    await t.test(`${role} reads master data but cannot change it`, async () => {
      await as(role)
      for (const table of masterTables) assert.equal((await db.query(`select * from public.${table}`)).rows.length, 1)
      await assert.rejects(db.query("insert into public.subjects (code, name) values ('DENIED', 'Dilarang')"), permissionDenied)
      assert.equal((await db.query("update public.subjects set name = 'Dilarang' returning id")).rows.length, 0)
      for (const table of masterTables) await assert.rejects(db.query(`delete from public.${table}`), permissionDenied)
    })
  }
  await t.test('pending and anonymous users cannot read master data', async () => {
    await as('pending')
    for (const table of masterTables) assert.equal((await db.query(`select * from public.${table}`)).rows.length, 0)
    await assert.rejects(db.query("insert into public.subjects (code, name) values ('DENIED', 'Dilarang')"), permissionDenied)
    await as('anon')
    for (const table of masterTables) await assert.rejects(db.query(`select * from public.${table}`), permissionDenied)
  })
  await t.test('only one active semester per year is allowed', async () => {
    await as('administrator')
    await assert.rejects(db.query("insert into public.semesters (academic_year_id, number, starts_on, ends_on, is_active) values ($1, 2, '2027-01-01', '2027-06-30', true)", [yearId]), { code: '23505' })
    await db.query("update public.semesters set is_active = false where academic_year_id = $1", [yearId])
    await db.query("insert into public.semesters (academic_year_id, number, starts_on, ends_on, is_active) values ($1, 2, '2027-01-01', '2027-06-30', true)", [yearId])
  })
  await t.test('administrator creates teacher/student records without granting account-link privileges', async () => {
    await as('administrator')
    for (const table of ['teachers', 'students']) {
      await db.query(`insert into public.${table} (code,name,is_active) values ('TEST_1','Data Contoh Satu',true),('TEST_2','Data Contoh Dua',true)`)
      await assert.rejects(db.query(`insert into public.${table} (code,name,profile_id) values ('SPOOF','Dilarang',$1)`, [ids.teacher]), permissionDenied)
      await assert.rejects(db.query(`update public.${table} set profile_id = $1 where code = 'TEST_1'`, [ids.teacher]), permissionDenied)
      await assert.rejects(db.query(`update public.${table} set created_by = $1`, [ids.principal]), permissionDenied)
      await assert.rejects(db.query(`delete from public.${table}`), permissionDenied)
      await assert.rejects(db.query(`insert into public.${table} (code,name) values ('TEST_1','Duplikat')`), { code: '23505' })
      await assert.rejects(db.query(`insert into public.${table} (code,name) values ('lower case','Data Contoh')`), { code: '23514' })
      await assert.rejects(db.query(`insert into public.${table} (code,name) values ('BLANK','  ')`), { code: '23514' })
    }
    // Only the fixture database owner links synthetic accounts. The web client
    // cannot perform these updates or change any Auth role.
    await db.exec('reset role')
    await db.query("update public.teachers set profile_id = $1 where code = 'TEST_1'", [ids.teacher])
    await db.query("update public.students set profile_id = $1 where code = 'TEST_1'", [ids.student])
  })
  await t.test('principal reads people without editing them', async () => {
    await as('principal')
    for (const table of ['teachers','students']) {
      assert.equal((await db.query(`select * from public.${table}`)).rows.length, 2)
      assert.equal((await db.query(`update public.${table} set name = 'Dilarang' returning id`)).rows.length, 0)
      await assert.rejects(db.query(`insert into public.${table} (code,name) values ('DENIED','Dilarang')`), permissionDenied)
    }
  })
  for (const [role, ownTable, otherTable] of [['teacher','teachers','students'],['student','students','teachers']]) {
    await t.test(`${role} only reads the linked record, not another person or registry`, async () => {
      await as(role)
      const { rows } = await db.query(`select code from public.${ownTable}`)
      assert.deepEqual(rows, [{ code: 'TEST_1' }])
      assert.equal((await db.query(`select * from public.${otherTable}`)).rows.length, 0)
      assert.equal((await db.query(`select * from public.${ownTable} where code = 'TEST_2'`)).rows.length, 0)
      assert.equal((await db.query(`update public.${ownTable} set name = 'Dilarang' returning id`)).rows.length, 0)
      await assert.rejects(db.query(`insert into public.${ownTable} (code,name) values ('DENIED','Dilarang')`), permissionDenied)
    })
  }
  for (const role of ['parent','pending','anon']) {
    await t.test(`${role} cannot read or add people`, async () => {
      await as(role)
      for (const table of ['teachers','students']) {
        if (role === 'anon') await assert.rejects(db.query(`select * from public.${table}`), permissionDenied)
        else assert.equal((await db.query(`select * from public.${table}`)).rows.length, 0)
        await assert.rejects(db.query(`insert into public.${table} (code,name) values ('DENIED','Dilarang')`), permissionDenied)
      }
    })
  }
  let classA, classB, studentOne, studentTwo, teacherOne, subject, assignmentB
  await t.test('enrollments enforce capacity, one active class per year and preserve transfer history', async () => {
    await as('administrator')
    classA = (await db.query('select id from public.school_classes limit 1')).rows[0].id
    await db.query('update public.school_classes set capacity=1 where id=$1', [classA])
    classB = (await db.query("insert into public.school_classes (academic_year_id,name,grade,capacity) values ($1,'Data Contoh Kelas B',1,2) returning id", [yearId])).rows[0].id
    studentOne = (await db.query("select id from public.students where code='TEST_1'")).rows[0].id
    studentTwo = (await db.query("select id from public.students where code='TEST_2'")).rows[0].id
    teacherOne = (await db.query("select id from public.teachers where code='TEST_1'")).rows[0].id
    subject = (await db.query("select id from public.subjects where code='TEST'")).rows[0].id
    const enrollment = (await db.query('insert into public.class_enrollments (student_id,class_id) values ($1,$2) returning id,academic_year_id', [studentOne,classA])).rows[0]
    assert.equal(enrollment.academic_year_id, yearId)
    await assert.rejects(db.query('insert into public.class_enrollments (student_id,class_id) values ($1,$2)', [studentTwo,classA]), { code: '23514' })
    await assert.rejects(db.query('insert into public.class_enrollments (student_id,class_id) values ($1,$2)', [studentOne,classB]), { code: '23505' })
    await db.query('update public.class_enrollments set is_active=false where id=$1', [enrollment.id])
    await db.query('insert into public.class_enrollments (student_id,class_id) values ($1,$2)', [studentOne,classB])
    assert.equal((await db.query('select * from public.class_enrollments where student_id=$1', [studentOne])).rows.length, 2)
    await assert.rejects(db.query('update public.class_enrollments set academic_year_id=$1', [yearId]), permissionDenied)
    await assert.rejects(db.query('update public.class_enrollments set class_id=$1', [classA]), permissionDenied)
    await assert.rejects(db.query('update public.class_enrollments set student_id=$1', [studentTwo]), permissionDenied)
    await assert.rejects(db.query('delete from public.class_enrollments'), permissionDenied)
  })
  await t.test('teacher without an assignment to the active class cannot read its pupils', async () => {
    await as('administrator')
    await db.query('insert into public.teacher_assignments (teacher_id,class_id,subject_id) values ($1,$2,$3)', [teacherOne,classA,subject])
    await as('teacher')
    assert.equal((await db.query('select * from public.students')).rows.length, 0)
    assert.equal((await db.query('select * from public.class_enrollments')).rows.length, 0)
    assert.equal((await db.query('select * from public.teacher_assignments')).rows.length, 1)
  })
  await t.test('active assignment grants only active enrolled students and no writes', async () => {
    await as('administrator')
    assignmentB = (await db.query('insert into public.teacher_assignments (teacher_id,class_id,subject_id) values ($1,$2,$3) returning id', [teacherOne,classB,subject])).rows[0].id
    await assert.rejects(db.query('update public.teacher_assignments set class_id=$1', [classA]), permissionDenied)
    await assert.rejects(db.query('insert into public.teacher_assignments (teacher_id,class_id,subject_id) values ($1,$2,$3)', [teacherOne,classB,subject]), { code: '23505' })
    await as('teacher')
    assert.deepEqual((await db.query('select code from public.students')).rows, [{ code: 'TEST_1' }])
    assert.equal((await db.query('select * from public.class_enrollments')).rows.length, 1)
    assert.equal((await db.query('update public.class_enrollments set is_active=false returning id')).rows.length, 0)
    assert.equal((await db.query('update public.teacher_assignments set is_active=false returning id')).rows.length, 0)
    assert.equal((await db.query('update public.students set name=\'Dilarang\' returning id')).rows.length, 0)
    assert.equal((await db.query('select school_private.can_read_assigned_student($1) as allowed', [studentTwo])).rows[0].allowed, false)
  })
  await t.test('student only reads own enrollment history and cannot see teacher assignments', async () => {
    await as('student')
    assert.equal((await db.query('select * from public.class_enrollments')).rows.length, 2)
    assert.equal((await db.query('select * from public.teacher_assignments')).rows.length, 0)
    assert.equal((await db.query('select school_private.can_read_assigned_student($1) as allowed', [studentOne])).rows[0].allowed, false)
  })
  await t.test('principal reads relations without write permission and parents see none', async () => {
    await as('principal')
    assert.equal((await db.query('select * from public.class_enrollments')).rows.length, 2)
    assert.equal((await db.query('select * from public.teacher_assignments')).rows.length, 2)
    assert.equal((await db.query('update public.teacher_assignments set is_active=false returning id')).rows.length, 0)
    for (const role of ['parent','pending']) {
      await as(role)
      for (const table of ['class_enrollments','teacher_assignments']) assert.equal((await db.query(`select * from public.${table}`)).rows.length, 0)
      assert.equal((await db.query('select school_private.can_read_assigned_student($1) as allowed', [studentOne])).rows[0].allowed, false)
    }
    await as('anon')
    await assert.rejects(db.query('select * from public.class_enrollments'), permissionDenied)
    await assert.rejects(db.query('select * from public.teacher_assignments'), permissionDenied)
    await assert.rejects(db.query('select school_private.can_read_assigned_student($1)', [studentOne]), permissionDenied)
  })
  await t.test('deactivating assignment, student or class immediately removes teacher student access', async () => {
    for (const [table,id] of [['teacher_assignments',assignmentB],['students',studentOne],['school_classes',classB]]) {
      await as('administrator')
      await db.query(`update public.${table} set is_active=false where id=$1`, [id])
      await as('teacher')
      assert.equal((await db.query('select * from public.students')).rows.length, 0)
      assert.equal((await db.query('select * from public.class_enrollments')).rows.length, 0)
      await as('administrator')
      await db.query(`update public.${table} set is_active=true where id=$1`, [id])
    }
  })
  await t.test('class capacity cannot be lowered below enrollment and academic-year changes preserve history', async () => {
    await as('administrator')
    await db.query('insert into public.class_enrollments (student_id,class_id) values ($1,$2)', [studentTwo,classB])
    await assert.rejects(db.query('update public.school_classes set capacity=1 where id=$1', [classB]), { code: '23514' })
    const nextYear = (await db.query("insert into public.academic_years (name,starts_on,ends_on) values ('Data Contoh Berikutnya','2027-07-01','2028-06-30') returning id")).rows[0].id
    await assert.rejects(db.query('update public.school_classes set academic_year_id=$1 where id=$2', [nextYear,classB]), { code: '23503' })
    const nextClass = (await db.query("insert into public.school_classes (academic_year_id,name,grade,capacity) values ($1,'Data Contoh Berikutnya',2,30) returning id", [nextYear])).rows[0].id
    await db.query('insert into public.class_enrollments (student_id,class_id) values ($1,$2)', [studentOne,nextClass])
  })
  let attendanceClass, attendanceSession, attendanceAssignment, attendanceRows, today
  await t.test('attendance sessions snapshot today’s active roster without defaulting to present', async () => {
    await as('administrator')
    today = (await db.query("select (now() at time zone 'Asia/Jakarta')::date::text as today")).rows[0].today
    const calendarYear = today.slice(0,4)
    const attendanceYear = (await db.query('insert into public.academic_years (name,starts_on,ends_on) values ($1,$2,$3) returning id', [`Data Contoh Absensi ${today}`,`${calendarYear}-01-01`,`${calendarYear}-12-31`])).rows[0].id
    attendanceClass = (await db.query("insert into public.school_classes (academic_year_id,name,grade,capacity) values ($1,'Data Contoh Absensi',1,30) returning id",[attendanceYear])).rows[0].id
    for (const pupil of [studentOne,studentTwo]) await db.query('insert into public.class_enrollments (student_id,class_id) values ($1,$2)',[pupil,attendanceClass])
    attendanceAssignment = (await db.query('insert into public.teacher_assignments (teacher_id,class_id,subject_id) values ($1,$2,$3) returning id',[teacherOne,attendanceClass,subject])).rows[0].id
    await assert.rejects(db.query('insert into public.attendance_sessions (class_id,held_on) values ($1,$2)',[attendanceClass,today]),permissionDenied)
    await as('teacher')
    attendanceSession = (await db.query('insert into public.attendance_sessions (class_id,held_on) values ($1,$2) returning id',[attendanceClass,today])).rows[0].id
    attendanceRows = (await db.query('select * from public.attendance_records where session_id=$1 order by student_code',[attendanceSession])).rows
    assert.equal(attendanceRows.length,2)
    assert.ok(attendanceRows.every(row=>row.status===null && row.revision===0))
    await assert.rejects(db.query('insert into public.attendance_sessions (class_id,held_on) values ($1,$2)',[attendanceClass,today]),{code:'23505'})
    await assert.rejects(db.query("insert into public.attendance_sessions (class_id,held_on) values ($1,$2::date-1)",[attendanceClass,today]),{code:'23514'})
    await assert.rejects(db.query("insert into public.attendance_sessions (class_id,held_on) values ($1,$2::date+1)",[attendanceClass,today]),{code:'23514'})
    await as('administrator')
    await db.query("update public.students set name='Data Contoh Nama Diubah' where id=$1",[studentOne])
    assert.equal((await db.query('select student_name from public.attendance_records where student_id=$1',[studentOne])).rows[0].student_name,'Data Contoh Satu')
  })
  await t.test('assigned teacher saves an atomic attendance batch and append-only audit', async () => {
    await as('teacher')
    const changes = attendanceRows.map((row,index)=>({id:row.id,status:index===0?'present':'sick',revision:0,reason:''}))
    assert.equal((await db.query('select public.record_attendance($1,$2::jsonb) as saved',[attendanceSession,JSON.stringify(changes)])).rows[0].saved,2)
    assert.equal((await db.query('select * from public.attendance_changes')).rows.length,2)
    await assert.rejects(db.query("update public.attendance_records set status='absent'"),permissionDenied)
    await assert.rejects(db.query('delete from public.attendance_records'),permissionDenied)
    await assert.rejects(db.query('delete from public.attendance_changes'),permissionDenied)
    await assert.rejects(db.query("update public.attendance_changes set reason='Forged'"),permissionDenied)
    await assert.rejects(db.query('insert into public.attendance_changes default values'),permissionDenied)
    await assert.rejects(db.query('insert into public.attendance_records default values'),permissionDenied)
  })
  await t.test('stale revisions and invalid corrections roll back the whole batch', async () => {
    await as('teacher')
    const first={id:attendanceRows[0].id,status:'excused',revision:1,reason:'Data Contoh Koreksi'}
    const stale={id:attendanceRows[1].id,status:'absent',revision:0,reason:'Data Contoh Koreksi'}
    await assert.rejects(db.query('select public.record_attendance($1,$2::jsonb)',[attendanceSession,JSON.stringify([first,stale])]),{code:'40001'})
    assert.equal((await db.query('select status from public.attendance_records where id=$1',[first.id])).rows[0].status,'present')
    assert.equal((await db.query('select count(*)::int as n from public.attendance_changes')).rows[0].n,2)
    for (const changes of [[{...first,reason:''}],[{...first,status:'invalid'}],[{...first,reason:{invalid:true}}],[{...first,revision:'1'}],[first,first],[]]) {
      await assert.rejects(db.query('select public.record_attendance($1,$2::jsonb)',[attendanceSession,JSON.stringify(changes)]),{code:'23514'})
    }
    const forged={...first,id:'99999999-9999-4999-8999-999999999999'}
    await assert.rejects(db.query('select public.record_attendance($1,$2::jsonb)',[attendanceSession,JSON.stringify([forged])]),permissionDenied)
    await db.query('select public.record_attendance($1,$2::jsonb)',[attendanceSession,JSON.stringify([first])])
    const audit=(await db.query('select * from public.attendance_changes where record_id=$1 order by created_at desc limit 1',[first.id])).rows[0]
    assert.equal(audit.old_status,'present'); assert.equal(audit.new_status,'excused'); assert.equal(audit.actor_id,ids.teacher)
  })
  await t.test('student reads only own attendance and no staff correction notes', async () => {
    await as('student')
    assert.equal((await db.query('select * from public.attendance_sessions')).rows.length,1)
    assert.equal((await db.query('select * from public.attendance_records')).rows.length,1)
    assert.equal((await db.query('select * from public.attendance_changes')).rows.length,0)
    await assert.rejects(db.query('select public.record_attendance($1,$2::jsonb)',[attendanceSession,JSON.stringify([{id:attendanceRows[0].id,status:'present',revision:2,reason:'Dilarang'}])]),permissionDenied)
  })
  await t.test('administrator and principal can report attendance but cannot enter it', async () => {
    for(const role of ['administrator','principal']) {
      await as(role)
      assert.equal((await db.query('select * from public.attendance_records')).rows.length,2)
      assert.equal((await db.query('select * from public.attendance_changes')).rows.length,3)
      await assert.rejects(db.query('select public.record_attendance($1,$2::jsonb)',[attendanceSession,'[]']),permissionDenied)
    }
  })
  await t.test('parent/pending/anonymous cannot access attendance', async () => {
    for(const role of ['parent','pending','anon']) {
      await as(role)
      for(const table of ['attendance_sessions','attendance_records','attendance_changes']) {
        if(role==='anon') await assert.rejects(db.query(`select * from public.${table}`),permissionDenied)
        else assert.equal((await db.query(`select * from public.${table}`)).rows.length,0)
      }
      await assert.rejects(db.query('select public.record_attendance($1,$2::jsonb)',[attendanceSession,'[]']),permissionDenied)
    }
  })
  await t.test('guardian attendance returns only verified active children and loses access on revocation', async () => {
    const read = async () => (await db.query('select public.guardian_attendance() as children')).rows[0].children
    const change = async active => {
      await as('administrator')
      await db.query("select public.set_account_relationship('parent', $1, $2, $3, 'Verifikasi data contoh')",
        [studentOne, ids.parent, active])
    }
    await as('parent')
    assert.deepEqual(await read(), [])
    await change(true)
    await as('parent')
    const children = await read()
    assert.deepEqual(children.map(child => child.id), [studentOne])
    assert.equal(children[0].attendance.length, 1)
    assert.deepEqual(Object.keys(children[0].attendance[0]).sort(), ['date', 'id', 'status'])
    await as('administrator')
    assert.deepEqual(await read(), [])
    await as('anon')
    await assert.rejects(read(), permissionDenied)
    await change(false)
    await as('parent')
    assert.deepEqual(await read(), [])
  })
  await t.test('empty class sessions roll back instead of creating an empty roster', async () => {
    await as('administrator')
    const year=(await db.query('select academic_year_id from public.school_classes where id=$1',[attendanceClass])).rows[0].academic_year_id
    const emptyClass=(await db.query("insert into public.school_classes (academic_year_id,name,grade,capacity) values ($1,'Data Contoh Kosong',1,30) returning id",[year])).rows[0].id
    await db.query('insert into public.teacher_assignments (teacher_id,class_id,subject_id) values ($1,$2,$3)',[teacherOne,emptyClass,subject])
    await as('teacher')
    await assert.rejects(db.query('insert into public.attendance_sessions (class_id,held_on) values ($1,$2)',[emptyClass,today]),{code:'23514'})
    assert.equal((await db.query('select * from public.attendance_sessions where class_id=$1',[emptyClass])).rows.length,0)
  })
  await t.test('teachers cannot enumerate or mutate attendance of another assigned teacher’s class', async () => {
    await db.exec('reset role')
    ids.otherTeacher='10000000-0000-4000-8000-000000000009'
    await db.query('insert into auth.users (id) values ($1)',[ids.otherTeacher])
    await db.query("update public.profiles set role='teacher' where id=$1",[ids.otherTeacher])
    await db.query("update public.teachers set profile_id=$1 where code='TEST_2'",[ids.otherTeacher])
    await as('administrator')
    const year=(await db.query('select academic_year_id from public.school_classes where id=$1',[attendanceClass])).rows[0].academic_year_id
    const otherClass=(await db.query("insert into public.school_classes (academic_year_id,name,grade,capacity) values ($1,'Data Contoh Kelas Lain',1,30) returning id",[year])).rows[0].id
    const otherStudent=(await db.query("insert into public.students (code,name) values ('ATT_OTHER','Data Contoh Siswa Lain') returning id")).rows[0].id
    const otherTeacher=(await db.query("select id from public.teachers where code='TEST_2'")).rows[0].id
    await db.query('insert into public.class_enrollments (student_id,class_id) values ($1,$2)',[otherStudent,otherClass])
    await db.query('insert into public.teacher_assignments (teacher_id,class_id,subject_id) values ($1,$2,$3)',[otherTeacher,otherClass,subject])
    await as('otherTeacher')
    const otherSession=(await db.query('insert into public.attendance_sessions (class_id,held_on) values ($1,$2) returning id',[otherClass,today])).rows[0].id
    const otherRecord=(await db.query('select id from public.attendance_records where session_id=$1',[otherSession])).rows[0].id
    await as('teacher')
    assert.equal((await db.query('select * from public.attendance_sessions where id=$1',[otherSession])).rows.length,0)
    assert.equal((await db.query('select * from public.attendance_records where id=$1',[otherRecord])).rows.length,0)
    const changed=JSON.stringify([{id:otherRecord,status:'present',revision:0,reason:''}])
    await assert.rejects(db.query('select public.record_attendance($1,$2::jsonb)',[attendanceSession,changed]),permissionDenied)
    await assert.rejects(db.query('select public.record_attendance($1,$2::jsonb)',[otherSession,changed]),permissionDenied)
  })
  await t.test('revoked teacher assignment immediately removes attendance access and write permission', async () => {
    await as('administrator')
    await db.query('update public.teacher_assignments set is_active=false where id=$1',[attendanceAssignment])
    await as('teacher')
    assert.equal((await db.query('select * from public.attendance_records')).rows.length,0)
    assert.equal((await db.query('select * from public.attendance_sessions')).rows.length,0)
    await assert.rejects(db.query('select public.record_attendance($1,$2::jsonb)',[attendanceSession,'[]']),permissionDenied)
  })
  let importRequest, importChanges
  const importSha='a'.repeat(64)
  const importCall='select public.import_attendance($1,$2::jsonb,$3,$4,$5,$6) as saved'
  await t.test('attendance import saves changes and metadata once across identical retries',async()=>{
    await as('administrator')
    await db.query('update public.teacher_assignments set is_active=true where id=$1',[attendanceAssignment])
    await as('teacher')
    const row=(await db.query('select * from public.attendance_records where id=$1',[attendanceRows[0].id])).rows[0]
    importChanges=JSON.stringify([{id:row.id,status:'present',revision:row.revision,reason:'Data Contoh Impor',actor_id:ids.principal}])
    importRequest='20000000-0000-4000-8000-000000000010'
    const args=[attendanceSession,importChanges,importRequest,'contoh.xlsx',importSha,2]
    assert.equal((await db.query(importCall,args)).rows[0].saved,1)
    assert.equal((await db.query(importCall,args)).rows[0].saved,1)
    const after=(await db.query('select * from public.attendance_records where id=$1',[row.id])).rows[0]
    assert.equal(after.revision,row.revision+1)
    assert.equal(after.updated_by,ids.teacher)
    const log=(await db.query('select * from public.attendance_imports')).rows
    assert.equal(log.length,1);assert.equal(log[0].changed_count,1);assert.equal(log[0].row_count,2);assert.equal(log[0].actor_id,ids.teacher)
    await assert.rejects(db.query(importCall,[attendanceSession,importChanges,importRequest,'contoh.xlsx','b'.repeat(64),2]),{code:'23505'})
    const different=JSON.stringify([{id:row.id,status:'absent',revision:row.revision,reason:'Data Contoh Berbeda'}])
    await assert.rejects(db.query(importCall,[attendanceSession,different,importRequest,'contoh.xlsx',importSha,2]),{code:'23505'})
  })
  await t.test('attendance import failure rolls back every change and does not write a success log',async()=>{
    await as('teacher')
    const before=(await db.query('select * from public.attendance_records where id=$1',[attendanceRows[0].id])).rows[0]
    const changes=JSON.stringify([{id:before.id,status:'excused',revision:before.revision,reason:'Data Contoh Koreksi'},{id:attendanceRows[1].id,status:'absent',revision:0,reason:'Data Contoh Usang'}])
    await assert.rejects(db.query(importCall,[attendanceSession,changes,'20000000-0000-4000-8000-000000000011','contoh.xlsx',importSha,2]),{code:'40001'})
    assert.equal((await db.query('select revision from public.attendance_records where id=$1',[before.id])).rows[0].revision,before.revision)
    assert.equal((await db.query('select * from public.attendance_imports')).rows.length,1)
    for(const [name,sha,count] of [['../contoh.xlsx',importSha,2],['contoh.xlsx','invalid',2],['contoh.xlsx',importSha,0]]) {
      await assert.rejects(db.query(importCall,[attendanceSession,importChanges,'20000000-0000-4000-8000-000000000012',name,sha,count]),{code:'23514'})
    }
    await assert.rejects(db.query('insert into public.attendance_imports default values'),permissionDenied)
    await assert.rejects(db.query('delete from public.attendance_imports'),permissionDenied)
    await assert.rejects(db.query("update public.attendance_imports set source_name='forged.xlsx'"),permissionDenied)
  })
  await t.test('import history and RPC enforce staff, class and role boundaries',async()=>{
    for(const role of ['administrator','principal','student','parent','pending','otherTeacher','anon']) {
      await as(role)
      if(role==='anon') await assert.rejects(db.query('select * from public.attendance_imports'),permissionDenied)
      else assert.equal((await db.query('select * from public.attendance_imports')).rows.length,['administrator','principal'].includes(role)?1:0)
      await assert.rejects(db.query(importCall,[attendanceSession,importChanges,importRequest,'contoh.xlsx',importSha,2]),permissionDenied)
    }
  })
  await t.test('schedules enforce administrator writes, conflicts, revisions and scoped visibility', async () => {
    const id = '71000000-0000-4000-8000-000000000001'
    const second = '71000000-0000-4000-8000-000000000002'
    const day = new Date(`${today}T00:00:00Z`).getUTCDay() || 7
    const save = (overrides = {}) => {
      const p = { id, revision: null, assignment: attendanceAssignment, day, start: 480, end: 540, from: today, until: today, active: true, reason: 'Data Contoh jadwal', ...overrides }
      return db.query('select public.save_lesson_schedule($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', Object.values(p))
    }
    for (const role of ['teacher','student','parent','principal','pending','anon']) {
      await as(role)
      await assert.rejects(save(), permissionDenied)
    }
    await as('administrator')
    await save()
    await assert.rejects(save(), { code: '23505' })
    await assert.rejects(save({ id: second, start: 510 }), { code: '23P01' })
    await assert.rejects(save({ id: second, end: 480 }), { code: '23514' })
    await assert.rejects(save({ id: second, reason: ' ' }), { code: '23514' })
    await assert.rejects(save({ id: second, day: day === 7 ? 1 : day + 1 }), { code: '23514' })
    await save({ id: second, start: 540, end: 600 })
    await assert.rejects(db.query('update public.lesson_schedules set is_active=false'), permissionDenied)
    await assert.rejects(db.query('delete from public.lesson_schedule_events'), permissionDenied)
    await save({ revision: 0, active: false })
    await assert.rejects(save({ revision: 0 }), { code: '40001' })
    assert.equal((await db.query('select * from public.lesson_schedule_events')).rows.length, 3)
    for (const role of ['teacher','student']) {
      await as(role)
      assert.equal((await db.query('select * from public.lesson_schedules')).rows.length, 1)
      assert.equal((await db.query('select * from public.lesson_schedule_events')).rows.length, 0)
    }
    await as('administrator')
    await db.query("select public.set_account_relationship('parent',$1,$2,true,'Data Contoh hubungan')", [studentOne, ids.parent])
    await as('parent')
    assert.equal((await db.query('select * from public.lesson_schedules')).rows.length, 1)
    await as('administrator')
    await db.query("select public.set_account_relationship('parent',$1,$2,false,'Data Contoh pencabutan')", [studentOne, ids.parent])
    await db.query('update public.teacher_assignments set is_active=false where id=$1', [attendanceAssignment])
    for (const role of ['teacher','student','parent','pending']) {
      await as(role)
      assert.equal((await db.query('select * from public.lesson_schedules')).rows.length, 0)
    }
    await as('administrator')
    await db.query('update public.teacher_assignments set is_active=true where id=$1', [attendanceAssignment])
    await as('principal')
    assert.equal((await db.query('select * from public.lesson_schedules')).rows.length, 2)
    await as('anon')
    await assert.rejects(db.query('select * from public.lesson_schedules'), permissionDenied)
  })
  await t.test('schedule proposals require assigned teachers and atomic administrator decisions', async () => {
    const schedule = '71000000-0000-4000-8000-000000000002'
    const proposal = '72000000-0000-4000-8000-000000000001'
    const day = new Date(`${today}T00:00:00Z`).getUTCDay() || 7
    const propose = (id = proposal, revision = 0) => db.query('select public.propose_schedule($1,$2,$3,$4,600,660,$5,$5,$6)', [id,schedule,revision,day,today,'Data Contoh perubahan'])
    const decide = (accept = true, id = proposal) => db.query('select public.decide_schedule_proposal($1,$2,$3)',[id,accept,'Data Contoh keputusan'])
    for (const role of ['administrator','principal','student','parent','pending','anon']) {
      await as(role)
      await assert.rejects(propose(), permissionDenied)
    }
    await as('teacher')
    await propose()
    await assert.rejects(propose('72000000-0000-4000-8000-000000000002'), { code: '23505' })
    await assert.rejects(decide(), permissionDenied)
    await assert.rejects(db.query("update public.schedule_proposals set status='accepted'"), permissionDenied)
    assert.equal((await db.query('select * from public.schedule_proposals')).rows.length,1)
    for (const role of ['student','parent','pending']) {
      await as(role)
      assert.equal((await db.query('select * from public.schedule_proposals')).rows.length,0)
    }
    await as('principal')
    assert.equal((await db.query('select * from public.schedule_proposals')).rows.length,1)
    await assert.rejects(decide(),permissionDenied)
    await as('administrator')
    const blocker = '71000000-0000-4000-8000-000000000001'
    await db.query('select public.save_lesson_schedule($1,1,$2,$3,600,660,$4,$4,true,$5)',[blocker,attendanceAssignment,day,today,'Data Contoh bentrok'])
    await assert.rejects(decide(),{code:'23P01'})
    assert.equal((await db.query('select status from public.schedule_proposals where id=$1',[proposal])).rows[0].status,'pending')
    assert.equal((await db.query('select start_minute from public.lesson_schedules where id=$1',[schedule])).rows[0].start_minute,540)
    await db.query('select public.save_lesson_schedule($1,2,$2,$3,600,660,$4,$4,false,$5)',[blocker,attendanceAssignment,day,today,'Data Contoh nonaktif'])
    await decide()
    assert.equal((await db.query('select start_minute from public.lesson_schedules where id=$1',[schedule])).rows[0].start_minute,600)
    assert.equal((await db.query('select status from public.schedule_proposals where id=$1',[proposal])).rows[0].status,'accepted')
    await assert.rejects(decide(),{code:'40001'})
    const stale = '72000000-0000-4000-8000-000000000003'
    await as('teacher')
    await propose(stale,1)
    await as('administrator')
    await db.query('select public.save_lesson_schedule($1,1,$2,$3,660,720,$4,$4,true,$5)',[schedule,attendanceAssignment,day,today,'Data Contoh edit admin'])
    await assert.rejects(decide(true,stale),{code:'40001'})
    assert.equal((await db.query('select status from public.schedule_proposals where id=$1',[stale])).rows[0].status,'pending')
    await decide(false,stale)
    await as('teacher')
    const revoked = '72000000-0000-4000-8000-000000000004'
    await propose(revoked,2)
    await as('administrator')
    await db.query('update public.teacher_assignments set is_active=false where id=$1',[attendanceAssignment])
    await assert.rejects(decide(true,revoked),{code:'23514'})
    await as('teacher')
    assert.equal((await db.query('select * from public.schedule_proposals')).rows.length,0)
    await assert.rejects(propose(),permissionDenied)
    await as('administrator')
    await decide(false,revoked)
    await db.query('update public.teacher_assignments set is_active=true where id=$1',[attendanceAssignment])
  })
  let journalId
  let academicAssessment, academicResults
  await t.test('assessments snapshot the assigned class and validate metadata', async () => {
    const create = (maximum, date = today, assignment = attendanceAssignment) => db.query(
      "insert into public.assessments(assignment_id,title,assessment_type,held_on,maximum_score) values ($1,'Data Contoh Asesmen','formative',$2,$3) returning id",
      [assignment,date,maximum],
    )
    for (const role of ['administrator','principal','student','parent','pending','otherTeacher']) {
      await as(role)
      await assert.rejects(create(20), permissionDenied)
    }
    await as('teacher')
    for (const maximum of [0,-1,100001,1.234,'NaN','Infinity']) await assert.rejects(create(maximum), { code: '23514' })
    await assert.rejects(create(20,'1900-01-01'), { code: '23514' })
    academicAssessment = (await create(20)).rows[0].id
    const row = (await db.query('select * from public.assessments where id=$1', [academicAssessment])).rows[0]
    assert.equal(row.class_id, attendanceClass)
    assert.equal(row.subject_id, subject)
    assert.equal(row.student_count, 2)
    assert.equal(row.graded_count, 0)
    academicResults = (await db.query('select * from public.assessment_results where assessment_id=$1 order by student_id', [academicAssessment])).rows
    assert.equal(academicResults.length, 2)
    assert.ok(academicResults.every(result => result.score === null))
    await assert.rejects(db.query('insert into public.assessment_results default values'), permissionDenied)
    await assert.rejects(db.query('update public.assessment_results set student_id=$1', [studentTwo]), permissionDenied)
    await assert.rejects(db.query('update public.assessments set revision=99'), permissionDenied)
    await assert.rejects(db.query('update public.assessments set subject_id=$1', [subject]), permissionDenied)
    await assert.rejects(db.query("update public.assessments set status='published' where id=$1", [academicAssessment]), { code: '23514' })
  })
  await t.test('assessment scores validate bounds, distinguish zero, and advance revisions before publication', async () => {
    await as('teacher')
    const first = academicResults[0].id
    for (const score of [-1,20.01,1.234,'NaN','Infinity']) {
      await assert.rejects(db.query('update public.assessment_results set score=$1 where id=$2', [score,first]), { code: '23514' })
    }
    await db.query('update public.assessment_results set score=0 where id=$1 and revision=0', [first])
    assert.equal((await db.query('select graded_count from public.assessments where id=$1', [academicAssessment])).rows[0].graded_count, 1)
    assert.equal((await db.query('update public.assessment_results set score=10 where id=$1 and revision=0 returning id', [first])).rows.length, 0)
    await assert.rejects(db.query("update public.assessments set status='published' where id=$1", [academicAssessment]), { code: '23514' })
    await db.query('update public.assessment_results set score=19.5 where id=$1', [academicResults[1].id])
    await assert.rejects(db.query('update public.assessments set maximum_score=19 where id=$1', [academicAssessment]), { code: '23514' })
    for (const role of ['student','parent','pending','otherTeacher']) {
      await as(role)
      for (const table of ['assessments','assessment_results','assessment_result_events']) {
        assert.equal((await db.query(`select * from public.${table}`)).rows.length, 0)
      }
      assert.equal((await db.query('update public.assessment_results set score=10 returning id')).rows.length, 0)
    }
    for (const role of ['administrator','principal']) {
      await as(role)
      assert.equal((await db.query('select * from public.assessment_results')).rows.length, 2)
      assert.equal((await db.query("update public.assessments set status='published' returning id")).rows.length, 0)
    }
    await as('teacher')
    assert.equal((await db.query("update public.assessments set status='published' where id=$1 and revision=1 returning id", [academicAssessment])).rows.length, 0)
    const header = (await db.query('select revision from public.assessments where id=$1', [academicAssessment])).rows[0]
    const published = (await db.query("update public.assessments set status='published' where id=$1 and revision=$2 returning *", [academicAssessment,header.revision])).rows[0]
    assert.ok(published.published_at)
    assert.equal(published.graded_count, 2)
    await assert.rejects(db.query("update public.assessments set title='Changed' where id=$1", [academicAssessment]), { code: '23514' })
    await assert.rejects(db.query("update public.assessments set status='draft' where id=$1", [academicAssessment]), { code: '23514' })
  })
  await t.test('published assessment results remain limited to self and verified children', async () => {
    await as('student')
    assert.equal((await db.query('select * from public.assessments')).rows.length, 1)
    const own = (await db.query('select * from public.assessment_results')).rows
    assert.deepEqual(own.map(row => row.student_id), [studentOne])
    const report = (await db.query('select r.student_id,a.subject_id from public.assessment_results r join public.assessments a on a.id=r.assessment_id where a.held_on between $1 and $1', [today])).rows
    assert.deepEqual(report, [{ student_id: studentOne, subject_id: subject }])
    assert.equal((await db.query('select * from public.assessment_result_events')).rows.length, 0)
    await as('parent')
    assert.equal((await db.query('select * from public.assessments')).rows.length, 0)
    await as('administrator')
    await db.query("select public.set_account_relationship('parent',$1,$2,true,'Data contoh')", [studentOne,ids.parent])
    await as('parent')
    assert.equal((await db.query('select * from public.assessments')).rows.length, 1)
    assert.deepEqual((await db.query('select student_id from public.assessment_results')).rows.map(row => row.student_id), [studentOne])
    assert.equal((await db.query('select * from public.assessment_result_events')).rows.length, 0)
    await as('administrator')
    await db.query("select public.set_account_relationship('parent',$1,$2,false,'Data contoh')", [studentOne,ids.parent])
    await as('parent')
    assert.equal((await db.query('select * from public.assessment_results')).rows.length, 0)
    await as('anon')
    for (const table of ['assessments','assessment_results','assessment_result_events']) await assert.rejects(db.query(`select * from public.${table}`), permissionDenied)
  })
  await t.test('published score corrections require reasons and append an immutable history', async () => {
    await as('teacher')
    const target = academicResults[0].id
    await assert.rejects(db.query('update public.assessment_results set score=2 where id=$1', [target]), { code: '23514' })
    await assert.rejects(db.query("update public.assessment_results set score=null,change_reason='Data contoh koreksi' where id=$1", [target]), { code: '23514' })
    await db.query("update public.assessment_results set score=2,feedback='Data contoh perbaikan',change_reason='Data contoh koreksi' where id=$1", [target])
    await assert.rejects(db.query('update public.assessment_results set score=3 where id=$1', [target]), { code: '23514' })
    await assert.rejects(db.query('update public.assessment_results set score=3,change_reason=$1 where id=$2', ['x'.repeat(1001),target]), { code: '23514' })
    const history = (await db.query('select * from public.assessment_result_events where result_id=$1 order by revision', [target])).rows
    assert.deepEqual(history.map(row => [Number(row.old_score),Number(row.score)]), [[0,0],[0,2]])
    assert.equal(history[0].old_score, null)
    assert.equal(history[1].change_reason, 'Data contoh koreksi')
    assert.equal(history[1].actor_id, ids.teacher)
    await assert.rejects(db.query('delete from public.assessment_result_events'), permissionDenied)
    await assert.rejects(db.query('delete from public.assessment_results'), permissionDenied)
    await as('administrator')
    await db.query('update public.teacher_assignments set is_active=false where id=$1', [attendanceAssignment])
    await as('teacher')
    assert.equal((await db.query('select * from public.assessments')).rows.length, 0)
    assert.equal((await db.query('update public.assessment_results set score=10 returning id')).rows.length, 0)
    await as('administrator')
    await db.query('update public.teacher_assignments set is_active=true where id=$1', [attendanceAssignment])
  })
  await t.test('class task deadlines are required and fixed after publication', async () => {
    await as('teacher')
    const create = due => db.query(
      "insert into public.class_materials (assignment_id,title,body,kind,due_on) values ($1,'Data Contoh Tugas','Instruksi','task',$2) returning id",
      [attendanceAssignment, due],
    )
    await assert.rejects(create(null), { code: '23514' })
    const { rows: [task] } = await create('2000-01-01')
    const update = values => db.query(`update public.class_materials set ${values} where id=$1 returning status`, [task.id])
    await assert.rejects(update("status='published'"), { code: '23514' })
    await update("due_on=(now() at time zone 'Asia/Jakarta')::date, status='published'")
    await assert.rejects(update("due_on='2099-01-01'"), { code: '23514' })
    await as('student')
    assert.equal((await db.query("select count(*)::int as total from public.class_materials where kind='task'")).rows[0].total, 1)
    const submit = () => db.query("insert into public.task_submissions (task_id,answer) values ($1,'Jawaban contoh') returning student_id", [task.id])
    assert.equal((await submit()).rows[0].student_id, studentOne)
    await assert.rejects(submit(), { code: '23505' })
    await assert.rejects(db.query("update public.task_submissions set answer='ubah'"), permissionDenied)
    await as('parent')
    assert.equal((await db.query('select * from public.task_submissions')).rows.length, 0)
    await assert.rejects(submit(), permissionDenied)
    await as('teacher')
    assert.equal((await db.query('select answer from public.task_submissions')).rows[0].answer, 'Jawaban contoh')
    await update("status='archived'")
    await as('student')
    await assert.rejects(submit(), permissionDenied)
  })
  await t.test('task feedback protects drafts, publication, audit and verified student relationships', async () => {
    await as('teacher')
    const submission = (await db.query('select id from public.task_submissions')).rows[0].id
    const insert = text => db.query('insert into public.task_feedback(submission_id,feedback) values ($1,$2) returning *', [submission,text])
    await assert.rejects(insert('   '), { code: '23514' })
    let feedback = (await insert('Draf contoh')).rows[0]
    await assert.rejects(insert('Duplikat'), { code: '23505' })
    await assert.rejects(db.query('update public.task_feedback set student_id=$1', [studentTwo]), permissionDenied)
    for (const role of ['student','parent','otherTeacher','pending']) {
      await as(role)
      assert.equal((await db.query('select * from public.task_feedback')).rows.length, 0)
      assert.equal((await db.query('select * from public.task_feedback_events')).rows.length, 0)
      await assert.rejects(insert('Tidak berwenang'), permissionDenied)
      assert.equal((await db.query("update public.task_feedback set feedback='Tidak berwenang' returning id")).rows.length, 0)
    }
    await as('anon')
    await assert.rejects(db.query('select * from public.task_feedback'), permissionDenied)
    for (const role of ['administrator','principal']) {
      await as(role)
      assert.equal((await db.query('select * from public.task_feedback')).rows.length, 1)
      assert.equal((await db.query("update public.task_feedback set status='published' returning id")).rows.length, 0)
    }
    await as('teacher')
    feedback = (await db.query("update public.task_feedback set feedback='Perbaiki langkah kedua' where id=$1 and revision=0 returning *", [feedback.id])).rows[0]
    assert.equal(feedback.revision, 1)
    assert.equal((await db.query("update public.task_feedback set status='published' where id=$1 and revision=0 returning id", [feedback.id])).rows.length, 0)
    feedback = (await db.query("update public.task_feedback set status='published' where id=$1 and revision=1 returning *", [feedback.id])).rows[0]
    assert.ok(feedback.published_at)
    await assert.rejects(db.query("update public.task_feedback set feedback='Ubah hasil terbit'"), { code: '23514' })
    await assert.rejects(db.query('delete from public.task_feedback'), permissionDenied)
    const events = (await db.query('select feedback,status,revision from public.task_feedback_events order by revision')).rows
    assert.deepEqual(events.map(row => [row.feedback,row.status,row.revision]), [
      ['Draf contoh','draft',0], ['Perbaiki langkah kedua','draft',1], ['Perbaiki langkah kedua','published',2],
    ])
    await assert.rejects(db.query('delete from public.task_feedback_events'), permissionDenied)
    await as('student')
    assert.equal((await db.query('select feedback from public.task_feedback')).rows[0].feedback, 'Perbaiki langkah kedua')
    assert.equal((await db.query('select * from public.task_feedback_events')).rows.length, 0)
    await as('parent')
    assert.equal((await db.query('select * from public.task_feedback')).rows.length, 0)
    await as('administrator')
    await db.query("select public.set_account_relationship('parent',$1,$2,true,'Data contoh')", [studentOne,ids.parent])
    await as('parent')
    assert.equal((await db.query('select feedback from public.task_feedback')).rows[0].feedback, 'Perbaiki langkah kedua')
    assert.equal((await db.query('select * from public.task_feedback_events')).rows.length, 0)
    await as('administrator')
    await db.query("select public.set_account_relationship('parent',$1,$2,false,'Data contoh')", [studentOne,ids.parent])
    await as('parent')
    assert.equal((await db.query('select * from public.task_feedback')).rows.length, 0)
  })
  await t.test('class materials remain private until published and follow enrollment and verified guardian access', async () => {
    await as('teacher')
    const { rows: [material] } = await db.query(
      "insert into public.class_materials (assignment_id,title,body) values ($1,'Data Contoh Materi','Isi contoh') returning id,class_id",
      [attendanceAssignment],
    )
    assert.equal(material.class_id, attendanceClass)
    const visible = async () => (await db.query('select id from public.class_materials')).rows.map(row => row.id)
    await as('student')
    assert.deepEqual(await visible(), [])
    await as('teacher')
    await db.query("update public.class_materials set status='published' where id=$1", [material.id])
    await assert.rejects(db.query("update public.class_materials set body='Diganti' where id=$1", [material.id]), { code: '23514' })
    await as('student')
    assert.deepEqual(await visible(), [material.id])
    await as('parent')
    assert.deepEqual(await visible(), [])
    await as('administrator')
    await db.query("select public.set_account_relationship('parent',$1,$2,true,'Data contoh')", [studentOne, ids.parent])
    await as('parent')
    assert.deepEqual(await visible(), [material.id])
    await as('teacher')
    await db.query("update public.class_materials set status='archived' where id=$1", [material.id])
    await as('parent')
    assert.deepEqual(await visible(), [])
    await as('student')
    assert.deepEqual(await visible(), [])
    await as('administrator')
    await db.query("select public.set_account_relationship('parent',$1,$2,false,'Data contoh')", [studentOne, ids.parent])
    await as('anon')
    await assert.rejects(visible(), permissionDenied)
  })
  await t.test('supervision requires four stages and only publishes to the supervised teacher', async () => {
    await as('principal')
    const { rows: [session] } = await db.query(
      "insert into public.academic_supervisions (teacher_id,scheduled_on,focus) values ($1,$2,'Data Contoh') returning id",
      [teacherOne, today],
    )
    const update = values => db.query(`update public.academic_supervisions set ${values} where id=$1 returning stage`, [session.id])
    const earlyPath = `${session.id}/00000000-0000-0000-0000-000000000001-awal.pdf`
    await assert.rejects(db.query("insert into storage.objects (bucket_id,name) values ('supervision-evidence',$1)", [earlyPath]), permissionDenied)
    await assert.rejects(update('stage=2'), { code: '23514' })
    await assert.rejects(update("stage=3, preparation='Persiapan'"), { code: '23514' })
    await update("stage=2, preparation='Persiapan'")
    await assert.rejects(update('stage=3, planning_score=2'), { code: '23514' })
    await update("stage=3, planning_score=2, instruction_score=3, assessment_score=4, observation_notes='Observasi'")
    await update("stage=4, reflection='Refleksi', feedback='Umpan balik', follow_up_plan='Perbaikan', target_on=scheduled_on")
    const path = `${session.id}/00000000-0000-0000-0000-000000000001-bukti.pdf`
    const upload = name => db.query("insert into storage.objects (bucket_id,name) values ('supervision-evidence',$1)", [name])
    for (const invalid of [
      'invalid/bukti.pdf',
      `not-a-uuid/00000000-0000-0000-0000-000000000001-bukti.pdf`,
      `${session.id}/bukti.pdf`,
      `${session.id}/00000000-0000-0000-0000-000000000001-../bukti.pdf`,
    ]) await assert.rejects(upload(invalid), permissionDenied)
    await assert.rejects(db.query("insert into storage.objects (bucket_id,name) values ('other-bucket',$1)", [path]), permissionDenied)
    await upload(path)
    // Simulate legacy or malformed metadata without granting client writes.
    await db.exec('reset role')
    await db.query("insert into storage.objects (bucket_id,name) values ('supervision-evidence','not-a-uuid/bukti.pdf')")
    await as('principal')
    assert.deepEqual((await db.query('select name from storage.objects')).rows, [{ name: path }])
    await db.exec('reset role')
    await db.query("delete from storage.objects where name='not-a-uuid/bukti.pdf'")
    await as('principal')
    const temporaryPath = path.replace('bukti.pdf', 'sementara.pdf')
    await upload(temporaryPath)
    assert.deepEqual((await db.query('delete from storage.objects where name=$1 returning name', [temporaryPath])).rows, [{ name: temporaryPath }])
    for (const role of ['administrator', 'otherTeacher', 'student', 'parent', 'pending', 'anon']) {
      await as(role)
      assert.equal((await db.query('select name from storage.objects')).rows.length, 0)
      await assert.rejects(upload(temporaryPath), permissionDenied)
      assert.equal((await db.query('delete from storage.objects where name=$1 returning name', [path])).rows.length, 0)
    }
    await as('principal')
    await assert.rejects(update('published_at=now()'), { code: '23514' })
    await as('teacher')
    assert.equal((await db.query('select * from public.academic_supervisions')).rows.length, 0)
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0)
    await as('principal')
    await update("follow_up_status='complete', follow_up_evaluation='Evaluasi'")
    await update('published_at=now()')
    await assert.rejects(upload(path.replace('bukti', 'baru')), permissionDenied)
    assert.equal((await db.query('delete from storage.objects returning name')).rows.length, 0)
    await assert.rejects(update("focus='Diubah'"), { code: '23514' })
    assert.equal((await db.query('select * from public.academic_supervision_events')).rows.length, 6)
    await as('teacher')
    assert.equal((await db.query('select * from public.academic_supervisions')).rows[0].id, session.id)
    assert.deepEqual((await db.query('select name from storage.objects')).rows, [{ name: path }])
    await as('administrator')
    await db.query('update public.teachers set is_active=false where id=$1', [teacherOne])
    await as('teacher')
    assert.equal((await db.query('select name from storage.objects')).rows.length, 0)
    await as('administrator')
    await db.query('update public.teachers set is_active=true where id=$1', [teacherOne])
    await as('teacher')
    assert.deepEqual((await db.query('select name from storage.objects')).rows, [{ name: path }])
    assert.equal((await db.query('select * from public.academic_supervision_events')).rows.length, 0)
    for (const role of ['otherTeacher', 'student', 'parent', 'pending', 'anon']) {
      await as(role)
      assert.equal((await db.query('select name from storage.objects')).rows.length, 0)
      await assert.rejects(upload(path.replace('bukti', 'baru')), permissionDenied)
      assert.equal((await db.query('delete from storage.objects where name=$1 returning name', [path])).rows.length, 0)
    }
    await as('administrator')
    assert.equal((await db.query('select * from public.academic_supervisions')).rows.length, 0)
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0)
  })
  await t.test('teaching modules enforce author edits, principal review, and immutable status audit', async () => {
    await as('teacher')
    const { rows: [module] } = await db.query(
      "insert into public.teaching_modules (assignment_id,title,objectives,activities) values ($1,'Data Contoh Modul','Tujuan','Kegiatan') returning *",
      [attendanceAssignment],
    )
    const change = (status, note = '') => db.query(
      'update public.teaching_modules set status=$2, review_note=$3 where id=$1 returning status', [module.id, status, note],
    )
    assert.equal(module.status, 'draft')
    await assert.rejects(change('approved'), permissionDenied)
    await as('principal')
    assert.equal((await db.query('select * from public.teaching_modules')).rows.length, 0)
    await as('teacher')
    assert.equal((await change('submitted')).rows[0].status, 'submitted')
    await assert.rejects(db.query("update public.teaching_modules set title='Revisi tanpa izin'"), permissionDenied)
    await as('administrator')
    assert.equal((await change('approved')).rows.length, 0)
    await as('principal')
    await assert.rejects(change('returned', ' '), permissionDenied)
    assert.equal((await change('returned', 'Lengkapi kegiatan')).rows[0].status, 'returned')
    await as('teacher')
    await db.query("update public.teaching_modules set activities='Kegiatan revisi',status='submitted' where id=$1", [module.id])
    await as('principal')
    assert.equal((await change('approved')).rows[0].status, 'approved')
    assert.equal((await change('archived')).rows[0].status, 'archived')
    assert.deepEqual((await db.query('select status from public.teaching_module_events order by id')).rows.map(row => row.status),
      ['submitted', 'returned', 'submitted', 'approved', 'archived'])
    await assert.rejects(db.query('delete from public.teaching_module_events'), permissionDenied)
    await as('student')
    assert.equal((await db.query('select * from public.teaching_modules')).rows.length, 0)
  })
  await t.test('assigned teacher creates immutable journal with server snapshots and author',async()=>{
    await as('teacher')
    journalId=(await db.query("insert into public.teaching_journals (assignment_id,held_on,topic,activities,reflection) values ($1,$2,'Data Contoh Topik','Data Contoh Kegiatan','Data Contoh Refleksi') returning *",[attendanceAssignment,today])).rows[0].id
    const row=(await db.query('select * from public.teaching_journals where id=$1',[journalId])).rows[0]
    assert.equal(row.created_by,ids.teacher)
    assert.equal(row.class_name,'Data Contoh Absensi')
    assert.ok(row.subject_name && row.teacher_name && row.academic_year_name)
    for(const column of ['created_by','created_at','class_name','subject_name','teacher_name','academic_year_name']) {
      await assert.rejects(db.query(`insert into public.teaching_journals (${column}) select ${column} from public.teaching_journals`),permissionDenied)
    }
    await assert.rejects(db.query("update public.teaching_journals set topic='Forged'"),permissionDenied)
    await assert.rejects(db.query('delete from public.teaching_journals'),permissionDenied)
  })
  await t.test('journal validates dates, calendar and content independently of the client',async()=>{
    await as('teacher')
    for(const day of [-1,1]) await assert.rejects(db.query("insert into public.teaching_journals (assignment_id,held_on,topic,activities) values ($1,$2::date+$3::integer,'Data Contoh','Data Contoh')",[attendanceAssignment,today,day]),{code:'23514'})
    for(const [topic,activities,reflection] of [[' ','Valid',''],['\n\t','Valid',''],['x'.repeat(161),'Valid',''],['Valid',' ',''],['Valid','x'.repeat(4001),''],['Valid','Valid','x'.repeat(2001)]]) await assert.rejects(db.query('insert into public.teaching_journals (assignment_id,held_on,topic,activities,reflection) values ($1,$2,$3,$4,$5)',[attendanceAssignment,today,topic,activities,reflection]),{code:'23514'})
    await as('administrator')
    await db.exec('reset role')
    const year=(await db.query('select academic_year_id from public.school_classes where id=$1',[attendanceClass])).rows[0].academic_year_id
    await db.query('update public.academic_years set ends_on=$2::date-1 where id=$1',[year,today])
    await as('teacher')
    await assert.rejects(db.query("insert into public.teaching_journals (assignment_id,held_on,topic,activities) values ($1,$2,'Data Contoh','Data Contoh')",[attendanceAssignment,today]),{code:'23514'})
    await db.exec('reset role')
    await db.query('update public.academic_years set ends_on=$2 where id=$1',[year,`${today.slice(0,4)}-12-31`])
  })
  await t.test('journal blocks other teachers and untrusted roles while staff can only read',async()=>{
    for(const role of ['administrator','principal','student','parent','pending','otherTeacher','anon']) {
      await as(role)
      if(role==='anon') await assert.rejects(db.query('select * from public.teaching_journals'),permissionDenied)
      else assert.equal((await db.query('select * from public.teaching_journals')).rows.length,['administrator','principal'].includes(role)?1:0)
      await assert.rejects(db.query("insert into public.teaching_journals (assignment_id,held_on,topic,activities) values ($1,$2,'Data Contoh','Data Contoh')",[attendanceAssignment,today]),permissionDenied)
      await assert.rejects(db.query("update public.teaching_journals set topic='Forged'"),permissionDenied)
      await assert.rejects(db.query('delete from public.teaching_journals'),permissionDenied)
    }
  })
  await t.test('deactivation of journal dependencies revokes teacher read and insert',async()=>{
    for(const [table,id] of [['teacher_assignments',attendanceAssignment],['teachers',teacherOne],['school_classes',attendanceClass],['subjects',subject]]) {
      await as('administrator')
      await db.query(`update public.${table} set is_active=false where id=$1`,[id])
      await as('teacher')
      assert.equal((await db.query('select * from public.teaching_journals')).rows.length,0)
      await assert.rejects(db.query("insert into public.teaching_journals (assignment_id,held_on,topic,activities) values ($1,$2,'Data Contoh','Data Contoh')",[attendanceAssignment,today]),permissionDenied)
      await as('administrator')
      await db.query(`update public.${table} set is_active=true where id=$1`,[id])
    }
    await as('teacher')
    assert.equal((await db.query('select * from public.teaching_journals')).rows.length,1)
  })
  await t.test('communication restricts immutable messages to active teacher and verified guardian', async () => {
    await as('administrator')
    await db.query('select public.set_account_relationship($1,$2,$3,$4,$5)', ['parent',studentOne,ids.parent,true,'Data Contoh valid'])
    const values = [attendanceAssignment, studentOne, ids.parent]
    const send = () => db.query("insert into public.communication_messages (assignment_id,student_id,parent_profile_id,body) values ($1,$2,$3,'Data Contoh') returning author_id", values)
    await as('teacher')
    assert.ok((await db.query('select * from public.communication_recipients(0)')).rows.some(row => row.assignment_id === attendanceAssignment && row.student_id === studentOne && row.parent_profile_id === ids.parent))
    await assert.rejects(db.query('select * from public.communication_recipients(-1)'), { code: '22023' })
    assert.equal((await send()).rows[0].author_id, ids.teacher)
    await as('parent')
    assert.equal((await send()).rows[0].author_id, ids.parent)
    await assert.rejects(db.query("insert into public.communication_messages (assignment_id,student_id,parent_profile_id,body) values ($1,$2,$3,'   ')", values), { code: '23514' })
    await assert.rejects(db.query("insert into public.communication_messages (assignment_id,student_id,parent_profile_id,body,created_at) values ($1,$2,$3,'Data Contoh',now())", values), permissionDenied)
    assert.equal((await db.query('select * from public.communication_messages')).rows.length, 2)
    await as('teacher')
    await assert.rejects(db.query("insert into public.communication_messages (assignment_id,student_id,parent_profile_id,body) values ($1,$2,$3,'Data Contoh')", [attendanceAssignment,studentTwo,ids.parent]), permissionDenied)
    await assert.rejects(db.query("insert into public.communication_messages (assignment_id,student_id,parent_profile_id,body,author_id) values ($1,$2,$3,'Data Contoh',$4)", [...values,ids.parent]), permissionDenied)
    await as('parent')
    await assert.rejects(db.query("update public.communication_messages set body='changed'"), permissionDenied)
    await assert.rejects(db.query('delete from public.communication_messages'), permissionDenied)
    for (const role of ['administrator','principal','student','pending','otherTeacher','anon']) {
      await as(role)
      if (role === 'anon') {
        await assert.rejects(db.query('select * from public.communication_messages'), permissionDenied)
        await assert.rejects(db.query('select * from public.communication_recipients(0)'), permissionDenied)
      } else {
        assert.equal((await db.query('select * from public.communication_messages')).rows.length, 0)
        assert.equal((await db.query('select * from public.communication_recipients(0)')).rows.some(row => row.assignment_id === attendanceAssignment && row.student_id === studentOne && row.parent_profile_id === ids.parent), false)
      }
      await assert.rejects(send(), permissionDenied)
    }
    for (const [table, id] of [['teacher_assignments', attendanceAssignment], ['students', studentOne]]) {
      await as('administrator')
      await db.query(`update public.${table} set is_active=false where id=$1`, [id])
      for (const role of ['teacher','parent']) {
        await as(role)
        assert.equal((await db.query('select * from public.communication_messages')).rows.length, 0)
        await assert.rejects(send(), permissionDenied)
      }
      await as('administrator')
      await db.query(`update public.${table} set is_active=true where id=$1`, [id])
    }
    await as('administrator')
    const enrollment = (await db.query('select id from public.class_enrollments where student_id=$1 and class_id=$2 and is_active', [studentOne, attendanceClass])).rows[0].id
    await db.query('update public.class_enrollments set is_active=false where id=$1', [enrollment])
    for (const role of ['teacher','parent']) {
      await as(role)
      assert.equal((await db.query('select * from public.communication_messages')).rows.length, 0)
      await assert.rejects(send(), permissionDenied)
    }
    await as('administrator')
    await db.query('update public.class_enrollments set is_active=true where id=$1', [enrollment])
    await db.exec('reset role')
    await db.query("update public.profiles set role='pending' where id=$1", [ids.teacher])
    await as('teacher')
    assert.equal((await db.query('select * from public.communication_messages')).rows.length, 0)
    await assert.rejects(send(), permissionDenied)
    await db.exec('reset role')
    await db.query("update public.profiles set role='teacher' where id=$1", [ids.teacher])
    await db.exec('reset role')
    await db.query("update public.profiles set role='pending' where id=$1", [ids.parent])
    for (const role of ['teacher','parent']) {
      await as(role)
      assert.equal((await db.query('select * from public.communication_messages')).rows.length, 0)
      await assert.rejects(send(), permissionDenied)
    }
    await db.exec('reset role')
    await db.query("update public.profiles set role='parent' where id=$1", [ids.parent])
    await as('administrator')
    await db.query('select public.set_account_relationship($1,$2,$3,$4,$5)', ['parent',studentOne,ids.parent,false,'Data Contoh valid'])
    for (const role of ['teacher','parent']) {
      await as(role)
      assert.equal((await db.query('select * from public.communication_messages')).rows.length, 0)
      assert.equal((await db.query('select * from public.communication_recipients(0)')).rows.some(row => row.assignment_id === attendanceAssignment && row.student_id === studentOne && row.parent_profile_id === ids.parent), false)
      await assert.rejects(send(), permissionDenied)
    }
  })
  await t.test('removing a school role immediately removes read access', async () => {
    await db.exec('reset role')
    await db.query("update public.profiles set role = 'pending' where id = $1", [ids.teacher])
    await as('teacher')
    assert.equal((await db.query('select * from public.announcements')).rows.length, 0)
    assert.equal((await db.query('select * from public.teachers')).rows.length, 0)
    assert.equal((await db.query('select * from public.teaching_journals')).rows.length,0)
  })
})
