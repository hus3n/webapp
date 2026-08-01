import { db } from "./index";
import {
  users,
  kelas,
  kelasGuru,
  santri,
} from "./schema";
import bcrypt from "bcryptjs";

const passwordHash = bcrypt.hashSync("password123", 12);

const env = process.env.SUPERADMIN_EMAIL ?? "superadmin@hafalan.id";
const password = process.env.SUPERADMIN_PASSWORD ?? "password123";

async function seed() {
  console.log("Seeding database...");

  const [superadmin] = await db
    .insert(users)
    .values({
      email: env,
      passwordHash,
      nama: "Super Admin",
      role: "superadmin",
      status: "active",
    })
    .returning();

  const [admin] = await db
    .insert(users)
    .values({
      email: "admin@hafalan.id",
      passwordHash: bcrypt.hashSync(password, 12),
      nama: "Admin Pondok",
      role: "admin",
      status: "active",
      createdBy: superadmin.id,
    })
    .returning();

  const [guru1] = await db
    .insert(users)
    .values({
      email: "guru@hafalan.id",
      passwordHash: bcrypt.hashSync(password, 12),
      nama: "Ustadz Ahmad",
      role: "guru",
      whatsappNumber: "6281234567890",
      status: "active",
      createdBy: admin.id,
    })
    .returning();

  const [guru2] = await db
    .insert(users)
    .values({
      email: "guru2@hafalan.id",
      passwordHash: bcrypt.hashSync(password, 12),
      nama: "Ustadzah Siti",
      role: "guru",
      whatsappNumber: "6289876543210",
      status: "active",
      createdBy: admin.id,
    })
    .returning();

  const [kelasA] = await db
    .insert(kelas)
    .values({
      namaKelas: "Kelas 1A",
      adminId: admin.id,
    })
    .returning();

  const [kelasB] = await db
    .insert(kelas)
    .values({
      namaKelas: "Kelas 1B",
      adminId: admin.id,
    })
    .returning();

  await db.insert(kelasGuru).values([
    { kelasId: kelasA.id, guruId: guru1.id },
    { kelasId: kelasB.id, guruId: guru2.id },
  ]);

  await db.insert(santri).values([
    {
      nama: "Santri Abdullah",
      nis: "NIS-001",
      kelasId: kelasA.id,
      kontakWali: "Bapak Abdullah",
      whatsappNumber: "6281111111111",
    },
    {
      nama: "Santri Hasan",
      nis: "NIS-002",
      kelasId: kelasA.id,
      kontakWali: "Ibu Hasan",
      whatsappNumber: "6282222222222",
    },
    {
      nama: "Santri Aisyah",
      nis: "NIS-003",
      kelasId: kelasB.id,
      kontakWali: "Bapak Aisyah",
      whatsappNumber: "6283333333333",
    },
  ]);

  console.log("Seed selesai.");
  console.log("Akun:");
  console.log(`  SuperAdmin: ${env} / ${password}`);
  console.log(`  Admin: admin@hafalan.id / ${password}`);
  console.log(`  Guru: guru@hafalan.id / ${password}`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    db.$client.close();
  });
