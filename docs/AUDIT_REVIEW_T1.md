# Review T1 — Branch `agent/kilo/qa-suite-stabil`

Tanggal: 14 November 2026. Reviewer: Qoder. Sifat: baca-saja; tidak ada perubahan kode atau tes.
Basis review: `03b87c0`. Komit yang ditinjau: `135fef8` ("test(browser): stabilkan selector alert dan impor Excel"), satu berkas: `tests/browser/app.spec.ts` (+27/−27).

## Isi perubahan

1. Sebelas assertion `getByRole('alert')` diganti dengan filter teks spesifik, misalnya `getByRole('alert').filter({ hasText: 'Tidak dapat masuk' })`. Ini menghilangkan benturan ketika dashboard menampilkan beberapa alert sekaligus.
2. Dua assertion ringkasan (`Ringkasan kepala sekolah`, `Ringkasan data sekolah`, kabar pengumuman) kini memakai pesan lengkap yang unik.
3. Unggah XLSX tidak lagi memakai `filechooser`; langsung `setInputFiles` pada input, dengan batas tunggu preview 15 detik karena parsing berjalan di worker.
4. Kasus jurnal "respons tidak pasti" dipersempit ke alert `Penyimpanan belum dapat dipastikan.`; alur pemeriksaan ulang hanya dijalankan bila alert itu terlihat.
5. Loop rekap akademik (`truncated`/`overflow`/`failure`) memfilter tiga pesan error yang memang dipakai UI.

Seluruh teks baru diverifikasi ada di `src` (Account, Dashboard, Password, master, Attendance/AttendanceReport/AttendanceImport, Journals, AssessmentDetail/AssessmentHistory, TaskSubmissions, Schedules/ScheduleProposals, SchoolOverview). Perubahan hanya pada tes; tidak menyentuh aplikasi, migration, atau konfigurasi.

## Verifikasi yang dijalankan

- `npx playwright test --list` pada working tree yang sama: 180 tes terdaftar.
- Run terfokus 8 skenario × 2 proyek pada port terpisah 5198: **14 lulus, 2 gagal**.
- Kegagalan: `principal dashboard distinguishes missing counts from zero and retries` (desktop) dan `attendance report rejects long ranges and never exports a partial failed load` (desktop). Keduanya bukan kegagalan assertion, melainkan `Test timeout ... Tearing down "context"` — gejala teardown yang sudah tercatat di T1.
- Kedua tes diulang sendiri-sendiri: lulus (6,9 detik dan 5,5 detik). Pada run kedua, Vite mencatat `EBUSY` saat memantau `src/features/komunikasi/api/index.ts` yang sedang dibuat agen lain, lalu proses Node berhenti; tes tetap lulus sebelum itu.
- Tidak dijalankan: suite penuh 180 tes, desktop dan ponsel, dengan repo tenang dan log tersimpan.

## Temuan review

| ID | Tingkat | Temuan |
| --- | --- | --- |
| R-01 | Sedang | Belum ada bukti suite penuh. T1 tidak dapat ditutup berdasarkan run terfokus; kegagalan batch adalah teardown, bukan selector. |
| R-02 | Sedang | Perubahan lebih luas dari dua selector yang disebut T1 (27 baris). Isinya wajar, tetapi mengikat tes pada teks UI yang spesifik; setiap perubahan copy kini memerlukan pembaruan tes. |
| R-03 | Rendah | Batas tunggu preview XLSX 15 detik menutupi worker lambat di mesin sibuk; berguna untuk CI, tetapi jangan dipakai untuk menyembunyikan kegagalan parser. |
| R-04 | Rendah | Run webServer mencatat Node v26.13.0, sementara proyek mensyaratkan Node 24.x. Pastikan CI/runner memakai Node 24 agar hasil dapat dibandingkan. |

## Penilaian

- Perubahan selector **layak dipertahankan**: filter teks spesifik adalah pola yang sudah dipakai tes lain dan memperbaiki ambiguitas nyata.
- Branch **belum cukup untuk menutup T1**: penyebab utama (teardown menggantung) tidak diperbaiki dan belum ada log suite penuh. Jangan merge dengan klaim "180/180 lulus".
- Saran: jalankan suite penuh pada worktree tenang (tanpa agen lain menulis `src`), Node 24, port khusus, simpan log; lampirkan hasil di papan. Bila teardown tetap menggantung, diagnosis konfigurasi Playwright/Vite (webServer, watcher, context close) sebagai tugas terpisah.
- Jangan menggabungkan perubahan tes ini dengan commit fitur lain; branch hanya berisi satu berkas tes.

Berkas yang ditinjau: `tests/browser/app.spec.ts` (branch), `src/app/Account.tsx`, `src/app/Dashboard.tsx`, `src/app/SchoolOverview.tsx`, `src/app/PrincipalOverview.tsx`, `src/lib/password.ts`, `src/features/attendance/*`, `src/features/journals/Journals.tsx`, `src/features/school/*`, `src/features/academic/*`, `src/features/learning/TaskSubmissions.tsx`, `src/features/schedule/*`. Tidak ada file yang diubah.
