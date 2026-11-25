import { expect, test, type Page } from '@playwright/test'

const userId = '10000000-0000-4000-8000-000000000031'
const teacherId = '10000000-0000-4000-8000-000000000032'
const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'admin@example.test', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' }
const session = {
  access_token: `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: userId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test-signature`,
  refresh_token: 'browser-test-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user,
}

async function setup(page: Page, role: string, { lastActivity }: { lastActivity?: number } = {}) {
  const calls: { path: string; body?: unknown; search?: string }[] = []
  await page.addInitScript(({ storedSession, activity }) => {
    localStorage.setItem('sb-school-abc-auth-token', JSON.stringify(storedSession))
    if (activity) localStorage.setItem('si-stir:last-activity', String(activity))
  }, { storedSession: session, activity: lastActivity ?? null })
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  await page.route('https://fonts.gstatic.com/**', route => route.abort())
  await page.route('https://school-abc.supabase.co/**', async route => {
    const request = route.request()
    const url = new URL(request.url())
    const json = (data: unknown, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
    const body = request.method() === 'POST' ? request.postDataJSON() : undefined
    calls.push({ path: url.pathname, body, search: url.search })
    if (url.pathname.endsWith('/user')) return json({ user })
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 204 })
    if (url.pathname.endsWith('/profiles')) return json([{ role, full_name: 'Data Contoh Admin' }])
    if (url.pathname.endsWith('/rpc/record_auth_event')) return route.fulfill({ status: 204 })
    if (url.pathname.endsWith('/rpc/audit_actor_names')) return json([{ id: teacherId, full_name: 'Data Contoh Guru' }, { id: userId, full_name: 'Data Contoh Admin' }])
    if (url.pathname.endsWith('/rpc/admin_revoke_sessions')) return json(2)
    if (url.pathname.endsWith('/audit_log')) return json([
      { module: 'keamanan', action: 'login', record_id: null, actor_id: teacherId, occurred_at: '2026-11-25T01:00:00Z' },
      { module: 'peran', action: 'pending → teacher', record_id: teacherId, actor_id: userId, occurred_at: '2026-11-24T01:00:00Z' },
    ])
    if (url.pathname.endsWith('/announcements')) return json([])
    if (url.pathname.endsWith('/rpc/dashboard_overview')) return json({ message: 'Unavailable' }, 503)
    throw new Error(`Permintaan Supabase tidak dikenal: ${request.method()} ${url.pathname}`)
  })
  return calls
}

test('administrator reads the audit log and revokes a teacher session after confirming', async ({ page }) => {
  const calls = await setup(page, 'administrator')
  await page.goto('/audit')
  await expect(page.getByRole('heading', { name: 'Audit log' })).toBeVisible()
  const loginRow = page.getByRole('row').filter({ hasText: 'Masuk' })
  await expect(loginRow).toContainText('Data Contoh Guru')
  await expect(page.getByRole('row').filter({ hasText: 'Perubahan peran' })).toContainText('pending → teacher')
  await loginRow.getByRole('button', { name: 'Cabut sesi akun ini' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Data Contoh Guru')
  expect(calls.some(call => call.path.endsWith('/rpc/admin_revoke_sessions'))).toBe(false)
  await dialog.getByRole('button', { name: 'Cabut sesi' }).click()
  await expect(page.getByRole('status').filter({ hasText: '2 sesi milik Data Contoh Guru dicabut' })).toBeVisible()
  expect(calls.find(call => call.path.endsWith('/rpc/admin_revoke_sessions'))?.body).toEqual({ target: teacherId })
})

for (const role of ['teacher', 'parent', 'pending']) {
  test(`${role} cannot open the audit log and sends no audit request`, async ({ page }) => {
    const calls = await setup(page, role)
    await page.goto('/audit')
    await expect(page.getByText('Audit log hanya tersedia untuk administrator dan kepala sekolah.')).toBeVisible()
    expect(calls.some(call => call.path.endsWith('/audit_log'))).toBe(false)
    await expect(page.getByRole('link', { name: 'Audit log' })).toHaveCount(0)
  })
}

test('signing out of every device records the event before a global sign-out', async ({ page }) => {
  const calls = await setup(page, 'teacher')
  await page.goto('/akun')
  await page.getByRole('button', { name: 'Keluar dari semua perangkat' }).click()
  await expect.poll(() => calls.some(call => call.path.endsWith('/logout'))).toBe(true)
  const auditIndex = calls.findIndex(call => call.path.endsWith('/rpc/record_auth_event'))
  const logout = calls.findIndex(call => call.path.endsWith('/logout'))
  expect(calls[auditIndex]?.body).toEqual({ event: 'logout_all' })
  expect(auditIndex).toBeLessThan(logout)
  expect(calls[logout].search).toContain('scope=global')
})

test('an idle session warns first, can be kept, and signs out once the limit passes', async ({ page }) => {
  await setup(page, 'teacher', { lastActivity: Date.now() - 29.5 * 60 * 1000 })
  await page.goto('/akun')
  const warning = page.getByRole('alertdialog', { name: 'Sesi hampir berakhir' })
  await expect(warning).toBeVisible()
  await warning.getByRole('button', { name: 'Tetap masuk' }).click()
  await expect(warning).toHaveCount(0)

  await page.evaluate(() => localStorage.setItem('si-stir:last-activity', String(Date.now() - 31 * 60 * 1000)))
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByText('Sesi berakhir karena tidak ada aktivitas selama 30 menit.')).toBeVisible()
})
