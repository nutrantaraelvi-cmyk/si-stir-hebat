# Catatan Referensi UI

Diperiksa: 22 November 2026. Referensi dipakai untuk mengamati pola umum; identitas, teks, kode, ikon, dan aset visualnya tidak disalin.

## Kemendikdasmen

https://www.kemendikdasmen.go.id/

Halaman dapat dibuka. Struktur yang tampak mengelompokkan navigasi informasi institusi, pencarian, kabar utama, informasi terkini, program, dan data agregat. Judul berita menonjol di atas ringkasan dan tautan lanjutan. Pola yang relevan: urutan informasi yang jelas, kartu berita yang mudah dipindai, label bagian, serta pemisahan layanan dan kabar.

## INI LHO ITS

https://inilho.its.ac.id/

Halaman dapat dibuka. Hero memakai komposisi ilustrasi besar dan ajakan bertindak; daftar program disusun per bagian. Pita kategori berulang terlihat sebagai elemen bergerak. Pola yang relevan: ilustrasi dekoratif yang ringan, hover dan fokus yang memberi umpan balik singkat, serta gerakan dekorasi yang tidak membawa informasi penting. Implementasi proyek tetap harus berhenti bergerak saat `prefers-reduced-motion` aktif.

## Penerapan pada SI STIR HEBAT

- Pertahankan hierarki informasi portal sekolah dan Bahasa Indonesia yang jelas.
- Gunakan warna ungu, lilac, biru muda, dan pink proyek sendiri; jangan gunakan identitas institusi referensi.
- Terapkan gerak hanya pada dekorasi dan interaksi ringan, tanpa menunda konten atau mengubah teks maupun label aksesibilitas.

## Tema ceria — 25 November 2026

Diperiksa ulang dengan screenshot desktop 1280×900 dan ponsel 390×844. Pola yang diadopsi ke `src/styles/theme-playful.css` (dimuat terakhir, tanpa mengubah logika halaman):

- Bingkai gelap tebal (`--outline`) dan bayangan keras tanpa blur (`--pop-1/2/3`) pada kartu, panel, tabel, dan tombol.
- Tombol, tab, dan menu aktif berbentuk pil; menu aktif biru muda dengan garis dalam.
- Latar bertitik halus; hero beranda dan footer berwarna ungu tua bertitik.
- Header publik berbentuk kapsul mengambang; sidebar tetap dipakai setelah login.
- Pita teks miring sebagai pemisah bagian beranda; chip label di atas judul; lencana nomor bulat.
- Judul memakai Poppins 800, navigasi dan tombol memakai Montserrat 700, isi tetap Inter.

Yang tidak diambil: logo, nama acara, ilustrasi, foto, dan warna kuning khas referensi. Aksen tetap ungu tua, lilac, biru muda, dan pink sesuai D8. Seluruh pasangan warna baru lulus WCAG AA (terendah 5,36:1 untuk bingkai input, 6,64:1 untuk teks). Efek hover hanya untuk perangkat ber-pointer dan semua pergeseran dimatikan pada `prefers-reduced-motion`.
