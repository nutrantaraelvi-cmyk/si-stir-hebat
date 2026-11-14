# Audit Arsitektur dan Utang Teknis

Tanggal: 14 November 2026. Auditor: Qoder. Basis: `03b87c0`, Node 24.22.1.
Sifat: baca-saja. Tidak ada perubahan kode; temuan besar diajukan sebagai usulan di [HANDOFF.md](HANDOFF.md).

## Peta modul

| Lapisan | Lokasi | Tanggung jawab |
| --- | --- | --- |
| Shell aplikasi | `src/app/` | Router, `ProtectedRoute`, `AuthProvider`, Header, Dashboard, halaman akun/kata sandi, ringkasan sekolah/kepala sekolah. |
| Fitur | `src/features/` | Satu folder per domain: `academic` (asesmen, rekap, PDF), `attendance` (sesi, impor, rekap), `learning` (modul ajar, materi, tugas, umpan balik), `schedule` (jadwal, usulan), `school` (data master, registri, tautan akun), `supervision` (empat tahap, bukti, laporan), `journals`, `guardian`. |
| Utilitas | `src/lib/`, `src/utils/` | Konfigurasi Supabase, sesi demo, helper peran/pengumuman/kata sandi, escape CSV. |
| Komponen | `src/components/ui/` | `ErrorBoundary`, `EmptyState`, dan komponen tampilan kecil. |
| Database | `supabase/migrations/` | 24 berkas lokal; 23 terpasang di hosted, berkas ke-24 (`student_habits`) belum diterapkan. |
| Tes | `tests/`, `tests/browser/` | 104 tes unit/database PGlite; 180 tes Playwright (desktop + ponsel) dengan API tiruan. |
| Skrip | `scripts/` | Pemeriksaan Data API anonim dan persiapan rilis. |

Ketergantungan utama: `src/app/*` mengimpor 11 modul fitur secara statis; fitur memakai `src/lib/supabase.ts` (30 berkas) dan helper domain. Ketergantungan lintas fitur yang ditemukan hanya pada helper tanggal/status absensi: `academic`, `guardian`, `journals`, `learning`, dan `supervision` mengimpor `schoolToday`/label dari `features/attendance/attendance-model.ts`. Helper itu bersifat lintas domain dan lebih tepat berada di `src/utils/`.

Selain itu, 10 berkas fitur mengimpor `useAuth` dari `src/app/Auth`, sehingga lapisan fitur bergantung pada shell aplikasi. Ini bukan siklus modul langsung (`Auth` tidak mengimpor `App.tsx`), tetapi arah dependensinya terbalik dan menyulitkan penggunaan ulang fitur di luar shell; lihat A-07. Kesimpulan ini berasal dari pembacaan manual, bukan alat analisis graf.

## Ringkasan prioritas

| ID | Tingkat | Temuan | Usulan pemilik |
| --- | --- | --- | --- |
| A-01 | Sedang | Navigasi memakai izin pengumuman sebagai proksi untuk Materi/Tugas/Asesmen, sehingga administrator/kepala sekolah melihat tautan ke halaman yang RLS-nya tidak memberi baris | Cursor |
| A-02 | Sedang | Pemeriksaan peran tersebar di ±50 perbandingan literal pada 10+ berkas dan sudah menghasilkan ketidaksesuaian A-01 | Cursor |
| A-03 | Rendah | Delapan folder fitur kosong dan modul kebiasaan tanpa UI membuat struktur menyesatkan | Cursor/Codex |
| A-04 | Rendah | Ekspor yang tidak terpakai (`DemoRole`, `DemoAccount`, `isSupabaseConfigured`) dan helper tanggal di folder fitur | Cursor |
| A-05 | Rendah | Beberapa halaman besar satu berkas (17,0–15,4 KB) menyulitkan peninjauan | Cursor |
| A-06 | Rendah | Daftar referensi dibatasi 1000/200 baris tanpa tanda bahwa data terpotong | Cursor |
| A-07 | Rendah | Sepuluh fitur mengimpor `useAuth` dari `src/app/Auth`, membalik arah dependensi fitur→shell | Cursor |

## Rincian

### A-01 — Tautan navigasi tidak sesuai cakupan RLS (Sedang)

Bukti:

- `src/app/Header.tsx:39-41` menampilkan Materi Kelas, Tugas Kelas, dan Asesmen bila `canReadAnnouncements(role)` benar (`src/lib/announcements.ts:11-13`), yang mencakup administrator dan kepala sekolah.
- `src/app/Dashboard.tsx:109-111` juga menampilkan tautan yang sama untuk semua peran tersebut.
- Namun `school_private.can_read_class_material` hanya memberi akses kepada siswa terdaftar, wali terverifikasi, dan guru dengan penugasan (`supabase/migrations/20261111092126_class_materials.sql:23-36`); asesmen terbit dibaca melalui `can_read_assessment` untuk siswa/wali/guru terkait (`20261111234856_academic_assessments.sql:61-84`). Administrator/kepala sekolah tidak termasuk.

Dampak: pengguna dengan peran tersebut melihat menu lalu halaman kosong/penolakan; bukan eskalasi hak, tetapi UI menjanjikan akses yang tidak ada dan menyulitkan diagnosis. `/jadwal` berbeda: RLS memang memberi administrator/kepala sekolah akses baca (`20261113000504_lesson_schedules.sql:51-56`).

