# Runbook staging, backup, dan penerapan migration hosted

Status: disiapkan 25 November 2026. **Belum dijalankan.** Setiap langkah yang menulis ke project Supabase hosted memerlukan persetujuan eksplisit pemilik. Langkah ini dijalankan oleh operator yang memegang password database. Agen AI tidak menjalankannya.

Kondisi awal (lihat [rekonsiliasi 22 November](HOSTED_MIGRATION_RECONCILIATION_2026-11-22.md)): hosted mencatat 23 migration sampai `20261113074045`. Repository memiliki 44 migration, sehingga 21 belum hosted. Enam tabel konfigurasi hosted berbeda bentuk dari migration lokal. Tabel-tabel itu ditangani oleh `20261121085900_quarantine_hosted_config_drift.sql`.

## 0. Aturan

- Jangan pernah mencetak, menempel ke chat, atau meng-commit password database, service-role key, atau URL koneksi. Simpan di variabel lingkungan sesi terminal saja.
- Urutan wajib: **staging dulu, produksi belakangan.** Jangan melewati satu migration pun dan jangan menandai versi sebagai diterapkan secara manual (`migration repair`) untuk menutupi selisih.
- Berhenti dan catat di `docs/PROJECT_STATUS.md` bila ada langkah yang gagal.

## 1. Gate sebelum menyentuh produksi

1. Aktifkan **Leaked password protection** di Supabase Dashboard → Authentication → Policies (atau Settings → Password security). Jalankan Security Advisor sampai tidak ada WARN.
2. Pastikan `npm run check` lulus di commit yang akan diterapkan (Node 24).
3. Pemilik menyetujui secara tertulis: commit, daftar migration, dan jadwal di luar jam sekolah.

## 2. Backup produksi (paket Free tidak punya PITR)

Ambil connection string *Session pooler* dari Dashboard → Connect. Isi variabel lingkungan tanpa menampilkannya:

```powershell
$env:PROD_DB_URL = Read-Host -MaskInput "URL database produksi"
$stamp = Get-Date -Format "yyyyMMdd-HHmm"
New-Item -ItemType Directory -Force "..\backup-si-stir-hebat\$stamp" | Out-Null
npx supabase db dump --db-url $env:PROD_DB_URL -f "..\backup-si-stir-hebat\$stamp\roles.sql" --role-only
npx supabase db dump --db-url $env:PROD_DB_URL -f "..\backup-si-stir-hebat\$stamp\schema.sql"
npx supabase db dump --db-url $env:PROD_DB_URL -f "..\backup-si-stir-hebat\$stamp\data.sql" --use-copy --data-only
```

- Folder backup berada **di luar repository** dan berisi data pribadi anak. Simpan terenkripsi (misalnya BitLocker) dan batasi aksesnya.
- Berkas di bucket Storage (`supervision-evidence`) tidak ikut `db dump`. Unduh terpisah melalui Dashboard → Storage bila bucket sudah berisi berkas.

## 3. Uji restore ke project staging

