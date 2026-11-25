# Kontrak API backend untuk UI

Dokumen ini adalah kontrak TypeScript antara backend Codex dan UI Qoder. Sumber implementasi tetap modul di `src/features/*/api` dan `src/lib`. Hanya panggil fungsi API dari klien Supabase terkonfigurasi; PostgreSQL RLS, grant minimum, validasi server, dan Storage policy adalah otoritas akses. Jangan menganggap kontrol UI sebagai izin.

Semua daftar memakai halaman 0-based, maksimum 25 baris, dan mengembalikan satu baris sentinel melalui `hasMore` untuk memberi sinyal **"Daftar terpotong; muat halaman berikutnya."** Peran yang dijelaskan di bawah adalah cakupan data yang ditegakkan backend, bukan filter UI.

```ts
import type { SupabaseClient } from '@supabase/supabase-js'
type Page<T> = { items: T[]; hasMore: boolean }
```

## Konfigurasi dan mode demo

```ts
// src/lib/config.ts
export type PublicSupabaseConfig = { url: string; key: string }
export const publicSupabaseConfig: PublicSupabaseConfig | null
export const isConfigured: boolean
export const demoAllowed: boolean // import.meta.env.DEV === true && !isConfigured
```

`getPublicSupabaseConfig(url, publishableKey)` dan `resolvePublicRuntimeConfig(url, publishableKey, dev)` adalah helper validasi/test. Aplikasi memakai `isConfigured` dan `demoAllowed` yang diekspor di atas sebagai satu sumber kebenaran. Hanya `VITE_SUPABASE_URL` dan publishable key `VITE_SUPABASE_PUBLISHABLE_KEY` yang boleh tersedia pada klien; secret/service-role tidak pernah menjadi konfigurasi UI.

## Komunikasi guru–wali

```ts
// src/features/komunikasi/api
type PesanKomunikasi = {
  id: string; assignment_id: string; student_id: string; parent_profile_id: string
  body: string; author_id: string; created_at: string
}
type PesanBaru = Pick<PesanKomunikasi,
  'id' | 'assignment_id' | 'student_id' | 'parent_profile_id' | 'body'>
type PenerimaKomunikasi = {
  assignment_id: string; student_id: string; parent_profile_id: string
  teacher_name: string; student_name: string; parent_name: string
}
function daftarPesan(client: SupabaseClient, page?: number): Promise<Page<PesanKomunikasi>>
function cariPesan(client: SupabaseClient, id: string): Promise<PesanKomunikasi | null>
function kirimPesan(client: SupabaseClient, pesan: PesanBaru): Promise<PesanKomunikasi>
function daftarPenerima(client: SupabaseClient, page?: number): Promise<Page<PenerimaKomunikasi>>
```

Guru dan wali hanya memperoleh percakapan dalam relasi penugasan/anak yang terverifikasi. `id` dibuat klien dan dipertahankan saat retry agar respons yang hilang tidak menggandakan pesan. Isi pesan adalah data komunikasi pribadi; jangan salin ke notifikasi.

## Dokumen sekolah

```ts
// src/features/school-documents/api
type DocumentCategory = 'ksp' | 'rkt' | 'rkas' | 'sk' | 'administration' | 'other'
type SchoolDocumentStatus = 'draft' | 'submitted' | 'approved' | 'needs_revision' | 'archived'
type SchoolDocument = {
  id: string; owner_profile_id: string; category: DocumentCategory; title: string
  description: string; file_path: string; mime_type: string; file_size: number
  status: SchoolDocumentStatus; review_note: string; revision: number
  created_at: string; updated_at: string
}
type SchoolDocumentVersion = {
  id: string; document_id: string; version_number: number; file_path: string
  mime_type: string; file_size: number; uploaded_by: string; created_at: string
}
type SchoolDocumentReview = {
  id: string; document_id: string; reviewer_profile_id: string
  from_status: SchoolDocumentStatus; to_status: SchoolDocumentStatus
  note: string; created_at: string
}
type SchoolDocumentCategory = { key: DocumentCategory; label: string; is_active: boolean }
function daftarDokumenSekolah(client: SupabaseClient, page?: number, status?: SchoolDocumentStatus): Promise<Page<SchoolDocument>>
function daftarKategoriDokumen(client: SupabaseClient): Promise<SchoolDocumentCategory[]>
function buatDrafDokumenSekolah(client: SupabaseClient, input: {
  category: DocumentCategory; title: string; description?: string; file: File
}): Promise<SchoolDocument>
function tambahVersiDokumenSekolah(client: SupabaseClient, documentId: string,
  expectedRevision: number, file: File): Promise<SchoolDocument>
function riwayatVersiDokumen(client: SupabaseClient, documentId: string): Promise<SchoolDocumentVersion[]>
function riwayatTinjauanDokumen(client: SupabaseClient, documentId: string): Promise<SchoolDocumentReview[]>
function tindakLanjutDokumen(client: SupabaseClient, documentId: string, revision: number,
  status: 'submitted' | 'approved' | 'needs_revision' | 'archived', reviewNote?: string): Promise<SchoolDocument>
```

