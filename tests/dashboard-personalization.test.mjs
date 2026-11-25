import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_PINNED, MAX_RECENT, greetingFor, movePinned, parsePreferences, pickAllowed, preferencesKey, recordVisit, togglePinned } from '../src/app/dashboard/personalization.ts'

const empty = { pinned: [], recent: [], custom: false }

test('preferensi rusak atau asing kembali ke kosong', () => {
  assert.deepEqual(parsePreferences(null), empty)
  assert.deepEqual(parsePreferences('{bukan json'), empty)
  assert.deepEqual(parsePreferences('[]'), empty)
  assert.deepEqual(parsePreferences('"teks"'), empty)
})

test('hanya jalur internal yang dipertahankan, tanpa duplikat, dibatasi jumlahnya', () => {
  const prefs = parsePreferences(JSON.stringify({
    pinned: ['/absensi', '/absensi', 'https://contoh.invalid', '//contoh.invalid', 42, '/jurnal', '/a', '/b', '/c', '/d', '/e'],
    recent: ['/materi', '/tugas', '/asesmen', '/jadwal'],
    custom: 'ya',
  }))
  assert.deepEqual(prefs.pinned, ['/absensi', '/jurnal', '/a', '/b', '/c', '/d'])
  assert.equal(prefs.pinned.length, MAX_PINNED)
  assert.equal(prefs.recent.length, MAX_RECENT)
  assert.equal(prefs.custom, false, 'custom hanya true jika bernilai boolean true')
})

test('sematkan, lepas, dan batas pintasan', () => {
  let prefs = togglePinned(empty, '/absensi')
  assert.deepEqual(prefs.pinned, ['/absensi'])
  prefs = togglePinned(prefs, '/absensi')
  assert.deepEqual(prefs.pinned, [])
  const full = { ...empty, pinned: ['/1', '/2', '/3', '/4', '/5', '/6'] }
  assert.equal(togglePinned(full, '/7'), full, 'pintasan ketujuh ditolak')
})

test('urutan pintasan dapat digeser tanpa keluar batas', () => {
  const prefs = { ...empty, pinned: ['/a', '/b', '/c'] }
  assert.deepEqual(movePinned(prefs, '/b', -1).pinned, ['/b', '/a', '/c'])
  assert.deepEqual(movePinned(prefs, '/b', 1).pinned, ['/a', '/c', '/b'])
  assert.equal(movePinned(prefs, '/a', -1), prefs)
  assert.equal(movePinned(prefs, '/c', 1), prefs)
  assert.equal(movePinned(prefs, '/x', 1), prefs)
})

test('kunjungan terbaru di depan, tanpa duplikat', () => {
  let prefs = recordVisit(empty, '/a')
  prefs = recordVisit(prefs, '/b')
  prefs = recordVisit(prefs, '/a')
  prefs = recordVisit(prefs, '/c')
  prefs = recordVisit(prefs, '/d')
  assert.deepEqual(prefs.recent, ['/d', '/c', '/a'])
})

test('hanya layanan yang diizinkan peran yang ditampilkan', () => {
  const services = [{ to: '/absensi' }, { to: '/jurnal' }, { to: '/materi' }]
  assert.deepEqual(pickAllowed(['/sekolah', '/materi', '/absensi'], services).map(item => item.to), ['/materi', '/absensi'])
})

test('kunci penyimpanan dipisah per peran dan akun', () => {
  assert.notEqual(preferencesKey('u1', 'teacher'), preferencesKey('u1', 'principal'))
  assert.notEqual(preferencesKey('u1', 'teacher'), preferencesKey('u2', 'teacher'))
})

test('sapaan mengikuti jam Asia/Jakarta', () => {
  assert.equal(greetingFor(new Date('2026-11-25T00:30:00Z')), 'Selamat pagi') // 07.30 WIB
  assert.equal(greetingFor(new Date('2026-11-25T05:00:00Z')), 'Selamat siang') // 12.00 WIB
  assert.equal(greetingFor(new Date('2026-11-25T09:00:00Z')), 'Selamat sore') // 16.00 WIB
  assert.equal(greetingFor(new Date('2026-11-25T14:00:00Z')), 'Selamat malam') // 21.00 WIB
  assert.equal(greetingFor(new Date('2026-11-24T20:30:00Z')), 'Selamat malam') // 03.30 WIB
})
