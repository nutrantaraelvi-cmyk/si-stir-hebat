# Checklist yang memerlukan akses pemilik

Checklist ini menyiapkan langkah yang perlu dilakukan langsung oleh pemilik/operator berwenang. Jangan menaruh password, OTP, token, publishable key, atau secret pada dokumen ini.

## Supabase Auth

- [ ] Atur Site URL ke domain produksi yang sudah dipilih.
- [ ] Tambahkan URL callback/redirect produksi dan lokal yang memang digunakan; hapus wildcard yang tidak diperlukan.
- [ ] Tinjau dan aktifkan perlindungan kata sandi bocor agar Security Advisor tidak lagi melaporkan baseline WARN.
- [ ] Konfigurasikan SMTP/domain email, verifikasi pengiriman dan reset kata sandi pada akun uji sintetis.
- [ ] Tetapkan administrator pertama lewat prosedur operator tepercaya; jangan mengubah peran akun melalui UI aplikasi.
- [ ] Jalankan UAT dengan akun uji untuk seluruh peran. UAT akun sekolah nyata tetap memerlukan jadwal, persetujuan, dan operator sekolah.

## Migration hosted

- [ ] Perbaiki resolusi DNS/jaringan lokal untuk URL project Supabase di `.env.local`; `check:supabase` 21 November 2026 gagal `ENOTFOUND` sebelum mencapai Auth. URL terverifikasi cocok dengan project tersambung; jangan kirim key/kredensial. Ringkasan diagnostik aman: `docs/logs/check-supabase-diagnostic-2026-11-21.log`.

- [ ] Verifikasi 23 versi hosted terhadap daftar berkas lokal dan `docs/archive/MIGRATION_REVIEW_2026-11-20.md`.
- [ ] Pastikan backup dan uji restore ke lingkungan terisolasi berhasil.
- [ ] Selesaikan Security Advisor baseline (saat ini ada WARN perlindungan kata sandi bocor nonaktif) sebelum penerapan; jangan meminta agen melewati syarat Advisor bersih.
- [ ] Setelah tiap tahap, jalankan `npm run check:supabase` dan tinjau Security Advisor. Berhenti bila ada temuan baru/tidak bersih.
- [ ] Sebelum UAT modul baru, setujui dan terapkan migration yang masih tercatat belum hosted di `docs/archive/MIGRATION_REVIEW_2026-11-20.md` (notifikasi, laporan ketidakhadiran, 7 Kebiasaan, dokumen sekolah, absensi guru); catat versi yang diterapkan.
- [ ] Setelah migration diterapkan, jalankan baris UAT bagian 9 di `docs/UAT_CHECKLIST.md` dengan akun uji sintetis tiap peran; jangan memakai data siswa nyata.

## Vercel

- [ ] Hubungkan repository dan branch produksi yang disetujui ke proyek Vercel.
- [ ] Atur `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` di Production/Preview yang sesuai. Gunakan hanya publishable key di variabel frontend.
- [ ] Jangan masukkan secret/service-role key ke variabel `VITE_*`, source, atau log.
- [ ] Setelah persetujuan rilis, operator dapat menjalankan deploy CLI interaktif. Simpan URL deployment dan bukti smoke publik/protected tanpa data nyata.

## Operasional

- [ ] Konfirmasi alur retensi sementara di `docs/PROSEDUR_RETENSI_OPERATOR.md` kepada pengelola sekolah.
- [ ] Tinjau backup/restore, kuota penyimpanan, dan retensi bucket privat.
- [ ] Tinjau dan jadwalkan revisi kebijakan sementara sesuai keputusan sekolah.
