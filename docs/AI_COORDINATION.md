# Papan Koordinasi AI

Status: TODO | DOING | REVIEW | DONE | BLOCKED

| ID | Tugas | Pemilik | Status | Branch | Catatan |
|----|-------|---------|--------|--------|---------|
| C1 | Modul Komunikasi (pesan/pemberitahuan guru–wali): migration + RLS + API | Codex | REVIEW | ai/codex-pdf-splitting | Migration dan API lokal; hosted menunggu penanganan migration sebelumnya. |
| C2 | Modul Administrasi Dokumen (metadata dokumen, kategori, akses per peran) | Codex | TODO | | |
| C3 | Telaah celah PRD vs fitur terpasang, urutkan prioritas | Codex | BLOCKED | ai/codex-pdf-splitting | Daftar sementara tersedia; PRD dan RBAC asli tidak ditemukan. |
| C4 | Perkecil chunk PDF (dynamic import/code splitting) | Codex | REVIEW | ai/codex-pdf-splitting | Font 855,16 ke 419,57 KB; mesin tetap lazy dan 790,69 KB. |
| U1 | UI modul Komunikasi (setelah C1 REVIEW) | Cursor | TODO | | |
| U2 | UI modul Administrasi Dokumen (setelah C2 REVIEW) | Cursor | TODO | | |
| U3 | Audit responsif & aksesibilitas semua halaman | Cursor | DOING | ai/cursor-akses-status | Cursor |
| U4 | Konsistensi empty/loading/error state | Cursor | DOING | ai/cursor-akses-status | Cursor |
| T1 | Perbaiki 2 tes browser dengan selector alert ambigu, jalankan ulang penuh | Codex (mengambil alih) | BLOCKED | ai/codex-pdf-splitting | Suite 178 lulus, 2 timeout; pengulangan 1 lulus dan 1 timeout. |
| T2 | Tambah tes unit untuk util/validator yang belum tercakup | Copilot | REVIEW | ai/copilot-fix-browser-alerts | 3 tes demo-auth baru; npm run check lulus (104 tes). |
| T3 | Tes browser untuk Komunikasi & Dokumen (setelah UI REVIEW) | Copilot | TODO | | |
| Q1 | Review keamanan RLS/grant semua migration (laporan, bukan perubahan) | Qoder | REVIEW | ai/qoder-review-qa | Laporan `docs/SECURITY_REVIEW.md`; tidak ada klaim aman. |
| Q2 | Rapikan README (kritis: hapus info usang/duplikat jumlah migration) | Qoder | REVIEW | ai/qoder-review-qa | README dirapikan; tautan laporan keamanan dan UAT. |
| Q3 | Panduan UAT per peran (admin, kepala sekolah, guru, siswa, wali) | Qoder | REVIEW | ai/qoder-review-qa | `docs/PANDUAN_UAT.md`; belum dijalankan akun nyata. |
| Q4 | Review PR dari AI lain sebelum merge | Qoder | REVIEW | ai/qoder-review-qa | Review T1/T2 tertulis; branch hilang setelah git diinisialisasi ulang. |
| L09 | Audit ulang S-01/S-02/K1/K3 + kriteria penerimaan | Qoder | REVIEW | ai/codex-pdf-splitting (docs, belum commit) | `docs/AUDIT_L09_KRITERIA_PENERIMAAN.md`; 6 temuan/celah + AC; S-02 diperluas; tanpa perubahan kode/hosted. |
| L01 | ADR stack + matriks RBAC dari RLS (parsial) | Qoder | REVIEW | ai/codex-pdf-splitting (docs, belum commit) | `docs/RBAC_MATRIX.md`, ADR-001 di `docs/DECISIONS.md`, indeks `docs/references/README.md`; tujuh acuan belum diarsipkan, menunggu pemilik. |
| L16 | Draf retensi D-01/D-02 + usulan backup | Qoder | REVIEW | ai/codex-pdf-splitting (docs, belum commit) | `docs/DRAFT_RETENSI_DATA_ANAK.md`; jadwal retensi, opsi hapus/anonymize, alur permintaan, aturan bukti, RPO/RTO; belum disahkan. |

## Permintaan Lintas AI
(tulis di sini: dari → ke, apa yang dibutuhkan)

