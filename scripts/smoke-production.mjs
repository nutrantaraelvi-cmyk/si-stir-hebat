const baseUrl = (process.argv[2] ?? process.env.SMOKE_BASE_URL ?? '').trim().replace(/\/+$/, '')

if (!baseUrl) {
  console.error('Pemakaian: node scripts/smoke-production.mjs <url-produksi>')
  console.error('Contoh: node scripts/smoke-production.mjs https://si-stir-hebat-blue.vercel.app')
  process.exit(2)
}

const results = []
function record(name, ok, detail) {
  results.push({ name, ok })
  console.log(`${ok ? 'LULUS' : 'GAGAL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

async function get(path, init) {
  return fetch(new URL(path, baseUrl), { ...init, signal: AbortSignal.timeout(20000), redirect: 'manual' })
}

let page = null
try {
  const response = await get('/')
  const html = response.ok ? await response.text() : ''
  const isHtml = (response.headers.get('content-type') ?? '').includes('text/html')
  record('Beranda dapat dibuka', response.status === 200 && isHtml && html.includes('id="root"') && html.includes('SI STIR HEBAT'), `status ${response.status}`)
  page = html
} catch (error) {
  record('Beranda dapat dibuka', false, error instanceof Error ? error.message : 'gagal')
}

if (page) {
  try {
    const response = await get('/login')
    const html = response.ok ? await response.text() : ''
    record('Rute SPA /login memakai fallback index.html', response.status === 200 && html.includes('id="root"'), `status ${response.status}`)
  } catch (error) {
    record('Rute SPA /login memakai fallback index.html', false, error instanceof Error ? error.message : 'gagal')
  }

  const script = /<script[^>]+type="module"[^>]+src="([^"]+)"/.exec(page)
  if (!script) {
    record('Bundel utama ditemukan', false, 'tidak ada <script type="module">')
  } else {
    record('Bundel utama ditemukan', true, script[1])
    try {
      const response = await get(script[1])
      const bundle = response.ok ? await response.text() : ''
      const parts = await demoAccountParts()
      const leaked = parts.filter(part => bundle.includes(part))
      record('Tidak ada akun demo di bundel produksi', response.ok && leaked.length === 0,
        leaked.length ? `${leaked.length} akun demo masih ada di bundel` : `${parts.length} pola demo diperiksa`)
    } catch (error) {
      record('Tidak ada akun demo di bundel produksi', false, error instanceof Error ? error.message : 'gagal')
    }
  }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
if (supabaseUrl && supabaseKey) {
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/profiles?select=id&limit=1`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      signal: AbortSignal.timeout(20000),
    })
    const body = response.status === 200 ? (await response.text()).trim() : ''
    const ok = response.status === 401 || response.status === 403 || (response.status === 200 && body === '[]')
    record('REST menolak akses anonim', ok, ok ? `status ${response.status}` : `status ${response.status} mengembalikan baris`)
  } catch (error) {
    record('REST menolak akses anonim', false, error instanceof Error ? error.message : 'gagal')
  }
} else {
  console.log('LEWAT REST menolak akses anonim — VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY belum disetel.')
}

const failed = results.filter(result => !result.ok)
console.log(`\nSmoke ${results.length - failed.length}/${results.length} lulus pada ${baseUrl}`)
if (failed.length) {
  console.error(`Gagal: ${failed.map(result => result.name).join(', ')}`)
  process.exit(1)
}

async function demoAccountParts() {
  const { readFile } = await import('node:fs/promises')
  const source = await readFile(new URL('../src/lib/demo-auth.ts', import.meta.url), 'utf8').catch(() => '')
  const parts = [...source.matchAll(/email:\s*'([^']+)'/g)].map(match => match[1])
  return parts.length ? parts : ['admin@sdn03.sch.id', 'kepsek@sdn03.sch.id', 'guru@sdn03.sch.id', 'murid@sdn03.sch.id', 'ortu@sdn03.sch.id']
}