# Matriks RBAC operasional

Rekonsiliasi lokal 24 November 2026. Matriks ini menghubungkan operasi pengguna dengan peran pada `profiles.role`, grant, RLS, RPC, trigger dan kebijakan Storage dalam 42 migrasi lokal. Pengesahan oleh pemilik sekolah dan verifikasi pada hosted dicatat terpisah. [Arsitektur database](ARSITEKTUR_DATABASE.md) · [Keputusan pemilik](DECISIONS.md)

**Legenda.** B berarti baca, T tambah, U ubah, A putuskan atau setujui, P terbitkan dan X ekspor. Tanda — berarti operasi tersebut tertutup. **Sendiri** mengacu pada profil/registri pemanggil, **kelas** pada penugasan atau keanggotaan sesuai modul, dan **anak** pada relasi wali terverifikasi dengan siswa aktif. Hak merupakan batas data di server. Tampilan menu dapat lebih sempit.

## Identitas, operasi sekolah dan komunikasi

| Operasi | Administrator | Kepala sekolah | Guru | Siswa | Wali |
| --- | --- | --- | --- | --- | --- |
| Profil | B/U nama sendiri | Sama | Sama | Sama | Sama |
| Aktivasi akun sekolah | B antrean akun terverifikasi, tetapkan peran, B audit | — | — | — | — |
| Profil sekolah, tahun, semester, mata pelajaran, kelas | B/T/U | B | B | B | B |
| KKM / kalender | B/U KKM, B/T kalender | B | B | B | B |
| Jenis status absensi guru | B/T | B | B | — | B |
| Jenis dokumen guru | B/T | B | B | — | — |
| Registri guru dan siswa | B/T/U | B | B diri dan siswa aktif kelas tugas | B diri | — |
| Keanggotaan / penugasan | B/T/U | B | B penugasan sendiri dan anggota aktif kelas | B keanggotaan sendiri | — |
| Tautan akun guru/siswa dan verifikasi wali | B, taut/cabut via RPC, B audit | — | — | — | — |
| Pengumuman | B/T/U/P/arsip | B/T/U/P/arsip | B terbit | B terbit | B terbit |
| Jadwal dan usulan | B/simpan jadwal, A usulan | B jadwal/usulan | B jadwal tugas, T/B usulan sendiri | B jadwal kelas | B jadwal kelas anak |
| Percakapan guru–wali | — | — | B/T pada penugasan | — | B/T pada relasi anak |
| Notifikasi dalam aplikasi | B/tandai milik sendiri | Sama | Sama | Sama | Sama |
| Ringkasan sekolah `dashboard_overview` | B agregat | B agregat | — | — | — |
| Kebijakan retensi | B/U | B | — | — | — |
| Permintaan penghapusan | B/T, catat pelaksanaan sesudah disetujui | B/A dengan catatan | — | — | — |

`list_pending_school_accounts` mengembalikan maksimal 200 akun pending dengan email terverifikasi. `assign_school_role` hanya mengizinkan tujuan kepala sekolah, guru, siswa, atau wali. Perubahan profil dan pencatatan `profile_role_changes` terjadi dalam satu transaksi. Verifikasi hubungan dengan siswa/guru memakai `set_account_relationship` sesudah aktivasi. [Aktivasi](../supabase/migrations/20261122000200_admin_role_assignment.sql) · [Penautan](../supabase/migrations/20261111074620_account_relationships.sql) · [Konfigurasi sekolah](../supabase/migrations/20261121090000_school_configuration.sql)

## Pembelajaran, keluarga dan evaluasi

| Operasi | Administrator | Kepala sekolah | Guru | Siswa | Wali |
| --- | --- | --- | --- | --- | --- |
| Absensi siswa | B/X | B/X | B/T/U/X kelas, impor Excel | B/X diri | B hingga 30 catatan per anak via portal |
| Laporan ketidakhadiran wali | B | B | B/A kelas | — | T/B anak |
| Absensi guru dan koreksi | B | B/A koreksi | B/catat diri, ajukan koreksi sendiri | — | — |
| Jurnal mengajar | B | B | B/T penugasan | — | — |
| Modul ajar | B sesudah pengajuan | B/A/kembalikan/arsip | B/T/U/ajukan milik sendiri | — | — |
| Materi / tugas | B selain draf | B selain draf | B/T/U/P/arsip milik sendiri | B terbit kelas | B terbit kelas anak |
| Pengumpulan tugas | — | — | B tugas yang diampu | T/B sendiri, sekali sebelum tenggat | — |
| Umpan balik tugas | B terbit | B terbit | B/T/U/P untuk tugas sendiri | B terbit diri | B terbit anak |
| Asesmen dan hasil | B termasuk draf | B termasuk draf | B/T/U/P/koreksi penugasan | B terbit diri | B terbit anak |
| Tujuh kebiasaan | B | B | B/validasi kelas | B diri | B/T/U anak |
| Supervisi akademik | — | B/T/U/P/X | B hasil sendiri setelah terbit | — | — |
| Bukti supervisi privat | — | B tahap 4, unggah/hapus sebelum terbit | B tahap 4 sendiri setelah terbit | — | — |
| Dokumen sekolah, versi, review | B, kelola teknis dan metadata | B/A/kembalikan/arsip | B sendiri, T/U draf atau revisi, ajukan | — | — |

