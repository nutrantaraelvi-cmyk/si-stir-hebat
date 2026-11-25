# Draf Matriks RBAC Resmi

> Arsip usulan 20 November. Untuk izin efektif lokal, gunakan [Matriks RBAC operasional](RBAC_MATRIX.md), termasuk koreksi atas pembacaan bukti supervisi, registri siswa dan kebiasaan.

Status: **DRAF untuk disahkan pemilik** — bukan kebijakan resmi
Tanggal: 15 November 2026; diperbarui 20 November 2026 (modul kebiasaan validasi, laporan ketidakhadiran wali, notifikasi, dokumen sekolah)
Penulis: Qoder
Sumber utama: `docs/AUDIT_RINGKASAN_PROYEK.md` bagian 7, dikoreksi dengan pembacaan policy RLS pada migration lokal (termasuk `20261118000100`–`20261118000400`).
Sifat: baca-saja. Tidak ada perubahan policy, schema, kode, atau data hosted. Tidak ada baris data pengguna yang dibaca.

## 1. Cara membaca

Matriks ini adalah pembacaan policy RLS, bukan hasil UAT akun sekolah. UI dapat menyembunyikan menu, tetapi otoritas akses tetap ditentukan PostgreSQL/RLS. Sel bertanda `PD-xx` belum final dan harus diputuskan pemilik sebelum matriks disahkan.

Keterangan:

- **K** — kelola: tambah/ubah sesuai alur, constraint, dan trigger.
- **K+** — tambah saja (append-only); tidak ada update/hapus untuk pengguna.
- **B** — baca data modul secara luas.
- **B\*** — baca teknis lebih luas daripada yang diharapkan; perlu keputusan (lihat PD-03).
- **T** — baca terbatas: diri sendiri, anak sendiri, kelas, atau penugasan aktif.
- **-** — tidak ada akses eksplisit.
- **PD-xx** — sel perlu keputusan pemilik; jangan dianggap final.
- **Pending** hanya dapat mengakses profil/akun sendiri. **Anonim** hanya halaman publik, login, dan pemulihan kata sandi.
- `K via RPC` berarti penulisan tidak dilakukan langsung ke tabel, melainkan melalui fungsi database yang memeriksa peran dan alasan.

## 2. Administrasi dan data pokok

| Modul | Admin | Kepala | Guru | Siswa | Wali | Pending |
| --- | --- | --- | --- | --- | --- | --- |
| Profil/akun sendiri | T | T | T | T | T | T |
| Pengumuman | K, B | K, B | T published | T published | T published | - |
| Data master | K, B | B | B | B | B | - |
| Registri guru/siswa | K, B | B | T diri sendiri **PD-01** | T diri sendiri | - | - |
| Relasi akun | K via RPC, B | - **PD-02** | - | - | - | - |
| Jadwal | K via RPC, B | B | T; usulan sendiri | T | T | - |
| Bukti supervisi (Storage) | B\* | B\* | B\* | B\* **PD-03** | B\* **PD-03** | B\* **PD-03** |
| Komunikasi guru–wali | - **PD-04** | - **PD-04** | K, T pasangan aktif | - | K, T pasangan aktif | - |
| Kebiasaan 7 hari | B | B | B penugasan, validasi via trigger | K+ isi, T diri sendiri | K+ isi, T anak sendiri | - |
| Laporan ketidakhadiran wali | B | B | B penugasan, keputusan via RPC | - | K+ ajukan, T anak sendiri | - |
| Notifikasi pribadi | T diri sendiri | T diri sendiri | T diri sendiri | T diri sendiri | T diri sendiri | T diri sendiri |
| Dokumen sekolah (metadata) | K, B | K tinjau/arsip, B | K draf sendiri sampai submit, B milik sendiri | - **PD-10** | - **PD-10** | - |
| Dokumen sekolah (Storage `school-documents`) | K via policy, B | K via policy, B | K berkas sendiri, B milik sendiri | - **PD-10** | - **PD-10** | - |

Catatan:

