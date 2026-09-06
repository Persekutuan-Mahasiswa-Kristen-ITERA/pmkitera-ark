import { prisma } from "@/lib/db/prisma";
import { ServicePeriodInput } from "@/lib/validation/document";

export async function listServicePeriods() {
  return await prisma.servicePeriod.findMany({
    orderBy: { start_date: "desc" },
  });
}

export async function createServicePeriod(input: ServicePeriodInput) {
  return await prisma.servicePeriod.create({
    data: {
      name: input.name,
      start_date: new Date(input.start_date),
      end_date: new Date(input.end_date),
    },
  });
}

export async function updateServicePeriod(id: number, input: ServicePeriodInput) {
  return await prisma.servicePeriod.update({
    where: { id: BigInt(id) },
    data: {
      name: input.name,
      start_date: new Date(input.start_date),
      end_date: new Date(input.end_date),
    },
  });
}

export async function deleteServicePeriod(id: number) {
  const count = await prisma.document.count({
    where: { service_period_id: BigInt(id) },
  });
  if (count > 0) {
    throw new Error(`Tidak dapat menghapus periode: ${count} dokumen terikat pada periode ini.`);
  }

  return await prisma.servicePeriod.delete({
    where: { id: BigInt(id) },
  });
}
