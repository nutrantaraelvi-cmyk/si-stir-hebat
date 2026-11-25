# Audit Keamanan Aplikasi

Tanggal: 14 November 2026. Auditor: Qoder. Basis: `03b87c0` (branch `ai/codex-pdf-splitting`).
Ruang lingkup: kode `src/`, `scripts/`, `supabase/migrations/`, konfigurasi build. Sifat: baca-saja; tidak ada perubahan kode, migration, database hosted, Auth, atau secret.

Laporan ini melengkapi [SECURITY_REVIEW.md](SECURITY_REVIEW.md), yang menelaah migration (RLS, grant kolom, fungsi `SECURITY DEFINER`). Audit ini memeriksa sisi aplikasi: kebocoran secret, XSS, formula injection, validasi impor/unggah, cakupan akses Storage, dan perilaku mode demo. **Tidak ada klaim bahwa aplikasi "aman"; yang ada hanyalah bukti untuk temuan di bawah.**

## Ringkasan prioritas

| ID | Tingkat | Temuan | Wilayah | Usulan pemilik |
| --- | --- | --- | --- | --- |
| S-01 | Sedang | Mode demo aktif pada build produksi bila `VITE_SUPABASE_*` kosong/tidak valid; akun dan kata sandi sintetis ikut ter-bundle | `src/lib/config.ts`, `src/lib/supabase.ts`, `src/lib/demo-auth.ts`, `src/app/Account.tsx` | Codex + Cursor, keputusan pemilik |
| S-02 | Sedang | Policy Storage `supervision-evidence` hanya dinalar statis; belum ada tes otomatis yang membuktikan pembatasan per peran (melanjutkan K4) | `supabase/migrations/20261111082822_supervision_evidence.sql` | Codex/Copilot |
| S-03 | Mengikuti laporan lama | K1–K4 pada `SECURITY_REVIEW.md` belum ditutup | migration terkait | Codex |

Tidak ditemukan temuan **Kritis** atau **Tinggi** baru pada kode aplikasi dalam audit ini. Itu bukan jaminan: cakupan dan batas dijelaskan di bagian akhir.

## Rincian

### S-01 — Mode demo dapat tampil sebagai aplikasi sekolah nyata (Sedang)

Bukti:

- `src/lib/supabase.ts:3-5` membuat `supabase = null` bila konfigurasi tidak valid, lalu `isSupabaseConfigured` menjadi `false`.
- `src/lib/demo-auth.ts:13` mendefinisikan `DEMO_ACCOUNTS` dengan email dan kata sandi literal, termasuk peran administrator; sesi disimpan di `localStorage`.
- `src/app/Account.tsx:38` memakai login demo ketika `supabase` tidak ada. Dashboard, Header, Profil, dan Kata Sandi juga bercabang ke data demo, sehingga build produksi yang salah konfigurasi tetap "berhasil login" dan menampilkan data contoh.
- `src/lib/demo-auth.ts` diimpor secara statis oleh halaman utama, jadi kredensial demo dan logika sesi ada di bundel produksi meskipun konfigurasi benar.

Dampak: tidak ada data sekolah nyata yang bocor (mode demo hanya memakai `localStorage`), tetapi aplikasi dapat disalahartikan sebagai sistem sekolah aktif, dan kata sandi sintetis dapat dipakai siapa pun yang membuka build tersebut secara lokal. Ini risiko integritas/kepercayaan, bukan eskalasi ke database.

Saran perbaikan:

1. Batasi fallback demo pada `import.meta.env.DEV`; pada build produksi tanpa konfigurasi valid, tampilkan halaman konfigurasi yang memblokir login dan operasi data.
2. Tambahkan pemeriksaan build (script `prebuild` atau plugin Vite) yang menggagalkan build produksi bila `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` kosong, placeholder, atau bukan publishable key.
3. Keluarkan akun demo dari bundel produksi (fixture tes di `tests/` atau modul yang hanya diimpor saat DEV).
4. Tambah tes: mode produksi tanpa env tidak boleh merender formulir login demo maupun menyimpan sesi demo.

### S-02 — Bukti uji policy Storage masih kurang (Sedang)

> **Status 25 November 2026: ditutup.** Tes PGlite `supervision evidence storage policy separates principal, owner teacher and outsiders` di `tests/database.test.mjs` membuktikan akses kepala sekolah, guru pemilik, guru lain, siswa, wali, akun pending, dan anon, sebelum dan sesudah terbit. Uraian di bawah dipertahankan sebagai riwayat.

`supervision-evidence` sudah privat, dibatasi 10 MB dan MIME PDF/JPEG/PNG di server, serta unggah/hapus hanya untuk kepala sekolah pada tahap 4 yang belum dipublikasikan (`supabase/migrations/20261111082822_supervision_evidence.sql:1-44`). Policy baca (`:29-39`) tidak menyebut peran, tetapi subkuerinya membaca `public.academic_supervisions` secara langsung. Karena RLS tabel itu berlaku pada subkueri, pembacaan seharusnya tersaring oleh `academic_supervisions_read` (`20261111080735_academic_supervision.sql:51-57`): kepala sekolah melihat semua; guru hanya sesi miliknya yang sudah dipublikasikan; siswa/wali/pending tidak melihat baris sehingga policy baca gagal.