- Baris **Komunikasi** memiliki UI (`src/features/komunikasi`), tetapi migration `20261114083827_komunikasi` belum hosted.
- Baris **Kebiasaan 7 hari** kini memakai validation kolom dan policy dari `20261118000100_student_habits_validation.sql`: guru penugasan dapat memvalidasi lewat trigger, siswa/wali mengisi catatan sendiri. Migration ini belum hosted. Model `habits` masih boolean per hari, sehingga "belum diisi" dan "tidak dilakukan" belum dapat dibedakan (PD-12).
- Baris **Laporan ketidakhadiran wali** berasal dari `20261118000200_guardian_absence_reports.sql`: wali mengajukan untuk anak aktif, guru kelas memutuskan lewat `review_guardian_absence_report`, admin/kepala sekolah membaca. Tidak ada hak hapus. Migration belum hosted.
- Baris **Notifikasi pribadi** berasal dari `20261118000300_notifications.sql`: SELECT hanya baris dengan `recipient_profile_id = auth.uid()`, penulisan hanya lewat `school_private.create_notification`. Tidak ada jalur baca lintas pengguna, termasuk admin (PD-09). Migration belum hosted.
- Baris **Dokumen sekolah** berasal dari `20261118000400_school_documents.sql`: guru membuat draf hingga submit, kepala sekolah menyetujui/mengembalikan, admin mengelola; policy Storage `school-documents` memakai helper yang sama. Siswa dan wali belum diberi akses (PD-10). Migration belum hosted.
- **Registri**: policy `people_read` hanya mengizinkan administrator, kepala sekolah, dan pemilik baris guru/siswa (`supabase/migrations/20261110082821_people_registry.sql:36`). Audit sebelumnya menyebut guru dapat membaca siswa yang diajar; itu tidak sesuai dengan policy SELECT registri. Kebutuhan operasional guru harus dipenuhi lewat RPC/query terbatas atau policy baru yang disetujui.
- **Relasi akun**: hanya administrator yang memiliki policy SELECT (`supabase/migrations/20261111074620_account_relationships.sql:32`). Kepala sekolah tidak dapat membaca relasi. Perlu keputusan apakah itu disengaja.
- **Bukti supervisi**: policy Storage `supervision_evidence_read` hanya memeriksa bucket dan `stage = 4`, tanpa memeriksa peran (`supabase/migrations/20261111082822_supervision_evidence.sql:29-39`). Akibatnya semua akun authenticated, termasuk pending, dapat membaca berkas pada tahap tersebut. Ini temuan S-02, bukan perilaku yang disahkan.

## 3. Pembelajaran dan supervisi

| Modul | Admin | Kepala | Guru | Siswa | Wali | Pending |
| --- | --- | --- | --- | --- | --- | --- |
| Absensi | B | B | K, T penugasan | T diri sendiri | T via portal, 30 status terakhir | - |
| Jurnal mengajar | B | B | K+, T milik sendiri | - | - | - |
| Modul ajar | T non-draft | K approval, B | K, T milik sendiri | - | - | - |
| Materi dan tugas | T non-draft | T non-draft | K, T penugasan | T published | T published anak | - |
| Pengumpulan tugas | - | - | B, T tugas miliknya | K+, T milik sendiri | - | - |
| Umpan balik | B, termasuk draf **PD-05** | B, termasuk draf **PD-05** | K, T milik sendiri | T published | T published anak | - |
| Asesmen dan hasil | B, termasuk draf **PD-06** | B, termasuk draf **PD-06** | K, T milik sendiri | T published | T published anak | - |
| Supervisi (tabel) | - | K, B seluruh | T hasil sendiri setelah publikasi | - | - | - |
| Portal wali | - | - | - | - | T anak sendiri | - |

Catatan:

- **Jurnal** dan **pengumpulan tugas** bersifat append-only: pengguna dapat menambah, tetapi tidak mendapat grant update/hapus. `K+` dipakai agar tidak menyiratkan hak koreksi.
- **Umpan balik**: policy SELECT mengizinkan administrator dan kepala sekolah membaca semua baris, termasuk `draft` (`supabase/migrations/20261111233649_task_feedback.sql:50-54`). Dua opsi perbaikan ada di `docs/DECISIONS.md` bagian “Opsi terbuka — draf umpan balik (K3)”.
- **Asesmen**: policy SELECT juga mengizinkan administrator dan kepala sekolah membaca asesmen draft (`supabase/migrations/20261111234856_academic_assessments.sql:81-85`). Apakah ini disengaja belum diputuskan.
- **Supervisi tabel** terpisah dari **Bukti supervisi (Storage)**. Tabel dapat dibatasi, tetapi berkasnya memiliki kebocoran baca pada PD-03.
- **Absensi wali** berasal dari RPC portal terbatas 30 status terakhir, bukan SELECT langsung ke seluruh tabel absensi.

## 4. Matriks ringkas V/C/U/D/A/E

Matriks ini merangkum bagian 2 dan 3 dengan kode tindakan: **V** lihat, **C** buat, **U** ubah atau isi, **D** hapus, **A** setujui atau validasi, **E** ekspor. Tanda `-` berarti tidak ada akses eksplisit; `PD-xx` berarti sel menunggu keputusan pemilik. Tidak ada baris yang memberi hak `D`: penghapusan data belum diatur dan D5 hanya menetapkan retensi, bukan hak hapus pengguna.

