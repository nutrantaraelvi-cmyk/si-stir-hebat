import { expect, test, type Page } from '@playwright/test'

const userId = '10000000-0000-4000-8000-000000000041'
const user = {
  id: userId,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'murid@example.test',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
}
const session = {
  access_token: `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test-signature`,
  refresh_token: 'browser-test-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user,
}

type HabitRow = {
  id: string
  student_id: string
  record_date: string
  habits: boolean[]
  notes: string
  validation_status: 'pending' | 'validated'
  validated_by: string | null
  validated_at: string | null
  validation_note: string
  revision: number
  updated_at: string
}

function makeHabitRow(overrides: Partial<HabitRow> = {}): HabitRow {
  return {
    id: 'habit-one',
    student_id: 'student-one',
    record_date: '2026-11-19',
    habits: [true, true, false, false, false, false, false],
    notes: 'Data Contoh tidur cukup',
    validation_status: 'pending',
    validated_by: null,
    validated_at: null,
    validation_note: '',
    revision: 0,
    updated_at: '2026-11-19T01:00:00.000Z',
    ...overrides,
  }
}

type WeeklyRow = {
  student_id: string
  student_name: string
  days_expected: number
  days_filled: number
  days_missing: number
  bangun_pagi: number
  beribadah: number
  berolahraga: number
  makan_sehat: number
  gemar_belajar: number
  bermasyarakat: number
  tidur_cepat: number
}

function makeWeeklyRow(overrides: Partial<WeeklyRow> = {}): WeeklyRow {
  return {
    student_id: 'student-one',
    student_name: 'Saya',
    days_expected: 5,
    days_filled: 3,
    days_missing: 2,
    bangun_pagi: 3,
    beribadah: 2,
    berolahraga: 1,
    makan_sehat: 2,
    gemar_belajar: 1,
    bermasyarakat: 0,
    tidur_cepat: 2,
    ...overrides,
  }
}

async function installSession(page: Page) {
  await page.addInitScript(({ storedSession }) => {
    localStorage.setItem('sb-school-abc-auth-token', JSON.stringify(storedSession))
  }, { storedSession: session })
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.route('https://fonts.gstatic.com/**', route => route.abort())
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
}

async function setupStudent(page: Page) {
  const saved: Array<Record<string, unknown>> = []
  const weeklyTargets: Array<string | null> = []
  const records: HabitRow[] = []

  await installSession(page)
  await page.route('https://school-abc.supabase.co/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })

    if (url.pathname.endsWith('/user')) return json({ user })
    if (url.pathname.endsWith('/profiles')) return json([{ role: 'student' }])
    if (url.pathname.endsWith('/rpc/habit_students')) return json([{ id: 'student-one', name: 'Saya' }])
    if (url.pathname.endsWith('/rpc/habit_weekly_summary')) {
      weeklyTargets.push((request.postDataJSON()?.target_student ?? null) as string | null)
      return json([makeWeeklyRow()])
    }

    if (url.pathname.endsWith('/habit_records')) {
      if (request.method() === 'POST') {
        const payload = request.postDataJSON()
        saved.push(payload)
        const row = makeHabitRow({
          record_date: payload.record_date,
          habits: payload.habits,
          notes: payload.notes,
          updated_at: '2026-11-19T02:00:00.000Z',
        })
        records.unshift(row)
        return json(row, 201)
      }
      const start = Number(url.searchParams.get('offset') ?? 0)
      const limit = Number(url.searchParams.get('limit') ?? 26)
      return json(records.slice(start, start + limit))
    }

    throw new Error(`Permintaan Supabase tidak dikenal: ${request.method()} ${url.pathname}`)
  })

  return { saved, records, weeklyTargets }
}

async function setupTeacher(page: Page, record: HabitRow) {
  const revisions: Array<string | null> = []
  const bodies: Array<Record<string, unknown>> = []

  await installSession(page)
  await page.route('https://school-abc.supabase.co/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })

    if (url.pathname.endsWith('/user')) return json({ user })
    if (url.pathname.endsWith('/profiles')) return json([{ role: 'teacher' }])
    if (url.pathname.endsWith('/rpc/habit_students')) return json([{ id: 'student-one', name: 'Data Contoh Siswa A' }])
    if (url.pathname.endsWith('/rpc/habit_weekly_summary')) return json([makeWeeklyRow({ student_name: 'Data Contoh Siswa A', days_filled: 4, days_missing: 1 })])

    if (url.pathname.endsWith('/habit_records')) {
      if (request.method() === 'PATCH') {
        const payload = request.postDataJSON()
        bodies.push(payload)
        revisions.push(url.searchParams.get('revision'))
        record.validation_status = 'validated'
        record.validation_note = String(payload.validation_note ?? '')
        record.revision = Number(payload.revision ?? 1)
        record.validated_by = userId
        record.validated_at = '2026-11-19T03:00:00.000Z'
        return json(record)
      }
      const start = Number(url.searchParams.get('offset') ?? 0)
      const limit = Number(url.searchParams.get('limit') ?? 26)
      return json([record].slice(start, start + limit))
    }

    throw new Error(`Permintaan Supabase tidak dikenal: ${request.method()} ${url.pathname}`)
  })

  return { revisions, bodies }
}

