CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`table_name` text NOT NULL,
	`record_id` text NOT NULL,
	`old_data` text,
	`new_data` text,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_user_id_idx` ON `audit_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_timestamp_idx` ON `audit_logs` (`timestamp`);--> statement-breakpoint
CREATE TABLE `hafalan` (
	`id` text PRIMARY KEY NOT NULL,
	`santri_id` text NOT NULL,
	`guru_id` text NOT NULL,
	`tanggal` integer NOT NULL,
	`surah` integer NOT NULL,
	`ayat_start` integer NOT NULL,
	`ayat_end` integer NOT NULL,
	`status` text NOT NULL,
	`catatan` text,
	`deleted_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`santri_id`) REFERENCES `santri`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`guru_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `hafalan_santri_id_idx` ON `hafalan` (`santri_id`);--> statement-breakpoint
CREATE INDEX `hafalan_guru_id_idx` ON `hafalan` (`guru_id`);--> statement-breakpoint
CREATE TABLE `jadwal_murajaah` (
	`id` text PRIMARY KEY NOT NULL,
	`hafalan_id` text NOT NULL,
	`tanggal_murajaah` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`hafalan_id`) REFERENCES `hafalan`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `jadwal_murajaah_hafalan_id_idx` ON `jadwal_murajaah` (`hafalan_id`);--> statement-breakpoint
CREATE INDEX `jadwal_murajaah_tanggal_idx` ON `jadwal_murajaah` (`tanggal_murajaah`);--> statement-breakpoint
CREATE TABLE `kelas` (
	`id` text PRIMARY KEY NOT NULL,
	`nama_kelas` text NOT NULL,
	`admin_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `kelas_guru` (
	`id` text PRIMARY KEY NOT NULL,
	`kelas_id` text NOT NULL,
	`guru_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guru_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `kelas_guru_kelas_id_idx` ON `kelas_guru` (`kelas_id`);--> statement-breakpoint
CREATE INDEX `kelas_guru_guru_id_idx` ON `kelas_guru` (`guru_id`);--> statement-breakpoint
CREATE TABLE `santri` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`nis` text NOT NULL,
	`kelas_id` text NOT NULL,
	`kontak_wali` text,
	`whatsapp_number` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`kelas_id`) REFERENCES `kelas`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `santri_nis_idx` ON `santri` (`nis`);--> statement-breakpoint
CREATE INDEX `santri_kelas_id_idx` ON `santri` (`kelas_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`device_info` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_idx` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`nama` text NOT NULL,
	`role` text NOT NULL,
	`whatsapp_number` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_whatsapp_idx` ON `users` (`whatsapp_number`);--> statement-breakpoint
CREATE TABLE `whatsapp_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`wa_number` text NOT NULL,
	`verified_at` integer,
	`qr_code` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `whatsapp_sessions_user_id_idx` ON `whatsapp_sessions` (`user_id`);