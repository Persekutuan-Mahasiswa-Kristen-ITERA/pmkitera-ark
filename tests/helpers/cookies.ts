import { vi } from "vitest";

// Minimal in-memory stand-in for the `cookies()` store from next/headers.
export function createCookieStore(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    get: vi.fn((name: string) =>
      values.has(name) ? { name, value: values.get(name)! } : undefined
    ),
    set: vi.fn((name: string, value: string, options?: Record<string, unknown>) => {
      void options;
      values.set(name, value);
    }),
    delete: vi.fn((name: string) => {
      values.delete(name);
    }),
  };
}

export type CookieStoreMock = ReturnType<typeof createCookieStore>;
