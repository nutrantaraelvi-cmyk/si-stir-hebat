## Rerun dependency dan check - 20 November 2026

- `npm ci` gagal pada Node default v26.13.0 karena binary esbuild terkunci (`EPERM`); retry via Node 24.22.3 gagal saat unlink binary Rollup terkunci. `npm install --ignore-scripts --prefer-offline --no-audit --no-fund` EXIT 0, dengan cleanup warnings untuk dua binary terkunci. `package-lock.json` tidak berubah.
- Rerun `npm run check` Node v24.22.3: migration/CI check, lint, typecheck, dan **140/140** tes lulus; build gagal saat Vite membersihkan `dist/assets` terkunci (`EPERM`). Log `docs/logs/check-2026-11-20-current-node24.log`. Tsconfig dipulihkan byte-identik setelah cache sementara diarahkan ke folder di root.
- Vite build terpisah ke `.tmp-dist-check` EXIT 0, 1.788 modul; audit manual 29 bundel JavaScript tidak menemukan identifier/email/password/nama fixture demo. Output sementara dibersihkan. `dist/` tetap belum diganti.

## Check dan suite browser penuh Codex (historis: 20 November 2026)

- `npm run check` Node v24.22.3 EXIT 0: 38 migration, CI check, lint, typecheck, **140/140 tes**, build 1.787 modul, audit **29 JavaScript tanpa akun demo**. Build memakai konfigurasi publishable sintetis proses-lokal; peringatan chunk PDF 790,69 kB. Log `docs/logs/check-2026-11-20-post-trace-node24.log`.
- Suite browser penuh Playwright di port 5472 EXIT 0: **402/402 lulus** dalam 10,4 menit dengan trace dimatikan; log `docs/logs/browser-full-2026-11-20-port5472-traceoff.log`. Seluruh API ditiru; bukan UAT.
- Hosted read-only 16:32 WIB: 23 migration, terbaru `20261113074045`, Advisor WARN `auth_leaked_password_protection`. Tidak ada hosted write, deploy, commit, atau merge. Gerbang hosted tetap tertahan oleh Advisor serta pemeriksaan backup/restore, `check:supabase`, dan Supabase lokal yang belum terpenuhi.

## Verifikasi backend Codex

- Menambah assertion database notifikasi untuk fan-out dari dokumen sekolah, modul ajar, supervisi terbit, laporan absen wali, dan pesan komunikasi. Tes memastikan penerima sesuai peran dan teks notifikasi tidak membocorkan penanda isi sensitif.
- Bukti: Node v24.22.3, `node --test tests/database.test.mjs` EXIT 0 (**73/73**); `npm run check` EXIT 0 (**137/137**, 39 migration, lint, typecheck, build 1.781 modul, audit 26 berkas JS tanpa akun demo). Build memakai konfigurasi publishable sintetis proses-lokal dan membangun ulang `dist/`; peringatan chunk PDF 790,69 kB.
- Browser rerun port 5398 selesai dengan **308/312 lulus, 4 gagal** (tiga ENOENT penutupan trace, satu `ERR_INSUFFICIENT_RESOURCES` pada navigasi `/jadwal` desktop); exit 1. Tidak dihitung sebagai hijau.
- Tidak ada perubahan hosted. X3 menunggu Security Advisor bersih dan preflight/check Supabase; X9 Supabase lokal belum tersedia karena Docker/Podman/WSL tidak ada; deploy dan merge belum dilakukan. D1/D2 kini sudah diputuskan sementara pemilik.

## Rekonsiliasi hosted read-only â€” 20 November 2026 (Codex)

- Supabase MCP: 23 migration hosted cocok dengan 23 lokal pertama; `SELECT count(*)::bigint FROM public.todos` menghasilkan 0; Security Advisor tetap 1 WARN `auth_leaked_password_protection`.
- Tidak ada operasi tulis hosted. X3 tetap tertahan sampai Security Advisor bersih; `check:supabase`, metadata RLS/Storage hosted, dan bukti backup/restore belum tersedia.
- Pemeriksaan X9: `Get-Command`/`where.exe` tidak menemukan Docker, Podman, atau nerdctl; `wsl.exe --status` menyatakan WSL belum terpasang. Binary Supabase CLI lokal terdeteksi, tetapi perintah `--version` gagal karena CLI mencoba menulis telemetry ke `%USERPROFILE%\\.supabase` di luar root yang ditetapkan; sandbox menolak tulis itu. Tidak menjalankan stack lokal atau meminta eskalasi di luar batas root.
- Pemeriksaan X11: daftar branch lokal memuat `ai/qoder-demo-gate` (`e59ed65`) dan `ai/qoder-copilot-fixes` (`0f0eaad`), selain branch aktif `ai/qoder-palette-d8`. Kandidat itu berbasis jalur alternatif dan belum diuji penuh terisolasi; `main` dan remote tidak tersedia, serta working tree bercampur. Tidak ada integrasi atau commit.

## X6 lanjutan - Pesan SQLSTATE `55000` pada konfirmasi laporan wali - 20 November 2026

- `AbsenceReports.tsx` membedakan `40001` (konflik revisi), `55000` (tidak ada satu sesi/roster absensi yang cocok untuk tanggal laporan), dan galat lain. Pesan `55000` menyatakan laporan belum dikonfirmasi dan status absensi tidak berubah; blok galat menyediakan tombol "Kembali ke daftar laporan" untuk memuat ulang, catatan pemeriksa tetap di layar, dan pesan sukses tidak ditampilkan.
- Tes baru `teacher sees an actionable error when no single attendance session matches` memakai `setupTeacher` dengan kode galat pertama yang dapat diatur; fokus 6/6 (desktop + ponsel) port 5376.
- Bukti: `npm run check` EXIT 0 (137/137, 39 migration, 26 bundel; `check-55000.log`); rincian `docs/ABSENSI_55000_2026-11-20.md`. Tidak ada perubahan API, RPC, atau migration.

## Q3/Q4 lanjutan - Sinyal pemotongan daftar master - 20 November 2026

- Semua hard cap referensi kini memakai `limit(cap + 1)`: opsi penugasan di `Assessments.tsx`, `ClassMaterials.tsx`, `TeachingModules.tsx`, `Schedules.tsx` (penugasan + kelas), opsi guru `AcademicSupervision.tsx`, selector tahun ajaran `MasterData.tsx` (200), dan riwayat absensi `Attendance.tsx` (200). Sebelumnya cap terpenuhi melempar galat generik seluruh halaman; sekarang data sampai batas tetap tampil dengan `ReferenceNotice` atau status "Riwayat dipotong pada 200 perubahan terbaruâ€¦".
- Tes baru `truncated assignment options are announced instead of silently dropped` (mock 1.001 penugasan: notifikasi tampil, tombol tetap aktif, 1.000 opsi + placeholder).
- Bukti: `npm run check` Node v24.22.3 EXIT 0 (39 migration, 137/137, 26 bundel; `check-truncation.log`); `tests/browser/app.spec.ts` **214/214** desktop+ponsel port 5375 (`browser-truncation-5375.log`). Rincian: `docs/PEMOTONGAN_DAFTAR_2026-11-20.md`.

## Q10 - Dashboard per peran memakai RPC `dashboard_overview` - 20 November 2026

- `src/app/Dashboard.tsx`: peran administrator/kepala sekolah kini memakai satu RPC `dashboard_overview()` lewat `getDashboardOverview(client)` (kontrak Codex, tidak diubah) untuk registri aktif, tahapan supervisi, status modul, dan pengumuman terbaru. `SchoolOverview.tsx`/`PrincipalOverview.tsx` (3 + 6 hitungan `head`) dihapus. Galat RPC tampil sebagai alert "Ringkasan dashboard belum dapat dimuat..." dan dipulihkan lewat tombol "Muat ulang"; guru/siswa/wali/pending tetap memakai jalur pengumuman lama.
- Tes: mock `/rpc/dashboard_overview`, +5 skenario (satu panggilan overview untuk kepala sekolah, tanpa pemanggilan guru, galat pulih, angka registri + tautan, empat peran tanpa RPC); 3 tes principal/overview lama diganti; audit responsif memakai mock overview berangka nol.
- Bukti: `npm run check` Node v24.22.3 EXIT 0 (39 migration, 137/137, 26 bundel; `check-q10.log`); suite penuh port 5372 300 tes, 299 lulus â€” satu timeout 30 dtk `[mobile] attendance administrator` yang lulus 2/2 saat diulang terpisah port 5373; run terfokus 56/56 port 5371. Rincian dan batas: `docs/DASHBOARD_Q10_2026-11-20.md`.

## Q9 - 7 Kebiasaan ramah anak sesuai D6 - 20 November 2026

- `StudentHabits.tsx`: legend dan teks bantuan kini menyatakan status tanggal secara eksplisit ("belum diisi" vs "sudah diisi") dan membedakan tanggal tanpa catatan dari "tidak dilakukan". Menyimpan checklist tanpa satu pun kebiasaan ditandai ditolak dengan pesan agar tanggal dibiarkan belum diisi, sehingga rekap tidak berubah menjadi deretan "tidak dilakukan".
- Pesan simpan menambahkan apresiasi positif; rekap diberi keterangan "untuk melihat perkembangan anak, bukan peringkat atau perbandingan antarmurid"; empty state menjelaskan arti tanggal kosong. Tidak ada peringkat, hukuman, atau perbandingan antarmurid; daftar anak tetap berasal dari RPC `habit_students` (batas relasi ditegakkan RLS).
- `tests/browser/habits.spec.ts`: +2 skenario (status "belum diisi" dan penolakan simpan kosong; rekap per anak berlabel pertumbuhan, tanpa kata peringkat/juara/terbaik). Suite penuh 300/300 port 5369 (`browser-q9-5369.log`); `npm run check` Node v24.22.3 EXIT 0, 137/137, 39 migration, 26 berkas JS (`check-q9.log`).
- Batas: belum ada uji dengan akun nyata; target sentuh 56px tombol kebiasaan sudah tercakup audit responsif. Entri `AI_COORDINATION.md`/`PROJECT_STATUS.md` berada di worktree bersama dan belum di-commit terpisah.

## Q12 - Manual pengguna dan panduan pemeliharaan - 20 November 2026

- `docs/MANUAL_PENGGUNA.md` (baru): alur masuk/keluar, navigasi sidebar/bottom nav/drawer, halaman per peran (administrator, kepala sekolah, guru, siswa, wali), notifikasi/komunikasi, aturan D6 (tanpa peringkat) dan D7 (laporan wali tidak otomatis final), serta batas jujur (UI dokumen belum ada, UAT akun nyata belum).
- `docs/PEMELIHARAAN.md` (baru): Node 24, env publishable saja, perintah gate, aturan migration (baru/berurutan/begin-commit/review hosted/Advisor bersih), retensi D5, etika workspace bersama dan `git commit --only`, troubleshooting, syarat REVIEW.
- `docs/PANDUAN_UAT.md`: kalimat basi "komunikasi/dokumen/kebiasaan belum ada UI" diganti status 20 November (dokumen saja yang belum ada UI) + tautan manual.
- Verifikasi snapshot 20 November: `npm run check` EXIT 0 137/137 unit, 38 migration, 26 berkas bundel; suite penuh 296/296 port 5368. Tidak ada perubahan kode/API/migration pada tugas dokumentasi ini.

## Q3/Q4 - Audit responsif 390/1280, skip link, target sentuh, dan ukuran halaman - 20 November 2026

- Spec baru `tests/browser/audit-responsive.spec.ts`: luapan horizontal `scrollWidth - innerWidth <= 1` pada 32 kombinasi rute/peran (administrator, guru, wali) di 1280x900 dan 390x844; skip link Tab+Enter memfokuskan `main#main-content`; target sentuh nav >=44px (bottom nav 48px). **68/68 lulus** port 5367.
- Suite penuh dengan spec audit: **296/296 lulus** (6,2 menit, port 5368; log `C:\Users\axioo\AppData\Local\Temp\qoder-qa-2026-11-18\browser-audit-5368.log`). `npm run check` EXIT 0: 137/137 unit/database, 38 migration, bundel 26 berkas (log `...\check-audit.log`).
- Q3: berkas TSX terbesar 303 baris (AcademicSupervision); pemecahan dinilai belum sepadan risiko regresi. Lazy route, useAuth, dan indikator terpotong sudah ada.
- Batas: API tiruan, belum uji pembaca layar/zoom/perangkat fisik, peran siswa dan pending belum masuk matriks luapan. Rincian dan batas jujur: `docs/Q4_AUDIT_2026-11-20.md`.

## Q2 (lanjutan) - Navigasi responsif: sidebar desktop, bottom nav + drawer ponsel - 20 November 2026

- `src/app/Header.tsx` tetap memakai helper RLS yang sama; desktop >=1000px memakai sidebar tetap 264px, ponsel <1000px memakai 4 tujuan cepat + tombol "Lainnya" yang membuka drawer aksesibel (role=dialog, aria-expanded/controls, Escape, klik latar, fokus kembali, tutup saat rute berubah). Target sentuh item bottom nav >=48px dan tautan drawer >=44px.
- `src/styles/global.css` menambah aturan `.guest-nav`, `.bottom-nav`, `.nav-drawer*`, dan media query 999px/1000px. Tidak ada perubahan API, kontrak, RLS, migration, atau hosted.
- `tests/browser/app.spec.ts` memakai helper `clickNavLink` sadar drawer dan asersi navigasi desktop/ponsel; suite penuh **228/228 lulus** (port 5364, 5,7 menit; log `C:\Users\axioo\AppData\Local\Temp\qoder-qa-2026-11-18\browser-nav-5364.log`).
- `npm run check` Node v24.22.3 EXIT 0: **137/137** tes unit/database, **38** berkas migration, lint/typecheck bersih, bundel 26 berkas tanpa akun demo. Tangkapan 1280/390 + drawer: `nav-1280.png`, `nav-390.png`, `nav-390-drawer.png`. Rincian: `docs/NAV_Q2_2026-11-20.md`.
- Entri ini ditulis di working tree bersama; berkas log/koordinasi memuat perubahan agen lain yang belum di-commit, sehingga commit Qoder hanya memuat berkas miliknya dan dokumen bukti.

## Q2 (increment) - Migrasi palet D8 ke ungu/lilac/biru muda/pink - 20 November 2026

