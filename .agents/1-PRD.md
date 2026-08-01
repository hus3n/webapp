# PRD: Webapp Hafalan Santri
**Versi:** 1.0  
**Tanggal:** Agustus 2026  
**Status:** Draft untuk Review

---

## 📄 BAGIAN 1: VISI & TUJUAN PRODUK

### Visi Produk
Webapp Hafalan Santri adalah platform digital yang memudahkan guru dan admin sekolah untuk mencatat, melacak, dan mengelola progress hafalan Al-Quran santri secara real-time. Platform ini menghubungkan guru dengan WhatsApp sehingga data hafalan dapat diakses kapan saja, menjadwalkan murajaah otomatis per surat, dan memberikan transparansi penuh kepada semua stakeholder melalui akses berbasis role.

### Tujuan Utama
1. **Digitalisasi Pencatatan Hafalan** - Menghilangkan pencatatan manual dengan sistem digital terintegrasi yang valid dan terverifikasi
2. **Penjadwalan Murajaah Otomatis** - Otomasi pembuatan jadwal review hafalan per surat setelah update baru
3. **Akses Real-time via WhatsApp** - Guru dapat mengambil data hafalan kelompoknya kapan saja melalui integrasi WhatsApp dengan login QR code
4. **Manajemen Akses Terstruktur** - Implementasi role-based access control (SuperAdmin, Admin, Guru) dengan hak akses yang jelas
5. **Deployment Mudah & Murah** - Aplikasi fullstack single-server dengan database lokal yang dapat di-deploy gratis menggunakan Docker

### Value Proposition
- **Otomasi Cerdas:** Jadwal murajaah otomatis per surat tanpa perlu input manual
- **Akses Fleksibel:** Login via QR code dan integrasi WhatsApp untuk kemudahan guru
- **Scalable & Maintainable:** Arsitektur frontend-backend terpisah memudahkan maintenance dan scaling
- **Cost Efficient:** Database lokal dan single-server setup ideal untuk sekolah dengan budget terbatas
- **User-Friendly:** Dokumentasi lengkap deployment untuk pengguna non-teknis

---

## 👥 BAGIAN 2: USER PERSONA

### Persona 1: **Ustadzah Farah (Guru Tahfidz)**
- **Usia/Pekerjaan:** 32 tahun, Guru Al-Quran (Tahfidz)
- **Level Teknis:** Pemula (bisa gunakan smartphone/WhatsApp saja)
- **Tujuan:** Mencatat hafalan santri, melihat progress, mengirim jadwal murajaah ke santri via WhatsApp
- **Pain Points:** 
  - Selama ini mencatat di buku/WhatsApp, tidak terorganisir
  - Sulit membuat jadwal murajaah untuk setiap santri per surat
  - Tidak bisa lihat riwayat hafalan santri dengan cepat
- **Motivasi:** Aplikasi yang mudah diakses via WhatsApp tanpa harus buka aplikasi baru

### Persona 2: **Bapak Ahmad (Admin Sekolah)**
- **Usia/Pekerjaan:** 45 tahun, Kepala Divisi Tahfidz
- **Level Teknis:** Menengah (biasa gunakan desktop/web)
- **Tujuan:** Mengelola semua guru dan santri, melihat statistik hafalan, membuat laporan per kelas
- **Pain Points:**
  - Perlu oversight semua data guru yang terafiliasi
  - Tidak ada dashboard untuk melihat progress keseluruhan
  - Proses onboarding guru memakan waktu
- **Motivasi:** Dashboard lengkap dengan kemudahan manajemen akun guru dan santri

### Persona 3: **Ibu Siti (SuperAdmin Pusat)**
- **Usia/Pekerjaan:** 38 tahun, Supervisor Program Tahfidz Yayasan
- **Level Teknis:** Mahir (biasa setup & maintain sistem)
- **Tujuan:** Mendaftarkan akun admin sekolah baru, monitoring dashboard admin, manage akun
- **Pain Points:**
  - Banyak sekolah yang perlu di-onboard
  - Perlu control penuh atas semua admin
