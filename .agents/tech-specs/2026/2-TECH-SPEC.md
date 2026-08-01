# Tech Spec: Webapp Hafalan Santri

**Versi:** 1.0  
**Tanggal:** 01 Agustus 2026  
**Status:** Draft  
**Berdasarkan:** PRD v1.0

---

## 📄 BAGIAN 1: Tech Stack & Arsitektur

### Tech Stack
| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| State | Zustand | 4.x |
| Backend | Next.js API Routes | 14.x |
| Database | SQLite | 3.x |
| ORM | Drizzle ORM | 0.29.x |
| Auth | NextAuth.js v5 + Sessions | 5.x |
| Hosting | Docker + VPS | - |
| Process Manager | PM2 | 5.x |

### Arsitektur Sistem
```
Frontend (Next.js Client) → Next.js API Routes → Drizzle ORM → SQLite Database
                    ↓
              WhatsApp Business API
```

### Struktur Folder Next.js 14 App Router
```
webapp-hafalan/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── (auth)/            # Route groups
│   │   │   ├── login/
│   │   │   └── qr-login/
│   │   ├── dashboard/
│   │   │   ├── guru/
│   │   │   ├── admin/
│   │   │   └── superadmin/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/
│   │   │   ├── hafalan/
│   │   │   ├── murajaah/
│   │   │   ├── santri/
│   │   │   └── whatsapp/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/            # Reusable components
│   │   ├── ui/               # Shadcn/ui components
│   │   ├── forms/
│   │   ├── charts/
│   │   └── layout/
│   ├── lib/                  # Utilities
│   │   ├── db/              # Database schema & connections
│   │   ├── auth/            # Auth configuration
│   │   ├── whatsapp/        # WhatsApp API integration
│   │   └── utils.ts
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # Zustand stores
│   └── types/               # TypeScript type definitions
├── drizzle/                 # Database migrations
├── public/
├── docker-compose.yml
├── Dockerfile
├── drizzle.config.ts
├── next.config.js
└── tailwind.config.js
```

### Justifikasi
- **Next.js 14:** Full-stack framework dengan App Router untuk SSR/SSG, API routes built-in, optimal untuk single-server deployment sesuai PRD
- **SQLite:** Sesuai PRD requirement untuk database lokal, mudah backup, zero-config untuk small scale deployment
- **Drizzle ORM:** Type-safe, lightweight, excellent SQLite support, migration system
- **Docker + VPS:** Sesuai PRD untuk single-server fullstack deployment yang cost-efficient

---

## 📄 BAGIAN 2: Database Design

### Ringkasan Database
| Item | Detail |
|------|--------|
| Database | SQLite |
| ORM/Driver | Drizzle ORM |
| Pendekatan | Relational |
| Tools Migrasi | Drizzle Kit |

### Entity Overview
*Berdasarkan Functional Requirements dari PRD:*

| Entity | Key Fields | Relasi |
|--------|-----------|--------|
| users | id, email, nama, role, whatsapp_number, status | → sessions (1:N), → kelas_guru (1:N) |
| sessions | id, user_id, token, expires_at, device_info | ← users (N:1) |
| kelas | id, nama_kelas, admin_id, created_at | → kelas_guru (1:N), → santri (1:N) |
| kelas_guru | id, kelas_id, guru_id | ← kelas (N:1), ← users (N:1) |
| santri | id, nama, nis, kelas_id, kontak_wali, whatsapp_number | ← kelas (N:1), → hafalan (1:N) |
| hafalan | id, santri_id, guru_id, tanggal, surah, ayat_start, ayat_end, status, catatan | ← santri (N:1), ← users (N:1), → jadwal_murajaah (1:N) |
| jadwal_murajaah | id, hafalan_id, tanggal_murajaah, status, completed_at | ← hafalan (N:1) |
| whatsapp_sessions | id, user_id, wa_number, verified_at, qr_code | ← users (N:1) |
| audit_logs | id, user_id, action, table_name, record_id, old_data, new_data, timestamp | ← users (N:1) |

### Index Strategy
- **users.email** — unique constraint untuk login
- **users.whatsapp_number** — lookup untuk WhatsApp integration
- **sessions.token** — quick session validation
- **sessions.user_id** — user sessions lookup
- **hafalan.santri_id** — hafalan per santri
- **hafalan.guru_id** — hafalan per guru
- **jadwal_murajaah.hafalan_id** — jadwal per hafalan
- **jadwal_murajaah.tanggal_murajaah** — jadwal upcoming
- **audit_logs.user_id, audit_logs.timestamp** — audit trail

### Data Flow
**Core Flow:** Admin mendaftarkan Guru → Guru assigned ke Kelas → Santri assigned ke Kelas → Guru input Hafalan → System auto-generate Jadwal Murajaah → WhatsApp notification

---

## 📄 BAGIAN 3: Interface Design (Next.js API Routes)

*API Routes berdasarkan Functional Requirements PRD:*

