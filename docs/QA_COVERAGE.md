# Cakupan Uji Otomatis

Status: verifikasi lokal 20 November 2026
Sumber: `tests/browser/*.spec.ts` (suite terbaru 402 skenario di delapan berkas spesifikasi) dan `tests/*.test.mjs` (140 tes unit/database).
Bukti tes kanonik terbaru: Node v24.22.3, **140/140 tes unit/database lulus** pada rerun 20 November; lint dan typecheck bersih. `npm run check` lalu EXIT 1 karena Vite gagal membersihkan `dist/assets` terkunci (`EPERM`), bukan karena assertion. Log `docs/logs/check-2026-11-20-current-node24.log`. Build terpisah sementara mentransformasi 1.788 modul dan audit 29 JavaScript tanpa akun demo lulus, tetapi `dist/` belum terganti. Browser penuh **402/402 lulus** (port 5472, 10,4 menit, trace off; `docs/logs/browser-full-2026-11-20-port5472-traceoff.log`). Semua browser API tiruan; bukan UAT.

Cara membaca: "Ada" berarti minimal satu skenario browser pada desktop dan ponsel dengan API tiruan. Semua modul di bawah **belum** diuji dengan akun sekolah nyata; lihat [UAT_CHECKLIST.md](UAT_CHECKLIST.md).

## Matriks per modul