- **Motivasi:** Interface admin yang powerful dengan kontrol penuh

---

## 📖 BAGIAN 3: USER STORIES

### Modul 1: Autentikasi & Akses

**US-01:** Sebagai guru baru, saya ingin login menggunakan QR code, agar proses login lebih mudah dan cepat tanpa perlu ingat password.
- **Kriteria Terima:** QR code bisa di-scan dari smartphone, session tersimpan di database, bisa diakses dari berbagai device selama session aktif

**US-02:** Sebagai admin, saya ingin mendaftarkan akun guru baru dengan email dan role, agar guru dapat langsung mengakses sistem.
- **Kriteria Terima:** Form registration guru, validasi email unik, default password auto-generate

**US-03:** Sebagai SuperAdmin, saya ingin mengelola akun admin (buat, hapus, nonaktifkan), agar control penuh atas admin sekolah.
- **Kriteria Terima:** CRUD admin dengan status aktif/nonaktif, audit log

**US-04:** Sebagai guru, saya ingin session saya tersimpan di database sampai saya logout atau dihapus admin, agar saya tidak perlu login ulang terus-menerus.
- **Kriteria Terima:** Session persistent, bisa logout manual, admin bisa force logout

---

### Modul 2: Pencatatan Hafalan

**US-05:** Sebagai guru, saya ingin mencatat hafalan santri dengan detail (tanggal, nama, surat & ayat atau hanya surat, status, catatan), agar data tercatat rapi dan terstruktur.
- **Kriteria Terima:** Form input dengan validasi, catatan maksimal 500 karakter, dropdown untuk status (lancar/kurang/ulang)

**US-06:** Sebagai guru, saya ingin melihat riwayat hafalan santri per surat, agar saya bisa tracking progress santri.
- **Kriteria Terima:** History view dengan filter per santri dan per surat, sorting by date

**US-07:** Sebagai admin, saya ingin melihat daftar hafalan semua guru yang terafiliasi, agar bisa monitoring progress keseluruhan.
- **Kriteria Terima:** List hafalan dengan filter per guru/kelas, export ke CSV

**US-08:** Sebagai guru, saya ingin edit/hapus data hafalan yang salah input, agar bisa koreksi data.
- **Kriteria Terima:** Edit form dengan timestamp change, soft delete (data tetap ada di audit log)

---

### Modul 3: Jadwal Murajaah

**US-09:** Sebagai sistem, saya ingin otomatis membuat jadwal murajaah setelah guru input hafalan baru, agar santri punya jadwal review yang jelas.
- **Kriteria Terima:** Trigger otomatis setelah input hafalan, jadwal per surat dibuat otomatis, notifikasi ke guru

**US-10:** Sebagai guru, saya ingin melihat jadwal murajaah yang sudah dibuat untuk santri saya, agar bisa komunikasikan ke santri.
- **Kriteria Terima:** Jadwal view dengan timeline, bisa filter per surat, status murajaah (belum/sudah)

**US-11:** Sebagai admin, saya ingin melihat sesi murajaah semua guru, agar bisa tracking murajaah progress.
- **Kriteria Terima:** Dashboard murajaah dengan statistik, filter per guru/bulan

---

### Modul 4: Integrasi WhatsApp

**US-12:** Sebagai guru, saya ingin query data hafalan santri saya via WhatsApp, agar bisa akses kapan saja tanpa buka aplikasi.
- **Kriteria Terima:** WhatsApp bot bisa terima command, return data hafalan dengan format rapi

**US-13:** Sebagai guru, saya ingin menerima notifikasi jadwal murajaah via WhatsApp, agar santri inget murajaah.
- **Kriteria Terima:** Notifikasi otomatis ke WhatsApp guru setiap ada jadwal baru