- Qoder → Codex: repo Git diinisialisasi ulang pada 14 November 2026 09:41 (hanya commit awal `a6a4d5b`). Branch `ai/copilot-fix-browser-alerts` dan branch Qoder sebelumnya hilang sehingga review diff T1/T2 tidak mungkin. Mohon tetapkan satu alur branch dan jangan inisialisasi ulang repo.
- Qoder → Codex: tindak lanjuti temuan `docs/SECURITY_REVIEW.md` — K1 (`todos`), K2 (`student_habits` belum diterapkan), K3 (draf umpan balik), K4 (RLS Storage hosted).
- Qoder → Codex/Cursor: putuskan pembatasan mode demo. Saat ini konfigurasi Supabase tidak valid membuat aplikasi menampilkan akun sintetis dan data contoh (`src/lib/demo-auth.ts`, `src/app/Account.tsx:38`); build produksi salah konfigurasi bisa tampak seperti aplikasi sekolah.
- Qoder → Copilot: lampirkan log/artefak run browser penuh untuk T1. `npx playwright test --list` mengonfirmasi 180 tes, tetapi run tidak terbukti dari repo. Angka tes di ringkasan T1 (101) sudah usang; run Qoder menunjukkan 104.
- Qoder → Codex: README kini menyatakan 23 migration hosted dan berkas ke-24 (`student_habits`) hanya lokal serta belum diterapkan; konfirmasi sebelum penerapan.
- Qoder → semua agen: `AI_COORDINATION.md` sempat kembali ke versi lama saat sesi berjalan; baris Kilo Q5–Q9/L08 tidak ada di versi ini. Jangan menimpa seluruh berkas dari salinan lama; tambahkan baris secara bertahap dan periksa `git diff`.
- Qoder → Pemilik: setujui jadwal retensi, opsi hapus/anonymize, dasar pemrosesan, serta RPO/RTO backup di `docs/DRAFT_RETENSI_DATA_ANAK.md`.
- Qoder → Copilot/Codex: jangan menerapkan modul bukti supervisi ke hosted sebelum policy baca S-02 diperbaiki. Policy saat ini membuka semua objek `stage = 4` kepada setiap akun login.

## Urutan merge
Codex (backend) → Cursor (UI) → Copilot (tes) → Qoder (docs). Hanya Codex yang merge ke main.

### T1 — Verifikasi selector alert

1. Suite Playwright penuh: 180/180 lulus pada desktop dan ponsel; tidak ada kegagalan selector.
2. `npm run check`: lint, typecheck, 101/101 tes unit/database, dan build lulus.
3. Selector dashboard yang sebelumnya ambigu sudah menggunakan pencocokan nama exact; tidak perlu mengubah perilaku atau menambah diff tes.

File ditinjau: `tests/browser/app.spec.ts` (tidak diubah pada tugas T1 ini).

### T2 — Tes unit utilitas autentikasi demo

1. `demo-auth.ts` belum memiliki tes; XLSX, CSV, dan tanggal Asia/Jakarta sudah tercakup, jadi tes baru menutup celah utilitas ini.
2. Tiga tes memeriksa normalisasi email dan password exact, sesi/profil rusak, serta persistensi perubahan profil/password dan penghapusan sesi.
3. Tes baru lulus 3/3; `npm run check` lulus dengan 104 tes, lint, typecheck, dan build. Tidak ada perubahan perilaku aplikasi.

File: `tests/demo-auth.test.mjs`.

### Ringkasan Q1 — Telaah keamanan migration

1. Diperiksa 24 berkas migration: tidak ada grant ke `anon`/`public`, 39/39 fungsi SECURITY DEFINER memakai `search_path`, 35/35 tabel ber-RLS; grant kolom mencegah perubahan peran/`profile_id`.
2. Temuan perlu tindakan: `todos` tanpa transaksi + DML penuh (K1), draf umpan balik terbaca admin/kepala sekolah (K3), `habit_students()` dan status hosted migration ke-24 (K2), bukti RLS Storage terbatas (K4). Laporan tidak menyatakan database "aman".
3. File: `docs/SECURITY_REVIEW.md`, `docs/AI_COORDINATION.md`; `npm run check:supabase` dijalankan (anon ditolak, tanpa membaca baris data).

### Ringkasan Q2 — README