| Modul | Skenario yang tercakup | Belum tercakup |
| --- | --- | --- |
| Autentikasi & sesi | login gagal/diulang, sesi bertahan saat muat ulang, keluar, rute terlindungi, lupa/ubah kata sandi, profil, akun pending; tanpa konfigurasi Supabase halaman masuk tidak menampilkan panel/teks demo dan menjelaskan konfigurasi yang hilang (cek QA manual Q3, bukan tes repo) | email pemulihan nyata, embargo rate-limit Supabase, tes browser no-env menunggu varian konfigurasi Playwright milik Codex |
| Dashboard & peran | layanan per peran, pengumuman terbaru, hitungan supervisi/modul ajar, nol vs gagal vs `—`, retry, ringkasan sekolah (admin/kepala sekolah), matriks "Akses cepat" untuk 6 peran × desktop + ponsel (12/12 fokus, 33,7 dtk): Materi/Tugas/Asesmen hanya guru/siswa/wali; Dokumen sekolah dan Absensi guru hanya staf; Siapkan data sekolah hanya administrator; Kehadiran anak hanya wali; akun menunggu hanya dua tautan akun; navigasi utama lima peran (tanpa akun menunggu) memeriksa hal yang sama: Materi Kelas, Tugas Kelas, dan Asesmen tampil hanya untuk guru/siswa/wali dan tidak tampil untuk administrator/kepala sekolah (10/10 fokus desktop + ponsel, 11,6 dtk, port 5191) | ringkasan khusus guru/keluarga (PRD 5.x lanjutan); tes unit `src/utils/permissions.ts` menunggu slot berkas dari Codex |
| Pengumuman | buat/ubah/terbit/arsip oleh pengelola, pembaca hanya terbit, pagination, galat jaringan | pengaturan target penerima |
| Data sekolah & registri | identitas, tahun ajaran/semester, mapel, kelas, guru/siswa, keanggotaan, penugasan, penolakan peran; daftar referensi lebih dari 1000 baris menampilkan notifikasi pemotongan dan form tetap dapat dipakai | impor data master, riwayat perubahan master |
| Absensi guru | 5 skenario UI (desktop + ponsel): guru mengulang absen masuk setelah respons hilang dengan ID permintaan yang sama; kepala sekolah menyetujui koreksi (`approved`) tanpa tombol absen; penolakan wali, siswa, dan akun menunggu tanpa membaca `teacher_attendance`/`teacher_attendance_corrections`; pagination riwayat 26 baris: indikator "Daftar terpotong; muat halaman berikutnya." tampil di halaman 1 dan hilang di halaman 2, tombol Sebelumnya kembali ke halaman 1 (2/2 fokus desktop + ponsel, port 5191, 11,4 dtk bersama dokumen). Penolakan fokus 6/6 port 5191, 46,9 dtk bersama dokumen; berkas lulus 6/6 pada regresi Q34 sebelum peran diperluas | koreksi ditolak lewat browser, pengajuan koreksi lewat formulir browser, akun sekolah nyata |
| Absensi manual | sesi hari ini, isi status, koreksi/alasan, konflik revisi, penolakan siswa/wali, laporan >1000 baris | backdate, persetujuan koreksi, kehadiran guru |
| Impor Excel | preview wajib, penolakan duplikat/tipe, retry request ID sama | file rusak/terkunci di sisi server |
| Rekap absensi | rentang >31 hari ditolak, agregasi hanya baris sendiri (siswa), ekspor CSV | ekspor PDF rekap absensi |
| Jurnal | simpan + konfirmasi, retry ID sama, baca admin/kepala sekolah, penolakan siswa/wali/pending, pagination/CSV, status kesiapan | persetujuan/koreksi jurnal |
| Modul ajar | guru simpan draf, guru ajukan, kepala sekolah kembalikan dengan catatan, kepala sekolah setujui lalu arsipkan modul terbit | lampiran |
| Materi kelas | guru terbitkan, siswa membaca terbit tanpa kontrol tulis, guru mengarsipkan materi terbit setelah konfirmasi (tanpa tulis sebelum setuju) | lampiran |
| Tugas kelas | siswa melihat tenggat, siswa mengirim jawaban (sukses/respons hilang/duplikat), guru membuat tugas, umpan balik guru, wali membaca umpan balik | pengumpulan lampiran, penilaian tugas→asesmen |
| Asesmen & rekap | guru buat/nilai nol/terbit/koreksi+riwayat, konflik revisi, laporan filter/grafik/ekspor CSV-Excel-PDF, mode terpotong/limpas/gagal, wali hanya hasil terbit, pending ditolak, peran baca-saja | kewenangan wali kelas, perubahan peserta |
| Jadwal | admin buat/ubah/konflik, usulan guru, keputusan admin (termasuk revisi usang), riwayat kepala sekolah, filter kelas | penarikan usulan guru, pemecahan periode |
| Supervisi | jadwal→observasi, simpan otomatis + konflik, unggah bukti privat, laporan + ekspor, penolakan siswa/wali/pending | instrumen resmi, tanda tangan digital |
| Tautan akun & wali | admin meninjau tautan, portal wali & pencabutan relasi, penolakan wali pada formulir tautan, penolakan guru/siswa/wali/pending | verifikasi identitas manual |
| Komunikasi | 3 skenario UI: respons insert hilang dan konfirmasi pesan; pagination melewati batas 25 baris tanpa celah plus indikator "Daftar terpotong; muat halaman berikutnya." yang hilang di halaman terakhir; penolakan kepala sekolah, administrator, siswa, dan akun menunggu tanpa memanggil penerima/pesan dan tanpa tautan Komunikasi di navigasi. Penolakan fokus 8/8 (4 peran × desktop + ponsel, port 5191, 59,8 dtk); indikator fokus 4/4 (desktop + ponsel, 11,7 dtk) | pengujian dengan akun sekolah nyata, supervisi/retensi/notifikasi sesuai keputusan pemilik |
| Pusat notifikasi | 3 skenario UI: tanda-baca gagal lalu diulang tanpa kehilangan notifikasi; pagination 25 baris dengan sentinel dan indikator "Daftar terpotong; muat halaman berikutnya." yang hilang di halaman terakhir; akun berstatus menunggu tidak mendapat tautan Notifikasi dan melihat daftar kosong (2/2 fokus desktop + ponsel, port 5191, 19,1 dtk; indikator 4/4, 11,7 dtk) | pembuatan notifikasi oleh modul lain (pengumuman, ketidakhadiran, supervisi, asesmen), badge jumlah belum dibaca di navigasi, akun sekolah nyata |
| Laporan ketidakhadiran | 4 skenario UI: wali mengirim ulang laporan dengan ID sama setelah respons hilang; guru memuat ulang setelah konflik revisi lalu mengonfirmasi; guru menolak laporan (`rejected`) tanpa tombol konfirmasi tersisa dan status absensi tidak berubah; guru mendapat pesan tindak lanjut saat tidak ada tepat satu sesi absensi cocok (`55000`), tanpa sukses palsu, dan dapat kembali ke daftar. Ditambah penolakan siswa dan akun menunggu di `/laporan-ketidakhadiran` tanpa memanggil laporan/roster dan tanpa tautan navigasi; pagination 26 laporan: laporan pertama dan indikator "Daftar terpotong; muat halaman berikutnya." di halaman 1, laporan ke-26 tanpa indikator di halaman 2, tombol Sebelumnya kembali ke halaman 1 (4/4 fokus desktop + ponsel, port 5191, 14,5 dtk; pagination 2/2, 7,2 dtk) | perbaikan laporan oleh wali, lampiran bukti, notifikasi otomatis ke guru, akun sekolah nyata |
| 7 Kebiasaan | 6 skenario UI (12 instance desktop + ponsel): akun pending ditolak, murid melihat rekap milik sendiri tanpa form tulis, guru wajib memberi catatan validasi, tanggal kosong/checklist kosong, rekap bukan peringkat, dan wali memilih salah satu dari dua anak lalu hanya mengisi untuk anak itu. Percobaan browser desktop terbaru lulus 6/6 sesudah izin UI diselaraskan dengan D6 (wali mengisi; murid baca-saja). Tes database memastikan murid ditolak saat mencoba INSERT. | sesi penuh desktop + ponsel pada perubahan terbaru, akun sekolah nyata |
| Administrasi dokumen | Guru mengunggah draf/mengajukan, kepala sekolah menyetujui/mengarsipkan, role access, pagination dan dialog konfirmasi sudah tercakup sebelumnya. UI kini menyediakan unduh berkas aktif dan versi historis melalui bucket Storage privat; upload versi dan riwayat tinjauan sudah ada. Uji terbaru mengonfirmasi unggah versi berfungsi, tetapi unduhan belum lulus di harness browser karena mock URL Storage SDK tidak terpicu. | perbaiki mock dan verifikasi unduhan, sesi penuh desktop + ponsel terbaru, akun sekolah nyata |

