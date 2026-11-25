# Indeks Dokumen Acuan

Tanggal salin: 15 November 2026
Penulis: Qoder
Status: salinan kerja untuk pembacaan tim; **belum disahkan sebagai acuan resmi oleh pemilik**

## 1. Sumber dan cara penyalinan

Tujuh berkas disalin verbatim dari folder unduhan pemilik pada 15 November 2026. Nama berkas, ejaan, dan isi tidak diubah. SHA-256 dicatat agar versi yang dibaca dapat dilacak. Tidak ada data siswa, akun, kredensial, atau rahasia yang disalin.

Folder asal: `C:/Users/axioo/Downloads/files/` (lokal, bukan bagian repo).

## 2. Daftar dokumen

| No | Berkas | Versi | Tanggal | SHA-256 | Catatan isi |
| --- | --- | --- | --- | --- | --- |
| 1 | [`PRD_SI_STIR_HEBAT_v1_0.md`](PRD_SI_STIR_HEBAT_v1_0.md) | 1.0 | 30 Oktober 2026 | `9c3d8c628246bd9e0ac71881304b2ea40b7f9036d7c62ae71a986d41dc773128` | Kebutuhan produk dan ruang lingkup. Bagian 10 (Next.js/Tailwind/Zod/monorepo) superseded oleh D4 tanggal 20 November 2026 dan SAD; berkas asli tidak diubah. |
| 2 | [`RBAC_matriks.md`](RBAC_matriks.md) | Tanpa versi | Tanpa tanggal | `bf5c68dda842eb118da10842ff92703a9aa905b71e38aee9e97f54bb30280c02` | Uraian peran dan kewenangan; belum berupa matriks role × modul yang siap disahkan. |
| 3 | [`Database_Blueprint_SI_STIR_HEBAT.md`](Database_Blueprint_SI_STIR_HEBAT.md) | 1.0 | 3 November 2026 | `30a12552cab859cfd66293a8b63977e03612b46de5af626b657a82aea0dae6c2` | Rancangan basis data; belum direkonsiliasi penuh dengan migration yang terpasang. |
| 4 | [`API_specifiqation.md`](API_specifiqation.md) | 1.0.0 | Tanpa tanggal | `0a9d30d0e176d17dfb54f6d389c7abb93e2f774e0aff0a3b235016433fb6673b` | Berisi panduan umum dan bagian 9 API Specification; bukan katalog endpoint konkret. Ejaan nama berkas dipertahankan. |
| 5 | [`UI_UX_Blueprint_SI_STIR_HEBAT.md`](UI_UX_Blueprint_SI_STIR_HEBAT.md) | 1.0 | 30 Oktober 2026 | `3ab1deec05c111786b56eb15640abeed09a0447b77d6082ab859ec2a272db31d` | Arah desain, dashboard, responsif, aksesibilitas. Penerapan WCAG 2.2 AA belum terbukti menyeluruh. |
| 6 | [`Implementation.md`](Implementation.md) | Tanpa versi | Tanpa tanggal | `e0718541e09df91209cc9033a946f2aba698087f6cb4ba3bc72834bb279cfe65` | Implementation Plan; masih generik dan belum memuat WBS/RACI/milestone yang dapat diverifikasi. |
| 7 | [`kerangka_app.md`](kerangka_app.md) | 1.0 | 3 November 2026 | `217f05f00b32418295f20df5f64937be35a2ae15f304ed87d9f99ec3d3972710` | System Architecture Document (SAD); sebagian arsitektur belum terpasang. |

## 3. Hierarki otoritas

Urutan dari yang paling mengikat ke yang paling rendah:

