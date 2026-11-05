# Panduan Instalasi SIGURU MUTU v1.0.0

Sistem Informasi Guru, Tendik, dan Penjaminan Mutu Internal — UPT SMP Negeri 3 Batipuh.
Arsitektur: frontend statis (HTML/CSS/JS vanilla) di **GitHub Pages** + **Google Apps Script** sebagai REST API JSON + tiga Google Sheets dan Google Drive.

---

## 0. Isi paket

| Berkas | Tujuan |
|---|---|
| `Kode.gs`, `Inti.gs`, `Auth.gs`, `Sdm.gs`, `Supervisi.gs`, `Mutu.gs`, `Laporan.gs`, `Trigger.gs`, `Setup.gs`, `appsscript.json` | Ditempel ke proyek Apps Script (backend). **Tidak** masuk GitHub. |
| `siguru-mutu.zip` | Frontend. Folder hasil ekstraknya (`siguru-mutu`) adalah folder yang di-`git init`. |
| `PANDUAN-INSTALASI.md` | Dokumen ini (salinannya juga ada di dalam ZIP). |

Siapkan: akun Google **milik sekolah** sebagai pemilik skrip (agar aplikasi tidak berhenti saat pengelola berganti), akun GitHub `pakguru1928-tech`, dan Git di komputer.

> Akun `@guru.smp.belajar.id` dikelola admin domain. Bila di langkah Deploy pilihan **Anyone** tidak muncul (hanya "Anyone within …"), domain melarang akses publik. Pakai akun Google sekolah lain yang mengizinkan **Anyone**, karena frontend di GitHub Pages memanggil API tanpa login Google.

---

## Bagian A — Backend (Google Apps Script)

**Langkah 1. Buat proyek.** Login dengan akun sekolah, buka https://script.google.com, klik **Proyek baru**, lalu ganti nama proyek menjadi `SIGURU MUTU API`.

**Langkah 2. Tampilkan manifest.** Klik ⚙️ **Setelan proyek**, centang **Tampilkan file manifes "appsscript.json" di editor**, lalu kembali ke **Editor**.

**Langkah 3. Tempel berkas.**
1. Buka `appsscript.json` di editor, hapus isinya, lalu tempel isi `appsscript.json` dari paket.
2. Ganti nama `Kode.gs` bawaan menjadi `Kode`, lalu tempel isi `Kode.gs`.
3. Untuk setiap berkas lain, klik **＋ → Skrip**, beri nama tanpa `.gs` (`Inti`, `Auth`, `Sdm`, `Supervisi`, `Mutu`, `Laporan`, `Trigger`, `Setup`), lalu tempel isinya.
4. Klik 💾 **Simpan**. Urutan berkas di editor tidak berpengaruh.

**Langkah 4. Jalankan `setupAwal` (sekali).**
1. Di dropdown fungsi, pilih **setupAwal**, lalu klik ▶ **Jalankan**.
2. Klik **Tinjau izin**, pilih akun sekolah, lalu **Lanjutkan**. Izin yang diminta mencakup Sheets, Drive, Docs, kirim email, pemicu, dan permintaan ke luar (untuk gambar QR).
3. Buka **Log eksekusi** dan **catat sekarang** tiga kredensial yang hanya tampil sekali:
   ```
   🔐 AKSES DARURAT → nama pengguna: darurat | kata sandi: XXXXXXXXXXXXXXXX
   👤 Akun KEPALA SEKOLAH → nama pengguna: kepsek | sandi awal: XXXXXXXXXX
   👤 Akun OPERATOR       → nama pengguna: operator | sandi awal: XXXXXXXXXX
   ```
4. Cek Google Drive. Folder **SIGURU MUTU** harus berisi 3 spreadsheet (`DB_RAHASIA`, `DB_SDM`, `DB_MUTU`) dan subfolder Dokumen Pribadi, Bukti Kerja, Laporan & PDF, Cadangan, dan Template (berisi template PDF dan Template Impor Pegawai).

`setupAwal` aman dijalankan ulang. Rahasia, akun, dan data yang sudah ada tidak ditimpa, dan kolom yang belum ada ditambahkan di akhir sheet.

**Langkah 5. Deploy Web App.** Klik **Terapkan → Penerapan baru → ⚙️ Pilih jenis → Aplikasi web**, lalu isi:
- Deskripsi: `Produksi v1.0.0`
- Jalankan sebagai: **Saya**
- Yang memiliki akses: **Siapa saja (Anyone)**

Klik **Terapkan**, lalu **salin URL Aplikasi web** yang berakhiran `/exec`.

**Langkah 6. Uji API.** Buka URL `/exec` di peramban. Harus tampil JSON `{"ok":true,"data":{"aplikasi":"SIGURU MUTU",...}}`.

