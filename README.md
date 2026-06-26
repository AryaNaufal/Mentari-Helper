# Mentari Helper 🤖

Asisten otomatisasi berbasis Chrome Extension dan Local Bridge Server untuk menyelesaikan tugas **Pre-Test** dan **Post-Test** secara otomatis pada platform E-Learning Mentari Universitas Pamulang (UNPAM).

Proyek ini menggunakan **Local Bridge Server** (Node.js) untuk menghubungkan Chrome Extension dengan skrip otomasi backend, serta memanfaatkan **FlareSolverr** untuk mem-bypass proteksi Cloudflare Turnstile secara senyap (headless) di latar belakang.

---

## ✨ Fitur Utama

- 📅 **Dynamic Weekly Filtering:** Otomatis mendeteksi pertemuan aktif berdasarkan kalender akademik mingguan mahasiswa agar tidak salah mengerjakan tugas pertemuan lain.
- 🤖 **One-Click Automation (Pre-Test & Post-Test):** Tombol "Automate" muncul secara dinamis saat berada di halaman kuis untuk menyelesaikan kuis instan secara otomatis melalui API Mentari.
- 🛡️ **Zero-Browser Cloudflare Bypass:** Bekerja sama dengan FlareSolverr di Docker untuk memecahkan Turnstile tanpa perlu membuka jendela browser baru di komputer host Anda.
- 🔑 **Dynamic Token Extraction:** Otomatis mendeteksi token JWT aktif dari browser Anda untuk otentikasi aman tanpa perlu menuliskan kredensial di kode program.

---

## 📋 Prasyarat Sistem

Sebelum menjalankan, pastikan komputer Anda telah terinstall:
1. **Node.js** (Versi 16 atau lebih baru) -> [Download Node.js](https://nodejs.org/)
2. **Docker Desktop** (Untuk menjalankan FlareSolverr) -> [Download Docker](https://www.docker.com/products/docker-desktop/)

---

## 🛠️ Panduan Instalasi & Pengaturan

### Langkah 1: Jalankan FlareSolverr di Docker
Buka terminal (CMD/PowerShell/Terminal) di komputer Anda, lalu jalankan perintah berikut untuk mengunduh dan menjalankan kontainer FlareSolverr:
```bash
docker run -d --name=flaresolverr -p 8191:8191 -e LOG_LEVEL=info --restart always ghcr.io/flaresolverr/flaresolverr:latest
```
*Pastikan port `8191` di komputer Anda tidak bentrok.*

### Langkah 2: Jalankan Bridge Server Lokal
1. Buka folder repository ini di komputer Anda.
2. Buka terminal pada direktori tersebut, lalu jalankan server Node.js:
   ```bash
   node server.js
   ```
3. Server lokal akan mulai berjalan di `http://localhost:3000`. Pastikan terminal ini tetap terbuka selama penggunaan.

### Langkah 3: Pasang Chrome Extension
1. Buka Google Chrome dan masuk ke alamat: **`chrome://extensions/`**
2. Aktifkan **Developer mode** di pojok kanan atas.
3. Klik tombol **Load unpacked** di pojok kiri atas.
4. Pilih folder **`mentari-extension`** yang berada di dalam direktori repository ini.
5. Ekstensi **Mentari E-Learning Helper** sekarang aktif di browser Anda.

---

## 🚀 Cara Penggunaan

1. Buka situs resmi **[Mentari UNPAM](https://mentari.unpam.ac.id/)** dan login ke akun Anda.
2. Klik tombol bulat mengambang dengan ikon matahari/robot di pojok kanan bawah untuk membuka dashboard asisten.
3. Masuk ke halaman **Pre-Test** atau **Post-Test** pertemuan aktif yang ingin Anda kerjakan.
4. Di pojok kanan bawah (di atas tombol panel utama), tombol **`🤖 Automate`** akan muncul secara otomatis.
5. Klik tombol **`🤖 Automate`** tersebut.
6. Proses pengerjaan akan didelegasikan ke server lokal Anda dan berjalan di terminal secara real-time. Setelah sukses, tombol akan berubah warna menjadi hijau (`✅ Berhasil!`) dan menampilkan notifikasi sukses di halaman browser Anda.

---

## ⚠️ Disclaimer
Proyek ini dibuat murni untuk tujuan pembelajaran, penelitian keamanan web (Cloudflare bypass), dan mempermudah aksesibilitas tugas akademik mahasiswa secara pribadi. Pengembang tidak bertanggung jawab atas penyalahgunaan alat ini yang melanggar ketentuan akademik kampus masing-masing. Gunakan dengan bijak!
