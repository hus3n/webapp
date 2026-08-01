import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ── Users ─────────────────────────────────────────────────────────────
export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    nama: text("nama").notNull(),
    role: text("role", { enum: ["guru", "admin", "superadmin"] }).notNull(),
    whatsappNumber: text("whatsapp_number"),
    status: text("status", { enum: ["active", "inactive"] })
      .notNull()
      .default("active"),
    createdBy: text("created_by"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    whatsappIdx: uniqueIndex("users_whatsapp_idx").on(table.whatsappNumber),
  })
);

// ── Sessions ──────────────────────────────────────────────────────────
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    deviceInfo: text("device_info"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.token),
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  })
);

// ── Kelas ─────────────────────────────────────────────────────────────
export const kelas = sqliteTable("kelas", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  namaKelas: text("nama_kelas").notNull(),
  adminId: text("admin_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Kelas Guru (pivot) ───────────────────────────────────────────────
export const kelasGuru = sqliteTable(
  "kelas_guru",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    kelasId: text("kelas_id")
      .notNull()
      .references(() => kelas.id, { onDelete: "cascade" }),
    guruId: text("guru_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    kelasIdIdx: index("kelas_guru_kelas_id_idx").on(table.kelasId),
    guruIdIdx: index("kelas_guru_guru_id_idx").on(table.guruId),
  })
);

// ── Santri ────────────────────────────────────────────────────────────
export const santri = sqliteTable(
  "santri",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    nama: text("nama").notNull(),
    nis: text("nis").notNull(),
    kelasId: text("kelas_id")
      .notNull()
      .references(() => kelas.id, { onDelete: "restrict" }),
    kontakWali: text("kontak_wali"),
    whatsappNumber: text("whatsapp_number"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    nisIdx: uniqueIndex("santri_nis_idx").on(table.nis),
    kelasIdIdx: index("santri_kelas_id_idx").on(table.kelasId),
  })
);

// ── Hafalan ───────────────────────────────────────────────────────────
export const hafalan = sqliteTable(
  "hafalan",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    santriId: text("santri_id")
      .notNull()
      .references(() => santri.id, { onDelete: "restrict" }),
    guruId: text("guru_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    tanggal: integer("tanggal", { mode: "timestamp" }).notNull(),
    surah: integer("surah").notNull(),
    ayatStart: integer("ayat_start").notNull(),
    ayatEnd: integer("ayat_end").notNull(),
    status: text("status", {
      enum: ["lancar", "kurang_lancar", "tidak_lancar"],
    }).notNull(),
    catatan: text("catatan"),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    santriIdIdx: index("hafalan_santri_id_idx").on(table.santriId),
    guruIdIdx: index("hafalan_guru_id_idx").on(table.guruId),
  })
);

// ── Jadwal Murajaah ───────────────────────────────────────────────────
export const jadwalMurajaah = sqliteTable(
  "jadwal_murajaah",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    hafalanId: text("hafalan_id")
      .notNull()
      .references(() => hafalan.id, { onDelete: "cascade" }),
    tanggalMurajaah: integer("tanggal_murajaah", {
      mode: "timestamp",
    }).notNull(),
    status: text("status", { enum: ["pending", "completed", "missed"] })
      .notNull()
      .default("pending"),
    completedAt: integer("completed_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    hafalanIdIdx: index("jadwal_murajaah_hafalan_id_idx").on(table.hafalanId),
    tanggalIdx: index("jadwal_murajaah_tanggal_idx").on(
      table.tanggalMurajaah
    ),
  })
);

// ── WhatsApp Sessions ─────────────────────────────────────────────────
export const whatsappSessions = sqliteTable(
  "whatsapp_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    waNumber: text("wa_number").notNull(),
    verifiedAt: integer("verified_at", { mode: "timestamp" }),
    qrCode: text("qr_code"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("whatsapp_sessions_user_id_idx").on(table.userId),
  })
);

// ── QR Tokens (login) ─────────────────────────────────────────────────
export const qrTokens = sqliteTable(
  "qr_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    token: text("token").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    used: integer("used", { mode: "boolean" }).notNull().default(false),
    sessionToken: text("session_token"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    tokenIdx: uniqueIndex("qr_tokens_token_idx").on(table.token),
  })
);

// ── Audit Logs ────────────────────────────────────────────────────────
export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    tableName: text("table_name").notNull(),
    recordId: text("record_id").notNull(),
    oldData: text("old_data"),
    newData: text("new_data"),
    timestamp: integer("timestamp", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    timestampIdx: index("audit_logs_timestamp_idx").on(table.timestamp),
  })
);
