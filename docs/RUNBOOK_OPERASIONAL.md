# Runbook Operasional

Status: 15 November 2026 (Kilo/QA)
Cakupan: L07 (hosting & cloud) dan L13 (monitoring & alerts) pada master prompt multi-AI.
Lengkapi, bukan menggantikan, [AKTIVASI_DAN_RILIS.md](AKTIVASI_DAN_RILIS.md) dan [CI_RUNBOOK.md](CI_RUNBOOK.md).

## 1. Smoke produksi anonim

Skrip: `scripts/smoke-production.mjs`. Hanya membaca, tidak menulis data.

```powershell
# Tanpa Supabase: hanya memeriksa halaman dan bundel
node scripts/smoke-production.mjs https://si-stir-hebat-blue.vercel.app

# Dengan Supabase: tambah pemeriksaan REST anonim
$env:VITE_SUPABASE_URL = '<url-proyek>'
$env:VITE_SUPABASE_PUBLISHABLE_KEY = '<publishable-key>'
node scripts/smoke-production.mjs https://si-stir-hebat-blue.vercel.app
```

Yang diperiksa:

1. `/` membalas HTML yang memuat `id="root"` dan judul aplikasi.
2. `/login` memakai fallback SPA (bukan 404).
3. Bundel utama tidak memuat alamat email akun demo (temuan S-01).
4. Bila env Supabase tersedia: `rest/v1/profiles` menolak anonim (401/403 atau array kosong).

Skrip tidak pernah mencetak isi baris data, kata sandi, atau key.

## 2. Hasil smoke terakhir

Dijalankan pada 15 November 2026 terhadap build lokal `vite preview` (bukan produksi):

```
LULUS Beranda dapat dibuka — status 200
LULUS Rute SPA /login memakai fallback index.html — status 200
LULUS Bundel utama ditemukan — /assets/index-BVeK9MTm.js
GAGAL Tidak ada akun demo di bundel produksi — 5 akun demo masih ada di bundel
LEWAT REST menolak akses anonim — VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY belum disetel.
Smoke 3/4 lulus
```

Kegagalan itu **benar** dan sesuai temuan S-01: akun demo masih ikut bundel produksi. Smoke terhadap produksi asli **belum dijalankan**; pemilik perlu menjalankannya setelah S-01 ditutup.

### Verifikasi ulang bundel — 15 November 2026

Build berikutnya mengganti modul autentikasi demo dengan stub produksi dan menjalankan `scripts/check-demo-bundle.mjs` setelah `vite build`. `npm run check` lulus; pemeriksaan menyisir 7 berkas JavaScript dan tidak menemukan penanda akun demo. Ini menutup kegagalan bundel lokal yang tercatat di atas, tetapi bukan smoke produksi: URL Vercel, Auth, REST anonim, email, dan UAT akun sekolah tetap belum diperiksa pada sesi ini.

## 3. Rollback

1. Vercel → Deployments → pilih deployment terakhir yang sehat → **Promote to Production** (rollback instan, tanpa rebuild).
2. Periksa ulang dengan smoke pada bagian 1 dan satu alur login manual.
3. Jangan mengandalkan rollback untuk perubahan database: migration bersifat maju-menerus. Bila rilis membawa migration, pemulihan dilakukan dengan migration perbaikan baru, bukan dengan menjalankan ulang migration lama.
4. Bila rollback tidak mungkin (mis. skema sudah berubah), turunkan aplikasi ke versi sebelumnya yang kompatibel dan catat waktu mulai gangguan di [HANDOFF.md](HANDOFF.md).

## 4. Checklist Site URL dan redirect Auth (pemilik)

- [ ] Authentication → URL Configuration → Site URL = domain produksi Vercel.
- [ ] Redirect URLs memuat domain produksi dan preview (`https://*.vercel.app/**` bila preview dipakai).
- [ ] Email template Action (konfirmasi, pemulihan) memakai Site URL produksi.
- [ ] Uji satu pendaftaran/pemulihan dengan email sungguhan yang tidak dipakai data sekolah.
- [ ] Jangan menaruh service-role key di Vercel; hanya `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`.

## 5. Monitoring dan alert

| Hal | Alat | Tindakan |
| --- | --- | --- |
| Aplikasi mati | Uptime check pada `/` dan `/login` (1 menit) | Cek Vercel deployment; rollback bila perlu |
| Error runtime | Log Vercel (sampai error tracking disetujui) | Kumpulkan jejak; jangan menaruh data pribadi di tiket |
| Kuota Supabase | Dashboard proyek (API, Storage, database) | Catat angka; eskalasi bila mendekati batas |
| Skema database | `npm run check:supabase` + Security Advisor | Jadwalkan mingguan; lampirkan keluaran |
| Rilis | Smoke produksi anonim | Jalankan setiap sesudah promote |

Jadwal minimal yang disarankan: smoke setiap rilis, `check:supabase` setiap Senin, tinjauan kuota setiap awal bulan.

## 6. Terverifikasi vs belum

Terverifikasi: logika smoke (dijalankan terhadap build lokal), gerbang CI lokal, pemeriksaan urutan migration.

Belum terverifikasi: smoke terhadap produksi, uptime check, alert kuota, Site URL/redirect, serta pemulihan bencana. Semuanya memerlukan akses pemilik.