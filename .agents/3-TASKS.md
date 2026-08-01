# Tasks: Webapp Hafalan Santri

**Berdasarkan:** 2-TECH-SPEC.md v1.0
**Tanggal Dibuat:** 2026-08-01
**Prioritas:** Setup dulu → Fitur Inti → Fitur Pendukung

---

## Modul: Setup

### T-01
- **Judul:** Setup Project Next.js 14 + TypeScript + Tailwind
- **Deskripsi:** Inisialisasi project Next.js 14 (App Router) dengan TypeScript, Tailwind CSS, dan struktur folder sesuai Tech Spec (src/app, src/components, src/lib, src/hooks, src/stores, src/types)
- **Modul:** Setup
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** -
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** package.json, tsconfig.json, tailwind.config.js, next.config.js, src/app/layout.tsx, src/app/page.tsx, src/app/globals.css

### T-02
- **Judul:** Setup Drizzle ORM + SQLite
- **Deskripsi:** Install & konfigurasi Drizzle ORM dengan better-sqlite3, buat drizzle.config.ts, setup koneksi DB di src/lib/db
- **Modul:** Setup
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-01
- **Tanggal:** 2026-08-01
- **Estimasi:** 1 jam
- **File yang diubah:** drizzle.config.ts, src/lib/db/index.ts, package.json

### T-03
- **Judul:** Definisikan Database Schema (Drizzle)
- **Deskripsi:** Buat schema Drizzle untuk semua entity: users, sessions, kelas, kelas_guru, santri, hafalan, jadwal_murajaah, whatsapp_sessions, audit_logs sesuai Entity Overview di Tech Spec, termasuk index strategy
- **Modul:** Setup
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-02
- **Tanggal:** 2026-08-01
- **Estimasi:** 3 jam
- **File yang diubah:** src/lib/db/schema.ts

### T-04
- **Judul:** Generate & Run Migration + Seed Data
- **Deskripsi:** Generate migration dari schema, jalankan migrasi, buat seed script untuk data awal (superadmin default, contoh kelas/santri)
- **Modul:** Setup
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-03
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** drizzle/, src/lib/db/seed.ts, package.json

### T-05
- **Judul:** Setup Environment Variables & Config
- **Deskripsi:** Buat .env.example dengan semua variable dari Tech Spec (DATABASE_URL, NEXTAUTH_SECRET, WHATSAPP_*, MURAJAAH_INTERVALS, dll)
- **Modul:** Setup
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-01
- **Tanggal:** 2026-08-01
- **Estimasi:** 30 menit
- **File yang diubah:** .env.example, .gitignore

---

## Modul: Authentication

### T-06
- **Judul:** Setup NextAuth.js v5 Configuration
- **Deskripsi:** Konfigurasi NextAuth v5 dengan credentials provider (email/password), session strategy database-backed, callback untuk role-based session. **Catatan:** NextAuth v5 tidak mendukung DB session untuk Credentials provider, sehingga diimplementasikan custom session-based auth (config + helper) yang memenuhi semua requirement session management di Tech Spec (DB session, rolling window, multi-device, force logout)
- **Modul:** Authentication
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-04
- **Tanggal:** 2026-08-01
- **Estimasi:** 3 jam
- **File yang diubah:** src/lib/auth/config.ts, src/app/api/auth/[...nextauth]/route.ts, src/types/next-auth.d.ts

### T-07
- **Judul:** Implementasi Password Hashing & Login API
- **Deskripsi:** Buat utility bcrypt hashing (12 rounds), implementasi POST /api/auth/login dengan validasi Zod
- **Modul:** Authentication
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-06
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/lib/auth/password.ts, src/app/api/auth/login/route.ts

### T-08
- **Judul:** Implementasi QR Login Flow
- **Deskripsi:** Buat GET /api/auth/qr-generate (crypto.randomUUID + expiry 5 menit) dan POST /api/auth/qr-verify, simpan token sementara. QR token disimpan di tabel DB qr_tokens (bukan in-memory) karena antar route handler Next.js dev tidak berbagi state proses
- **Modul:** Authentication
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-07
- **Tanggal:** 2026-08-01
- **Estimasi:** 3 jam
- **File yang diubah:** src/app/api/auth/qr-generate/route.ts, src/app/api/auth/qr-verify/route.ts, src/lib/auth/qr-token.ts