Saran: buat helper izin per domain (`canReadLearning`, `canReadAssessments`, `canReadSchedules`) yang mencerminkan policy, lalu pakai di Header, Dashboard, dan guard halaman. Tambah tes browser untuk administrator/kepala sekolah yang memastikan tautan tidak muncul (atau halaman menampilkan penjelasan yang benar).

### A-02 — Logika peran terduplikasi (Sedang)

Ada sekitar 50 perbandingan literal `role === '...'` di `src/app` dan `src/features`, sementara helper izin terkonsentrasi di `src/lib/school.ts`, `src/lib/announcements.ts`, dan `src/features/school/master.ts`. A-01 menunjukkan duplikasi ini sudah menghasilkan ketidaksesuaian. Saran: satu modul izin per domain yang mengembalikan boolean bernama jelas; halaman tetap mengandalkan RLS sebagai penegak akhir. Ini bukan refactor kosmetik: perubahan policy harus punya satu tempat untuk diselaraskan dan diuji.

### A-03 — Folder kosong dan modul tanpa UI (Rendah)

`src/features/` memuat folder kosong: `assessments`, `auth`, `dashboard`, `habits`, `parents`, `reports`, `students`, `teachers`; implementasinya berada di folder lain atau di `src/app`. Migration `20261114000139_student_habits.sql` ada secara lokal tetapi belum diterapkan dan belum memiliki UI. Saran: hapus folder kosong (setelah memastikan tidak ada konvensi build yang bergantung padanya) dan catat status modul kebiasaan di satu tempat. Jangan menghapus atau menerapkan migration tanpa Codex/pemilik.

### A-04 — Ekspor dan penempatan helper (Rendah)

- `DemoRole`, `DemoAccount`, dan `isSupabaseConfigured` tidak diimpor di mana pun (pemindaian `src`, `tests`, `scripts`); `getDemoProfiles` tetap dipakai tes.
- `schoolToday` adalah utilitas lintas fitur tetapi tinggal di `features/attendance/attendance-model.ts`; lima fitur lain mengimpornya dari sana.

Saran: hapus ekspor yang benar-benar mati saat menyentuh berkasnya; pindahkan helper tanggal ke `src/utils/date.ts` bila ada perubahan terkait. Verifikasi ulang dengan `tsc` sebelum menghapus.

### A-05 — Halaman besar (Rendah)

Ukuran berkas terbesar: `Attendance.tsx` 17,0 KB, `AcademicSupervision.tsx` 16,2 KB, `MasterData.tsx` 15,4 KB, `Journals.tsx` 13,7 KB, `AcademicReport.tsx` 12,3 KB. Bukan masalah saat ini, tetapi perubahan besar pada halaman tersebut lebih aman bila logika form/query dipisah ke modul seperti pola `*-model.ts` yang sudah dipakai. Jangan memecah tanpa kebutuhan konkret.

### A-06 — Batas daftar tanpa indikator (Rendah)

Banyak dropdown referensi memakai `limit(1000)` atau `limit(200)` tanpa memberi tahu bila batas tercapai, misalnya `MasterData.tsx:56,68`, `Attendance.tsx:68-83`, `Journals.tsx:63-66`. Pada skala satu sekolah biasanya cukup, tetapi di atas batas data menjadi tidak lengkap secara diam-diam. Saran: ambil `count` atau minta `limit+1` dan tampilkan pesan "daftar dipotong". Detail performa ada di [AUDIT_PERFORMA.md](AUDIT_PERFORMA.md).

### A-07 — Fitur bergantung pada shell `app/Auth` (Rendah)

Sepuluh berkas di `src/features` mengimpor `useAuth` dari `src/app/Auth` (asesmen, absensi, wali, jurnal, materi, modul ajar, jadwal, tautan akun, data master, supervisi). `App.tsx` juga mengimpor fitur-fitur tersebut. Tidak terbentuk siklus langsung karena `Auth` tidak mengimpor `App.tsx`, tetapi arah dependensi fitur→shell membuat fitur sulit dipakai ulang dan diuji terpisah. Saran: pindahkan konteks autentikasi ke `src/lib/auth-context.tsx` (atau `src/components`) dan impor dari sana; lakukan bersama perubahan H-04 agar tidak menambah churn.

## Aspek positif

- `ErrorBoundary` membungkus seluruh aplikasi; setiap halaman memakai `ProtectedRoute`; konfigurasi Supabase terpusat dan menolak key berprivilege.
- Pola paginasi, konfirmasi, revisi, request ID, dan escape CSV sudah konsisten di modul yang memerlukannya.
- Impor berat (XLSX worker, PDF) dipisah dari bundel awal; tidak ada `any` eksplisit di `src` dan tidak ada `console.*`.
- Tidak ada folder di luar root proyek yang disentuh; `D:\code\my-app` tidak diimpor.

## Batas audit

Peta ini disusun dari pembacaan kode dan pencarian teks, bukan alat graf dependensi atau profiling runtime. Ukuran halaman adalah ukuran berkas, bukan kompleksitas terukur.
