import { cp, mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'

// Explicit source allowlist: never copy .env.local, personal references, tool
// sessions, hosted project links, node_modules or downloaded test artifacts.
const root = resolve(import.meta.dirname, '..')
const releaseDirectory = join(root, 'release')
await mkdir(releaseDirectory, { recursive: true })
let destination = join(releaseDirectory, 'si-stir-hebat')
try {
  await mkdir(destination)
} catch (error) {
  if (error.code !== 'EEXIST') throw error
  // A previous export may contain sources that no longer belong to this build.
  destination = await mkdtemp(join(releaseDirectory, 'si-stir-hebat-'))
}
for (const directory of ['src', 'public', 'tests', '.github']) {
  await cp(join(root, directory), join(destination, directory), { recursive: true })
}
for (const directory of ['supabase/migrations', 'supabase/tests']) {
  await cp(join(root, directory), join(destination, directory), { recursive: true })
}
await mkdir(join(destination, 'scripts'), { recursive: true })
for (const name of ['guard-env.mjs', 'check-migrations.mjs', 'check-ci.mjs', 'check-demo-bundle.mjs', 'check-supabase.mjs', 'database-denial.mjs', 'qa-academic-pdf.mjs', 'smoke-production.mjs']) {
  await cp(join(root, 'scripts', name), join(destination, 'scripts', name))
}
for (const name of ['package.json', 'package-lock.json', 'index.html', '.gitignore', '.env.example', 'vite.config.ts', 'vercel.json', 'eslint.config.js', 'playwright.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json']) {
  await cp(join(root, name), join(destination, name))
}
await mkdir(join(destination, 'docs'), { recursive: true })
await cp(join(root, 'docs/AKTIVASI_DAN_RILIS.md'), join(destination, 'docs/AKTIVASI_DAN_RILIS.md'))
await writeFile(join(destination, 'README.md'), `# SI STIR HEBAT

Aplikasi sekolah SDN 03 Wonosari: React, Vite, TypeScript dan Supabase.

## Menjalankan

Gunakan Node 24. Jalankan npm ci, salin .env.example ke .env.local dan isi konfigurasi Supabase milik sekolah, lalu npm run dev.

Validasi: npm run check dan npm run test:browser. Browser memakai API tiruan. Build produksi menolak konfigurasi Supabase kosong/tidak valid.

## Aktivasi dan deployment

Ikuti [panduan operator](docs/AKTIVASI_DAN_RILIS.md) untuk membuat akun admin, mengisi data sekolah, dan import repo ke Vercel. Root Directory adalah titik (root repository), build npm run build, output dist.

## Database dan aktivasi

Direktori supabase/migrations memuat riwayat lokal yang disertakan dalam paket ini. Cocokkan versi dan struktur dengan proyek tujuan sebelum perubahan. Hasil pengujian lokal serta UAT peran dan pemulihan akun menjadi bukti yang terpisah untuk keputusan rilis.
`)
async function inspect(directory) {
  let count = 0
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isSymbolicLink()) throw new Error('Release contains symlink')
    if (entry.isDirectory()) { count += await inspect(path); continue }
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') throw new Error('Environment file in release')
    const contents = await readFile(path, 'utf8')
    if (/sb_secret_[A-Za-z0-9]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY-----/.test(contents)) throw new Error('Possible credential in release; inspect locally')
    count++
  }
  return count
}
console.log(`Paket sumber siap di ${destination} (${await inspect(destination)} berkas).`)
