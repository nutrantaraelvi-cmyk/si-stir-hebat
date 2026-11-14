# SI STIR HEBAT - Ringkasan Proyek, Implementasi, RBAC, dan Kesiapan

Status dokumen: 14 November 2026  
Peran penyusun: auditor arsitektur, keamanan, dan performa  
Sifat dokumen: ringkasan berbasis bukti repo, bukan jaminan keamanan atau pernyataan "siap operasional"

Pembaruan: tujuh dokumen acuan dari pengguna (PRD, RBAC, Database Blueprint, API Specification, UI/UX Blueprint, Implementation Plan, dan SAD) telah diterima di luar repo. Perbandingan rincinya ada di `docs/AUDIT_KESESUAIAN_ACUAN.md`. Dokumen tersebut belum menjadi acuan resmi repo sampai pemilik menyetujui lokasi dan versinya.

## 1. Ringkasan eksekutif

SI STIR HEBAT adalah aplikasi web sekolah untuk SDN 03 Wonosari yang menghubungkan administrator, kepala sekolah, guru, siswa, dan orang tua. Aplikasi sudah memiliki fondasi operasional yang cukup luas dan lulus pengujian lokal, tetapi belum dapat disebut siap operasional karena UAT akun sekolah nyata, pengaturan Auth hosted, aktivasi admin, dan penerapan dua migration tertunda belum diverifikasi.

| Pertanyaan | Jawaban singkat |
| --- | --- |
| Progress sekarang | Modul inti sudah dibangun dan diuji lokal. `npm run check` lulus 109 tes. Suite browser tercatat 194/194 dengan API tiruan. 25 migration lokal, 23 sudah tercatat di hosted. |
| Tujuan web | Menjadi satu ruang terintegrasi untuk administrasi sekolah, pembelajaran, supervisi, dan komunikasi guru-wali dengan akses berbasis peran serta perlindungan data anak. |
| Harapan yang diminta | Aplikasi mobile-first, teks Indonesia, ramah anak, aman, dan sesuai kebutuhan tiap peran. Arah desain terbaru yang tercatat: ungu tua/lilac/biru muda/pink, profesional tetapi playful. |
| PRD | PRD v1.0 bertanggal 30 Oktober 2026 tersedia di folder lampiran pengguna, tetapi belum masuk repo. Matriks RBAC resmi belum lengkap; konflik stack dan kewenangan harus diputuskan pemilik. |
| Implementasi | Sekitar 12 kelompok fitur sudah berjalan lokal, komunikasi baru sampai backend/API, Kebiasaan baru migration, administrasi dokumen dan notifikasi belum ada. |
| CI/CD | Workflow verifikasi dan konfigurasi Vercel ada, tetapi belum ada bukti CI berjalan di GitHub dan deployment belum diverifikasi end-to-end. |
| RBAC | Matriks peran sudah diterapkan di RLS, bukan hanya di UI. Beberapa sel masih memerlukan konfirmasi kebijakan resmi. |
| UI/UX | Responsif, aksesibel dasar, dan teruji di desktop/ponsel. Namun palet dasar masih teal/oranye, belum sepenuhnya mengikuti arah ungu/lilac yang tercatat. |
| Kerangka aplikasi | React 19 + Vite 6 + TypeScript 5.8 + React Router 7 + Supabase, SPA tanpa Next.js. |
| Database | 25 migration lokal; 23 hosted. RLS, grant kolom, helper privat, trigger, audit, dan RPC sudah menjadi pola. Dua migration belum diterapkan. |

Kesimpulan satu baris: fondasi lokal sudah kuat dan teruji, tetapi status yang tepat adalah **"siap untuk review dan UAT terbatas"**, bukan "siap operasional".

## 2. Dasar bukti dan batas pemeriksaan

