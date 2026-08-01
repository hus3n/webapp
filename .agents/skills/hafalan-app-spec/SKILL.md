---
name: hafalan-app-spec
description: Spesifikasi teknis, PRD, arsitektur, dan daftar task lengkap untuk Webapp Hafalan Santri, termasuk koreksi fungsi QR Code (untuk pairing WhatsApp Guru kirim pesan massal ke wali murid, bukan untuk login).
---

# Webapp Hafalan Santri - PRD & Tech Spec Knowledge Base

## 📌 Ringkasan Sistem & Koreksi Utama
**Webapp Hafalan Santri** adalah platform digital berbasis Next.js 14 App Router, SQLite, dan Drizzle ORM untuk mencatat setoran hafalan Al-Quran, membuat jadwal murajaah otomatis per surat, dan mengirim pesan massal ke wali murid melalui WhatsApp.

> [!IMPORTANT]
> **KOREKSI FITUR QR CODE:**
> Fitur **QR Code BUKAN untuk Login Akun**.
> Fungsi QR Code adalah untuk **menghubungkan / pairing akun WhatsApp (WA) Guru ke dalam webapp**, sehingga Guru dapat mengirim notifikasi jadwal murajaah dan pesan massal (bulk message) ke seluruh wali murid sekaligus.

---

## 👥 Role & Otorisasi (RBAC)

1. **SuperAdmin**
   - Mengelola akun Admin (Tambah, Edit, Nonaktifkan).
   - Melihat audit logs global sistem.
   
2. **Admin**
   - Mengelola akun Guru & pendaftaran Guru baru.
   - Mengelola Kelas & pembagian Guru pengampu.
   - Mengelola Data Santri & wali murid.
   - Monitoring dashboard hafalan & murajaah seluruh kelas.
   - Export laporan hafalan & murajaah ke CSV.

3. **Guru**
   - Login menggunakan Email & Password.
   - Mencatat & edit setoran hafalan santri (surah 1-114, ayat, status, catatan).
   - Melihat jadwal murajaah otomatis per santri.
   - **Scan QR Code** untuk memunculkan dan menghubungkan WhatsApp Guru ke Webapp.
   - Mengirim pesan massal (bulk message) ke seluruh wali murid per kelas/kelompok.

---

## 🏗️ Arsitektur Teknis

- **Frontend & Backend**: Next.js 14 (App Router) Single Server.
- **Database**: SQLite3 (`database.sqlite`) via `better-sqlite3`.
- **ORM & Kit**: Drizzle ORM (`drizzle-orm`) & Drizzle Kit (`drizzle-kit`).
- **Autentikasi**: Custom Session-Based Cookies (`hafalan_session`) tersimpan di tabel DB `sessions`.
- **Integrasi WhatsApp**: WhatsApp Web API / Webhook (dihubungkan via QR Code scan di dashboard Guru).

### Schema Database Utama (`src/lib/db/schema.ts`)
- `users`: Account data (`id`, `email`, `passwordHash`, `nama`, `role`, `whatsappNumber`, `status`).
- `sessions`: Auth active sessions (`id`, `userId`, `token`, `expiresAt`, `deviceInfo`).
- `kelas`: Class data (`id`, `namaKelas`, `adminId`).
- `kelas_guru`: Relation table (`kelasId`, `guruId`).
- `santri`: Student data (`id`, `nama`, `nis`, `kelasId`, `kontakWali`, `whatsappNumber`).
- `hafalan`: Setoran entries (`id`, `santriId`, `guruId`, `tanggal`, `surah`, `ayatStart`, `ayatEnd`, `status`, `catatan`).
- `jadwal_murajaah`: Auto-generated review schedules (`id`, `hafalanId`, `tanggalMurajaah`, `status`, `completedAt`).
- `whatsapp_sessions`: Pairing status WA Guru (`id`, `userId`, `waNumber`, `qrCode`, `status`, `connectedAt`).
- `audit_logs`: Audit trail (`id`, `userId`, `action`, `tableName`, `recordId`, `oldData`, `newData`, `timestamp`).

---

## 🔄 Alur Fitur Inti

### 1. Pencatatan Hafalan & Auto-Murajaah
1. Guru memilih santri dan menginput setoran (surah 1-114, ayat, status lancar/kurang/ulang).
2. Sistem menyimpan data ke tabel `hafalan`.
3. System trigger (`src/lib/murajaah/generator.ts`) secara otomatis membuat 4 jadwal review murajaah (default interval Day 3, 7, 14, 30).

### 2. Pairing WhatsApp Guru via QR Code (WhatsApp Gateway Connection)
1. Guru membuka halaman integrasi WhatsApp di dashboard (`/dashboard/guru/whatsapp-connect` / `/dashboard/guru/bulk-message`).
2. Webapp menampilkan QR Code unik untuk pairing session WhatsApp.
3. Guru melakukan scan QR Code dari aplikasi WhatsApp di handphone.
4. Setelah terhubung, status WA menjadi `connected`, dan webapp siap mengirim pesan atas nama WhatsApp Guru tersebut.

### 3. Pengiriman Pesan Massal ke Wali Murid (Bulk Messaging)
1. Guru membuka menu **Pesan Massal / Bulk Message**.
2. Guru memilih penerima (seluruh wali murid di kelasnya) dan template pesan (misal: pengumuman murajaah, progres hafalan).
3. Webapp memproses antrean pesan (queue processing & rate limiting) dan mendistribusikan pesan ke WhatsApp wali murid.

---

## 📂 Lokasi Referensi Dokumentasi Projek
- **PRD**: [1-PRD.md](file:///root/my-project/webapp-hafalan/.agents/1-PRD.md)
- **Tech Spec**: [2-TECH-SPEC.md](file:///root/my-project/webapp-hafalan/.agents/tech-specs/2026/2-TECH-SPEC.md)
- **Tasks**: [3-TASKS.md](file:///root/my-project/webapp-hafalan/.agents/3-TASKS.md)