test('pending account cannot open habits', async ({ page }) => {
  let rosterCalls = 0
  await installSession(page)
  await page.route('https://school-abc.supabase.co/**', route => {
    const request = route.request()
    const url = new URL(request.url())
    const json = (data: unknown) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
    if (url.pathname.endsWith('/user')) return json({ user })
    if (url.pathname.endsWith('/profiles')) return json([{ role: 'pending' }])
    if (url.pathname.endsWith('/rpc/habit_students') || url.pathname.endsWith('/rpc/habit_weekly_summary')) {
      rosterCalls += 1
      return json([])
    }
    throw new Error(`Permintaan Supabase tidak dikenal: ${request.method()} ${url.pathname}`)
  })

  await page.goto('/kebiasaan')
  await expect(page.getByText('Halaman kebiasaan tidak tersedia untuk peran ini.')).toBeVisible()
  await expect(page.getByRole('link', { name: '7 Kebiasaan' })).toHaveCount(0)
  expect(rosterCalls).toBe(0)
})

test('student can see own habit recap but cannot submit a daily record', async ({ page }) => {
  const state = await setupStudent(page)

  await page.goto('/kebiasaan')
  await expect(page.getByRole('heading', { name: '7 Kebiasaan Anak Indonesia Hebat' })).toBeVisible()
  await expect(page.getByText('Wali mengisi catatan harian untuk anak. Anda dapat melihat catatan milik sendiri dan rekap yang diizinkan.')).toBeVisible()
  await expect(page.getByText('Catatan harian: belum diisi', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Bangun pagi/ })).toHaveCount(0)
  await expect(page.getByLabel('Catatan tambahan')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Simpan catatan' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Rekap minggu ini' })).toBeVisible()
  await expect(page.getByText(/Minggu ini 3 dari 5 hari terisi\./)).toBeVisible()
  await expect(page.getByText(/2 hari belum diisi, bukan berarti tidak dilakukan/)).toBeVisible()
  expect(state.weeklyTargets[0]).toBe('student-one')

  expect(state.saved).toHaveLength(0)
  await expectNoHorizontalOverflow(page)
})

