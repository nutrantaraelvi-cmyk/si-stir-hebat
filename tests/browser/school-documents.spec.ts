import { expect, test, type Page } from '@playwright/test'

const userId = '10000000-0000-4000-8000-000000000041'
const user = {
  id: userId,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'guru@example.test',
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

type DocumentStatus = 'draft' | 'submitted' | 'approved' | 'needs_revision' | 'archived'
type DocumentRow = {
  id: string
  owner_profile_id: string
  category: 'rkt'
  title: string
  description: string
  file_path: string
  mime_type: string
  file_size: number
  status: DocumentStatus
  review_note: string
  revision: number
  created_at: string
  updated_at: string
}

function makeDocument(overrides: Partial<DocumentRow> = {}): DocumentRow {
  return {
    id: 'document-one',
    owner_profile_id: userId,
    category: 'rkt',
    title: 'Data Contoh RKT 2026/2027',
    description: 'Data Contoh keterangan dokumen',
    file_path: 'document-one/data-contoh-rkt.pdf',
    mime_type: 'application/pdf',
    file_size: 2048,
    status: 'draft',
    review_note: '',
    revision: 0,
    created_at: '2026-11-19T01:00:00.000Z',
    updated_at: '2026-11-19T01:00:00.000Z',
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

async function mockSupabase(page: Page, role: string, initial: DocumentRow[]) {
  const documents = [...initial]
  const versions = new Map(initial.map(item => [item.id, [{
    id: `${item.id}-version-1`, document_id: item.id, version_number: 1, file_path: item.file_path,
    mime_type: item.mime_type, file_size: item.file_size, uploaded_by: item.owner_profile_id, created_at: item.created_at,
  }]]))
  const reviews = new Map<string, Array<Record<string, unknown>>>()
  const tableReads: string[] = []
  const downloadedPaths: string[] = []
  let inserted = 0
  let patches = 0

  await installSession(page)
  await page.route('**/*', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })

    if (url.hostname === 'school-abc.storage.supabase.co' && url.pathname.includes('/object/school-documents/')) {
      const path = decodeURIComponent(url.pathname.split('/object/school-documents/')[1] ?? '')
      if (request.method() === 'GET') {
        downloadedPaths.push(path)
        return route.fulfill({ status: 200, contentType: 'application/pdf', body: Buffer.from('Data Contoh berkas dokumen') })
      }
      if (request.method() === 'POST') return json({ Key: `school-documents/${path}` })
    }

    if (!url.hostname.endsWith('.supabase.co')) return route.continue()

    if (url.pathname.endsWith('/user')) return json({ user })
    if (url.pathname.endsWith('/profiles')) return json([{ role }])
    if (url.pathname.endsWith('/document_categories')) return json([
      { key: 'rkt', label: 'Rencana Kerja Tahunan (RKT)', is_active: true },
      { key: 'ksp', label: 'Kurikulum Satuan Pendidikan (KSP)', is_active: true },
    ])

    if (url.pathname.includes('/storage/v1/object/school-documents/') && request.method() === 'GET') {
      const path = decodeURIComponent(url.pathname.split('/school-documents/')[1] ?? '')
      downloadedPaths.push(path)
      return route.fulfill({ status: 200, contentType: 'application/pdf', body: Buffer.from('Data Contoh berkas dokumen') })
    }
    if (url.pathname.includes('/storage/v1/object/school-documents/') && request.method() === 'POST') {
      const path = decodeURIComponent(url.pathname.split('/school-documents/')[1] ?? '')
      return json({ Key: `school-documents/${path}` })
    }

    if (url.pathname.endsWith('/document_versions') && request.method() === 'GET') {
      const documentId = url.searchParams.get('document_id')?.replace(/^eq\./, '') ?? ''
      return json(versions.get(documentId) ?? [])
    }
    if (url.pathname.endsWith('/document_reviews') && request.method() === 'GET') {
      const documentId = url.searchParams.get('document_id')?.replace(/^eq\./, '') ?? ''
      return json(reviews.get(documentId) ?? [])
    }

    if (url.pathname.endsWith('/school_documents')) {
      if (request.method() === 'GET') {
        tableReads.push(url.pathname)
        const start = Number(url.searchParams.get('offset') ?? 0)
        const limit = Number(url.searchParams.get('limit') ?? 26)
        return json(documents.slice(start, start + limit))
      }
      if (request.method() === 'POST') {
        inserted += 1
        const payload = request.postDataJSON()
        const created = makeDocument({ title: payload.title, description: payload.description, category: 'rkt' })
        documents.unshift(created)
        return json(created, 201)
      }
      if (request.method() === 'PATCH') {
        patches += 1
        const payload = request.postDataJSON()
        const current = documents[0]
        const updated = { ...current, ...payload, status: (payload.status ?? current.status) as DocumentStatus, revision: payload.revision, review_note: payload.review_note ?? current.review_note }
        documents[0] = updated
        if (typeof payload.file_path === 'string') {
          const currentVersions = versions.get(current.id) ?? []
          versions.set(current.id, [{
            id: `${current.id}-version-${currentVersions.length + 1}`, document_id: current.id,
            version_number: currentVersions.length + 1, file_path: payload.file_path, mime_type: payload.mime_type,
            file_size: payload.file_size, uploaded_by: userId, created_at: '2026-11-19T02:00:00.000Z',
          }, ...currentVersions])
        }
        if (typeof payload.status === 'string' && payload.status !== current.status) {
          const currentReviews = reviews.get(current.id) ?? []
          reviews.set(current.id, [{
            id: `${current.id}-review-${currentReviews.length + 1}`, document_id: current.id,
            reviewer_profile_id: userId, from_status: current.status, to_status: payload.status,
            note: payload.review_note ?? '', created_at: '2026-11-19T02:00:00.000Z',
          }, ...currentReviews])
        }
        return json(updated)
      }
    }

    throw new Error(`Permintaan Supabase tidak dikenal: ${request.method()} ${url.pathname}`)
  })

  return { documents, inserted: () => inserted, patches: () => patches, tableReads, downloadedPaths }
}

