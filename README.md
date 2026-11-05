# SIGURU MUTU — Frontend

Sistem Informasi Guru, Tendik, dan Penjaminan Mutu Internal Sekolah (UPT SMP Negeri 3 Batipuh).

Frontend statis (HTML/CSS/JS vanilla, tanpa build) untuk GitHub Pages. Seluruh data diambil dari backend Google Apps Script lewat `fetch()` JSON. Repository ini **tidak** berisi kode backend, ID spreadsheet/folder, kunci, sandi, maupun data pegawai.

## Struktur

```
index.html          kerangka aplikasi + Content-Security-Policy
css/style.css       token desain, tema terang/gelap, komponen
js/config.js        satu-satunya konfigurasi: URL /exec Apps Script
js/transport.js     adapter HTTP (POST text/plain, tanpa preflight)
js/core.js          h() aman-XSS, Api (dedupe + batch), cache SWR, Router
js/ui.js, icons.js, xlsx.js   komponen, ikon, ekspor Excel
js/app.js           login, gerbang keamanan, shell, menu per peran
js/hal-*.js         halaman: umum, administrasi, supervisi, mutu, laporan
```

## Konfigurasi

Isi `js/config.js` dengan URL Web App Apps Script (berakhiran `/exec`):

```js
window.APP_CONFIG = { GAS_URL: 'https://script.google.com/macros/s/ID_DEPLOYMENT/exec' };
```

## Pembaruan

Setelah mengubah berkas, naikkan `?v=` di `index.html` agar peramban memuat versi baru, lalu jalankan `git add . && git commit -m "..." && git push`.

Panduan lengkap (backend, deploy, konfigurasi awal, keamanan, kendala umum) ada di `PANDUAN-INSTALASI.md`.