Bucket `school-documents` harus privat. API menolak selain PDF/JPEG/PNG/DOCX/XLSX dan ukuran di atas 10 MiB; server-side Storage limit dan MIME policy tetap wajib. Kepala sekolah meninjau/mengesahkan dokumen; administrator hanya menangani kelola teknis tanpa hak persetujuan; guru mengelola dokumen miliknya pada status yang diizinkan. Siswa/wali tidak punya akses. Perubahan status memakai `revision` optimistik dan membuat riwayat review; otorisasi mutasi tetap di RLS/RPC.

## Notifikasi

```ts
// src/features/notifications/api
type Notification = {
  id: string; recipient_profile_id: string
  category: 'announcement' | 'absence_report' | 'supervision' | 'assessment' |
    'document' | 'teaching_module' | 'communication' | 'system'
  priority: 'normal' | 'important' | 'urgent'; title: string; body: string
  read_at: string | null; created_at: string
  reference_type: 'announcement' | 'absence_report' | 'supervision' | 'document' |
    'teaching_module' | 'communication' | 'assessment' | null
  reference_id: string | null; event_key: string
}
function daftarNotifikasi(client: SupabaseClient, page?: number): Promise<Page<Notification>>
function tandaiNotifikasiDibaca(client: SupabaseClient, id: string): Promise<Notification>
function validateNotificationPage(page: number): void
```

Penerima hanya membaca notifikasinya sendiri. Notifikasi bersifat in-app dan tidak boleh berisi nama lengkap, nilai, alasan absen, isi komunikasi, atau konten sensitif lain; gunakan kategori, pesan umum, dan tautan ke halaman berotorisasi. Trigger sumber: pengumuman terbit, perubahan status dokumen/modul ajar/supervisi, laporan absen wali, dan pesan baru.

## Laporan ketidakhadiran wali

```ts
// src/features/parents/api/absence-reports
type GuardianAbsenceReport = {
  id: string; request_id: string; student_id: string; parent_profile_id: string
  report_date: string; reason: string
  status: 'submitted' | 'confirmed' | 'rejected'
  teacher_id: string | null; teacher_note: string; revision: number
  created_at: string; updated_at: string
}
function daftarLaporanKetidakhadiran(client: SupabaseClient, studentId?: string,
  page?: number): Promise<Page<GuardianAbsenceReport>>
function validateAbsenceReport(reportDate: string, reason: string, today: string): string
function kirimLaporanKetidakhadiran(client: SupabaseClient,
  report: Pick<GuardianAbsenceReport, 'request_id' | 'student_id' | 'report_date' | 'reason'>,
  today: string): Promise<GuardianAbsenceReport>
function reviewLaporanKetidakhadiran(client: SupabaseClient, id: string, revision: number,
  decision: 'confirmed' | 'rejected', note: string): Promise<GuardianAbsenceReport>
```

Wali hanya mengirim untuk anak tertaut; guru kelas meninjau laporan kelasnya. Mengirim laporan tidak mengisi absensi. Hanya keputusan `confirmed` guru yang mengisi status tidak hadir melalui RPC dengan jejak revisi dan audit; keputusan `rejected` menutup laporan tanpa mengubah absensi. Request ID wajib stabil saat retry.

## Absensi guru

```ts
// src/features/attendance/api/teacher-attendance
type TeacherAttendance = {
  id: string; teacher_profile_id: string; attendance_on: string
  check_in_at: string | null; check_out_at: string | null
  check_in_request_id: string; check_out_request_id: string | null
  revision: number; created_at: string; updated_at: string
}
type TeacherAttendanceCorrection = {
  id: string; request_id: string; attendance_id: string; requester_profile_id: string
  proposed_check_in_at: string | null; proposed_check_out_at: string | null; reason: string
  status: 'pending' | 'approved' | 'rejected'; reviewed_by: string | null
  reviewed_at: string | null; review_note: string; revision: number; created_at: string
}
function daftarAbsensiGuru(client: SupabaseClient, from: string, through: string,
  page?: number): Promise<Page<TeacherAttendance>>
function catatAbsensiGuru(client: SupabaseClient, action: 'check_in' | 'check_out',
  requestId: string): Promise<TeacherAttendance>
function ajukanKoreksiAbsensiGuru(client: SupabaseClient, input: {
  request_id: string; attendance_on: string; proposed_check_in_at: string | null
  proposed_check_out_at: string | null; reason: string
}): Promise<TeacherAttendanceCorrection>
function tinjauKoreksiAbsensiGuru(client: SupabaseClient, id: string, revision: number,
  decision: 'approved' | 'rejected', note?: string): Promise<TeacherAttendanceCorrection>
function daftarKoreksiAbsensiGuru(client: SupabaseClient,
  status?: TeacherAttendanceCorrection['status'], page?: number): Promise<Page<TeacherAttendanceCorrection>>
```

