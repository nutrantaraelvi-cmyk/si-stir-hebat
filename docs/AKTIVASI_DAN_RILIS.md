# Aktivasi SI STIR HEBAT

## Checklist aktivasi operator

Tandai setiap butir setelah diverifikasi langsung pada proyek yang benar. Jangan menaruh kata sandi, OTP, token, service-role key, atau password database di repository maupun chat.

### Administrator dan pendaftaran akun

- [ ] Pemilik sekolah membuat akun administrator pertama pada proyek Supabase yang benar, menyelesaikan verifikasi email, dan menyimpan kredensial hanya di pengelola kata sandi sekolah.
- [ ] Operator mencocokkan UID akun dengan tepat satu profil `pending`, menetapkan peran administrator memakai prosedur SQL terbatas di bawah, lalu memastikan aplikasi menampilkan dashboard Administrator.
- [ ] Setelah akun pertama aktif, nonaktifkan pendaftaran publik pada Authentication → Settings → User Signups. Akun berikutnya dibuat operator dan diberi peran setelah identitasnya diverifikasi.
- [ ] Pastikan tidak ada akun atau data sekolah nyata yang dimasukkan sebelum UAT dan pemeriksaan akses peran disetujui.

### Supabase Auth, URL, dan email pemulihan

- [ ] Site URL menunjuk ke domain produksi HTTPS yang benar.
- [ ] Redirect URL mencantumkan tepat `https://DOMAIN/kata-sandi`; tambahkan URL lokal hanya bila diperlukan. Jangan memakai wildcard yang lebih luas dari kebutuhan.
- [ ] Pengiriman email pemulihan siap untuk penggunaan sekolah. Minta email pemulihan, ikuti tautan, tetapkan kata sandi baru, lalu pastikan pengguna kembali ke aplikasi.
- [ ] Uji login, logout, refresh halaman terlindungi saat logout, dan pemulihan kata sandi dengan akun uji yang berwenang.

### Vercel dan rahasia

- [ ] Root Directory `.`; install `npm ci`; build `npm run build`; output `dist`; runtime Node `24.x`.
- [ ] Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` pada scope Production Vercel dengan nilai dari proyek Supabase yang sama.
- [ ] Isi Preview hanya bila diperlukan, memakai konfigurasi proyek uji yang sesuai.
- [ ] Pastikan tidak ada service-role key, secret key, password database, PAT, atau kredensial admin di variabel `VITE_*`, log, maupun repository.

### Verifikasi sebelum operasional

- [ ] CI pada commit yang akan dirilis lulus lint, typecheck, tes unit/database, build, dan tes browser.
- [ ] UAT login, logout, pemulihan kata sandi, serta akses administrator, kepala sekolah, guru, siswa, dan wali disetujui dengan akun uji.
- [ ] Pemilik sekolah meninjau matriks RBAC, skema nilai sementara, konfigurasi backup/pemulihan, dan status aktivasi administrator.
- [ ] Site URL, redirect, signup publik, email pemulihan, dan env Vercel diverifikasi pada konfigurasi hosted; hasilnya dicatat tanpa menyimpan rahasia.

## Aktifkan administrator pertama

Dilakukan sendiri oleh pemilik proyek Supabase. Jangan mengirim kata sandi, OTP atau token melalui chat atau menyimpannya dalam repository.

1. Buka proyek Supabase yang dipakai aplikasi, Authentication → Users. Buat akun operator sekolah menggunakan alamat email yang dikuasai sekolah. Selesaikan verifikasi email sesuai pengaturan proyek. Gunakan kata sandi unik dan kuat.
2. Salin User UID akun tersebut. Akun baru otomatis mendapat profil `pending`.
3. Pada SQL Editor proyek yang sama, jalankan pernyataan berikut setelah mengganti placeholder dengan UID yang benar. Periksa hasilnya tepat satu baris. Ini memberi akses administrator; gunakan hanya untuk operator yang memang berwenang.

```sql
update public.profiles
set role = 'administrator'
where id = 'GANTI_DENGAN_UUID_AKUN_SEKOLAH'::uuid
  and role = 'pending'
