# Cakupan Uji Otomatis

Status: verifikasi lokal 15 November 2026
Sumber: `tests/browser/app.spec.ts` dan `tests/browser/communication.spec.ts` (216 skenario termasuk desktop + ponsel); `tests/*.test.mjs` (116 tes unit/database).
Bukti terbaru pada sesi ini: `npm run check` lulus (116 tes unit/database, lint, typecheck, gerbang migration/CI, build, pemeriksaan bundel). Run browser penuh 212/216; empat kegagalan adalah `ENOENT` saat penutupan artefak trace. Keempatnya lulus saat diulang terarah; dua tes Komunikasi lulus di desktop dan ponsel.

Cara membaca: "Ada" berarti minimal satu skenario browser pada desktop dan ponsel dengan API tiruan. Semua modul di bawah **belum** diuji dengan akun sekolah nyata; lihat [UAT_CHECKLIST.md](UAT_CHECKLIST.md).

## Matriks per modul

| Modul | Skenario yang tercakup | Belum tercakup |
| --- | --- | --- |
| Autentikasi & sesi | login gagal/diulang, sesi bertahan saat muat ulang, keluar, rute terlindungi, lupa/ubah kata sandi, profil, akun pending | email pemulihan nyata, embargo rate-limit Supabase |
| Dashboard & peran | layanan per peran, pengumuman terbaru, hitungan supervisi/modul ajar, nol vs gagal vs `—`, retry, ringkasan sekolah (admin/kepala sekolah) | ringkasan khusus guru/keluarga (PRD 5.x lanjutan) |
| Pengumuman | buat/ubah/terbit/arsip oleh pengelola, pembaca hanya terbit, pagination, galat jaringan | pengaturan target penerima |
| Data sekolah & registri | identitas, tahun ajaran/semester, mapel, kelas, guru/siswa, keanggotaan, penugasan, penolakan peran | impor data master, riwayat perubahan master |
| Absensi manual | sesi hari ini, isi status, koreksi/alasan, konflik revisi, penolakan siswa/wali, laporan >1000 baris | backdate, persetujuan koreksi, kehadiran guru |
| Impor Excel | preview wajib, penolakan duplikat/tipe, retry request ID sama | file rusak/terkunci di sisi server |
| Rekap absensi | rentang >31 hari ditolak, agregasi hanya baris sendiri (siswa), ekspor CSV | ekspor PDF rekap absensi |
| Jurnal | simpan + konfirmasi, retry ID sama, baca admin/kepala sekolah, penolakan siswa/wali/pending, pagination/CSV, status kesiapan | persetujuan/koreksi jurnal |
| Modul ajar | guru simpan draf, guru ajukan, kepala sekolah kembalikan dengan catatan | persetujuan/koreksi lanjutan, lampiran |
| Materi kelas | guru terbitkan, siswa membaca terbit tanpa kontrol tulis | arsip oleh guru, lampiran |
| Tugas kelas | siswa melihat tenggat, siswa mengirim jawaban (sukses/respons hilang/duplikat), guru membuat tugas, umpan balik guru, wali membaca umpan balik | pengumpulan lampiran, penilaian tugas→asesmen |
| Asesmen & rekap | guru buat/nilai nol/terbit/koreksi+riwayat, konflik revisi, laporan filter/grafik/ekspor CSV-Excel-PDF, mode terpotong/limpas/gagal, wali hanya hasil terbit, pending ditolak, peran baca-saja | kewenangan wali kelas, perubahan peserta |
| Jadwal | admin buat/ubah/konflik, usulan guru, keputusan admin (termasuk revisi usang), riwayat kepala sekolah, filter kelas | penarikan usulan guru, pemecahan periode |
| Supervisi | jadwal→observasi, simpan otomatis + konflik, unggah bukti privat, laporan + ekspor, penolakan siswa/wali/pending | instrumen resmi, tanda tangan digital |
| Tautan akun & wali | admin meninjau tautan, portal wali & pencabutan relasi, penolakan wali pada formulir tautan, penolakan guru/siswa/wali/pending | verifikasi identitas manual |
| Komunikasi | 2 skenario UI: respons insert hilang dan konfirmasi pesan; pagination melewati batas 25 baris tanpa celah | pengujian dengan akun sekolah nyata, supervisi/retensi/notifikasi sesuai keputusan pemilik |
| Administrasi dokumen | belum ada implementasi | seluruh modul (menunggu C2/U2) |

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
- Run penuh terbaru tidak sepenuhnya bersih akibat empat kegagalan teardown artefak; angka pass tidak boleh dilaporkan sebagai 216/216.
- Kesenjangan yang butuh keputusan produk (kehadiran guru, komunikasi, dokumen) tercatat di [DECISIONS.md](DECISIONS.md) dan [HANDOFF.md](HANDOFF.md).