**US-14:** Sebagai guru, saya ingin kirim pesan bulk murajaah ke santri via WhatsApp yang terintegrasi, agar komunikasi lebih mudah.
- **Kriteria Terima:** Form kirim bulk message, template message predefined

---

### Modul 5: Manajemen Santri & Kelas

**US-15:** Sebagai admin, saya ingin membuat kelas/kelompok baru dan assign santri ke guru, agar struktur organisasi jelas.
- **Kriteria Terima:** CRUD kelas, assign guru per kelas, daftar santri per kelas

**US-16:** Sebagai guru, saya ingin melihat daftar santri di kelas saya, agar bisa manage hafalan per santri.
- **Kriteria Terima:** List santri per kelas dengan filter, search by nama

---

## ⚙️ BAGIAN 4: FUNCTIONAL REQUIREMENTS

### FR-1: Autentikasi & Login

**FR-1.1: Registrasi Akun Guru (oleh Admin)**
- **Input:** Email guru, nama lengkap, nomor HP, nomor WhatsApp, password (optional, auto-generate)
- **Proses:** Validasi email unik, hash password, simpan ke DB, generate temporary password jika auto-generate
- **Output:** Akun terdaftar, email verifikasi dengan temporary password
- **Aturan Bisnis:** 
  - Email harus unik di sistem
  - Password minimal 8 karakter jika manual, auto-generate jika kosong
  - Guru hanya bisa dibuat oleh Admin atau SuperAdmin

**FR-1.2: Login via QR Code**
- **Input:** QR code scan dari mobile device
- **Proses:** Generate unique QR code per user, scan → verify token → create session, simpan session ke database
- **Output:** Session token stored in DB, redirect ke dashboard, session tetap aktif sampai logout
- **Aturan Bisnis:**
  - QR code valid 5 menit
  - Session default 30 hari (configurable)
  - Session bisa diakses multi-device
  - Admin bisa force logout guru

**FR-1.3: Session Management**
- **Input:** Session token dari cookie/localStorage
- **Proses:** Validasi session di database setiap request, refresh session time jika aktif
- **Output:** User tetap login atau redirect ke login jika expired
- **Aturan Bisnis:**
  - Session auto-extend setiap request (rolling window)
  - Logout = delete session dari DB
  - Admin bisa lihat semua active sessions

**FR-1.4: Manajemen Akun Admin (SuperAdmin only)**
- **Input:** Email admin, nama, status (aktif/nonaktif)
- **Proses:** CRUD admin account, audit logging untuk create/update/delete
- **Output:** Admin account terdaftar atau status diupdate
- **Aturan Bisnis:**
  - SuperAdmin bisa create/delete/nonaktifkan admin
  - Nonaktifkan = session hangus otomatis
  - Audit log untuk semua perubahan

---

### FR-2: Pencatatan Hafalan

**FR-2.1: Input Data Hafalan Baru**
- **Input:** 
  - Tanggal (date picker)
  - Nama santri (dropdown dari list santri)
  - Hafalan (2 pilihan: full "Surah X Ayat Y-Z" atau "Surah X saja")
  - Status (dropdown: Lancar / Kurang Lancar / Ulang)
  - Catatan (textarea max 500 char)
- **Proses:** Validasi input, simpan ke DB, trigger otomatis buat jadwal murajaah
- **Output:** Data hafalan tersimpan, notifikasi jadwal murajaah dibuat
- **Aturan Bisnis:**
  - Guru hanya bisa input untuk santri di kelasnya
  - Tanggal tidak boleh melebihi hari ini
  - Surah harus valid (1-114)
  - Ayat harus valid sesuai surah

**FR-2.2: Edit Data Hafalan**
- **Input:** ID hafalan, field yang diubah
- **Proses:** Validasi input, update DB, log perubahan dengan timestamp & user
- **Output:** Data hafalan diupdate, history change tersimpan
- **Aturan Bisnis:**
  - Guru hanya bisa edit hafalan santri sendiri dalam 24 jam
  - Edit otomatis trigger ulang jadwal murajaah
  - Soft delete (data tetap ada di audit log)

