# 📖 Webapp Hafalan & Murajaah Santri Al-Qur'an

Platform manajemen hafalan Al-Qur'an dan penjadwalan murajaah otomatis berbasis web modern, dilengkapi dengan integrasi **WhatsApp Gateway (Baileys Web Pairing)** untuk pengiriman notifikasi pengingat & evaluasi perkembangan santri secara massal (*bulk message*) langsung ke wali murid.

---

## 📌 Fitur Utama

### 👥 1. Manajemen Pengguna & Hak Akses (RBAC)
- **SuperAdmin**: Pengelolaan penuh akun admin, sistem audit log global, dan pemantauan aktivitas.
- **Admin**: Pengelolaan akun guru, kelas, data santri, wali murid, serta ekspor laporan hafalan & murajaah.
- **Guru**: Mencatat setoran hafalan santri, mengelola jadwal murajaah, menghubungkan akun WhatsApp via QR Code, dan mengirim pesan massal ke wali murid per kelas.

### 📖 2. Pencatatan Hafalan & Auto-Murajaah
- Form pencatatan hafalan interaktif (Surah 1-114, rentang ayat, tanggal, status lancar/kurang lancar/tidak lancar, dan catatan guru).
- **Auto-Generate Jadwal Murajaah**: Sistem secara otomatis menghitung dan membuat 4 jadwal review murajaah (interval default: H+3, H+7, H+14, H+30) setiap kali hafalan baru diinput.

### 📱 3. WhatsApp Gateway via QR Code Pairing (Baileys)
- **Pairing Tanpa API Key Meta**: Guru cukup melakukan *scan QR Code* dari aplikasi WhatsApp di smartphone untuk menghubungkan WA Guru ke webapp.
- Sesi autentikasi tersimpan aman di `.baileys_auth` dengan penanganan koneksi ulang otomatis (*auto-reconnect*).

### 🚀 4. Pesan Massal (*Bulk WhatsApp Messaging*)
- Pengiriman notifikasi massal ke seluruh wali murid per kelas.
- **Dynamic Content**: Otomatis memuat **Materi Murajaah** (Surah & Ayat), **Setoran Terakhir**, **Status Hafalan**, **Catatan Guru**, dan **Tanggal Murajaah Mendatang**.
- **Pratinjau Pesan Real-Time**: Tampilan pratinjau pesan WhatsApp (*live preview*) sebelum dikirim.
- **Tag Variabel Kustom**: Dukungan variabel `{nama}`, `{nis}`, `{hafalan}`, `{materi_murajaah}`, `{status}`, `{catatan}`, `{tanggal_murajaah}`, `{tanggal_setor}`.
- **Rate-Limiting & Queue Protection**: Jeda antrean pesan otomatis untuk menjaga kestabilan *socket* WhatsApp Web.

### 📊 5. Laporan & Audit Logs
- Ekspor laporan rekapitulasi hafalan dan murajaah ke format **CSV**.
- Pencatatan aktivitas (*Audit Logs*) untuk melacak setiap perubahan data penting.

---

## 🛠️ Stack Teknologi

- **Frontend & Backend**: Next.js 14 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite3 (`database.sqlite`) via `better-sqlite3`
- **ORM**: Drizzle ORM (`drizzle-orm`) & Drizzle Kit
- **Autentikasi**: Custom Session-Based Cookies (`hafalan_session`) & Database Sessions
- **WhatsApp Integration**: `@whiskeysockets/baileys` (WhatsApp Web API / Sockets) & `qrcode`

---

## 📋 Prasyarat Sistem

- **Node.js**: `v18.x` atau `v20.x` (LTS direkomendasikan)
- **npm** (atau `pnpm` / `yarn`)
- **Git**

---

## 🚀 Panduan Setup & Instalasi Lokal