Kesimpulan statis itu masuk akal, tetapi **belum dibuktikan oleh tes**. K4 di `SECURITY_REVIEW.md` masih terbuka: pengujian sebelumnya memakai tabel `storage.objects` tiruan dan tidak menguji peran siswa/wali/pending, guru pada sesi belum terbit, maupun nama objek tidak valid.

Saran: tambah tes database dengan skenario minimal (kepala sekolah, guru pemilik terbit, guru pemilik belum terbit, guru lain, siswa, wali, pending, nama folder rusak) dan jalankan pada Supabase lokal bila PGlite tidak dapat meniru Storage. Jangan mengubah policy sebelum ada tes yang gagal/berhasil jelas.

### S-03 — Temuan migration yang belum ditutup (mengikuti laporan lama)

| ID | Inti | Status pada audit ini |
| --- | --- | --- |
| K1 | `todos` tanpa `BEGIN/COMMIT`, grant DML penuh, RLS owner-only, tabel tidak dipakai UI | Belum berubah |
| K2 | `student_habits` hanya lokal, belum diterapkan; `habit_students()` definer | Belum berubah; jangan terapkan tanpa persetujuan |
| K3 | Draf umpan balik dapat dibaca administrator/kepala sekolah | Belum berubah |
| K4 | Bukti RLS Storage terbatas | Lihat S-02 |

Tingkat risiko dan saran perbaikan ada di [SECURITY_REVIEW.md](SECURITY_REVIEW.md); audit ini tidak mengubah penilaian tersebut.

## Kontrol yang terbukti (bukan jaminan menyeluruh)

| Kontrol | Bukti |
| --- | --- |
| Tidak ada secret ter-track | `git ls-files` hanya memuat `.env.example`; pola `sb_secret_`, `service_role`, private key hanya muncul di dokumentasi skill, tes, dan guard `scripts/prepare-release.mjs:54`. |
| Frontend hanya menerima publishable key | `src/lib/config.ts` menolak URL kosong/placeholder dan key yang bukan `sb_publishable_` atau JWT berperan non-`anon`; `src/lib/supabase.ts` tidak membuat klien saat konfigurasi invalid. |
| Formula injection CSV tertahan | `src/utils/csv.ts` memberi awalan `'` pada sel yang diawali `= + @ -` (termasuk spasi di depan) dan meng-escape kutip. |
| Ekspor Excel tidak menjalankan formula | Sel ditulis bertipe `String`/`Number` (`AcademicReport.tsx:83`, `AttendanceReport.tsx:65`, `AttendanceImport.tsx:43`), bukan formula. |
| Impor XLSX dibatasi | `src/features/attendance/read-attendance-xlsx.ts`: maksimal 100 entri, 4 MB/entri, 10 MB total, satu worksheet, menolak workbook terenkripsi, `vbaproject.bin`, `xl/externallinks`, dan elemen `<f>`; `import-model.ts:7-12` membatasi ekstensi, nama, dan 2 MB. Worker memiliki timeout 10 detik dan dapat dibatalkan. |
| Tidak ada sink XSS | Tidak ditemukan `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, atau `javascript:` di `src`; teks pengguna dirender sebagai anak JSX. |
| Tidak ada log data sensitif | Tidak ditemukan pemanggilan `console.*` di `src`. |
| Storage bukti supervisi | Bucket privat, batas 10 MB/MIME di server, pola nama folder UUID dan berkas UUID, unggah/hapus hanya kepala sekolah pada tahap 4 belum terbit; baca mengandalkan RLS `academic_supervisions` (lihat S-02). |
| Portal wali minimal | `school_private.guardian_attendance()` adalah `SECURITY DEFINER` dengan `search_path=''`, memeriksa `role='parent'`, hanya mengembalikan anak yang tertaut (tautan hanya dibuat administrator dan selalu memiliki `verified_at`/`verified_by`), serta 30 status terakhir tanpa nama siswa lain (`20261111075356_guardian_attendance.sql`). |
| Baseline RLS/grant | 0 grant ke `anon`/`public`; 39/39 fungsi definer memakai `search_path`; 35/35 tabel ber-RLS; grant kolom membatasi `profile_id`/peran (rincian di `SECURITY_REVIEW.md`). |

## Batas audit

- Tidak menjalankan `npm run check:supabase` pada audit ini dan tidak menyentuh Supabase hosted; klaim 23 migration hosted berasal dari dokumen proyek, bukan probe baru.
- Tidak menguji Storage hosted, akun sekolah nyata, email, atau browser sungguhan. Tes browser proyek memakai API tiruan.
- Analisis policy Storage bersifat statis; kesimpulan dapat berubah bila struktur RLS tabel rujukan diubah.
- Tidak ada uji fuzzing parser XLSX, uji beban, atau tinjauan hukum perlindungan data.

## Verifikasi yang dijalankan

`npm run check` pada `03b87c0`, Node 24.22.1: lint, TypeScript, 104/104 tes unit/database, dan build lulus (exit 0). Build masih memperingatkan chunk PDF; ukuran ada di [AUDIT_PERFORMA.md](AUDIT_PERFORMA.md).
