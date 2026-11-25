# Audit ulang H-12/H-13 — 20 November 2026

Catatan penomoran: `docs/HANDOFF.md` memakai H-13 untuk pemindahan konteks Auth dan H-12 untuk audit ulang; `docs/AUDIT_RINGKASAN_PROYEK.md` memakai H-12 untuk konteks Auth dan H-13 untuk audit ulang. Dokumen ini memeriksa keduanya.

## 1. Konteks Auth di luar `src/app` (H-13 HANDOFF / H-12 ringkasan)

Status: **tertutup**.

- Semua fitur memakai `useAuth` dari `src/lib/auth-context`: `src/features/journals`, `attendance`, `guardian`, `academic`, `komunikasi`, `learning`, `parents`, `school`, `schedule`, `notifications`, `student-habits`, `supervision`.
- Tidak ada impor fitur yang menunjuk `src/app/Auth` (pencarian `app/Auth` dan `from '../Auth'` di `src/` hanya menemukan `src/app/*` yang mengimpor `../lib/auth-context`).
- `src/app/Auth.tsx` hanya menyediakan provider dan komponen shell; arah ketergantungan fitur → `src/lib` sudah benar.
- Bukti: `npm run lint` dan `npm run typecheck` Node v24.22.3 lulus (20 November 2026).

## 2. Audit ulang setelah perubahan (H-12 HANDOFF / H-13 ringkasan)

Status: **sebagian**. Yang dapat diverifikasi ulang tanpa akun/hosted:

| Wilayah | Status bukti | Catatan |
| --- | --- | --- |
| Lint, typecheck, unit/database, build | `npm run check` EXIT 0, **137/137** tes, 39 migration, 26 berkas JS | `check-55000.log`, 20 November 2026 |
| Browser desktop + ponsel | Hasil suite penuh pada bagian 3 | API tiruan, bukan UAT |
| Pemotongan daftar referensi (H-10/H-11 lama) | Selesai dengan `limit(cap+1)` + `ReferenceNotice` | `docs/PEMOTONGAN_DAFTAR_2026-11-20.md` |
| Dashboard per peran | Satu RPC `dashboard_overview`; RPC belum hosted | `docs/DASHBOARD_Q10_2026-11-20.md` |
| Konfirmasi laporan wali `55000` | Pesan tindak lanjut + muat ulang | `docs/ABSENSI_55000_2026-11-20.md` |
| UAT akun sekolah, Auth hosted, Security Advisor | **Belum** | Tugas pemilik; jangan diklaim lulus |
| Migration hosted | 39 lokal; hosted belum disamakan | Menunggu persetujuan dan Advisor bersih |
| Deploy Vercel / CI hosted | **Belum** | Vercel CLI tidak tersedia di host ini (X10) |

## 3. Suite browser penuh

`npx playwright test` pada Node v24.22.3, port 5377: **304/304 lulus** (desktop 1280x900 + ponsel 390x844, 12,7 menit, EXIT 0) setelah penambahan skenario `55000`. Log: `C:\Users\axioo\AppData\Local\Temp\qoder-qa-2026-11-18\browser-full-55000-5377.log`. Ini adalah angka kanonik browser menggantikan 300/304-kondisi-sebelumnya; tes memakai API tiruan, bukan UAT. Diperbarui 20 November 2026: suite penuh **312/312** (port 5401, 8,8 menit, log `...\browser-full-5401.log`) menjadi angka kanonik; `npm run check` EXIT 0 (137/137, 39 migration, 1.781 modul; log `...\check-5401.log`). Rincian di `docs/QA_COVERAGE.md`.

## 4. Kesimpulan jujur

Tidak ada klaim "aman" atau "siap operasional". Yang tertutup: ketergantungan fitur pada shell Auth, sinyal pemotongan daftar, pemanggilan dashboard berlebih, dan pesan `55000` pada konfirmasi laporan wali. Yang tetap terbuka: UAT akun nyata, penyamaan migration hosted, Security Advisor, CI/deploy hosted.
