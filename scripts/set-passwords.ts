import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const plainPassword = "pmkark2025";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  // Update admin
  const admin = await prisma.user.update({
    where: { email: "admin@pmkitera.org" },
    data: { password: hashedPassword },
  });
  console.log("✅ Password admin diset:", admin.email);

  // Update pengurus
  const pengurus = await prisma.user.update({
    where: { email: "pengurus@pmkitera.org" },
    data: { password: hashedPassword },
  });
  console.log("✅ Password pengurus diset:", pengurus.email);

  console.log("\n🔐 Kredensial login (keduanya pakai password sama):");
  console.log("   Admin:     admin@pmkitera.org");
  console.log("   Pengurus:  pengurus@pmkitera.org");
  console.log("   Password:  pmkark2025");
}

main()
  .catch((e) => console.error("❌ Error:", e))
  .finally(async () => await prisma.$disconnect());