- **Absensi.** Konfirmasi laporan wali menjalankan transisi dan pencatatan absensi sekaligus ketika tepat satu peserta/sesi cocok. Penolakan menutup laporan. Guru mengimpor ke sesi kelas tugas dan dapat meninjau hasil impor. Staf pemantau membaca riwayat. [Review laporan](../supabase/migrations/20261120050000_guardian_absence_attendance.sql)
- **Ekspor.** Absensi menghasilkan CSV/XLSX sesuai sesi dan peserta yang terlihat. Fungsi ekspor akademik menulis CSV/XLSX/PDF dari hasil lengkap sesuai filter, peran dan publikasi. Ekspor supervisi pada UI tersedia untuk kepala sekolah. Otorisasi berkas mengikuti pembacaan asal. [Absensi](../src/features/attendance/AttendanceReport.tsx) · [Akademik](../src/features/academic/AcademicReport.tsx) · [Supervisi](../src/features/supervision/AcademicSupervision.tsx)
- **Bukti supervisi.** Subquery policy Storage membaca `academic_supervisions` dengan RLS pemanggil. Kepala sekolah membaca tahap 4. Guru aktif terkait baru melihat berkas setelah publikasi. Guru lain, administrator, siswa, wali dan pending berada di luar cakupan. Pembacaan lama S-02 melewatkan policy tabel induk. [Policy induk](../supabase/migrations/20261111080735_academic_supervision.sql) · [Policy objek](../supabase/migrations/20261111082822_supervision_evidence.sql) · [Tes lintas peran](../tests/database.test.mjs)
- **Kebiasaan.** Wali mengisi observasi, guru memvalidasi dengan catatan. Jika isi berubah setelah disetujui, server mengembalikan status ke pending dan mempertahankan jejak sebelumnya pada event. Siswa dapat membaca catatannya. Hari tanpa baris dihitung sebagai belum diisi. [Trigger koreksi](../supabase/migrations/20261123092240_habit_edit_validation.sql)
- **Dokumen.** Bucket privat memakai izin dokumen induk. Administrator memiliki hak teknis pada berkas, kepala sekolah memutuskan status, dan guru mengunggah untuk draf atau revisi miliknya. RPC dapat membersihkan draf pemilik sesuai revisi bila belum ada objek di Storage. Riwayat versi dan review ditulis oleh trigger. [Dokumen](../supabase/migrations/20261118000400_school_documents.sql) · [Versi dan review](../supabase/migrations/20261120040847_school_document_versions_reviews.sql)
- **Audit.** Akses event ditetapkan per modul. Riwayat penautan/aktivasi khusus admin, event supervisi khusus kepala sekolah, dan riwayat koreksi kehadiran siswa terbatas pada staf yang berwenang atas peserta. Notifikasi hanya memuat petunjuk umum dan referensi ke halaman berotorisasi.

## Pending, anonim, dan pengujian

Akun pending dapat melihat/mengubah nama sendiri, membaca notifikasi miliknya bila ada, serta membaca kategori dokumen aktif melalui policy katalog. Anonim dapat membuka halaman publik dan memakai alur Auth. Operasi data sekolah dan objek privat mensyaratkan sesi serta otorisasi yang tercantum di atas.

Verifikasi lokal memutar migrasi di PGlite dan menguji peran berbeda terhadap sumber yang sama, termasuk pencabutan relasi, perubahan penugasan, publikasi dan kunci revisi. Hak produksi bergantung pada skema target aktual. Keputusan produk yang masih terbuka mencakup pengesahan hak baca draf asesmen oleh admin/kepala sekolah. Keputusan D2 sudah mengatur draf umpan balik. [Tes database](../tests/database.test.mjs) · [Bukti hosted terakhir](HOSTED_MIGRATION_RECONCILIATION_2026-11-22.md)