| Bukti | Hasil | Catatan |
| --- | --- | --- |
| `npm run check` | Lulus 109 tes, 0 gagal; lint, typecheck, build lulus | Dijalankan auditor pada 14 November 2026 di working tree ini. Chunk PDF 790,69 kB masih memicu peringatan ukuran. |
| Suite browser | 194/194 lulus dalam tiga run berturut-turut | Dilaporkan Kilo pada 14 November 2026; auditor tidak menjalankan ulang seluruh suite. API Supabase dimock, bukan akun sekolah nyata. |
| Migration lokal | 25 berkas | Termasuk `20261114000139_student_habits` dan `20261114083827_komunikasi`. |
| Migration hosted | 23 tercatat | Dua migration lokal belum tercatat di hosted. |
| Pemeriksaan hosted | `check:supabase` lulus setelah akses jaringan tersedia; Security Advisor tidak melaporkan temuan | Hanya skema hosted saat ini, tanpa membaca baris data. Tidak mencakup dua migration lokal. |
| Repo kerja | Branch `ai/codex-pdf-splitting`, HEAD `20f5f22` | Tidak ada branch `main` lokal dan tidak ada remote pada repo kerja aktif. Perubahan agen lain dipertahankan. |
| Release GitHub | Repo rilis terpisah, commit `86fe0e7` | CI GitHub belum diverifikasi; konektor memberi 404. |
| UAT akun sekolah | Belum dilakukan | Auth/redirect, email pemulihan, aktivasi admin, dan akun nyata masih tugas pemilik. |

Dokumen ini tidak menyatakan aplikasi "aman", "bebas temuan", atau "siap produksi". Pernyataan tersebut hanya boleh dibuat setelah Definisi Selesai terpenuhi dengan bukti.

## 3. Tujuan web dan harapan yang diinginkan

### 3.1 Tujuan

Menyatukan layanan sekolah yang sebelumnya tersebar ke dalam satu aplikasi berbasis peran:

- Administrator mengelola data sekolah, akun, relasi, dan kontrol akses.
- Kepala sekolah menjalankan supervisi, persetujuan, dan pemantauan.
- Guru mengelola kelas, absensi, jurnal, materi, tugas, asesmen, dan hasil supervisi.
- Siswa mengakses materi, tugas, hasil belajar, serta program 7 Kebiasaan.
- Orang tua memantau perkembangan anak, ketidakhadiran, dan komunikasi dengan guru.

Prinsip yang sudah menjadi arah proyek:

- Teks antarmuka berbahasa Indonesia.
- Mobile-first dan ramah anak.
- Akses ditentukan peran dan ditegakkan di database melalui RLS.
- Tidak menampilkan atau menyebarkan data anak secara berlebihan.
- Tidak membuat perhitungan rapor otomatis selama skema resmi belum diberikan.
- Tidak membuat akun atau mengisi data sekolah nyata secara otomatis.

### 3.2 Harapan terbaru yang tercatat

| Peran | Harapan |
| --- | --- |
| Kepala sekolah | Supervisi dan kontrol menyeluruh atas sekolah. |
| Guru | Perangkat pengajaran, absensi, asesmen, dan hasil supervisi. |
| Siswa | Program 7 Kebiasaan, kelas 1-6, PJOK/PAI. |
| Orang tua | Notifikasi ketidakhadiran dan komunikasi dengan guru. |
| Desain | Mobile-first, ungu tua/lilac/biru muda/pink, profesional tetapi playful. |

Harapan ini baru tercatat sebagai arahan, belum semuanya menjadi keputusan resmi atau implementasi. Contohnya, palet ungu/lilac baru muncul pada `principal-overview`; palet dasar aplikasi masih teal/oranye.

### 3.3 Definisi selesai yang disepakati

Proyek belum disebut selesai sebelum seluruh butir berikut terbukti:

1. PRD dan kebutuhan terbuka selesai atau dicatat resmi sebagai ditunda.
2. Semua modul lulus tes otomatis dan UAT dengan akun sekolah.
3. RLS, grant kolom, dan Supabase Security Advisor bersih.
4. Deployment Vercel diverifikasi untuk login, logout, dan pemulihan kata sandi.
5. `PROJECT_STATUS`, `IMPLEMENTATION_LOG`, dan `DECISIONS` akurat.

Saat ini butir 2, 4, dan sebagian butir 1 serta 5 belum terpenuhi.

## 4. Status PRD

### 4.1 Yang ada

PRD versi 1.0 bertanggal 30 Oktober 2026 kini tersedia di folder lampiran pengguna, bersama enam dokumen acuan lain. Dokumen tersebut menjelaskan tujuan, 15 modul, peran pengguna, persyaratan fungsional, keamanan, integrasi, rilis, dan kriteria penerimaan. Namun dokumen belum masuk repo, belum disahkan sebagai versi resmi, dan Matriks RBAC yang dilampirkan baru memuat cakupan, bukan tabel role x modul.

Kebutuhan juga tersebar di:

- `docs/PROJECT_STATUS.md`: ringkasan kebutuhan, status modul, prioritas, dan arahan pengguna.
- `docs/DECISIONS.md`: keputusan sementara per modul dan pertanyaan terbuka.
- `docs/AKTIVASI_DAN_RILIS.md` dan `docs/PANDUAN_UAT.md`: prosedur operasional.
- Migration dan kode: perilaku yang benar-benar diterapkan.
- `docs/AUDIT_KESESUAIAN_ACUAN.md`: perbandingan rinci acuan vs implementasi.

Catatan penting: PRD menetapkan Next.js, Tailwind, Zod, dan monorepo, sedangkan aturan proyek melarang Next.js dan kode saat ini memakai Vite + Supabase + CSS. Konflik ini belum diselesaikan dan tidak boleh dijadikan alasan mengubah stack secara sepihak.

### 4.2 Ringkasan isi PRD

| Bagian | Isi yang dapat disimpulkan |
| --- | --- |
| Masalah | Administrasi, pembelajaran, supervisi, dan komunikasi sekolah belum terhubung dalam satu alur berbasis peran. |
| Pengguna | Admin, kepala sekolah, guru, siswa, wali, dan akun pending. |
| Tujuan | Konsistensi data, kontrol akses, jejak audit, kemudahan operasional, dan perlindungan data anak. |
| Ruang lingkup saat ini | Profil, pengumuman, data master, registri, relasi akun, absensi, jurnal, modul ajar, materi/tugas/feedback, asesmen, supervisi, jadwal, portal wali. |
| Di luar lingkup | Rapor otomatis, media sosial sekolah, pengisian data nyata otomatis, penautan akun otomatis. |
| Batasan | SDN 03 Wonosari, kelas 1-6, PJOK/PAI, 7 Kebiasaan, bahasa Indonesia, React/Vite/Supabase, bukan Next.js. |

### 4.3 Keputusan yang masih terbuka

- Skema resmi asesmen dan rapor.
- Retensi dan penghapusan data anak.
- Siapa yang boleh melihat bukti pengawasan dan untuk berapa lama.
- Mekanisme penarikan atau pembatalan data tertentu.
- Kanal notifikasi orang tua.
- Aturan pencatatan, frekuensi, validasi, dan visibilitas 7 Kebiasaan.
- Kontrak resmi komunikasi guru-wali: penerima, persetujuan, moderasi, dan retensi pesan.
- Alur persetujuan koreksi absensi dan jurnal.

Rekomendasi: pemilik perlu mengesahkan PRD ringkas dan keputusan di atas sebelum fitur baru ditambahkan. Tanpa itu, implementasi hanya dapat mengikuti opsi paling aman yang dicatat di `DECISIONS.md`.

## 5. Status implementasi per modul

| Modul | Status | Bukti atau rute | Yang belum |
| --- | --- | --- | --- |
| Auth, profil, akun | Selesai lokal | `/login`, `/lupa-kata-sandi`, `/kata-sandi`, `/akun`, guard peran | UAT email nyata, redirect hosted, aktivasi admin oleh pemilik. |
| Dashboard per peran | Selesai lokal | `/dashboard`, ringkasan admin/kepala/guru/siswa/wali | Fan-out request kepala sekolah dan indeks pendukung masih perlu diukur. |
| Pengumuman | Selesai lokal | `/pengumuman`, status draft/published/archived | UAT akun sekolah. |
| Data master dan registri | Selesai lokal | `/sekolah/:kind?` | Kualitas data awal dan prosedur impor resmi belum ditetapkan. |
| Relasi akun dan portal wali | Selesai lokal | `/tautan-akun`, `/ruang-orang-tua` | Verifikasi hubungan hanya oleh admin; UAT wali nyata. |
| Absensi | Selesai lokal | `/absensi`, impor XLSX, laporan | Backdate, persetujuan koreksi, dan UAT sekolah. |
| Jurnal mengajar | Selesai lokal | `/jurnal` | Alur koreksi/persetujuan dan kebijakan retensi. |
| Modul ajar | Selesai lokal | `/modul-ajar`, submit/approve/return/archive | UAT kepala sekolah dan guru. |
| Materi, tugas, pengumpulan, feedback | Selesai lokal | `/materi`, `/tugas` | UAT per peran; kebijakan draft feedback perlu dikonfirmasi. |
| Asesmen dan hasil | Selesai lokal, sebagian | `/asesmen`, ekspor PDF akademik | Skema penilaian resmi masih sementara; rapor otomatis tidak dibuat. |
| Supervisi empat tahap dan bukti | Selesai lokal | `/supervisi`, Storage privat | Uji kebijakan Storage dengan akun nyata dan kebijakan retensi bukti. |
| Jadwal dan usulan perubahan | Selesai lokal | `/jadwal`, RPC tulis dengan alasan | UAT dan evaluasi beban query. |
| Komunikasi guru-wali | Backend lokal saja | Migration `20261114083827_komunikasi`, API bertipe | Belum ada rute/UI, belum hosted, belum UAT. |
| 7 Kebiasaan | Fondasi saja | Migration `20261114000139_student_habits`, folder fitur | Belum ada rute, aturan, atau UI. |
| Administrasi dokumen | Belum | Tidak ada rute khusus | Kontrak dan persetujuan belum dikonfirmasi. |
| Notifikasi/email | Belum | Tidak ada implementasi | Kanal, pemicu, dan preferensi belum diputuskan. |
| Aktivasi admin | Prosedur saja | `docs/AKTIVASI_DAN_RILIS.md` | Eksekusi dan verifikasi oleh pemilik. |

