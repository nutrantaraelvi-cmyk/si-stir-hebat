## Ringkasan

<!-- 1–3 kalimat: apa yang diubah dan mengapa. -->

## Bukti verifikasi

<!-- Tempel perintah dan hasil nyata. Jangan menulis "lulus" tanpa keluaran. -->

- `npm run check` (Node 24):
- `npm run test:browser` (desktop + ponsel):
- Log/artefak:

```
<paste output>
```

## Berkas yang diubah

<!-- Daftar berkas. Sebutkan bila menyentuh area agen lain. -->

## Batas verifikasi

<!-- Yang belum diverifikasi, mis. UAT akun sekolah, migration hosted, Storage. -->

## Checklist

- [ ] Tidak menyentuh `supabase/migrations` yang sudah tercatat
- [ ] Tidak ada secret/service role key di kode, log, atau env `VITE_*`
- [ ] Tidak ada data sekolah atau orang nyata (data uji berlabel "Data Contoh")
- [ ] `npm run check` lulus dan keluarannya ditempel di atas
- [ ] Teks UI dan pesan galat berbahasa Indonesia
- [ ] Perubahan perilaku/kebijakan sudah dicatat di `docs/DECISIONS.md`
- [ ] Ref `docs/AI_COORDINATION.md` diperbarui (status + branch)

## Untuk pemilik

<!-- Keputusan yang menunggu persetujuan, atau "—". -->