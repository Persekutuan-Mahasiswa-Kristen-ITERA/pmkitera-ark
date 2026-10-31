import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils/cn";
import { formatDateID, formatMonthYear, slugify } from "@/lib/utils/date";
import { jsonResponse } from "@/lib/utils/json";

describe("formatDateID", () => {
  it("formats a Date with Indonesian month names", () => {
    expect(formatDateID(new Date(2026, 0, 2))).toBe("2 Januari 2026");
    expect(formatDateID(new Date(2026, 4, 15))).toBe("15 Mei 2026");
    expect(formatDateID(new Date(2026, 11, 31))).toBe("31 Desember 2026");
  });

  it("accepts ISO strings and renders them in local time (WIB in tests)", () => {
    expect(formatDateID("2026-03-06")).toBe("6 Maret 2026");
    // 20:00 UTC is already the next day in Asia/Jakarta (UTC+7).
    expect(formatDateID("2026-03-06T20:00:00Z")).toBe("7 Maret 2026");
  });

  it("covers every month", () => {
    const months = Array.from({ length: 12 }, (_, m) => formatDateID(new Date(2026, m, 1)).split(" ")[1]);
    expect(months).toEqual([
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember",
    ]);
  });
});

describe("formatMonthYear", () => {
  it("formats month and year", () => {
    expect(formatMonthYear(new Date(2027, 7, 20))).toBe("Agustus 2027");
    expect(formatMonthYear("2026-02-01")).toBe("Februari 2026");
  });
});

describe("slugify", () => {
  it.each([
    ["Persekutuan Doa", "persekutuan-doa"],
    ["  PPT Ibadah  ", "ppt-ibadah"],
    ["Warta Jemaat 2026/2027", "warta-jemaat-20262027"],
    ["Ibadah Jumat — Natal 2026!", "ibadah-jumat-natal-2026"],
    ["a--b   c", "a-b-c"],
    ["already-a-slug", "already-a-slug"],
  ])("%j -> %j", (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});

describe("jsonResponse", () => {
  it("serialises BigInt values as strings", async () => {
    const res = jsonResponse({ id: BigInt("12345678901234567890"), nested: [{ id: BigInt(1) }], name: "x" });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(await res.json()).toEqual({ id: "12345678901234567890", nested: [{ id: "1" }], name: "x" });
  });

  it("uses the given status code", async () => {
    const res = jsonResponse({ error: "Akses ditolak" }, 403);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Akses ditolak" });
  });

  it("keeps Date values as ISO strings", async () => {
    const res = jsonResponse({ at: new Date("2026-09-04T11:00:00.000Z") });
    expect(await res.json()).toEqual({ at: "2026-09-04T11:00:00.000Z" });
  });
});

describe("cn", () => {
  it("joins truthy class names and lets later Tailwind utilities win", () => {
    expect(cn("px-2 py-1", false, undefined, "px-4")).toBe("py-1 px-4");
    expect(cn("text-sm", { "font-bold": true, italic: false })).toBe("text-sm font-bold");
  });
});