**FR-2.3: Hapus Data Hafalan**
- **Input:** ID hafalan
- **Proses:** Soft delete (flag deleted=true), log penghapusan
- **Output:** Data hafalan tidak tampil, tapi tersimpan di audit log
- **Aturan Bisnis:**
  - Admin bisa restore data hafalan yang dihapus
  - Log penghapusan dengan user & timestamp

**FR-2.4: View Riwayat Hafalan per Santri**
- **Input:** Santri ID, filter (tanggal range, per surah)
- **Proses:** Query data hafalan dengan filter, sorting by date DESC
- **Output:** List hafalan dengan timeline, statistik per surah
- **Aturan Bisnis:**
  - Guru lihat hafalan santri sendiri
  - Admin lihat hafalan semua guru
  - View riwayat dengan chart progress

**FR-2.5: Dashboard Hafalan Admin**
- **Input:** Filter (guru, kelas, bulan)
- **Proses:** Aggregate data hafalan dari semua guru, hitung statistik
- **Output:** Dashboard dengan list hafalan, chart progress per guru/kelas
- **Aturan Bisnis:**
  - Admin lihat semua guru terafiliasi
  - Export ke CSV untuk laporan

---

### FR-3: Jadwal Murajaah Otomatis

**FR-3.1: Generate Jadwal Murajaah Otomatis**
- **Input:** Event input hafalan baru (trigger otomatis)
- **Proses:** 
  - Cek surah apa yang di-input
  - Hitung jadwal murajaah per surat (default: 3 hari, 7 hari, 14 hari, 30 hari)
  - Buat record jadwal murajaah di DB
- **Output:** Jadwal murajaah tersimpan, notifikasi dikirim ke guru via WhatsApp
- **Aturan Bisnis:**
  - Jadwal auto-generate setiap input hafalan baru per surah
  - Default interval: Day 3, Day 7, Day 14, Day 30 (configurable)
  - Jika santri sudah hafal surah sebelumnya, extend jadwal dari sebelumnya

**FR-3.2: Update Status Murajaah**
- **Input:** ID jadwal murajaah, status (belum / sedang / selesai)
- **Proses:** Update status di DB, log timestamp
- **Output:** Status murajaah diupdate, notifikasi ke santri
- **Aturan Bisnis:**
  - Guru update status murajaah
  - Status "selesai" = mark complete dengan date

**FR-3.3: View Jadwal Murajaah per Santri**
- **Input:** Santri ID
- **Proses:** Query jadwal murajaah, filter per surah, sort by date
- **Output:** Timeline jadwal murajaah dengan status
- **Aturan Bisnis:**
  - Guru lihat jadwal santri sendiri
  - Admin lihat jadwal semua santri

**FR-3.4: Dashboard Sesi Murajaah (Admin)**
- **Input:** Filter (guru, bulan, status)
- **Proses:** Aggregate jadwal murajaah, hitung completion rate
- **Output:** Dashboard murajaah dengan statistik completion
- **Aturan Bisnis:**
  - Admin lihat sesi murajaah semua guru
  - Chart progress murajaah per guru/kelas

---

### FR-4: Integrasi WhatsApp

**FR-4.1: WhatsApp Bot Query Hafalan**
- **Input:** Pesan WhatsApp dari guru dengan command (e.g., "!hafalan santri_id")
- **Proses:** Parse command, query data hafalan dari DB, format message
- **Output:** Kiriman data hafalan santri via WhatsApp
- **Aturan Bisnis:**
  - Guru hanya bisa query hafalan santri sendiri (auth check)
  - Command format: !hafalan [santri_id] atau !hafalan [nama_santri]
  - Response dengan format rapi (nama, surah, status, last update)