1. Buat project Supabase baru bernama `si-stir-hebat-staging` di region yang sama. Paket Free mengizinkan dua project aktif.
2. Restore backup ke staging:

   ```powershell
   $env:STAGING_DB_URL = Read-Host -MaskInput "URL database staging"
   psql --single-transaction --variable ON_ERROR_STOP=1 `
     --file roles.sql --file schema.sql `
     --command "SET session_replication_role = replica" --file data.sql `
     --dbname $env:STAGING_DB_URL
   ```

3. Bandingkan jumlah baris tabel utama antara produksi dan staging (`select count(*)` per tabel). Catat hasilnya. Langkah ini menjadi **bukti backup/restore** yang selama ini menjadi gate.

## 4. Terapkan migration di staging

```powershell
npx supabase link --project-ref <ref-staging>
npx supabase migration list            # harus 23 tercatat, 21 lokal saja
npx supabase db push --dry-run         # tinjau daftar; harus dimulai dari 20261114000139
npx supabase db push
```

Sesudah itu:

- `select table_name from information_schema.tables where table_schema = 'drift_archive';` menampilkan tabel drift yang dikarantina. Datanya tetap utuh.
- Jalankan `npm run check:supabase` dengan `.env.local` sementara yang menunjuk ke staging (URL + publishable key staging). Semua tabel harus menolak akses anonim.
- Security Advisor dan Performance Advisor staging: catat sisa peringatan.

## 5. Data drift yang dikarantina (diputuskan D12, 25 November 2026)

Tabel di `drift_archive` tidak dipakai aplikasi. Keputusan pemilik:

| Tabel | Tindakan |
| --- | --- |
| `retention_policies` | **Tidak dipindahkan.** Berlaku nilai lokal D5: komunikasi dan bukti supervisi 1 tahun ajaran, yang lain sesuai D5. Periksa dengan `select * from public.retention_policies order by category;`. |
| `deletion_requests` | **Dipindahkan**, dengan `guardian` diganti `parent` (SQL di bawah). |
| `school_calendar_events`, `teacher_document_types`, `teacher_attendance_status_types`, `grading_settings` | Periksa jumlah baris lebih dulu. Jika kosong atau hanya berisi nilai bawaan, tidak ada yang perlu dipindahkan. Jika berisi data sekolah, laporkan ke pemilik sebelum memindahkannya. |

Pertama, lihat kolom hosted yang sebenarnya, karena inventaris 22 November hanya mencatat metadata:

```sql
select column_name, data_type from information_schema.columns
where table_schema = 'drift_archive' and table_name = 'deletion_requests' order by ordinal_position;
select subject_type, status, count(*) from drift_archive.deletion_requests group by 1, 2;
```

Lalu pindahkan dalam satu transaksi. Sesuaikan nama kolom bila hasil di atas berbeda. Permintaan yang sudah diputuskan atau dilaksanakan dibawa sebagai `pending` disertai catatan, karena invariant status lokal mewajibkan pelaku dan waktu keputusan yang mungkin tidak ada di hosted:

```sql
begin;
insert into public.deletion_requests (id, requester_name, subject_type, subject_description, reason, created_by, created_at)
select d.id,
       d.requester_name,
       case d.subject_type when 'guardian' then 'parent' else d.subject_type end,
       d.subject_description || case when d.status <> 'pending' then ' [status hosted: ' || d.status || ']' else '' end,
       d.reason, d.created_by, d.created_at
from drift_archive.deletion_requests d
on conflict (id) do nothing;
select subject_type, count(*) from public.deletion_requests group by 1;  -- tidak boleh ada 'guardian'
commit;
```

Hapus tabel karantina hanya setelah pemindahan diverifikasi dan backup baru diambil (`drop schema drift_archive cascade;`, dengan persetujuan pemilik).

## 6. UAT di staging

1. Atur Authentication → URL Configuration staging: Site URL = alamat Preview Vercel, Redirect URLs = `<preview>/**`.
2. Buat administrator pertama sesuai [Aktivasi](AKTIVASI_DAN_RILIS.md#aktifkan-administrator-pertama).
3. Gunakan akun uji sintetis (nama berlabel "Data Contoh") untuk lima peran. Jangan memakai data murid asli di staging.
4. Jalankan [Panduan UAT](PANDUAN_UAT.md) dan [Checklist UAT](UAT_CHECKLIST.md). Catat lulus/gagal per skenario.

## 7. Produksi

Ulangi langkah 4 terhadap project produksi **hanya setelah** langkah 3 (restore teruji), 4 (staging bersih), dan 6 (UAT lulus) selesai dan pemilik menyetujui. Ambil backup baru (langkah 2) tepat sebelum `db push`. Setelah itu:

- `npx supabase migration list` harus menunjukkan 44/44.
- `npm run check:supabase` terhadap produksi harus lulus.
- Smoke test login di produksi dengan akun administrator.

## 8. Rollback

Migration bersifat forward-only. Bila produksi rusak setelah `db push`:

1. Hentikan akses (Vercel → nonaktifkan deployment, atau tampilkan pemeliharaan).
2. Restore dari backup langkah 7 ke project baru, verifikasi, lalu arahkan env Vercel ke project itu. Atau perbaiki dengan migration baru bila kerusakannya kecil.
3. Catat insiden di `docs/PROJECT_STATUS.md`.