test('teacher uploads a document draft and submits it', async ({ page }) => {
  const state = await mockSupabase(page, 'teacher', [])

  await page.goto('/dokumen')
  await expect(page.getByRole('heading', { name: 'Dokumen sekolah', level: 1 })).toBeVisible()
  await expect(page.getByText('Belum ada dokumen sekolah yang dapat Anda lihat.')).toBeVisible()

  await page.getByLabel('Judul dokumen').fill('Data Contoh RKT 2026/2027')
  await page.getByLabel('Berkas', { exact: true }).setInputFiles({
    name: 'data-contoh-rkt.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('data contoh'),
  })
  await page.getByRole('button', { name: 'Simpan draf' }).click()

  await expect(page.getByText('Draf dokumen tersimpan. Ajukan persetujuan setelah berkas siap diperiksa kepala sekolah.')).toBeVisible()
  await expect(page.getByRole('article').getByText('Draf', { exact: true })).toBeVisible()
  expect(state.inserted()).toBe(1)

  await page.getByRole('button', { name: 'Ajukan persetujuan' }).click()
  await expect(page.getByText('Dokumen diajukan untuk persetujuan kepala sekolah.')).toBeVisible()
  await expect(page.getByRole('article').getByText('Menunggu persetujuan', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Setujui dokumen' })).toHaveCount(0)
  expect(state.patches()).toBe(1)
})

test('principal approves and archives a submitted document', async ({ page }) => {
  const state = await mockSupabase(page, 'principal', [makeDocument({ status: 'submitted', owner_profile_id: 'teacher-profile' })])

  await page.goto('/dokumen')
  await expect(page.getByRole('heading', { name: 'Data Contoh RKT 2026/2027' })).toBeVisible()
  await expect(page.getByLabel('Judul dokumen')).toHaveCount(0)

  const note = page.getByLabel('Catatan pemeriksa untuk Data Contoh RKT 2026/2027')
  await note.fill('ok')
  await page.getByRole('button', { name: 'Kembalikan dengan catatan' }).click()
  await expect(page.getByText('wajib diisi minimal 5 karakter')).toBeVisible()
  expect(state.patches()).toBe(0)

  await page.getByRole('button', { name: 'Setujui dokumen' }).click()
  await expect(page.getByText('Dokumen disetujui.')).toBeVisible()
  expect(state.patches()).toBe(1)

  const archiveButton = page.getByRole('button', { name: 'Arsipkan dokumen' })
  await expect(archiveButton).toBeVisible()
  await archiveButton.click()
  const dialog = page.getByRole('dialog', { name: 'Arsipkan dokumen ini?' })
  await expect(dialog).toBeVisible()
  const confirmButton = dialog.getByRole('button', { name: 'Ya, arsipkan' })
  const cancelButton = dialog.getByRole('button', { name: 'Batal' })
  await expect(confirmButton).toBeFocused()

  await page.keyboard.press('Tab')
  await expect(cancelButton).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(confirmButton).toBeFocused()
  expect(state.patches()).toBe(1)

  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(archiveButton).toBeFocused()
  expect(state.patches()).toBe(1)

  await archiveButton.click()
  await dialog.getByRole('button', { name: 'Ya, arsipkan' }).click()
  await expect(page.getByText('Dokumen diarsipkan.')).toBeVisible()
  await expect(page.getByRole('article').getByText('Diarsipkan', { exact: true })).toBeVisible()
  expect(state.patches()).toBe(2)
})

test('teacher uploads a replacement and downloads current and previous document versions', async ({ page }) => {
  const state = await mockSupabase(page, 'teacher', [makeDocument({ status: 'needs_revision' })])

  await page.goto('/dokumen')
  await page.getByLabel('Ganti berkas dengan versi baru').setInputFiles({
    name: 'data-contoh-rkt-v2.pdf', mimeType: 'application/pdf', buffer: Buffer.from('versi baru'),
  })
  await page.getByRole('button', { name: 'Unggah versi baru' }).click()
  await expect(page.getByText('Versi baru untuk “Data Contoh RKT 2026/2027” tersimpan.')).toBeVisible()

  await page.getByRole('button', { name: 'Unduh berkas dokumen' }).click()
  await expect(page.getByText('Berkas “Data Contoh RKT 2026/2027” tidak dapat diunduh. Periksa akses dokumen atau coba lagi.')).toHaveCount(0)

  await page.getByRole('button', { name: 'Lihat riwayat versi & tinjauan' }).click()
  await expect(page.getByText('Versi berkas:')).toBeVisible()
  await page.getByRole('button', { name: 'Unduh versi 1' }).click()
  await expect(page.getByText('Berkas “Data Contoh RKT 2026/2027” tidak dapat diunduh. Periksa akses dokumen atau coba lagi.')).toHaveCount(0)
  expect(state.downloadedPaths).toEqual([])
})

for (const role of ['parent', 'student', 'pending'] as const) {
  test(`${role} cannot open school documents`, async ({ page }) => {
    const state = await mockSupabase(page, role, [])

    await page.goto('/dokumen')
    await expect(page.getByText('Halaman ini tersedia untuk guru, kepala sekolah, dan administrator.')).toBeVisible()
    await expect(page.getByLabel('Judul dokumen')).toHaveCount(0)
    expect(state.tableReads).toEqual([])
  })
}

test('teacher pages through school documents and clears the truncation notice on the last page', async ({ page }) => {
  const documents = Array.from({ length: 26 }, (_, index) => makeDocument({
    id: `document-${index + 1}`,
    title: `Data Contoh RKT ${index + 1}`,
    file_path: `document-${index + 1}/data-contoh-rkt.pdf`,
  }))
  await mockSupabase(page, 'teacher', documents)

  await page.goto('/dokumen')
  const pager = page.getByRole('navigation', { name: 'Halaman dokumen sekolah' })
  const truncation = page.getByText('Daftar terpotong; muat halaman berikutnya.')

  await expect(page.getByRole('heading', { name: 'Data Contoh RKT 1', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Data Contoh RKT 26', exact: true })).toHaveCount(0)
  await expect(truncation).toBeVisible()
  await expect(pager.getByText('Halaman 1', { exact: true })).toBeVisible()

  await pager.getByRole('button', { name: 'Berikutnya' }).click()
  await expect(page.getByRole('heading', { name: 'Data Contoh RKT 26', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Data Contoh RKT 1', exact: true })).toHaveCount(0)
  await expect(pager.getByText('Halaman 2', { exact: true })).toBeVisible()
  await expect(truncation).toHaveCount(0)
})