### 5.1 Angka teknis

- 19 definisi rute di `src/app/App.tsx`: 18 halaman/alamat fungsional dan satu halaman 404.
- 109 tes Node/PGlite lulus.
- 194 skenario browser lulus dengan API tiruan menurut laporan Kilo.
- 25 migration lokal, 23 hosted.
- Build produksi lulus; chunk PDF masih besar dan memicu peringatan.

### 5.2 Yang sudah kuat

- RLS aktif pada tabel domain; akses anonim ditolak pada pemeriksaan hosted.
- Grant kolom dan helper `school_private.*` dengan `search_path=''`.
- Trigger untuk transisi status, audit, revisi, dan idempotensi.
- Impor XLSX dengan batas ukuran, tipe sel, dan escaping formula CSV.
- Ekspor PDF/XLSX dimuat dinamis agar tidak masuk bundle awal.
- Tidak ditemukan secret yang dilacak di repo; klien hanya memakai publishable key.
- Skip-link, fokus terlihat, label form, `role="alert"`, dan reduced motion sudah ada.

## 6. CI/CD dan rilis

| Tahap | Yang ada | Bukti | Kekurangan |
| --- | --- | --- | --- |
| CI | `.github/workflows/verify.yml` | Push/PR, izin `contents: read`, Node 24, `npm ci`, `npm run check`, Chromium, `npm run test:browser` | Belum ada bukti workflow berjalan di GitHub. Tidak menguji Supabase hosted, migration, Advisor, deploy, atau UAT. |
| Variabel CI | Fixture Supabase | `https://example.supabase.co` dan publishable key fixture | Tidak memakai data atau secret nyata. Ini benar untuk CI, tetapi bukan uji integrasi. |
| Build | Vercel | `vercel.json`: build `npm run build`, output `dist`, SPA rewrite | Tidak ada bukti build/deploy terbaru dari commit saat ini. |
| Hosting | Vercel | URL produksi tercatat: `https://si-stir-hebat-blue.vercel.app` | Login, logout, redirect Auth, email, dan aktivasi admin belum diverifikasi. |
| Release source | Repo GitHub terpisah | Commit `86fe0e7`, paket 108 berkas | Repo kerja aktif tidak memiliki remote; CI release belum diverifikasi. |
| Database hosted | 23 migration | `check:supabase` lulus, Advisor bersih | Dua migration lokal belum diterapkan; urutan migration harus diselaraskan. |

Status yang tepat: **konfigurasi CI/CD tersedia, tetapi rantai verifikasi sampai produksi belum terbukti**. Jangan menyebut pipeline "berjalan" hanya karena file workflow ada.

Urutan rilis yang aman:

1. Selesaikan keputusan PRD dan retensi.
2. Selaraskan urutan migration; jangan melompati `student_habits`.
3. Uji migration baru di PGlite/Supabase lokal.
4. Minta persetujuan pemilik sebelum menerapkan ke hosted.
5. Terapkan, lalu jalankan `check:supabase`, Security Advisor, dan uji akun sekolah.
6. Verifikasi Auth redirect, login, logout, dan pemulihan kata sandi di Vercel.
7. Baru perbarui status rilis.

## 7. Matriks RBAC

Matriks ini disusun dari policy RLS migration, bukan dari dokumen RBAC resmi yang belum ada. UI dapat menyembunyikan menu, tetapi otoritas sebenarnya ada di database.

Keterangan:

