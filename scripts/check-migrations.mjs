import { readdirSync } from 'node:fs'

const migrationsDir = new URL('../supabase/migrations/', import.meta.url)
const pattern = /^(\d{14})_([a-z0-9_]+)\.sql$/
const errors = []
const byStamp = new Map()
const byName = new Map()
const rows = []

for (const file of readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).sort()) {
  const match = pattern.exec(file)
  if (!match) {
    errors.push(`Nama berkas harus <14 digit>_<nama>.sql: ${file}`)
    continue
  }
  const [, stamp, name] = match
  if (byStamp.has(stamp)) errors.push(`Timestamp ganda ${stamp}: ${byStamp.get(stamp)} dan ${file}`)
  if (byName.has(name)) errors.push(`Nama migration ganda "${name}": ${byName.get(name)} dan ${file}`)
  byStamp.set(stamp, file)
  byName.set(name, file)
  rows.push({ file, stamp, name })
}

for (let index = 1; index < rows.length; index++) {
  if (rows[index].stamp <= rows[index - 1].stamp) {
    errors.push(`Urutan tidak naik: ${rows[index - 1].file} sebelum ${rows[index].file}`)
  }
}

const habits = rows.findIndex(row => row.name === 'student_habits')
const communication = rows.findIndex(row => row.name === 'komunikasi')
if (habits >= 0 && communication >= 0 && habits > communication) {
  errors.push('student_habits harus lebih dulu daripada komunikasi agar riwayat hosted tidak melompat urutan.')
}

if (errors.length) {
  console.error('Pemeriksaan migration gagal:')
  for (const message of errors) console.error(`- ${message}`)
  process.exit(1)
}

console.log(`Migration OK: ${rows.length} berkas, timestamp unik dan naik.`)