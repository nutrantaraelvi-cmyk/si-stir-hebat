import type { TDocumentDefinitions, TableCell } from 'pdfmake/interfaces'
import { labelKetuntasan } from '../../lib/kkm.ts'
import { academicCells, reportLimit, type AcademicReportRow } from './academic-report-model.ts'

export type AcademicPdfContext = {
  start: string; end: string; loaded: string; classLabel: string; subjectLabel: string; studentLabel: string; statusLabel: string
}

export function academicPdfDefinition(rows: AcademicReportRow[], context: AcademicPdfContext): TDocumentDefinitions {
  if (!rows.length || rows.length > reportLimit) throw new Error('Complete bounded report required')
  const headers = ['Tanggal', 'Siswa', 'Kelas / pelajaran', 'Asesmen', 'Nilai', 'Maks.', '% maks.', 'Status KKM']
  const body: TableCell[][] = [headers.map(text => ({ text, bold: true, color: '#FFFFFF', fillColor: '#12383A' }))]
  for (const row of rows) {
    const cells = academicCells(row)
    const status = labelKetuntasan(row.score, row.assessments.maximum_score)
    body.push([
      String(cells[0]),
      { stack: [{ text: row.student_name, bold: true }, { text: `Kode: ${row.student_code}`, fontSize: 8 }] },
      { stack: [String(cells[1]), { text: String(cells[2]), bold: true }] },
      { stack: [{ text: String(cells[3]), bold: true }, `${cells[4]} · ${cells[5]}`] },
      { text: row.score === null ? 'Belum dinilai' : String(cells[8]), alignment: 'right' },
      { text: String(cells[9]), alignment: 'right' },
      { text: row.score === null ? 'N/A' : `${cells[10]}%`, alignment: 'right' },
      { text: status, alignment: 'center' },
    ])
  }
  return {
    pageSize: 'A4', pageOrientation: 'landscape', pageMargins: [32, 30, 32, 36],
    info: { title: 'Rekap Akademik: SI STIR HEBAT', author: 'SI STIR HEBAT', subject: 'Hasil asesmen sesuai filter dan hak akses' },
    defaultStyle: { font: 'Roboto', fontSize: 9, color: '#12383A' },
    content: [
      { text: 'SI STIR HEBAT', fontSize: 11, bold: true, color: '#359FA0' },
      { text: 'Rekap Akademik', fontSize: 20, bold: true, margin: [0, 3, 0, 7] },
      { text: `Periode ${context.start} sampai ${context.end} · ${rows.length} hasil`, bold: true },
      { text: `Kelas: ${context.classLabel} · Mata pelajaran: ${context.subjectLabel}`, margin: [0, 3, 0, 0] },
      { text: `Siswa: ${context.studentLabel} · Publikasi: ${context.statusLabel}`, margin: [0, 3, 0, 0] },
      { text: `Data dimuat ${context.loaded} WIB.`, fontSize: 8, margin: [0, 3, 0, 8] },
      { text: 'Skema sementara: nilai maksimum per asesmen dan publikasi manual guru. Persentase adalah nilai dibagi maksimum, bukan nilai rapor. Nilai kosong berarti belum dinilai.',
        fontSize: 8, margin: [0, 0, 0, 12] },
      {
        table: { headerRows: 1, dontBreakRows: true, keepWithHeaderRows: 1, widths: [55, 110, 105, '*', 45, 45, 50, 62], body },
        layout: {
          hLineWidth: () => 0.4, vLineWidth: () => 0,
          hLineColor: () => '#CFDFDF',
          fillColor: index => index > 0 && index % 2 === 0 ? '#F0F7F7' : null,
          paddingTop: () => 7, paddingBottom: () => 7,
          paddingLeft: () => 5, paddingRight: () => 5,
        },
      },
    ],
    footer: (page, pages) => ({
      columns: [
        { text: 'SI STIR HEBAT · Rekap sesuai filter dan hak akses', alignment: 'left' },
        { text: `Halaman ${page} / ${pages}`, alignment: 'right' },
      ], margin: [32, 10, 32, 0], fontSize: 8, color: '#456667',
    }),
  }
}

export async function createAcademicPdf(rows: AcademicReportRow[], context: AcademicPdfContext) {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import('pdfmake/build/pdfmake.js'), import('pdfmake/build/vfs_fonts.js'),
  ])
  pdfMake.addVirtualFileSystem(fonts)
  return pdfMake.createPdf(academicPdfDefinition(rows, context))
}

export async function downloadAcademicPdf(rows: AcademicReportRow[], context: AcademicPdfContext) {
  const pdf = await createAcademicPdf(rows, context)
  await pdf.download(`rekap-akademik-${context.start}-${context.end}.pdf`)
}
