import { readFileSync, readdirSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const scripts = packageJson.scripts ?? {}
const workflowsDir = new URL('../.github/workflows/', import.meta.url)
const files = readdirSync(workflowsDir).filter(name => name.endsWith('.yml') || name.endsWith('.yaml'))
const errors = []

if (!files.length) errors.push('Tidak ada workflow pada .github/workflows.')

for (const file of files) {
  const source = readFileSync(new URL(file, workflowsDir), 'utf8')
  if (source.includes('\t')) errors.push(`${file}: gunakan spasi, bukan tab.`)
  if (!source.includes("node-version: '24'")) errors.push(`${file}: node-version 24 belum disetel.`)
  if (!source.includes('npm ci')) errors.push(`${file}: langkah npm ci tidak ada.`)
  if (!source.includes('npm run check')) errors.push(`${file}: langkah npm run check tidak ada.`)
  if (!source.includes('playwright install')) errors.push(`${file}: pemasangan browser Playwright tidak ada.`)
  if (!source.includes('npm run test:browser')) errors.push(`${file}: langkah test:browser tidak ada.`)
  if (!source.includes('VITE_SUPABASE_URL')) errors.push(`${file}: VITE_SUPABASE_URL belum disetel (build produksi akan gagal).`)
  if (!source.includes('VITE_SUPABASE_PUBLISHABLE_KEY')) errors.push(`${file}: VITE_SUPABASE_PUBLISHABLE_KEY belum disetel.`)
  if (!/permissions:\s*\n\s*contents:\s*read/.test(source)) errors.push(`${file}: permission contents: read belum disetel.`)

  for (const [, name] of source.matchAll(/npm run ([a-z0-9:_-]+)/g)) {
    if (!scripts[name]) errors.push(`${file}: skrip "npm run ${name}" tidak ada di package.json.`)
  }
}

if (errors.length) {
  console.error('Pemeriksaan workflow CI gagal:')
  for (const message of errors) console.error(`- ${message}`)
  process.exit(1)
}

console.log(`Workflow CI OK: ${files.length} berkas valid dan memakai skrip yang tersedia.`)