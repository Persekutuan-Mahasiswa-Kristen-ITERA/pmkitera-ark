import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/prisma", async () => {
  const { createPrismaMock } = await import("../helpers/prisma-mock");
  return { prisma: createPrismaMock() };
});

import { prisma } from "@/lib/db/prisma";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "@/services/category-service";
import {
  createServicePeriod,
  deleteServicePeriod,
  listServicePeriods,
  updateServicePeriod,
} from "@/services/service-period-service";
import type { PrismaMock } from "../helpers/prisma-mock";

const db = prisma as unknown as PrismaMock;

beforeEach(() => {
  for (const m of Object.values(db)) for (const fn of Object.values(m)) fn.mockReset();
});

describe("category-service", () => {
  it("lists categories alphabetically", async () => {
    db.category.findMany.mockResolvedValue([]);
    await listCategories();
    expect(db.category.findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
  });

  it("looks a category up by BigInt id", async () => {
    await getCategoryById(3);
    expect(db.category.findUnique).toHaveBeenCalledWith({ where: { id: BigInt(3) } });
  });

  it("stores an empty description as null on create and update", async () => {
    const input = { name: "Warta Jemaat", slug: "warta-jemaat", description: "" };
    await createCategory(input);
    expect(db.category.create).toHaveBeenCalledWith({
      data: { name: "Warta Jemaat", slug: "warta-jemaat", description: null },
    });
    await updateCategory(4, { ...input, description: "Mingguan" });
    expect(db.category.update).toHaveBeenCalledWith({
      where: { id: BigInt(4) },
      data: { name: "Warta Jemaat", slug: "warta-jemaat", description: "Mingguan" },
    });
  });

  it("refuses to delete a category that still has documents", async () => {
    db.document.count.mockResolvedValue(3);
    await expect(deleteCategory(4)).rejects.toThrow(
      "Tidak dapat menghapus kategori: 3 dokumen masih terikat pada kategori ini."
    );
    expect(db.document.count).toHaveBeenCalledWith({ where: { category_id: BigInt(4) } });
    expect(db.category.delete).not.toHaveBeenCalled();
  });

  it("deletes an unused category", async () => {
    db.document.count.mockResolvedValue(0);
    db.category.delete.mockResolvedValue({ id: BigInt(4) });
    await expect(deleteCategory(4)).resolves.toEqual({ id: BigInt(4) });
    expect(db.category.delete).toHaveBeenCalledWith({ where: { id: BigInt(4) } });
  });
});

describe("service-period-service", () => {
  it("lists periods newest first", async () => {
    await listServicePeriods();
    expect(db.servicePeriod.findMany).toHaveBeenCalledWith({ orderBy: { start_date: "desc" } });
  });

  it("converts date strings to Date on create and update", async () => {
    const input = { name: "2026/2027", start_date: "2026-08-01", end_date: "2027-07-31" };
    await createServicePeriod(input);
    expect(db.servicePeriod.create).toHaveBeenCalledWith({
      data: { name: "2026/2027", start_date: new Date("2026-08-01"), end_date: new Date("2027-07-31") },
    });
    await updateServicePeriod(2, input);
    expect(db.servicePeriod.update).toHaveBeenCalledWith({
      where: { id: BigInt(2) },
      data: { name: "2026/2027", start_date: new Date("2026-08-01"), end_date: new Date("2027-07-31") },
    });
  });

  it("refuses to delete a period that still has documents", async () => {
    db.document.count.mockResolvedValue(1);
    await expect(deleteServicePeriod(2)).rejects.toThrow(
      "Tidak dapat menghapus periode: 1 dokumen terikat pada periode ini."
    );
    expect(db.document.count).toHaveBeenCalledWith({ where: { service_period_id: BigInt(2) } });
    expect(db.servicePeriod.delete).not.toHaveBeenCalled();
  });

  it("deletes an unused period", async () => {
    db.document.count.mockResolvedValue(0);
    await deleteServicePeriod(2);
    expect(db.servicePeriod.delete).toHaveBeenCalledWith({ where: { id: BigInt(2) } });
  });
});
