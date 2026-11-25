# PRD operasional SI STIR HEBAT

SDN 03 Wonosari, Boalemo. Edisi kerja 24 November 2026. Dokumen ini menghubungkan kebutuhan sekolah, perilaku yang harus dapat diamati, dan cara mengujinya. Kebutuhan jangka panjang mengikuti [PRD v1.0](references/PRD_SI_STIR_HEBAT_v1_0.md). Perbedaan tentang stack, persetujuan, kebiasaan, laporan wali, dan retensi mengikuti [keputusan pemilik](DECISIONS.md).

## Sasaran dan perjalanan pengguna

Guru cukup mencatat kegiatan satu kali. Kepala sekolah dapat memeriksa hasil dan tindak lanjutnya. Murid dan wali memperoleh informasi yang sudah boleh mereka lihat pada anak, kelas, dan periode yang benar. Keberhasilan alur ditentukan sampai hasil tersimpan dan dapat dibaca kembali oleh pengguna yang berwenang.

| Pengguna | Alur yang harus dapat dituntaskan |
| --- | --- |
| Administrator | Cocokkan identitas akun, tetapkan peran, tautkan registri, siapkan kelas dan penugasan. |
| Kepala sekolah | Buka pengajuan guru, beri keputusan beserta catatan, telusuri riwayat dan hasil supervisi. |
| Guru | Pilih kelas tugas, simpan kehadiran, tinjau laporan wali, kelola pembelajaran dan terbitkan hasil. |
| Murid | Buka tugas kelas sendiri, kirim jawaban, lihat umpan balik dan hasil belajar yang terbit. |
| Wali | Pilih anak tertaut, isi observasi, laporkan ketidakhadiran, baca perkembangan dan hubungi guru terkait. |

## Kebutuhan dan penerimaan per alur

Kriteria berikut berlaku untuk implementasi lokal. Kolom verifikasi menunjukkan tempat untuk memeriksanya kembali pada perubahan berikutnya. Bukti pengoperasian di sekolah dicatat terpisah saat UAT.

| Alur dan lokasi | Kriteria penerimaan | Cara memeriksa |
| --- | --- | --- |
| Identitas, `/daftar`, `/login`, `/akun-sekolah`, `/tautan-akun` | Pendaftaran membuat profil pending. Pilihan ruang di login hanya mengubah tampilan. Hanya admin yang dapat menetapkan peran lewat layanan sekolah setelah verifikasi email. Anak dan guru baru memperoleh akses terkait setelah pengaitan identitas yang sesuai. | Uji akun pending, akun berperan, pergantian akun dan pencabutan tautan dengan PostgreSQL, browser serta UAT email. |
| Sekolah, `/sekolah`, `/dashboard` | Admin menyiapkan tahun, kelas, keanggotaan dan penugasan. Satu murid mempunyai paling banyak satu kelas aktif per tahun. Kepala sekolah dapat membaca ringkasan. Angka nol dan kegagalan memuat dapat dibedakan. | Periksa constraint pada keanggotaan dan hitungan RPC, lalu buka dashboard keenam status profil. |
| Kehadiran, `/absensi`, `/ruang-orang-tua`, `/laporan-ketidakhadiran` | Sesi menyimpan snapshot peserta. Sel kosong tetap belum diisi. Impor melalui pratinjau dan konfirmasi. Koreksi beralasan dan konflik revisi terdeteksi. Laporan wali baru memengaruhi absensi setelah keputusan guru dan sesi yang cocok. | Periksa batas roster, impor ulang setelah respons hilang, laporan yang ditolak, dan rekap kelas maksimal 31 hari. |
| Kehadiran guru, `/absensi-guru` | Guru mencatat masuk/keluar untuk dirinya, kepala sekolah memutuskan koreksi, dan pengiriman ulang dengan ID sama menghasilkan satu tindakan. | Uji transaksi, izin dan riwayat keputusan. |
| Belajar, `/jadwal`, `/materi`, `/tugas`, `/jurnal` | Guru mengusulkan perubahan jadwal, admin memutuskan. Materi dan tugas menjangkau kelas yang berhak. Jawaban terikat pada murid. Draf umpan balik hanya dapat dibaca penulis. | Uji draf/terbit, guru lain pada kelas yang sama, tenggat, revisi, serta pencabutan penugasan. |
| Asesmen, `/asesmen` | Guru menilai sesuai penugasan, memublikasikan dan mengoreksi dengan alasan. Murid atau wali hanya membaca hasil terbit yang relevan. Nilai nol dibedakan dari nilai kosong pada layar dan ekspor. | Uji dua murid, salah satunya di luar cakupan. Cocokkan filter dan nilai mentah pada CSV, XLSX dan PDF. |
| Supervisi, modul ajar dan dokumen, `/supervisi`, `/modul-ajar`, `/dokumen` | Empat tahap supervisi dapat ditelusuri. Guru membaca hasil supervisi yang terbit untuk dirinya. Kepala sekolah memeriksa pengajuan, menyimpan keputusan dan catatan. Berkas aktif dan versi terdahulu diunduh sesuai izin. | Uji transisi dan penolakan lewat database, lalu unggah dan unduh dua versi dari browser. |
| Perkembangan anak, `/kebiasaan` | Wali memilih anak dan tanggal, mengisi observasi tujuh kebiasaan. Murid membaca miliknya, guru memvalidasi sesuai kelas. Koreksi isi memerlukan validasi kembali. Rekap membedakan belum diisi dari tidak dilakukan. | Uji dua anak tertaut, tanggal berbeda, revisi bersamaan dan perubahan relasi. Cocokkan rekap mingguan tanpa peringkat. |
| Komunikasi, `/pengumuman`, `/komunikasi`, `/notifikasi` | Pengumuman terbit terlihat bagi pengguna aktif sesuai peran. Pesan guru–wali hanya terbaca peserta yang berhak. Pusat notifikasi menampilkan milik penerima dan membuka tujuan yang memeriksa izin lagi. | Uji dua akun berperan sama dengan penerima berbeda, tandai dibaca, ulangi setelah gagal, periksa akses URL langsung. |