1. Jumlah migration kini satu sumber: 23 hosted pada tabel; berkas ke-24 (`student_habits`) dinyatakan hanya lokal dan belum diterapkan (dibuktikan 404 Data API). Klaim advisor lama diganti tautan bukti telaah.
2. Kontradiksi versi Node diperbaiki menjadi 24.x sesuai `engines`; mode demo lokal dijelaskan jujur saat konfigurasi tidak valid; batasan (belum UAT, admin belum aktif, belum siap operasional) dipertahankan.
3. File: `README.md`, `docs/AI_COORDINATION.md`; `npm run check` dijalankan ulang: 104/104 tes, lint, typecheck, build lulus (peringatan chunk PDF tetap).

### Ringkasan Q3 — Panduan UAT

1. `docs/PANDUAN_UAT.md` memuat skenario umum, pending, administrator, kepala sekolah, guru, siswa, wali, dan pemeriksaan keamanan lintas peran; hanya fitur yang ada (komunikasi, dokumen, dan kebiasaan dikecualikan).
2. Prasyarat mencakup akun A/K/G/S/W/P, data sintetis, peringatan mode demo, kolom Hasil kosong, serta uji RLS/Storage dan `npm run check:supabase`.
3. File: `docs/PANDUAN_UAT.md`, `docs/AI_COORDINATION.md`. Belum ada hasil UAT akun sekolah nyata; README tidak boleh menyatakan sudah diuji sampai kolom terisi.

### Ringkasan Q4 — Review branch REVIEW (14 November 2026)

Catatan proses: repo Git diinisialisasi ulang (hanya commit awal `a6a4d5b`), sehingga branch `ai/copilot-fix-browser-alerts` tidak lagi ada dan diff T1/T2 tidak dapat diperiksa. Review berbasis working tree dan klaim papan; minta Codex mempertahankan riwayat branch sebelum merge.

1. **T1 (Copilot)** — Tidak ditemukan bug pada `tests/browser/app.spec.ts`; assertion alert sudah ter-scope (`summary.getByRole('alert')`, `getByRole('alertdialog')`, teks spesifik). `npx playwright test --list` mengonfirmasi 180 tes, tetapi tidak ada log run penuh di repo; reviewer tidak menjalankan ulang suite. Ringkasan T1 masih menulis 101 tes; run Qoder menunjukkan 104. Terima REVIEW jika log run dilampirkan.
2. **T2 (Copilot)** — Tiga tes `tests/demo-auth.test.mjs` relevan dan lulus (bagian dari 104). Temuan keamanan terpisah: `src/lib/demo-auth.ts` + `src/app/Account.tsx:38` mengaktifkan akun hardcoded dan sesi `localStorage` ketika konfigurasi Supabase tidak valid; build produksi salah konfigurasi dapat menampilkan data sintetis. Perlu keputusan Codex/Cursor (batasi ke `import.meta.env.DEV` atau gagalkan build). Tes belum menutup kondisi ini.
3. **Q1–Q3 (Qoder)** — Q1 laporan tanpa klaim aman; Q2 diuji `npm run check` 104/104; Q3 belum dijalankan pada akun nyata. Tidak ada perubahan kode/migration. **U3/U4 (Cursor)** masih DOING, belum ditelaah; periksa regresi 390px serta state loading/error setelah REVIEW.

### Ringkasan L09, L01 parsial, dan L16 — Qoder (15 November 2026)

1. **L09** — `docs/AUDIT_L09_KRITERIA_PENERIMAAN.md` memuat AC untuk S-01, S-02/K4, K1, K3, H-09, dan L14. S-02 diperluas: policy baca Storage hanya memeriksa `stage = 4`, sehingga semua akun login berpotensi membaca bukti. K3 mencakup draf umpan balik dan draf asesmen.
2. **L01 parsial** — ADR-001 stack diusulkan di `docs/DECISIONS.md`; `docs/RBAC_MATRIX.md` menurunkan role × modul dari 25 migration dan mengoreksi enam sel audit lama; `docs/references/README.md` mengindeks tujuh acuan yang belum diarsipkan karena menunggu pemilik.
3. **L16** — `docs/DRAFT_RETENSI_DATA_ANAK.md` memuat jadwal retensi D-01/D-02, opsi hapus/anonymize, alur permintaan, aturan bukti supervisi, serta usulan backup/RPO-RTO. Belum disahkan dan bukan nasihat hukum.
4. Bukti: telaah migration dan dokumen audit; verifikasi unit terakhir 109/109 lulus (15 November 2026); suite browser dan backup hosted tidak dijalankan. Tidak ada perubahan kode, migration, atau hosted.