- **K** = kelola: tambah/ubah sesuai alur dan trigger.
- **B** = baca data modul secara luas.
- **T** = baca terbatas: diri sendiri, anak sendiri, kelas, atau penugasan aktif.
- **-** = tidak ada akses eksplisit.
- Pending hanya dapat mengakses profil/akun sendiri; anonim hanya halaman publik, login, dan pemulihan kata sandi.

### 7.1 Administrasi dan data pokok

| Modul | Admin | Kepala | Guru | Siswa | Wali | Pending |
| --- | --- | --- | --- | --- | --- | --- |
| Profil/akun sendiri | T | T | T | T | T | T |
| Pengumuman | K, B | K, B | T published | T published | T published | - |
| Data master | K, B | B | B | B | B | - |
| Registri guru/siswa | K, B | B | T siswa yang diajar; T diri | T diri | - | - |
| Relasi akun | K, B | B | T siswa yang diajar | T diri | - | - |
| Jadwal | K via RPC, B | B | T | T | T | - |
| Bukti supervisi (Storage) | - | K, B pada tahapnya | T milik sendiri setelah publikasi | - | - | - |
| Komunikasi guru-wali | - | - | K, T pasangan aktif | - | K, T pasangan aktif | - |

### 7.2 Pembelajaran dan supervisi

| Modul | Admin | Kepala | Guru | Siswa | Wali | Pending |
| --- | --- | --- | --- | --- | --- | --- |
| Absensi | B | B | K, T penugasan | T diri | T via portal, 30 status terakhir | - |
| Jurnal mengajar | B | B | K, T penugasan aktif | - | - | - |
| Modul ajar | T non-draft | K approval, B | K, T milik sendiri | - | - | - |
| Materi dan tugas | T non-draft | T non-draft | K, T penugasan | T published | T published anak | - |
| Pengumpulan tugas | - | - | B, T tugas miliknya | K, T milik sendiri | - | - |
| Umpan balik | B, termasuk draft | B, termasuk draft | K, T milik sendiri | T published | T published anak | - |
| Asesmen dan hasil | B | B | K, T milik sendiri | T published | T published anak | - |
| Supervisi | - | K, B seluruh | T hasil sendiri setelah publikasi | - | - | - |
| Portal wali | - | - | - | - | T anak sendiri | - |

Catatan penting:

- Administrator dan kepala sekolah dapat membaca seluruh umpan balik, termasuk draft. Kebijakan ini perlu dikonfirmasi apakah disengaja.
- Administrator dapat melihat beberapa menu pembelajaran, tetapi tidak otomatis berhak menulis. Ada ketidaksesuaian antara navigasi dan RLS pada materi/tugas/asesmen yang perlu diselaraskan.
- Komunikasi belum memiliki UI dan belum hosted. Aksesnya dibatasi pada guru dengan penugasan aktif dan wali terverifikasi; pencabutan relasi menutup akses.
- Rincian policy dan risiko ada di `docs/AUDIT_KEAMANAN.md` dan `docs/SECURITY_REVIEW.md`.

## 8. UI/UX

### 8.1 Yang sudah diterapkan

- Bahasa Indonesia di seluruh alur utama.
- Lima "ruang" pada halaman beranda: Administrator, Kepala Sekolah, Ruang Guru, Ruang Murid, Ruang Orang Tua.
- Dashboard dan menu yang menyesuaikan peran.
- Palet dasar teal/oranye: `#12383a`, `#e6feff`, `#359fa0`, `#e26d46`, dengan font Plus Jakarta Sans.
- Gaya "Neo-Tactile": border tebal, bayangan keras, kartu, dan tombol besar.
- Palet ungu/lilac pada ringkasan kepala sekolah: `#2d174d`, `#7652a8`, `#bd397a`, `#477fba`.
- Breakpoint 700 px, 600 px, dan 480 px; tabel memakai scroll horizontal; navigasi ponsel dibatasi tinggi dan dapat digulir.
- Target sentuh sekitar 44 px pada tombol workspace.
- Skip-link ke `#main-content`, `:focus-visible`, label form, `role="alert"`, teks alternatif, dan `prefers-reduced-motion`.
- Uji desktop 1280x900 dan ponsel 390x844 dengan API tiruan.

### 8.2 Kesenjangan UI/UX