- `src/styles/global.css` dan `index.html`: token global dimigrasikan (Primary Purple #4c1d95,
  Secondary Purple #7c3aed, Light Lilac #ede9fe, Soft Blue #dbeafe, Pink #fce7f3, latar #f8fafc,
  teks #1e293b, sekunder #64748b, garis #e2e8f0). Warna status digelapkan agar lolos AA.
- Navigasi aktif, logo, skip-link, dan tombol primer memakai `--brand`. Tidak ada perubahan logika,
  rute, kontrak, atau migration.
- `npm run check` (Node v24.22.3, konfigurasi uji publishable) EXIT 0: unit/database 129/129,
  35 berkas migration, lint/typecheck bersih, bundel produksi 26 berkas tanpa akun demo.
  Log: `...\qoder-qa-2026-11-18\check-palette2.log`.
- Verifikasi visual 390x844 dan 1280x900 lewat dev server port 5391; tangkapan layar di
  `...\qoder-qa-2026-11-18\palette-390.png` dan `palette-1280.png`.
- Suite browser penuh pasca-palet: **228/228 lulus** port 5361 (6,3 menit); log
  `...rowser-palette-5361.log`.
- Rincian dan rasio kontras: `docs/PALETTE_D8_2026-11-20.md`.
- Belum: sidebar desktop + navigasi bawah 5 tujuan (Q2 lanjutan), aksen siswa, verifikasi suite
  browser penuh setelah struktur navigasi berubah.

## Q0/Q11 - Sinkronisasi angka kanonik dan bukti suite - 20 November 2026

`npm run check` pada Node v24.22.3 lulus dengan 127/127 tes unit/database, lint, typecheck, dan build 32 berkas migration. Build tanpa konfigurasi Supabase valid sengaja gagal (D3); run hijau memakai URL dan kunci publishable uji, bukan rahasia. Log: `C:\Users\axioo\AppData\Local\Temp\qoder-qa-2026-11-18\check-2026-11-20-brief-env.log`.

Suite browser penuh lulus 228/228 dalam 6,4 menit pada port 5358, termasuk rekap 7 catatan terakhir yang sebelumnya belum terverifikasi. Harness memakai host `school-abc.supabase.co` dan kunci publishable uji yang lolos validasi config; tidak ada kode aplikasi, API, migration, atau konfigurasi hosted yang diubah. Log: `C:\Users\axioo\AppData\Local\Temp\qoder-qa-2026-11-18\browser-2026-11-20-brief-5358.log`.

Keputusan pemilik D1-D8 tanggal 20 November 2026 dicatat berstatus sementara di `docs/DECISIONS.md`; D4 menyatakan bagian 10 PRD superseded dan D1 lama tentang Next.js tidak lagi aktif. `docs/references/README.md` diperbarui, matriks V/C/U/D/A/E ditambahkan ke `docs/RBAC_RESMI_DRAFT.md`, dan angka kanonik diselaraskan di AGENTS, PROJECT_STATUS, QA_COVERAGE, UAT_CHECKLIST, serta Delivery Gate. Belum dikerjakan: UAT akun sekolah nyata, penerapan migration hosted, dan tugas UI Q1-Q13.

## 7 Kebiasaan harian - 20 November 2026

- Halaman /kebiasaan memakai src/features/student-habits/api dan RPC baca-saja habit_students; tombol kebiasaan 56px dengan aria-pressed, riwayat 25 baris per halaman, validasi guru wajib catatan, dan konflik revisi meminta muat ulang.
- Tes baru tests/browser/habits.spec.ts (2 tes x desktop/ponsel): 4/4 lulus; suite penuh 228/228 (port 5353) dan npm run check 125/125.
- Tidak ada perubahan API, migration, hosted, atau Auth. Pembeda "belum diisi" vs "tidak dilakukan" tetap PD-12.

## Laporan ketidakhadiran wali - 20 November 2026

Rute `/laporan-ketidakhadiran` ditambahkan (`src/features/parents/AbsenceReports.tsx`, tautan Header untuk wali dan guru) memakai API `src/features/parents/api/absence-reports` tanpa mengubah API, RLS, atau migration. Wali memilih anak tertaut, tanggal lampau, dan alasan; guru kelas meninjau dengan catatan wajib dan memutuskan konfirmasi/perbaikan; admin dan kepala sekolah baca-saja. Nama murid diambil dari RPC baca-saja `habit_students`; bila tidak tersedia, label "Murid terhubung" dipakai.

Kirim ulang memakai ID permintaan yang sama setelah respons hilang; kode `23505` ditampilkan sebagai laporan yang sudah ada; konflik revisi `40001` meminta muat ulang daftar tanpa menghapus catatan.

Verifikasi: `tests/browser/absence-reports.spec.ts` 4/4 lulus (desktop 1280x900 + ponsel 390x844); suite penuh **224/224** lulus dalam 6,2 menit (Node v24.22.3, port 5347, log `C:\Users\axioo\AppData\Local\Temp\qoder-qa-2026-11-18\browser-2026-11-20-laporan-5347.log`); `npm run check` lulus dengan **125/125** tes unit/database, lint, typecheck, build 26 berkas tanpa akun demo (log `...\check-2026-11-20-laporan.log`). Tidak ada UAT akun sekolah; migration `20261118000200_guardian_absence_reports` belum hosted.

## Pusat notifikasi dan sinkronisasi dokumen - 20 November 2026

Rute `/notifikasi` ditambahkan (`src/features/notifications/NotificationCenter.tsx`, tautan Header) memakai API `src/features/notifications/api` tanpa mengubah API, RLS, atau migration. Halaman menampilkan 25 baris per halaman dengan sentinel, label kategori/prioritas Indonesia, penanda belum dibaca, dan tombol "Tandai sudah dibaca"; galat tanda-baca mempertahankan notifikasi dan ID untuk percobaan ulang.

Verifikasi: `tests/browser/notifications.spec.ts` (2 tes x desktop 1280x900 + ponsel 390x844) lulus; suite penuh **220/220** lulus dalam 6,2 menit (Node v24.22.3, port 5346, log `C:\Users\axioo\AppData\Local\Temp\qoder-qa-2026-11-18\browser-2026-11-20-notifikasi-5346.log`); `npm run check` lulus dengan **125/125** tes unit/database, lint, typecheck, build 25 berkas tanpa akun demo (log `...\check-2026-11-20-notifikasi.log`). Tidak ada UAT akun sekolah.

Dokumen diselaraskan: AGENTS.md dan PROJECT_STATUS memakai angka 125/220; QA_COVERAGE menambah baris Pusat notifikasi; UAT_CHECKLIST dan PANDUAN_UAT menambah skenario notifikasi/kebiasaan/referensi dengan tanda belum dijalankan akun nyata; RBAC_RESMI_DRAFT menambah baris modul baru dan PD-09 sampai PD-12; Delivery Gate diberi lampiran Pusat notifikasi. Dashboard per peran belum diubah karena ringkasan guru/siswa/wali memerlukan kontrak data yang belum bertanda REVIEW dan mock tes dashboard menolak permintaan baru.


## Batas proyek Codex dan pencatatan migration â€” 13 November 2026

Pengguna menetapkan aplikasi React/Vite yang ada sebagai satu-satunya aplikasi utama SI STIR HEBAT. `AGENTS.md` dan README kini menetapkan folder ini sebagai root kerja Codex dan menandai demo Next.js di luar folder sebagai non-kanonis. Migration hosted `20261113074045_create_private_todos` dicatat di `supabase/migrations` dengan RLS pemilik; tabel contoh kosong dan tidak dipakai UI aplikasi. `scripts/check-supabase.mjs` memasukkan tabel itu dalam pemeriksaan penolakan akses anonim. Advisor keamanan tidak melaporkan lint; migration dan policy diverifikasi melalui metadata tanpa membaca data pengguna.

## Persiapan rilis operasional â€” 13 November 2026

Permintaan pengguna: kerjakan hingga web dapat digunakan, buat repo GitHub baru lalu deploy ke Vercel. Pengguna kemudian memilih membuat repo privat sendiri dan mengirim URL. Konektor GitHub belum menampilkan repository; Computer Use ke Chrome ditolak oleh alat. Belum ada push atau deployment publik. Akun admin belum tersedia; pengguna meminta panduan aktivasi, bukan pembuatan akun pribadi.

Perubahan: dashboard memperlihatkan layanan sesuai peran; gaya formulir workspace responsif ditambahkan; build produksi menolak konfigurasi Supabase kosong/tidak valid. Panduan docs/AKTIVASI_DAN_RILIS.md mencakup aktivasi admin pending melalui SQL dengan UUID tertentu, urutan data sekolah, variabel Vercel, redirect Auth, email, UAT dan operasi. Workflow aplikasi mandiri memakai Node 24 dan fixture CI. Paket source 108 berkas di release/si-stir-hebat dibuat menggunakan allowlist; tidak menyertakan .env.local, dokumen referensi pribadi, metadata hosted, node_modules, atau artefak tes. Repository lokal paket terpisah, branch codex/initial-release, commit fc1ddf8, belum memiliki remote. ZIP source tersedia di release/si-stir-hebat-source-20261113.zip. Workspace induk tidak di-commit.

Validasi sejauh ini: npm run check lulus 101 tes, lint, tipe dan build; build tanpa konfigurasi diuji dan ditolak. npm audit --omit=dev melaporkan nol kerentanan yang diketahui. Tes awal seluruh browser 155/156 lulus; satu kegagalan preview impor Excel tidak terulang dalam 18 tes pengulangan. Pemeriksaan desktop rilis terbaru lulus seluruh 82 skenario. Server tes berhenti saat bagian mobile (ERR_CONNECTION_REFUSED); mobile diulang terpisah. Screenshot dashboard mobile diperiksa, tidak meluber horizontal. Preview build lokal berjalan pada http://127.0.0.1:4173; lima URL SPA diuji HTTP 200. Semua uji browser memakai API tiruan, bukan kredensial/data pribadi sekolah.

Rilis publik tetap menunggu URL repo privat dan koneksi deployment. Belum dapat diklaim siap operasional hingga akun admin, login/pemulihan email nyata, konfigurasi hosting dan UAT sekolah selesai. Cakupan PRD lanjutan tetap terbuka; skema nilai sementara tidak berubah. Peringatan ukuran chunk PDF tetap ada.

## Filter kelas jadwal â€” 13 November 2026

Filter kelas `/jadwal` diterapkan di query server sebelum pagination, bersama filter tanggal/hari atau mode pengelolaan. Perubahan pilihan mereset halaman dan formulir agar hasil halaman sebelumnya tidak tertinggal. Opsi menggunakan ID kelas dan label tahun ajaran, termasuk kelas nonaktif untuk pemeriksaan historis. Data master kelas memang dapat dibaca semua peran sekolah menurut policy yang ada; isi jadwal tetap mengikuti RLS penugasan/enrollment/relasi wali. UI menjelaskan cakupan ini serta bahwa filter tidak mengubah daftar usulan. Opsi dibatasi kurang dari 1000; kegagalan atau batas tercapai menampilkan error, bukan daftar parsial.

Node 24 npm run check lulus: 101 tes, lint, tipe, build. Dua belas tes browser jadwal desktop/ponsel lulus, ditambah dua regresi supervisi. Skenario baru menguji filter server dari halaman kedua, reset halaman, kelas bernama sama berbeda tahun ajaran, serta tidak adanya kontrol audit pada wali. Tes browser menggunakan API tiruan. Tidak ada migrasi atau pembacaan data pribadi; UAT sekolah tetap terbuka. Peringatan ukuran chunk PDF yang sudah ada tetap muncul.

## Riwayat jadwal â€” 13 November 2026

Admin dan kepala sekolah dapat membuka riwayat per jadwal pada `/jadwal`: snapshot sebelum/sesudah, jam, periode, status aktif, revisi, waktu audit berlabel WIB dan alasan. Pembuatan awal dibedakan dari perubahan. Pagination 20 baris, retry dan pembatalan request menjaga tampilan ketika pindah halaman. Memakai tabel audit/RLS yang ada; tidak ada migrasi atau akses data pribadi.

Validasi: Node 24 npm run check lulus (101 tes, lint, tipe, build). Delapan tes browser jadwal sebelumnya lulus, dua skenario riwayat desktop/ponsel lulus setelah fixture kegagalan dibuat persisten agar tidak tertutupi retry otomatis klien. Tes regresi supervisi, absensi dan asesmen yang ikut filter juga lulus. Browser memakai API tiruan; UAT sekolah masih terbuka. Peringatan chunk PDF lama tetap ada. Riwayat menampilkan alasan dan waktu; nama pelaku belum ditampilkan.

## Usulan perubahan jadwal â€” 13 November 2026

Guru dapat mengusulkan perubahan hari, jam, dan periode jadwal aktif miliknya melalui `/jadwal`. Usulan menyimpan snapshot jadwal asal dan revisi, alasan wajib, serta satu usulan pending per jadwal. Admin melihat perbandingan semula/usulan lalu menyetujui dan menerapkan atau menolak dengan alasan. Kepala sekolah hanya membaca. Usulan dan keputusan tidak dibuka kepada siswa/wali. Penugasan aktif tetap diperlukan bagi guru untuk membaca usulannya.

Penerapan keputusan dan perubahan jadwal dilakukan dalam satu transaksi melalui pemeriksaan bentrok yang sama dengan penyuntingan admin. Revisi usang, jadwal nonaktif, atau penugasan pengusul yang dicabut menggagalkan persetujuan. Usulan usang masih dapat ditolak, lalu guru mengajukan ulang. Keputusan terminal tidak dapat diedit langsung. Kebijakan tahap ini: perubahan mengganti seluruh rentang jadwal, bukan memecahnya menjadi periode lama/baru; dijelaskan dalam UI. Penarikan usulan oleh guru belum tersedia.

Migration `20261113061010_schedule_proposals` diterapkan; total 22 migration. Metadata RLS, larangan INSERT/UPDATE langsung, serta larangan RPC anonim terverifikasi; Security Advisor kosong. Pemeriksaan tidak membaca data pribadi. `npm run check` Node 24 lulus dengan 101 tes, lint, tipe dan build. Tes database mencakup batas peran, duplikasi, konflik dengan rollback, revisi usang, pencabutan penugasan dan keputusan tunggal. Delapan tes browser jadwal desktop/ponsel lulus dengan API tiruan, ditambah dua regresi supervisi. Kegagalan awal pemilih label tes diperbaiki menggunakan combobox berdasarkan accessible name; tidak memerlukan perubahan UI. Peringatan ukuran chunk PDF tetap ada. UAT akun sekolah dan uji konkurensi multikoneksi belum dilakukan.
# Catatan implementasi

## 20 November 2026 - Polish halaman Akun

- Halaman `/akun` dibangun sebagai tata letak dua area: profil dan tindakan keamanan. Identitas akun tetap berasal dari sesi dan profil Supabase, sedangkan tautan pengumuman serta kata sandi memakai rute yang sudah ada.
- Tindakan keluar mempertahankan nama tombol `Keluar` agar pemilihan Playwright dan pengguna tetap konsisten.
- Desktop memakai dua kolom yang berimbang untuk profil dan akses cepat. Ponsel memakai satu kolom, kartu tidak meluber, dan seluruh tautan serta tombol tetap memenuhi target sentuh minimal 44px.
- Verifikasi: `npm run typecheck` lulus; lint terfokus `npx eslint src/app/Account.tsx src/app/Profile.tsx` lulus; 14 skenario Playwright terpilih desktop dan mobile lulus dengan API tiruan.
- Batas: belum ada UAT akun sekolah nyata dan belum ada run suite browser penuh pada perubahan ini.

## 10 November 2026 â€” Audit berdasarkan master prompt

Proyek yang sudah ada dipertahankan. Pemeriksaan mencakup source, routing, konfigurasi TypeScript/Vite/Supabase, migration, dependensi, Git, dan dokumen referensi. Tidak ditemukan dokumen PRD/blueprint/RBAC/API yang disebutkan. Git menunjukkan perubahan workspace belum di-commit.

Hasil sebelum perubahan fase ini: 20 tes unit/database, 18 tes browser, dan build lulus pada pekerjaan sebelumnya. Migrasi profil/pengumuman sudah diterapkan dengan persetujuan. Hak akun tidak diubah sesuai instruksi pengguna.

## Fondasi pemeriksaan

- `eslint.config.js`: pemeriksaan JavaScript, TypeScript, dan aturan inti React Hooks.
- `package.json` / lockfile: dependensi lint dipin; script lint/typecheck akan dimasukkan ke alur check.
- `docs/PROJECT_STATUS.md`: status terpisah untuk selesai, sebagian, belum dibuat, blocker, dan prioritas.
- `docs/DECISIONS.md`: asumsi sementara saat dokumen sumber belum tersedia.

Hasil fase berikutnya dicatat setelah pemeriksaan dijalankan; tidak menganggap instalasi atau penulisan source sebagai bukti fitur telah berfungsi.

## Fondasi â€” hasil

- `eslint.config.js`, script `lint`, `typecheck`, dan `check` terpasang. CI menambahkan lint dan typecheck sebelum tes/build.
- `src/components/ui/Feedback.tsx`: komponen loading, empty, dan pesan kesalahan dengan retry.
- `src/components/ui/ErrorBoundary.tsx`: fallback ketika render gagal; tidak mencetak props, data sesi, atau input pribadi.
- Dependensi lint menggunakan ESLint 10 dan plugin dengan peer dependency yang sesuai. Audit instalasi mengungkap advisori minimatch transitif. Override `minimatch: 11.0.1` ditambahkan sesuai [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), kemudian lint dan tes dijalankan. `npm audit` terakhir: 0 vulnerability. Tidak menjalankan `audit fix --force`.

## Data master administratif

- `src/features/school/master.ts`: registry kolom/form dan validator. Payload membatasi mutasi hanya ke kolom yang diizinkan; bilangan, checkbox, tanggal, NPSN, dan kode mata pelajaran divalidasi.
- `src/features/school/MasterData.tsx`: identitas sekolah, tahun ajaran, semester, mata pelajaran, kelas; tambah/ubah, pagination, kalender, konfirmasi aktivasi, status loading/empty/error, dan ekspor halaman.
- `src/app/App.tsx`, `src/styles/global.css`: rute `/sekolah/:kind?`, navigasi, tabel dengan scroll internal pada layar kecil, label dan nama tombol yang dapat dibaca pembaca layar.
- `src/utils/csv.ts`: CSV UTF-8/BOM dengan escaping serta mitigasi formula spreadsheet; hanya mengekspor baris halaman yang sedang terlihat.
- `tests/master.test.mjs`, `tests/csv.test.mjs`, `tests/database.test.mjs`, dan `tests/browser/app.spec.ts`: validasi, payload whitelist, CSV, RLS semua peran, kalender, periode aktif tunggal, edit, konfirmasi, unduhan, dan kondisi backend belum tersedia.

## Migration remote â€” disetujui dan diverifikasi

Pemeriksaan konflik menemukan hanya tabel profil/pengumuman dari riwayat sebelumnya. Pengguna menyetujui lima tabel master baru dan pencabutan izin eksekusi fungsi bawaan. Native MCP digunakan; tidak menggunakan secret key frontend atau mengubah peran akun.

| Versi remote | Nama | Hasil |
| --- | --- | --- |
| `20261110081258` | `school_master_data` | diterapkan |
| `20261110081303` | `restrict_auto_rls_execution` | diterapkan |

SQL lokal yang belum diterapkan sebelumnya diganti nama mengikuti versi aktual remote. Isi dua migration lama yang sudah ada tidak diubah. Data master tidak di-seed.

Verifikasi metadata: tujuh tabel, seluruhnya RLS aktif; 20 policy; dua trigger kalender; update kolom dibatasi; `anon` dan `authenticated` tidak dapat mengeksekusi `rls_auto_enable()`. Fungsi tersebut bertipe event-trigger, sehingga advisory tidak otomatis membuktikan dapat dipanggil sebagai RPC biasa; pembatasan grant dilakukan sebagai penguatan izin. Advisor sesudahnya: `lints: []`.

`scripts/check-supabase.mjs` diperluas untuk ketujuh tabel. Pemeriksaan live lulus: Auth email aktif dan akses anonim ditolak, tanpa mengambil baris data sekolah.

## Verifikasi terakhir

- `npm run check`: lint tanpa warning, TypeScript, 34 tes unit/database, production build lulus.
- Pengujian browser awal: 24/28 lulus; empat gagal karena selector nama sel juga cocok dengan nama tombol edit. Selector diperbaiki menggunakan `exact: true`, lalu empat skenario tersebut lulus pada rerun terarah.
- Setelah penambahan unduhan CSV, seluruh suite browser dijalankan ulang: **28/28 lulus**, desktop dan ponsel, dalam 59,9 detik.
- Pengujian remote menggunakan metadata dan akses anonim. Tidak mengklaim pengiriman email, login akun sekolah, atau alur akademik yang belum dibangun telah diuji langsung.

## Registri guru/siswa â€” 10 November 2026

- `src/features/school/master.ts`: definisi guru/siswa, validasi kode/nama, payload whitelist, dan fungsi izin yang memisahkan data orang dari master nonpribadi.
- `src/features/school/MasterData.tsx`: tab sesuai peran, tambah/ubah dan ekspor menggunakan komponen yang ada; akses langsung ke URL terlarang tetap ditolak. UI tidak menampilkan input UUID, penghubung akun, atau perubahan peran.
- `supabase/migrations/20261110082821_people_registry.sql`: diterapkan setelah persetujuan pengguna dan pemeriksaan konflik; nama lokal diselaraskan dengan versi remote. Menambahkan dua tabel dengan RLS, tiga policy per tabel, unique kode/profil, FK dan indeks penulis.
- `tests/database.test.mjs`: administrator mengelola tanpa hak penghubungan akun; kepala sekolah hanya membaca; guru/siswa hanya membaca baris terhubung; akses lintas registri, baris lain, orang tua/pending/anonim, penulisan metadata, duplikasi dan kode tidak valid diuji.
- `tests/master.test.mjs` dan `tests/browser/app.spec.ts`: izin tab/route, validasi/payload, tambah/edit siswa dan status aktif, daftar guru terhubung serta penolakan akses.
- `scripts/check-supabase.mjs`: mencakup sembilan tabel, tetap tanpa membaca baris data pribadi.

Hasil: `npm run check` lulus (lint, TypeScript, **43 tes unit/database**, build). Suite browser desktop/ponsel **36/36 lulus**. Advisor keamanan remote: `lints: []`. Grant metadata mengonfirmasi insert/update klien hanya pada kode/nama/status; semua kolom ID, profil, penulis dan tanggal pembuatan dilindungi. Data API menolak akses anonim di kesembilan tabel.

Tidak ada akun dibuat, peran diubah, penghubungan profil, atau data guru/siswa nyata dimasukkan. Penugasan, keanggotaan kelas dan verifikasi wali masih pekerjaan berikutnya.

## Keanggotaan dan penugasan â€” implementasi lokal berikutnya

- Migration `20261110084348_class_enrollments_assignments.sql`: relasi kelas per tahun dan penugasan kelas/mata pelajaran; FK komposit menjaga riwayat tahun kelas, indeks unik parsial membatasi kelas aktif siswa, dan trigger memeriksa kapasitas serta status aktif.
- `school_private.can_read_assigned_student(uuid)` memeriksa pengguna/peran di dalam fungsi privat dan menghindari siklus RLS antara siswa/keanggotaan. Akses guru mengikuti penugasan dan status aktif; guru tidak mendapat izin menulis data siswa atau relasi.
- `src/features/school/master.ts` / `MasterData.tsx`: jenis referensi, opsi nama/kode/tahun, pengambilan lookup mengikuti RLS, empty/error state, konfirmasi perubahan relasi, serta pemeliharaan identitas riwayat. Update relasi hanya mengirim status aktif; pemindahan menggunakan relasi baru.
- `tests/database.test.mjs`: kapasitas, kelas aktif ganda, perpindahan lintas tahun, perlindungan metadata/identitas, guru tanpa penugasan, akses terbatas pada kelas yang ditugaskan, pencabutan status, siswa sendiri, kepala sekolah, orang tua/pending/anonim, dan perubahan tahun kelas yang memiliki riwayat.
- `tests/browser/app.spec.ts`: keanggotaan dan penugasan menggunakan label manusia, konfirmasi/batal, prasyarat kosong, penguncian pilihan pada relasi tersimpan dan payload status saja.

Hasil: **50 tes unit/database lulus**, suite penuh **42 tes browser lulus**. Setelah penguncian identitas riwayat, **empat tes relasi terarah lulus**, termasuk pemeriksaan pilihan tidak dapat diubah serta payload update hanya status. Lint, TypeScript dan build terakhir lulus. PGlite menguji invariant secara sekuensial, bukan stress test multikoneksi.

Pengguna menyetujui melalui bubble. Pemeriksaan menemukan 9 tabel lama dan tidak ada konflik nama relasi. Native MCP menerapkan versi `20261110084348`, kemudian metadata mengonfirmasi RLS dan tiga policy pada setiap tabel baru, policy tambahan siswa untuk guru bertugas, serta grant update hanya `is_active`. Helper SECURITY DEFINER berada di schema `school_private` yang tidak diekspos Data API, memiliki pemeriksaan identitas/peran internal, dan tidak memberikan execute kepada anon. Advisor keamanan: `lints: []`. Tidak mengubah peran, membuat data, atau menghubungkan akun.

## Absensi manual â€” implementasi lokal

- `src/features/attendance/Attendance.tsx`: sesi per kelas, salinan peserta hari ini, editor status tanpa hadir otomatis, konfirmasi, alasan koreksi, rekap, CSV tersimpan, riwayat dan pesan konflik revisi.
- `src/features/attendance/attendance-model.ts`: tipe, label, ringkasan yang memisahkan belum diisi dari alpa, validasi koreksi dan tanggal aplikasi. Nama file model dibedakan dari komponen agar resolusi modul Windows tidak bertabrakan.
- `src/app/App.tsx` / CSS: rute `/absensi`, navigasi dan tampilan responsif.
- Migration `20261110091137_attendance_core.sql`: tiga tabel, snapshot peserta saat membuat sesi, RLS, helper privat, serta wrapper RPC SECURITY INVOKER ke penyimpan privat yang memvalidasi aktor, penugasan, status, alasan dan revisi. Update catatan dan audit berjalan dalam satu transaksi.
- Tes menemukan masalah SELECT-policy pada INSERT RETURNING: helper STABLE tidak melihat sesi yang baru disisipkan dalam snapshot statement yang sama. Policy guru diperbaiki untuk memeriksa `class_id` baris langsung, tanpa mengendurkan hak. Kolom juga dikualifikasi eksplisit untuk menghindari benturan nama `id` profil/sesi. Lihat [snapshot fungsi PostgreSQL](https://www.postgresql.org/docs/current/xfunc-volatility.html).
- `tests/database.test.mjs`: snapshot, larangan backdate/future date, kelas kosong, audit, rollback batch, revisi usang, alasan koreksi, pemalsuan ID, akses siswa sendiri, larangan catat bagi admin/kepala sekolah, akses lintas kelas, dan pencabutan penugasan.
- `tests/attendance.test.mjs` dan tes browser: status awal kosong, ringkasan, tanggal, konfirmasi, koreksi, ekspor, read-only peran, konflik yang mempertahankan draft sampai reload eksplisit, dan pembuatan sesi.

Verifikasi: **62 tes unit/database**, lint, TypeScript dan build lulus; **14 tes browser absensi** dan kemudian suite penuh **56/56 tes browser** lulus setelah perubahan navigasi/pemilihan sesi baru. Pengujian browser menggunakan API tiruan; tidak mengklaim login atau absensi akun sekolah sungguhan sudah diuji langsung.

Pengguna menyetujui migration melalui bubble. Pemeriksaan konflik menemukan 11 tabel lama dan tidak ada fungsi absensi dengan nama yang bentrok. Native MCP menerapkan versi `20261110091137`; file lokal diselaraskan dengan versi remote. Verifikasi metadata: RLS aktif pada tiga tabel baru, catatan/audit tidak memiliki grant tulis langsung bagi klien, insert sesi hanya untuk kolom kelas/tanggal, dan RPC publik SECURITY INVOKER tidak dapat dieksekusi anon. Advisor keamanan: `lints: []`. Pemeriksaan live Auth serta penolakan akses anonim ke 14 tabel lulus tanpa membaca baris data. Tidak mengisi absensi, menghubungkan akun atau mengubah peran.

## Impor XLSX â€” 10 November 2026

- Dependensi runtime dipin: `read-excel-file`, `write-excel-file`, dan `unzipit`. API aktual diperiksa dari tipe versi terpasang, termasuk `.toBuffer()`/`.toFile()` dan pembacaan workbook berisi sheet/data.
- `import-model.ts`: template dengan identitas sesi; validasi kode teks, duplikasi, cakupan peserta, status, alasan, jumlah baris; blank/omitted bukan alpa. Preview mengikat revisi status yang tersimpan.
- `read-attendance-xlsx.ts`, `xlsx.worker.ts`, `xlsx-client.ts`: preflight metadata ZIP, larangan formula/makro/external workbook, satu sheet, batas isi/file/baris, worker yang dapat dihentikan dan timeout. Parser membaca file lokal tanpa upload.
- `AttendanceImport.tsx`: unduh template, pilih file, preview, blokir seluruh file jika ada kesalahan, konfirmasi, retry memakai request ID yang sama, dan riwayat metadata. Integrasi Attendance mengunci operasi lain saat pemrosesan serta menolak impor saat draft manual belum disimpan.
- Migration `20261110093304_attendance_imports.sql` diterapkan setelah persetujuan bubble dan pemeriksaan konflik. Native MCP memverifikasi RLS, grant hanya baca pada log, RPC publik SECURITY INVOKER, penyimpan privat dengan pemeriksaan penugasan dan tanpa hak anonim. Advisor keamanan: `lints: []`. Tidak memasukkan data impor/absensi nyata.
- `tests/attendance-import.test.mjs`: XLSX nyata round-trip, preservasi kode `001`, rumus/multi-sheet/ZIP invalid, sesi/header salah, kode asing/ganda, alasan dan batas input.
- Tes database: sekali simpan meskipun retry identik, penolakan reuse request ID dengan isi berbeda, rollback tanpa log sukses pada revisi usang, metadata invalid, larangan manipulasi log, akses antarperan/kelas.
- Tes browser XLSX awal 5/6 lulus; satu tes mengisi file saat input masih dinonaktifkan selama unduhan template. Tes disinkronkan untuk menunggu input aktif. Rerun **6/6 lulus**, termasuk preview sebelum mutasi, file invalid dan respons tidak pasti setelah commit yang dicoba ulang dengan request ID sama.

`npm run check` lulus dengan **72 tes unit/database**, lint, TypeScript dan build. Suite browser penuh **62/62 lulus** pada desktop dan ponsel. Pemeriksaan live Auth dan penolakan akses anonim seluruh 15 tabel lulus; npm audit melaporkan 0 vulnerability. Perubahan mengatasi transisi pemilihan sesi agar tidak mendereferensikan sesi yang belum ada pada daftar ketika sesi baru baru saja dibuat.

## Rekap rentang tanggal - 10 November 2026

- Audit AGENTS.md, kode, migration dan Git: dokumen referensi resmi tetap tidak tersedia; perubahan lama dipertahankan. Tidak mengubah skema atau akun/peran.
- Changelog resmi Supabase dan dokumentasi filter/range diperiksa; query memakai klien sesi pengguna serta RLS yang sudah ada. Advisor keamanan hosted mengembalikan lints kosong. Tidak membaca baris data sekolah nyata.
- AttendanceReport.tsx: filter satu kelas, tanggal inklusif maksimal 31 hari; query sesi berurutan dengan batas sentinel dan roster terpisah per sesi, empat bersamaan, untuk menghindari pemotongan 1.000 baris. Kegagalan meniadakan hasil/ekspor; perubahan filter membersihkan hasil lama.
- report-model.ts: validasi tanggal kalender/rentang dan agregasi berdasarkan ID siswa dengan snapshot terbaru. Belum diisi tidak dihitung alpa. Tidak menghitung persentase tanpa kalender hari efektif.
- Ekspor CSV memakai hasil tersimpan dan sanitasi formula yang tersedia. UI menjelaskan batas akses serta konsistensi beberapa query. Komponen menghentikan request saat dilepas; filter mempunyai label, fieldset dan status/error.
- Dua tes unit baru memeriksa batas tanggal, tahun kabisat, identitas siswa, snapshot berubah dan status kosong. npm run check lulus 74 tes unit/database, lint, TypeScript dan build.
- Enam kasus browser baru (desktop/ponsel): 1.100 catatan dengan query terfilter dan ekspor total, rentang invalid, kegagalan salah satu roster tanpa hasil parsial, serta cakupan siswa sendiri. Ekspektasi CSV diperbaiki untuk kolom berkutip. Fixture kegagalan 503 awal memicu retry otomatis SDK melebihi timeout assertion; fixture diganti pencabutan izin 403 setelah satu roster berhasil. Regresi penuh dengan fixture final lulus 68/68 tes browser (1,7 menit). Lint dan build final juga lulus setelah penataan form responsif.

## Jurnal mengajar - 10 November 2026

- Audit kode dan instruksi proyek; PRD/RBAC belum tersedia. Memakai keputusan konservatif staff-only, append-only tanpa persetujuan akademik.
- Skill Supabase/Postgres, dokumentasi RLS resmi dan aturan privilege/index diperiksa. CLI migration new membuat draft `20261110095054_teaching_journals.sql`; belum diterapkan remote. CLI awal dibatasi sandbox pada file telemetri pengguna; dijalankan kembali dengan izin eskalasi untuk pembuatan berkas lokal.
- Tabel jurnal dengan FK penugasan/penulis, snapshot nama, tanggal/topik/kegiatan/refleksi dan indeks; RLS select/insert, helper privat SECURITY DEFINER dengan auth.uid internal, trigger SECURITY INVOKER. Grant kolom menolak pemalsuan penulis/waktu/snapshot. Tidak ada update/delete atau RPC publik baru.
- JournalWorkspace: profil sendiri, pilihan penugasan aktif, form/konfirmasi, UUID stabil, deteksi retry identik melalui pembacaan catatan ber-ID sama, plain text, pagination 20 dan CSV halaman. Route terlindungi, tautan navigasi dan akses cepat dashboard ditambahkan. Backend hilang memberi state persiapan.
- Tes database: penulis/snapshot, metadata forgery, immutable, tanggal/kalender/isi, lintas peran/guru, pencabutan penugasan/guru/kelas/mapel dan pencabutan peran. Tes awal memakai parameter date + unknown; cast integer eksplisit memperbaiki query tes. Migration tidak diubah untuk mengatasi kegagalan query tes tersebut.
- Dua tes model validasi/payload dan 18 tes browser jurnal lulus. npm run check lulus 80 tes unit/database, lint, TypeScript dan build. Regresi browser penuh final 86/86 lulus (1,8 menit).
- Pemeriksaan metadata hosted: nama tabel/helper/trigger belum ada. Advisor security mengembalikan lints kosong. Tidak membaca data orang nyata atau menerapkan migrasi tanpa persetujuan.

Regresi penuh pertama fase jurnal: 83/86 lulus. Dua assertion status jurnal terlalu luas saat pesan sukses dan indikator reload muncul bersamaan; locator diperjelas berdasarkan isi sukses. Satu tes XLSX lama tidak menghasilkan preview karena pemilihan file terjadi pada transisi kontrol; tes sekarang menunggu tombol template aktif dan menggunakan file chooser dengan pemeriksaan actionability. Tidak menambahkan sleep atau mengubah parser untuk mengatasi tes tersebut. Regresi final lulus 86/86 tes browser desktop/ponsel (1,8 menit). Lint final dan git diff --check lulus. Migration tetap belum diterapkan, menunggu persetujuan bubble.

## Pemulihan build dan persiapan migration jurnal - 11 November 2026

- Menyelaraskan tipe sesi demo dengan SDK dan mempertahankan pemeriksaan klien pada pemuatan profil, dashboard, dan pengumuman.
- Pengunjung demo tanpa sesi diarahkan ke halaman masuk oleh rute terlindungi. Penyimpanan sesi demo hanya dibaca saat konfigurasi Supabase tidak tersedia.
- npm run check lulus, termasuk 81 tes unit/database. Seluruh 86 tes browser desktop/ponsel lulus setelah menjalankan Playwright dengan akses ke server lokal dan Edge.
- Pembacaan riwayat hosted mengonfirmasi delapan migration. Pemeriksaan metadata mengonfirmasi tabel dan dua fungsi jurnal belum ada. Tidak ada perubahan remote.

## Penerapan migration jurnal - 11 November 2026

- Migration jurnal diterapkan ke Supabase setelah persetujuan pengguna. Versi hosted 20261111070725 diselaraskan dengan nama berkas lokal.
- Metadata mengonfirmasi RLS, policy baca dan insert, trigger validasi aktif, serta pembatasan izin kolom. Security Advisor tidak melaporkan temuan.
- npm test lulus 81 tes. npm run check:supabase mengonfirmasi Auth aktif dan Data API menolak akses anonim ke seluruh 16 tabel. Pengujian menggunakan akun sekolah masih tertunda.

## Rekonsiliasi dokumen dan navigasi peran

- Menelaah tujuh lampiran dan mencatat kesenjangan fitur pada status proyek.
- Navigasi memakai peran profil sendiri, menandai halaman aktif, dan menampilkan tautan untuk modul yang dapat dibuka oleh pengguna. Pemeriksaan di modul dan Supabase tetap berlaku.
- npm run check lulus dengan 81 tes unit/database. Enam tes navigasi Playwright untuk guru, siswa dan orang tua lulus pada desktop dan ponsel dengan API tiruan.

## Tautan akun dan verifikasi wali

- Migration 20261111074620_account_relationships membuat relasi wali dan audit perubahan. RPC memvalidasi peran administrator dan kecocokan peran target, mencegah penggantian akun tanpa pencabutan, serta mencatat perubahan dalam transaksi yang sama. Retry identik tidak menambah audit.
- UI admin meninjau registri berdasarkan kode dan mengonfirmasi ID akun serta alasan sebelum menyimpan. Tidak ada perubahan akun atau data sekolah nyata saat penerapan migration.
- 82 tes lokal, empat tes browser desktop/ponsel dan pemeriksaan Data API anonim pada 18 tabel lulus. Pemeriksaan Security Advisor tertunda karena refresh OAuth konektor gagal.

## Ruang Orang Tua dan kehadiran anak

- RPC guardian_attendance memakai profil wali dan relasi terverifikasi pada setiap permintaan. Hasil hanya memuat nama anak aktif serta tanggal dan status hingga 30 catatan per anak.
- Migration 20261111075356_guardian_attendance diterapkan dan versi lokal diselaraskan. Eksekusi anonim ditolak, panggilan tanpa identitas kosong, dan Security Advisor tidak melaporkan temuan.
- Lint, TypeScript, build, 83 tes lokal dan dua tes browser portal wali lulus. Tes database memverifikasi pembatasan anak dan pencabutan. Tes browser memakai API tiruan di desktop dan ponsel.

## Penyusunan dan pemeriksaan modul ajar

- Menambah alur draf, pengajuan, revisi, persetujuan, dan arsip. Akses guru mengikuti penugasan aktif. Kepala sekolah berwenang memeriksa, sementara administrator memiliki akses baca atas modul yang sudah diajukan.
- Database mengendalikan transisi dan mencatat audit status. UI menyertakan versi baris saat menyimpan untuk mendeteksi perubahan serentak.
- Migration 20261111080033_teaching_modules diterapkan dan berkas lokal diselaraskan. Build, 84 tes lokal dan dua tes browser desktop/ponsel lulus. Security Advisor tidak melaporkan temuan.

## Supervisi Akademik

- Mengimplementasikan empat tahap, validasi skor dan kelengkapan, versi baris untuk perubahan serentak, audit transisi, serta publikasi hasil ke guru terkait.
- Migration 20261111080735_academic_supervision diterapkan dan diselaraskan. RLS, dua trigger dan pembatasan akses anonim diperiksa. Security Advisor tidak melaporkan temuan.
- Build, 85 tes lokal dan dua tes browser penjadwalan lulus. Port Playwright dapat diatur dengan PLAYWRIGHT_PORT ketika port bawaan dipakai proses lain.

## Laporan Supervisi

- Menambahkan laporan khusus kepala sekolah dengan filter tanggal di server, status tahap, target tindak lanjut, status publikasi dan CSV. Perubahan filter menghapus hasil sebelumnya.
- npm run check lulus dengan 85 tes lokal. Empat tes browser desktop dan ponsel untuk laporan, unduhan dan penjadwalan lulus dengan API tiruan.

## Penyimpanan otomatis observasi

- Menyimpan skor dan catatan setelah jeda input. Simpan manual dan otomatis memakai satu pengunci permintaan serta filter revisi yang sama.
- Isian tetap di formulir bila penyimpanan tidak dikonfirmasi. Pengguna dapat mencoba lagi atau memuat versi terbaru setelah membuang isian.
- Lint, TypeScript, build, 85 tes lokal dan enam tes browser supervisi lulus. Tidak memerlukan migration.

## Bukti privat supervisi

- Menambah bucket privat dengan kebijakan baca sesuai RLS sesi supervisi dan pembatasan unggah serta hapus pada tindak lanjut yang belum dipublikasikan.
- Migration 20261111082822_supervision_evidence diterapkan dan diselaraskan. Metadata bucket, batas ukuran, tiga policy dan Security Advisor diperiksa.
- Build, 85 tes lokal termasuk pembatasan RLS bukti, serta dua tes unggah browser desktop dan ponsel lulus.

## Ekspor Excel rekap absensi

- CSV dan XLSX memakai hasil rekap tersimpan yang sama. Workbook menyimpan kode dan nama sebagai teks, serta jumlah kehadiran sebagai angka.
- Build, 85 tes lokal dan enam tes browser rekap lulus. Tes browser membuka kembali hasil unduhan dan memeriksa jumlah baris, nol di awal kode, teks mirip rumus dan total numerik. Tidak memerlukan migration.

## Publikasi materi kelas

- Menambah draf materi teks dengan snapshot kelas dan mapel, konfirmasi publikasi, arsip dan filter versi baris. RLS membaca keanggotaan kelas dan relasi wali saat permintaan.
- Migration 20261111092126_class_materials diterapkan. RLS dan Security Advisor diverifikasi. Build, 86 tes lokal dan dua tes browser desktop/ponsel lulus.

## Publikasi tugas kelas

- Menambah jenis tugas dan tenggat pada alur kelas yang sudah ada. Materi lama tetap tampil di /materi.
- Migration 20261111092744_class_tasks diterapkan. RLS, constraint, trigger dan Security Advisor diperiksa. Build, 87 tes lokal dan empat tes browser lulus.

## Pemeriksaan workspace â€” 12 November 2026

Antarmuka TaskSubmissions sudah tersedia dan terhubung dari halaman tugas. Siswa dapat mengirim jawaban teks, sedangkan guru dapat membaca jawaban dengan pagination. Penerapan migration task_submissions di remote dan pengujian browser alur pengumpulan belum diverifikasi pada pemeriksaan ini.

npm run check berhasil: lint, TypeScript, 87 tes lokal dan build produksi lulus. Hasil ini tidak membuktikan seluruh kebutuhan PRD telah selesai. Pekerjaan terbuka tetap meliputi verifikasi pengumpulan, umpan balik dan penilaian, jadwal, administrasi dokumen, kehadiran guru, serta UAT akun sekolah.

## Pengumpulan jawaban tugas

- Menambahkan jawaban teks melalui /tugas. Database memvalidasi publikasi, tenggat WIB, identitas dan keanggotaan kelas saat pengiriman serta mencegah pengiriman ganda.
- Migration 20261111232717_task_submissions diterapkan. Build dan 87 tes lokal lulus, termasuk pembatasan akses guru, siswa dan wali. Security Advisor tidak melaporkan temuan.

## Verifikasi pengumpulan tugas â€” 12 November 2026

Riwayat Supabase diperiksa langsung: migration task_submissions belum diterapkan. Seluruh 87 tes lokal lulus, termasuk pengumpulan, pengiriman ganda dan pembatasan akses. Tes browser baru memeriksa pengiriman jawaban serta pemuatan ulang halaman. Eksekusi browser belum berhasil diverifikasi karena server pengujian tidak mencapai kondisi siap. Penerapan remote dan verifikasi browser masih tertunda.
# Verifikasi pengumpulan dan pemulihan koneksi â€” 12 November 2026

- Mengonfirmasi migration `20261111232717_task_submissions` pada riwayat Supabase; metadata menunjukkan RLS aktif dan akses SELECT anonim ditolak. Tidak membaca data pengguna.
- Mengunci pengiriman ulang ketika hasil permintaan belum diketahui sampai pemeriksaan status berhasil. Isian jawaban dipertahankan ketika koneksi gagal.
- Menambahkan skenario browser untuk respons hilang dan konflik unik, termasuk pemeriksaan hanya satu permintaan pengiriman dan jawaban tetap tampil setelah halaman dimuat ulang.
- Validasi: `npm run check` lulus (87 tes, lint, TypeScript, build); enam tes browser terfokus lulus di Edge desktop dan ponsel pada port pengujian 5193.
- Mengoreksi catatan status migrasi yang bertentangan. UAT akun sekolah dan implementasi penilaian/umpan balik masih terbuka.

# Umpan balik tugas â€” 12 November 2026

- Rekonsiliasi PRD bagian 5.7/5.8, RBAC, API dan blueprint database: umpan balik tugas wajib; siswa/wali hanya membaca hasil terbit. Skema nilai resmi belum ditetapkan dalam PRD sehingga tahap ini tidak mengasumsikan skala angka.
- Menambahkan `TaskFeedback` pada jawaban siswa/guru dan panel baca wali. Draf memakai pemeriksaan revisi, publikasi memerlukan tinjauan draf tersimpan, kegagalan simpan meminta pemuatan ulang, hasil terbit dikunci.
- Menambahkan `task_feedback` dan `task_feedback_events`, pembatasan hak kolom, RLS, validasi guru penulis dengan penugasan aktif, pemeriksaan siswa/wali terverifikasi, serta riwayat draf yang hanya terbaca pihak berwenang.
- Migrasi diterapkan dan nama lokal diselaraskan ke `20261111233649_task_feedback`. Metadata menunjukkan RLS aktif/anon ditolak pada kedua tabel; Security Advisor kosong. Tidak mengakses data pribadi.
- Validasi: lint, TypeScript, 88 tes lokal dan build lulus. Delapan tes browser lulus pada eksekusi pertama; dua tes guru gagal karena selector mencocokkan paragraf dan textarea, diperbaiki lalu keduanya lulus. Total sepuluh skenario terfokus diverifikasi pada desktop/ponsel.
- Terbuka: UI riwayat/pengawasan, koreksi hasil terbit, asesmen numerik sesuai skema sekolah, laporan akademik dan UAT.

# Asesmen akademik â€” 12 November 2026

- Mengikuti keputusan eksplisit pengguna: nilai maksimum per asesmen dan publikasi manual guru sesuai penugasan, tanpa perhitungan rapor otomatis.
- Membuat halaman `/asesmen`: daftar berhalaman, pembuatan, metadata draf, daftar peserta, nilai/catatan per siswa, tinjauan publikasi, koreksi beralasan serta riwayat. Siswa/wali mendapat tampilan baca hasil terbit; admin/kepala sekolah hanya pengawasan.
- Menambahkan `assessments`, `assessment_results`, `assessment_result_events`, snapshot peserta aktif, validasi angka/tanggal, RLS dan hak kolom. Nilai kosong tidak dihitung sebagai nol. Publikasi memerlukan seluruh peserta dinilai. Perubahan nilai menaikkan revisi asesmen; koreksi dan publikasi memakai kunci baris asesmen. Setiap alasan koreksi dikonsumsi untuk satu mutasi dan tersimpan dalam audit.
- Menemukan dan memperbaiki policy SELECT yang semula tidak mengenali baris baru saat INSERT RETURNING; akses guru pada baris baru kini memakai atribut baris langsung, sementara pembacaan hasil keluarga tetap menggunakan pemeriksaan identitas/tautan terverifikasi.
- Migration diterapkan sebagai `20261111234856_academic_assessments`; nama lokal diselaraskan. Metadata RLS/izin dan Security Advisor diperiksa. Skrip pemeriksaan API diperluas untuk tabel tugas, umpan balik dan asesmen; seluruh pemeriksaan `limit=0` lulus tanpa membaca baris pengguna.
- Validasi: `npm run check` (93 tes, lint, TypeScript, build) lulus. Setelah memperkuat alasan koreksi, 60 tes database lulus ulang. Sepuluh tes browser desktop/ponsel diverifikasi melalui eksekusi awal dan pengulangan dua tes guru setelah perbaikan selector pengujian. Tes mencakup nilai nol, publikasi, koreksi, riwayat, konflik revisi, serta kontrol baca siswa/wali/kepala sekolah.
- Pekerjaan lanjutan: rekap/ekspor dan grafik akademik, hak wali kelas, perubahan peserta dan UAT. Tidak mengklaim seluruh PRD selesai.

# Rekap akademik dan skema sementara â€” 12 November 2026

- Menambahkan panel rekap di halaman asesmen: tanggal inklusif, kelas, mata pelajaran, publikasi untuk staf dan pilihan siswa berdasarkan ID. Ekspor CSV/Excel memakai hasil lengkap filter lintas halaman; grafik batang hanya nilai terbit untuk satu siswa dan pelajaran.
- Mempertahankan nilai nol, nilai belum diisi dan kode siswa berawalan nol. Persentase hanya skor/maksimum, tanpa perhitungan rapor atau bobot. Pengguna secara eksplisit menegaskan skema sementara menunggu aturan resmi; keputusan dan antarmuka diperbarui.
- Membatasi pemuatan 366 hari/500 baris, memeriksa exact count agar pemotongan API tidak menghasilkan laporan parsial, membatalkan permintaan lama saat filter berubah dan menghapus hasil/ekspor lama. Grafik menampilkan maksimal 30 asesmen terbit terbaru, tabel berhalaman 25.
- Migration `20261112051122_assessment_subject_identity` menambah FK subject_id dari penugasan, backfill transaksional, indeks dan trigger pengisian. Metadata hosted memastikan guard kembali aktif, RLS aktif, kolom wajib dan tidak dapat diubah klien. Security Advisor tidak melaporkan temuan.
- Menggunakan skill proyek SI STIR HEBAT dan akses data; membaca panduan rekap/berkas. Menyiapkan Node 24.22.3 dalam cache npm agar pemeriksaan sesuai runtime CI. Tidak mengubah Node sistem atau dependensi aplikasi.
- Validasi Node 24: `npm run check` lulus dengan 97 tes; 60 tes database dijalankan ulang setelah tambahan query join RLS dan lint final lulus. Dua belas tes Playwright desktop/ponsel lulus dengan API tiruan, termasuk membaca workbook yang diunduh. Mock awal perlu header CORS expose Content-Range dan skenario 403 untuk penolakan izin; setelah diperbaiki semua skenario lulus.
- Menyelaraskan README dengan fitur dan 20 migration aktual. Tidak membaca baris data pribadi, membuat akun nyata, atau melakukan deployment. PDF dan UAT tetap terbuka.

# PDF rekap akademik â€” 12 November 2026

- Menambahkan unduhan PDF lokal dari hasil rekap lengkap yang sudah dibatasi RLS dan filter. Semua bidang ekspor CSV/Excel dipertahankan dalam tujuh kolom gabungan, dengan periode/filter/waktu data dan penanda skema sementara. Tidak mengubah kontrak penilaian atau membuat migrasi.
- Memasang versi tetap pdfmake 0.3.14 dan @types/pdfmake 0.3.3 setelah memeriksa dokumentasi/release resmi. Audit npm saat instalasi tidak melaporkan kerentanan. Font dibundel, tanpa mengambil font atau mengirim data ke layanan PDF eksternal.
- Memisahkan mesin/font PDF di Vite agar dependensi besar tidak masuk vendor utama. Pemeriksaan statis build memastikan chunk non-PDF tidak mengimpor mesin/font PDF secara statis. Dua chunk PDF masih melewati ambang peringatan ukuran Vite; vendor utama sekitar 347 KB, keduanya hanya diperlukan saat ekspor.
- Memakai skill PDF untuk pemeriksaan artefak: fixture 80 baris dari `scripts/qa-academic-pdf.mjs`, ekstraksi pypdf/pdfplumber dan render Poppler. Menemukan header maksimum terbungkus dan baris terbelah, lalu memperbaiki label dan dontBreakRows. Semua 11 halaman final diperiksa, 80 baris serta margin dan header/footer tervalidasi.
- `npm run check` Node 24: 99 tes, lint, tipe dan build lulus. Dua belas tes browser rekap lulus; dua tes unduhan diulang setelah perbaikan tata letak dan lulus. PDF hasil browser diperiksa hanya memuat tiga hasil sesuai filter fixture, termasuk nol, kode berawalan nol dan belum dinilai. Hasil QA berada di test-results yang diabaikan Git.
- UAT akun sekolah, skema resmi, kewenangan wali kelas, perubahan peserta dan modul PRD lain tetap terbuka.


## Jadwal pelajaran â€” 13 November 2026

Fondasi `/jadwal` tersedia: admin membuat/mengubah/menonaktifkan jadwal mingguan dengan rentang tanggal dalam tahun ajaran, penugasan tetap, alasan wajib, audit database, dan revisi optimistis. Server menolak bentrok guru atau kelas, memeriksa kejadian hari dalam irisan periode, serta mengunci transaksi penulisan jadwal. Guru membaca sesuai penugasan aktif; siswa dan wali sesuai kelas dan hubungan terverifikasi. Kepala sekolah membaca; pending dan anonim ditolak. Daftar dipaginasi 25 item; admin/kepala sekolah dapat melihat jadwal nonaktif melalui mode pengelolaan.

Migration `20261113000504_lesson_schedules` diterapkan dan riwayat dicocokkan. Pemeriksaan metadata memastikan RLS aktif pada dua tabel dan INSERT langsung klien ditolak. Tidak membaca data pribadi. Node 24 `npm run check` lulus: 100 tes, lint, tipe, build. Empat tes browser khusus jadwal desktop/ponsel lulus dengan API tiruan (ditambah dua regresi supervisi yang ikut filter). Belum UAT sekolah; uji konkurensi beberapa koneksi belum dilakukan. Peringatan ukuran chunk PDF lama tetap ada.

Pekerjaan berikutnya: usulan perubahan jadwal oleh guru sesuai PRD, tampilan riwayat pengaturan, dan UAT. Skema nilai tetap sementara; tidak menghitung rapor otomatis.





Hasil final rilis 13 November: pengulangan mobile lulus 82/82. Total cakupan akhir browser 164 skenario lulus (82 desktop + 82 mobile pada run terpisah setelah server tes awal berhenti). URL repo GitHub masih menunggu pengguna.

## Audit kesesuaian workspace â€” 14 November 2026

Pemeriksaan langsung pada root aplikasi: npm run check lulus (lint, TypeScript, 101 tes, build). Build memberi peringatan chunk mesin PDF 790,69 KB dan font 855,16 KB. Browser dan UAT akun sekolah tidak diulang pada audit ini.

Fitur yang terkonfirmasi dalam kode mencakup asesmen, laporan akademik dan usulan jadwal. Pernyataan historis bahwa usulan jadwal masih pekerjaan berikutnya sudah tertinggal. Folder docs/references serta berkas PRD/RBAC tidak ditemukan dalam workspace starter, sehingga kesesuaian penuh terhadap dokumen asli belum dapat diverifikasi.

Git yang ditemukan masih repository induk D:/code, tanpa commit, dengan proyek my-app dan berkas induk lain ikut tercakup. Root aplikasi tetap D:/code/SI_STIR_HEBAT_Starter/si-stir-hebat sesuai AGENTS.md. Penataan repository perlu diselesaikan sebelum publikasi. Tabel contoh todos tercatat terpisah dan tidak memiliki alur UI sekolah.

Tanggal sekolah masih memakai Asia/Jakarta pada frontend dan migration. Konfirmasi zona waktu operasional sekolah diperlukan sebelum mengubah aturan tanggal/tenggat bersama-sama. Skema asesmen tetap sementara sesuai keputusan pengguna. Modul dokumen, kehadiran guru, fitur perkembangan siswa dan UAT masih perlu dituntaskan berdasarkan acuan resmi.
14 November 2026: Repo https://github.com/mariomagfii-sys/si-stir-hebat berhasil di-clone ke D:/code/SI_STIR_HEBAT_Starter/github-release. Paket rilis 108 berkas diunggah ke main, commit 86fe0e79224d4d607afdd30cfeb633a24b8a5fa9; git ls-remote cocok dengan HEAD lokal. Tidak menyertakan .env.local, .env, .vercel atau lampiran pribadi. CI GitHub belum diverifikasi (konektor memberi 404; Git CLI berhasil). Deployment Vercel dan aktivasi admin tetap belum selesai.
14 November 2026: Login Vercel berhasil melalui device authorization; proyek si-stir-hebat dibuat dan deployment CLI produksi READY (dpl_DHXi8ktz5chWQQji1wTJQdrLMjEk). URL publik https://si-stir-hebat-blue.vercel.app. Empat route HTTP 200; browser headless mobile memverifikasi login nyata (bukan demo), redirect /jadwal tanpa sesi, tidak meluber dan tidak ada pageerror. Hanya akses anonim, tidak membaca data pribadi. Node24 diselaraskan package/lock (push b07638d). Panduan produksi/aktivasi diunggah commit36f8c53. GitHub auto-deploy belum terhubung karena Vercel meminta GitHub Login Connection. Site URL/redirect Auth, aktivasi admin, login/email nyata dan UAT tetap belum terverifikasi. Tujuan PRD penuh belum selesai.

## Ringkasan sekolah dashboard ï¿½ 14 November 2026

PRD 5.1 ditindaklanjuti: admin/kepala sekolah melihat jumlah siswa, guru dan kelas berstatus aktif. Query HEAD dengan exact count, bukan mengunduh baris atau menghitung halaman; RLS tabel tetap berlaku. Label menjelaskan kelas mencakup seluruh tahun ajaran dan siswa berasal dari registri, bukan enrollment. Nol, belum dimuat dan gagal dibedakan. Partial failure mempertahankan jumlah yang berhasil; retry tersedia. Tidak ada query ringkasan pada guru/siswa/wali/pending. Tautan menuju data master terkait tersedia.

npm run check Node24 lulus 101 tes, lint, tipe dan build. Sepuluh tes browser khusus ringkasan desktop/ponsel lulus, meliputi jumlah1205, nol, missing count, retry dan pembatasan permintaan peran. Tidak ada perubahan database atau pembacaan data pribadi. Commit eb1d4f8 sudah dipush; deployment produksi baru sedang diverifikasi. Dashboard PRD masih perlu progres supervisi, administrasi, aktivitas/notifikasi dan ringkasan spesifik guru/keluarga; jangan menganggap bagian5.1 selesai penuh.
Deployment ringkasan dashboard terverifikasi READY; smoke produksi anonim lulus ulang. Tidak menguji akun admin nyata.


## Optimasi font PDF - 14 November 2026

Build hanya menyertakan Roboto normal dan tebal untuk rekap akademik, tetap dimuat saat ekspor. Chunk font 855,16 ke 419,57 KB (gzip 465,45 ke 225,08 KB); mesin PDF masih 790,69 KB. Node 24 `npm run check` lulus (104 tes, lint, typecheck, build); tes unduhan desktop dan ponsel lulus dengan API tiruan. Varian italic perlu ditambahkan jika kelak digunakan. UAT sekolah belum dilakukan.


## Fondasi komunikasi lokal - 14 November 2026

Migration 20261114083827 dan API pesan/penerima dibuat dengan RLS, penugasan dan relasi aktif, serta pesan append-only. Tes PGlite mencakup peran dan pencabutan; npm run check Node 24 lulus 108 tes, lint, tipe, build. Migration belum diterapkan: riwayat hosted belum mencatat student_habits yang lebih awal. UI, advisor dan UAT belum dilakukan.

## Stabilisasi suite browser dan checklist UAT - 14 November 2026 (Kilo/QA)

- Selector alert dipersempit ke `getByRole('alert').filter({ hasText })` di seluruh suite agar tidak ambigu ketika beberapa `alert` tampil bersamaan.
- Uji impor XLSX desktop memakai `setInputFiles` langsung (bukan dialog file natif) dan batas 15 detik untuk preview yang diproses di worker.
- `vite.config.ts` menonaktifkan watcher HMR hanya ketika `VITE_TEST_NO_WATCH=1` (disetel oleh `playwright.config.ts`); ini menghentikan crash `EBUSY` yang sebelumnya mematikan server tes dan memicu `ERR_CONNECTION_REFUSED` massal.
- Ditambahkan 7 skenario penolakan lintas peran: `/tautan-akun` untuk guru/siswa/wali/pending dan `/supervisi` untuk siswa/wali/pending; dipastikan pesan penolakan tampil dan tidak ada tombol aksi.
- `docs/UAT_CHECKLIST.md` dibuat sebagai daftar periksa siap isi per peran (langkah, hasil diharapkan, L/G, catatan), melengkapi `PANDUAN_UAT.md`.
- Verifikasi: tiga run browser penuh berturut-turut 194/194 lulus (desktop + ponsel) dengan API tiruan; `npm run check` Node 24 lulus 109 tes, lint, typecheck, build (peringatan chunk PDF tetap).
- Batas: belum diuji dengan akun sekolah nyata, email pemulihan, maupun UI komunikasi (belum ada). Tidak ada perubahan migration atau data hosted.

## Cakupan modul materi/tugas - 14 November 2026 (Kilo/QA)

- Menambah dua skenario browser: siswa membaca materi terbit tanpa kontrol penulisan, dan guru membuat draf tugas dengan penugasan, judul, instruksi, serta tenggat.
- Memastikan muatan POST memuat `kind: task`, `assignment_id`, `due_on`, dan pesan "Draf tugas tersimpan." setelah respons terkonfirmasi.
- Verifikasi: `npm run lint` bersih; suite penuh 198/198 lulus pada desktop dan ponsel (API tiruan). Belum diuji dengan akun sekolah nyata.

## Cakupan modul ajar - 14 November 2026 (Kilo/QA)

- Menambah skenario guru menyimpan draf modul ajar: pemilihan penugasan aktif, judul, tujuan, dan kegiatan; memastikan muatan POST serta pesan "Modul ajar tersimpan." dan modul tampil di daftar.
- Verifikasi: `npm run lint` bersih; suite penuh 200/200 lulus pada desktop dan ponsel (API tiruan). Belum diuji dengan akun sekolah nyata.

## Pengajuan modul ajar dan matriks cakupan - 14 November 2026 (Kilo/QA)

- Menambah skenario guru mengajukan draf modul: PATCH `status: submitted` dengan revisi, pesan "Status modul diperbarui." dan status daftar menjadi "Diajukan".
- Menambah `docs/QA_COVERAGE.md`: matriks modul terhadap skenario yang sudah ada dan yang belum tercakup.
- Verifikasi: skenario baru lulus terarah di desktop (1/1). Suite penuh **belum** diverifikasi ulang: run terakhir (log `test-results-kilo-8.log`) baru mencapai 36/202 saat sesi dijeda. `npm run lint` bersih. UAT akun sekolah tetap terbuka.

## CI, bundel, dan operasional - 15 November 2026 (Kilo/QA)

- `scripts/check-migrations.mjs` dan `scripts/check-ci.mjs` dirangkai ke depan `npm run check`; `.github/pull_request_template.md` dan `docs/CI_RUNBOOK.md` ditambahkan. Uji negatif menolak timestamp ganda, nama salah, dan urutan `komunikasi` sebelum `student_habits`.
- `scripts/smoke-production.mjs` memeriksa beranda, fallback SPA, akun demo di bundel, dan penolakan REST anonim. Terhadap build lokal: 3/4 lulus; pemeriksaan akun demo gagal sesuai temuan S-01. `docs/RUNBOOK_OPERASIONAL.md` memuat rollback, checklist Site URL/redirect, dan monitoring.
- `docs/L11_BUNDEL_CACHE.md` mencatat muatan awal 758,72 kB (gzip 213,92 kB); chunk PDF dan XLSX tetap lazy. Usulan header cache belum diterapkan.
- Batas: `npm run check` penuh belum lulus karena `src/app/Password.tsx` sedang disunting agen lain (`TS6133`, `TS2304`). Run GitHub Actions, branch protection, smoke produksi, dan monitoring belum diverifikasi.

## L14 - suite penuh 202/202 - 15 November 2026 (Kilo/QA)

- `npm run test:browser` penuh (desktop + ponsel, API tiruan, port 5191) selesai 202/202 lulus dalam 7,2 menit. Log: `docs/qa-logs/test-browser-2026-11-15-202-lulus.log`.
- `docs/QA_COVERAGE.md` diperbarui: 202 skenario, rute `/komunikasi` dicatat belum ada tes.
- `npm run check` penuh **belum** lulus pada 15 November 2026 karena `src/features/komunikasi/Communication.tsx` (sedang disunting) gagal typecheck. Gerbang CI Kilo (`check-migrations`, `check-ci`) lulus.

## Pengamanan demo dan penyelesaian UI Komunikasi â€” 15 November 2026

- Mode demo digate ketat pada `import.meta.env.DEV === true` dan Supabase yang tidak terkonfigurasi. Untuk build, Vite mengganti modul demo dengan stub; `scripts/check-demo-bundle.mjs` memeriksa seluruh JS hasil build. Tidak ada perubahan akun, Auth hosted, atau data.
- Alur kirim Komunikasi mempertahankan ID dan isi pesan ketika respons belum diketahui, mencari ID sebelum retry, lalu memverifikasi hasil setelah galat. Daftar pesan memuat 25 baris per halaman dengan sentinel pagination agar tidak melewatkan baris batas.
- Tes ditambah untuk gate demo, pagination API, respons kirim hilang, dan halaman pesan UI. Tidak ada migration atau perubahan hosted.
- Verifikasi: `npm run check` lulus (116 tes unit/database, lint, typecheck, pemeriksaan migration/CI, build dan bundel tanpa akun demo). Tes Komunikasi browser lulus 2/2 per desktop dan ponsel.
- Suite browser penuh: 212/216 lulus; empat kegagalan terjadi saat `browserContext.close` karena berkas trace/zip tidak ditemukan (`ENOENT`). Keempat skenario lulus pada pengulangan terarah. Suite penuh belum berstatus lulus.
- Belum: migration `student_habits` dan `komunikasi` hosted, keputusan RBAC/retensi/pengawasan Komunikasi, smoke produksi, CI hosted, dan UAT akun sekolah. Jangan commit/push/deploy sebelum worktree bersama ditinjau dan perubahan agen lain dipisahkan.

# Backend security, dokumen, notifikasi, kebiasaan â€” 20 November 2026 (Codex)

- Memperketat konfigurasi Supabase produksi menjadi URL sah + publishable key `sb_publishable_...`; fixture akun demo dipindah ke `tests/fixtures/` dan production stub diuji tanpa storage session.
- Menambahkan migration lokal berurutan untuk drop `todos` dengan guard baris kosong, policy feedback author-only drafts, versi/review/event dokumen, rekap mingguan kebiasaan, fanout notifikasi generik, serta katalog kebiasaan dan pembersihan metadata validasi. Tidak menyunting 23 migration hosted.
- Migration dokumen menutup persetujuan oleh administrator; hanya kepala sekolah dapat menyetujui/menolak. Versi, review, dan event audit mengikuti RLS dokumen. API daftar, versi, tinjauan, dan status berbasis revision guard ditambahkan.
- Migration notifikasi menghasilkan judul/isi generik, referensi domain, dan event key dedupe untuk pengumuman terbit, dokumen/modul ajar, supervisi, laporan absen, serta pesan komunikasi. API menambah tipe/reference fields.
- Rekap kebiasaan mengeluarkan jumlah hari diharapkan, terisi, belum diisi, serta jumlah indikator true; tidak membuat ranking. Helper membatasi data ke siswa sendiri, anak tertaut, atau kelas tugas.
- Bukti lokal: Node v24.22.3, `npm test` 129/129; `node scripts/check-migrations.mjs` 35 migration OK; `node --test tests/database.test.mjs` 70/70. Build negatif Vite tanpa env berhenti (exit 1). Full `npm run check` belum hijau karena typecheck menunggu Qoder menambah label kategori UI.
- Hosted read-only: 23 versi hosted = 23 awal lokal, todos count 0; Security Advisor memiliki satu WARN perlindungan kata sandi bocor. Tidak ada migration atau setting hosted diubah.
- Belum: migration hosted, API upload dokumen end-to-end, RPC absensi guru, RPC dashboard/performance EXPLAIN, retensi diuji lokal, deploy, smoke production, merge. D7 dipertahankan; konflik X6 dicatat di `AI_COORDINATION.md`.
## Codex backend â€” 20 November 2026 (pembaruan)

- PGlite dan API backend: `todos` guard/drop, draft-feedback owner-only, tests Storage supervision evidence, dokumen sekolah kategori/versi/review/audit + pembersihan draft tanpa file, fanout notifikasi, teacher attendance dengan idempotensi dan koreksi disetujui kepala sekolah, katalog 7 kebiasaan + rekap mingguan. Retensi diuji dengan Auth sintetis.
- Tes penuh Node v24.22.3: 134/134 lulus, lint dan typecheck lulus. `npm run check` tidak mencapai status hijau karena Vite gagal menulis ke `dist/` di sandbox; eskalasi ditolak auto-review. Build output tidak dihapus manual. Probe di root lulus, probe di `dist/` gagal.
- Migration: 37 lokal, 23 hosted; checker lulus. Tidak ada hosted write. Advisor read-only masih melaporkan satu WARN leaked-password protection, sehingga penerapan ditahan.
- X6 guardian absence tetap review-only sesuai D7; operasi otomatis mengubah absensi siswa sengaja belum dibuat. X9 belum memverifikasi FK audit historis atau Supabase lokal.
- Tersisa: X8 indeks/EXPLAIN/dashboard RPC, X10 deploy, X11 review/merge. Tidak ada commit atau perubahan UI oleh Codex.
## X8 dashboard overview â€” 20 November 2026 (pembaruan)

- Menambahkan migration `20261120044500_dashboard_overview` dan API `getDashboardOverview(client: SupabaseClient): Promise<DashboardOverview>`.
- EXPLAIN ANALYZE PGlite atas dataset 50.000 modul sintetis mengukur submitted 8,46 ms â†’ 1,24 ms dan returned 7,08 ms â†’ 1,53 ms setelah partial index; stage=4 index lebih lambat (12,95 â†’ 17,98 ms) dan active students tetap seq scan. Migration hanya memuat dua partial index status modul. Ini bukti simulasi lokal, bukan benchmark hosted.
- RPC satu panggilan mengembalikan profil, hitungan registri aktif, supervisi tahap 1â€“4, modul submitted/returned, jumlah pengumuman dan tiga item terbit terbaru. Hanya administrator/kepala sekolah; PGlite menguji role tersebut dan penolakan guru/anon.
- `npm test` Node v24.22.3: 137/137 lulus; migration checker: 38 file berurutan; database+API terfokus 75/75; typecheck dan lint lulus.
- UI belum dialihkan ke RPC (permintaan lintas AI ke Qoder dicatat di `docs/AI_COORDINATION.md`). Indeks parsial tetap menunggu EXPLAIN ANALYZE atas dataset sintetis representatif. Tidak ada hosted write.

## X6 laporan wali menulis absensi setelah konfirmasi â€” 20 November 2026 (Codex)

- Migration lokal `20261120050000_guardian_absence_attendance` memperbarui RPC review laporan: keputusan `confirmed` dari guru kelas yang berwenang mencatat status `absent` dengan alasan laporan melalui `school_private.save_attendance()`. Perubahan absensi, revision/audit, dan konfirmasi laporan berada dalam transaksi yang sama.
- RPC mensyaratkan tepat satu sesi dan catatan roster untuk siswa/tanggal tersebut. Jika tidak ada atau ambigu, error SQLSTATE `55000` membatalkan transaksi dan laporan tetap pending; `needs_revision` tidak mengubah absensi. Pengiriman laporan wali sendiri tetap tidak mengubah absensi.
- PGlite database test lulus 73/73, mencakup konfirmasi dan audit, stale revision, invalid decision, roster historis yang tidak tersedia (rollback), serta pencabutan relasi wali. Check penuh terbaru ada pada entri X0 di bawah.
- Tidak ada migration hosted yang diterapkan. Qoder menambahkan UI penanganan SQLSTATE `55000`; tes alur ini lulus desktop/mobile dalam suite penuh.

## X0 dan X11 gerbang lokal â€” 20 November 2026 (Codex)

- Setelah integrasi Dashboard ke `dashboard_overview`, penanganan UI laporan wali `55000`, dan indikator pemotongan opsi 1000/200 dari Qoder, `npm run check` Node v24.22.3 kembali lulus EXIT 0: migration 39, check-ci, lint, typecheck, 137/137 tes, build 1.781 modul, audit 26 berkas JS tanpa akun demo.
- Build memakai URL/key Supabase sintetis proses-lokal; tsbuildinfo dialihkan sementara ke `%TEMP%`, lalu dua tsconfig dipulihkan byte-identik. `dist/` diperbarui dengan izin pemilik. Peringatan chunk PDF 790,69 kB masih ada.
- Suite browser penuh terkini lulus **304/304** pada desktop/mobile di port 5377 (12,7 menit); log persisten `%TEMP%\\qoder-qa-2026-11-18\\browser-full-55000-5377.log` berakhir EXIT 0. Tes mencakup dashboard RPC, UI error X6, dan opsi referensi terpotong.
- Branch `ai/qoder-palette-d8` tetap memuat perubahan bersama staged/unstaged; tidak commit, merge, push, deploy, atau mengubah hosted.

## Pemulihan commit UI â€” 20 November 2026 (Qoder)

- Commit Q15 `80e36e7` (pesan `55000` laporan wali), `6d1082e` (re-audit + `QA_COVERAGE` 304/304), lalu pemeriksaan konsistensi impor relatif atas HEAD.
- Ditemukan HEAD merujuk berkas yang belum pernah di-commit. Dipulihkan: `src/components/ui/ReferenceNotice.tsx` (`b0e3600`), `src/lib/auth-context.tsx` dan `src/lib/dashboard-overview.ts` (`2ce1ca2`).
- Sisa impor yang belum ada di HEAD: `src/features/student-habits/api/index.ts` dan `src/features/parents/api/absence-reports.ts` (milik Codex, untracked). Upaya menyertakannya tanpa mengubah isi ditolak auto-review, jadi menunggu Codex (tercatat di `AI_COORDINATION.md`).
- Wiring tertahan di working tree: `src/app/App.tsx` (rute lazy `/komunikasi`, `/kebiasaan`, `/notifikasi`, `/laporan-ketidakhadiran`), `Communication.tsx`, `NotificationCenter.tsx`, `tests/browser/communication.spec.ts`, `tests/browser/notifications.spec.ts`; menunggu `src/features/notifications/api/index.ts` (X5).
- Tidak ada perubahan migration, API, atau hosted. Tidak ada klaim branch hijau: working tree tetap sesuai bukti `REAUDIT_HANDOFF_2026-11-20.md` (suite 304/304 port 5377; check EXIT 0 137/137).

## Suite 306/306 dan tes pemotongan Data sekolah â€” 20 November 2026 (Qoder)

- `tests/browser/app.spec.ts`: tes baru `master data announces a truncated reference list instead of hiding it` â€” 1001 referensi siswa memunculkan status `ReferenceNotice` dan tombol tambah relasi tetap aktif; sebelumnya hanya opsi asesmen yang teruji.
- Run port 5381 menemukan satu kegagalan: assertion `Peran sekolah Anda belum ditetapkan.` melihat fallback Suspense `Memuat halamanâ€¦` lebih dari 5 detik pada chunk rute lazy yang masih dingin. Assertion diberi batas 15 detik; uji tunggal lulus 2/2 pada port dingin 5382.
- Bukti akhir: suite penuh **306/306 lulus** port 5383 (7,3 menit, log `%TEMP%\qoder-qa-2026-11-18\browser-full-5383.log`); `npm run check` EXIT 0 (39 migration, CI, lint, typecheck, 137/137, build 1.781 modul, 26 JS; log `...\check-5383.log`).
- Tidak ada perubahan migration, API, hosted, atau klaim UAT.

## Suite 308/308 dan tes arsip materi â€” 20 November 2026 (Qoder)

- `tests/browser/app.spec.ts`: tes baru `teacher archives a published material after confirmation` â€” materi terbit diarsipkan lewat dialog konfirmasi; tidak ada PATCH sebelum "Ya, lanjutkan", badan PATCH `{status:'archived'}` dengan `revision=eq.2`, pesan "Materi diarsipkan.", baris berubah menjadi "Diarsipkan", dan tombol arsip hilang. Menutup kesenjangan "arsip oleh guru" di matriks QA.
- Bukti: suite penuh **308/308 lulus** port 5387 (7,0 menit, EXIT 0; log `%TEMP%\qoder-qa-2026-11-18\browser-full-5387.log`); `npm run check` Node v24.22.3 EXIT 0 (39 migration, CI, lint, typecheck, 137/137, build 1.781 modul, 26 JS tanpa akun demo; log `...\check-5387.log`).
- Tidak ada perubahan migration, API, hosted, atau klaim UAT. Angka kanonik browser kini 308/308; 306/306 port 5383 tetap tercatat sebagai riwayat.

## Suite 310/310 dan tes persetujuan/pengarsipan modul ajar â€” 20 November 2026 (Qoder)

- `tests/browser/app.spec.ts`: tes baru `principal approves then archives a submitted teaching module` â€” kepala sekolah menyetujui modul berstatus `submitted` dengan catatan pemeriksaan, lalu mengarsipkan modul yang sudah `approved`. PATCH disertai `revision=eq.3`; badan pertama `{status:'approved', review_note:'Lengkap dan sesuai.'}`, badan kedua `{status:'archived'}`; baris berubah menjadi "Disetujui" lalu "Diarsipkan". Menutup kesenjangan persetujuan/arsip modul ajar di matriks QA.
- Run port 5389 tidak valid: server Vite kehabisan heap (`FATAL ERROR: Committing semi space failed`) pada tes ke-43 sehingga sisa tes gagal `ERR_CONNECTION_REFUSED` (42/310). Run diulang dengan `NODE_OPTIONS=--max-old-space-size=4096 --max-semi-space-size=64` di port 5391 dan bersih.
- Bukti akhir: suite penuh **310/310 lulus** port 5391 (7,8 menit, EXIT 0; log `%TEMP%\qoder-qa-2026-11-18\browser-full-5391.log`); `npm run check` Node v24.22.3 EXIT 0 (39 migration, CI, lint, typecheck, 137/137, build 1.781 modul, audit bundel tanpa akun demo; log `...\check-5391.log`).
- Tidak ada perubahan migration, API, hosted, atau klaim UAT. Angka kanonik browser kini 310/310; 308/308 port 5387 dan 306/306 port 5383 tetap tercatat sebagai riwayat.

## Suite 312/312 dan pemilih anak untuk wali â€” 20 November 2026 (Qoder)

- `tests/browser/habits.spec.ts`: tes baru `parent with two linked children picks one child and saves for that child only` â€” wali dengan dua anak melihat pilihan "Pilih murid" berisi dua anak, berganti ke anak kedua (riwayat anak pertama hilang dari daftar), menandai satu kebiasaan, lalu menyimpan. Payload POST hanya berisi `student_id` anak yang dipilih; status berubah menjadi "sudah diisi" setelah muat ulang; tidak ada luapan horizontal di desktop maupun ponsel. Menutup kesenjangan "form wali dengan beberapa anak" di matriks QA dan menguatkan D6 (wali hanya mengisi untuk anak tertaut).
- `tests/browser/app.spec.ts`: tes impor XLSX dibuat tahan terhadap muat ulang Vite. Parser adalah chunk yang dimuat malas; pre-bundling Vite pada unggahan pertama dapat memuat ulang halaman dan menghapus berkas terpilih, sehingga pratinjau tidak pernah tampil (satu kegagalan di run port 5397). Pemilihan berkas kini diulang lewat `expect(...).toPass` sampai pratinjau benar-benar tampil; assertion isi tabel, larangan mutasi sebelum konfirmasi, dan hasil akhir tidak dilonggarkan.
- Insiden lingkungan (bukan kegagalan aplikasi): run port 5395 tidak valid karena `node_modules` dikosongkan proses instalasi agen lain di tengah run (galat `Cannot find package '@playwright/test'`, 189 tes tidak berjalan). Run diulang setelah dependensi pulih.
- Bukti akhir: suite penuh **312/312 lulus** port 5401 (8,8 menit, EXIT 0; log `%TEMP%\qoder-qa-2026-11-18\browser-full-5401.log`); `npm run check` Node v24.22.3 EXIT 0 (39 migration, CI, lint, typecheck, 137/137, build 1.781 modul, 26 JS tanpa akun demo; log `...\check-5401.log`).
- Tidak ada perubahan migration, API, hosted, atau klaim UAT. Angka kanonik browser kini 312/312; 310/310 port 5391, 308/308 port 5387, dan 306/306 port 5383 tetap tercatat sebagai riwayat.
- Koreksi angka usang (hanya dokumen): `AGENTS.md` bagian "Canonical counts" masih menyebut 127/127, 32 migration, dan 228/228 port 5358; kini menunjuk pasangan kanonik (137/137, 39 migration lokal dengan 16 belum hosted, 312/312 port 5401, log `check-5401.log`/`browser-full-5401.log`) dan menyebut angka lama sebagai riwayat. Daftar migration lokal di baris di atasnya juga diperbarui dari 32/sembilan belum hosted menjadi 39/16 belum hosted. `docs/AI_COORDINATION.md` mendapat catatan supersede di bagian Qoder karena catatan Codex masih menyebut 306/306 port 5383 sebagai angka terbaru, dan `docs/DELIVERY_GATE_2026-11-20.md` mendapat catatan status bahwa angka eksekusinya berasal dari run saat dokumen dibuat. Tidak ada perubahan kode, tes, migration, atau hosted; tidak ada run ulang karena hanya teks dokumen.
- Tidak ada berkas yang di-commit pada langkah koreksi angka ini: `AGENTS.md`, `AI_COORDINATION.md`, `IMPLEMENTATION_LOG.md`, dan `DELIVERY_GATE_2026-11-20.md` semuanya berada di aliran kerja bersama yang indeksnya berisi berkas staged milik agen lain (`.github/pull_request_template.md`, `package.json`, `playwright.config.ts`, `scripts/*.mjs`, `vite.config.ts`); commit terfokus tidak dapat diambil tanpa menyapu pekerjaan mereka. Dokumen akan ikut ter-commit saat Codex merge.
- Dua kesenjangan QA yang tidak bisa ditutup dari sisi UI dicatat sebagai "Permintaan Lintas AI" (Qoder â†’ Codex): badge jumlah notifikasi belum dibaca di navigasi (butuh sumber data lintas halaman; `NotificationCenter` hanya menghitung 25 baris halaman aktif) dan ringkasan dashboard guru/wali (`dashboard_overview()` hanya untuk administrator/kepala sekolah). Tidak ada RPC, migration, atau halaman baru ditambahkan.
- Verifikasi ulang fokus 20 November 2026: `tests/browser/habits.spec.ts` pada working tree bersama (sesudah perubahan backend Codex) 10/10 lulus desktop + ponsel dalam 43,6 detik, EXIT 0, port 5411 (log `%TEMP%\qoder-qa-2026-11-18\habits-5411.log`). Bukti fokus. Suite penuh terbaru sesudah perubahan berikutnya lulus 402/402; lihat entri paling atas dokumen.
- `AGENTS.md` belum di-commit oleh Qoder: berkas itu memuat bagian "Owner override terbaru â€” 20 November 2026" yang belum di-commit milik Codex dan menyebut 35 migration lokal/12 belum hosted; angka itu kini 39/16 sehingga perlu diperbarui Codex saat ia meng-commit bagiannya. Perubahan Qoder hanya pada dua baris "Current handoff baseline" (daftar migration dan canonical counts).
- Rekap minggu ini di 7 Kebiasaan (UI, 20 November 2026): `StudentHabits.tsx` memakai RPC Codex `habit_weekly_summary` yang sudah ada tetapi belum terpakai UI. Bagian "Rekap minggu ini" menampilkan `days_filled`/`days_expected`/`days_missing` dan hitungan per indikator untuk murid terpilih, dengan kalimat "belum diisi, bukan berarti tidak dilakukan" dan "bukan peringkat", tanpa angka lain antarmurid. Status loading, galat dengan tombol coba lagi, dan kosong tersedia. `weekStartOf` menghitung Senin dari `schoolToday()`. Tidak ada perubahan API, migration, atau RPC; kontrak tetap milik Codex.
- Tes rekap habits historical: `tests/browser/habits.spec.ts` menambah tiruan; suite penuh terbaru setelah skenario ini lulus 402/402 (lihat entri paling atas).
- `npm run check` Node v24.22.3 EXIT 0 pada working tree ini: `Migration OK: 39 berkas`, lint, typecheck, 137/137 tes unit/database, build 1.781 modul, `Bundel produksi OK: 26 berkas JavaScript tanpa akun demo` (log `%TEMP%\qoder-qa-2026-11-18\check-habits-weekly.log`). Run suite penuh ulang pada port 5415 dihentikan sebelum selesai karena laju ~3 dtk/tes (dugaan beban dari proses lain di worktree bersama); angka kanonik browser tetap 312/312 port 5401 dan tidak diklaim ulang.
- Commit Qoder `6d7563c` (branch `ai/qoder-palette-d8`) memuat `StudentHabits.tsx`, `habits.spec.ts`, `QA_COVERAGE.md`, `PROJECT_STATUS.md`, `IMPLEMENTATION_LOG.md`, dan `AI_COORDINATION.md` lewat `git commit --only`; indeks staged milik agen lain tidak disentuh. `docs/DELIVERY_GATE_2026-11-20.md` masih untracked sehingga belum bisa ikut lewat `--only`.
- Kepatuhan R-02 diperbaiki (20 November 2026): legenda formulir di `StudentHabits.tsx` memakai em dash (`Catatan harian â€” ...`), satu-satunya karakter em dash di `src` dan bertentangan dengan klaim gate. Diganti titik dua (`Catatan harian: ...`); enam assertion `habits.spec.ts` disesuaikan. `grep` em dash pada `src` kini kosong. Verifikasi ulang: 10/10 desktop + ponsel, 1,3 menit, EXIT 0, port 5417 (log `%TEMP%\qoder-qa-2026-11-18\habits-5417.log`).

## Codex â€” Gerbang demo dan kontrak backend â€” 20 November 2026

- `docs/API_CONTRACT.md` merangkum tipe dan fungsi komunikasi, dokumen, notifikasi, laporan absensi wali, absensi guru, 7 Kebiasaan, serta `dashboard_overview()`.
- `src/lib/config.ts` mengekspor `isConfigured` dan `demoAllowed` sebagai sumber tunggal runtime. Build produksi mewajibkan URL Supabase dan key `sb_publishable_`; demo dimuat dinamis hanya saat `import.meta.env.DEV`. Fixture akun tinggal di `tests/fixtures/`.
- `prebuild` menjalankan `scripts/guard-env.mjs`; `CI_FIXTURE=1` hanya diterima di GitHub Actions dengan konfigurasi sintetis tetap. Audit bundel memeriksa asset produksi terhadap ID/email/password fixture.
- Bukti: `npm run check` Node v24.22.3 EXIT 0, **140/140 tes**, 38 migration, workflow CI/lint/typecheck, build 1.787 modul, audit 29 JavaScript tanpa akun demo. `dist/` dibangun ulang memakai konfigurasi sintetis proses-lokal. Peringatan chunk PDF 790,69 kB.
- Migration `20261114083828_security_foundation.sql` menggabungkan guard/drop `todos`, policy draft author-only, FK `profile_id ON DELETE SET NULL`, dan review RPC `habit_students()`. Tes PGlite penuh pada tree ini lulus melalui gate tersebut. Tidak ada migration hosted diterapkan.
- Browser run terakhir 308/312; empat kegagalan sebelumnya (tiga trace ENOENT, satu `ERR_INSUFFICIENT_RESOURCES`) perlu suite ulang sebelum integrasi. Hosted tertahan WARN `auth_leaked_password_protection`; tidak ada deploy atau merge.

## Codex phase 0 audit - 21 November 2026

- Branch ai/codex-foundation; S0 contract, demoAllowed/isConfigured exports, and seven reference documents are present. Dependencies already exist; npm ci was unnecessary.
- Node v24.22.3. npm run check EXIT 0: migration/CI guards, lint, typecheck, unit and database tests passed; isolated build transformed 1,789 modules and 30 JavaScript bundles had no demo accounts. See AGENTS.md for the canonical test count.
- check uses build:isolated and dist-check; release build still targets dist. Isolation avoids Vite EPERM while clearing dist/assets. PDF chunk warning remains at 790.69 kB.
- S1 passed locally. S2 still needs per-item audit; S3 awaits a clean Security Advisor. No hosted write, merge, or deploy.
- Browser suite full on Node 24, port 5191, one worker: every reported case returned `ok` on desktop and mobile, including the new module pagination cases. The runner hung during cleanup after the final case; CPU stayed unchanged for 20 seconds, then Ctrl+C ended the session with exit 1. This is not a clean suite exit. APIs were mocked; this is not school-account UAT.
- Hosted read-only recheck: 23 migrations remain through `20261113074045`; Security Advisor still reports one external WARN, `auth_leaked_password_protection`. No hosted changes were made; Fase 4 awaits the owner checklist step to enable leaked-password protection and a clean Advisor result.

## Audit Codex Fase 3 backend - 21 November 2026

- S0 API contract diperiksa terhadap API TypeScript komunikasi, dokumen, notifikasi, laporan wali, absensi guru, kebiasaan, dan dashboard; semua modul menyediakan pagination sentinel `hasMore` sesuai kontrak. Kontrak diperjelas dengan pembatasan role dokumen dan absensi guru dari keputusan fitur fondasi.
- Migration lokal menyediakan habits + rekap mingguan, komunikasi, dokumen/kategori/versi/review + bucket privat, notifikasi/event fanout, laporan wali + konfirmasi absensi, check-in/out guru dengan `request_id` idempoten, dan RPC dashboard. `dashboard_overview()` memiliki dua partial index untuk status modul submitted/returned; migration mencatat hasil EXPLAIN ANALYZE PGlite atas 50.000 baris sintetis.
- Bukti PGlite yang diperiksa: school-documents memeriksa bucket privat, limit 10 MiB/MIME dan akses pemilik/kepala/admin; supervision-evidence memeriksa principal, guru pemilik sebelum/sesudah publikasi, guru lain, siswa, wali, pending, anonim, dan path cacat; absensi guru memeriksa retry idempoten, privasi, serta hanya principal menyetujui koreksi. Ini simulasi lokal, bukan validasi Supabase hosted.
- Verifikasi browser penuh pada port 5191 melaporkan setiap case `ok`, termasuk pagination baru, namun runner macet saat cleanup; CPU tak berubah 20 detik dan dihentikan dengan Ctrl+C (exit 1). Tidak dihitung sebagai suite penuh bersih. API browser memakai mock.
- `git diff --check` pada `docs/DECISIONS.md` dan `docs/API_CONTRACT.md` bersih. Tidak menjalankan ulang `npm run check` karena perubahan sesi ini hanya dokumentasi; hasil Node 24 terdahulu dicatat di AGENTS.md.
- Fase 4 belum boleh berjalan: hosted masih 23 migration sampai `20261113074045`, dan Security Advisor memiliki WARN `auth_leaked_password_protection`. Backup/restore teruji, Supabase lokal, serta `check:supabase` juga belum tersedia/terbukti; tidak ada hosted write, merge, atau deploy.

## Verifikasi Codex lanjutan - 21 November 2026

- `npm run check` Node v24.22.3 dijalankan ulang berurutan: EXIT 0; 38 migration, workflow CI, lint, typecheck, dan 140/140 tes lulus; build isolated mentransformasi 1.789 modul dan audit menyatakan 30 JavaScript tanpa akun demo. Peringatan chunk PDF 790,69 kB.
- Browser full run bersih kemudian lulus **420/420**, EXIT 0 dalam 7,1 menit (port 5191, satu worker, trace off, desktop+mobile). Untuk menghindari Vite child yang tertinggal saat cleanup pada konfigurasi default, Vite dijalankan terpisah dan direuse oleh config sementara. Ringkasan terminal dicatat di `docs/logs/browser-full-2026-11-21-port5191-reuse.log`; API seluruhnya mock, bukan UAT sekolah. Ini supersedes percobaan pertama yang tidak clean.
- `AGENTS.md` diselaraskan dengan keputusan owner 20 November: Next.js dilarang; baseline hosted/lokal diperbarui ke 23/38 migration dan gerbang hosted aktif. `docs/PROJECT_STATUS.md` menandai 402/402 sebagai historis, bukan verifikasi tree terkini. Release build `dist/` kemudian berhasil pada 21 November (lihat pembaruan build release di atas).
- Git lokal berada pada `ai/codex-foundation` tanpa remote terkonfigurasi; 163 path memiliki perubahan staged/unstaged/untracked campuran lintas pekerjaan. GitHub read-only mengonfirmasi repo `mariomagfii-sys/si-stir-hebat` dengan default branch `main`, tanpa branch remote `ai/codex-foundation` atau PR terbuka. Tidak aman menyapu perubahan campuran ke commit/merge.
- Tidak ada perubahan migration hosted, merge, push, atau deploy. Fase 4 tertahan oleh Advisor WARN `auth_leaked_password_protection`, DNS `ENOTFOUND` pada `check:supabase`, serta belum adanya bukti Supabase lokal dan backup/restore teruji. Konektor Supabase yang tersedia tidak menyediakan penulis Auth settings; checklist owner meminta pengaktifan perlindungan kata sandi bocor.
## Verifikasi fase fondasi - 21 November 2026

- `npm run check` Node v24.22.3 EXIT 0: 38 migration, workflow CI, lint, typecheck, **140/140** tes unit/database, build terisolasi 1.789 modul, audit **30 JavaScript tanpa akun demo**. Log `docs/logs/check-2026-11-21-node24.log`; peringatan chunk PDF 790,69 kB. Output `dist-check`; release `dist` tidak diubah.
- `npm run check:supabase` read-only tidak mencapai endpoint: config valid dan hostname cocok dengan project tersambung, DNS lookup gagal `ENOTFOUND`. Tidak ada nilai URL/key ditampilkan dan tidak ada baris data dibaca. Log `docs/logs/check-supabase-2026-11-20.log` merekam percobaan sebelumnya dengan pesan generik; diagnosis kode DNS dilakukan 21 Nov.
- Supabase MCP read-only 21 Nov 08:52 WIB: 23 migration hosted sampai `20261113074045`; Security Advisor satu WARN `auth_leaked_password_protection`. Tidak ada hosted write.
- Browser run pada konfigurasi default sebelumnya mencapai case terakhir tetapi runner cleanup berhenti tanpa summary; hasil tersebut digantikan oleh run bersih 420/420 yang dicatat di entri Codex berikutnya. Saat entri ini ditulis build release, merge, deploy, dan UAT tetap tertunda; build release berhasil pada pembaruan 21 November di bawah.
## Build release dan sinkronisasi bukti — 21 November 2026

- `npm run build` Node v24.22.3 EXIT 0: `prebuild` guard valid, Vite membangun 1.789 modul dan mengganti `dist/`; audit produksi memeriksa 30 bundel JavaScript tanpa akun demo. Peringatan chunk PDF 790,69 kB. Konfigurasi publishable sintetis hanya ada di environment proses dan dibersihkan sesudah perintah.
- `npm run check` tetap menjadi bukti kanonik di `docs/logs/check-2026-11-21-node24.log`: 140/140 tes unit/database, lint/typecheck dan isolated build lulus. Suite browser terbaru 420/420 EXIT 0 menggunakan Vite eksternal; rinciannya di `docs/logs/browser-full-2026-11-21-port5191-reuse.log`.
- Catatan koordinasi diselaraskan dari percobaan browser 402/420 sebelumnya ke bukti 420/420. `check:supabase` tetap tertahan sebelum HTTP Auth oleh DNS `ENOTFOUND`; ringkasan tanpa nilai konfigurasi di `docs/logs/check-supabase-diagnostic-2026-11-21.log`.
- Tidak ada migration hosted, deploy, commit, merge, atau push. Hosted tetap tertahan oleh Security Advisor WARN, `check:supabase`/DNS, Supabase lokal dan bukti backup/restore.
# Konfigurasi sekolah - migration lokal - 21 November 2026

- Ditambahkan `20261121090000_school_configuration.sql`: KKM, kebijakan retensi, katalog status absensi guru, jenis dokumen guru, kalender sekolah, dan permintaan penghapusan. Semua tabel publik ber-RLS, akses anon ditolak, grants dibatasi, dan operasi keputusan/pencatatan permintaan penghapusan memakai RPC dengan pemisahan kepala sekolah dan administrator.
- Nilai retensi mengikuti D5: bukti supervisi 2 tahun ajaran; `action='delete'` hanya nilai kebijakan untuk proses manual dan tidak memicu penghapusan otomatis. RPC `execute_deletion_request` hanya mencatat pelaksanaan; ia tidak menghapus data.
- Test PGlite dari lampiran disalin ke `tests/school-configuration.test.mjs` dengan koreksi retensi D5 dan fixture izin baca profil. Fokus 9/9 lulus. `npm run check` Node v24.22.3 EXIT 0, 149/149 tes, 39 migration, lint/typecheck, build terisolasi 1.789 modul, 30 bundel JavaScript tanpa akun demo. Peringatan chunk PDF 790,69 kB.
- Hosted tidak berubah: read-only terakhir mencatat 23 migration; kini 16 migration lokal belum hosted. Advisor masih WARN `auth_leaked_password_protection`; migration ini tidak boleh diterapkan sebelum seluruh gerbang hosted lulus.


## Revisi retensi bukti supervisi - 21 November 2026

- Pemilik menetapkan retensi bukti supervisi 1 tahun ajaran, menggantikan nilai D5 sebelumnya (2 tahun). Seed migration `20261121090000_school_configuration.sql`, assertion test PGlite, `docs/DECISIONS.md`, dan `docs/PROSEDUR_RETENSI_OPERATOR.md` telah diselaraskan.
- Hosted belum berubah; migration konfigurasi sekolah masih lokal. Tidak ada penghapusan otomatis.
## Styling bersama - 21 November 2026

- Menambahkan Tailwind CSS serta tema bersama untuk navigasi, judul, tabel, formulir, dialog, status, dan responsivitas. Rute dan otorisasi tidak diubah.
- Lint, typecheck, dan build terisolasi lulus (1.791 modul dan 30 bundel JavaScript tanpa akun demo); peringatan chunk PDF tetap ada. Peninjauan visual setiap fitur dan UAT belum dilakukan.

## Ruang peran pada dashboard - 21 November 2026

- Menambahkan pengantar ruang guru, murid, orang tua, dan kepala sekolah pada dashboard serta tautan laporan ketidakhadiran, 7 Kebiasaan, dan notifikasi sesuai izin UI yang ada. Tidak mengubah akun, peran, atau policy database.
- Lint, typecheck dan build terisolasi lulus. Pengujian visual/browser dan UAT akun nyata belum dilakukan.

## Tampilan login sesuai peran - 21 November 2026

- Halaman login menyediakan pilihan tampilan bagi Murid, Orang tua, Guru, Kepala Sekolah, dan Administrator. Sapaan, ikon, dan warna panel menyesuaikan pilihan; ruang Murid memakai ornamen ceria berbasis ikon. Pilihan ini tidak memberikan atau mengganti peran. Sesi Supabase, profil, dan pemeriksaan izin yang ada tetap menjadi sumber akses.
- Layout pemilih menyesuaikan layar kecil, mendukung fokus keyboard, status pilihan terpilih, dan pengurangan gerak. Verifikasi tes atau browser belum dijalankan untuk perubahan ini.


## Beranda interaktif dan ruang peran - 21 November 2026

- Beranda memakai hero ilustratif CSS dan ikon, pita kategori layanan bergerak, kartu masuk lima peran, dan ringkasan layanan sekolah. Struktur konten berjenjang mengikuti pendekatan portal informasi publik; aksen ilustrasi dan gerak mengikuti referensi INI LHO ITS. Palet ungu/lilac/biru/pink proyek dipertahankan.
- Kartu peran membuka /login?ruang=...; pilihan login menyesuaikan sapaan serta ilustrasi. Akses tetap ditentukan profil akun. Layout beradaptasi untuk ponsel dan animasi pita berhenti saat prefers-reduced-motion aktif.
- Pratinjau desktop Vite lokal port 5173 sudah ditinjau; tes responsif otomatis dan UAT belum dijalankan.


## Pemulihan konfigurasi Vite - 21 November 2026

- vite.config.ts ditemukan kosong dan memicu pesan config must export or return an object. Tidak ditemukan salinan lokal di proyek; berkas dipulihkan dari versi Git yang terlacak.
- Konfigurasi berhasil dimuat oleh Vite. Permintaan halaman lokal membalas HTTP 200 pada port 5173 (server yang sudah berjalan) dan 5174 (server konfirmasi sementara, kemudian dihentikan).
- git diff --check lulus untuk berkas yang diperbaiki. Tes aplikasi tidak dijalankan.

## Restyling UI dan ruang peran - 22 November 2026

- Commit `e9478f2` menyatukan token warna/typografi dan mencatat pola umum dari referensi Kemendikdasmen serta INI LHO ITS. Commit `d8817f9` menambahkan presentasi lima ruang peran pada dashboard. Commit `db2e940` menyelaraskan kontrol bersama dan menambahkan scroll reveal dashboard yang menghormati `prefers-reduced-motion`.
- Lint dan `npx tsc --noEmit` lulus di Node v24.22.3. `npm run check` standar gagal sebelum build karena proses tes Node berhenti dengan fatal out-of-memory `Zone`; 140 tes lain lulus tanpa assertion gagal. Tes konfigurasi sekolah terisolasi serial lulus 9/9. Percobaan full suite serial juga menemui OOM pada `tests/database.test.mjs`; perubahan sementara concurrency di `package.json` telah dipulihkan dan tidak masuk commit.
- Suite browser tidak dijalankan karena gate kritis belum bersih. Belum ada audit visual ukuran 390×844 dan 1280×900. Fase restyling seluruh halaman fitur belum selesai. Tidak ada perubahan database, akses, atau Supabase hosted.

## Restyling halaman fitur - 22 November 2026

- Commit lanjutan: `c1e7744`, `87f7076`, `170b186`, `bcc9679`, `e534f9d`, `5a20cd9`, `181e2de`, `9700a48`, `2344f05`, `68511a6`, `4083216`, dan `f558750`. Perubahan menata token pada warna lama, data master/tautan akun, absensi dan laporan, jurnal, pembelajaran, asesmen, jadwal, supervisi, portal wali, laporan ketidakhadiran, dan notifikasi. CSS berpusat di `src/styles/features.css`; tidak ada perubahan data, izin, atau logika bisnis.
- `npm run check` pada Node v24.22.3 lulus: 39 migration, lint, TypeScript, 149/149 tes lokal, build terisolasi 1.792 modul dan 30 berkas JavaScript tanpa akun demo. Peringatan chunk PDF 790,69 kB tetap ada.
- `PLAYWRIGHT_PORT=5191 npm run test:browser`: awalnya 412/420 lulus dalam 9,3 menit. Empat kegagalan pada label login/beranda diperbaiki agar mempertahankan navigasi serta salinan fitur yang sudah digunakan; 4 tes fokus login dan beranda desktop/ponsel kemudian lulus. Empat tes tersisa mengharapkan tautan belajar/asesmen tersembunyi bagi administrator dan kepala sekolah, sedangkan fungsi `canReadLearning`/`canReadAssessments` saat ini menampilkannya; aturan akses tidak diubah. Semua pemeriksaan `audit-responsive` yang berjalan lulus, termasuk rute ruang wali dan notifikasi pada 390×844. Hasil browser memakai API tiruan, bukan UAT akun nyata.
- Pemeriksaan screenshot visual manual pada 1280×900 belum diselesaikan. Beranda dan proyek saat ini hanya diperiksa lewat tes otomatis responsif; status ini bukan klaim audit visual penuh.

## Infrastruktur, cache, dan kapasitas - 22 November 2026

- Commit `6081839 perf(infra): atur cache aset statis` menambahkan header Cache-Control satu tahun/immutable untuk aset Vite yang ber-hash dan runbook `docs/INFRA_SCALING_CACHE_DB.md`. HTML SPA dan respons Data API per pengguna tidak dicache publik.
- Vercel sudah memberi CDN global untuk SPA statis. Supabase terhubung ada di paket Free, region Seoul, PostgreSQL 17.11; statistik 22 November menunjukkan tabel operasional hampir kosong, serta 7 log PostgREST, 34 PostgreSQL, dan 81 PgBouncer dalam 24 jam. Tidak ada peningkatan compute atau replica yang dilakukan.
- Performance Advisor menandai 15 FK tanpa indeks penutup dan 63 indeks belum terpakai. DDL ditahan karena riwayat hosted 23 migration berbeda dari 39 migration lokal dan definisi konfigurasi sekolah hosted tidak sesuai berkas lokal. Tidak ada migration atau perubahan Supabase hosted yang dijalankan.
- Validasi: JSON cache config, lint, `npx tsc --noEmit`, `npm run build:isolated` (1.792 modul; 30 berkas JS tanpa akun demo) dan `git diff --check` lulus. Peringatan ukuran chunk PDF 790,69 kB tetap ada. Deployment Vercel belum dilakukan.
## Restyling dan audit UI - 22 November 2026

- Token warna/typografi, lima ruang peran, dashboard dan halaman fitur diselaraskan; animasi ringan menghormati `prefers-reduced-motion`. Audit kontras menggelapkan angka penanda bagian dan kartu.
- Bukti akhir Node 24.22.3: `npm run check` EXIT 0 (39 migration, lint, typecheck, 149/149 tes, build 1.792 modul, 30 bundle JS tanpa akun demo). Suite Playwright penuh 420/420 lulus pada desktop dan mobile di port 5191. Beranda/login ditinjau pada 1280×900 dan 390×844 tanpa overflow horizontal; seluruh API browser ditiru, bukan UAT.
- Fokus keyboard dan reduced motion tercakup dalam suite. Belum ada UAT akun sekolah nyata atau pemeriksaan hosted sebagai bagian dari restyling ini.

## Restyling dan audit UI - 22 November 2026

- Token warna/typografi, lima ruang peran, dashboard dan halaman fitur diselaraskan; animasi ringan menghormati `prefers-reduced-motion`. Audit kontras menggelapkan angka penanda bagian dan kartu.
- Bukti akhir Node 24.22.3: `npm run check` EXIT 0 (39 migration, lint, typecheck, 149/149 tes, build 1.792 modul, 30 bundle JS tanpa akun demo). Suite Playwright penuh 420/420 lulus pada desktop dan mobile di port 5191. Beranda/login ditinjau pada 1280×900 dan 390×844 tanpa overflow horizontal; seluruh API browser ditiru, bukan UAT.
- Fokus keyboard dan reduced motion tercakup dalam suite. Belum ada UAT akun sekolah nyata atau pemeriksaan hosted sebagai bagian dari restyling ini.