### Authentication & Session Management
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/register` | Admin daftarkan guru baru (FR-1.1) | Admin+ |
| POST | `/api/auth/login` | Login via email/password | No |
| GET | `/api/auth/qr-generate` | Generate QR code untuk login (FR-1.2) | No |
| POST | `/api/auth/qr-verify` | Verify QR scan & create session | No |
| POST | `/api/auth/logout` | Logout & hapus session (FR-1.3) | Yes |
| GET | `/api/auth/sessions` | Lihat active sessions (Admin) | Admin+ |
| DELETE | `/api/auth/sessions/[id]` | Force logout user | Admin+ |

### User Management
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/users` | List users berdasarkan role | Admin+ |
| POST | `/api/users` | Create admin account (SuperAdmin) | SuperAdmin |
| PATCH | `/api/users/[id]` | Update user status/data | Admin+ |
| DELETE | `/api/users/[id]` | Soft delete user | SuperAdmin |

### Santri & Kelas Management
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/kelas` | List kelas (filtered by role) | Yes |
| POST | `/api/kelas` | Create kelas baru (FR-5.1) | Admin+ |
| PATCH | `/api/kelas/[id]` | Update kelas & assign guru | Admin+ |
| GET | `/api/santri` | List santri per kelas | Yes |
| POST | `/api/santri` | Create santri baru (FR-5.2) | Admin+ |
| PATCH | `/api/santri/[id]` | Update data santri | Admin+ |

### Hafalan Management
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/hafalan` | List hafalan (filtered by role) | Yes |
| POST | `/api/hafalan` | Input hafalan baru (FR-2.1) | Guru+ |
| PATCH | `/api/hafalan/[id]` | Edit hafalan (24h window) (FR-2.2) | Guru+ |
| DELETE | `/api/hafalan/[id]` | Soft delete hafalan (FR-2.3) | Guru+ |
| GET | `/api/hafalan/history/[santri_id]` | Riwayat hafalan per santri (FR-2.4) | Yes |
| GET | `/api/hafalan/dashboard` | Dashboard hafalan admin (FR-2.5) | Admin+ |

### Jadwal Murajaah
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/murajaah` | List jadwal murajaah | Yes |
| PATCH | `/api/murajaah/[id]` | Update status murajaah (FR-3.2) | Guru+ |
| GET | `/api/murajaah/santri/[id]` | Jadwal per santri (FR-3.3) | Yes |
| GET | `/api/murajaah/dashboard` | Dashboard murajaah admin (FR-3.4) | Admin+ |

### WhatsApp Integration
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/whatsapp/webhook` | WhatsApp webhook untuk commands | No |
| POST | `/api/whatsapp/send` | Kirim pesan WhatsApp | Yes |
| POST | `/api/whatsapp/bulk` | Bulk message murajaah (FR-4.3) | Guru+ |
| POST | `/api/whatsapp/verify` | Verify nomor WhatsApp (FR-4.4) | Yes |

