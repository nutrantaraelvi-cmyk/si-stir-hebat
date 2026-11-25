import test from 'node:test'
import assert from 'node:assert/strict'
import { classifySync, isNetworkFailure, parseQueue } from '../src/features/attendance/offline-queue.ts'

const changes = [{ id: 'r1', status: 'present', revision: 0, reason: '' }, { id: 'r2', status: 'sick', revision: 2, reason: 'Data Contoh alasan' }]

test('kegagalan jaringan dibedakan dari penolakan server', () => {
  assert.equal(isNetworkFailure({ code: '', message: 'TypeError: Failed to fetch' }, true), true)
  assert.equal(isNetworkFailure({ code: '', message: 'Load failed' }, true), true)
  assert.equal(isNetworkFailure(null, false), true, 'perangkat offline selalu dianggap gagal jaringan')
  assert.equal(isNetworkFailure({ code: '42501', message: 'permission denied' }, true), false)
  assert.equal(isNetworkFailure({ code: '40001', message: 'Failed to fetch' }, true), false)
})

test('sinkronisasi: sukses, coba lagi, duplikat, konflik, dan ditolak', () => {
  assert.equal(classifySync(null, changes, undefined, true), 'synced')
  assert.equal(classifySync({ code: '', message: 'Failed to fetch' }, changes, undefined, true), 'retry')
  assert.equal(classifySync({ code: '40001' }, changes, { r1: 'present', r2: 'sick' }, true), 'duplicate')
  assert.equal(classifySync({ code: '40001' }, changes, { r1: 'present', r2: 'absent' }, true), 'conflict')
  assert.equal(classifySync({ code: '40001' }, changes, undefined, true), 'conflict')
  assert.equal(classifySync({ code: '42501', message: 'permission denied' }, changes, undefined, true), 'rejected')
})

test('antrean rusak atau dimanipulasi diabaikan dengan aman', () => {
  assert.deepEqual(parseQueue(null), [])
  assert.deepEqual(parseQueue('bukan json'), [])
  assert.deepEqual(parseQueue('{"a":1}'), [])
  const valid = { id: 'q1', sessionId: 's1', sessionLabel: '2026-11-25 · Data Contoh 1A', changes, queuedAt: '2026-11-25T01:00:00.000Z', state: 'pending' }
  const invalid = [{ ...valid, id: 'q2', state: 'done' }, { ...valid, id: 'q3', changes: [] }, { ...valid, id: 'q4', changes: [{ id: 1 }] }]
  assert.deepEqual(parseQueue(JSON.stringify([valid, ...invalid])), [valid])
})
