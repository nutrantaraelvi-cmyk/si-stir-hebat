# Load balancing, caching, dan scaling

Diperiksa: 22 November 2026. Catatan ini membedakan optimasi yang sudah tersedia otomatis dari perubahan hosted yang memerlukan biaya atau rekonsiliasi skema.

## Arsitektur terverifikasi

- Frontend adalah SPA React/Vite yang dibangun menjadi berkas statis dan dipasang di Vercel. Vercel sudah melayani konten melalui CDN global; static asset tidak memerlukan server aplikasi atau load balancer tambahan.
- `vercel.json` menetapkan cache satu tahun untuk `/assets/*`, yang berasal dari nama berkas Vite ber-hash. HTML SPA dan respons API per pengguna tidak diberi cache publik. Jangan tambahkan CDN cache ke respons Data API/RPC yang berisi data sekolah atau bergantung pada sesi/RLS.
- Supabase yang terhubung ada di region `ap-northeast-2` (Seoul), paket organisasi Free, PostgreSQL 17.11.0.018. Aplikasi menggunakan Supabase Data API dari browser (`supabase-js`), bukan koneksi PostgreSQL langsung; jangan menambahkan pooler database di browser.
- Pada pemeriksaan statistik 22 November, `pg_stat_user_tables` memperkirakan tabel operasional utama belum berisi baris; `profiles` memiliki satu baris, `retention_policies` sekitar sepuluh, dan status absensi guru lima. Log 24 jam memuat 7 catatan PostgREST, 34 PostgreSQL, dan 81 PgBouncer. Belum ada bukti beban yang membenarkan read replica atau compute berbayar.

## Database: rekomendasi berbasis bukti

Performance Advisor melaporkan 15 foreign key tanpa indeks penutup dan 63 indeks yang belum terpakai. Karena project baru dan tabel operasional nyaris kosong, statistik “unused” belum cukup untuk menghapus indeks. Pertahankan sampai data dan trafik produksi memberi bukti.

Jangan terapkan migration indeks saat ini. Riwayat hosted mencatat 23 migration sampai `20261113074045`, sementara repo memiliki 39 migration. Selain itu, metadata hosted menunjukkan definisi konfigurasi sekolah yang berbeda dari berkas lokal `20261121090000_school_configuration.sql` (kolom, indeks, dan beberapa tabel tidak cocok). Rekonsiliasi migration/schema dan backup/restore harus dilakukan sebelum DDL hosted. Tidak ada perubahan hosted yang dilakukan.

Sesudah rekonsiliasi, ukur kueri aktual dengan Query Performance/`pg_stat_statements`, lalu prioritaskan indeks FK yang berada pada tabel tumbuh seperti `class_enrollments`, `teacher_assignments`, `deletion_requests`, dan `school_calendar_events`. Jangan menambah indeks pada tabel singleton atau tabel referensi kecil tanpa rencana kueri yang membutuhkannya. Periksa `EXPLAIN (ANALYZE, BUFFERS)` di staging setelah perubahan.

## Load balancing dan kapasitas

- Untuk trafik frontend, Vercel CDN sudah menjadi lapisan distribusi global. Tidak ada runtime Vercel yang perlu diskalakan untuk SPA statis ini.
- Supabase Free belum menyediakan read replicas. Read-replica load balancer memerlukan paket Pro/Team/Enterprise dan primary minimal compute Small; replica menambah tagihan compute/disk. Bila kebutuhan tiba, buat replica dekat mayoritas pengguna (mis. Singapore setelah uji latensi dari sekolah), lalu gunakan API load-balancer URL Supabase di `VITE_SUPABASE_URL`. Endpoint itu merutekan GET Data API ke primary/replica terdekat dan write ke primary. Uji replication lag sebelum mengandalkannya untuk data yang baru ditulis.
- Jangan meng-upgrade compute atau menambah replica sebelum metrik menunjukkan tekanan. Supabase menyarankan investigasi/optimasi kueri dahulu saat CPU sustained melewati 70%; untuk beban dominan write atau kurang dari kira-kira 80% read, scale-up compute lebih sesuai daripada replica.
- Pooling Supabase dikelola pada sisi layanan untuk Data API. Jika kelak ditambahkan backend serverless yang membuat koneksi PostgreSQL langsung, gunakan Supavisor transaction pooler; session pooler/direct connection cocok untuk kebutuhan sesi panjang.

## Verifikasi dan langkah berikutnya

- `vercel.json` JSON divalidasi bersama build; pastikan deployment preview mengirim `Cache-Control: public, max-age=31536000, immutable` untuk berkas `/assets/*`, dan HTML SPA tetap revalidasi.
- Vercel build/deploy, perubahan paket Supabase, replica, dan migration hosted tidak dijalankan dari repo ini.
- Sebelum implementasi hosted: rekonsiliasi migration history, verifikasi restore dari backup, dan sepakati anggaran paket/compute/replica. Setelah itu ukur CPU, koneksi, latency p95, error rate, cache hit, serta query p95 saat trafik sekolah nyata.