## Uji non-browser

| Cakupan | Berkas |
| --- | --- |
| Model absensi, impor, rekap, jurnal, penilaian | `tests/attendance*.test.mjs`, `tests/journals.test.mjs`, `tests/assessment-model.test.mjs` |
| CSV/XLSX/PDF akademik | `tests/csv.test.mjs`, `tests/academic-pdf.test.mjs`, `tests/academic-report.test.mjs` |
| Konfigurasi & validasi | `tests/config.test.mjs`, `tests/master.test.mjs`, `tests/password.test.mjs` |
| Database (RLS, trigger, grant kolom) | `tests/database.test.mjs`, `tests/communication.test.mjs` |
| Autentikasi demo | `tests/demo-auth.test.mjs` |

## Batas

- Tes browser memakai API tiruan (`page.route`) dan sesi sintetis; bukan bukti RLS hosted.
- Riwayat run penuh lama (digantikan):
- Riwayat: run Qoder 18 November (port 5331) 215/216 dan run T-A Copilot 18 November (port 5191, Node v26.13.0) 213/216; kegagalan assertion keduanya adalah tes beranda usang, ditambah satu `ENOENT` artefak trace saat teardown. Angka itu tidak lagi menjadi status terkini.
- Hasil di atas memakai API tiruan dan tidak menggantikan UAT.
- Kesenjangan yang butuh keputusan produk (kehadiran guru, komunikasi, dokumen) tercatat di [DECISIONS.md](DECISIONS.md) dan [HANDOFF.md](HANDOFF.md).
