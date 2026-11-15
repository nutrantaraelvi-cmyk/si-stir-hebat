# Checklist UAT Berakun Sekolah

Status: rancangan — **belum dijalankan pada akun sekolah nyata**
Tanggal: 14 November 2026
Pemilik: Kilo (QA)
Acuan detail: [PANDUAN_UAT.md](PANDUAN_UAT.md)

Berkas ini adalah daftar periksa yang dapat dicetak/diisi. `PANDUAN_UAT.md` tetap menjadi rincian skenario; bila berbeda, rincian di sana yang berlaku.

## Cara pakai

1. Siapkan akun uji A/K/G/S/W/P sesuai [PANDUAN_UAT.md](PANDUAN_UAT.md) bagian 1 beserta data sintetis minimum.
2. Jalankan pada build produksi (`npm run build` + `npm run preview`) atau deployment Vercel dengan konfigurasi Supabase valid. Jika panel "Mode demo aktif" muncul, hentikan UAT dan perbaiki konfigurasi.
3. Uji tiap skenario pada desktop 1280×900 dan ponsel 390×844 bila kolom Layar tidak menentukan lain.
4. Isi kolom **L/G** dengan `L` (lulus), `G` (gagal), atau `B` (terblokir). Tulis tanggal + inisial pada kolom Catatan, mis. `G 2026-11-20/AR: modal tidak muncul`.
5. Untuk setiap `G`, lampirkan langkah yang gagal, pesan di layar, dan tangkapan layar (simpan di luar repo).
6. Jangan mengubah kode, migration, atau data hosted selama sesi UAT. Jangan mencatat kata sandi/token di berkas ini.

## Legenda

| Kode | Peran |
| --- | --- |
| A | administrator |
| K | principal (kepala sekolah) |
| G | teacher (guru) |
| S | student (siswa) |
| W | parent (wali) |
| P | pending |

Layar: `D` = desktop, `M` = ponsel, `D+M` = keduanya.

---

## 1. Umum (semua peran)

| ID | Langkah | Hasil diharapkan | Layar | L/G | Catatan |
| --- | --- | --- | --- | --- | --- |
| U-01 | `/login` dengan email tidak terdaftar. | Pesan galat tampil pada `alert`; tetap di `/login`; tidak ada data sekolah. | D+M | | |
| U-02 | `/login` dengan kata sandi salah 3×. | Setiap percobaan ditolak; tidak ada data yang tampil. | D+M | | |
| U-03 | Masuk sebagai A, K, G, S, W. | Tiba di `/dashboard`; nama dan peran benar; menu sesuai peran. | D+M | | |
| U-04 | Muat ulang setelah masuk, lalu keluar. | Sesi bertahan setelah muat ulang; setelah keluar rute terlindungi dialihkan ke `/login`. | D+M | | |
| U-05 | `/akun` ubah nama lalu simpan. | Nama tersimpan dan tampil; peran tidak dapat diubah dari UI. | D+M | | |
| U-06 | `/lupa-kata-sandi` lalu buka tautan email ke `/kata-sandi`. | Pesan tidak mengungkap status email; kata sandi min. 8 karakter dan konfirmasi harus sama. | D | | |
| U-07 | Tanpa login buka `/dashboard`, `/sekolah`, `/absensi`. | Dialihkan ke `/login`; tidak ada data. | D+M | | |
| U-08 | Periksa panel login produksi. | Tidak ada panel "Mode demo aktif" dan tidak ada akun sintetis. | D+M | | |
| U-09 | Jalankan satu alur utama dengan keyboard saja. | Fokus terlihat, urutan tab logis, Escape menutup dialog konfirmasi. | D+M | | |
| U-10 | Buka `/` dan rute tidak dikenal. | Beranda memuat; rute tak dikenal menampilkan "Halaman tidak ditemukan" + tautan kembali. | D+M | | |

## 2. Akun pending (P)

