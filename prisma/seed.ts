import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Password default akun dev — seeder ini hanya untuk development, jangan dipakai di produksi.
const DEV_PASSWORD = "pmkark2025";

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Categories
  const ibadahJumat = await prisma.category.upsert({
    where: { slug: "ibadah-jumat" },
    update: {},
    create: {
      name: "Ibadah Jumat",
      slug: "ibadah-jumat",
      description: "Slide PPT pelayan Ibadah Raya Jumat PMK ITERA",
    },
  });

  const wartaMingguan = await prisma.category.upsert({
    where: { slug: "warta-mingguan" },
    update: {},
    create: {
      name: "Warta Mingguan",
      slug: "warta-mingguan",
      description: "Pengumuman dan buletin warta persekutuan mingguan",
    },
  });

  const khotbah = await prisma.category.upsert({
    where: { slug: "khotbah" },
    update: {},
    create: {
      name: "PPT Khotbah",
      slug: "khotbah",
      description: "Materi presentasi khotbah pembicara",
    },
  });

  console.log("✅ Categories created");

  // 2. Service Periods
  const period2025 = await prisma.servicePeriod.create({
    data: {
      name: "2025/2026",
      start_date: new Date("2025-07-01"),
      end_date: new Date("2026-06-30"),
    },
  });

  const period2024 = await prisma.servicePeriod.create({
    data: {
      name: "2024/2025",
      start_date: new Date("2024-07-01"),
      end_date: new Date("2025-06-30"),
    },
  });

  console.log("✅ Service Periods created");

  // 3. Users (Admin & Pengurus) — password di-hash bcrypt, tidak pernah plaintext
  const hashedPassword = await bcrypt.hash(DEV_PASSWORD, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pmkitera.org" },
    update: { password: hashedPassword },
    create: {
      name: "Admin PMK ITERA",
      email: "admin@pmkitera.org",
      role: "admin",
      password: hashedPassword,
    },
  });

  const pengurusUser = await prisma.user.upsert({
    where: { email: "pengurus@pmkitera.org" },
    update: { password: hashedPassword },
    create: {
      name: "Pengurus Acara",
      email: "pengurus@pmkitera.org",
      role: "pengurus",
      password: hashedPassword,
    },
  });

  console.log("✅ Users created (password dev: pmkark2025)");

  // 4. Sample Documents
  await prisma.document.createMany({
    data: [
      {
        title: "PPT Ibadah Jumat — 'Hidup Bermakna dalam Kristus'",
        category_id: ibadahJumat.id,
        service_period_id: period2025.id,
        event_date: new Date("2025-09-05"),
        speaker: "Pdt. Budi Santoso",
        description: "Bahan tayang ibadah jumat rutin PMK ITERA minggu pertama September 2025.",
        file_path: "documents/2025/09/ppt-ibadah-jumat-05092025.pptx",
        file_type: "pptx",
        status: "published",
        uploaded_by: pengurusUser.id,
      },
      {
        title: "Warta Minggu II September 2025",
        category_id: wartaMingguan.id,
        service_period_id: period2025.id,
        event_date: new Date("2025-09-12"),
        speaker: "Divisi Kominfo",
        description: "Info kegiatan persekutuan, jadwal kelompok kecil, dan pokok doa.",
        file_path: "documents/2025/09/warta-12092025.pdf",
        file_type: "pdf",
        status: "published",
        uploaded_by: pengurusUser.id,
      },
      {
        title: "Khotbah — 'Setia dalam Perkara Kecil'",
        category_id: khotbah.id,
        service_period_id: period2025.id,
        event_date: new Date("2025-09-12"),
        speaker: "Ev. Daniel Wijaya",
        description: "Materi khotbah pemuda tentang integritas di lingkungan kampus.",
        file_path: "documents/2025/09/khotbah-12092025.pptx",
        file_type: "pptx",
        status: "draft",
        uploaded_by: pengurusUser.id,
      },
    ],
  });

  console.log("✅ Sample Documents created");
  console.log("🌱 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
