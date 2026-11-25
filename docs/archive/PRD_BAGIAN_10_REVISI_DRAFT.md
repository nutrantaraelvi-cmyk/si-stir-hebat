# Draf Revisi PRD Bagian 10 — Arsitektur Teknis

Status: **DRAF untuk disahkan pemilik** — belum menggantikan `docs/references/PRD_SI_STIR_HEBAT_v1_0.md`.
Tanggal: 20 November 2026. Penulis: Qoder (peran dokumentasi/UI/review).
Dasar: keputusan pemilik D1 dan D3 di `docs/DECISIONS.md`, aturan keras "stack terkunci" pada master prompt, dan isi aplikasi aktual.
Sifat: baca-saja terhadap referensi. Tidak ada perubahan kode, migration, atau hosted.

## 1. Alasan revisi

Bagian 10 PRD masih mencantumkan Next.js App Router, Tailwind CSS, Zod, dan monorepo sebagai stack wajib. Kenyataan proyek dan keputusan pemilik berbeda:

- D1: migrasi bertahap ke Next.js **disetujui secara prinsip**, tetapi hanya boleh dimulai setelah rencana migrasi disetujui; sampai saat itu implementasi tetap React + Vite.
- D3: Tailwind, Zod, dan monorepo **tidak diwajibkan**.
- Hard rule proyek: jangan memakai Next.js pada implementasi saat ini; otorisasi ditegakkan di RLS/RPC Supabase, bukan lapisan server UI.
- Aplikasi aktual: satu aplikasi Vite di `src/`, tanpa `apps/`, `packages/`, atau backend Next.js.

Tanpa revisi, PRD bertentangan dengan aturan keras dan keputusan pemilik.

## 2. Usulan tabel 10.1 (menggantikan tabel lama)

| Lapisan | Teknologi | Catatan |
|---|---|---|
| Frontend | React 19 + Vite | Implementasi berjalan; Next.js ditunda sesuai D1 |
| Bahasa | TypeScript | Aktif |
| Styling | CSS global dengan design token | Tailwind tidak diwajibkan (D3) |
| Backend/data | Supabase PostgreSQL, RLS, RPC, Storage privat | Otorisasi di database, bukan UI |
| Autentikasi | Supabase Auth | Sesi diverifikasi di klien, izin di RLS |
| Berkas | Supabase Storage privat | Bukti supervisi, dokumen sekolah |
| Validasi | Validator TypeScript internal + constraint/trigger database | Zod tidak diwajibkan (D3) |
| Version control | Git | Satu repositori aplikasi |
| Deployment | Vercel (bila disetujui) | Belum ada keputusan rilis produksi |
| Spreadsheet | CSV/XLSX di klien | Impor absensi dan ekspor laporan |

## 3. Usulan paragraf 10.2–10.3

Ganti deskripsi "modular monolith dalam satu monorepo" dengan:

> Aplikasi berupa satu proyek React + Vite yang memanggil Supabase langsung melalui klien bertipe. Tidak ada backend aplikasi terpisah pada versi ini. Setiap fitur disusun sebagai modul di `src/features/<fitur>` dengan halaman, model validasi, pemanggilan API Supabase, dan tes. Struktur monorepo, aplikasi `apps/api`, serta paket bersama `packages/*` dari PRD lama ditandai **superseded** sampai rencana migrasi Next.js disetujui pemilik.

Struktur repositori aktual yang disahkan sebagai acuan:

```
si-stir-hebat/
├── src/
│   ├── app/            # shell, rute, header, dashboard
│   ├── components/     # komponen UI bersama
│   ├── features/       # modul per domain
│   ├── lib/            # klien Supabase, konteks auth, aturan izin
│   ├── styles/         # token dan CSS global
│   └── utils/          # utilitas bersama
├── supabase/migrations/
├── scripts/
├── tests/              # unit/database (node --test) dan browser (Playwright)
└── docs/
```

## 4. Usulan paragraf 10.5

> Tanggung jawab "backend" dijalankan oleh PostgreSQL Supabase: kebijakan RLS, fungsi/RPC `security definer` dengan `search_path` kosong, trigger validasi, dan grant kolom. Klien hanya memvalidasi bentuk masukan untuk pengalaman pengguna; keputusan akhir tetap di database. Next.js Route Handlers dan paralel Express/PHP tidak digunakan; layanan terpisah hanya dipertimbangkan bila kebutuhan teknis khusus muncul dan disetujui pemilik.

## 5. Butir yang tetap menunggu pemilik

1. Mengesahkan revisi ini sebagai pengganti resmi Bagian 10 PRD.
2. Menetapkan status D1: apakah rencana migrasi Next.js tetap menjadi arah, atau dicabut/ditegaskan ditunda tanpa tenggat.
3. Menetapkan target deployment (Vercel atau lain) sebelum klaim kesiapan operasional.

Sampai disahkan, dokumen ini hanya usulan dan tidak boleh dikutip sebagai acuan resmi.