> **Jangan bagikan** ketiga spreadsheet, dan jangan tambah editor proyek Apps Script sembarangan. Siapa pun yang punya akses edit bisa melihat Script Properties (rahasia sesi, pepper). Cukup dua admin tepercaya.

---

## Bagian B — Frontend (GitHub Pages, akun `pakguru1928-tech`)

**Langkah 7. Ekstrak ZIP.** Hasilnya folder `siguru-mutu`. Pastikan di dalamnya langsung ada `index.html`, `css/`, dan `js/`.

**Langkah 8. Isi `js/config.js`.** Buka dengan Notepad, ganti `GANTI_DENGAN_ID_DEPLOYMENT` dengan URL `/exec` dari Langkah 5, lalu simpan.
```js
window.APP_CONFIG = { GAS_URL: 'https://script.google.com/macros/s/AKfy..../exec' };
```

**Langkah 9. Buat repository** di github.com (masuk sebagai `pakguru1928-tech`). Klik **＋ → New repository**, beri nama `siguru-mutu`, pilih **Public**, dan **jangan** centang README/.gitignore/license.

**Langkah 10. Push dari terminal.** Buka PowerShell **di dalam folder `siguru-mutu`**: di File Explorer, klik address bar, ketik `powershell`, lalu Enter. Jalankan `dir` dulu dan pastikan `index.html` ada di daftar teratas. Kalau yang terlihat justru folder `siguru-mutu`, masuk dulu dengan `cd siguru-mutu`.
```powershell
git init
git add .
git commit -m "SIGURU MUTU v1.0.0"
git branch -M main
git remote add origin https://github.com/pakguru1928-tech/siguru-mutu.git
git push -u origin main
```
Saat diminta *Password*, tempelkan **Personal Access Token** (bukan sandi akun). Layar memang tidak menampilkan apa pun saat token ditempel; itu normal.

**Langkah 11. Aktifkan Pages.** Di repo, buka **Settings → Pages**. Source: **Deploy from a branch**, Branch: **main / (root)**, lalu **Save**. Setelah 1–2 menit situs aktif di `https://pakguru1928-tech.github.io/siguru-mutu/`.

**Langkah 12. Uji.** Buka situs, lalu masuk dengan `kepsek` dan sandi awal. Aplikasi akan meminta ganti sandi, lalu menampilkan pernyataan data pribadi. Setelah disetujui, Beranda tampil.

---

## Bagian C — Konfigurasi awal (urutan yang disarankan)

1. **Pengaturan → Ambang & Sistem**: isi **URL aplikasi** (`https://pakguru1928-tech.github.io/siguru-mutu/`). URL ini dipakai QR dan tautan verifikasi di PDF. Periksa juga nama sekolah, kota tanda tangan, logo, dan ambang warna.
2. **Pengaturan → Data Master → Semester**: sesuaikan tanggal mulai/selesai semester aktif. Tanggal ini menentukan nomor minggu rekap. Periksa juga mapel dan rombel.
3. **Pengaturan → Pegawai**: ubah nama dan NIP akun "Kepala Sekolah (ubah nama)" dan "Operator Sekolah (ubah nama)".
4. **Pengaturan → Impor**: unduh template CSV, atau isi *Template Impor Pegawai* di folder Template. Klik **Pindai (dry-run)**, periksa peringatan, lalu **Jalankan impor**. Unduh kredensial awal, bagikan ke masing-masing guru secara pribadi, lalu **hapus berkasnya**. Impor aman diulang tanpa membuat data dobel.
5. **Pengaturan → Label Penugasan**: Operator (tendik), Tim Mutu/Auditor, Wali Kelas, Guru BK, dan Pembina Ekskul.
6. **Supervisi → Penugasan**: pasangkan supervisor dengan guru binaan. Label Supervisor diberikan otomatis.
7. **Kelola Instrumen**: instrumen contoh sudah terbit sebagai v1. Gunakan **Sunting** untuk membuat v2 sesuai lembar supervisi sekolah, lalu **Terbitkan**.
8. **SPMI → Menetapkan**: 8 standar beserta indikator contoh sudah dibuat dari standar nasional pendidikan. Sesuaikan dengan standar yang ditetapkan sekolah, termasuk target semester pertama.
9. Setelah login operator berhasil, **ganti sandi akses darurat**. Jalankan `resetAksesDarurat()` dari editor, lalu simpan sandi barunya di tempat aman.

---

## Bagian D — Kecepatan & kuota