Check-in/out menggunakan `requestId` idempoten. Guru aktif mengajukan koreksi dengan `request_id` stabil untuk retry; hanya kepala sekolah yang menyetujui/menolak. Administrator tidak menyetujui koreksi. Siswa, wali, pending, dan anonim tidak dapat mencatat atau meninjau. Semua batas peran, tanggal, dan transisi status ditegakkan RPC/RLS. Tanggal operasional mengikuti `Asia/Jakarta`.

## 7 Kebiasaan

```ts
// src/features/student-habits/api
const habitLabels: readonly [
  'Bangun pagi', 'Beribadah', 'Berolahraga', 'Makan sehat',
  'Gemar belajar', 'Bermasyarakat', 'Tidur cepat'
]
type HabitRecord = {
  id: string; student_id: string; record_date: string; habits: boolean[]; notes: string
  validation_status: 'pending' | 'validated'; validated_by: string | null
  validated_at: string | null; validation_note: string; revision: number; updated_at: string
}
type HabitDraft = Pick<HabitRecord, 'student_id' | 'record_date' | 'habits' | 'notes'>
type HabitWeeklySummary = {
  student_id: string; student_name: string; days_expected: number
  days_filled: number; days_missing: number; bangun_pagi: number; beribadah: number
  berolahraga: number; makan_sehat: number; gemar_belajar: number
  bermasyarakat: number; tidur_cepat: number
}
function daftarKebiasaan(client: SupabaseClient, studentId?: string, page?: number): Promise<Page<HabitRecord>>
function validateHabitDraft(draft: Pick<HabitDraft, 'record_date' | 'habits' | 'notes'>,
  today: string): string
function ambilKebiasaanHarian(client: SupabaseClient, studentId: string, date: string): Promise<HabitRecord | null>
function simpanKebiasaan(client: SupabaseClient, draft: HabitDraft, today: string,
  expectedRevision?: number | null): Promise<HabitRecord>
function validasiKebiasaan(client: SupabaseClient, id: string, revision: number, note: string): Promise<HabitRecord>
function ringkasanKebiasaanMingguan(client: SupabaseClient, weekStart: string,
  studentId?: string, page?: number): Promise<Page<HabitWeeklySummary>>
```

Wali mencatat untuk anak yang tertaut. Guru hanya memantau rekap kelas yang ditugaskan; siswa membaca catatan diri sesuai kebijakan publikasi; kepala sekolah/admin mengikuti cakupan kebijakan. Katalog tetap tujuh item. Tidak ada peringkat. Catatan yang tidak ada/sel kosong berarti **belum diisi**, bukan nilai `false`/"tidak dilakukan"; `days_missing` adalah hitungan hari tanpa catatan.

Editor membaca satu pasangan siswa/tanggal saat memuat formulir. Revisi kosong membuat entri baru. Untuk koreksi, kirim revisi yang ditampilkan saat formulir dibuka. Data API menerapkan pembaruan pada siswa, tanggal dan revisi yang cocok. Konflik insert atau perubahan revisi memerlukan muat ulang. Perubahan isi oleh wali membatalkan validasi lama, sehingga guru dapat meninjau catatan terkini.

## Ringkasan dashboard

```ts
// src/lib/dashboard-overview
type DashboardOverview = {
  profile: { full_name: string; role: 'administrator' | 'principal' }
  active: { students: number; teachers: number; classes: number }
  supervision_stages: Record<'1' | '2' | '3' | '4', number>
  teaching_modules: { submitted: number; returned: number }
  announcements: {
    published_count: number; draft_count: number
    recent: { id: string; title: string; body: string; status: 'published'; created_at: string }[]
  }
}
function getDashboardOverview(client: SupabaseClient): Promise<DashboardOverview>
```

`getDashboardOverview` memanggil RPC tunggal `dashboard_overview()` untuk administrator/kepala sekolah. Peran lain/pending tidak memanggil RPC ini. RLS dan RPC membatasi hasil; UI hanya merender ringkasan yang diterima.

## Status kontrak

- Tipe dan nama fungsi pada komunikasi, dokumen, notifikasi, laporan ketidakhadiran, absensi guru, kebiasaan, dashboard, serta konfigurasi dicocokkan dengan implementasi API lokal pada branch `ai/codex-foundation`.
- Kontrak ini adalah antarmuka lintas agen untuk Qoder. Keberadaan tabel/RPC dan hasil tes lokal tidak membuktikan schema diterapkan ke hosted.
- Riwayat hosted terakhir yang diverifikasi mencatat 23 migration sampai `20261113074045`; migration fitur berikutnya belum diterapkan. Advisor hosted masih memiliki temuan `auth_leaked_password_protection`.
- Perbarui tipe dan fungsi saat backend berubah. Sebelum integrasi UI, jalankan `npm run check` dan pastikan mock browser mengikuti nama fungsi, parameter, status, serta sinyal `hasMore`.