test('teacher requires a note before validating a habit record', async ({ page }) => {
  const record = makeHabitRow()
  const state = await setupTeacher(page, record)

  await page.goto('/kebiasaan')
  await expect(page.getByRole('heading', { name: 'Data Contoh Siswa A' })).toBeVisible()
  await expect(page.getByText('Menunggu validasi guru', { exact: true })).toBeVisible()
  await expect(page.getByText('Berolahraga: belum ditandai', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Validasi setelah konfirmasi orang tua' }).click()
  await expect(page.getByText('Catatan validasi wajib diisi sebelum menandai tervalidasi.')).toBeVisible()
  expect(state.bodies).toHaveLength(0)

  await page.getByLabel('Catatan validasi').fill('Data Contoh sudah dikonfirmasi ke orang tua')
  await page.getByRole('button', { name: 'Validasi setelah konfirmasi orang tua' }).click()

  await expect(page.getByText('Catatan berhasil divalidasi.')).toBeVisible()
  await expect(page.getByText('Tervalidasi', { exact: true })).toBeVisible()
  await expect(page.getByText('Catatan guru: Data Contoh sudah dikonfirmasi ke orang tua')).toBeVisible()

  expect(state.bodies).toHaveLength(1)
  expect(state.revisions).toEqual(['eq.0'])
  expect(state.bodies[0].validation_status).toBe('validated')
  expect(state.bodies[0].revision).toBe(1)
  await expectNoHorizontalOverflow(page)
})

test('empty date is shown as belum diisi and an all-empty checklist is not saved', async ({ page }) => {
  const state = await setupStudent(page)

  await page.goto('/kebiasaan')
  await expect(page.getByText('Wali mengisi catatan harian', { exact: false })).toHaveCount(0)
  await expect(page.getByText('Catatan harian: belum diisi', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Belum ada catatan kebiasaan. Tanggal tanpa catatan berarti belum diisi, bukan berarti tidak dilakukan.')).toBeVisible()

  await expect(page.getByRole('button', { name: 'Simpan catatan' })).toHaveCount(0)
  expect(state.saved).toHaveLength(0)
  await expectNoHorizontalOverflow(page)
})

test('recent recap stays per-child and is labeled as growth, not ranking', async ({ page }) => {
  const state = await setupStudent(page)
  state.records.push(makeHabitRow())

  await page.goto('/kebiasaan')
  await expect(page.getByRole('heading', { name: 'Rekap 1 catatan terakhir' })).toBeVisible()
  await expect(page.getByText(/Rekap ini untuk melihat perkembangan anak, bukan peringkat atau perbandingan antarmurid\./)).toBeVisible()
  await expect(page.getByText(/Peringkat|Juara|Terbaik/)).toHaveCount(0)
  await expectNoHorizontalOverflow(page)
})

async function setupParentWithTwoChildren(page: Page) {
  const saved: Array<Record<string, unknown>> = []
  const weeklyTargets: Array<string> = []
  const records: HabitRow[] = [
    makeHabitRow({ id: 'habit-a', student_id: 'student-one', notes: 'Data Contoh catatan anak A' }),
    makeHabitRow({ id: 'habit-b', student_id: 'student-two', notes: 'Data Contoh catatan anak B' }),
  ]

  await installSession(page)
  await page.route('https://school-abc.supabase.co/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })

    if (url.pathname.endsWith('/user')) return json({ user })
    if (url.pathname.endsWith('/profiles')) return json([{ role: 'parent' }])
    if (url.pathname.endsWith('/rpc/habit_students')) return json([
      { id: 'student-one', name: 'Data Contoh Anak A' },
      { id: 'student-two', name: 'Data Contoh Anak B' },
    ])
    if (url.pathname.endsWith('/rpc/habit_weekly_summary')) {
      const target = String(request.postDataJSON()?.target_student ?? 'student-one')
      weeklyTargets.push(target)
      const isSecond = target === 'student-two'
      return json([makeWeeklyRow({
        student_id: target,
        student_name: isSecond ? 'Data Contoh Anak B' : 'Data Contoh Anak A',
        days_filled: isSecond ? 1 : 4,
        days_missing: isSecond ? 4 : 1,
      })])
    }

    if (url.pathname.endsWith('/habit_records')) {
      if (request.method() === 'POST') {
        const payload = request.postDataJSON()
        saved.push(payload)
        const row = makeHabitRow({
          id: 'habit-b-new',
          student_id: String(payload.student_id),
          record_date: payload.record_date,
          habits: payload.habits,
          notes: payload.notes,
          updated_at: '2026-11-19T02:00:00.000Z',
        })
        records.unshift(row)
        return json(row, 201)
      }
      const filter = url.searchParams.get('student_id') ?? ''
      const rows = filter.startsWith('eq.') ? records.filter(row => row.student_id === filter.slice(3)) : records
      const start = Number(url.searchParams.get('offset') ?? 0)
      const limit = Number(url.searchParams.get('limit') ?? 26)
      return json(rows.slice(start, start + limit))
    }

    throw new Error(`Permintaan Supabase tidak dikenal: ${request.method()} ${url.pathname}`)
  })

  return { saved, weeklyTargets }
}

test('parent with two linked children picks one child and saves for that child only', async ({ page }) => {
  const state = await setupParentWithTwoChildren(page)

  await page.goto('/kebiasaan')
  const picker = page.getByLabel('Pilih murid')
  await expect(picker).toBeVisible()
  await expect(picker).toHaveValue('student-one')
  await expect(page.getByRole('heading', { name: 'Data Contoh Anak A' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Data Contoh Anak B' })).toHaveCount(0)
  await expect(page.getByText('Catatan harian: belum diisi', { exact: true })).toBeVisible()
  await expect(page.getByText(/Minggu ini 4 dari 5 hari terisi\./)).toBeVisible()

  await picker.selectOption('student-two')
  await expect(page.getByRole('heading', { name: 'Data Contoh Anak B' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Data Contoh Anak A' })).toHaveCount(0)
  await expect(page.getByText('Catatan harian: belum diisi', { exact: true })).toBeVisible()
  await expect(page.getByText(/Minggu ini 1 dari 5 hari terisi\./)).toBeVisible()
  expect(state.weeklyTargets[state.weeklyTargets.length - 1]).toBe('student-two')

  await page.getByRole('button', { name: /Beribadah/ }).click()
  await page.getByLabel('Catatan tambahan').fill('Data Contoh anak B beribadah')
  await page.getByRole('button', { name: 'Simpan catatan' }).click()

  await expect(page.getByText(/tersimpan dan menunggu validasi guru/)).toBeVisible()
  expect(state.saved).toHaveLength(1)
  expect(state.saved[0].student_id).toBe('student-two')
  expect(state.saved[0].habits).toEqual([false, true, false, false, false, false, false])
  await expect(page.getByText('Catatan harian: sudah diisi', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Data Contoh Anak A' })).toHaveCount(0)
  await expectNoHorizontalOverflow(page)
})
