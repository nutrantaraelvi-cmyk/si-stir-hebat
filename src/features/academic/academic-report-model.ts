import { statusKetuntasan } from '../../lib/kkm.ts'
import { assessmentTypes } from './assessment-model.ts'

export type ReportAssessment = {
  id: string; class_id: string; class_name: string; subject_id: string; subject_name: string
  title: string; assessment_type: keyof typeof assessmentTypes; held_on: string; maximum_score: number; status: 'draft' | 'published'
}
export type AcademicReportRow = {
  id: string; student_id: string; student_code: string; student_name: string; score: number | null
  assessments: ReportAssessment
}
export type Choice = { id: string; label: string }
export const reportLimit = 500
export const academicHeaders = ['Tanggal', 'Kelas', 'Mata pelajaran', 'Asesmen', 'Jenis', 'Publikasi', 'Kode siswa', 'Nama pada asesmen', 'Nilai', 'Nilai maksimum', 'Persentase maksimum']
export const academicExportHeaders = [...academicHeaders, 'Status KKM']

export function validateAcademicRange(start: string, end: string) {
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  if (!valid(start) || !valid(end)) return 'Isi tanggal awal dan akhir yang valid.'
  const days = (Date.parse(end) - Date.parse(start)) / 86400000 + 1
  if (days < 1) return 'Tanggal akhir tidak boleh mendahului tanggal awal.'
  return days > 366 ? 'Pilih rentang maksimal 366 hari.' : ''
}

export function scorePercent(score: number | null, maximum: number) {
  return score === null ? null : Math.round(score / maximum * 10000) / 100
}

export function orderAcademicRows(rows: AcademicReportRow[]) {
  return [...rows].sort((a, b) => a.assessments.held_on.localeCompare(b.assessments.held_on)
    || a.assessments.id.localeCompare(b.assessments.id) || a.student_name.localeCompare(b.student_name, 'id') || a.id.localeCompare(b.id))
}

export function studentChoices(rows: AcademicReportRow[]): Choice[] {
  const students = new Map<string, Choice>()
  for (const row of orderAcademicRows(rows)) students.set(row.student_id, { id: row.student_id, label: `${row.student_name} · ${row.student_code}` })
  return [...students.values()].sort((a, b) => a.label.localeCompare(b.label, 'id') || a.id.localeCompare(b.id))
}

export function academicCells(row: AcademicReportRow): (string | number)[] {
  const a = row.assessments
  return [a.held_on, a.class_name, a.subject_name, a.title, assessmentTypes[a.assessment_type], a.status === 'published' ? 'Terbit' : 'Draf',
    row.student_code, row.student_name, row.score ?? '', a.maximum_score, scorePercent(row.score, a.maximum_score) ?? '']
}

export function academicExportCells(row: AcademicReportRow): (string | number)[] {
  const status = statusKetuntasan(row.score, row.assessments.maximum_score)
  return [...academicCells(row), status === 'tuntas' ? 'Tuntas' : status === 'belum_tuntas' ? 'Belum tuntas' : 'Belum dinilai']
}

export function developmentPoints(rows: AcademicReportRow[], student: string, subject: string) {
  if (!student || !subject) return []
  return orderAcademicRows(rows).filter(row => row.student_id === student && row.assessments.subject_id === subject
    && row.assessments.status === 'published' && row.score !== null)
}