| ID | Langkah | Hasil diharapkan | Layar | L/G | Catatan |
| --- | --- | --- | --- | --- | --- |
| P-01 | Masuk sebagai P, buka `/dashboard` dan `/akun`. | Profil tampil dengan pesan menunggu penetapan peran; P dapat mengubah nama sendiri. | D+M | | |
| P-02 | Buka `/pengumuman` dan `/sekolah` langsung lewat URL. | Ditolak; tidak ada pengumuman/data master. | D+M | | |
| P-03 | Buka `/tautan-akun`, `/absensi`, `/jurnal`, `/asesmen`, `/supervisi`. | Ditolak atau tidak menampilkan data. | D | | |

## 3. Administrator (A)

| ID | Langkah | Hasil diharapkan | Layar | L/G | Catatan |
| --- | --- | --- | --- | --- | --- |
| A-01 | `/sekolah` identitas: isi nama/alamat/NPSN lalu simpan. | Tersimpan; NPSN salah ditolak; tidak ada nilai default palsu. | D+M | | |
| A-02 | Buat tahun ajaran, aktifkan; buat semester di dalam rentangnya. | Aktivasi minta konfirmasi; hanya satu tahun aktif; tanggal di luar rentang ditolak. | D+M | | |
| A-03 | Buat mata pelajaran dan kelas (tingkat 1–6, kapasitas 1–100). | Tersimpan; nilai di luar batas ditolak. | D+M | | |
| A-04 | Catat guru dan siswa pada `/sekolah/teachers` dan `/sekolah/students`. | Tersimpan; tidak ada kolom akun/peran/NIP/NISN. | D+M | | |
| A-05 | Masukkan siswa ke kelas; coba siswa yang sama ke kelas lain tahun sama. | Keanggotaan tersimpan; keanggotaan ganda dan kapasitas terlampaui ditolak. | D+M | | |
| A-06 | Tugaskan guru ke kelas + mata pelajaran. | Penugasan tersimpan; konflik ditolak. | D+M | | |
| A-07 | `/pengumuman` buat draf, terbitkan, arsipkan; periksa sebagai G/S/W. | Draf/arsip hanya untuk A/K; pembaca hanya melihat terbit; isi teks biasa. | D+M | | |
| A-08 | `/tautan-akun` tautkan G, S, lalu W ke S. | Tautan aktif; G membaca siswa kelasnya, S melihat profil sendiri, W melihat anaknya. | D | | |
| A-09 | `/jadwal` tambah dan ubah jadwal. | Tersimpan; konflik guru/kelas ditolak; revisi optimistis berlaku. | D+M | | |
| A-10 | Minta G mengusulkan perubahan jadwal, lalu putuskan sebagai A. | Persetujuan menerapkan perubahan; penolakan wajib alasan; usulan lain tetap pending. | D+M | | |
| A-11 | `/absensi` buka sesi dan rekap. | A hanya membaca; tidak ada tombol isi/impor status. | D+M | | |
| A-12 | Buka `/jurnal`, `/modul-ajar`, `/materi`, `/tugas`, `/asesmen`. | A hanya membaca data yang diizinkan; tidak dapat menulis nilai/absensi. | D+M | | |
| A-13 | Buka `/supervisi` dan `/ruang-orang-tua`. | Tidak tersedia untuk A; akses URL langsung ditolak. | D+M | | |

## 4. Kepala sekolah (K)

