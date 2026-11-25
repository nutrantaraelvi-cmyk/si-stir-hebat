# Indeks dokumen SI STIR HEBAT

Mulai dari tiga berkas pertama. Dokumen bertanggal yang sudah tidak berlaku ada di [`archive/`](archive/). Isinya tetap menjadi riwayat, bukan acuan kerja.

## Wajib dibaca

| Dokumen | Isi |
| --- | --- |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Kondisi terkini: yang sudah terverifikasi, yang belum, gate rilis |
| [DECISIONS.md](DECISIONS.md) | Keputusan pemilik (D1–D8 dan seterusnya); mengalahkan dokumen acuan |
| [AI_COORDINATION.md](AI_COORDINATION.md) | Aturan kerja bersama antar-agen dan klaim area aktif |

## Produk dan acuan

- [references/](references/README.md): tujuh dokumen acuan (PRD, RBAC, Database, API, UI/UX, Implementasi, SAD) beserta hierarki otoritas.
- [PRD_OPERASIONAL.md](PRD_OPERASIONAL.md), [RBAC_MATRIX.md](RBAC_MATRIX.md) (dari policy RLS aktual), [RBAC_RESMI_DRAFT.md](RBAC_RESMI_DRAFT.md).
- [API_CONTRACT.md](API_CONTRACT.md): kontrak API per modul.
- [MANUAL_PENGGUNA.md](MANUAL_PENGGUNA.md).

## Arsitektur dan keamanan

- [ARSITEKTUR_APLIKASI.md](ARSITEKTUR_APLIKASI.md), [ARSITEKTUR_DATABASE.md](ARSITEKTUR_DATABASE.md), [AUDIT_ARSITEKTUR.md](AUDIT_ARSITEKTUR.md).
- [SECURITY_REVIEW.md](SECURITY_REVIEW.md), [AUDIT_KEAMANAN.md](AUDIT_KEAMANAN.md), [AUDIT_DATA_ANAK.md](AUDIT_DATA_ANAK.md), [AUDIT_PERFORMA.md](AUDIT_PERFORMA.md).
- [INFRA_SCALING_CACHE_DB.md](INFRA_SCALING_CACHE_DB.md).

## Operasional, rilis, dan database hosted

- [RUNBOOK_STAGING_DAN_MIGRASI.md](RUNBOOK_STAGING_DAN_MIGRASI.md): backup, uji restore, staging, dan penerapan migration hosted.
- [HOSTED_MIGRATION_RECONCILIATION_2026-11-22.md](HOSTED_MIGRATION_RECONCILIATION_2026-11-22.md): bukti perbedaan skema hosted.
- [AKTIVASI_DAN_RILIS.md](AKTIVASI_DAN_RILIS.md), [CI_RUNBOOK.md](CI_RUNBOOK.md), [RUNBOOK_OPERASIONAL.md](RUNBOOK_OPERASIONAL.md), [PEMELIHARAAN.md](PEMELIHARAAN.md), [CHECKLIST_PEMILIK.md](CHECKLIST_PEMILIK.md).
- Retensi: [PROSEDUR_RETENSI_OPERATOR.md](PROSEDUR_RETENSI_OPERATOR.md), [DRAFT_RETENSI_DATA_ANAK.md](DRAFT_RETENSI_DATA_ANAK.md).
- Data awal: [PONDASI_DAN_PENGISIAN_SEKOLAH.md](PONDASI_DAN_PENGISIAN_SEKOLAH.md).

## Uji dan kualitas

- [PANDUAN_UAT.md](PANDUAN_UAT.md), [UAT_CHECKLIST.md](UAT_CHECKLIST.md), [QA_COVERAGE.md](QA_COVERAGE.md).
- Desain: [DESIGN_READ.md](DESIGN_READ.md), [UI_REFERENSI_NOTES.md](UI_REFERENSI_NOTES.md).

## Log

- [IMPLEMENTATION_LOG.md](IMPLEMENTATION_LOG.md): log perubahan per tanggal (terbaru di atas).
- [logs/](logs/), [qa-logs/](qa-logs/): bukti mentah run tes.