### T-09
- **Judul:** Implementasi Logout & Session Management API
- **Deskripsi:** Buat POST /api/auth/logout, GET /api/auth/sessions (list active sessions untuk admin), DELETE /api/auth/sessions/[id] (force logout)
- **Modul:** Authentication
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-08
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/api/auth/logout/route.ts, src/app/api/auth/sessions/route.ts, src/app/api/auth/sessions/[id]/route.ts

### T-10
- **Judul:** Buat Middleware Role-Based Access Control
- **Deskripsi:** Middleware Next.js untuk validasi session di setiap request, cek role (Guru/Admin/SuperAdmin), redirect ke login jika expired. Catatan: middleware Next.js 14 berjalan di Edge (tanpa akses better-sqlite3), jadi middleware cek cookie & redirect, validasi session/role penuh di API route via requireRole() dan di halaman via requirePageUser()
- **Modul:** Authentication
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-09
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/middleware.ts, src/lib/auth/rbac.ts

### T-11
- **Judul:** Halaman Login & QR Login (Frontend)
- **Deskripsi:** Buat halaman /login (form email/password) dan /qr-login (tampilkan QR code, polling status verifikasi)
- **Modul:** Authentication
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-10
- **Tanggal:** 2026-08-01
- **Estimasi:** 3 jam
- **File yang diubah:** src/app/(auth)/login/page.tsx, src/app/(auth)/qr-login/page.tsx, src/components/forms/LoginForm.tsx

---

## Modul: User Management

### T-12
- **Judul:** API CRUD Users
- **Deskripsi:** Implementasi GET /api/users (list by role), POST /api/users (create admin, SuperAdmin only), PATCH /api/users/[id], DELETE /api/users/[id] (soft delete)
- **Modul:** User Management
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-10
- **Tanggal:** 2026-08-01
- **Estimasi:** 3 jam
- **File yang diubah:** src/app/api/users/route.ts, src/app/api/users/[id]/route.ts

### T-13
- **Judul:** API Admin Daftarkan Guru
- **Deskripsi:** Implementasi POST /api/auth/register untuk admin mendaftarkan guru baru dengan validasi Zod dan verifikasi WhatsApp number
- **Modul:** User Management
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-12
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/api/auth/register/route.ts

### T-14
- **Judul:** Halaman Manajemen User (Frontend)
- **Deskripsi:** Buat halaman dashboard untuk Admin/SuperAdmin kelola user (list, tambah guru, edit status)
- **Modul:** User Management
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-13
- **Tanggal:** 2026-08-01
- **Estimasi:** 3 jam
- **File yang diubah:** src/app/dashboard/admin/users/page.tsx, src/components/forms/UserForm.tsx

---

## Modul: Kelas & Santri Management

### T-15
- **Judul:** API CRUD Kelas
- **Deskripsi:** Implementasi GET /api/kelas (filtered by role), POST /api/kelas, PATCH /api/kelas/[id] (assign guru)
- **Modul:** Kelas & Santri
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-12
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/api/kelas/route.ts, src/app/api/kelas/[id]/route.ts

### T-16
- **Judul:** API CRUD Santri
- **Deskripsi:** Implementasi GET /api/santri (list per kelas), POST /api/santri, PATCH /api/santri/[id]
- **Modul:** Kelas & Santri
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-15
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/api/santri/route.ts, src/app/api/santri/[id]/route.ts

### T-17
- **Judul:** Halaman Manajemen Kelas & Santri (Frontend)
- **Deskripsi:** Buat halaman dashboard Admin untuk kelola kelas (assign guru) dan santri (CRUD, filter per kelas)
- **Modul:** Kelas & Santri
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-16
- **Tanggal:** 2026-08-01
- **Estimasi:** 4 jam
- **File yang diubah:** src/app/dashboard/admin/kelas/page.tsx, src/app/dashboard/admin/santri/page.tsx, src/components/forms/KelasForm.tsx, src/components/forms/SantriForm.tsx

---

## Modul: Hafalan

### T-18
- **Judul:** API Input & Edit Hafalan
- **Deskripsi:** Implementasi POST /api/hafalan (validasi tanggal ≤ today, surah 1-114), PATCH /api/hafalan/[id] (24h edit window)
- **Modul:** Hafalan
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-16
- **Tanggal:** 2026-08-01
- **Estimasi:** 3 jam
- **File yang diubah:** src/app/api/hafalan/route.ts, src/app/api/hafalan/[id]/route.ts

### T-19
- **Judul:** API Delete & List Hafalan
- **Deskripsi:** Implementasi DELETE /api/hafalan/[id] (soft delete + audit log), GET /api/hafalan (filtered by role)
- **Modul:** Hafalan
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-18
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/api/hafalan/route.ts, src/app/api/hafalan/[id]/route.ts, src/lib/db/audit.ts, src/lib/hafalan.ts