**FR-4.2: Notifikasi Jadwal Murajaah via WhatsApp**
- **Input:** Event jadwal murajaah baru dibuat (trigger otomatis)
- **Proses:** Ambil nomor WhatsApp guru, format message jadwal, kirim via WhatsApp API
- **Output:** Notifikasi WhatsApp ke guru tentang jadwal murajaah baru
- **Aturan Bisnis:**
  - Notifikasi otomatis setiap jadwal baru dibuat
  - Template message predefined, bisa customize
  - Retry 3x jika gagal

**FR-4.3: Bulk Message Murajaah (Guru)**
- **Input:** List santri, message template, send date/time
- **Proses:** Queue bulk message, validate nomor WhatsApp, kirim via WhatsApp API
- **Output:** Pesan bulk terkirim ke semua santri
- **Aturan Bisnis:**
  - Guru bisa schedule message ke santri kelasnya
  - Template message: "Assalamu'alaikum [nama], jadwal murajaah [surah] [tanggal]"
  - Log semua message yang terkirim

**FR-4.4: WhatsApp Session Verification**
- **Input:** QR code atau nomor WhatsApp
- **Proses:** Verify WhatsApp number registered, link ke akun guru
- **Output:** WhatsApp verified linked to account
- **Aturan Bisnis:**
  - Nomor WhatsApp harus verified saat registrasi guru
  - Satu nomor WhatsApp per guru

---

### FR-5: Manajemen Data Master

**FR-5.1: CRUD Kelas/Kelompok**
- **Input:** Nama kelas, guru, daftar santri
- **Proses:** Create/update/delete kelas, assign guru, manage santri per kelas
- **Output:** Kelas tersimpan dengan guru & santri terstruktur
- **Aturan Bisnis:**
  - Admin create kelas, assign guru
  - Guru bisa lihat santri di kelasnya
  - Satu santri bisa di multiple kelas (optional)

**FR-5.2: CRUD Santri**
- **Input:** Nama, kelompok/kelas, nomor induk santri, kontak wali
- **Proses:** Create santri, assign ke kelas/guru, setup default profile
- **Output:** Santri terdaftar, linked to kelas & guru
- **Aturan Bisnis:**
  - Admin create santri, assign ke kelas
  - Santri ID auto-generate unique

**FR-5.3: CRUD Guru (Admin)**
- **Input:** Email, nama, nomor WhatsApp, kelas yang diampu
- **Proses:** Create guru account, assign ke kelas, setup WhatsApp
- **Output:** Guru account siap, linked to kelas & santri
- **Aturan Bisnis:**
  - Admin create guru
  - Guru bisa diampu multiple kelas
  - Nomor WhatsApp wajib untuk WhatsApp integration

---

### FR-6: Role-Based Access Control

**FR-6.1: SuperAdmin Permissions**
- Mendaftarkan admin baru
- Melihat dashboard semua admin
- Delete/nonaktifkan akun admin
- Lihat audit log global
- System configuration

**FR-6.2: Admin Permissions**
- Mendaftarkan guru baru
- Melihat semua data guru terafiliasi
- Lihat daftar kelas/kelompok
- Lihat daftar hafalan semua guru
- Lihat sesi murajaah semua guru
- Manage santri & kelas
- Delete/nonaktifkan guru
- Export data ke CSV

**FR-6.3: Guru Permissions**
- Input hafalan santri sendiri
- Edit hafalan santri sendiri (24 jam window)
- Lihat riwayat hafalan santri sendiri
- Lihat jadwal murajaah santri sendiri
- Query data via WhatsApp bot
- Update status murajaah
- Kirim bulk message ke santri

---

## 🎯 BAGIAN 5: NON-FUNCTIONAL REQUIREMENTS

### NFR-1: Arsitektur & Deployment

