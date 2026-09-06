import { prisma } from "@/lib/db/prisma";
import { CategoryInput } from "@/lib/validation/document";

export async function listCategories() {
  return await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getCategoryById(id: number) {
  return await prisma.category.findUnique({
    where: { id: BigInt(id) },
  });
}

export async function createCategory(input: CategoryInput) {
  return await prisma.category.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
    },
  });
}

export async function updateCategory(id: number, input: CategoryInput) {
  return await prisma.category.update({
    where: { id: BigInt(id) },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
    },
  });
}

export async function deleteCategory(id: number) {
  // Cek apakah ada dokumen terkait
  const count = await prisma.document.count({
    where: { category_id: BigInt(id) },
  });
  if (count > 0) {
    throw new Error(`Tidak dapat menghapus kategori: ${count} dokumen masih terikat pada kategori ini.`);
  }

  return await prisma.category.delete({
    where: { id: BigInt(id) },
  });
}
