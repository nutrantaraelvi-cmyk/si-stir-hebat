# Pengukuran Bundel dan Usulan Cache (L11)

Status: 15 November 2026 (Kilo/QA)
Cakupan: L11 pada master prompt multi-AI. Pengukuran, bukan perubahan perilaku.

## 1. Hasil ukur

Perintah:

```powershell
npx vite build --outDir dist-qa-l11 --emptyOutDir
```

| Chunk | Ukuran | gzip | Dimuat |
| --- | --- | --- | --- |
| `index-*.js` (entry) | 176,48 kB | 46,09 kB | awal |
| `vendor-*.js` | 346,45 kB | 106,44 kB | awal |
| `supabase-*.js` | 222,64 kB | 58,05 kB | awal |
| `index-*.css` | 13,15 kB | 3,34 kB | awal |
| `pdf-engine-*.js` | 790,69 kB | 296,59 kB | lazy (ekspor PDF) |
| `pdf-fonts-*.js` | 419,57 kB | 225,08 kB | lazy (ekspor PDF) |
| `xlsx.worker-*.js` | 58,37 kB | — | lazy (impor Excel) |
| `academic-report-pdf-*.js` | 2,71 kB | 1,40 kB | lazy |

Muatan awal (entry + vendor + supabase + css): **758,72 kB**, gzip **≈ 213,92 kB**.

Peringatan Vite (>500 kB) hanya berasal dari `pdf-engine` dan `pdf-fonts`, keduanya sudah lazy dan hanya diunduh saat pengguna mengekspor PDF.

## 2. Yang belum dikerjakan di sini

- **P-02 (`React.lazy` per rute)** adalah tugas Copilot (L03). Rute berat seperti `/rekap`, `/absensi`, `/supervisi` masih berada dalam entry sehingga ikut pada muatan awal. Setelah P-02 masuk, ukur ulang dengan perintah pada bagian 1 dan catat "sesudah" pada tabel.
- Menurunkan `pdf-engine` berarti mengganti pustaka PDF; itu keputusan produk, bukan optimasi mandiri.

## 3. Usulan header cache (`vercel.json`)

Belum diterapkan. Penerapan mengubah perilaku hosting dan sebaiknya dilakukan bersamaan dengan L09 (CSP/header keamanan) agar satu berkas tidak direbutkan.

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    }
  ]
}
```

Alasan:

1. Berkas di `/assets` bernama sesuai hash isi, jadi aman disimpan permanen.
2. `index.html` harus selalu divalidasi agar rilis baru tidak tertahan cache.
3. Data privat tidak pernah melewati Vercel (langsung ke Supabase), sehingga tidak ada header cache untuk data pengguna.

## 4. Verifikasi yang masih dibutuhkan

- Ukur ulang setelah P-02 dan lampirkan angka "sesudah".
- Periksa header respons produksi setelah `vercel.json` diperbarui (`curl -I` pada aset berhash).
- UAT akun sekolah tetap di luar cakupan L11.