Teknik yang membuat perpindahan menu terasa instan:
- **Boot sekali**: saat login, satu respons memuat profil, hak akses, data master, dan beranda.
- **Prefetch dalam satu batch**: saat peramban senggang, data menu utama sesuai peran diambil dalam satu panggilan (maks. 10 aksi).
- **Stale-while-revalidate**: halaman yang pernah dibuka tampil langsung dari cache sesi (uji: ±30 ms), lalu diperbarui di latar.
- **Cache server berversi** (CacheService, dipecah bila > 100 KB): panggilan kedua tidak membaca Sheets sama sekali.
- **Kunci singkat**: PDF dan email dibuat di luar kunci tulis; simpan otomatis penilaian hanya menulis baris yang berubah.
- **Pemanas cache** tiap 5 menit pada jam sekolah (Senin–Sabtu 06.00–17.59).

Untuk melihat waktu nyata, buka konsol peramban (F12) lalu ketik `Perf.summary()` atau `Perf.table()`. Kolom `server` adalah waktu kerja Apps Script; selisihnya adalah jaringan dan *cold start* Google.

Kuota Apps Script (lama eksekusi pemicu per hari, email per hari) berbeda antara akun pribadi dan Workspace for Education. Periksa https://developers.google.com/apps-script/guides/services/quotas. Bila kuota pemicu menipis, jalankan `matikanPemicuHangat()`. Aplikasi tetap berjalan, hanya permintaan pertama di pagi hari sedikit lebih lambat. Untuk menyalakannya lagi, jalankan `nyalakanPemicuHangat()`. Untuk melihat kondisi cache dan pemicu, jalankan `cekPerforma()`. Setelah mengedit data langsung di Google Sheets, jalankan `bersihkanCache()` agar perubahan langsung terbaca.

Pemicu yang dipasang `setupAwal`:

| Pemicu | Jadwal | Tugas |
|---|---|---|
| `pemicuHarian` | 05.00 | Hitung capaian otomatis, tandai RTL terlambat, simpan riwayat dashboard, buat PDF tertunda, kirim email ringkasan, anonimisasi data pribadi lewat masa simpan |
| `pemicuJumat` | Jumat 15.00 | Pengingat rekap mingguan untuk guru yang belum mengisi |
| `pemicuCadangan` | Minggu 02.00 | Salin 3 database ke folder Cadangan (retensi 8 salinan) |
| `pemicuHangat` | tiap 5 menit, jam sekolah | Pemanas cache |

---

## Bagian E — Keamanan & privasi

- **Script Properties** (⚙️ Setelan proyek) menyimpan `SESSION_SECRET`, `PEPPER`, `HASH_ITER`, kredensial darurat (hash + salt), ID spreadsheet dan folder, serta ID template. Semua dibuat otomatis oleh setup; jangan diubah manual.
- **Sandi** disimpan sebagai HMAC-SHA256 iteratif dengan salt unik per akun dan pepper. Untuk melihat waktu hash di akun Anda (target 0,3–0,8 detik), jalankan `ujiKecepatanHash()`.
- **Sesi**: token HMAC berlaku 6 jam, diperpanjang otomatis selama ada aktivitas, dan disimpan di `sessionStorage` sehingga hilang saat tab ditutup. "Keluar dari semua perangkat" ada di Profil.
- **Data pribadi** selalu tampil tersamar (mis. NIK `1306********0001`). Tombol **Tampilkan** oleh orang lain wajib diisi keperluan dan tercatat di Log Akses Data Pribadi.
- **Pengawas dan operator** tidak menerima nilai supervisi per guru maupun data pribadi mentah di respons server. Pengawas hanya mendapat rata-rata dan distribusi predikat sekolah.
- **Bila terjadi kebocoran**, jalankan `insidenGantiPepper()`. Fungsi ini mengganti pepper, mengeluarkan semua sesi, dan membuat sandi darurat baru, lalu semua akun harus direset admin. Setelah itu cabut berbagi folder Drive, simpan log, laporkan ke kepala sekolah, dan beri tahu pihak terdampak sesuai Pasal 46 UU PDP. Cocokkan prosedur rincinya dengan PP No. 33 Tahun 2026.
- **QR di PDF** dibuat lewat layanan `quickchart.io`, yang hanya menerima URL verifikasi publik. Bila layanan itu tidak bisa dijangkau, QR dilewati dan kode verifikasi tetap tercetak.
- Kode verifikasi membuktikan dokumen diterbitkan oleh aplikasi; ini **bukan** tanda tangan elektronik tersertifikasi.

---

## Bagian F — Memperbarui aplikasi

**Backend:** salin kode lama ke berkas cadangan, tempel kode baru, lalu **Simpan**. Buka **Terapkan → Kelola penerapan → ✏️ Edit → Versi: Versi baru → Terapkan**. Jangan membuat *Penerapan baru*, karena URL `/exec` akan berubah.

