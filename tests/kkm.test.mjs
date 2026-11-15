import assert from 'node:assert/strict'
import test from 'node:test'
import { KKM_DEFAULT, statusKetuntasan } from '../src/lib/kkm.ts'

test('statusKetuntasan applies KKM threshold with decimal precision', () => {
  assert.equal(statusKetuntasan(74.99, 100), 'belum_tuntas')
  assert.equal(statusKetuntasan(75, 100), 'tuntas')
  assert.equal(statusKetuntasan(75.01, 100), 'tuntas')
  assert.equal(KKM_DEFAULT, 75)
})

test('statusKetuntasan supports decimal maximum and zero scores', () => {
  assert.equal(statusKetuntasan(67.5, 90), 'tuntas')
  assert.equal(statusKetuntasan(0, 100), 'belum_tuntas')
  assert.equal(statusKetuntasan(0, 0), 'belum_dinilai')
})

test('statusKetuntasan marks missing values as belum dinilai', () => {
  assert.equal(statusKetuntasan(null, 100), 'belum_dinilai')
  assert.equal(statusKetuntasan(undefined, 100), 'belum_dinilai')
  assert.equal(statusKetuntasan(80, null), 'belum_dinilai')
})