| Modul | Admin | Kepala | Guru | Siswa | Wali | Pending |
| --- | --- | --- | --- | --- | --- | --- |
| Profil/akun sendiri | V, U | V, U | V, U | V, U | V, U | V, U |
| Pengumuman | V, C, U | V, C, U | V terbit | V terbit | V terbit | - |
| Data master | V, C, U | V | V | V | V | - |
| Registri guru/siswa | V, C, U | V | V diri sendiri **PD-01** | V diri sendiri | - | - |
| Relasi akun | V, C via RPC | - **PD-02** | - | - | - | - |
| Jadwal | V, C, U via RPC | V | V, C usulan sendiri | V | V | - |
| Komunikasi guru–wali | - **PD-04** | - **PD-04** | V, C pasangan aktif | - | V, C pasangan aktif | - |
| Kebiasaan harian | V | V | V penugasan, A | V, C, U diri sendiri | V, C, U anak tertaut | - |
| Laporan ketidakhadiran wali | V | V | V penugasan, A via RPC | - | V, C anak tertaut | - |
| Notifikasi pribadi | V, U milik sendiri | V, U milik sendiri | V, U milik sendiri | V, U milik sendiri | V, U milik sendiri | V, U milik sendiri |
| Dokumen sekolah (metadata dan Storage) | V, C, U, A | V, A | V, C, U draf sendiri | - **PD-10** | - **PD-10** | - |
| Absensi | V | V | V, C, U penugasan | V diri sendiri | V anak, 30 status terakhir | - |
| Jurnal mengajar | V | V | V, C milik sendiri | - | - | - |
| Modul ajar | V non-draf | V, A | V, C, U milik sendiri | - | - | - |
| Materi dan tugas | V non-draf | V non-draf | V, C, U penugasan | V terbit | V terbit anak | - |
| Pengumpulan tugas | - | - | V tugas miliknya | V, C milik sendiri | - | - |
| Umpan balik | V terbit **D2** | V terbit **D2** | V, C, U milik sendiri | V terbit | V terbit anak | - |
| Asesmen dan hasil | V **PD-06** | V **PD-06** | V, C, U milik sendiri | V terbit | V terbit anak | - |
| Supervisi (tabel) | - | V, C, U, A | V hasil sendiri setelah terbit | - | - | - |
| Bukti supervisi (Storage) | V **PD-03** | V, C, U, A **PD-03** | V **PD-03** | **PD-03** | **PD-03** | **PD-03** |

Catatan penerapan:

- **D2 (20 November 2026)** mengubah umpan balik untuk admin/kepala sekolah menjadi hanya yang sudah terbit. Migration lokal `20261114083828_security_foundation.sql` sudah ada, tetapi belum hosted; sel di atas menunjukkan target keputusan, bukan bukti policy hosted.
- **D5** menetapkan retensi, bukan hak hapus. Kolom `D` sengaja kosong untuk semua peran sampai ada keputusan dan tes tersendiri.
- **D6** menetapkan kebiasaan diisi wali dan direkap guru tanpa peringkat. Pembedaan "belum diisi" dan "tidak dilakukan" masih **PD-12**.
- **D7** menetapkan laporan wali tidak otomatis menjadi absensi final. Aksi **A** pada guru berarti memverifikasi atau meminta perbaikan lewat RPC.
- **E (ekspor)** belum ada untuk modul mana pun di matriks ini; kebutuhan ekspor harus menjadi keputusan tersendiri.

## 5. Sel yang perlu keputusan pemilik