1. **Aturan keras** — `AGENTS.md`, master prompt multi-AI, dan larangan keamanan yang berlaku. Tidak boleh dilanggar oleh dokumen lain.
2. **Keputusan pemilik** — `docs/DECISIONS.md`, terutama keputusan bertanggal 20 November 2026 (D1–D8). Keputusan pemilik yang lebih baru menggantikan bagian acuan yang bertentangan; bila bertentangan, D1–D8 tanggal 20 November 2026 menggantikan keputusan 15 November 2026.
3. **PRD** — kebutuhan produk, dengan bagian 10 superseded oleh D4 (20 November 2026) dan SAD.
4. **SAD/API** — `kerangka_app.md` dan `API_specifiqation.md`.
5. **Blueprint** — Database Blueprint, UI/UX Blueprint, RBAC matriks, serta Implementation Plan sebagai rencana pendukung.
6. **Kode, migration, tes, dan konfigurasi** — bukti keadaan saat ini, bukan sumber kewenangan. Jika kode berbeda dari acuan, kode tidak otomatis benar; perbedaan dicatat dan diputuskan pemilik.

Jika terjadi konflik, tingkat yang lebih tinggi menang. Konflik yang belum diputuskan dicatat di `docs/archive/AUDIT_KESESUAIAN_ACUAN.md` dan `docs/DECISIONS.md`; jangan menyelesaikannya dengan mengubah isi dokumen acuan.

## 4. Keputusan yang sudah mengubah acuan

- **D1 (20 November 2026)** — `public.todos` dihapus lewat migration baru setelah dipastikan kosong.
- **D2 (20 November 2026)** — draf umpan balik tugas hanya untuk penulis; admin/kepala sekolah hanya membaca yang terbit.
- **D3 (20 November 2026)** — mode demo hanya saat `import.meta.env.DEV`; akun demo tidak masuk bundel produksi.
- **D4 (20 November 2026)** — bagian 10 PRD (Next.js/Tailwind/Zod/monorepo) superseded oleh SAD dan stack berjalan (React 19 + Vite + TypeScript + React Router + Supabase). Ini menggantikan D1/D3 tanggal 15 November 2026 tentang migrasi Next.js.
- **D5 (20 November 2026)** — retensi sementara: registri/absensi/nilai/jurnal selama siswa terdaftar + 5 tahun ajaran; audit 5 tahun; pesan 1 tahun ajaran; bukti supervisi 2 tahun ajaran. Tanpa penghapusan otomatis.
- **D6 (20 November 2026)** — 7 Kebiasaan diisi wali, direkap guru, tanpa peringkat; sel kosong berarti "belum diisi".
- **D7 (20 November 2026)** — laporan ketidakhadiran wali diverifikasi guru sebelum menjadi status absensi; notifikasi hanya di aplikasi.
- **D8 (20 November 2026)** — palet dimigrasikan bertahap ke ungu tua/lilac/biru muda/pink sesuai UI/UX Blueprint.

Keputusan 15 November 2026 (D1 Next.js, D2 KKM 75, D3 Tailwind/Zod/monorepo, D4 retensi belum diputuskan) tetap tercatat sebagai riwayat. D1 dan D3 lama tidak lagi menjadi arahan aktif; D4 lama digantikan D5 tanggal 20 November 2026. D2 lama (indikator ketuntasan tampilan) tidak bertentangan dan tetap berlaku.

## 5. Batas penggunaan

- Dokumen ini bukan nasihat hukum dan tidak menetapkan dasar hukum pemrosesan data.
- Salinan ini belum disahkan pemilik; jangan mengutipnya sebagai "acuan resmi" tanpa persetujuan.
- `RBAC_matriks.md` belum menjadi matriks role × modul. Draf dari policy RLS yang perlu disahkan ada di `docs/RBAC_RESMI_DRAFT.md`.
- `API_specifiqation.md` bukan spesifikasi endpoint yang siap diimplementasikan; endpoint aktual harus diperiksa di kode dan migration.
- PRD, Blueprint, dan SAD dapat memuat rencana yang belum terpasang. Ketiadaan bukti implementasi tidak boleh diisi dengan asumsi.
