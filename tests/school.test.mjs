import assert from 'node:assert/strict'
import test from 'node:test'
import { canAccessCommunication, canReadAssessments, canReadLearning, canReadSchedules } from '../src/lib/school.ts'

const roles = ['administrator', 'principal', 'teacher', 'student', 'parent']

test('learning, assessments and schedules are readable for every active school role', () => {
  for (const role of roles) {
    assert.equal(canReadLearning(role), true, `learning: ${role}`)
    assert.equal(canReadAssessments(role), true, `assessments: ${role}`)
    assert.equal(canReadSchedules(role), true, `schedules: ${role}`)
  }
  for (const role of [null, 'pending']) {
    assert.equal(canReadLearning(role), false)
    assert.equal(canReadAssessments(role), false)
    assert.equal(canReadSchedules(role), false)
  }
})

test('communication is limited to teachers and parents', () => {
  assert.equal(canAccessCommunication('teacher'), true)
  assert.equal(canAccessCommunication('parent'), true)
  for (const role of ['administrator', 'principal', 'student', 'pending', null]) {
    assert.equal(canAccessCommunication(role), false)
  }
})