| ID | Langkah | Hasil diharapkan | Layar | L/G | Catatan |
| --- | --- | --- | --- | --- | --- |
| K-01 | Buka semua tab `/sekolah`. | K membaca; tidak ada tombol tambah/ubah yang berhasil. | D+M | | |
| K-02 | Kelola pengumuman (buat/ubah/terbit/arsip). | K dapat mengelola; tidak mendapat akses seluruh profil. | D+M | | |
| K-03 | `/sekolah/teachers` dan `/sekolah/students`. | K membaca registri; tidak dapat mengubah. | D+M | | |
| K-04 | `/absensi` sesi, riwayat koreksi, rekap tanggal, riwayat impor. | K membaca; tidak ada aksi tulis. | D+M | | |
| K-05 | `/jurnal` daftar jurnal G. | K membaca; tidak dapat membuat/mengubah. | D+M | | |
| K-06 | `/modul-ajar` kembalikan modul dengan alasan, lalu setujui. | Status berubah dan tercatat; alasan wajib saat mengembalikan. | D+M | | |
| K-07 | `/supervisi` buat supervisi, isi tahapan, unggah bukti PDF/JPG/PNG ≤10 MB. | Tersimpan; bukti terunggah; laporan terbuka. | D | | |
| K-08 | `/jadwal` lihat usulan G. | K hanya membaca; keputusan milik A. | D+M | | |
| K-09 | Buka `/tautan-akun`. | Ditolak. | D+M | | |
| K-10 | `/dashboard` periksa ringkasan supervisi/modul ajar. | Angka kosong tampil sebagai `—` bila gagal dimuat, bukan 0. | D+M | | |

## 5. Guru (G)

| ID | Langkah | Hasil diharapkan | Layar | L/G | Catatan |
| --- | --- | --- | --- | --- | --- |
| G-01 | `/absensi` buat sesi kelas penugasan untuk hari ini. | Sesi hari ini dengan semua status "Belum diisi"; sesi lampau tidak tersedia. | D+M | | |
| G-02 | Isi status lalu simpan; ubah status terisi tanpa alasan. | Simpan berhasil; koreksi tanpa alasan 5–300 karakter ditolak; riwayat mencatat. | D+M | | |
| G-03 | Simpan dari dua tab pada sesi sama. | Konflik revisi terdeteksi; UI minta muat ulang; tidak ada penimpaan diam-diam. | D | | |
| G-04 | Unduh template XLSX, isi, unggah, periksa preview, konfirmasi. | Preview wajib; kode asing/ganda memblokir; status kosong tidak mengubah catatan. | D+M | | |
| G-05 | Ulangi impor yang sama setelah respons tidak pasti. | Request ID sama; tidak ada duplikasi. | D | | |
| G-06 | Rekap rentang ≤31 hari lalu ekspor CSV. | Termasuk "Belum diisi"; >31 hari ditolak; ekspor hanya setelah semua query berhasil. | D+M | | |
| G-07 | `/jurnal` buat jurnal hari ini. | Tersimpan dengan snapshot server; tidak dapat diedit/dihapus. | D+M | | |
| G-08 | `/modul-ajar` buat draf lalu kirim. | Draf dapat diubah sebelum dikirim; setelah dikirim menunggu keputusan. | D+M | | |
| G-09 | `/materi` buat draf lalu terbitkan. | S hanya melihat setelah terbit. | D+M | | |
| G-10 | `/tugas` buat tugas, periksa jawaban S, beri umpan balik. | Hanya tugas milik G; umpan balik draf tidak terlihat S sebelum terbit. | D+M | | |
| G-11 | `/asesmen` buat asesmen, isi nilai, terbitkan, koreksi terbit. | Publikasi manual; koreksi wajib alasan dan tercatat; tidak ada rapor otomatis. | D+M | | |
| G-12 | `/jadwal` usulkan perubahan. | Tersimpan sebagai pending; jadwal tidak berubah sampai A memutuskan. | D+M | | |
| G-13 | `/supervisi` buka supervisi milik G. | G melihat miliknya; supervisi guru lain tidak tampil. | D+M | | |
| G-14 | `/sekolah/teachers` dan `/sekolah/students`. | Hanya profil sendiri dan siswa kelas penugasan. | D+M | | |
| G-15 | Buka `/tautan-akun`. | Ditolak. | D+M | | |

