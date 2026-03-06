# Product Requirements Document (PRD)
## FM-ID Tour&Travel

### 1. Project Overview
- **Nama Website:** FM-ID Tour&Travel
- **Bidang Usaha:** Tour and Travel
- **Alamat:** JL.Hanjawar pacet, Cipanas Puncak kota Bunga no 40
- **Kontak CS (WhatsApp):** 082215197172
- **Google Maps:** 
  ```html
  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d86679.34684829535!2d107.01847845239787!3d-6.710580180915561!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69b1cea0423117%3A0xae00fd4778c50344!2sKota%20bunga%20puncak!5e1!3m2!1sen!2sid!4v1772810264876!5m2!1sen!2sid" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  ```

### 2. Produk & Layanan
Website ini menangani pencarian, perencanaan, dan pemesanan untuk:
1.  **Keliling Tamasya (Destinasi Wisata)**
2.  **Sewa Akomodasi (Hotel & Villa)**
3.  **Tiket Pesawat**

### 3. Area Cakupan & Data Awal (Katalog)
Berikut adalah daftar destinasi dan akomodasi untuk setiap area area operasional yang disediakan:

#### A. Jakarta
*   **Destinasi Tamasya:** Monumen Nasional (Monas), Taman Mini Indonesia Indah (TMII), Taman Impian Jaya Ancol, Kawasan Kota Tua.
*   **Akomodasi (Hotel & Villa):** Hotel Indonesia Kempinski, The Ritz-Carlton Mega Kuningan, Villa Kemang Botanica.

#### B. Bandung
*   **Destinasi Tamasya:** Kawah Putih Ciwidey, Tangkuban Perahu, Trans Studio Bandung, Jalan Braga, Lembang Park & Zoo.
*   **Akomodasi (Hotel & Villa):** The Trans Luxury Hotel, Padma Hotel Bandung, Villa Air Natural Resort Lembang.

#### C. Puncak
*   **Destinasi Tamasya:** Taman Safari Indonesia, Kebun Raya Cibodas, Little Venice Kota Bunga, Taman Bunga Nusantara, Telaga Warna.
*   **Akomodasi (Hotel & Villa):** Palace Hotel Cipanas, Le Eminence Puncak Hotel Resort, Villa Kota Bunga Blok Q, Villa Aries Biru.

#### D. Bali
*   **Destinasi Tamasya:** Pantai Kuta, Pura Uluwatu, Garuda Wisnu Kencana (GWK), Ubud Monkey Forest, Pura Ulun Danu Beratan.
*   **Akomodasi (Hotel & Villa):** The Apurva Kempinski Bali, Ayana Resort & Spa, Villa Seminyak Estate, Hanging Gardens of Bali.

### 4. Fitur Utama
#### 4.1. Trip Plan (Rencana Trip Anda)
*   **Konsep:** Fitur menyerupai keranjang belanja (*cart*) interaktif yang disesuaikan untuk travel. Memungkinkan pengguna untuk mencicil dalam memilih dan menyimpan destinasi wisata serta akomodasi secara bersamaan.
*   **Indikator UI:** Terdapat *floating icon* berbentuk **koper (suitcase) yang dianimasikan** di sudut layar. Ikon ini akan menampilkan jumlah item yang telah ditambahkan.
*   **Pengelolaan Trip Plan:** Saat ikon ditekan, pengguna akan melihat rincian destinasi dan akomodasi yang telah dipilih, dengan kemampuan menghapus item jika berubah pikiran.
*   **Proses Checkout (WhatsApp Integration):** 
    Ketika pengguna menekan tombol "Checkout" atau "Kirim Rencana", sistem secara otomatis memformulasikan pesanan pengguna dan meneruskannya (redirect) ke chat WhatsApp Admin. Seluruh pemesanan dan pembayaran akan dilakukan secara manual di WhatsApp.
    *   **Format Pesan:**
        > Halo admin, saya berencana tamasya ke {list destinasi} dan ingin menginap di {list hotel&villa}, tolong berikan info detail.

#### 4.2. Tiket Pesawat
*   **Konsep:** Formulir pengajuan pemesanan tiket pesawat (Rute, Tanggal, Jumlah Penumpang dll). Data ini kemudian diteruskan secara manual ke WhatsApp Admin untuk proses pencarian tiket dan pembayaran.

#### 4.3. CMS Dashboard (Admin)
*   **Konsep:** Halaman atau panel bagi pengelola web untuk memperbarui konten (Destinasi & Akomodasi) tanpa bantuan developer.
*   **Sistem:** Karena pembayaran manual dan sederhana, sebuah custom dashboard sederhana menggunakan backend seperti PHP dengan API akan digunakan untuk mengelola data operasional travel CMS ini.

### 5. Arsitektur & Teknologi (Usulan)
*   **Platform:** Full-Stack web untuk melayani *Frontstore* pelanggan dan *Dashboard Admin*.
*   **Tema Khusus (Tren 2026):** **"Oceanic Neo-Elegance"**
    *   Berfokus pada tata letak ultra-modern yang memadukan kesan dapat dipercaya, relaksasi, dan premium. 
    *   **Warna Primer:** Deep Teal (`#0B3D3B`) - memberi nuansa stabil dan eksklusif.
    *   **Warna Sekunder:** Muted Sand (`#F4F1EA`) atau Soft Coral - memberi sentuhan liburan, pantai, dan ramah.
    *   **Gaya UI:** *Glassmorphism* (efek kaca tembus pandang ber-blur) di atas elemen yang melayang (*floating*), dipadukan dengan *micro-animations* yang sangat halus (misal: tombol yang merespons sebelum di-klik).
    *   **Gambar/Aset Visual:** Penggunaan visual beresolusi tinggi (sementara menggunakan aset hasil *AI Generation*) sebagai *placeholder* agar desain terlihat premium.