**Frontend:** salin berkas baru ke folder `siguru-mutu` (jangan unggah lewat web GitHub), naikkan `?v=` di `index.html`, lalu jalankan:
```powershell
git add .
git commit -m "Pembaruan"
git push
```
Tunggu 1–2 menit, lalu tekan **Ctrl+Shift+R**.

---

## Bagian G — Kendala umum

| Gejala | Penyebab | Solusi |
|---|---|---|
| "Konfigurasi belum lengkap" | `js/config.js` belum diisi | Isi `GAS_URL`, lalu push ulang |
| Situs 404 | `git init` di folder induk | Push ulang dari folder yang berisi `index.html` (`git push --force`) |
| "Gagal menghubungi server" | Deploy belum **Anyone**, atau URL salah | Periksa Langkah 5; uji URL `/exec` di peramban |
| "Database belum disiapkan" | `setupAwal` belum dijalankan/gagal | Jalankan ulang `setupAwal`, lalu baca log |
| Perubahan backend tidak berlaku | Belum membuat versi baru | Kelola penerapan → Edit → Versi baru |
| Berkas bukti tidak bisa dibuka via tautan | Domain melarang "siapa saja yang punya tautan" | Normal: berkas dibuka lewat server (tombol Lihat) |
| PDF "sedang dibuat" | PDF dibuat di antrean | Tunggu ±1 menit atau buka ulang; pemicu juga memprosesnya |
| Akun terkunci | 5× salah sandi | Tunggu 15 menit atau **Pengaturan → Akun → Buka** |
| NIP terpotong saat impor | Kolom NIP berformat angka | Format kolom sebagai Teks, lalu impor ulang |
| Data yang diedit langsung di Sheets tidak muncul | Cache server (berlaku s.d. 6 jam) | Jalankan `bersihkanCache()` dari editor. Sebaiknya ubah data lewat aplikasi; bila harus di Sheets, jangan ubah kolom `id` dan baris judul |

---

## Bagian H — Penyesuaian terhadap PRD & mockup

1. **Arsitektur langsung terpisah** (GitHub Pages + API) sesuai PRD bagian 9, tanpa tahap HtmlService.
2. **Versi instrumen dikunci per jadwal.** Jadwal menyimpan versi yang aktif saat jadwal dibuat (mitigasi risiko PRD bagian 10), dan versi itu dikunci saat penilaian dibuka (5.5.3). Penilaian lama tidak pernah berubah.
3. **Pengawas** melihat rekap supervisi yang disahkan tanpa nilai per guru. Ini menyelaraskan matriks RBAC dengan kriteria penerimaan 8.4.
4. **Operator** hanya menerima data pribadi tersamar. Nilai asli dibuka lewat tombol Tampilkan yang tercatat; ini menyelaraskan 6.3 dengan 8.4.
5. **Kartu "Wali Kelas" berisi nama dan kesehatan siswa** di mockup **tidak dibuat**, karena aplikasi tidak menyimpan data pribadi siswa (6.1).
6. **Klaim "BSrE/TTE" dan "visitasi BAN-PDM"** di mockup tidak ditampilkan. Dokumen memakai kode verifikasi + QR internal.
7. **Urutan stepper SPMI** mengikuti PRD (Menetapkan → … → Mengendalikan).
8. **Capaian per standar** memakai rasio indikator yang dibatasi maks. 100% agar satu indikator yang melampaui target tidak menutupi indikator lain yang merah.
9. **Tambahan skema**: sheet `Usulan_Perubahan`, `Berkas` (registri izin berkas), dan `Dokumen_Terbit` (kode verifikasi semua PDF); kolom `bobot`/`arah` pada indikator, `id_versi` pada jadwal, dan `tanggapan_guru` pada hasil supervisi.
10. **Standar, indikator, dan instrumen bawaan adalah contoh.** Belum dicocokkan dengan isi Permendikdasmen No. 21 Tahun 2026, sehingga wajib disesuaikan tim mutu.

## Keputusan terbuka untuk kepala sekolah (PRD bagian 10)
- [ ] Kolom data pribadi yang benar-benar diperlukan (NIK dan alamat bersifat opsional)
- [ ] Akun Google sekolah pemilik skrip, spreadsheet, dan folder
- [ ] Masa simpan data pribadi pegawai nonaktif (bawaan 5 tahun, ubah di Pengaturan)
- [ ] Standar, indikator, dan target semester pertama
- [ ] Ambang warna dan rentang predikat (nilai bawaan PRD sudah terpasang)
- [ ] Instrumen supervisi sekolah yang didigitalkan (via Sunting → v2)
