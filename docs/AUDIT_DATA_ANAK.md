# Audit Kepatuhan Data Anak

Tanggal: 14 November 2026. Auditor: Qoder. Basis: `03b87c0`.
Sifat: baca-saja. Tidak ada data sekolah atau orang nyata yang dibaca, diubah, atau dibuat. Dokumen ini bukan nasihat hukum dan tidak menetapkan dasar hukum pemrosesan.

## Prinsip yang dipakai

1. **Minimisasi**: hanya data yang dibutuhkan fungsi sekolah.
2. **Akses minimum**: RLS/grant adalah penegak, bukan sekadar tampilan.
3. **Retensi jelas**: ada keputusan berapa lama data disimpan dan bagaimana permintaan penghapusan diproses.
4. **Transparansi**: siapa melihat apa dapat dijelaskan kepada wali dan siswa.

## Peta data dan akses

| Data | Isi | Siapa dapat membaca | Catatan |
| --- | --- | --- | --- |
| Profil akun | `full_name`, `role` | Pemilik sendiri; pengelola terbatas untuk keperluan peran | Peran tidak berasal dari metadata yang dapat diedit pengguna. |
| Registri guru/siswa | `code` internal, `name`, `is_active`, `profile_id` | Administrator (tulis/baca), kepala sekolah (baca), guru/siswa hanya catatan yang tertaut dan sesuai peran; wali ditutup | Tidak ada NIK, tanggal lahir, alamat, atau kontak. |
| Keanggotaan kelas/penugasan | siswa–kelas–tahun, guru–kelas–mapel | Administrator (tulis), kepala sekolah (baca), guru terkait, siswa sendiri; wali/pending/anonim ditolak | Menjadi dasar akses materi, absensi, jurnal. |
| Absensi | sesi, status, alasan koreksi, snapshot kode/nama, audit perubahan | Guru penugasan aktif; administrator/kepala sekolah (rekap/riwayat); siswa catatan sendiri tanpa catatan koreksi staf; wali hanya 30 status terakhir anak tertaut lewat RPC | Nama/kode disalin saat sesi dibuat agar riwayat tetap terbaca. Tidak ada backdate. |
| Jurnal, modul ajar, materi, tugas, umpan balik | topik/kegiatan/refleksi, materi, nilai tugas, umpan balik | Guru penulis/penugasan; siswa/wali terkait untuk yang terbit; administrator/kepala sekolah sesuai policy | Draf umpan balik dapat dibaca administrator/kepala sekolah (K3 di `SECURITY_REVIEW.md`). |
| Asesmen dan hasil | nilai, publikasi, riwayat koreksi | Guru penulis; siswa/wali terkait setelah terbit; pengelola sesuai policy | Skema nilai dan publikasi manual masih keputusan sementara. |
| Supervisi dan bukti | catatan observasi, umpan balik, berkas PDF/JPEG/PNG | Kepala sekolah; guru hanya sesi miliknya yang terbit; siswa/wali/pending ditolak | Berkas privat 10 MB; baca mengandalkan RLS sesi supervisi (perlu tes, S-02). |
| Tautan wali–anak | `parent_profile_id`, `student_id`, `verified_at`, `verified_by` | Administrator saja | Hanya dibuat lewat RPC administrator; tidak ada penautan otomatis. |
| Todo pribadi | catatan pengguna | Pemilik | Tabel contoh, tidak dipakai UI. |
| Audit/event | pelaku, waktu, status lama/baru, alasan | Staf berwenang sesuai policy | Append-only; tidak ada UI penghapusan. |

## Ringkasan prioritas

| ID | Tingkat | Temuan | Usulan pemilik |
| --- | --- | --- | --- |
| D-01 | Sedang | Belum ada kebijakan retensi/penghapusan/anonymisasi untuk data siswa, absensi, asesmen, dan audit; penghapusan akun dapat terblokir relasi registri | Pemilik + Codex |
| D-02 | Sedang | Bukti supervisi dapat memuat foto/dokumen siswa tanpa pernyataan tujuan, persetujuan, dan retensi | Pemilik + Codex |
| D-03 | Rendah | Snapshot nama/kode pada absensi tetap ada setelah siswa nonaktif/keluar; ini berguna untuk audit tetapi harus diatur kebijakannya | Pemilik + Codex |
| D-04 | Rendah | Riwayat audit menyimpan UUID pelaku; tidak ada mekanisme koreksi/penghapusan yang terdokumentasi | Codex |

## Rincian