### Reports & Analytics
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/reports/hafalan` | Export hafalan CSV | Admin+ |
| GET | `/api/reports/murajaah` | Export murajaah CSV | Admin+ |
| GET | `/api/audit-logs` | Audit trail | Admin+ |

*Catatan: Detail request/response schema akan didefinisikan saat implementasi menggunakan Zod untuk validation.*

---

## 📄 BAGIAN 4: Alur Logika & Business Rules

*Alur berdasarkan User Stories & Functional Requirements PRD:*

### Alur Authentication (US-01, US-04, FR-1.2, FR-1.3)
1. **QR Login Flow:**
   - User → `/qr-login` → Generate unique QR token
   - Mobile scan QR → POST `/api/auth/qr-verify` with token
   - Backend validate token → Create session in DB → Return session cookie
   - Frontend redirect to dashboard based on role
   - Session persistent sampai logout/expire (30 hari default)

2. **Session Management:**
   - Setiap request → Middleware check session di DB
   - Session valid → Continue request
   - Session expired → Redirect to login
   - Admin bisa force logout via `/api/auth/sessions/[id]`

### Alur Input Hafalan & Auto Murajaah (US-05, US-09, FR-2.1, FR-3.1)
1. **Input Hafalan:**
   - Guru → Form hafalan → Validate input (tanggal ≤ today, surah 1-114)
   - POST `/api/hafalan` → Save to DB → Trigger auto murajaah
   
2. **Auto Generate Murajaah:**
   - Event: hafalan baru disimpan
   - Background job: Calculate jadwal (Day 3, 7, 14, 30 dari tanggal hafalan)
   - Save jadwal_murajaah records → Send WhatsApp notification to guru

### Alur WhatsApp Query (US-12, FR-4.1)
1. **WhatsApp Bot Command:**
   - Guru send "!hafalan [santri_id]" to WhatsApp
   - WhatsApp webhook → POST `/api/whatsapp/webhook`
   - Parse command → Validate guru access → Query hafalan DB
   - Format response → Send via WhatsApp API

### Alur Admin Dashboard (US-07, FR-2.5)
1. **Dashboard Hafalan:**
   - Admin → `/dashboard/admin` → GET `/api/hafalan/dashboard`
   - Backend aggregate hafalan semua guru terafiliasi
   - Return statistics, charts, recent hafalan
   - Frontend render dashboard dengan filter per guru/kelas

### Alur Bulk Murajaah Message (US-14, FR-4.3)
1. **Bulk Message:**
   - Guru → Form bulk message → Select santri → Choose template
   - POST `/api/whatsapp/bulk` → Queue messages
   - Background job process queue → Send individual WhatsApp messages
   - Log success/failure per message

### Business Rules (dari PRD)
- **Data Access Control:**
  - Guru hanya akses santri di kelasnya sendiri
  - Admin akses semua guru terafiliasi
  - SuperAdmin akses semua admin
  
- **Hafalan Rules:**
  - Edit hafalan hanya dalam 24 jam window
  - Soft delete untuk audit trail
  - Auto-generate murajaah setiap input baru
  
- **Murajaah Scheduling:**
  - Default interval: 3, 7, 14, 30 hari (configurable)
  - Extend dari hafalan sebelumnya jika sudah ada
  
- **WhatsApp Integration:**
  - Nomor WhatsApp verified saat registrasi
  - Rate limiting untuk query commands
  - Retry 3x untuk failed notifications

- **Session Security:**
  - QR code valid 5 menit
  - Session rolling window (auto-extend)
  - Multi-device support

---

## 📄 BAGIAN 5: Keamanan, Performa, & Deployment

### Keamanan
- **Authentication & Authorization:**
  - Password hashing dengan bcrypt (12 rounds)
  - Session-based auth dengan secure cookies (httpOnly, secure, sameSite)
  - Role-based access control middleware di API routes
  - QR token dengan crypto.randomUUID() + expiry

- **Data Protection:**
  - Input validation dengan Zod schemas di API routes
  - SQL injection prevention (Drizzle ORM parameterized queries)
  - XSS prevention (Next.js built-in output encoding)
  - CSRF protection dengan Next.js built-in
  - Rate limiting dengan `@upstash/ratelimit` untuk WhatsApp endpoints

- **WhatsApp Security:**
  - Webhook signature verification
  - WhatsApp API credentials di environment variables
  - Nomor verification saat registrasi guru

### Performa
- **Next.js Optimizations:**
  - App Router dengan Server Components (reduce client-side JS)
  - Image optimization dengan Next.js Image component
  - Static generation untuk public pages
  - Route caching untuk read-heavy endpoints

- **Database Performance:**
  - SQLite dengan WAL mode untuk concurrent reads
  - Database indexes pada lookup fields
  - Connection pooling dengan better-sqlite3
  - Background jobs untuk murajaah generation & WhatsApp sending

- **Caching Strategy:**
  - Next.js built-in caching untuk static assets
  - API route caching untuk dashboard aggregations
  - Client-side caching dengan Zustand persist middleware

### Deployment
- **Docker Configuration:**
  - Multi-stage Dockerfile (build → production)
  - Docker Compose dengan SQLite volume mount
  - PM2 untuk process management & auto-restart
  - Health check endpoint `/api/health`

- **VPS Setup:**
  - Reverse proxy dengan Caddy (auto HTTPS)
  - Environment variables via .env file
  - Automated backup script untuk SQLite database
  - Log rotation dengan winston + logrotate

### Development Setup

```bash
# Clone & install dependencies
git clone <repo-url>
cd webapp-hafalan
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan WhatsApp API credentials

# Initialize database
npm run db:generate
npm run db:migrate
npm run db:seed

# Development server
npm run dev
# → http://localhost:3000
```

### Production Deployment

```bash
# VPS deployment dengan Docker
git clone <repo-url>
cd webapp-hafalan

# Setup environment
cp .env.example .env.production
# Edit .env.production

# Deploy dengan Docker Compose
docker-compose up -d

# Setup reverse proxy (Caddy)
# Automated HTTPS + domain setup
```

### Environment Variables
```env
# Database
DATABASE_URL=file:./database.sqlite

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# WhatsApp Business API
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_VERIFY_TOKEN=your-verify-token
WHATSAPP_PHONE_ID=your-phone-id

# App Configuration
MURAJAAH_INTERVALS=3,7,14,30
SESSION_MAX_AGE=2592000
QR_TOKEN_EXPIRY=300000
```

**🎉 Tech Spec selesai!**

---

## 🔄 Next Steps

1. **Review Tech Spec:** Stakeholder review dokumen ini untuk approval
2. **Setup Repository:** Initialize project dengan struktur folder yang sudah didefinisikan  
3. **Database Schema:** Implement Drizzle schema berdasarkan Entity Overview
4. **API Development:** Implement API routes sesuai Interface Design
5. **Frontend Development:** Build dashboard components untuk setiap role
6. **WhatsApp Integration:** Setup WhatsApp Business API & webhook
7. **Testing & QA:** Unit tests, integration tests, manual testing
8. **Deployment:** Docker setup & VPS deployment

**Document Version:** 1.0  
**Last Updated:** 01 Agustus 2026  
**Status:** Ready for Implementation