## Batas rilis dan keputusan produk

- **Implementasi lokal.** Cakupan dan format laporan berbeda tiap modul. Rekap absensi kelas mengekspor CSV. Rekap asesmen juga menyediakan XLSX dan PDF. Daftar berpaginasi menyebutkan cakupan ekspor. Sistem mengikuti hari sekolah Asia/Jakarta sesuai keputusan aplikasi.
- **Usulan untuk fase berikutnya.** Antrean sinkronisasi luring, integrasi Drive/Sheets, notifikasi WhatsApp, lampiran tugas dan impor massal master memerlukan desain terpisah. Saat koneksi putus pengguna perlu mengetahui apakah penyimpanan terkonfirmasi dan cara mengulangnya.
- **Keputusan sekolah yang terbuka.** Kurikulum dan bobot rapor akhir, instrumen supervisi resmi, dokumen wajib per periode, target pemakaian serta operator pemulihan perlu ditetapkan sekolah. Skema nilai sementara menyimpan nilai mentah, maksimum dan status publikasi. Retensi sementara mengikuti revisi 21 November, termasuk satu tahun ajaran untuk bukti supervisi.
- **Pengalaman pengguna.** Uji alur utama di ponsel 360–428 px, tablet sekitar 768 px dan desktop 1280 px. Periksa label, fokus keyboard, kesalahan per bidang, status menyimpan dan konfirmasi tindakan. Target awal PRD sekitar tiga detik untuk halaman inti perlu diukur pada perangkat dan koneksi sekolah. Suite browser menggunakan viewport dan mesin yang tercantum pada konfigurasi Playwright.

## Pilot dan pengukuran

| Urutan | Bukti untuk melanjutkan | Penanggung jawab fungsional |
| --- | --- | --- |
| Persiapan data dan akun | Kelas/penugasan benar, akun uji lima peran, akun pending dan dua anak dapat dibedakan. Email konfirmasi dan pemulihan mencapai tujuan. | Operator dan administrator sekolah |
| Pilot guru dan kepala sekolah | Satu sesi absensi lengkap, satu koreksi terjejak, satu pengajuan hingga keputusan dan satu hasil supervisi terbit. | Guru dan kepala sekolah |
| Pilot murid dan wali | Dua keluarga hanya melihat hasil yang diizinkan, satu jawaban tugas diterima, satu laporan wali ditindaklanjuti. | Perwakilan murid, wali dan guru |
| Rilis sekolah | Rekonsiliasi skema target selesai, restore teruji, UAT dan keputusan rilis tercatat pada versi aplikasi yang sama. | Operator teknis dan pemilik sekolah |

Sekolah dapat mengukur aktivasi sebagai jumlah akun undangan terverifikasi dan berperan dibagi seluruh akun undangan pada kohor yang sama. Untuk kehadiran, gunakan jumlah status terisi dibagi jumlah peserta snapshot sesi pilot. Untuk supervisi, bandingkan sesi selesai dengan sesi terjadwal periode yang sama. Catat periode, pembilang dan penyebut, gunakan angka agregat, lalu tetapkan target setelah baseline tersedia.

Panduan pengujian dan pemetaan implementasi tersedia di [panduan UAT](PANDUAN_UAT.md), [cakupan QA](QA_COVERAGE.md), [matriks hak akses](RBAC_MATRIX.md), dan [status proyek](PROJECT_STATUS.md).
