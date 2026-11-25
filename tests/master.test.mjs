import test from 'node:test'
import assert from 'node:assert/strict'
import { canReadMasterData, masterPayload, validateMaster } from '../src/features/school/master.ts'

test('school identity validates optional NPSN and required name', () => {
  assert.notEqual(validateMaster('school_settings', { name: ' ', npsn: '' }), '')
  assert.notEqual(validateMaster('school_settings', { name: 'Data Contoh', npsn: '123' }), '')
  assert.equal(validateMaster('school_settings', { name: 'Data Contoh', npsn: '12345678', address: '' }), '')
})
test('school WhatsApp number is optional and uses the 62 international format', () => {
  assert.equal(validateMaster('school_settings', { name: 'Data Contoh', whatsapp_number: '' }), '')
  assert.equal(validateMaster('school_settings', { name: 'Data Contoh', whatsapp_number: '6281234567890' }), '')
  for (const value of ['081234567890', '+6281234567890', '62 812 3456', '62812']) {
    assert.notEqual(validateMaster('school_settings', { name: 'Data Contoh', whatsapp_number: value }), '', value)
  }
})
test('calendar validates date ordering and numeric boundaries', () => {
  assert.notEqual(validateMaster('academic_years', { name: 'Data Contoh', starts_on: '2026-07-01', ends_on: '2026-06-01' }), '')
  assert.notEqual(validateMaster('academic_years', { name: 'Data Contoh', starts_on: '2026-02-30', ends_on: '2026-06-01' }), '')
  assert.notEqual(validateMaster('school_classes', { academic_year_id: 'year', name: 'Kelas Contoh', grade: '7', capacity: '30' }), '')
  assert.notEqual(validateMaster('school_classes', { academic_year_id: 'year', name: 'Kelas Contoh', grade: '1.5', capacity: '30' }), '')
  assert.equal(validateMaster('school_classes', { academic_year_id: 'year', name: 'Kelas Contoh', grade: '1', capacity: '30' }), '')
})
test('master mutations send only permitted fields with typed values', () => {
  assert.deepEqual(masterPayload('subjects', { code: ' TEST ', name: ' Data Contoh ', is_active: 'false', role: 'administrator', id: 'spoofed' }), { code: 'TEST', name: 'Data Contoh', is_active: false })
  assert.notEqual(validateMaster('subjects', { code: 'lowercase', name: 'Data Contoh' }), '')
})

test('people registry has narrower permissions than non-personal school settings', () => {
  assert.equal(canReadMasterData('students','parent'), false)
  assert.equal(canReadMasterData('students','teacher'), true)
  assert.equal(canReadMasterData('teachers','student'), false)
  assert.equal(canReadMasterData('teachers','teacher'), true)
  assert.equal(canReadMasterData('students','student'), true)
  for (const role of ['administrator','principal']) {
    assert.equal(canReadMasterData('students',role), true)
    assert.equal(canReadMasterData('teachers',role), true)
  }
  assert.equal(canReadMasterData('academic_years','parent'), true)
  assert.equal(canReadMasterData('students','pending'), false)
})

test('people records validate code and name without accepting account identifiers', () => {
  assert.equal(validateMaster('teachers', { code: 'GURU_01', name: 'Data Contoh Guru' }), '')
  assert.notEqual(validateMaster('students', { code: 'nis baru', name: 'Data Contoh' }), '')
  assert.notEqual(validateMaster('students', { code: 'SISWA_01', name: ' ' }), '')
  assert.deepEqual(masterPayload('students', { code: 'SISWA_01', name: 'Data Contoh', is_active: 'true', profile_id: 'forged', created_by: 'forged', role: 'administrator' }), { code: 'SISWA_01', name: 'Data Contoh', is_active: true })
})