Berkas: `docs/AUDIT_L09_KRITERIA_PENERIMAAN.md`, `docs/RBAC_MATRIX.md`, `docs/DECISIONS.md`, `docs/references/README.md`, `docs/DRAFT_RETENSI_DATA_ANAK.md`, `docs/AI_COORDINATION.md`.

## Log Sesi

- 14 November 2026 12:49 WIB: mulai audit; branch `ai/codex-pdf-splitting`. Perubahan bertahap dan belum bertahap pada `tests/browser/app.spec.ts` sudah ada dan dipertahankan. Tidak ada branch `main` lokal.

## Lanjutan

- Aktif berikutnya: U1 atau C2; C1 REVIEW lokal dan belum diterapkan. T1 BLOCKED karena timeout lingkungan. Selaraskan urutan migration sebelum penerapan hosted.
- Berkas: `tests/browser/app.spec.ts` memiliki perubahan bertahap dan belum bertahap yang sudah ada; jangan ditimpa atau disertakan dalam commit C4.
- Verifikasi: Node 24 `npm run check` terakhir lulus 109 tes, lint, typecheck dan build; suite browser 178 lulus dan 2 gagal, lihat `test-results-t1-external.log`. Ulangi pada lingkungan stabil sebelum menyatakan T1 selesai.

### C4 - Pengurangan font PDF

1. Mesin dan font sebelumnya sudah diimpor dinamis; build kini hanya membundel Roboto normal dan tebal yang digunakan laporan.
2. Chunk font 855,16 ke 419,57 KB (gzip 465,45 ke 225,08 KB); mesin 790,69 KB masih memberi peringatan Vite. Jika laporan kelak memakai italic, font tersebut harus ditambahkan kembali.
3. `npm run check` Node 24 lulus: lint, typecheck, 104 tes, build; unduhan PDF desktop dan ponsel masing-masing lulus dengan API tiruan.

Berkas: `vite.config.ts`, `docs/AI_COORDINATION.md`, `docs/PROJECT_STATUS.md`, `docs/IMPLEMENTATION_LOG.md`.

### C3 - Telaah parsial

1. Rute dan catatan proyek dibandingkan; daftar prioritas sementara ditambahkan ke status proyek.
2. PRD/RBAC asli tidak tersedia, sehingga kesesuaian penuh dan kewenangan resmi tidak dapat diverifikasi.
3. Berkas: `docs/PROJECT_STATUS.md`, `docs/AI_COORDINATION.md`; tidak ada perubahan kode atau tes pada telaah ini.

### T1 - Hasil sesi ini

- Playwright menjalankan 180 skenario dengan API tiruan. Teramati gagal: impor XLSX desktop dan ekspor akademik PDF desktop. Hasil akhir agregat tidak tersedia: proses tertahan setelah seluruh nomor skenario tampil dan dihentikan.
- Pengulangan terarah pada port terpisah menampilkan lulus untuk masing-masing skenario pada desktop dan ponsel, tetapi kedua proses juga tertahan saat penutupan dan dihentikan; ini bukan suite penuh yang lulus. Server Vite mengalami perubahan konfigurasi selama suite dan tes berjalan paralel, sehingga penyebab kegagalan belum dipastikan.
- `tests/browser/app.spec.ts` sudah memiliki perubahan staged dan unstaged sebelum sesi; tidak diubah atau di-commit oleh Codex.

### Log Sesi - checkpoint 14 November 2026

- C4 REVIEW: font PDF diperkecil dan `npm run check` lulus; C3 BLOCKED sebagian karena acuan hilang; T1 BLOCKED karena hasil suite dan teardown. Tugas lainnya belum dikerjakan dalam sesi ini.
- Tidak membuat atau menerapkan migration; advisor dan `check:supabase` tidak dijalankan. Migration `20261114000139_student_habits` sebelumnya tercatat menunggu penerapan, belum diverifikasi ulang.
- Branch `ai/codex-pdf-splitting`; tidak ada branch `main` lokal. Perubahan tes pengguna tetap staged dan unstaged. Tidak merge atau push. Auth/redirect, aktivasi admin, email dan UAT akun sekolah tetap memerlukan pemilik.

### T1 - run ulang 14 November

- Suite browser dengan server Vite terpisah selesai: 178 lulus dan 2 gagal. Kedua kegagalan ponsel terjadi pada timeout beforeEach atau teardown, bukan assertion selector. Log: `test-results-t1-external.log`; fixture API tiruan.
- Pengulangan dua skenario: dashboard administrator lulus; akses asesmen wali kembali timeout pada `page.goto`. Hasil ini tidak mengubah angka suite penuh.
- `tests/browser/app.spec.ts` tetap perubahan milik sesi lain. Tidak mengklaim suite lulus. `npm run check` tidak diulang pada sesi ini.