## 6. Siswa (S)

| ID | Langkah | Hasil diharapkan | Layar | L/G | Catatan |
| --- | --- | --- | --- | --- | --- |
| S-01 | `/akun` dan `/sekolah/students`. | Hanya profil sendiri. | D+M | | |
| S-02 | `/absensi` buka catatan kehadiran. | Hanya catatan S; alasan koreksi staf tidak terlihat; tidak dapat mengisi. | D+M | | |
| S-03 | `/absensi` tampilkan rekap kelas. | Hanya baris S. | D+M | | |
| S-04 | `/materi` buka materi terbit. | Terbaca; draf tidak tampil. | D+M | | |
| S-05 | `/tugas` buka tugas terbit dan kirim jawaban. | Jawaban tersimpan; jawaban siswa lain tidak tampil. | D+M | | |
| S-06 | `/asesmen` buka hasil. | Hanya asesmen terbit milik S. | D+M | | |
| S-07 | `/jadwal` dan `/pengumuman`. | Membaca; tidak ada tombol kelola. | D+M | | |
| S-08 | Buka `/jurnal`, `/modul-ajar`, `/supervisi`, `/tautan-akun`. | Ditolak; tidak ada data guru/staf. | D+M | | |

## 7. Wali (W)

| ID | Langkah | Hasil diharapkan | Layar | L/G | Catatan |
| --- | --- | --- | --- | --- | --- |
| W-01 | `/ruang-orang-tua` buka portal. | Hanya anak tertaut aktif; maksimal 30 catatan terbaru. | D+M | | |
| W-02 | Setelah A menonaktifkan relasi, muat ulang portal. | Anak tidak lagi tampil pada permintaan berikutnya. | D+M | | |
| W-03 | `/pengumuman` dan `/jadwal`. | Membaca; tidak ada tombol kelola. | D+M | | |
| W-04 | `/materi` dan `/tugas` anak. | Hanya data anak tertaut yang terbit. | D+M | | |
| W-05 | `/asesmen` hasil anak. | Hanya asesmen terbit anak tertaut. | D+M | | |
| W-06 | Buka `/absensi`, `/sekolah/teachers`, `/sekolah/students`, `/jurnal`, `/tautan-akun`. | Ditolak; tidak ada data registri/absensi mentah/jurnal. | D+M | | |

## 8. Keamanan lintas peran

| ID | Langkah | Hasil diharapkan | Layar | L/G | Catatan |
| --- | --- | --- | --- | --- | --- |
| X-01 | Untuk tiap peran, buka URL yang tidak ada di menunya. | UI menolak dan permintaan data tidak mengembalikan baris (periksa tab Network). | D | | |
| X-02 | Sebagai G, coba baca siswa di luar kelas penugasan via Data API dengan sesi G. | Tidak ada baris; penolakan dari database. | D | | |
| X-03 | Sebagai G, coba unduh URL bukti supervisi G lain. | Ditolak; bucket tetap privat. | D | | |
| X-04 | Jalankan `npm run check:supabase` dengan `.env.local` benar. | Auth aktif; seluruh tabel pada daftar menolak anonim; tidak membaca baris data. | D | | |
| X-05 | Periksa Network saat login/ubah profil. | Tidak ada secret/service role key; peran tidak dapat diubah dari metadata pengguna. | D | | |

## 9. Setelah UAT

1. Kumpulkan semua baris `G` ke bagian "Permintaan Lintas AI" pada [AI_COORDINATION.md](AI_COORDINATION.md) beserta modul dan langkah.
2. Jangan memperbaiki kode saat sesi UAT; perbaikan dilakukan pemilik modul.
3. Jangan menulis "sudah diuji dengan akun sekolah" di README/PROJECT_STATUS sebelum seluruh skenario kritis `L`.
4. Simpan berkas terisi di luar repo atau di artefak yang disetujui pemilik; jangan mengandung data pribadi.