| Temuan | Dampak | Tindakan |
| --- | --- | --- |
| Arah desain tercatat ungu/lilac/biru muda/pink, tetapi palet dasar masih teal/oranye | Identitas visual belum konsisten dengan arahan terbaru | Pemilik memutuskan: pertahankan teal atau migrasikan token warna secara bertahap. |
| Halaman beranda menjanjikan materi, tugas, kebiasaan, dan komunikasi yang belum semuanya tersedia | Ekspektasi pengguna tidak sesuai kemampuan | Sesuaikan salinan beranda atau tandai fitur "segera hadir" setelah keputusan pemilik. |
| Menu materi/tugas/asesmen dapat muncul untuk admin/kepala, tetapi RLS tidak memberi akses yang sama | Pengguna dapat melihat tautan lalu ditolak | Selaraskan navigasi dengan policy atau ubah policy setelah keputusan. |
| Beberapa halaman memiliki tabel lebar dan teks panjang | Risiko overflow pada ponsel | Sudah dimitigasi dengan scroll dan `overflow-wrap`; tetap perlu uji konten nyata. |
| Belum ada audit WCAG formal | Aksesibilitas belum terbukti menyeluruh | Tambahkan uji keyboard, kontras, dan pembaca layar pada UAT. |
| Demo mode dapat aktif di build produksi | Akun demo dan data contoh dapat membingungkan atau disalahgunakan | Gerbang demo hanya untuk development/test sebelum rilis. |

## 9. Kerangka aplikasi

### 9.1 Stack

| Lapisan | Teknologi |
| --- | --- |
| UI | React 19.1, React DOM 19.1 |
| Build | Vite 6.4.6, TypeScript 5.8.3 |
| Routing | React Router DOM 7.8 |
| Backend | Supabase JS 2.57, Auth, Postgres, RLS, Storage privat |
| Ikon | lucide-react |
| PDF | pdfmake 0.3.14, dimuat dinamis |
| Excel | read-excel-file, write-excel-file, unzipit, worker XLSX |
| Kualitas | ESLint 10, TypeScript ESLint, Node test, PGlite, Playwright 1.65 |
| Runtime | Node 24.x |

### 9.2 Struktur

```text
src/
  app/            shell, Auth, Dashboard, Header, Account, Password, rute
  features/
    academic/     asesmen dan hasil
    attendance/   absensi, impor, laporan
    guardian/     portal wali
    journals/     jurnal mengajar
    learning/     modul ajar, materi, tugas
    schedule/     jadwal dan usulan
    school/       data master, registri, relasi
    supervision/  supervisi dan bukti
    komunikasi/   API pesan (belum ada UI)
    student-habits/ fondasi (belum ada UI)
  components/ui/  komponen bersama
  lib/            klien Supabase
  styles/         CSS global
supabase/migrations/
tests/            unit, database, communication, browser
scripts/          pemeriksaan Supabase
```

### 9.3 Alur aplikasi

```text
index.html
  -> ErrorBoundary
  -> BrowserRouter
  -> AuthProvider
  -> Header + Routes
  -> ProtectedRoute (lapisan UI)
  -> halaman fitur
  -> Supabase (publishable key)
  -> RLS + grant kolom + RPC/trigger (lapisan otoritas)
```

Prinsip penting:

- Tidak ada server aplikasi terpisah di repo; Supabase adalah backend.
- Frontend tidak boleh memakai service role key.
- `ProtectedRoute` hanya mengatur pengalaman UI; keamanan tetap ditentukan RLS.
- Sebagian besar halaman diimpor statis; hanya PDF, XLSX, dan worker yang dimuat dinamis.
- Tidak ada state library global; data server diambil langsung per halaman.

### 9.4 Konsekuensi teknis

- Bundle awal masih menerima seluruh halaman dan dependensi inti.
- Chunk PDF besar dan memicu peringatan; ini memengaruhi pengguna yang membuka laporan pertama kali.
- Dashboard kepala sekolah melakukan banyak request dan membutuhkan indeks serta agregasi yang lebih baik.
- Batas daftar 1000/200 dapat memotong data secara diam-diam jika volume tumbuh.

## 10. Database dan migration

### 10.1 Status

- 25 migration lokal.
- 23 migration tercatat di hosted.
- Belum diterapkan: `20261114000139_student_habits` dan `20261114083827_komunikasi`.
- `student_habits` lebih awal daripada `komunikasi`; urutan ini tidak boleh dilewati.
- Security Advisor hosted bersih untuk skema yang ada, tetapi belum mencakup migration lokal.
- Tidak ada data sekolah nyata yang diisi oleh tim pengembang.

### 10.2 Kelompok skema