### 1. Clone Repository
```bash
git clone https://github.com/USERNAME/webapp.git
cd webapp
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi variabel konfigurasi di dalam file `.env`:
```env
DATABASE_URL=file:database.sqlite
NEXTAUTH_SECRET=rahasia-session-hafalan-santri-super-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Intervall Murajaah dalam Hari (H+3, H+7, H+14, H+30)
MURAJAAH_INTERVALS=3,7,14,30
```

### 4. Generasi Schema & Seed Database
Jalankan perintah berikut untuk menginisialisasi tabel database SQLite dan mengisinya dengan data awal (*seed data*):
```bash
# Generate migrasi database
npm run db:generate

# Jalankan migrasi ke SQLite
npm run db:migrate

# Seed data awal (SuperAdmin, Admin, Guru, Kelas, Santri)
npm run db:seed
```

### 5. Akun Pengguna Default (Seed Data)
Setelah proses seed selesai, Anda dapat login menggunakan akun default berikut:

| Role | Email | Password |
| :--- | :--- | :--- |
| **SuperAdmin** | `superadmin@hafalan.id` | `Password123!` |
| **Admin** | `admin@hafalan.id` | `Password123!` |
| **Guru** | `guru1@hafalan.id` | `Password123!` |

### 6. Jalankan Server Pengembang
```bash
npm run dev
```
Buka browser dan akses aplikasi di: **`http://localhost:3000`**

---

## 📱 Panduan Mengatur WhatsApp Gateway Guru

1. Login sebagai **Guru** (`guru1@hafalan.id` / `Password123!`).
2. Buka menu **Hubungkan WhatsApp** di bilah navigasi samping (*Sidebar*).
3. Klik tombol **Tampilkan QR Code Pairing**.
4. Buka aplikasi **WhatsApp** di smartphone Guru → Pengaturan → **Perangkat Tertaut (Linked Devices)** → **Tautkan Perangkat**.
5. Arahkan kamera smartphone ke QR Code di layar monitor.
6. Setelah status berubah menjadi **Terhubung**, Anda siap mengirim pesan massal ke wali murid melalui menu **Pesan Massal**.

---

## 🐳 Panduan Deployment (Production)

### Opsi A: Deployment Menggunakan Docker Compose (Rekomendasi)

Proyek ini telah dilengkapi dengan `Dockerfile` dan `docker-compose.yml` multi-stage:

```bash
# Build dan jalankan kontainer di latar belakang
docker compose up -d --build
```
Aplikasi akan berjalan secara otomatis di port `3000` dengan volume database SQLite yang persisten.

---

### Opsi B: Deployment Menggunakan PM2 di VPS (Ubuntu/Debian)

1. **Build Aplikasi Production**:
   ```bash
   npm run build
   ```

2. **Jalankan dengan PM2**:
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

---

## 📂 Struktur Direktori Proyek

```text
webapp-hafalan/
├── src/
│   ├── app/                    # Next.js 14 App Router Pages & API Routes
│   │   ├── (auth)/             # Login & QR Login pages
│   │   ├── api/                # REST API Endpoints (Hafalan, Murajaah, Santri, WhatsApp, Reports)
│   │   └── dashboard/          # Dashboard (Guru, Admin, SuperAdmin)
│   ├── components/             # UI Components & Forms (BulkMessageForm, HafalanForm, dll)
│   ├── lib/
│   │   ├── auth/               # Custom session auth & RBAC helpers
│   │   ├── db/                 # Drizzle ORM schema, index, & seed
│   │   ├── murajaah/           # Auto murajaah generator algorithm
│   │   ├── surah.ts            # Mapping 114 Surah Al-Qur'an
│   │   └── whatsapp/           # Baileys client, retry mechanism, queue processing
│   └── middleware.ts           # Next.js session validation middleware
├── drizzle/                    # Migration SQL files
├── docker-compose.yml          # Production Docker compose
├── Dockerfile                  # Multi-stage Docker build
├── ecosystem.config.js         # PM2 configuration
└── README.md                   # Dokumentasi proyek
```

---

## 📄 Lisensi

Mitra / Internal Webapp Hafalan Santri — Hak Cipta Dilindungi.