**NFR-1.1: Fullstack Single Server**
- Backend: Node.js + Express.js (REST API)
- Frontend: React/Vue.js (SPA - Single Page Application)
- Database: SQLite (local) atau PostgreSQL (optional untuk production)
- Server: 1 instance, backend & frontend served dari server yang sama
- Containerization: Docker (docker-compose untuk easy setup)

**NFR-1.2: Database**
- Local SQLite untuk development & small deployment
- PostgreSQL support untuk scaling (optional)
- Auto-backup database setiap hari
- Database schema migration support

**NFR-1.3: Frontend-Backend Separation**
- Backend: `/api` routes
- Frontend: Static files served via backend atau separate NGINX
- API protocol: REST JSON
- CORS enabled untuk cross-origin requests

**NFR-1.4: Deployment & Installation**
- Docker Compose untuk single command deployment
- `.env` file configuration untuk easy setup
- Pre-built Docker images di Docker Hub
- Installation guide untuk non-technical users
- Scripts untuk database initialization

### NFR-2: Performa

**NFR-2.1: Response Time**
- API response time < 500ms (median)
- Page load time < 2 detik
- Database query optimization dengan index

**NFR-2.2: Scalability**
- Target 100 concurrent users per instance
- Horizontal scaling possible (dengan load balancer)
- Database connection pooling

### NFR-3: Keamanan

**NFR-3.1: Authentication & Authorization**
- Password hashing dengan bcrypt (10+ rounds)
- JWT token untuk stateless auth (optional, session-based untuk simplicity)
- Session-based auth dengan DB persistence (recommended)
- HTTPS untuk production

**NFR-3.2: Data Protection**
- Input validation di frontend & backend
- SQL injection prevention (parameterized queries)
- XSS prevention (output encoding)
- CSRF protection

**NFR-3.3: WhatsApp Integration Security**
- Verify WhatsApp number saat registrasi
- Webhook signature verification untuk WhatsApp events
- Rate limiting untuk WhatsApp queries
- Encrypt WhatsApp API credentials di .env

### NFR-4: Usability

**NFR-4.1: User Interface**
- Responsive design (mobile, tablet, desktop)
- Indonesian language
- Dark mode support (optional v2)
- Accessibility WCAG 2.1 Level AA

**NFR-4.2: Documentation**
- Setup guide untuk deployment via Docker
- API documentation (Swagger/OpenAPI)
- User manual untuk guru & admin
- Troubleshooting guide

### NFR-5: Reliability

**NFR-5.1: Uptime & Availability**
- Target 99% uptime
- Automated health check & recovery
- Database backup & recovery procedures

**NFR-5.2: Monitoring & Logging**
- Application logs (info, warning, error)
- API request logging
- Database query logging (optional)
- Error tracking & alerting

### NFR-6: Cost & Infrastructure

**NFR-6.1: Cost Optimization**
- Free tier: SQLite database (local)
- No external cloud cost (single server deployment)
- Optional: Free tier AWS/DigitalOcean/Heroku support

**NFR-6.2: Infrastructure Requirements**
- Minimum: 512MB RAM, 1 CPU, 10GB storage
- Recommended: 1GB RAM, 1-2 CPU, 20GB storage
- Docker support untuk semua platform (Windows, Mac, Linux)

---

## 📋 BAGIAN 6: OUT OF SCOPE & DEPENDENSI

### Out of Scope (V1)
1. **Mobile App Native** - V2 (saat ini hanya responsive web + WhatsApp)
2. **Advanced Analytics & Reporting** - Dashboard analytics kompleks ditunda ke V2
3. **Integration dengan Sistem Akademik Sekolah** - Integrasi dengan SIMAK/SIAKAD ditunda
4. **Multi-language Support** - V1 hanya Indonesian, multi-language di V2
5. **Two-Factor Authentication (2FA)** - V1 gunakan QR code + session, 2FA di V2
6. **Payment System** - V1 assume free/institutional use, payment system di V2
7. **Video Call/Live Chat** - Communication hanya via WhatsApp di V1

