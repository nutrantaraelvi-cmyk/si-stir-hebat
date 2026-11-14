# Audit Konsistensi Dokumen, Kode, dan Migration

Tanggal: 14 November 2026. Auditor: Qoder. Basis: `03b87c0`.
Sifat: baca-saja. Tidak ada perubahan dokumen proyek selain laporan audit dan `HANDOFF.md`.

## Fakta kanonik yang diverifikasi

| Fakta | Bukti |
| --- | --- |
| 19 route aplikasi | `src/app/App.tsx:30-48` |
| 104 tes unit/database lulus | `npm run check` pada `03b87c0`, Node 24.22.1, exit 0 |
| 180 tes browser terdaftar | `npx playwright test --list` → `Total: 180 tests in 1 file` |
| 24 berkas migration lokal | `supabase/migrations/` berisi 24 berkas; terakhir `20261114000139_student_habits.sql` |
| 23 migration hosted | Dinyatakan README/status proyek; audit ini tidak melakukan probe baru ke hosted |
| Node 24.x | `package.json` `engines` dan CI |
| `docs/references` tidak ada | `ls docs/references` gagal; README menyatakan folder ini tidak tersedia |

Catatan: hasil 180 berasal dari daftar tes pada working tree yang memuat perubahan `tests/browser/app.spec.ts` milik agen lain. Daftar bukan bukti lulus; log run penuh belum ada di repo.

## Ringkasan prioritas

| ID | Tingkat | Temuan | Usulan pemilik |
| --- | --- | --- | --- |
| C-01 | Sedang | Beranda menjanjikan "kebiasaan baik" dan "komunikasi", tetapi keduanya belum tersedia; README menyatakan masih terbuka | Cursor |
| C-02 | Sedang | Jumlah tes 101, 104, 108, dan 109 bercampur di AGENTS, PROJECT_STATUS, dan papan koordinasi | Qoder |
| C-03 | Sedang | PROJECT_STATUS tidak kronologis, memiliki bagian duplikat, judul rusak, dan klaim "tujuh lampiran" yang baru tersedia di luar repo pada 14 November 2026, belum diarsipkan di `docs/references` | Qoder |
| C-04 | Rendah | AGENTS.md masih memakai baseline 23 migration/101 tes tanpa menyebut 25 migration lokal dan 109 tes | Qoder |
| C-05 | Rendah | Papan T1 memuat klaim 180/180 lulus, sementara catatan sesi menyebut proses tertahan; laporan Kilo terbaru menyebut 194/194 | Qoder/Codex |

## Rincian

### C-01 — Janji fitur di beranda (Sedang)

`src/app/App.tsx:24` menulis "Ruang Murid — Materi, tugas dan kebiasaan baik"; `:25` menulis "Ruang Orang Tua — Perkembangan anak dan komunikasi". Tidak ada route kebiasaan siswa, dan komunikasi (pesan/pemberitahuan guru–wali) masih TODO (C1/U1). README:7 justru menyatakan komunikasi/administrasi dokumen masih terbuka dan modul kebiasaan belum memiliki UI. Pengunjung beranda mendapat kesan fitur tersedia.

Saran: ubah teks menjadi fitur yang ada (misalnya "Materi, tugas dan asesmen"; "Kehadiran anak dan informasi sekolah") atau beri label "segera hadir" secara jujur. Perubahan ini di wilayah Cursor/Codex; jangan mengubah kode sebagai bagian audit ini.

### C-02 — Jumlah tes tidak konsisten (Sedang)

- `AGENTS.md:42`: "passed 101 tests".
- `docs/PROJECT_STATUS.md:8,16,22,30,259,273,278,298`: menulis 101 tes.
- `docs/PROJECT_STATUS.md:302`: menulis 104 tes (sesi C4).
- `docs/AI_COORDINATION.md:16,47,61,91`: 104 tes.
- `docs/AI_COORDINATION.md:38`: ringkasan T1 menulis 101/101.
- `README.md:196`: 104 setelah T2.