### T-20
- **Judul:** API Riwayat Hafalan per Santri
- **Deskripsi:** Implementasi GET /api/hafalan/history/[santri_id] dengan pagination
- **Modul:** Hafalan
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-19
- **Tanggal:** 2026-08-01
- **Estimasi:** 1 jam
- **File yang diubah:** src/app/api/hafalan/history/[santri_id]/route.ts

### T-21
- **Judul:** Logic Auto-Generate Jadwal Murajaah
- **Deskripsi:** Buat function trigger otomatis setelah hafalan baru disimpan: hitung jadwal murajaah (Day 3,7,14,30 dari MURAJAAH_INTERVALS env), simpan ke jadwal_murajaah
- **Modul:** Hafalan
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-18
- **Tanggal:** 2026-08-01
- **Estimasi:** 3 jam
- **File yang diubah:** src/lib/murajaah/generator.ts, src/app/api/hafalan/route.ts

### T-22
- **Judul:** Halaman Form Input Hafalan (Frontend, Guru)
- **Deskripsi:** Buat halaman dashboard Guru untuk input hafalan baru dan lihat/edit riwayat hafalan santri
- **Modul:** Hafalan
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-21
- **Tanggal:** 2026-08-01
- **Estimasi:** 4 jam
- **File yang diubah:** src/app/dashboard/guru/hafalan/page.tsx, src/components/forms/HafalanForm.tsx

### T-23
- **Judul:** API & Halaman Dashboard Hafalan Admin
- **Deskripsi:** Implementasi GET /api/hafalan/dashboard (aggregate statistik) + halaman dashboard admin dengan chart
- **Modul:** Hafalan
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-22
- **Tanggal:** 2026-08-01
- **Estimasi:** 4 jam
- **File yang diubah:** src/app/api/hafalan/dashboard/route.ts, src/app/dashboard/admin/hafalan/page.tsx, src/components/charts/HafalanChart.tsx

---

## Modul: Murajaah

### T-24
- **Judul:** API Update Status Murajaah
- **Deskripsi:** Implementasi PATCH /api/murajaah/[id] (update status, selesai/tidak-selesai, dengan validasi)
- **Modul:** Jadwal Murajaah
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-21
- **Tanggal:** 2026-08-01
- **Estimasi:** 1 jam
- **File yang diubah:** src/app/api/murajaah/[id]/route.ts

### T-25
- **Judul:** API List Jadwal Murajaah
- **Deskripsi:** Implementasi GET /api/murajaah (list, filtered by role), GET /api/murajaah/santri/[id] (per santri)
- **Modul:** Murajaah
- **Prioritas:** High
- **Status:** Done
- **Dependensi:** T-24
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/api/murajaah/route.ts, src/app/api/murajaah/santri/[id]/route.ts

### T-26
- **Judul:** API Dashboard Murajaah Admin
- **Deskripsi:** Implementasi GET /api/murajaah/dashboard dengan aggregate statistik murajaah semua guru
- **Modul:** Murajaah
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-25
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/api/murajaah/dashboard/route.ts

### T-27
- **Judul:** Halaman Jadwal Murajaah (Frontend, Guru & Admin)
- **Deskripsi:** Buat halaman dashboard Guru untuk lihat & update status jadwal murajaah, halaman dashboard Admin untuk statistik murajaah
- **Modul:** Murajaah
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-26
- **Tanggal:** 2026-08-01
- **Estimasi:** 3 jam
- **File yang diubah:** src/app/dashboard/guru/murajaah/page.tsx, src/app/dashboard/admin/murajaah/page.tsx

---

## Modul: WhatsApp Integration

### T-28
- **Judul:** Setup WhatsApp Business API Client
- **Deskripsi:** Buat wrapper client untuk WhatsApp Business API (kirim pesan), konfigurasi credentials dari env
- **Modul:** WhatsApp
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-05
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/lib/whatsapp/client.ts

### T-29
- **Judul:** API Verify Nomor WhatsApp
- **Deskripsi:** Implementasi POST /api/whatsapp/verify untuk verifikasi nomor WhatsApp guru saat registrasi
- **Modul:** WhatsApp
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-28
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/api/whatsapp/verify/route.ts