### Internal Dependencies
1. **WhatsApp Business API** - Untuk WhatsApp integration (setup: dapatkan Business Account)
2. **CORS Configuration** - Frontend & backend communication
3. **Database Migration Tool** - Untuk schema versioning

### External Dependencies
1. **WhatsApp Business API** - Required untuk WhatsApp integration
   - Setup: https://developers.facebook.com/docs/whatsapp/cloud-api
   - Cost: Free tier available
   - API Key: Perlu Business Account WhatsApp

2. **QR Code Library** - qrcode.js (npm package) untuk generate QR
   - Library: npm/qrcode atau qrcode-react

3. **Email Service** - Optional, untuk password reset email
   - Recommendation: SendGrid / Gmail SMTP (free tier)

### Assumptions
- User punya koneksi internet stabil
- Guru punya nomor WhatsApp aktif
- Admin/SuperAdmin familiar dengan Docker (atau ikut setup guide)
- Server deployment di environment yang support Docker (Linux/Windows/Mac)
- Database local tidak perlu backup eksternal (assumed small scale)
- WhatsApp Business Account dapat diakses (setup by admin)

### Technical Stack Recommendation
```
Frontend:
- React.js atau Vue.js 3
- Tailwind CSS / Bootstrap
- Axios untuk HTTP client
- Zustand / Pinia untuk state management
- React Router / Vue Router untuk routing

Backend:
- Node.js + Express.js
- SQLite / PostgreSQL
- Sequelize / TypeORM untuk ORM
- JWT atau session middleware
- CORS middleware
- Winston untuk logging

DevOps:
- Docker & Docker Compose
- GitHub Actions untuk CI/CD (optional)
- Environment variable management (.env)
```

### Success Metrics (V1)
- ✅ Deployment dapat dilakukan dalam < 30 menit oleh non-technical user
- ✅ Guru dapat input hafalan & view jadwal murajaah dalam < 2 menit
- ✅ WhatsApp query hafalan response dalam < 5 detik
- ✅ Admin dapat manage 100+ santri tanpa lag
- ✅ Uptime minimal 99% untuk V1
- ✅ API documentation lengkap untuk future AI/junior engineer development

---

## 📊 USER FLOW SUMMARY

### Flow 1: Guru Input Hafalan & Murajaah
```
Guru Input Hafalan 
→ Sistem validate 
→ Save ke DB 
→ Auto-trigger Jadwal Murajaah 
→ Notifikasi WhatsApp ke Guru 
→ Guru lihat jadwal di app atau WhatsApp
```

### Flow 2: Guru Query Hafalan via WhatsApp
```
Guru Send "!hafalan [santri_id]" 
→ WhatsApp Bot Parse 
→ Query DB 
→ Format Response 
→ Send via WhatsApp API 
→ Guru Receive Data
```

### Flow 3: SuperAdmin Manage Admin
```
SuperAdmin Login (QR Code) 
→ Dashboard Admin 
→ Create/Delete/Nonaktifkan Admin 
→ Audit Log Recorded 
→ Session Tracked in DB
```

### Flow 4: Admin Monitor Hafalan
```
Admin Login (QR Code) 
→ Dashboard Hafalan 
→ Filter per Guru/Kelas 
→ View Statistics & Charts 
→ Export CSV untuk Laporan
```

---

## 🚀 Next Steps

**1. Review PRD**
- Stakeholder review document ini
- Feedback & iterasi jika ada

**2. Buat Tech Spec**
- Breakdown architectural decisions
- Database schema detail
- API endpoint specifications
- Component specifications

**3. Setup Project**
- Initialize repo
- Setup Docker infrastructure
- Create project structure

**4. Implementasi**
- Backend API development
- Frontend development
- WhatsApp integration
- Testing & QA

---

**Document Version:** 1.0  
**Last Updated:** Agustus 2026  
**Status:** Ready for Review