Angka 109 adalah hasil `npm run check` yang diverifikasi auditor pada 14 November 2026; 108 adalah angka sesi komunikasi, 104 angka setelah T2, dan 101 baseline sebelum tes demo-auth. Saran: satu angka kanonik (109) dan satu catatan riwayat, atau hapus angka lama dari ringkasan agar tidak terbaca sebagai status terkini. Perbarui AGENTS.md dan papan.

### C-03 — Struktur PROJECT_STATUS (Sedang)

- `docs/PROJECT_STATUS.md:33` menyatakan "Pembaruan terakhir: 12 November 2026", padahal berkas memuat bagian 14 November (misalnya `:269`).
- `:269` berjudul "Ringkasan sekolah dashboard � 14 November 2026" — karakter rusak (mojibake).
- Bagian 14 November ditambahkan setelah bagian lama, sementara bagian atas menyiratkan urutan terbaru lebih dulu; pembaca sulit menentukan status berlaku.
- `:51` menyatakan "Tujuh lampiran diterima dan ditelaah pada 11 November 2026"; pada 14 November 2026 tujuh berkas acuan diberikan ke auditor di luar repo, tetapi `docs/references` masih tidak ada dan README menyatakan folder itu tidak tersedia. Tanggal, jumlah, dan status penelaahan belum dapat diverifikasi dari repo.

Saran: satu header "Pembaruan terakhir" yang diperbarui, urutan kronologis yang konsisten, hapus karakter rusak, dan tandai acuan yang hilang. Ini tugas dokumentasi Qoder; jangan diubah oleh agen yang sedang mengejar fitur.

### C-04 — Baseline AGENTS.md (Rendah)

`AGENTS.md:41` menyebut 23 migration hosted sampai `todos` (benar untuk hosted) tetapi tidak menyebut bahwa ada 25 migration lokal, termasuk `20261114000139_student_habits.sql` dan `20261114083827_komunikasi.sql`, yang belum diterapkan; `:42` menyebut 101 tes, sedangkan hasil terverifikasi terbaru 109 tes. Instruksi ini dibaca setiap sesi agen, sehingga baseline usang mudah menyebar. Saran: tambahkan satu baris status lokal/hosted dan angka tes kanonik, tanpa mengubah aturan kerja.

### C-05 — Klaim hasil T1 di papan (Rendah)

`docs/AI_COORDINATION.md:37` menyatakan "Suite Playwright penuh: 180/180 lulus", sedangkan `:103-104` mencatat proses tertahan setelah semua skenario tampil dan dihentikan, dan `:73` menyatakan tidak ada log run penuh. Ringkasan T1 juga menulis 101 tes (`:38`). Laporan Kilo terbaru menyebut 194/194 lulus dalam tiga run berturut-turut, tetapi auditor belum menjalankan ulang suite penuh. Ini bukan temuan kode, tetapi membuat status T1 tidak dapat dipercaya sampai log/artefak dilampirkan.

Saran: papan hanya mencantumkan hasil dengan bukti (file log, tanggal, perintah); sampai itu ada, status T1 tetap DOING/BLOCKED dan tidak boleh dikutip sebagai "lulus penuh".

## Yang sudah konsisten

- README menyebut 23 hosted dan menjelaskan berkas lokal yang belum diterapkan (README:15,45); ini cocok dengan 25 berkas lokal saat ini, termasuk `student_habits` dan `komunikasi`.
- README menggunakan Node 24.x sesuai `engines`.
- README tidak lagi menyatakan aplikasi "siap operasional"; batas UAT, admin belum aktif, mode demo, dan email tetap dinyatakan.
- Daftar route di README sesuai dengan `App.tsx` untuk modul yang disebut tersedia.
- Laporan keamanan dan panduan UAT tertaut dari README; keduanya ada.

## Batas audit

Tidak ada probe baru ke Supabase hosted, deployment Vercel, atau GitHub Actions. Status hosted dan hasil workflow mengikuti dokumen dan tidak diverifikasi ulang di sini.