| Kelompok | Isi utama |
| --- | --- |
| Identitas dan akses | Profil, peran, relasi akun, pendaftaran kelas, penugasan guru |
| Data pokok | Data master, registri guru/siswa, tahun ajaran/kelas/mapel |
| Komunikasi sekolah | Pengumuman |
| Kehadiran | Sesi absensi, catatan, impor, laporan |
| Pembelajaran | Jurnal, modul ajar, materi, tugas, pengumpulan, feedback, asesmen |
| Pengawasan | Supervisi empat tahap, bukti privat, Storage |
| Penjadwalan | Jadwal dan usulan perubahan |
| Portal wali | Ringkasan kehadiran anak dengan akses terbatas |
| Infrastruktur | Todos privat, audit, revisi, event |
| Pengembangan baru | 7 Kebiasaan dan komunikasi guru-wali, keduanya lokal |

### 10.3 Pola keamanan database

- `revoke all from public, anon, authenticated` sebelum grant.
- Grant tabel dan kolom minimal.
- Helper `school_private.*` sebagai SECURITY DEFINER dengan `search_path=''`.
- Wrapper publik SECURITY INVOKER.
- `(select auth.uid())` untuk menghindari evaluasi berulang.
- Trigger untuk transisi status, audit, revisi, dan pencegahan perubahan langsung.
- RPC untuk operasi sensitif seperti simpan absensi dan usulan jadwal.
- Advisory lock, `request_id`, dan hash untuk idempotensi.
- Bucket Storage privat dengan pembatasan tipe dan ukuran.

### 10.4 Komunikasi guru-wali

Migration `20261114083827_komunikasi.sql` menambahkan pesan teks append-only dengan batas 1-4000 karakter. Akses hanya untuk guru dengan penugasan aktif dan wali terverifikasi pada siswa/kelas aktif. Admin, kepala sekolah, siswa, pending, dan anonim ditolak. API bertipe sudah ada, tetapi belum ada rute, UI, penerapan hosted, atau UAT. Karena itu modul ini belum boleh diumumkan sebagai fitur tersedia.

### 10.5 Risiko data anak

- Belum ada kebijakan retensi dan penghapusan data.
- Foreign key `teachers/students.profile_id` tanpa cascade dapat menghambat penghapusan akun Auth.
- Bukti supervisi dapat memuat citra anak dan belum diuji retensinya.
- Snapshot absensi tetap tersimpan setelah koreksi.
- Audit menyimpan UUID aktor, tetapi prosedur koreksi dan penghapusan belum ditetapkan.

Rincian ada di `docs/AUDIT_DATA_ANAK.md`.

## 11. Keamanan dan kepatuhan: ringkasan

| Area | Status | Catatan |
| --- | --- | --- |
| Secret di repo | Tidak ditemukan secret terlarang | Hanya publishable key yang boleh masuk klien. |
| RLS hosted | Anonim ditolak pada tabel yang diperiksa | Tidak membaca baris data. |
| Security Advisor | Tidak melaporkan temuan pada skema hosted | Tidak mencakup migration lokal. |
| Demo mode | Risiko sedang | Akun demo dan dump fitur dapat masuk build produksi jika tidak digerbang. |
| Storage bukti | Risiko sedang | Kebijakan baru dianalisis statis; perlu tes dengan akun nyata. |
| Draft feedback | Perlu konfirmasi | Admin/kepala dapat membaca draft; pastikan ini disengaja. |
| Retensi data anak | Risiko tinggi kepatuhan | Belum ada keputusan dan prosedur. |
| Dokumen vs kode | Risiko sedang | Angka tes, referensi, dan klaim rilis belum konsisten. |

Tidak ada temuan Kritis baru yang terbukti pada kode aplikasi dalam audit ini. Namun ini bukan jaminan keamanan; area yang belum diuji tetap berisiko.

## 12. Prioritas temuan dan tindakan

### Kritis

Tidak ada temuan Kritis baru yang terbukti pada kode aplikasi.

### Tinggi