| ID | Sel/Modul | Keadaan saat ini | Keputusan yang diminta |
| --- | --- | --- | --- |
| PD-01 | Registri guru/siswa — Guru | Guru hanya membaca baris registri dirinya sendiri | Apakah guru memerlukan daftar nama siswa pada kelas penugasan? Jika ya, tentukan apakah lewat RPC/query terbatas atau policy SELECT baru. |
| PD-02 | Relasi akun — Kepala sekolah | Hanya administrator dapat membaca | Apakah kepala sekolah perlu membaca relasi wali–anak untuk supervisi? Jika ya, tambahkan policy dan uji; jika tidak, biarkan tertutup. |
| PD-03 | Bukti supervisi Storage — semua authenticated | Semua akun authenticated dapat membaca berkas `stage = 4` | Tetapkan peran yang boleh membaca (kepala sekolah, guru pemilik setelah publikasi, atau keduanya). Perbaikan policy dan tes wajib; jangan menyatakan aman sebelum diuji. |
| PD-04 | Komunikasi guru–wali — Admin/Kepala | Tidak ada akses | Apakah pengawasan/moderasi diperlukan? Jika ya, tentukan baca-saja, alasan akses, dan retensinya. Migration komunikasi juga belum hosted. |
| PD-05 | Umpan balik — Admin/Kepala | Dapat membaca draf | Pilih opsi (a) draf hanya penulis atau (b) admin/kepala boleh membaca draf. Lihat `docs/DECISIONS.md`; policy belum diubah. |
| PD-06 | Asesmen — Admin/Kepala | Dapat membaca draf | Apakah draf asesmen boleh dibaca staf sebelum publikasi? Jika tidak, samakan perbaikannya dengan PD-05. |
| PD-07 | Navigasi vs RLS | Admin melihat beberapa menu pembelajaran, tetapi tidak otomatis berhak menulis | Tentukan apakah menu disembunyikan atau RLS diberi hak tulis. Jangan mengandalkan UI sebagai otorisasi. |
| PD-08 | Data master — Siswa/Wali | Dapat membaca data master | Konfirmasi apakah seluruh data master (tahun ajaran, kelas, mapel) memang layak dibaca siswa/wali, atau perlu dibatasi. |
| PD-09 | Notifikasi — Admin/Kepala | Tidak ada jalur baca notifikasi pengguna lain | Apakah pengawasan atau pengiriman ulang oleh admin diperlukan? Jika ya, tentukan RPC baca-saja, alasan akses, dan retensinya; jangan memberi SELECT langsung. |
| PD-10 | Dokumen sekolah — Siswa/Wali | Tidak ada akses metadata maupun berkas | Tetapkan apakah siswa/wali boleh membaca dokumen tertentu (misalnya RKT ringkas). Jika ya, tambahkan policy dan uji; bawaan saat ini tertutup. |
| PD-11 | Validasi kebiasaan — revert status | `validated_by`/`validated_at` tetap terisi bila status kembali `pending` | Putuskan apakah kolom validasi dikosongkan saat status bukan `validated`, lalu sesuaikan trigger. |
| PD-12 | Model kebiasaan — "belum diisi" vs "tidak dilakukan" | `habits` berupa boolean per hari; keduanya tidak dapat dibedakan | Putuskan apakah perlu status tiga nilai atau kolom terpisah sebelum form siswa/wali disempurnakan. |

## 6. Koreksi terhadap `AUDIT_RINGKASAN_PROYEK.md` bagian 7

| No | Catatan audit lama | Keadaan policy yang terbaca | Dampak |
| --- | --- | --- | --- |
| 1 | Relasi akun: Kepala = B | Kepala = - | Matriks audit terlalu luas; jangan dipakai untuk menyatakan kepala sekolah dapat membaca relasi. |
| 2 | Registri: Guru = T siswa yang diajar | Guru = T diri sendiri | Kebutuhan daftar siswa belum terpenuhi oleh SELECT registri; perlu keputusan PD-01. |
| 3 | Bukti supervisi: hanya Kepala/Guru tertentu | Semua authenticated pada `stage = 4` | Temuan S-02; akses lebih luas dari yang tertulis. |
| 4 | Asesmen: Admin/Kepala = B | B termasuk draf | Perlu keputusan PD-06. |
| 5 | Jurnal/Pengumpulan: K | K+ (append-only) | Tidak ada hak koreksi/hapus; jangan menjanjikan edit. |
| 6 | Jadwal: Guru = T | T + usulan sendiri melalui RPC | Guru dapat mengusulkan, bukan mengubah jadwal utama. |

## 7. Di luar cakupan

- Tidak ada pengujian dengan akun sekolah nyata; matriks belum membuktikan perilaku end-to-end.
- Tidak ada pemeriksaan Storage hosted, Auth redirect, email, atau sesi nyata.
- Tidak ada penilaian UI/aksesibilitas; PD-07 hanya mencatat ketidaksesuaian navigasi dan RLS.
- `20261114000139_student_habits`, `20261114083827_komunikasi`, `20261118000100_student_habits_validation`, `20261118000200_guardian_absence_reports`, `20261118000300_notifications`, dan `20261118000400_school_documents` belum hosted; baris terkait adalah rancangan lokal.
- Matriks ini tidak menetapkan retensi, penghapusan, atau dasar hukum pemrosesan data anak (D4 masih **BELUM DIPUTUSKAN**).

## 8. Pengesahan pemilik

Setelah PD-01 sampai PD-12 diputuskan, isi kolom berikut. Sampai itu, matriks tetap draf dan tidak boleh disebut “RBAC resmi”.

| Peran | Nama | Tanggal | Keputusan/inti persetujuan |
| --- | --- | --- | --- |
| Pemilik sekolah |  |  |  |
| Kepala sekolah |  |  |  |
| Administrator teknis |  |  |  |
