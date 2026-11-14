import { expect, test, type Page } from '@playwright/test'
import { schoolToday } from '../../src/features/attendance/attendance-model'
import writeExcelFile from 'write-excel-file/node'
import { readSheet } from 'read-excel-file/node'

const userId = '10000000-0000-4000-8000-000000000001'
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'akun-uji@example.test', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
const session = {
  access_token: `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test-signature`,
  refresh_token: 'browser-test-refresh-token', token_type: 'bearer', expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, user,
}

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.route('https://fonts.gstatic.com/**', route => route.abort())
})

async function mockSchool(page: Page, { role = 'administrator', signedIn = true, failNews = false, many = false, masterUnavailable = false, relationsReady = false } = {}) {
  let profile = { id: userId, full_name: 'Pengguna Uji', role }
  const news = [{ id: '20000000-0000-4000-8000-000000000001', title: 'Kegiatan literasi', body: 'Mari membaca bersama di sekolah.', status: 'published', created_at: '2026-11-10T00:00:00Z' }]
  if (many) for (let index = 2; index <= 12; index++) news.push({ ...news[0], id: `news-${index}`, title: `Kabar nomor ${index}` })
  const master: Record<string, Record<string, unknown>[]> = {
    school_settings: [], academic_years: [{ id: 'year-test', name: 'Data Contoh 2026/2027', starts_on: '2026-07-01', ends_on: '2027-06-30', is_active: false }],
    semesters: [], subjects: [], school_classes: [],
    teachers: [{ id: 'teacher-test', code: 'GURU_01', name: 'Data Contoh Guru Terkait', is_active: true, profile_id: userId }, { id: 'teacher-other', code: 'GURU_02', name: 'Data Contoh Guru Lain', is_active: true, profile_id: 'other-user' }],
    students: [], class_enrollments: [], teacher_assignments: [],
  }
  if (relationsReady) {
    master.school_classes.push({ id: 'class-test', name: 'Data Contoh Kelas 1A', academic_year_id: 'year-test', is_active: true })
    master.subjects.push({ id: 'subject-test', code: 'TEST', name: 'Data Contoh Pelajaran', is_active: true })
    master.students.push({ id: 'student-test', code: 'SISWA_01', name: 'Data Contoh Siswa', is_active: true, profile_id: 'student-user' })
  }
  if (signedIn) await page.addInitScript(({ session }) => {
    if (!sessionStorage.getItem('fixture-initialized')) {
      localStorage.setItem('sb-example-auth-token', JSON.stringify(session))
      sessionStorage.setItem('fixture-initialized', 'true')
    }
  }, { session })
  await page.route('https://example.supabase.co/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const json = async (data: unknown, status = 200, headers: Record<string, string> = {}) => route.fulfill({ status, contentType: 'application/json', headers, body: JSON.stringify(data) })
    if (url.pathname.endsWith('/token')) {
      if (request.postDataJSON().password === 'wrong-password') return json({ error_code: 'invalid_credentials', msg: 'Invalid credentials' }, 400)
      return json(session)
    }
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 })
    if (url.pathname.endsWith('/recover')) return json({})
    if (url.pathname.endsWith('/user')) return json({ user })
    if (url.pathname.endsWith('/profiles')) {
      if (method === 'PATCH') { profile = { ...profile, ...request.postDataJSON() }; return json(profile) }
      return json([profile])
    }
    if (url.pathname.endsWith('/task_feedback') && method === 'GET') return json([])
    if (url.pathname.endsWith('/schedule_proposals') && method === 'GET') return json([])
    const masterKind = url.pathname.split('/').at(-1) ?? ''
    if (Object.hasOwn(master, masterKind)) {
      if (masterUnavailable) return json({ code: 'PGRST205', message: 'Table unavailable' }, 404)
      if (method === 'POST') {
        const item = { ...request.postDataJSON(), id: masterKind === 'school_settings' ? true : `master-${master[masterKind].length + 1}` }
        master[masterKind].unshift(item)
        return json({ id: item.id })
      }
      if (method === 'PATCH') {
        const item = master[masterKind].find(item => `eq.${item.id}` === url.searchParams.get('id'))
        if (!item) return json({ message: 'Not found' }, 404)
        Object.assign(item, request.postDataJSON())
        return json({ id: item.id })
      }
      if (masterKind === 'teachers' || masterKind === 'students') {
        const selfRole = masterKind === 'teachers' ? 'teacher' : 'student'
        return json(master[masterKind].filter(row => ['administrator','principal'].includes(role) || (role === selfRole && row.profile_id === userId)))
      }
      return json(master[masterKind])
    }
    if (url.pathname.endsWith('/announcements')) {
      if (failNews) return json({ message: 'Unavailable' }, 503)
      if (method === 'POST') {
        const data = { ...request.postDataJSON(), id: '20000000-0000-4000-8000-000000000002', created_at: '2026-11-10T01:00:00Z' }
        news.unshift(data)
        return json({ id: data.id })
      }
      if (method === 'PATCH') {
        const item = news.find(item => `eq.${item.id}` === url.searchParams.get('id'))
        if (!item) return json({ message: 'Not found' }, 404)
        Object.assign(item, request.postDataJSON())
        return json({ id: item.id })
      }
      const visible = news.filter(item => !url.searchParams.has('status') || url.searchParams.get('status') === `eq.${item.status}`)
      if (method === 'HEAD') return route.fulfill({ status: 200, headers: { 'content-range': `0-0/${visible.length}` } })
      const offset = Number(url.searchParams.get('offset') ?? 0)
      const limit = Number(url.searchParams.get('limit') ?? visible.length)
      return json(visible.slice(offset, offset + limit))
    }
    throw new Error(`Unexpected mocked request: ${method} ${url.pathname}`)
  })
}

