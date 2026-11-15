import test from 'node:test'
import assert from 'node:assert/strict'
import { academicPdfDefinition } from '../src/features/academic/academic-report-pdf.ts'

const context = { start: '2026-11-01', end: '2026-11-12', loaded: '12/11/2026', classLabel: 'Kelas 1A', subjectLabel: 'Matematika', studentLabel: 'Data Contoh', statusLabel: 'Terbit' }
const row = { id: 'one', student_id: 'one', student_code: '001', student_name: '<b>Data Contoh</b>', score: 0,
  assessments: { id: 'one', class_id: 'one', subject_id: 'one', class_name: 'Kelas 1A', subject_name: 'Matematika',
    title: '=Data Contoh', assessment_type: 'formative', held_on: '2026-11-12', maximum_score: 20, status: 'published' } }

test('PDF adapter preserves text, zero and ungraded values across combined columns', () => {
  const definition = academicPdfDefinition([row, { ...row, id: 'two', score: null }], context)
  const table = definition.content.find(item => item.table).table
  assert.equal(table.headerRows, 1)
  assert.equal(table.body[1][1].stack[0].text, '<b>Data Contoh</b>')
  assert.equal(table.body[1][1].stack[1].text, 'Kode: 001')
  assert.equal(table.body[1][3].stack[0].text, '=Data Contoh')
  assert.equal(table.body[1][4].text, '0')
  assert.equal(table.body[1][6].text, '0%')
  assert.equal(table.body[2][4].text, 'Belum dinilai')
  assert.equal(table.body[2][6].text, 'N/A')
  assert.equal(definition.footer(2, 5).columns[1].text, 'Halaman 2 / 5')
})

test('PDF export rejects empty or oversized input instead of issuing an incomplete report', () => {
  assert.throws(() => academicPdfDefinition([], context))
  assert.throws(() => academicPdfDefinition(Array(501).fill(row), context))
})