returning id, role;
```

4. Buka aplikasi, masuk dengan akun itu, lalu isi nama profil melalui menu Akun. Dashboard harus menampilkan Administrator. Jika tetap pending, keluar dan masuk ulang. Jika SQL tidak mengembalikan baris, periksa UID/proyek dan profil; jangan mengubah akun lain sebagai percobaan.
5. Setelah fitur akun sekolah dan migration terkait diterapkan, masuk sebagai administrator dan buka **Akun sekolah**. Cari nama atau email, cocokkan identitas dengan data sekolah, pilih peran, lalu centang konfirmasi dan tetapkan. Jika akun belum muncul, minta pemilik akun memverifikasi email dan muat ulang daftar. Akun guru, siswa, dan wali tetap perlu ditautkan ke data sekolah yang sesuai.

## Urutan persiapan sekolah

1. Isi identitas sekolah, tahun ajaran dan semester.
2. Isi mata pelajaran serta kelas pada tahun ajaran yang benar.
3. Tambahkan registri guru dan siswa.
4. Verifikasi dan tautkan akun guru/siswa melalui Tautan akun. Tautkan wali hanya sesudah hubungan anak diverifikasi sekolah.
5. Masukkan keanggotaan kelas dan penugasan guru. Jadwal dan akses guru memerlukan penugasan aktif.
6. Buat jadwal pelajaran. Uji satu alur lengkap dengan akun uji sekolah: absensi, materi/tugas, pengumpulan, penilaian dan publikasi.
7. Pastikan akun siswa/wali hanya menerima data yang semestinya. Nilai masih memakai maksimum per asesmen dan publikasi manual; belum menghitung rapor.

## Import repository ke Vercel

- Repository berisi aplikasi langsung di root; Root Directory Vercel: `.`.
- Framework: Vite. Node: 24.x. Install: `npm ci`. Build: `npm run build`. Output: `dist`.
- Isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` pada Environment Variables Vercel untuk Production. Ambil dari proyek Supabase yang benar, setelah riwayat migration hosted dicocokkan. Jangan memakai nilai tiruan CI.
- Jangan memasukkan service-role key, secret key, password database atau token admin ke variabel `VITE_*`.
- `vercel.json` menyediakan fallback SPA agar `/dashboard`, `/jadwal` dan route lain dapat dibuka langsung.
- Snapshot repository ini berisi 22 berkas migration; catatan operasional menyatakan proyek hosted sudah mencatat 23 migration. Kedua riwayat belum direkonsiliasi. Jangan menerapkan migration dari snapshot ini ke hosted atau mereset database. Perubahan database memerlukan migration baru, pengujian lokal, pencocokan riwayat hosted, dan persetujuan pemilik sebelum penerapan.

## Setelah mendapatkan alamat deployment

1. Di Supabase Authentication → URL Configuration, set Site URL ke domain produksi HTTPS. Tambahkan URL redirect tepat `https://DOMAIN/kata-sandi`. Tambahkan alamat lokal hanya bila dibutuhkan pengembang. Konfigurasi lokal tidak otomatis memperbarui pengaturan hosted.
2. Periksa pengiriman email pemulihan melalui akun milik sekolah. Pastikan layanan email/SMTP proyek siap untuk penggunaan sekolah dan alur pemulihan benar-benar selesai.
3. Uji login, refresh route langsung, logout, penolakan akses saat sudah keluar, dan pemulihan kata sandi.
4. Uji satu peran guru, siswa dan wali dengan data uji yang diberi label Data Contoh; jangan mengimpor seluruh data sekolah sebelum pemeriksaan peran selesai.
5. Simpan alamat produksi, pemilik akun hosting/database, prosedur backup dan pemulihan, serta kontak operator dalam catatan internal sekolah, bukan repository publik.

## Operasional

Vercel meng-host frontend; Supabase melayani Auth, database dan berkas privat. Pantau keduanya. Pilih kapasitas/backup Supabase sesuai penggunaan, uji pemulihan backup, dan evaluasi kuota serta email sebelum peluncuran. Rollback frontend tidak membatalkan migration database. Simpan perubahan database sebagai migration baru dan uji sebelum diterapkan.

Workflow `.github/workflows/verify.yml` berada di root repository mandiri ini. Workflow memakai Node 24, menjalankan `npm ci`, `npm run check`, memasang Chromium, lalu menjalankan `npm run test:browser` dengan endpoint dan kunci publishable tiruan khusus tes. Hasil CI tidak membuktikan login/email produksi berhasil. Status siap pakai penuh membutuhkan deployment terverifikasi dan UAT operator sekolah.

## Deployment aktif — 14 November 2026

Alamat produksi: https://si-stir-hebat-blue.vercel.app

Deployment Vercel berstatus READY. HTTP halaman utama, /login, /jadwal dan /kata-sandi berhasil. Browser produksi ponsel berhasil menampilkan login, tidak memakai mode demo, dan mengalihkan /jadwal ke login saat belum memiliki sesi. Tidak ada akun/data pribadi yang dipakai dalam pemeriksaan ini.

Langkah pemilik sekolah yang masih diperlukan:

1. Supabase Authentication → URL Configuration: Site URL `https://si-stir-hebat-blue.vercel.app`; tambahkan redirect `https://si-stir-hebat-blue.vercel.app/kata-sandi`.
2. Aktifkan administrator pertama mengikuti panduan di atas, lalu uji login dan pemulihan email.
3. Vercel Account Settings → Login Connections: hubungkan GitHub. Integrasi repo otomatis belum berhasil karena koneksi login ini belum ada. Deployment saat ini dilakukan melalui CLI; push GitHub belum otomatis berarti produksi berubah.
4. Jalankan UAT peran sekolah sebelum memasukkan data operasional.

Konfigurasi frontend Supabase telah disimpan pada environment Production Vercel. Kredensial admin database tidak disertakan. Node produksi dikunci 24.x sesuai pengujian.