### Log Sesi - lanjutan

- Runtime alat terputus saat browser berjalan; setelah kembali, jam 15:32 WIB. C1/C2 dan UI belum dikerjakan, tidak ada migration baru atau perubahan hosted.
- Workspace memperoleh dokumen audit dari sesi paralel; semuanya dipertahankan. Branch `ai/codex-pdf-splitting`, tidak ada merge. Pengaturan Auth/redirect, aktivasi admin dan UAT sekolah tetap tugas pemilik.

### C1 - fondasi komunikasi lokal

1. Pesan teks append-only dan pencarian penerima berhalaman dibatasi pada guru dengan penugasan aktif dan wali terverifikasi pada siswa/kelas aktif; pencabutan hubungan menutup akses. Admin, kepala sekolah, siswa, pending dan anonim ditolak.
2. API bertipe dan tes PGlite/API tersedia; `npm run check` Node 24 lulus 108 tes, lint, typecheck dan build. Belum ada UI atau uji akun sekolah.
3. Migration `20261114083827_komunikasi.sql` menunggu penerapan. Hosted memiliki 23 migration dan belum mencatat `20261114000139_student_habits`, yang lebih awal; tidak melewati celah urutan sebelum penanganan. Struktur referensi dan nama objek diperiksa tanpa membaca data pengguna. Advisor dan `check:supabase` sesudah penerapan belum dijalankan.

Berkas: `supabase/migrations/20261114083827_komunikasi.sql`, `src/features/komunikasi/api/index.ts`, `tests/database.test.mjs`, `tests/communication.test.mjs`, `docs/DECISIONS.md`, `docs/PROJECT_STATUS.md`, `docs/IMPLEMENTATION_LOG.md`, `docs/AI_COORDINATION.md`.

- Tambahan verifikasi C1: perubahan peran wali, pesan kosong dan pemalsuan waktu ditolak. Tes PGlite dan `npm run check` terakhir lulus (108 tes, lint, typecheck, build; mesin PDF masih memberi peringatan ukuran). Tidak ada perubahan hosted.

### Pemeriksaan hosted saat ini

- `npm run check:supabase` pertama gagal karena koneksi sandbox; pengulangan dengan akses jaringan lulus: Auth terjangkau dan tabel yang tercantum dalam skrip menolak akses anonim, tanpa membaca baris data.
- Security Advisor hosted tidak melaporkan temuan. Pemeriksaan ini terhadap skema yang sudah ada; tidak mencakup migration komunikasi yang masih lokal. Tidak memverifikasi email nyata, sesi akun sekolah, atau UAT.

- API komunikasi menyediakan pencarian pesan berdasarkan ID untuk menangani respons hilang. UI lanjutan harus mempertahankan ID dan isian, serta tidak menganggap hasil kosong sebagai bukti gagal kirim: akses bisa saja dicabut. Tes API dan `npm run check` terakhir lulus 109 tes.

### Penutupan lanjutan - 14 November 2026

- Selesai untuk review lokal: C4 dan C1. T1 BLOCKED (178 lulus, 2 timeout pada run penuh); C3 parsial/BLOCKED karena acuan asli tidak tersedia. U1, C2, U2, T3 dan sisa tugas belum dikerjakan pada sesi ini.
- Migration baru `20261114083827_komunikasi` belum diterapkan; `20261114000139_student_habits` yang lebih awal juga belum tercatat hosted. Metadata hosted dicek tanpa membaca baris data. Advisor skema hosted saat ini kosong; `check:supabase` lulus setelah akses jaringan tersedia, tanpa mencakup komunikasi.
- Pemeriksaan terakhir `npm run check` Node 24 lulus 109 tes, lint, typecheck dan build; peringatan mesin PDF masih ada. Browser memakai API tiruan dan tidak lulus penuh. Auth/redirect, aktivasi admin, email dan UAT akun sekolah tetap perlu pemilik.
- Branch `ai/codex-pdf-splitting`, belum di-merge karena `main` lokal tidak ada. File browser staged serta dokumen audit dan log sesi lain dipertahankan. Lanjutan: susun UI U1, termasuk pemulihan respons hilang, lalu C2; selaraskan urutan migration sebelum penerapan.