1. **UAT dan aktivasi belum dilakukan.** Login, logout, pemulihan kata sandi, email, redirect Auth, dan akun sekolah nyata belum diverifikasi.
2. **Retensi dan penghapusan data anak belum ada.** Ini risiko kepatuhan dan operasional.
3. **Demo mode berpotensi aktif di produksi.** Gerbang demo harus menjadi syarat rilis.
4. **Urutan migration tertunda.** Dua migration lokal belum hosted; `student_habits` lebih awal dan tidak boleh dilewati.
5. **CI/CD belum terbukti end-to-end.** Workflow dan konfigurasi Vercel ada, tetapi belum ada bukti run dan verifikasi produksi.
6. **Konflik dokumen acuan dan stack.** PRD menyebut Next.js/Tailwind/monorepo, sedangkan aturan proyek melarang Next.js dan implementasi memakai Vite + Supabase + CSS. RBAC resmi juga belum disahkan.

### Sedang

1. Uji kebijakan Storage bukti dengan akun nyata.
2. Selaraskan navigasi materi/tugas/asesmen dengan RLS.
3. Perbaiki salinan beranda yang menjanjikan fitur belum tersedia.
4. Kurangi fan-out request dashboard kepala sekolah dan tambahkan indeks.
5. Tangani pemotongan daftar 1000/200 secara eksplisit.
6. Konfirmasi akses admin/kepala ke draft feedback.
7. Selaraskan angka tes, klaim rilis, dan referensi di dokumen.

### Rendah

1. Hapus export mati dan direktori fitur kosong.
2. Pecah file besar dan kurangi duplikasi pemeriksaan peran.
3. Pindahkan konteks Auth keluar dari `src/app` agar fitur tidak saling bergantung.
4. Optimalkan chunk PDF dan strategi pemuatan laporan.
5. Rapikan token warna dan dokumentasikan design system.

## 13. Tugas yang dapat diambil agen lain

Daftar lengkap dan aturan kerja ada di `docs/HANDOFF.md`. Ringkasnya:

| Kode | Tugas | Pemilik yang disarankan |
| --- | --- | --- |
| H-01 | Gerbang demo mode agar tidak aktif di produksi | Frontend |
| H-02 | Tes kebijakan Storage bukti | QA/backend |
| H-03 | Perbaiki akses draft feedback atau dokumentasikan | Backend |
| H-04 | Uji dan rapikan policy sensitif lain | Backend |
| H-05 | Selaraskan navigasi dengan RLS | Frontend/backend |
| H-06 | Perbaiki salinan beranda | Frontend |
| H-07 | Selaraskan dokumen dan angka tes | Dokumentasi |
| H-08 | Putuskan retensi dan penghapusan data anak | Pemilik + backend |
| H-09 | Optimasi dashboard kepala sekolah | Frontend/backend |
| H-10 | Hapus kode mati dan direktori kosong | Frontend |
| H-11 | Tangani pemotongan daftar | Frontend/backend |
| H-12 | Pindahkan konteks Auth | Frontend |
| H-13 | Audit ulang setelah perubahan | Auditor |

Temuan besar tidak boleh diubah sepihak oleh auditor. Perubahan database harus berupa migration baru, diuji lokal, dicocokkan dengan riwayat hosted, dan disetujui pemilik sebelum diterapkan.

## 14. Rekomendasi urutan kerja

1. Pemilik mengarsipkan tujuh dokumen acuan di repo (misalnya `docs/references/`), menyetujui versi resminya, dan memutuskan konflik stack serta RBAC.
2. Selesaikan UAT akun sekolah serta verifikasi Auth/redirect dan aktivasi admin.
3. Selaraskan urutan migration, terapkan setelah persetujuan, lalu jalankan pemeriksaan hosted dan Advisor.
4. Tutup risiko rilis: gerbang demo, tes Storage, dan kebijakan retensi data anak.
5. Selesaikan UI komunikasi dan 7 Kebiasaan hanya setelah kontrak resmi disetujui.
6. Verifikasi CI GitHub dan deployment Vercel dengan commit yang sama.
7. Audit ulang seluruh repo dan perbarui `PROJECT_STATUS`, `IMPLEMENTATION_LOG`, dan `DECISIONS`.

## 15. Kesimpulan

SI STIR HEBAT sudah memiliki inti aplikasi sekolah yang luas, terstruktur, dan teruji secara lokal. Kekuatan utamanya adalah pemisahan peran di database, pola RLS yang konsisten, serta modul operasional yang saling terhubung. Kesenjangan utamanya bukan pada jumlah fitur, melainkan pada pembuktian kesiapan: keputusan resmi, UAT akun nyata, penerapan migration, verifikasi Auth/redirect, retensi data anak, dan bukti CI/CD.

Dengan bukti saat ini, status yang dapat dipertanggungjawabkan adalah **fondasi lokal siap direview dan di-UAT**, belum **siap operasional**.