test('administrator reviews a verified guardian link before saving', async ({ page }) => {
  await mockSchool(page)
  const registryId = '20000000-0000-4000-8000-000000000010'
  await page.route('**/rest/v1/students?*', route => route.fulfill({
    json: [{ id: registryId, name: 'Data Contoh Siswa', is_active: true }],
  }))
  let writes = 0
  await page.route('**/rest/v1/rpc/set_account_relationship', route => {
    writes++
    expect(route.request().postDataJSON()).toEqual({
      relationship_kind: 'parent', registry_id: registryId,
      profile_id: userId, active: true, reason: 'Verifikasi data contoh',
    })
    return route.fulfill({ json: true })
  })
  await page.goto('/')
  await page.getByRole('link', { name: 'Tautan akun' }).click()
  await page.getByLabel('Jenis tautan').selectOption('parent')
  await page.getByLabel('Kode siswa').fill('SISWA_01')
  await page.getByLabel('ID akun').fill(userId)
  await page.getByLabel('Alasan verifikasi atau pencabutan').fill('Verifikasi data contoh')
  await page.getByRole('button', { name: 'Tinjau tautan' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Data Contoh Siswa')
  expect(writes).toBe(0)
  await page.getByRole('button', { name: 'Ya, simpan' }).click()
  await expect(page.getByRole('status')).toHaveText('Perubahan tersimpan dan tercatat.')
  expect(writes).toBe(1)
})

test('guardian portal renders attendance and clears it when the link is revoked', async ({ page }) => {
  await mockSchool(page, { role: 'parent' })
  let linked = true
  await page.route('**/rest/v1/rpc/guardian_attendance', route => route.fulfill({
    json: linked ? [{
      id: 'child-example', name: 'Data Contoh Anak',
      attendance: [
        { id: 'record-one', date: '2026-11-10', status: 'present' },
        { id: 'record-two', date: '2026-11-09', status: null },
      ],
    }] : [],
  }))
  await page.goto('/')
  await page.getByRole('link', { name: 'Ruang Orang Tua', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Data Contoh Anak' })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Hadir', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Belum diisi' })).toBeVisible()
  linked = false
  await page.getByRole('button', { name: 'Muat ulang kehadiran' }).click()
  await expect(page.getByText('Belum ada tautan anak aktif.', { exact: false })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Data Contoh Anak' })).toHaveCount(0)
})

test('principal uploads a private evidence file to the selected supervision', async ({ page }) => {
  await mockSchool(page, { role: 'principal' })
  const sessionId = '20000000-0000-4000-8000-000000000090'
  await page.route('**/rest/v1/academic_supervisions?*', route => route.fulfill({ json: [{
    id: sessionId, scheduled_on: '2026-11-05', focus: 'Data Contoh Tindak Lanjut',
    stage: 4, revision: 5, follow_up_status: 'in_progress', teachers: { name: 'Data Contoh Guru' },
  }] }))
  let uploaded = ''
  await page.route('**/storage/v1/object/list/supervision-evidence', route => route.fulfill({
    json: uploaded ? [{ name: uploaded }] : [],
  }))
  await page.route(`**/storage/v1/object/supervision-evidence/${sessionId}/*`, route => {
    expect(route.request().method()).toBe('POST')
    expect(route.request().headers()['x-upsert']).toBe('false')
    uploaded = new URL(route.request().url()).pathname.split('/').at(-1) ?? ''
    expect(uploaded).toMatch(/^[a-f0-9-]{36}-Bukti_contoh.pdf$/)
    return route.fulfill({ json: { Key: `supervision-evidence/${sessionId}/${uploaded}` } })
  })
  await page.goto('/supervisi')
  await page.getByRole('button', { name: /Data Contoh Tindak Lanjut/ }).click()
  await page.getByLabel(/Berkas bukti/).setInputFiles({
    name: 'Bukti contoh.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4'),
  })
  await page.getByRole('button', { name: 'Unggah bukti' }).click()
  await expect(page.getByText('Bukti berhasil diunggah.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Unduh Bukti_contoh.pdf' })).toBeVisible()
})

test('principal filters supervision report and downloads the displayed period', async ({ page }) => {
  await mockSchool(page, { role: 'principal' })
  await page.route('**/rest/v1/academic_supervisions?*', route => {
    const filters = new URL(route.request().url()).searchParams
    if (!filters.has('scheduled_on')) return route.fulfill({ json: [] })
    expect(filters.getAll('scheduled_on')).toEqual(['gte.2026-11-01', 'lte.2026-11-10'])
    return route.fulfill({ json: [{
      id: 'supervision-example', scheduled_on: '2026-11-05', teachers: { name: 'Data Contoh Guru' },
      stage: 4, target_on: '2026-11-09', follow_up_status: 'complete', published_at: '2026-11-10T00:00:00Z',
    }] })
  })
  await page.goto('/supervisi')
  await page.locator('summary').filter({ hasText: 'Laporan supervisi' }).click()
  await page.getByLabel('Tanggal mulai').fill('2026-11-01')
  await page.getByLabel('Tanggal akhir').fill('2026-11-10')
  await page.getByRole('button', { name: 'Tampilkan laporan' }).click()
  await expect(page.getByRole('cell', { name: 'Data Contoh Guru' })).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Unduh CSV laporan' }).click()
  expect((await download).suggestedFilename()).toBe('supervisi-2026-11-01-2026-11-10.csv')
  await page.getByLabel('Tanggal akhir').fill('2026-11-11')
  await expect(page.getByRole('button', { name: 'Unduh CSV laporan' })).toHaveCount(0)
})

test('principal schedules supervision and advances to observation', async ({ page }) => {
  await mockSchool(page, { role: 'principal' })
  let supervision: Record<string, unknown> | null = null
  await page.route('**/rest/v1/academic_supervisions?*', route => {
    const request = route.request()
    if (request.method() === 'POST') {
      const payload = request.postDataJSON()
      expect(payload.focus).toBe('Data Contoh Fokus')
      supervision = { ...payload, teachers: { name: 'Data Contoh Guru Terkait' }, stage: 1, revision: 0 }
      return route.fulfill({ json: { id: payload.id } })
    }
    if (request.method() === 'PATCH') {
      const payload = request.postDataJSON()
      expect(payload.stage).toBe(2)
      expect(new URL(request.url()).searchParams.get('revision')).toBe('eq.0')
      supervision = { ...supervision, ...payload, revision: 1 }
      return route.fulfill({ json: [{ id: supervision.id }] })
    }
    return route.fulfill({ json: supervision ? [supervision] : [] })
  })
  await page.goto('/supervisi')
  await page.getByRole('button', { name: 'Jadwalkan supervisi' }).click()
  await page.getByLabel('Guru', { exact: true }).selectOption('teacher-test')
  await page.getByLabel('Fokus observasi').fill('Data Contoh Fokus')
  await page.getByLabel('Diskusi awal dan persiapan').fill('Persiapan contoh')
  await page.getByRole('button', { name: 'Simpan draf' }).click()
  await expect(page.getByRole('heading', { name: 'Pra-Observasi' })).toBeVisible()
  await page.getByRole('button', { name: 'Simpan dan lanjutkan' }).click()
  await expect(page.getByRole('heading', { name: 'Observasi', exact: true })).toBeVisible()
  await expect(page.getByLabel('Pelaksanaan pembelajaran')).toHaveValue('')
})

test('observation autosave keeps input after a conflict and retries with the same revision', async ({ page }) => {
  await mockSchool(page, { role: 'principal' })
  const session = {
    id: 'supervision-autosave', scheduled_on: '2026-11-05', teachers: { name: 'Data Contoh Guru' },
    focus: 'Data Contoh Observasi', stage: 2, revision: 4,
  }
  let writes = 0
  await page.route('**/rest/v1/academic_supervisions?*', route => {
    if (route.request().method() !== 'PATCH') return route.fulfill({ json: [session] })
    const filters = new URL(route.request().url()).searchParams
    expect(filters.get('revision')).toBe('eq.4')
    expect(route.request().postDataJSON()).toEqual({
      planning_score: 3, instruction_score: null, assessment_score: null, observation_notes: 'Catatan contoh',
    })
    writes++
    return route.fulfill({ json: writes === 1 ? [] : [{ revision: 5 }] })
  })
  await page.goto('/supervisi')
  await page.getByRole('button', { name: /Data Contoh Observasi/ }).click()
  await page.getByLabel('Perencanaan pembelajaran').selectOption('3')
  const notes = page.getByLabel('Catatan observasi')
  await notes.fill('Catatan contoh')
  await expect(page.getByText(/Draf belum tersimpan/)).toBeVisible()
  await expect(notes).toHaveValue('Catatan contoh')
  await page.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(page.getByText('Draf observasi tersimpan otomatis.')).toBeVisible()
  expect(writes).toBe(2)
  await expect(notes).toHaveValue('Catatan contoh')
})

test('student sees the task deadline without authoring controls', async ({ page }) => {
  await mockSchool(page, { role: 'student' })
  await page.route('**/rest/v1/class_materials?*', route => {
    expect(new URL(route.request().url()).searchParams.get('kind')).toBe('eq.task')
    return route.fulfill({ json: [{
      id: 'task-example', class_name: 'Kelas 1A', subject_name: 'Matematika',
      title: 'Data Contoh Tugas', body: 'Instruksi contoh', status: 'published', revision: 1, due_on: '2026-11-20',
    }] })
  })
  await page.goto('/')
  await page.getByRole('link', { name: 'Tugas Kelas' }).click()
  await expect(page.getByRole('heading', { name: 'Data Contoh Tugas' })).toBeVisible()
  await expect(page.getByText('Tenggat 2026-11-20')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Buat tugas' })).toHaveCount(0)
})

test('teacher confirms publication of a class material draft', async ({ page }) => {
  await mockSchool(page, { role: 'teacher' })
  const row = {
    id: 'material-example', class_name: 'Kelas 1A', subject_name: 'Matematika',
    title: 'Data Contoh Materi', body: 'Isi materi contoh', status: 'draft', revision: 0,
  }
  let writes = 0
  await page.route('**/rest/v1/class_materials?*', route => {
    if (route.request().method() !== 'PATCH') return route.fulfill({ json: [row] })
    expect(new URL(route.request().url()).searchParams.get('revision')).toBe('eq.0')
    expect(route.request().postDataJSON()).toEqual({ status: 'published' })
    writes++
    row.status = 'published'
    return route.fulfill({ json: [{ id: row.id }] })
  })
  await page.goto('/materi')
  await page.getByRole('button', { name: 'Terbitkan materi' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  expect(writes).toBe(0)
  await page.getByRole('button', { name: 'Ya, lanjutkan' }).click()
  await expect(page.getByText('Materi diterbitkan.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Arsipkan materi' })).toBeVisible()
  expect(writes).toBe(1)
})

test('principal returns a teaching module with revision feedback', async ({ page }) => {
  await mockSchool(page, { role: 'principal' })
  const module = {
    id: 'module-example', title: 'Data Contoh Modul', objectives: 'Tujuan contoh',
    activities: 'Kegiatan contoh', status: 'submitted', review_note: '', revision: 1,
    teacher_assignments: { id: 'assignment-example', school_classes: { name: 'Kelas 1A' }, subjects: { name: 'Matematika' } },
  }
  await page.route('**/rest/v1/teaching_modules?*', route => {
    if (route.request().method() === 'PATCH') {
      const url = new URL(route.request().url())
      expect(url.searchParams.get('revision')).toBe('eq.1')
      expect(route.request().postDataJSON()).toEqual({ status: 'returned', review_note: 'Lengkapi kegiatan.' })
      Object.assign(module, { status: 'returned', review_note: 'Lengkapi kegiatan.', revision: 2 })
      return route.fulfill({ json: [{ id: module.id }] })
    }
    return route.fulfill({ json: [module] })
  })
  await page.goto('/modul-ajar')
  await page.getByRole('button', { name: 'Data Contoh Modul' }).click()
  await page.getByRole('button', { name: 'Kembalikan untuk revisi' }).click()
  await expect(page.getByText('Isi catatan revisi dengan minimal lima karakter.')).toBeVisible()
  await page.getByLabel('Catatan pemeriksaan').fill('Lengkapi kegiatan.')
  await page.getByRole('button', { name: 'Kembalikan untuk revisi' }).click()
  await expect(page.getByText('Status modul diperbarui.')).toBeVisible()
  await expect(page.getByText('Perlu revisi', { exact: false })).toBeVisible()
})

test('guardian cannot open the account linking form directly', async ({ page }) => {
  await mockSchool(page, { role: 'parent' })
  await page.goto('/tautan-akun')
  await expect(page.getByText('Halaman ini tersedia untuk administrator sekolah.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tinjau tautan' })).toHaveCount(0)
})

test('protected routes require login and unknown pages show recovery navigation', async ({ page }) => {
  await mockSchool(page, { signedIn: false })
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Masuk SI STIR HEBAT' })).toBeVisible()
  await page.goto('/jurnal')
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/halaman-tidak-ada')
  await expect(page.getByRole('heading', { name: 'Halaman tidak ditemukan' })).toBeVisible()
})

test('login failure can be retried, session survives reload, and logout protects dashboard', async ({ page }) => {
  await mockSchool(page, { signedIn: false })
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(user.email)
  await page.getByLabel('Kata sandi', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Tidak dapat masuk' })).toBeVisible()
  await page.getByLabel('Kata sandi', { exact: true }).fill('valid-password')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Halo, Pengguna Uji' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Halo, Pengguna Uji' })).toBeVisible()
  await page.goto('/akun')
  await page.getByRole('button', { name: 'Keluar', exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
})

test('dashboard shows published news and teacher has no editor', async ({ page }) => {
  await mockSchool(page, { role: 'teacher' })
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Kegiatan literasi' })).toBeVisible()
  await expect(page.getByText('Guru', { exact: true })).toBeVisible()
  await expect(page.getByText('Draf pengumuman', { exact: true })).toHaveCount(0)
  await page.goto('/pengumuman')
  await expect(page.getByRole('heading', { name: 'Kegiatan literasi' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tulis pengumuman' })).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('principal dashboard shows exact supervision-stage and teaching-module counts', async ({ page }) => {
  await mockSchool(page, { role: 'principal' })
  const requested: string[] = []
  await page.route(/\/rest\/v1\/(academic_supervisions|teaching_modules)\?/, async route => {
    const request = route.request()
    const url = new URL(request.url())
    expect(request.method()).toBe('HEAD')
    const table = url.pathname.endsWith('/academic_supervisions') ? 'academic_supervisions' : 'teaching_modules'
    const stage = url.searchParams.get('stage')
    const status = url.searchParams.get('status')
    requested.push(`${table}:${stage ?? status}`)
    const count = stage ? ({ 'eq.1': 2, 'eq.2': 1, 'eq.3': 0, 'eq.4': 3 }[stage] ?? 0)
      : status === 'eq.submitted' ? 4 : 1
    await route.fulfill({ status: 200, headers: {
      'content-range': `*/${count}`, 'access-control-expose-headers': 'content-range',
    } })
  })
  await page.goto('/dashboard')
  const summary = page.getByRole('region', { name: 'Ringkasan kepala sekolah' })
  await expect(summary.getByRole('article', { name: 'Pra-observasi' })).toContainText('2')
  await expect(summary.getByRole('article', { name: 'Observasi', exact: true })).toContainText('1')
  await expect(summary.getByRole('article', { name: 'Pasca-observasi' })).toContainText('0')
  await expect(summary.getByRole('article', { name: 'Tindak lanjut' })).toContainText('3')
  await expect(summary.getByRole('article', { name: 'Perlu ditinjau' })).toContainText('4')
  await expect(summary.getByRole('article', { name: 'Dikembalikan' })).toContainText('1')
  expect(requested).toHaveLength(6)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('principal dashboard does not request workflow counts for teachers', async ({ page }) => {
  await mockSchool(page, { role: 'teacher' })
  let requested = false
  await page.route(/\/rest\/v1\/(academic_supervisions|teaching_modules)\?/, async route => {
    requested = true
    await route.fulfill({ status: 403, json: { code: '42501' } })
  })
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Akses cepat' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ringkasan kepala sekolah' })).toHaveCount(0)
  expect(requested).toBe(false)
})

test('principal dashboard distinguishes missing counts from zero and retries', async ({ page }) => {
  await mockSchool(page, { role: 'principal' })
  let retry = false
  await page.route(/\/rest\/v1\/(academic_supervisions|teaching_modules)\?/, async route => {
    const url = new URL(route.request().url())
    const stage = url.searchParams.get('stage')
    if (stage === 'eq.1' && !retry) {
      await route.fulfill({ status: 200 })
      return
    }
    const count = stage === 'eq.3' ? 0 : 2
    await route.fulfill({ status: 200, headers: {
      'content-range': `*/${count}`, 'access-control-expose-headers': 'content-range',
    } })
  })
  await page.goto('/dashboard')
  const summary = page.getByRole('region', { name: 'Ringkasan kepala sekolah' })
  await expect(summary.getByRole('article', { name: 'Pra-observasi' })).toContainText('—')
  await expect(summary.getByRole('article', { name: 'Pasca-observasi' })).toContainText('0')
  await expect(summary.getByRole('alert').filter({ hasText: 'belum dapat dimuat' })).toBeVisible()
  retry = true
  await summary.getByRole('button', { name: 'Muat ulang ringkasan kepala sekolah' }).click()
  await expect(summary.getByRole('article', { name: 'Pra-observasi' })).toContainText('2')
  await expect(summary.getByRole('alert')).toHaveCount(0)
})

test('pending account can edit its profile without school announcements', async ({ page }) => {
  await mockSchool(page, { role: 'pending' })
  await page.goto('/dashboard')
  await expect(page.getByText('Menunggu penetapan peran', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Kabar terbaru' })).toHaveCount(0)
  await page.goto('/akun')
  await page.getByLabel('Nama lengkap').fill('Nama Baru')
  await page.getByRole('button', { name: 'Simpan nama' }).click()
  await expect(page.getByRole('status')).toContainText('Nama berhasil disimpan')
  await page.reload()
  await expect(page.getByLabel('Nama lengkap')).toHaveValue('Nama Baru')
})

test('manager publishes plain text announcement', async ({ page }) => {
  await mockSchool(page)
  await page.goto('/pengumuman')
  await page.getByRole('button', { name: 'Tulis pengumuman' }).click()
  await page.getByLabel('Judul', { exact: true }).fill('Jadwal baru')
  await page.getByLabel('Isi pengumuman').fill('<script>window.unwanted = true</script>\nKegiatan dimulai besok.')
  await page.getByLabel('Status', { exact: true }).selectOption('published')
  await page.getByRole('button', { name: 'Simpan pengumuman' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Pengumuman berhasil disimpan' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Jadwal baru' })).toBeVisible()
  await expect(page.getByText('<script>window.unwanted = true</script>', { exact: false })).toBeVisible()
  expect(await page.evaluate(() => 'unwanted' in window)).toBe(false)
})

test('news network errors show a retry instead of a false empty feed', async ({ page }) => {
  await mockSchool(page, { failNews: true })
  await page.goto('/dashboard')
  await expect(page.getByRole('alert').filter({ hasText: 'Sebagian informasi pengumuman belum dapat dimuat.' })).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Belum ada pengumuman terbit.', { exact: false })).toHaveCount(0)
  await page.goto('/pengumuman')
  await expect(page.getByRole('button', { name: 'Coba lagi', exact: true })).toBeVisible({ timeout: 15000 })
})

test('manager edits and archives existing announcements', async ({ page }) => {
  await mockSchool(page)
  await page.goto('/pengumuman')
  await page.getByRole('button', { name: 'Ubah pengumuman' }).click()
  await page.getByLabel('Judul', { exact: true }).fill('Kegiatan selesai')
  await page.getByLabel('Status', { exact: true }).selectOption('archived')
  await page.getByRole('button', { name: 'Simpan pengumuman' }).click()
  await expect(page.getByRole('heading', { name: 'Kegiatan selesai' })).toBeVisible()
  await expect(page.getByText('Arsip', { exact: true })).toBeVisible()
})

test('announcements paginate without losing the previous page', async ({ page }) => {
  await mockSchool(page, { many: true })
  await page.goto('/pengumuman')
  await expect(page.getByRole('heading', { name: 'Kegiatan literasi' })).toBeVisible()
  await page.getByRole('button', { name: 'Berikutnya' }).click()
  await expect(page.getByText('Halaman 2', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Kabar nomor 11' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Berikutnya' })).toBeDisabled()
  await page.getByRole('button', { name: 'Sebelumnya' }).click()
  await expect(page.getByRole('heading', { name: 'Kegiatan literasi' })).toBeVisible()
})

test('recovery request and password confirmation work', async ({ page }) => {
  await mockSchool(page)
  await page.goto('/lupa-kata-sandi')
  await page.getByLabel('Email akun sekolah').fill(user.email)
  await page.getByRole('button', { name: 'Kirim tautan pemulihan' }).click()
  await expect(page.getByRole('status')).toContainText('Jika email terdaftar')
  await page.goto('/kata-sandi')
  await page.getByLabel('Kata sandi baru', { exact: true }).fill('password-baru')
  await page.getByLabel('Konfirmasi kata sandi baru').fill('password-lain')
  await page.getByRole('button', { name: 'Simpan kata sandi' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Konfirmasi kata sandi belum sama' })).toBeVisible()
  await page.getByLabel('Konfirmasi kata sandi baru').fill('password-baru')
  await page.getByRole('button', { name: 'Simpan kata sandi' }).click()
  await expect(page.getByRole('status')).toContainText('Kata sandi berhasil diubah')
})

test('administrator validates and saves school master data', async ({ page }) => {
  await mockSchool(page)
  await page.goto('/sekolah/subjects')
  await page.getByRole('button', { name: 'Tambah mata pelajaran' }).click()
  await page.getByLabel(/Kode/).fill('lowercase')
  await page.getByLabel('Nama mata pelajaran').fill('Data Contoh Membaca')
  await page.getByRole('button', { name: 'Simpan data' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Kode hanya boleh' })).toBeVisible()
  await page.getByLabel(/Kode/).fill('TEST')
  await page.getByRole('button', { name: 'Simpan data' }).click()
  await expect(page.getByRole('cell', { name: 'Data Contoh Membaca', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Ubah Data Contoh Membaca/ }).click()
  await page.getByLabel('Nama mata pelajaran').fill('Data Contoh Diperbarui')
  await page.getByRole('button', { name: 'Simpan data' }).click()
  await expect(page.getByRole('cell', { name: 'Data Contoh Diperbarui', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('year activation requires explicit confirmation', async ({ page }) => {
  await mockSchool(page)
  await page.goto('/sekolah/academic_years')
  await page.getByRole('button', { name: 'Tambah tahun ajaran' }).click()
  await page.getByLabel('Nama tahun ajaran').fill('Data Contoh 2027/2028')
  await page.getByLabel('Tanggal mulai').fill('2027-07-01')
  await page.getByLabel('Tanggal selesai').fill('2028-06-30')
  await page.getByLabel('Aktif', { exact: true }).check()
  await page.getByRole('button', { name: 'Simpan data' }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await page.getByRole('button', { name: 'Kembali periksa' }).click()
  await expect(page.getByRole('cell', { name: 'Data Contoh 2027/2028', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Simpan data' }).click()
  await page.getByRole('button', { name: 'Ya, aktifkan' }).click()
  await expect(page.getByRole('cell', { name: 'Data Contoh 2027/2028', exact: true })).toBeVisible()
})

test('teacher reads master data without edit controls', async ({ page }) => {
  await mockSchool(page, { role: 'teacher' })
  await page.goto('/sekolah/academic_years')
  await expect(page.getByRole('cell', { name: 'Data Contoh 2026/2027' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tambah tahun ajaran' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Ubah/ })).toHaveCount(0)
  const downloaded = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Ekspor halaman ini (CSV)' }).click()
  expect((await downloaded).suggestedFilename()).toBe('academic_years-halaman-1.csv')
})

test('pending users are denied master data and missing backend gives a useful error', async ({ page }) => {
  await mockSchool(page, { role: 'pending' })
  await page.goto('/sekolah')
  await expect(page.getByText('Peran sekolah Anda belum ditetapkan.', { exact: false })).toBeVisible()
  await expect(page.getByRole('button', { name: /Tambah/ })).toHaveCount(0)
})

test('master data without migration shows preparation state', async ({ page }) => {
  await mockSchool(page, { masterUnavailable: true })
  await page.goto('/sekolah')
  await expect(page.getByRole('alert').filter({ hasText: 'Layanan data sekolah sedang disiapkan' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Coba lagi' })).toBeVisible()
})

test('administrator creates and edits a student without account-management fields', async ({ page }) => {
  await mockSchool(page)
  await page.goto('/sekolah/students')
  await page.getByRole('button', { name: 'Tambah siswa', exact: true }).click()
  await page.getByLabel(/Kode sekolah/).fill('SISWA_01')
  await page.getByLabel('Nama lengkap', { exact: true }).fill('Data Contoh Siswa')
  await expect(page.getByLabel(/Akun|profile_id|Peran/)).toHaveCount(0)
  await page.getByRole('button', { name: 'Simpan data' }).click()
  await expect(page.getByRole('cell', { name: 'Data Contoh Siswa', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Ubah Data Contoh Siswa', exact: true }).click()
  await page.getByLabel('Aktif', { exact: true }).check()
  await page.getByRole('button', { name: 'Simpan data' }).click()
  await expect(page.getByRole('cell', { name: 'Aktif', exact: true })).toBeVisible()
})

test('teacher sees linked registry entry but no students without assignment', async ({ page }) => {
  await mockSchool(page, { role: 'teacher' })
  await page.goto('/sekolah/teachers')
  await expect(page.getByRole('cell', { name: 'Data Contoh Guru Terkait', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Data Contoh Guru Lain', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Tambah guru', exact: true })).toHaveCount(0)
  await page.goto('/sekolah/students')
  await expect(page.getByText('Belum ada data siswa yang dapat ditampilkan untuk akun Anda.', { exact: true })).toBeVisible()
})

test('principal reads teachers and parent cannot enumerate students', async ({ page }) => {
  await mockSchool(page, { role: 'principal' })
  await page.goto('/sekolah/teachers')
  await expect(page.getByRole('cell', { name: 'Data Contoh Guru Lain', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Ubah|Tambah guru/ })).toHaveCount(0)
})

test('parent cannot open student registry without verified relationship support', async ({ page }) => {
  await mockSchool(page, { role: 'parent' })
  await page.goto('/sekolah/students')
  await expect(page.getByText('Anda tidak memiliki izin untuk membuka jenis data ini.', { exact: true })).toBeVisible()
  await expect(page.getByRole('table')).toHaveCount(0)
})

test('administrator enrolls a student using labeled selections and explicit confirmation', async ({ page }) => {
  await mockSchool(page, { relationsReady: true })
  await page.goto('/sekolah/class_enrollments')
  await page.getByRole('button', { name: 'Tambah keanggotaan kelas' }).click()
  await page.getByLabel('Siswa', { exact: true }).selectOption('student-test')
  await page.getByLabel('Kelas', { exact: true }).selectOption('class-test')
  await page.getByLabel('Aktif', { exact: true }).check()
  await page.getByRole('button', { name: 'Simpan data' }).click()
  await expect(page.getByRole('alertdialog')).toContainText('Simpan relasi ini?')
  await page.getByRole('button', { name: 'Ya, simpan relasi' }).click()
  await expect(page.getByRole('cell', { name: 'SISWA_01 · Data Contoh Siswa', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Data Contoh Kelas 1A · Data Contoh 2026/2027', exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Ubah SISWA_01/ }).click()
  await expect(page.getByLabel('Siswa', { exact: true })).toBeDisabled()
  await expect(page.getByLabel('Kelas', { exact: true })).toBeDisabled()
  await page.getByLabel('Aktif', { exact: true }).uncheck()
  await page.getByRole('button', { name: 'Simpan data' }).click()
  const updating = page.waitForRequest(request => request.method() === 'PATCH' && request.url().includes('/class_enrollments'))
  await page.getByRole('button', { name: 'Ya, simpan relasi' }).click()
  expect((await updating).postDataJSON()).toEqual({ is_active: false })
  await expect(page.getByRole('cell', { name: 'Nonaktif', exact: true })).toBeVisible()
})

test('administrator assigns a teacher to class and subject', async ({ page }) => {
  await mockSchool(page, { relationsReady: true })
  await page.goto('/sekolah/teacher_assignments')
  await page.getByRole('button', { name: 'Tambah penugasan guru' }).click()
  await page.getByLabel('Guru', { exact: true }).selectOption('teacher-test')
  await page.getByLabel('Kelas', { exact: true }).selectOption('class-test')
  await page.getByLabel('Mata pelajaran', { exact: true }).selectOption('subject-test')
  await page.getByLabel('Aktif', { exact: true }).check()
  await page.getByRole('button', { name: 'Simpan data' }).click()
  await page.getByRole('button', { name: 'Kembali periksa' }).click()
  await expect(page.getByRole('cell', { name: /Data Contoh Guru Terkait/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Simpan data' }).click()
  await page.getByRole('button', { name: 'Ya, simpan relasi' }).click()
  await expect(page.getByRole('cell', { name: 'GURU_01 · Data Contoh Guru Terkait', exact: true })).toBeVisible()
})

test('empty dependencies disable relation creation and parent cannot open relations', async ({ page }) => {
  await mockSchool(page)
  await page.goto('/sekolah/class_enrollments')
  await expect(page.getByRole('button', { name: 'Tambah keanggotaan kelas' })).toBeDisabled()
  await expect(page.getByText('Lengkapi data siswa/guru', { exact: false })).toBeVisible()
})

async function mockAttendance(page: Page, role='teacher', { hasSession=true, conflict=false, failImportResponse=false }={}) {
  await mockSchool(page,{role,relationsReady:true})
  const sessions=hasSession ? [{id:'attendance-session',class_id:'class-test',held_on:schoolToday()}] : []
  const records=[
    {id:'attendance-first',student_id:'student-first',session_id:'attendance-session',student_code:'TEST_1',student_name:'Data Contoh Satu',status:null as string|null,revision:0},
    {id:'attendance-second',student_id:'student-second',session_id:'attendance-session',student_code:'TEST_2',student_name:'Data Contoh Dua',status:hasSession?'present':null,revision:hasSession?1:0},
  ]
  const history: Record<string,unknown>[]=[]
  const imports: Record<string,unknown>[]=[]
  const importRequestIds:string[]=[]
  let failImport=failImportResponse
  await page.route('https://example.supabase.co/rest/v1/teacher_assignments**',route=>route.fulfill({json:[{id:'assignment-test',teacher_id:'teacher-test',class_id:'class-test',subject_id:'subject-test',is_active:true}]}))
  await page.route('https://example.supabase.co/rest/v1/attendance_sessions**',route=>{
    if(route.request().method()==='POST') {
      sessions.push({id:'attendance-session',class_id:'class-test',held_on:schoolToday()})
      return route.fulfill({json:{id:'attendance-session'}})
    }
    return route.fulfill({json:sessions})
  })
  await page.route('https://example.supabase.co/rest/v1/attendance_records**',route=>route.fulfill({json:role==='student' ? records.slice(0,1) : records}))
  await page.route('https://example.supabase.co/rest/v1/attendance_changes**',route=>route.fulfill({json:history}))
  await page.route('https://example.supabase.co/rest/v1/attendance_imports**',route=>route.fulfill({json:imports}))
  await page.route('https://example.supabase.co/rest/v1/rpc/import_attendance',route=>{
    const body=route.request().postDataJSON()
    importRequestIds.push(body.request_id)
    let imported=imports.find(item=>item.id===body.request_id)
    if(!imported) {
      for(const change of body.changes as {id:string;status:string;reason:string}[]) {
        const row=records.find(record=>record.id===change.id)!
        row.status=change.status;row.revision++
      }
      imported={id:body.request_id,source_name:body.source_name,row_count:body.source_rows,changed_count:body.changes.length,created_at:new Date().toISOString()}
      imports.push(imported)
    }
    if(failImport) return route.fulfill({status:503,json:{message:'Response unavailable after commit'}})
    return route.fulfill({json:imported.changed_count})
  })
  await page.route('https://example.supabase.co/rest/v1/rpc/record_attendance',route=>{
    if(conflict) return route.fulfill({status:409,json:{code:'40001',message:'Concurrent update'}})
    const changes=route.request().postDataJSON().changes as {id:string;status:string;reason:string;revision:number}[]
    for(const change of changes) {
      const row=records.find(record=>record.id===change.id)!
      history.unshift({id:`history-${history.length+1}`,record_id:row.id,old_status:row.status,new_status:change.status,reason:change.reason,created_at:new Date().toISOString()})
      row.status=change.status; row.revision++
    }
    return route.fulfill({json:changes.length})
  })
  return {allowImportResponse:()=>{failImport=false},importRequestIds}
}

test('attendance report loads over 1000 records with bounded session queries and exports totals',async({page})=>{
  await mockAttendance(page,'principal')
  const requests: URL[]=[]
  await page.route('https://example.supabase.co/rest/v1/attendance_sessions**',route=>{
    const url=new URL(route.request().url())
    if(!url.searchParams.has('held_on')) return route.fulfill({json:[]})
    requests.push(url)
    return route.fulfill({json:Array.from({length:11},(_,i)=>({id:`report-${i}`,held_on:`2026-11-${String(i+1).padStart(2,'0')}`}))})
  })
  await page.route('https://example.supabase.co/rest/v1/attendance_records**',route=>route.fulfill({json:Array.from({length:100},(_,i)=>({student_id:`pupil-${i}`,student_code:i===2?'002':`TEST_${i}`,student_name:i===2?'=Data Contoh':`Data Contoh ${i}`,status:i===0?null:'present'}))}))
  await page.goto('/absensi')
  const report=page.getByRole('region',{name:'Rekap rentang tanggal'})
  await report.getByLabel('Kelas rekap').selectOption('class-test')
  await report.getByLabel('Tanggal awal rekap').fill('2026-11-01')
  await report.getByLabel('Tanggal akhir rekap').fill('2026-11-11')
  await report.getByRole('button',{name:'Tampilkan rekap'}).click()
  await expect(report.getByRole('status')).toContainText('11 sesi terlihat')
  await expect(report.locator('tbody tr')).toHaveCount(100)
  await expect(report.locator('tbody tr').filter({has:page.getByRole('cell',{name:'TEST_0',exact:true})})).toContainText('11')
  expect(requests[0].searchParams.get('class_id')).toBe('eq.class-test')
  expect(requests[0].searchParams.getAll('held_on')).toEqual(['gte.2026-11-01','lte.2026-11-11'])
  const download=page.waitForEvent('download')
  await report.getByRole('button',{name:'Ekspor rekap (CSV)'}).click()
  const stream=await (await download).createReadStream()
  const chunks:Buffer[]=[];for await(const chunk of stream!) chunks.push(Buffer.from(chunk))
  expect(Buffer.concat(chunks).toString('utf8')).toContain('"TEST_1","Data Contoh 1","11","0","0","0","0","11"')
  const excelDownload = page.waitForEvent('download')
  await report.getByRole('button', { name: 'Ekspor rekap (Excel)' }).click()
  const workbook = await excelDownload
  expect(workbook.suggestedFilename()).toBe('rekap-absensi-2026-11-01-2026-11-11.xlsx')
  const rows = await readSheet((await workbook.path())!)
  expect(rows).toHaveLength(101)
  expect(rows.find(row => row[4] === '002')?.slice(4)).toEqual(['002', '=Data Contoh', 11, 0, 0, 0, 0, 11])
  await report.getByLabel('Tanggal akhir rekap').fill('2026-11-12')
  await expect(report.getByRole('button',{name:'Ekspor rekap (CSV)'})).toHaveCount(0)
  await expect(report.getByRole('button',{name:'Ekspor rekap (Excel)'})).toHaveCount(0)
})

test('attendance report rejects long ranges and never exports a partial failed load',async({page})=>{
  await mockAttendance(page)
  await page.goto('/absensi')
  const report=page.getByRole('region',{name:'Rekap rentang tanggal'})
  await report.getByLabel('Kelas rekap').selectOption('class-test')
  await report.getByLabel('Tanggal awal rekap').fill('2026-10-01')
  await report.getByLabel('Tanggal akhir rekap').fill('2026-11-10')
  await report.getByRole('button',{name:'Tampilkan rekap'}).click()
  await expect(report.getByRole('alert').filter({ hasText: 'maksimal 31 hari' })).toBeVisible()
  await page.route('https://example.supabase.co/rest/v1/attendance_sessions**',route=>new URL(route.request().url()).searchParams.has('held_on') ? route.fulfill({json:[{id:'report-ok',held_on:'2026-11-01'},{id:'report-denied',held_on:'2026-11-02'}]}) : route.fallback())
  await page.route('https://example.supabase.co/rest/v1/attendance_records**',route=>new URL(route.request().url()).searchParams.get('session_id')==='eq.report-ok' ? route.fulfill({json:[{student_id:'test',student_code:'TEST',student_name:'Data Contoh',status:'present'}]}) : route.fulfill({status:403,json:{message:'Data Contoh izin dicabut'}}))
  await report.getByLabel('Tanggal awal rekap').fill('2026-11-01')
  await report.getByRole('button',{name:'Tampilkan rekap'}).click()
  await expect(report.getByRole('alert').filter({ hasText: 'belum dapat dimuat lengkap' })).toBeVisible()
  await expect(report.getByRole('button',{name:'Ekspor rekap (CSV)'})).toHaveCount(0)
})

test('student attendance report aggregates only returned own records',async({page})=>{
  await mockAttendance(page,'student')
  await page.goto('/absensi')
  const report=page.getByRole('region',{name:'Rekap rentang tanggal'})
  await report.getByLabel('Kelas rekap').selectOption('class-test')
  await report.getByRole('button',{name:'Tampilkan rekap'}).click()
  await expect(report.locator('tbody tr')).toHaveCount(1)
  await expect(report.getByRole('cell',{name:'Data Contoh Satu',exact:true})).toBeVisible()
  await expect(report.getByText('Data Contoh Dua')).toHaveCount(0)
})

async function mockJournals(page:Page,role='teacher',{failResponse=false,unavailable=false,many=false,noAssignment=false}={}) {
  await mockSchool(page,{role,relationsReady:true})
  const entries:Record<string,unknown>[]=many ? Array.from({length:21},(_,index)=>({id:`journal-${index}`,assignment_id:'assignment-test',held_on:schoolToday(),topic:`Data Contoh Jurnal ${index}`,activities:'Data Contoh Kegiatan',reflection:'',class_name:'Data Contoh Kelas',subject_name:'Data Contoh Mapel',teacher_name:'Data Contoh Guru',academic_year_name:'Data Contoh Tahun',created_at:new Date().toISOString()})) : []
  const requests:Record<string,unknown>[]=[]
  let fail=failResponse
  await page.route('https://example.supabase.co/rest/v1/teacher_assignments**',route=>route.fulfill({json:noAssignment?[]:[{id:'assignment-test',teacher_id:'teacher-test',class_id:'class-test',subject_id:'subject-test',is_active:true}]}))
  await page.route('https://example.supabase.co/rest/v1/teaching_journals**',route=>{
    if(unavailable) return route.fulfill({status:404,json:{code:'PGRST205',message:'Data Contoh backend unavailable'}})
    const url=new URL(route.request().url())
    if(route.request().method()==='POST') {
      const payload=route.request().postDataJSON()
      requests.push(payload)
      if(entries.some(item=>item.id===payload.id)) return route.fulfill({status:409,json:{code:'23505',message:'Data Contoh repeated request'}})
      entries.unshift({...payload,class_name:'Data Contoh Kelas',subject_name:'Data Contoh Mapel',teacher_name:'Data Contoh Guru',academic_year_name:'Data Contoh Tahun',created_at:new Date().toISOString()})
      if(fail) return route.fulfill({status:503,json:{message:'Data Contoh lost response after commit'}})
      return route.fulfill({json:{id:payload.id}})
    }
    if(url.searchParams.has('id')) return route.fulfill({json:entries.find(item=>`eq.${item.id}`===url.searchParams.get('id'))??null})
    const offset=Number(url.searchParams.get('offset')??0)
    const limit=Number(url.searchParams.get('limit')??21)
    return route.fulfill({json:entries.slice(offset,offset+limit)})
  })
  return {entries,requests,allowResponse:()=>{fail=false}}
}

async function fillJournal(page:Page,topic='Data Contoh Topik') {
  await page.getByRole('button',{name:'Catat jurnal hari ini'}).click()
  await page.getByLabel('Penugasan jurnal').selectOption('assignment-test')
  await page.getByLabel('Topik',{exact:true}).fill(topic)
  await page.getByLabel('Kegiatan pembelajaran').fill('Data Contoh Membaca bersama')
  await page.getByLabel('Refleksi (opsional)').fill('Data Contoh Perlu latihan tambahan')
  await page.getByRole('button',{name:'Periksa jurnal'}).click()
}

test('teacher journal confirms before saving and renders plain text snapshots',async({page})=>{
  const mock=await mockJournals(page)
  await page.goto('/jurnal')
  await fillJournal(page,'<b>Data Contoh Topik</b>')
  expect(mock.requests).toHaveLength(0)
  await expect(page.getByRole('alertdialog')).toContainText('Simpan jurnal ini?')
  await page.getByRole('button',{name:'Ya, simpan jurnal'}).click()
  await expect(page.getByRole('status').filter({hasText:'Jurnal mengajar berhasil disimpan.'})).toBeVisible()
  await expect(page.getByRole('heading',{name:'<b>Data Contoh Topik</b>',exact:true})).toBeVisible()
  expect(mock.requests).toHaveLength(1)
  expect(Object.keys(mock.requests[0]).sort()).toEqual(['activities','assignment_id','held_on','id','reflection','topic'])
  await expect(page.getByRole('heading',{name:'<b>Data Contoh Topik</b>',exact:true}).locator('b')).toHaveCount(0)
})

test('teacher journal retries uncertain responses with the same id without duplicate entries',async({page})=>{
  const mock=await mockJournals(page,'teacher',{failResponse:true})
  await page.goto('/jurnal')
  await fillJournal(page)
  await page.getByRole('button',{name:'Ya, simpan jurnal'}).click()
  // The SDK may retry safe UUID-bound requests itself; otherwise the form keeps that UUID.
  const uncertainSave = page.getByRole('alert').filter({ hasText: 'Penyimpanan belum dapat dipastikan.' })
  await expect(page.getByRole('status').filter({hasText:'Jurnal mengajar berhasil disimpan.'}).or(uncertainSave)).toContainText(/berhasil disimpan|belum dapat dipastikan/,{timeout:20000})
  if(await uncertainSave.isVisible()) {
    mock.allowResponse()
    await page.getByRole('button',{name:'Periksa jurnal'}).click()
    await page.getByRole('button',{name:'Ya, simpan jurnal'}).click()
  }
  await expect(page.getByRole('status').filter({hasText:'Jurnal mengajar berhasil disimpan.'})).toBeVisible()
  expect(mock.entries).toHaveLength(1)
  expect(new Set(mock.requests.map(item=>item.id)).size).toBe(1)
})

for(const role of ['administrator','principal']) test(`${role} reads journals without write controls`,async({page})=>{
  await mockJournals(page,role,{many:true})
  await page.goto('/jurnal')
  await expect(page.getByRole('heading',{name:'Data Contoh Jurnal 0',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'Catat jurnal hari ini'})).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Ekspor halaman jurnal (CSV)'})).toBeVisible()
})

for(const role of ['student','parent','pending']) test(`${role} cannot request or view journal entries`,async({page})=>{
  const mock=await mockJournals(page,role,{many:true})
  const reads:string[]=[]
  page.on('request',request=>{if(request.url().includes('/teaching_journals')) reads.push(request.url())})
  await page.goto('/jurnal')
  await expect(page.getByText('Jurnal mengajar hanya tersedia', {exact:false})).toBeVisible()
  expect(reads).toHaveLength(0)
  expect(mock.requests).toHaveLength(0)
})

test('journals show a preparation state when backend is unavailable and disable creation without assignment',async({page})=>{
  await mockJournals(page,'teacher',{unavailable:true})
  await page.goto('/jurnal')
  await expect(page.getByRole('alert').filter({ hasText: 'Layanan jurnal sedang disiapkan' })).toBeVisible()
  await mockJournals(page,'teacher',{noAssignment:true})
  await page.getByRole('button',{name:'Coba lagi'}).click()
  await expect(page.getByRole('button',{name:'Catat jurnal hari ini'})).toBeDisabled()
})

test('journal pagination and CSV export stay within the displayed page',async({page})=>{
  await mockJournals(page,'principal',{many:true})
  await page.goto('/jurnal')
  await expect(page.locator('article.announcement')).toHaveCount(20)
  await page.getByRole('button',{name:'Berikutnya',exact:true}).click()
  await expect(page.locator('article.announcement')).toHaveCount(1)
  await expect(page.getByRole('heading',{name:'Data Contoh Jurnal 20',exact:true})).toBeVisible()
  const download=page.waitForEvent('download')
  await page.getByRole('button',{name:'Ekspor halaman jurnal (CSV)'}).click()
  const stream=await (await download).createReadStream()
  const chunks:Buffer[]=[];for await(const chunk of stream!) chunks.push(Buffer.from(chunk))
  const csv=Buffer.concat(chunks).toString('utf8')
  expect(csv).toContain('Data Contoh Jurnal 20')
  expect(csv).not.toContain('Data Contoh Jurnal 0')
})

test('attendance teacher records unmarked pupils then corrects with a reason',async({page})=>{
  await mockAttendance(page)
  await page.goto('/absensi')
  await expect(page.getByLabel('Status Data Contoh Satu',{exact:true})).toHaveValue('')
  await page.getByLabel('Status Data Contoh Satu',{exact:true}).selectOption('present')
  await page.getByRole('button',{name:'Simpan absensi',exact:true}).click()
  await expect(page.getByRole('alertdialog')).toContainText('Simpan 1 perubahan?')
  await page.getByRole('button',{name:'Ya, simpan absensi'}).click()
  await expect(page.getByRole('status').filter({hasText:'catatan kehadiran berhasil disimpan'})).toBeVisible()
  await expect(page.getByLabel('Status Data Contoh Satu',{exact:true})).toHaveValue('present')
  await page.getByLabel('Status Data Contoh Dua',{exact:true}).selectOption('sick')
  await page.getByRole('button',{name:'Simpan absensi',exact:true}).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Isi alasan koreksi' })).toBeVisible()
  await page.getByLabel('Alasan koreksi Data Contoh Dua',{exact:true}).fill('Data Contoh Koreksi')
  await page.getByRole('button',{name:'Simpan absensi',exact:true}).click()
  await page.getByRole('button',{name:'Ya, simpan absensi'}).click()
  await expect(page.getByText('Data Contoh Koreksi',{exact:true})).toBeVisible()
})

test('attendance student sees own record without editors or staff history',async({page})=>{
  await mockAttendance(page,'student')
  await page.goto('/absensi')
  await expect(page.getByRole('cell',{name:'Data Contoh Satu',exact:true})).toBeVisible()
  await expect(page.getByRole('cell',{name:'Data Contoh Dua',exact:true})).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Simpan absensi',exact:true})).toHaveCount(0)
  await expect(page.getByRole('heading',{name:'Riwayat pencatatan dan koreksi'})).toHaveCount(0)
})

for(const role of ['administrator','principal']) test(`attendance ${role} reports without attendance-write controls`,async({page})=>{
  await mockAttendance(page,role)
  await page.goto('/absensi')
  await expect(page.getByRole('cell',{name:'Data Contoh Satu',exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'Simpan absensi',exact:true})).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Mulai sesi hari ini'})).toHaveCount(0)
  const downloaded=page.waitForEvent('download')
  await page.getByRole('button',{name:'Ekspor data tersimpan (CSV)'}).click()
  expect((await downloaded).suggestedFilename()).toBe(`absensi-${schoolToday()}.csv`)
})

test('attendance parent is denied without exposing class records',async({page})=>{
  await mockAttendance(page,'parent')
  await page.goto('/absensi')
  await expect(page.getByText('Anda belum memiliki akses absensi.',{exact:false})).toBeVisible()
  await expect(page.getByRole('table')).toHaveCount(0)
})

test('attendance conflict preserves edits until explicit reload',async({page})=>{
  await mockAttendance(page,'teacher',{conflict:true})
  await page.goto('/absensi')
  await page.getByLabel('Status Data Contoh Satu',{exact:true}).selectOption('present')
  await page.getByRole('button',{name:'Simpan absensi',exact:true}).click()
  await page.getByRole('button',{name:'Ya, simpan absensi'}).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Data telah diubah pada sesi lain' })).toBeVisible()
  await expect(page.getByLabel('Status Data Contoh Satu',{exact:true})).toHaveValue('present')
  page.once('dialog',dialog=>dialog.accept())
  await page.getByRole('button',{name:'Muat ulang absensi'}).click()
  await expect(page.getByLabel('Status Data Contoh Satu',{exact:true})).toHaveValue('')
})

test('attendance session creation confirms today’s roster and starts unmarked',async({page})=>{
  await mockAttendance(page,'teacher',{hasSession:false})
  await page.goto('/absensi')
  await page.getByLabel('Kelas penugasan').selectOption('class-test')
  await page.getByRole('button',{name:'Mulai sesi hari ini'}).click()
  await expect(page.getByRole('alertdialog')).toContainText('Buat sesi dengan peserta aktif kelas ini?')
  await page.getByRole('button',{name:'Ya, buat sesi'}).click()
  await expect(page.getByLabel('Status Data Contoh Satu',{exact:true})).toHaveValue('')
  await expect(page.getByLabel('Status Data Contoh Dua',{exact:true})).toHaveValue('')
})

async function importFixture(rows:string[][]) {
  const label=`${schoolToday()} · Data Contoh Kelas 1A · Data Contoh 2026/2027`
  const all=[['Sesi absensi',label],['Kode siswa','Status','Alasan koreksi'],...rows]
  return writeExcelFile(all.map(row=>row.map(value=>({type:String,value})))).toBuffer()
}

test('xlsx import previews and confirms before writing attendance',async({page})=>{
  const mock=await mockAttendance(page)
  const buffer=await importFixture([['TEST_1','Hadir','']])
  await page.goto('/absensi')
  const downloaded=page.waitForEvent('download')
  await page.getByRole('button',{name:'Unduh template Excel'}).click()
  expect((await downloaded).suggestedFilename()).toBe(`template-absensi-${schoolToday()}.xlsx`)
  await expect(page.getByRole('button',{name:'Unduh template Excel'})).toBeEnabled()
  await expect(page.getByLabel('Pilih file Excel')).toBeEnabled()
  await page.getByLabel('Pilih file Excel').setInputFiles({name:'data-contoh.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer})
  // Parsing happens in a worker; keep the first preview assertion tolerant of a loaded CI machine.
  await expect(page.getByRole('heading',{name:'Preview impor',exact:true})).toBeVisible({timeout:15000})
  await expect(page.getByRole('table',{name:'Perubahan dari file Excel'})).toContainText('Data Contoh Satu')
  expect(mock.importRequestIds.length).toBe(0)
  await page.getByRole('button',{name:'Konfirmasi impor',exact:true}).click()
  await expect(page.getByRole('alertdialog')).toContainText('Impor 1 perubahan')
  await page.getByRole('button',{name:'Ya, impor absensi'}).click()
  await expect(page.getByRole('status').filter({hasText:'catatan kehadiran berhasil diimpor'})).toBeVisible()
  await expect(page.getByLabel('Status Data Contoh Satu',{exact:true})).toHaveValue('present')
  await expect(page.getByText('data-contoh.xlsx',{exact:true})).toBeVisible()
})

test('xlsx import rejects duplicate pupils and file types without sending a mutation',async({page})=>{
  const mock=await mockAttendance(page)
  await page.goto('/absensi')
  await expect(page.getByLabel('Pilih file Excel')).toBeEnabled()
  await page.getByLabel('Pilih file Excel').setInputFiles({name:'invalid.xls',mimeType:'application/octet-stream',buffer:Buffer.from('bad')})
  await expect(page.getByRole('alert').filter({ hasText: 'Gunakan file Excel .xlsx' })).toBeVisible()
  await page.getByLabel('Pilih file Excel').setInputFiles({name:'duplicate.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:await importFixture([['TEST_1','Hadir',''],['TEST_1','Sakit','']])})
  await expect(page.getByRole('alert').filter({ hasText: 'kode siswa berulang' })).toBeVisible()
  await expect(page.getByRole('button',{name:'Konfirmasi impor',exact:true})).toBeDisabled()
  expect(mock.importRequestIds.length).toBe(0)
})

test('xlsx retry reuses the same request after an uncertain response',async({page})=>{
  const mock=await mockAttendance(page,'teacher',{failImportResponse:true})
  await page.goto('/absensi')
  await expect(page.getByLabel('Pilih file Excel')).toBeEnabled()
  await page.getByLabel('Pilih file Excel').setInputFiles({name:'retry.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:await importFixture([['TEST_1','Hadir','']])})
  await page.getByRole('button',{name:'Konfirmasi impor',exact:true}).click()
  await page.getByRole('button',{name:'Ya, impor absensi'}).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Impor belum dapat dikonfirmasi' })).toBeVisible({timeout:15000})
  mock.allowImportResponse()
  await page.getByRole('button',{name:'Konfirmasi impor',exact:true}).click()
  await page.getByRole('button',{name:'Ya, impor absensi'}).click()
  await expect(page.getByRole('status').filter({hasText:'catatan kehadiran berhasil diimpor'})).toBeVisible()
  expect(new Set(mock.importRequestIds).size).toBe(1)
  await expect(page.getByText('retry.xlsx',{exact:true})).toHaveCount(1)
})

for (const { role, attendance, journals } of [
  { role: 'teacher', attendance: true, journals: true },
  { role: 'student', attendance: true, journals: false },
  { role: 'parent', attendance: false, journals: false },
]) {
  test(`main navigation follows the ${role} profile`, async ({ page }) => {
    await mockSchool(page, { role })
    await page.goto('/')
    const navigation = page.getByRole('navigation', { name: 'Navigasi utama' })
    await expect(navigation.getByRole('link', { name: 'Pengumuman', exact: true })).toBeVisible()
    await expect(navigation.getByRole('link', { name: 'Absensi', exact: true })).toHaveCount(Number(attendance))
    await expect(navigation.getByRole('link', { name: 'Jurnal', exact: true })).toHaveCount(Number(journals))
    await expect(navigation.getByRole('link', { name: 'Beranda', exact: true })).toHaveAttribute('aria-current', 'page')
  })
}

async function mockAssessments(page: Page, { role = 'teacher', empty = false, conflict = false } = {}) {
  await mockSchool(page, { role })
  const assessment = {
    id: 'assessment-example', title: 'Data Contoh Asesmen', assessment_type: 'formative', held_on: schoolToday(),
    maximum_score: 20, class_name: 'Kelas 1A', subject_name: 'Matematika', status: role === 'teacher' ? 'draft' : 'published',
    revision: 1, student_count: 1, graded_count: role === 'teacher' ? 0 : 1,
  }
  const result = { id: 'result-example', student_name: 'Data Contoh Siswa', student_code: 'CONTOH01', score: role === 'teacher' ? null as number | null : 10, feedback: '', revision: 0 }
  const history: Record<string, unknown>[] = []
  let created = !empty
  await page.route('**/rest/v1/teacher_assignments?*', route => route.fulfill({ json: [{ id: 'assignment-example', school_classes: { name: 'Kelas 1A' }, subjects: { name: 'Matematika' } }] }))
  await page.route('**/rest/v1/assessments?*', route => {
    const request = route.request()
    if (request.method() === 'POST') {
      const payload = request.postDataJSON()
      expect(payload).toMatchObject({ assignment_id: 'assignment-example', title: 'Data Contoh Asesmen', assessment_type: 'formative', held_on: schoolToday(), maximum_score: 20 })
      created = true
      return route.fulfill({ json: { id: assessment.id } })
    }
    if (request.method() === 'PATCH') {
      expect(new URL(request.url()).searchParams.get('revision')).toBe(`eq.${assessment.revision}`)
      Object.assign(assessment, request.postDataJSON(), { revision: assessment.revision + 1 })
      return route.fulfill({ json: { id: assessment.id } })
    }
    return route.fulfill({ json: created ? [assessment] : [] })
  })
  await page.route('**/rest/v1/assessment_results?*', route => {
    const request = route.request()
    if (request.method() === 'PATCH') {
      expect(new URL(request.url()).searchParams.get('revision')).toBe(`eq.${result.revision}`)
      if (conflict) {
        result.score = 9; result.revision += 1; assessment.revision += 1; assessment.graded_count = 1
        return route.fulfill({ json: null })
      }
      const payload = request.postDataJSON()
      const old = result.score
      Object.assign(result, payload, { revision: result.revision + 1 })
      assessment.revision += 1
      assessment.graded_count = result.score === null ? 0 : 1
      history.unshift({ id: `event-${result.revision}`, old_score: old, score: result.score, feedback: result.feedback,
        change_reason: payload.change_reason, revision: result.revision, created_at: '2026-11-12T01:00:00Z' })
      return route.fulfill({ json: { id: result.id } })
    }
    expect(new URL(request.url()).searchParams.get('assessment_id')).toBe('eq.assessment-example')
    return route.fulfill({ json: [result] })
  })
  await page.route('**/rest/v1/assessment_result_events?*', route => {
    expect(new URL(route.request().url()).searchParams.get('result_id')).toBe('eq.result-example')
    return route.fulfill({ json: history })
  })
}

async function mockAcademicReport(page: Page, mode: 'normal' | 'truncated' | 'overflow' | 'failure' = 'normal', role = 'teacher') {
  await mockSchool(page, { role })
  const base = { class_id: 'class-one', class_name: 'Kelas 1A', subject_id: 'math', subject_name: 'Matematika',
    assessment_type: 'formative', held_on: schoolToday(), maximum_score: 20, status: 'published', revision: 0, graded_count: 1, student_count: 1 }
  const assessments = [
    { ...base, id: 'a', title: 'Data Contoh Awal' },
    { ...base, id: 'b', title: 'Data Contoh Lanjutan', maximum_score: 10 },
    { ...base, id: 'c', title: 'Data Contoh Draf', status: 'draft' },
    { ...base, id: 'd', title: 'Data Contoh Bahasa', subject_id: 'language', subject_name: 'Bahasa' },
  ]
  const records = [
    { id: 'r1', student_id: 'one', student_code: '001', student_name: '=Data Contoh', score: 0, assessments: assessments[0] },
    { id: 'r2', student_id: 'one', student_code: '001', student_name: '=Data Contoh', score: 5, assessments: assessments[1] },
    { id: 'r3', student_id: 'two', student_code: '002', student_name: 'Data Contoh Lain', score: 10, assessments: assessments[0] },
    { id: 'r4', student_id: 'one', student_code: '001', student_name: '=Data Contoh', score: null, assessments: assessments[2] },
    { id: 'r5', student_id: 'one', student_code: '001', student_name: '=Data Contoh', score: 20, assessments: assessments[3] },
  ]
  const visibleHeaders = assessments.filter(row => role === 'teacher' || row.status === 'published')
  await page.route('**/rest/v1/assessments?*', route => route.fulfill({ json: visibleHeaders,
    headers: { 'content-range': `0-${visibleHeaders.length - 1}/${visibleHeaders.length}`, 'access-control-expose-headers': 'content-range' } }))
  await page.route('**/rest/v1/assessment_results?*', route => {
    const params = new URL(route.request().url()).searchParams
    expect(params.getAll('assessments.held_on')).toEqual([`gte.${schoolToday().slice(0,8)}01`, `lte.${schoolToday()}`])
    expect(params.get('limit')).toBe('501')
    if (mode === 'failure') return route.fulfill({ status: 403, json: { code: '42501', message: 'Permission revoked' } })
    const filtered = records.filter(row => role === 'teacher' || (row.student_id === 'one' && row.assessments.status === 'published'))
      .filter(row => (!params.has('assessments.subject_id') || params.get('assessments.subject_id') === `eq.${row.assessments.subject_id}`)
      && (!params.has('assessments.class_id') || params.get('assessments.class_id') === `eq.${row.assessments.class_id}`))
    return route.fulfill({ json: mode === 'truncated' ? filtered.slice(0,1) : filtered,
      headers: { 'content-range': `0-${filtered.length - 1}/${mode === 'overflow' ? 501 : filtered.length}`, 'access-control-expose-headers': 'content-range' } })
  })
}

test('academic report filters identities, charts published scores and exports complete CSV Excel PDF', async ({ page }, testInfo) => {
  await mockAcademicReport(page)
  await page.goto('/asesmen')
  await page.getByText('Rekap dan perkembangan akademik', { exact: true }).click()
  const report = page.getByRole('region', { name: 'Rekap akademik', exact: true })
  await report.getByRole('button', { name: 'Tampilkan rekap akademik' }).click()
  await expect(report.getByRole('status')).toContainText('5 hasil dimuat')
  await report.getByLabel('Kelas rekap akademik', { exact: true }).selectOption('class-one')
  await report.getByLabel('Mata pelajaran rekap akademik', { exact: true }).selectOption('math')
  await expect(report.getByRole('button', { name: 'Ekspor akademik (CSV)' })).toHaveCount(0)
  await report.getByRole('button', { name: 'Tampilkan rekap akademik' }).click()
  await report.getByLabel('Siswa rekap akademik', { exact: true }).selectOption('one')
  await expect(report.locator('tbody tr')).toHaveCount(3)
  await expect(report.getByRole('meter')).toHaveCount(2)
  await expect(report.getByRole('meter').nth(0)).toHaveAttribute('value','0')
  await expect(report.getByRole('meter').nth(1)).toHaveAttribute('value','50')
  await expect(report.getByRole('cell', { name: 'Data Contoh Lain', exact: true })).toHaveCount(0)
  const download = page.waitForEvent('download')
  await report.getByRole('button', { name: 'Ekspor akademik (CSV)' }).click()
  const stream = await (await download).createReadStream()
  const chunks: Buffer[] = []; for await (const chunk of stream!) chunks.push(Buffer.from(chunk))
  const csv = Buffer.concat(chunks).toString('utf8')
  expect(csv).toContain('"001","\'=Data Contoh","0","20","0"')
  expect(csv).not.toContain('Data Contoh Lain')
  const excelDownload = page.waitForEvent('download')
  await report.getByRole('button', { name: 'Ekspor akademik (Excel)' }).click()
  const workbook = await excelDownload
  const values = await readSheet((await workbook.path())!)
  expect(values).toHaveLength(4)
  expect(values[1].slice(6)).toEqual(['001','=Data Contoh',0,20,0])
  expect(values[2].slice(8)).toEqual([5,10,50])
  expect(values[3][8]).toBeNull()
  const pdfDownload = page.waitForEvent('download')
  await report.getByRole('button', { name: 'Ekspor akademik (PDF)' }).click()
  const pdf = await pdfDownload
  expect(pdf.suggestedFilename()).toBe(`rekap-akademik-${schoolToday().slice(0,8)}01-${schoolToday()}.pdf`)
  await pdf.saveAs(testInfo.outputPath('academic-report.pdf'))
  const pdfStream = await pdf.createReadStream()
  const pdfChunks: Buffer[] = []; for await (const chunk of pdfStream!) pdfChunks.push(Buffer.from(chunk))
  expect(Buffer.concat(pdfChunks).subarray(0,5).toString()).toBe('%PDF-')
  await report.getByLabel('Tanggal akhir rekap akademik').fill('2026-11-01')
  await expect(report.getByRole('table')).toHaveCount(0)
  await expect(report.getByRole('button', { name: 'Ekspor akademik (Excel)' })).toHaveCount(0)
  await expect(report.getByRole('button', { name: 'Ekspor akademik (PDF)' })).toHaveCount(0)
})

for (const mode of ['truncated','overflow','failure'] as const) {
  test(`academic report blocks ${mode} results from display and export`, async ({ page }) => {
    await mockAcademicReport(page, mode)
    await page.goto('/asesmen')
    await page.getByText('Rekap dan perkembangan akademik', { exact: true }).click()
    const report = page.getByRole('region', { name: 'Rekap akademik', exact: true })
    await report.getByRole('button', { name: 'Tampilkan rekap akademik' }).click()
    await expect(report.getByRole('alert').filter({ hasText: /terlalu besar|melebihi 500 hasil|gagal dimuat lengkap/ })).toBeVisible()
    await expect(report.getByRole('table')).toHaveCount(0)
    await expect(report.getByRole('button', { name: 'Ekspor akademik (CSV)' })).toHaveCount(0)
    await expect(report.getByRole('button', { name: 'Ekspor akademik (PDF)' })).toHaveCount(0)
  })
}

test('parent academic report exposes only published child results and no draft selector', async ({ page }) => {
  await mockAcademicReport(page, 'normal', 'parent')
  await page.goto('/asesmen')
  await page.getByText('Rekap dan perkembangan akademik', { exact: true }).click()
  const report = page.getByRole('region', { name: 'Rekap akademik', exact: true })
  await report.getByRole('button', { name: 'Tampilkan rekap akademik' }).click()
  await expect(report.getByRole('status')).toContainText('3 hasil dimuat')
  await expect(report.getByLabel('Publikasi rekap akademik')).toHaveCount(0)
  await expect(report.getByRole('cell', { name: 'Data Contoh Draf', exact: true })).toHaveCount(0)
  await expect(report.getByRole('cell', { name: 'Data Contoh Lain', exact: true })).toHaveCount(0)
})

test('pending profile cannot open academic report through navigation or direct URL', async ({ page }) => {
  await mockSchool(page, { role: 'pending' })
  await page.goto('/asesmen')
  await expect(page.getByText('Akun ini belum memiliki akses asesmen.', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Asesmen', exact: true })).toHaveCount(0)
  await expect(page.getByRole('region', { name: 'Rekap akademik', exact: true })).toHaveCount(0)
})

test('teacher creates an assessment, grades zero, publishes and corrects with history', async ({ page }) => {
  await mockAssessments(page, { empty: true })
  await page.goto('/asesmen')
  await page.getByRole('button', { name: 'Buat asesmen' }).click()
  await page.getByRole('combobox', { name: 'Penugasan', exact: true }).selectOption('assignment-example')
  await page.getByLabel('Judul asesmen').fill('Data Contoh Asesmen')
  await page.getByLabel('Tanggal asesmen').fill(schoolToday())
  await page.getByLabel('Nilai maksimum').fill('20')
  await page.getByRole('button', { name: 'Simpan asesmen', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tinjau publikasi nilai' })).toBeDisabled()
  await expect(page.getByText('CONTOH01 · Belum dinilai')).toBeVisible()
  await page.getByRole('button', { name: 'Isi nilai', exact: true }).click()
  await page.getByLabel('Nilai', { exact: true }).fill('0')
  await page.getByRole('button', { name: 'Simpan nilai', exact: true }).click()
  await expect(page.getByText('CONTOH01 · Nilai 0 / 20')).toBeVisible()
  await expect(page.getByText('1 dari 1 peserta sudah dinilai.')).toBeVisible()
  await page.getByRole('button', { name: 'Tinjau publikasi nilai' }).click()
  await expect(page.getByRole('alertdialog', { name: 'Publikasi nilai' })).toBeVisible()
  await page.getByRole('button', { name: 'Ya, terbitkan nilai' }).click()
  await expect(page.getByText('Hasil asesmen diterbitkan.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Edit asesmen', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Koreksi nilai', exact: true }).click()
  await page.getByLabel('Nilai', { exact: true }).fill('1.5')
  await page.getByLabel('Alasan koreksi').fill('Data Contoh hasil pemeriksaan ulang')
  await page.getByRole('button', { name: 'Simpan nilai', exact: true }).click()
  await expect(page.getByText('CONTOH01 · Nilai 1.5 / 20')).toBeVisible()
  await page.getByRole('button', { name: 'Riwayat nilai', exact: true }).click()
  await expect(page.getByText('0 → 1.5', { exact: true })).toBeVisible()
  await expect(page.getByText('Alasan: Data Contoh hasil pemeriksaan ulang', { exact: true })).toBeVisible()
})

test('assessment revision conflict preserves the form until the latest result is loaded', async ({ page }) => {
  await mockAssessments(page, { conflict: true })
  await page.goto('/asesmen')
  await page.getByRole('button', { name: 'Buka asesmen' }).click()
  await page.getByRole('button', { name: 'Isi nilai', exact: true }).click()
  await page.getByLabel('Nilai', { exact: true }).fill('8')
  await page.getByRole('button', { name: 'Simpan nilai', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Perubahan belum dikonfirmasi' })).toBeVisible()
  await expect(page.getByLabel('Nilai', { exact: true })).toHaveValue('8')
  await expect(page.getByRole('button', { name: 'Simpan nilai', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Coba lagi' }).click()
  await expect(page.getByText('CONTOH01 · Nilai 9 / 20')).toBeVisible()
})

for (const role of ['student', 'parent', 'principal']) {
  test(`${role} reads assessment results without teacher controls`, async ({ page }) => {
    await mockAssessments(page, { role })
    await page.goto('/asesmen')
    await page.getByRole('button', { name: 'Buka asesmen' }).click()
    await expect(page.getByText('CONTOH01 · Nilai 10 / 20')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Isi nilai', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Koreksi nilai', exact: true })).toHaveCount(0)
    if (role !== 'principal') await expect(page.getByRole('button', { name: 'Riwayat nilai', exact: true })).toHaveCount(0)
  })
}

test('teacher saves, edits and publishes task feedback with revision checks', async ({ page }) => {
  await mockSchool(page, { role: 'teacher' })
  await page.route('**/rest/v1/class_materials?*', route => route.fulfill({ json: [{
    id: 'task-example', class_name: 'Kelas 1A', subject_name: 'Matematika',
    title: 'Data Contoh Tugas', body: 'Instruksi contoh', status: 'published', revision: 1, due_on: schoolToday(),
  }] }))
  await page.route('**/rest/v1/task_submissions?*', route => route.fulfill({ json: [{
    id: 'submission-example', student_name: 'Data Contoh Siswa', answer: 'Jawaban contoh',
  }] }))
  let feedback: { id: string; student_name: string; feedback: string; status: string; revision: number } | null = null
  await page.route('**/rest/v1/task_feedback?*', async route => {
    const request = route.request()
    if (request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({ submission_id: 'submission-example', feedback: 'Periksa langkah kedua' })
      feedback = { id: 'feedback-example', student_name: 'Data Contoh Siswa', feedback: 'Periksa langkah kedua', status: 'draft', revision: 0 }
      return route.fulfill({ json: feedback })
    }
    if (request.method() === 'PATCH') {
      expect(feedback).not.toBeNull()
      expect(new URL(request.url()).searchParams.get('revision')).toBe(`eq.${feedback!.revision}`)
      feedback = { ...feedback!, ...request.postDataJSON(), revision: feedback!.revision + 1 }
      return route.fulfill({ json: feedback })
    }
    expect(new URL(request.url()).searchParams.get('submission_id')).toBe('eq.submission-example')
    return route.fulfill({ json: feedback ? [feedback] : [] })
  })
  await page.goto('/tugas')
  await page.getByRole('button', { name: 'Lihat jawaban siswa' }).click()
  await page.getByLabel('Catatan umpan balik').fill('Periksa langkah kedua')
  await page.getByRole('button', { name: 'Simpan draf umpan balik' }).click()
  await expect(page.getByText('Draf — belum dibagikan', { exact: true })).toBeVisible()
  await page.getByLabel('Catatan umpan balik').fill('Langkah kedua sudah tepat')
  await page.getByRole('button', { name: 'Simpan draf umpan balik' }).click()
  await expect(page.getByRole('paragraph').filter({ hasText: /^Langkah kedua sudah tepat$/ })).toBeVisible()
  await page.getByRole('button', { name: 'Tinjau publikasi' }).click()
  await expect(page.getByRole('alertdialog', { name: 'Publikasi umpan balik' })).toBeVisible()
  await page.getByRole('button', { name: 'Ya, terbitkan umpan balik' }).click()
  await expect(page.getByText('Umpan balik diterbitkan.', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Catatan umpan balik')).toHaveCount(0)
  await page.reload()
  await page.getByRole('button', { name: 'Lihat jawaban siswa' }).click()
  await expect(page.getByText('Langkah kedua sudah tepat', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Catatan umpan balik')).toHaveCount(0)
})

test('parent reads published child feedback without submission or editing access', async ({ page }) => {
  await mockSchool(page, { role: 'parent' })
  await page.route('**/rest/v1/class_materials?*', route => route.fulfill({ json: [{
    id: 'task-example', class_name: 'Kelas 1A', subject_name: 'Matematika',
    title: 'Data Contoh Tugas', body: 'Instruksi contoh', status: 'published', revision: 1, due_on: schoolToday(),
  }] }))
  await page.route('**/rest/v1/task_feedback?*', route => {
    expect(route.request().method()).toBe('GET')
    expect(new URL(route.request().url()).searchParams.get('task_id')).toBe('eq.task-example')
    return route.fulfill({ json: [{ id: 'feedback-example', student_name: 'Data Contoh Anak', feedback: 'Penjelasan sudah tepat', status: 'published', revision: 2 }] })
  })
  await page.goto('/tugas')
  await page.getByRole('button', { name: 'Lihat umpan balik anak' }).click()
  await expect(page.getByText('Data Contoh Anak', { exact: true })).toBeVisible()
  await expect(page.getByText('Penjelasan sudah tepat', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Catatan umpan balik')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Lihat jawaban siswa' })).toHaveCount(0)
})

for (const outcome of ['success', 'response-lost', 'duplicate'] as const) {
test(`student submits a task answer and sees it after reopening: ${outcome}`, async ({ page }) => {
  await mockSchool(page, { role: 'student' })
  await page.route('**/rest/v1/class_materials?*', route => route.fulfill({ json: [{
    id: 'task-example', class_name: 'Kelas 1A', subject_name: 'Matematika',
    title: 'Data Contoh Tugas', body: 'Instruksi contoh', status: 'published', revision: 1, due_on: schoolToday(),
  }] }))
  let submitted: Record<string, string> | null = null
  let posts = 0
  await page.route('**/rest/v1/task_submissions?*', async route => {
    if (route.request().method() === 'POST') {
      posts += 1
      expect(route.request().postDataJSON()).toEqual({ task_id: 'task-example', answer: 'Jawaban contoh' })
      submitted = { id: 'submission-example', student_name: 'Data Contoh Siswa', answer: 'Jawaban contoh' }
      if (outcome === 'response-lost') return route.abort('failed')
      if (outcome === 'duplicate') return route.fulfill({ status: 409, json: { code: '23505', message: 'Already submitted' } })
      return route.fulfill({ json: submitted })
    }
    return route.fulfill({ json: submitted ? [submitted] : [] })
  })
  await page.goto('/tugas')
  await page.getByRole('button', { name: 'Buka jawaban saya' }).click()
  await page.getByLabel('Jawaban teks').fill('  Jawaban contoh  ')
  await page.getByRole('button', { name: 'Kirim jawaban' }).click()
  if (outcome === 'response-lost') {
    await expect(page.getByRole('alert').filter({ hasText: 'Jawaban belum dikonfirmasi' })).toBeVisible()
    await expect(page.getByLabel('Jawaban teks')).toHaveValue('  Jawaban contoh  ')
    await expect(page.getByRole('button', { name: 'Kirim jawaban' })).toBeDisabled()
    await page.getByRole('button', { name: 'Muat ulang', exact: true }).click()
  }
  await expect(page.getByText('Jawaban contoh', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Kirim jawaban' })).toHaveCount(0)
  await page.reload()
  await page.getByRole('button', { name: 'Buka jawaban saya' }).click()
  await expect(page.getByText('Jawaban contoh', { exact: true })).toBeVisible()
  expect(posts).toBe(1)
})
}

test('schedule admin handles conflicts and pending direct access is denied', async ({ page }) => {
  await mockSchool(page)
  await page.route('**/rest/v1/lesson_schedules?**', route => route.fulfill({ json: [] }))
  await page.route('**/rest/v1/teacher_assignments?**', route => route.fulfill({ json: [{ id: 'assignment-test', teachers: { name: 'Data Contoh Guru' }, school_classes: { name: 'Data Contoh Kelas' }, subjects: { name: 'Data Contoh Pelajaran' } }] }))
  await page.route('**/rest/v1/rpc/save_lesson_schedule', async route => {
    expect(route.request().postDataJSON()).toMatchObject({ p_revision: null, p_start: 480, p_end: 540, p_active: true })
    await route.fulfill({ status: 409, json: { code: '23P01', message: 'Conflict' } })
  })
  await page.goto('/jadwal')
  await page.getByRole('button', { name: 'Tambah jadwal' }).click()
  await page.getByLabel('Penugasan').selectOption('assignment-test')
  await page.getByLabel('Alasan pengaturan').fill('Data Contoh pengaturan')
  await page.getByRole('button', { name: 'Simpan jadwal' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Jadwal bentrok' })).toBeVisible()
  await expect(page.getByLabel('Alasan pengaturan')).toHaveValue('Data Contoh pengaturan')
  await page.getByRole('button', { name: 'Muat ulang jadwal', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Jadwal baru' })).toHaveCount(0)
})

test('schedule pending direct URL blocks management', async ({ page }) => {
  await mockSchool(page, { role: 'pending' })
  await page.goto('/jadwal')
  await expect(page.getByText('Akun ini belum memiliki akses jadwal.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tambah jadwal' })).toHaveCount(0)
})

test('teacher proposes a schedule change without directly editing the schedule', async ({ page }) => {
  await mockSchool(page, { role: 'teacher' })
  const row = { id: 'schedule-test', assignment_id: 'assignment-test', class_name: 'Data Contoh Kelas', subject_name: 'Data Contoh Pelajaran', teacher_name: 'Data Contoh Guru', weekday: 1, start_minute: 480, end_minute: 540, effective_from: schoolToday(), effective_until: schoolToday(), revision: 3, is_active: true }
  await page.route('**/rest/v1/lesson_schedules?**', route => route.fulfill({ json: [row] }))
  let saved = false
  await page.route('**/rest/v1/rpc/propose_schedule', async route => {
    expect(route.request().postDataJSON()).toMatchObject({ p_schedule: row.id, p_revision: 3, p_start: 600, p_end: 660, p_reason: 'Data Contoh alasan guru' })
    saved = true
    await route.fulfill({ json: 'proposal-test' })
  })
  await page.goto('/jadwal')
  await page.getByRole('button', { name: 'Usulkan perubahan Data Contoh Pelajaran' }).click()
  await page.getByLabel('Jam mulai').fill('10:00')
  await page.getByLabel('Jam selesai').fill('11:00')
  await page.getByLabel('Alasan pengaturan').fill('Data Contoh alasan guru')
  await page.getByRole('button', { name: 'Kirim usulan' }).click()
  await expect(page.getByRole('heading', { name: 'Usulan perubahan jadwal', exact: true })).toBeVisible()
  expect(saved).toBe(true)
  await expect(page.getByRole('button', { name: 'Tambah jadwal' })).toHaveCount(0)
})

test('administrator reviews schedule proposal snapshots and a stale decision remains recoverable', async ({ page }) => {
  await mockSchool(page)
  await page.route('**/rest/v1/lesson_schedules?**', route => route.fulfill({ json: [] }))
  const original = { class_name: 'Data Contoh Kelas', teacher_name: 'Data Contoh Guru', subject_name: 'Data Contoh Pelajaran', weekday: 1, start_minute: 480, end_minute: 540, effective_from: schoolToday(), effective_until: schoolToday() }
  await page.route('**/rest/v1/schedule_proposals?**', route => route.fulfill({ json: [{ ...original, original, id: 'proposal-test', start_minute: 600, end_minute: 660, reason: 'Data Contoh alasan', status: 'pending', decision_reason: null }] }))
  await page.route('**/rest/v1/rpc/decide_schedule_proposal', async route => {
    expect(route.request().postDataJSON()).toMatchObject({ p_id: 'proposal-test', p_accept: true, p_reason: 'Data Contoh persetujuan' })
    await route.fulfill({ status: 409, json: { code: '40001', message: 'Stale revision' } })
  })
  await page.goto('/jadwal')
  await expect(page.getByText(/^Semula:/)).toContainText('08:00–09:00')
  await expect(page.getByText(/^Usulan:/)).toContainText('10:00–11:00')
  await page.getByRole('combobox', { name: 'Keputusan', exact: true }).selectOption('accept')
  await page.getByLabel('Alasan keputusan').fill('Data Contoh persetujuan')
  await page.getByRole('button', { name: 'Simpan keputusan' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Jadwal atau keputusan telah berubah' })).toBeVisible()
  await page.getByRole('button', { name: 'Muat ulang usulan' }).click()
  await expect(page.getByRole('button', { name: 'Simpan keputusan' })).toBeEnabled()
})

test('schedule history shows creation, deactivation, paging and retry for principal', async ({ page }) => {
  await mockSchool(page, { role: 'principal' })
  const row = { id: 'schedule-history', class_name: 'Data Contoh Kelas', subject_name: 'Data Contoh Riwayat', teacher_name: 'Data Contoh Guru', weekday: 1, start_minute: 0, end_minute: 60, effective_from: schoolToday(), effective_until: schoolToday(), is_active: false, revision: 1 }
  await page.route('**/rest/v1/lesson_schedules?**', route => route.fulfill({ json: [row] }))
  let failed = true
  await page.route('**/rest/v1/lesson_schedule_events?**', async route => {
    const params = new URL(route.request().url()).searchParams
    expect(params.get('schedule_id')).toBe('eq.schedule-history')
    if (failed) { await route.fulfill({ status: 400, json: { message: 'Unavailable' } }); return }
    const event = { id: 'history', old_values: { ...row, is_active: true, revision: 0 }, new_values: row, reason: 'Data Contoh alasan nonaktif', created_at: '2026-11-13T01:00:00Z' }
    await route.fulfill({ json: Number(params.get('offset')) >= 20 ? [{ ...event, old_values: null, reason: 'Data Contoh pembuatan' }] : Array.from({ length: 21 }, (_, i) => ({ ...event, id: `history-${i}` })) })
  })
  await page.goto('/jadwal')
  await page.getByRole('button', { name: 'Lihat riwayat Data Contoh Riwayat' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Riwayat gagal dimuat' })).toBeVisible()
  failed = false
  await page.getByRole('button', { name: 'Muat ulang riwayat' }).click()
  await expect(page.getByText(/^Sesudah:/).first()).toContainText('00:00–01:00')
  await expect(page.getByText(/^Sesudah:/).first()).toContainText('Nonaktif')
  await page.getByRole('button', { name: 'Riwayat berikutnya' }).click()
  await expect(page.getByRole('heading', { name: 'Jadwal dibuat' })).toBeVisible()
  await expect(page.getByText('Alasan: Data Contoh pembuatan')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Riwayat berikutnya' })).toBeDisabled()
  await page.getByRole('button', { name: 'Tutup riwayat Data Contoh Riwayat' }).click()
  await expect(page.getByRole('region', { name: 'Riwayat perubahan jadwal' })).toHaveCount(0)
})


test('schedule class filter queries server across pages and distinguishes school years', async ({ page }) => {
  await mockSchool(page, { role: 'parent' })
  await page.route('**/rest/v1/school_classes?**', route => route.fulfill({ json: [
    { id: 'class-a', name: 'Data Contoh Kelas 1', academic_years: { name: '2026/2027' } },
    { id: 'class-b', name: 'Data Contoh Kelas 1', academic_years: { name: '2027/2028' } },
  ] }))
  const row = { id: 'schedule', class_name: 'Data Contoh Kelas 1', subject_name: 'Data Contoh Umum', teacher_name: 'Data Contoh Guru', weekday: 1, start_minute: 480, end_minute: 540, effective_from: schoolToday(), effective_until: schoolToday(), is_active: true }
  await page.route('**/rest/v1/lesson_schedules?**', async route => {
    const params = new URL(route.request().url()).searchParams
    if (params.has('class_id')) {
      expect(params.get('class_id')).toBe('eq.class-b')
      expect(params.get('offset')).toBe('0')
      expect(params.get('is_active')).toBe('eq.true')
      await route.fulfill({ json: [{ ...row, subject_name: 'Data Contoh Terpilih' }] })
    } else await route.fulfill({ json: Array.from({ length: 26 }, (_, i) => ({ ...row, id: `schedule-${i}` })) })
  })
  await page.goto('/jadwal')
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click()
  await expect(page.getByText('Halaman 2', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Kelas jadwal' }).selectOption({ label: 'Data Contoh Kelas 1 · 2027/2028' })
  await expect(page.getByText('Halaman 1', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Data Contoh Terpilih · Data Contoh Kelas 1' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Data Contoh Umum · Data Contoh Kelas 1' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Lihat riwayat/ })).toHaveCount(0)
})

for (const role of ['administrator', 'teacher', 'parent', 'pending']) {
  test(`release dashboard services follow ${role} access`, async ({ page }, testInfo) => {
    await mockSchool(page, { role })
    await page.goto('/dashboard')
    const services = page.getByRole('region', { name: 'Akses cepat' })
    if (role === 'pending') await expect(services.getByRole('link', { name: /Jadwal pelajaran/ })).toHaveCount(0)
    else await expect(services.getByRole('link', { name: /Jadwal pelajaran/ })).toBeVisible()
    await expect(services.getByRole('link', { name: /Siapkan data sekolah/ })).toHaveCount(role === 'administrator' ? 1 : 0)
    await expect(services.getByRole('link', { name: /Kehadiran anak/ })).toHaveCount(role === 'parent' ? 1 : 0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    if (role === 'administrator') await page.screenshot({ path: testInfo.outputPath('dashboard-release.png'), fullPage: true })
  })
}

test('school overview uses exact active counts and preserves unknown versus zero', async ({ page }) => {
  await mockSchool(page)
  let retry = false
  for (const table of ['students', 'teachers', 'school_classes']) {
    await page.route(`**/rest/v1/${table}?**`, async route => {
      expect(route.request().method()).toBe('HEAD')
      expect(new URL(route.request().url()).searchParams.get('is_active')).toBe('eq.true')
      const count = table === 'students' ? 1205 : table === 'teachers' ? 0 : 6
      await route.fulfill({ status: 200, headers: table === 'school_classes' && !retry ? {} : { 'content-range': `*/${count}`, 'access-control-expose-headers': 'content-range' } })
    })
  }
  await page.goto('/dashboard')
  await expect(page.getByRole('article', { name: 'Siswa aktif' })).toContainText('1205')
  await expect(page.getByRole('article', { name: 'Guru aktif' })).toContainText('0')
  await expect(page.getByRole('article', { name: 'Kelas aktif' })).toContainText('—')
  await expect(page.getByRole('alert').filter({ hasText: 'Sebagian jumlah belum dapat dimuat' })).toBeVisible()
  retry = true
  await page.getByRole('button', { name: 'Muat ulang ringkasan' }).click()
  await expect(page.getByRole('article', { name: 'Kelas aktif' })).toContainText('6')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

for (const role of ['teacher','student','parent','pending']) test(`school overview never requests registry totals for ${role}`, async ({ page }) => {
  await mockSchool(page, { role })
  let requested = false
  await page.route(/\/rest\/v1\/(students|teachers|school_classes)\?/, async route => { requested = true; await route.fulfill({ status: 403, json: { code: '42501' } }) })
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Akses cepat' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Ringkasan data sekolah' })).toHaveCount(0)
  expect(requested).toBe(false)
})

for (const role of ['teacher','student','parent','pending'] as const) {
  test(`account linking stays closed for ${role} without a mutation`, async ({ page }) => {
    await mockSchool(page, { role })
    await page.goto('/tautan-akun')
    await expect(page.getByText('Halaman ini tersedia untuk administrator sekolah.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tinjau tautan' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Ya, simpan' })).toHaveCount(0)
  })
}

for (const role of ['student','parent','pending'] as const) {
  test(`supervision stays closed for ${role} without a mutation`, async ({ page }) => {
    await mockSchool(page, { role })
    await page.goto('/supervisi')
    await expect(page.getByText('Halaman ini tersedia untuk kepala sekolah dan guru.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Simpan' })).toHaveCount(0)
  })
}
