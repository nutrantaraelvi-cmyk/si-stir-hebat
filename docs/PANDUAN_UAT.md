# Panduan UAT per Peran

Status: rancangan pengujian — belum dijalankan pada akun sekolah nyata
Tanggal: 14 November 2026
Penulis: Qoder

Panduan ini hanya memuat fitur yang benar-benar ada di aplikasi. Modul komunikasi, administrasi dokumen, dan kebiasaan siswa **belum memiliki UI** dan tidak termasuk di sini. Pengujian otomatis (unit/database dan browser tiruan) tidak menggantikan UAT ini.

## 1. Prasyarat

- Lingkungan: proyek Supabase staging bila tersedia. Jika memakai proyek hosted produksi, gunakan **hanya data sintetis** dan dapatkan persetujuan pemilik; jangan memakai identitas siswa/guru nyata.
- Build: deployment Vercel atau `npm run build` + `npm run preview` dengan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` terisi. Jika halaman login menampilkan panel "Mode demo aktif", konfigurasi Supabase tidak valid — hentikan UAT dan perbaiki konfigurasi.
- Akun uji (dibuat pengelola lewat Supabase Auth; peran ditetapkan operator sesuai README, bukan dari UI):

| Kode | Peran | Keperluan data |
|------|-------|----------------|
| A | administrator | — |
| K | principal (kepala sekolah) | — |
| G | teacher (guru) | profil guru tertaut ke akun, penugasan aktif |
| S | student (siswa) | profil siswa tertaut ke akun, anggota kelas aktif |
| W | parent (wali) | relasi wali–siswa terverifikasi ke S |
| P | pending | akun baru tanpa penetapan peran |

- Data sintetis minimum: satu tahun ajaran aktif, satu semester aktif, satu mata pelajaran, satu kelas (kapasitas cukup), dua siswa (S dan siswa kedua), keanggotaan kelas, satu penugasan guru, satu pengumuman terbit, satu jadwal, satu modul ajar, satu materi, satu tugas, satu asesmen.
- Browser: desktop 1280×900 dan ponsel 390×844. Uji keyboard (Tab/Shift+Tab/Enter/Escape) pada tiap formulir utama.
- Jangan mencatat kata sandi, token, atau isi `.env.local` di laporan; gunakan label akun A/K/G/S/W/P.

## 2. Cara mencatat hasil

Isi kolom **Hasil** dengan `Lulus`, `Gagal`, atau `Terblokir`, diikuti tanggal dan inisial penguji (contoh: `Lulus 2026-11-20/AR`). Untuk kegagalan, tulis langkah yang gagal, pesan di layar, dan simpan tangkapan layar di luar repo. Jangan mengubah kode atau migration saat UAT.

## 3. Skenario umum (semua peran)

| ID | Langkah | Hasil diharapkan | Hasil |
|----|---------|------------------|-------|
| UM-01 | Buka `/login`, masuk dengan email tidak terdaftar atau kata sandi salah. | Pesan galat masuk tampil (role `alert`), tidak ada sesi, tidak ada data sekolah. | |
| UM-02 | Masuk sebagai A, K, G, S, W dengan kredensial benar. | Masuk ke `/dashboard`; nama dan peran benar; menu sesuai peran. | |
| UM-03 | Muat ulang halaman setelah masuk, lalu klik keluar. | Sesi bertahan setelah muat ulang; setelah keluar, rute terlindungi kembali ke `/login`. | |
| UM-04 | Buka `/akun`, ubah nama, simpan. | Nama tersimpan dan tampil di header/dashboard; peran tidak dapat diubah dari UI. | |
| UM-05 | Buka `/lupa-kata-sandi`, kirim email akun uji; buka tautan pemulihan. | Pesan tidak mengungkap status email; halaman `/kata-sandi` meminta kata sandi ≥8 karakter dan konfirmasi sama. | |
| UM-06 | Tanpa login, buka `/dashboard`, `/sekolah`, `/absensi`, `/asesmen`. | Dialihkan ke `/login`; tidak ada data yang tampil. | |
| UM-07 | Buka aplikasi produksi dan periksa panel login. | **Tidak** ada panel "Mode demo aktif" dan tidak ada akun sintetis `admin@sdn03.sch.id` dkk. | |
| UM-08 | Ulangi satu alur utama pada viewport 390×844 dan dengan keyboard saja. | Tidak ada gulir horizontal; fokus terlihat; label formulir terbaca pembaca layar; dialog konfirmasi dapat ditutup dengan Escape. | |

## 4. Akun pending (P)

| ID | Langkah | Hasil diharapkan | Hasil |
|----|---------|------------------|-------|
| PD-01 | Masuk sebagai P, buka `/dashboard` dan `/akun`. | Profil tampil dengan pesan "Menunggu penetapan peran"; P dapat mengubah nama sendiri. | |
| PD-02 | Buka `/pengumuman` dan `/sekolah` langsung lewat URL. | Ditolak dengan pesan peran belum ditetapkan; tidak ada pengumuman atau data master yang tampil. | |

## 5. Administrator (A)

| ID | Langkah | Hasil diharapkan | Hasil |
|----|---------|------------------|-------|
| AD-01 | `/sekolah` → Identitas sekolah: isi nama/alamat/NPSN (8 digit) lalu simpan. | Data tersimpan; NPSN salah ditolak; tidak ada nilai default palsu. | |
| AD-02 | `/sekolah` → Tahun ajaran: buat tahun, aktifkan; buat semester di dalam rentangnya. | Aktivasi meminta konfirmasi; hanya satu tahun aktif; tanggal semester di luar rentang ditolak. | |
| AD-03 | `/sekolah` → Mata pelajaran dan Kelas: buat kode/nama; kelas tingkat 1–6, kapasitas 1–100. | Data tersimpan; kode/nilai di luar batas ditolak. | |
| AD-04 | `/sekolah/teachers` dan `/sekolah/students`: catat G dan S dengan kode internal. | Data tersimpan; tidak ada kolom akun/peran/NIP/NISN; mencoba mengisi `profile_id` tidak tersedia di UI. | |
| AD-05 | `/sekolah/class_enrollments`: masukkan S dan siswa kedua ke kelas; coba tambah S ke kelas lain pada tahun yang sama. | Keanggotaan aktif tersimpan; keanggotaan ganda ditolak; kapasitas terlampaui ditolak. | |
| AD-06 | `/sekolah/teacher_assignments`: tugaskan G ke kelas dan mata pelajaran. | Penugasan tersimpan; G hanya dapat membaca siswa kelas itu setelah akun tertaut. | |
| AD-07 | `/pengumuman`: buat draf, terbitkan, arsipkan; buka sebagai G/S/W. | Draf/arsip hanya terlihat A/K; pembaca hanya melihat yang terbit; isi dirender sebagai teks biasa. | |
| AD-08 | `/tautan-akun`: tautkan profil G dan S ke akun, lalu tautkan W ke S. | Setelah tautan aktif, G dapat membaca siswa kelasnya, S melihat profil sendiri, dan W melihat anaknya di portal. | |
| AD-09 | `/jadwal`: tambah jadwal; ubah satu jadwal. | Jadwal tersimpan dan tampil untuk peran pembaca; konflik validasi ditolak. | |
| AD-10 | Minta G mengusulkan perubahan jadwal, lalu buka `/jadwal` sebagai A. | Satu usulan menunggu per jadwal; A dapat menyetujui/menerapkan atau menolak dengan alasan; G tidak dapat mengubah langsung. | |
| AD-11 | `/absensi`: buka sesi dan rekap; periksa tombol isi/simpan. | A hanya membaca; rekap/CSV mengikuti data tersimpan; tidak ada tombol mengisi status. | |
| AD-12 | `/jurnal`, `/modul-ajar`, `/materi`, `/tugas`, `/asesmen`. | A dapat membaca data yang diizinkan RLS; tidak ada tombol membuat/menyetujui kecuali yang memang tersedia; tidak dapat menulis absensi. | |
| AD-13 | Buka `/supervisi` dan `/ruang-orang-tua`. | Menu tidak tampil untuk A; akses URL langsung ditolak. | |

## 6. Kepala sekolah (K)

| ID | Langkah | Hasil diharapkan | Hasil |
|----|---------|------------------|-------|
| KS-01 | Buka `/sekolah` dan seluruh tab data master. | K membaca semua tab; tidak ada tombol tambah/ubah yang berhasil (form tidak tersedia atau ditolak RLS). | |
| KS-02 | `/pengumuman`: buat, ubah, terbitkan, arsipkan. | K dapat mengelola pengumuman seperti A; tidak mendapat akses menyeluruh ke semua profil. | |
| KS-03 | `/sekolah/teachers` dan `/sekolah/students`. | K membaca registri; tidak dapat mencatat/mengubah. | |
| KS-04 | `/absensi`: buka sesi, riwayat koreksi, rekap tanggal, riwayat impor. | K membaca; tidak ada tombol mengisi/mengimpor; siswa hanya melihat catatan sendiri (uji dengan S). | |
| KS-05 | `/jurnal`: buka daftar jurnal G. | K membaca jurnal guru; tidak dapat membuat/mengedit. | |
| KS-06 | `/modul-ajar`: minta G mengirim modul, lalu setujui atau kembalikan dengan alasan ≥5 karakter. | Status berubah dan tercatat; alasan wajib saat mengembalikan; K tidak dapat membuat modul. | |
| KS-07 | `/supervisi`: buat supervisi untuk G, isi tahapan, unggah bukti PDF/JPG/PNG ≤10 MB. | Supervisi tersimpan; bukti terunggah; laporan dapat dibuka. | |
| KS-08 | `/jadwal`: periksa usulan G. | K hanya membaca; keputusan usulan adalah kewenangan A. | |
| KS-09 | Buka `/tautan-akun`. | Ditolak; hanya administrator yang dapat menautkan akun. | |

## 7. Guru (G)

| ID | Langkah | Hasil diharapkan | Hasil |
|----|---------|------------------|-------|
| GR-01 | `/absensi`: buat sesi untuk kelas yang ditugaskan hari ini. | Sesi hari ini dibuat dengan seluruh status "Belum diisi"; sesi lampau tidak tersedia; satu sesi per kelas per hari. | |
| GR-02 | Isi Hadir/Sakit/Izin/Alpa lalu simpan; ubah status yang sudah terisi. | Simpan batch berhasil; koreksi tanpa alasan 5–300 karakter ditolak; riwayat mencatat status lama/baru. | |
| GR-03 | Buka sesi yang sama di dua tab, simpan dari tab lama. | Konflik revisi terdeteksi; UI meminta muat ulang; tidak ada penimpaan diam-diam. | |
| GR-04 | Unduh template XLSX, isi status, unggah, periksa preview, konfirmasi. | Preview wajib; kode asing/ganda, status salah, atau koreksi tanpa alasan memblokir seluruh impor; status kosong tidak mengubah catatan. | |
| GR-05 | Ulangi impor yang sama setelah respons tidak pasti. | Request ID sama mengembalikan hasil sebelumnya; tidak ada duplikasi; riwayat impor bertambah sesuai aturan. | |
| GR-06 | `/absensi`: pilih kelas dan rentang ≤31 hari, tampilkan rekap. | Rekap per siswa termasuk "Belum diisi"; hari tanpa sesi bukan alpa; rentang >31 hari ditolak; CSV hanya setelah semua query berhasil. | |
| GR-07 | `/jurnal`: buat jurnal hari ini untuk penugasan aktif. | Jurnal tersimpan dengan nama guru/kelas/mapel tersalin server; jurnal tersimpan tidak dapat diedit/dihapus; guru lain tidak melihatnya. | |
| GR-08 | `/modul-ajar`: buat modul, simpan draf, kirim ke K. | Draf dapat diubah; setelah dikirim menunggu keputusan; G tidak dapat menyetujui modul sendiri. | |
| GR-09 | `/materi`: buat materi draf lalu terbitkan. | S hanya melihat materi terbit setelah terbit; draf tidak terlihat siswa/wali. | |
| GR-10 | `/tugas`: buat tugas, lalu periksa jawaban S dan beri umpan balik. | G hanya melihat jawaban tugas miliknya; umpan balik draf tidak terlihat siswa sampai terbit; G tidak melihat jawaban tugas guru lain. | |
| GR-11 | `/asesmen`: buat asesmen draf, isi nilai, terbitkan; koreksi nilai yang sudah terbit. | Nilai maksimum per asesmen tersimpan; publikasi manual; koreksi memerlukan alasan dan tercatat; tidak ada perhitungan rapor otomatis. | |
| GR-12 | `/jadwal`: usulkan perubahan jadwal. | Usulan tersimpan sebagai pending dan tidak mengubah jadwal sampai A menyetujui; satu pending per jadwal. | |
| GR-13 | `/supervisi`: buka supervisi yang ditujukan kepada G. | G melihat data yang relevan; G tidak dapat membuka supervisi guru lain. | |
| GR-14 | Buka `/sekolah/teachers` dan `/sekolah/students`. | G hanya melihat profil guru sendiri dan siswa pada kelas penugasannya; siswa di luar penugasan tidak tampil. | |
| GR-15 | Buka `/tautan-akun` dan coba ubah pengumuman. | Keduanya ditolak; navigasi pengelolaan tidak tampil. | |

## 8. Siswa (S)

| ID | Langkah | Hasil diharapkan | Hasil |
|----|---------|------------------|-------|
| SW-01 | `/akun` dan `/sekolah/students`. | S melihat profil sendiri; tidak melihat siswa lain. | |
| SW-02 | `/absensi`: buka catatan kehadiran. | Hanya catatan S; alasan koreksi staf tidak terlihat; S tidak dapat mengisi status. | |
| SW-03 | `/absensi`: tampilkan rekap satu kelas/rentang. | Hasil hanya berisi catatan S; tidak ada data siswa lain. | |
| SW-04 | `/materi`: buka materi terbit. | Materi terbit terbaca; draf tidak tampil; tautan pengelolaan tidak ada. | |
| SW-05 | `/tugas`: buka tugas terbit dan kirim jawaban sebelum tenggat. | Jawaban tersimpan; S tidak melihat jawaban siswa lain; setelah tenggat perilaku sesuai UI (tidak mengubah data orang lain). | |
| SW-06 | `/asesmen`: buka hasil asesmen. | Hanya asesmen terbit milik S; draf dan hasil siswa lain tidak tampil; alasan koreksi staf tidak terbuka. | |
| SW-07 | `/jadwal` dan `/pengumuman`. | Membaca jadwal dan pengumuman terbit; tidak ada tombol mengelola. | |
| SW-08 | Buka `/jurnal`, `/modul-ajar`, `/supervisi`, `/tautan-akun`. | Ditolak atau tidak tersedia; tidak ada data guru/staf yang bocor. | |

## 9. Wali (W)

| ID | Langkah | Hasil diharapkan | Hasil |
|----|---------|------------------|-------|
| WL-01 | `/ruang-orang-tua`: buka portal kehadiran. | Hanya anak yang tertaut dan masih aktif; maksimal 30 catatan terbaru; anak yang tidak tertaut tidak tampil. | |
| WL-02 | Setelah relasi W–S dinonaktifkan oleh A, muat ulang portal. | Anak tersebut tidak lagi tampil pada permintaan berikutnya. | |
| WL-03 | `/pengumuman` dan `/jadwal`. | W membaca pengumuman terbit dan jadwal; tidak ada tombol mengelola. | |
| WL-04 | `/materi` dan `/tugas`: buka materi terbit dan umpan balik tugas anak. | Hanya data anak tertaut yang terbit; draf, jawaban siswa lain, dan data anak lain tidak tampil. | |
| WL-05 | `/asesmen`: buka hasil asesmen anak. | Hanya asesmen terbit milik anak tertaut; hasil siswa lain tidak tampil. | |
| WL-06 | Buka `/absensi`, `/sekolah/teachers`, `/sekolah/students`, `/jurnal`, `/tautan-akun` lewat URL langsung. | Ditolak; tidak ada data registri, absensi mentah, jurnal, atau tautan akun yang tampil. | |

## 10. Pemeriksaan keamanan lintas peran

| ID | Langkah | Hasil diharapkan | Hasil |
|----|---------|------------------|-------|
| SEC-01 | Untuk tiap peran, buka lewat URL langsung halaman yang tidak ada di menunya (contoh: S → `/jurnal`, W → `/sekolah/students`, K → `/tautan-akun`). | UI menolak dan RLS tidak mengembalikan baris; bukan sekadar menu disembunyikan. | |
| SEC-02 | Sebagai G, coba akses data siswa di kelas yang tidak ditugaskan (cari lewat UI atau panggilan Data API dengan sesi G). | Tidak ada baris yang dikembalikan; penolakan berasal dari database. | |
| SEC-03 | Sebagai G, unggah bukti supervisi; sebagai G lain, coba unduh URL bukti tersebut. | Unduhan ditolak; bucket tetap privat. | |
| SEC-04 | Jalankan `npm run check:supabase` dari repo dengan `.env.local` yang benar. | Auth aktif; seluruh tabel pada daftar ditolak untuk anonim; skrip tidak membaca baris data. | |
| SEC-05 | Periksa permintaan jaringan saat login/ubah profil. | Tidak ada secret/service role key di bundle atau permintaan; peran tidak dikirim sebagai metadata yang dapat diubah pengguna. | |

## 11. Setelah UAT

1. Isi seluruh kolom Hasil; kumpulkan kegagalan ke bagian "Permintaan Lintas AI" di `docs/AI_COORDINATION.md` dengan modul dan langkah yang gagal.
2. Jangan memperbaiki kode/migration saat sesi UAT; perbaikan dilakukan pemilik modul.
3. Perbarui `README.md` hanya setelah hasil UAT diverifikasi; status "sudah diuji akun sekolah" tidak boleh diklaim sebelum seluruh skenario kritis Lulus.
