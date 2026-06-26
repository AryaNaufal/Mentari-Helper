# Mentari Helper 🎓

Asisten akademik berbasis **Chrome Extension** untuk mahasiswa Universitas Pamulang (UNPAM). Bekerja langsung di browser tanpa server tambahan, mendukung dua platform sekaligus: **Mentari E-Learning** dan **MyUnpam**.

---

## ✨ Fitur Utama

### 🌐 Mentari E-Learning (`mentari.unpam.ac.id`)
| Fitur | Keterangan |
|---|---|
| 🏠 **Dashboard** | Informasi profil, status token, dan aksi cepat |
| 📚 **Daftar Kelas** | Daftar semua mata kuliah dengan progres penyelesaian |
| 🤖 **Auto Pre-Test & Post-Test** | Tombol otomatisasi muncul dinamis saat berada di halaman kuis |
| 📋 **Auto Kuesioner** | Mengisi kuesioner akhir semester secara otomatis via DOM |
| 📅 **Dynamic Weekly Filtering** | Mendeteksi pertemuan aktif berdasarkan kalender akademik |

### 🏛️ MyUnpam (`my.unpam.ac.id`)
| Fitur | Keterangan |
|---|---|
| 📊 **Jadwal & Presensi** | Melihat jadwal kuliah dan rekap kehadiran per mata kuliah |
| 📈 **Rangkuman Nilai** | Melihat KHS per semester beserta IPK dan total SKS, lengkap dengan tombol **Cetak Rangkuman Nilai (PDF)** |
| 💳 **Keuangan & Pembayaran** | Pantau status tagihan dan riwayat pembayaran SPP |
| 🔍 **KRS & Kelas** | Sinkronisasi KRS aktif dan pencarian jadwal kelas alternatif |
| 🎓 **Tugas Akhir & Skripsi** | Pantau judul, status bimbingan, dan data dosen pembimbing |
| 👤 **Profil & Akademik** | Biodata lengkap mahasiswa + tracker IPS per semester dengan ring chart IPK |
| 📢 **Informasi Kampus** | Daftar informasi dan dokumen resmi dari universitas |

---

## 🏗️ Arsitektur

Extension ini berjalan **sepenuhnya di dalam browser** (browser-native, no-bridge).

```
Chrome Extension (content.js)
        │
        ├── mentari.unpam.ac.id  →  Menu E-Learning (Daftar Kelas, Otomatisasi)
        │
        └── my.unpam.ac.id       →  Menu Akademik (Nilai, Keuangan, KRS, TA, Profil)
```

- **Token JWT** diambil otomatis dari `localStorage`/`cookie` browser saat Anda login.
- **Data di-cache** di `chrome.storage.local` agar tidak perlu memuat ulang setiap sesi.
- **Tidak ada server eksternal** — semua request dilakukan langsung ke API resmi UNPAM dari browser.

---

## 🛠️ Instalasi

### Prasyarat
- Google Chrome (atau browser berbasis Chromium)

### Langkah Instalasi
1. Clone atau download repository ini.
2. Buka Chrome dan masuk ke **`chrome://extensions/`**
3. Aktifkan **Developer mode** di pojok kanan atas.
4. Klik **Load unpacked**, lalu pilih folder **`mentari-extension`**.
5. Ekstensi langsung aktif — tidak ada server yang perlu dijalankan.

---

## 🚀 Cara Penggunaan

### Di Mentari (`mentari.unpam.ac.id`)
1. Login ke akun Anda di Mentari.
2. Klik tombol mengambang **🌟** di pojok kanan bawah untuk membuka panel.
3. Tab **Daftar Kelas** menampilkan semua mata kuliah dan progres penyelesaiannya.
4. Buka halaman Pre-Test atau Post-Test — tombol **🤖 Automate** muncul otomatis.
5. Klik **Automate** untuk menyelesaikan kuis secara instan.

### Di MyUnpam (`my.unpam.ac.id`)
1. Login ke akun Anda di MyUnpam.
2. Klik tombol mengambang di pojok kanan bawah untuk membuka panel.
3. Pilih menu yang diinginkan dari sidebar (Presensi, Nilai, Keuangan, dll.).
4. Klik tombol **Sinkronisasi** pada masing-masing menu untuk memuat data terbaru.
5. Data akan tersimpan di cache dan langsung tampil saat Anda membuka panel kembali.

---

## ⚠️ Disclaimer

Proyek ini dibuat murni untuk tujuan **pembelajaran** dan **mempermudah aksesibilitas informasi akademik** mahasiswa secara pribadi. Pengembang tidak bertanggung jawab atas penyalahgunaan alat ini yang melanggar ketentuan akademik institusi. Gunakan dengan bijak!