### D-01 — Retensi dan penghapusan belum ditetapkan (Sedang)

Fakta teknis:

- Tidak ada kolom `deleted_at`, kebijakan retensi, atau alur permintaan penghapusan di UI.
- Grant hapus hanya ada pada `todos` dan objek bukti supervisi; tabel absensi, nilai, jurnal, dan audit tidak memiliki jalur hapus bagi pengguna.
- `profiles.id` memiliki `on delete cascade` dari `auth.users`, tetapi `teachers.profile_id` dan `students.profile_id` mereferensikan `profiles(id)` tanpa aksi hapus (`20261110082821_people_registry.sql`). Menghapus pengguna Auth yang masih tertaut kemungkinan gagal karena foreign key; urutan "lepaskan tautan → putuskan retensi registri → hapus akun" belum terdokumentasi dan belum diuji.
- Data absensi menyimpan snapshot nama/kode sehingga menghapus registri tidak otomatis menghapus riwayat.

Dampak: permintaan orang tua/sekolah untuk menghapus atau membatasi data tidak dapat dijawab dengan prosedur yang dapat diaudit. Ini juga menghambat UAT dan operasional.

Saran: pemilik memutuskan, lalu dicatat di `docs/DECISIONS.md`:

1. Jangka waktu simpan per kategori (registri, absensi, nilai, jurnal, supervisi, audit).
2. Dasar dan prosedur penghapusan/anonymisasi, termasuk siapa yang menyetujui dan bukti apa yang disimpan.
3. Perilaku saat siswa/guru keluar: nonaktifkan, lepaskan tautan akun, atau anonymisasi snapshot.
4. Prosedur operator untuk menghapus akun Auth setelah relasi dilepas; uji di Supabase lokal, bukan hosted.

Belum ada tindakan yang boleh diambil berdasarkan dokumen ini tanpa keputusan pemilik.

### D-02 — Bukti supervisi dan konten anak (Sedang)

Bucket `supervision-evidence` menerima PDF/JPEG/PNG hingga 10 MB. Bukti observasi kelas dapat berisi foto siswa, karya siswa, atau dokumen perencanaan. Akses tulis/hapus dibatasi kepala sekolah pada tahap 4 belum terbit; akses baca mengandalkan RLS sesi supervisi (lihat S-02). Namun belum ada pernyataan tujuan penggunaan, larangan mengunggah konten yang tidak diperlukan, atau retensi berkas. Saran: tambahkan panduan unggah (hanya dokumen yang relevan, hindari wajah siswa bila tidak perlu), batas retensi, dan prosedur penghapusan; sertakan dalam keputusan D-01.

### D-03 — Snapshot riwayat (Rendah)

Snapshot nama/kode pada `attendance_records` dan kolom nama pada laporan akademik membuat riwayat tetap terbaca setelah registri berubah. Ini pilihan yang wajar untuk audit, tetapi berarti anonymisasi registri tidak dengan sendirinya menganonimkan riwayat. Kebijakan retensi harus menyebut tabel snapshot secara eksplisit.

### D-04 — Audit dan identitas pelaku (Rendah)

Tabel event menyimpan `actor_id`/`created_by` berupa UUID dan alasan perubahan. Tidak ditemukan log aplikasi yang mencetak data pribadi (tidak ada `console.*` di `src`). Namun belum ada prosedur koreksi catatan audit yang salah dan belum ada penjelasan retensi audit. Ini bagian dari D-01.

## Aspek positif

- Registri anak minimal: kode internal, nama, status aktif, tautan profil; tidak ada NIK, tanggal lahir, alamat, atau nomor kontak.
- Tautan wali hanya dibuat administrator melalui RPC dengan alasan 5–300 karakter dan selalu memiliki `verified_at`/`verified_by`; tidak ada penautan otomatis.
- Portal wali mengembalikan hanya anak yang tertaut dan 30 status terakhir, tanpa data siswa lain.
- Siswa tidak melihat catatan koreksi staf; wali/pending/anonim ditolak dari modul staf.
- Bukti supervisi disimpan privat dengan batas ukuran dan MIME di server.
- Tidak ada telemetri atau logging data pribadi di kode aplikasi.

## Batas audit

Tidak ada data nyata yang dibaca; seluruh kesimpulan berasal dari skema, policy, dan kode. Tidak ada tinjauan hukum, wawancara pengelola, atau pengujian alur penghapusan akun. Status "terbukti" hanya berlaku untuk apa yang tercantum di migration/tes yang ada.