### T-30
- **Judul:** API Kirim Pesan WhatsApp (Single)
- **Deskripsi:** Implementasi POST /api/whatsapp/send dengan retry 3x untuk failed notifications, trigger dari auto murajaah generation
- **Modul:** WhatsApp
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-29
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/api/whatsapp/send/route.ts, src/lib/whatsapp/retry.ts

### T-31
- **Judul:** API Webhook WhatsApp & Bot Command Parser
- **Deskripsi:** Implementasi POST /api/whatsapp/webhook dengan signature verification, parser command "!hafalan [santri_id]", validasi akses guru, query DB, format & kirim response
- **Modul:** WhatsApp
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-30
- **Tanggal:** 2026-08-01
- **Estimasi:** 4 jam
- **File yang diubah:** src/app/api/whatsapp/webhook/route.ts, src/lib/whatsapp/commands.ts

### T-32
- **Judul:** API & Rate Limiting Bulk Message Murajaah
- **Deskripsi:** Implementasi POST /api/whatsapp/bulk dengan queue processing, rate limiting via @upstash/ratelimit, log success/failure per message
- **Modul:** WhatsApp
- **Prioritas:** Mid
- **Status:** Done
- **Dependensi:** T-31
- **Tanggal:** 2026-08-01
- **Estimasi:** 3 jam
- **File yang diubah:** src/app/api/whatsapp/bulk/route.ts, src/lib/whatsapp/queue.ts, src/lib/rate-limit.ts

### T-33
- **Judul:** Halaman Bulk Message Murajaah (Frontend, Guru)
- **Deskripsi:** Buat form pilih santri, pilih template pesan, kirim bulk message murajaah
- **Modul:** WhatsApp
- **Prioritas:** Low
- **Status:** Done
- **Dependensi:** T-32
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/dashboard/guru/bulk-message/page.tsx, src/components/forms/BulkMessageForm.tsx

---

## Modul: Reports & Audit

### T-34
- **Judul:** API Export Reports CSV
- **Deskripsi:** Implementasi GET /api/reports/hafalan dan GET /api/reports/murajaah untuk export data ke format CSV
- **Modul:** Reports
- **Prioritas:** Low
- **Status:** Done
- **Dependensi:** T-25
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/api/reports/hafalan/route.ts, src/app/api/reports/murajaah/route.ts, src/lib/csv-export.ts

### T-35
- **Judul:** API Audit Logs
- **Deskripsi:** Implementasi GET /api/audit-logs dengan filter & pagination untuk melihat audit trail
- **Modul:** Reports
- **Prioritas:** Low
- **Status:** Done
- **Dependensi:** T-19
- **Tanggal:** 2026-08-01
- **Estimasi:** 1 jam
- **File yang diubah:** src/app/api/audit-logs/route.ts

### T-36
- **Judul:** Halaman Reports & Audit Logs (Frontend, Admin)
- **Deskripsi:** Buat halaman dashboard admin untuk download reports CSV dan lihat audit logs
- **Modul:** Reports
- **Prioritas:** Low
- **Status:** Done
- **Dependensi:** T-35
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** src/app/dashboard/admin/reports/page.tsx, src/app/dashboard/admin/audit-logs/page.tsx

---

## Modul: Deployment

### T-37
- **Judul:** Setup Health Check Endpoint
- **Deskripsi:** Buat GET /api/health untuk monitoring status aplikasi & koneksi DB
- **Modul:** Deployment
- **Prioritas:** Low
- **Status:** Done
- **Dependensi:** T-04
- **Tanggal:** 2026-08-01
- **Estimasi:** 30 menit
- **File yang diubah:** src/app/api/health/route.ts

### T-38
- **Judul:** Buat Dockerfile & Docker Compose
- **Deskripsi:** Multi-stage Dockerfile (build → production), docker-compose.yml dengan volume mount SQLite
- **Modul:** Deployment
- **Prioritas:** Low
- **Status:** Done
- **Dependensi:** T-37
- **Tanggal:** 2026-08-01
- **Estimasi:** 2 jam
- **File yang diubah:** Dockerfile, docker-compose.yml, .dockerignore

### T-39
- **Judul:** Setup PM2 & Backup Script
- **Deskripsi:** Konfigurasi PM2 ecosystem file untuk process management, buat automated backup script untuk SQLite database
- **Modul:** Deployment
- **Prioritas:** Low
- **Status:** Done
- **Dependensi:** T-38
- **Tanggal:** 2026-08-01
- **Estimasi:** 1 jam
- **File yang diubah:** ecosystem.config.js, scripts/backup.sh

---

**Total Task:** 39 / 39 Completed
**Status:** All Tasks Completed (100%)

