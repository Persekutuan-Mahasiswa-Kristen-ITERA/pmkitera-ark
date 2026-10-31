import { vi } from "vitest";

// Shape-only stand-in for the Prisma client: every model method is a vi.fn().
export function createPrismaMock() {
  const model = () => ({
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  });
  return {
    user: model(),
    category: model(),
    servicePeriod: model(),
    document: model(),
  };
}

export type PrismaMock = ReturnType<typeof createPrismaMock>;
