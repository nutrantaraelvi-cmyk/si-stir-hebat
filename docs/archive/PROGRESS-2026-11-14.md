# Progress SI STIR HEBAT

Diperbarui: 14 November 2026

## Selesai

- Login, sesi, pemulihan kata sandi, protected routes, dan navigasi berdasarkan profil/peran. Peran ditetapkan pihak sekolah; pengguna tidak dapat memilih atau menaikkan perannya sendiri.
- Dashboard dasar peran, berita, ringkasan data aktif admin/kepala sekolah, serta akses cepat. Dashboard kepala sekolah juga menampilkan hitungan supervisi per tahap dan modul ajar yang diajukan/perlu revisi, dengan retry saat gagal memuat.
- Supervisi akademik empat tahap dengan audit dan bukti privat.
- Ruang guru: absensi murid, jurnal, modul ajar, materi/tugas, asesmen, dan usulan jadwal.
- Tes browser terfokus login, navigasi peran, dashboard, supervisi, dan alur guru: 30/30 lulus desktop/ponsel. Tes ringkasan dashboard kepala sekolah: 6/6 lulus desktop/ponsel.
- `npm run check`: lint, TypeScript, 101 tes unit/database, build lulus.
- Rilis Vercel tersedia di https://si-stir-hebat-blue.vercel.app; admin/UAT produksi tetap belum selesai.

## Sedang dikerjakan

- Tidak ada implementasi aktif. Dashboard kepala sekolah dan verifikasinya selesai.

## Backlog (urut prioritas)

1. **BLOCKED:** Ruang murid — 7 Kebiasaan Anak Indonesia Hebat. Perlu keputusan apakah murid mengisi sendiri atau guru/wali memvalidasi, frekuensi pencatatan, cakupan riwayat, serta siapa yang boleh melihat/mengubahnya sebelum menambah penyimpanan/RLS.
2. Ruang orang tua — pemberitahuan ketidakhadiran. Perlu status/alur, penerima, dan kanal pemberitahuan agar data anak tidak terbuka keliru.
3. Kontrol pengiriman perangkat/administrasi pembelajaran lebih lengkap: tipe dokumen, siklus, versi, dan kewenangan persetujuan perlu ditetapkan.
4. Polish responsif, animasi, aksesibilitas dan penerapan tema baru pada halaman yang secara eksplisit disetujui; jangan mengubah halaman selesai tanpa permintaan.
5. UAT login, email pemulihan, admin, dan rute produksi dengan pemilik akun sekolah.
6. Deploy perubahan lokal setelah persetujuan dan verifikasi root/link Vercel yang digunakan.

## Bug / catatan

- Build memberi peringatan chunk PDF besar (mesin 790,69 KB; font 855,16 KB); pemuatan tetap dinamis dan peringatan tidak disembunyikan.
- Full browser suite terakhir 172/174; dua tes selector sudah lulus ulang terfokus, suite penuh belum diulang.
- Ringkasan kepala sekolah hanya menghitung jumlah sesuai RLS; tidak menampilkan nama, catatan supervisi, atau isi modul.
- Produksi belum memuat perubahan beranda lokal terakhir.
- Site URL/redirect Supabase Auth produksi, aktivasi admin, email pemulihan nyata, dan UAT sekolah masih perlu verifikasi pemilik proyek.
- Jangan terapkan ulang 23 migration hosted yang sudah tercatat.
