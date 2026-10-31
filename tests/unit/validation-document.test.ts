import { describe, expect, it } from "vitest";
import {
  categorySchema,
  createDocumentSchema,
  documentStatusSchema,
  fileTypeSchema,
  servicePeriodSchema,
  updateDocumentSchema,
  userRoleSchema,
} from "@/lib/validation/document";

const validDocument = {
  title: "Ibadah Jumat Pekan 1",
  category_id: "2",
  service_period_id: "1",
  event_date: "2026-09-04",
  speaker: "Pdt. Contoh",
  description: "",
};

function issuePaths(result: { success: boolean; error?: { issues: { path: (string | number)[] }[] } }) {
  return (result.error?.issues ?? []).map((i) => i.path.join("."));
}

describe("enums", () => {
  it("accepts only the known values", () => {
    expect(documentStatusSchema.options).toEqual(["draft", "published"]);
    expect(fileTypeSchema.options).toEqual(["pptx", "pdf"]);
    expect(userRoleSchema.options).toEqual(["admin", "pengurus", "jemaat"]);
    expect(documentStatusSchema.safeParse("archived").success).toBe(false);
    expect(fileTypeSchema.safeParse("docx").success).toBe(false);
    expect(userRoleSchema.safeParse("superadmin").success).toBe(false);
  });
});

describe("createDocumentSchema", () => {
  it("coerces form-data ids and defaults the status to draft", () => {
    expect(createDocumentSchema.parse(validDocument)).toEqual({
      ...validDocument,
      category_id: 2,
      service_period_id: 1,
      status: "draft",
    });
  });

  it("keeps an explicit published status", () => {
    expect(createDocumentSchema.parse({ ...validDocument, status: "published" }).status).toBe("published");
  });

  it("allows the description to be omitted", () => {
    const { description: _omit, ...rest } = validDocument;
    void _omit;
    expect(createDocumentSchema.safeParse(rest).success).toBe(true);
  });

  it("enforces title length 3..200", () => {
    expect(issuePaths(createDocumentSchema.safeParse({ ...validDocument, title: "ab" }))).toEqual(["title"]);
    expect(createDocumentSchema.safeParse({ ...validDocument, title: "abc" }).success).toBe(true);
    expect(createDocumentSchema.safeParse({ ...validDocument, title: "a".repeat(200) }).success).toBe(true);
    expect(issuePaths(createDocumentSchema.safeParse({ ...validDocument, title: "a".repeat(201) }))).toEqual(["title"]);
  });

  it("reports the Indonesian messages for missing required fields", () => {
    const result = createDocumentSchema.safeParse({
      title: "ab",
      category_id: "0",
      service_period_id: "0",
      event_date: "bukan tanggal",
      speaker: "a",
    });
    expect(result.success).toBe(false);
    const messages = Object.fromEntries(result.error!.issues.map((i) => [i.path.join("."), i.message]));
    expect(messages).toEqual({
      title: "Judul minimal 3 karakter",
      category_id: "Kategori wajib dipilih",
      service_period_id: "Periode pelayanan wajib dipilih",
      event_date: "Tanggal tidak valid",
      speaker: "Pengisi wajib diisi",
    });
  });

  it("rejects non-integer and negative ids", () => {
    expect(issuePaths(createDocumentSchema.safeParse({ ...validDocument, category_id: "1.5" }))).toEqual(["category_id"]);
    expect(issuePaths(createDocumentSchema.safeParse({ ...validDocument, service_period_id: "-3" }))).toEqual([
      "service_period_id",
    ]);
    expect(issuePaths(createDocumentSchema.safeParse({ ...validDocument, category_id: "abc" }))).toEqual(["category_id"]);
  });

  it("accepts ISO date and datetime strings for event_date", () => {
    expect(createDocumentSchema.safeParse({ ...validDocument, event_date: "2026-09-04T18:30:00+07:00" }).success).toBe(true);
  });

  it("caps speaker at 150 and description at 2000 characters", () => {
    expect(issuePaths(createDocumentSchema.safeParse({ ...validDocument, speaker: "a".repeat(151) }))).toEqual(["speaker"]);
    expect(createDocumentSchema.safeParse({ ...validDocument, description: "a".repeat(2000) }).success).toBe(true);
    expect(issuePaths(createDocumentSchema.safeParse({ ...validDocument, description: "a".repeat(2001) }))).toEqual([
      "description",
    ]);
  });

  it("rejects an unknown status", () => {
    expect(issuePaths(createDocumentSchema.safeParse({ ...validDocument, status: "archived" }))).toEqual(["status"]);
  });
});

describe("updateDocumentSchema", () => {
  it("accepts an empty patch without injecting a default status", () => {
    expect(updateDocumentSchema.parse({})).toEqual({});
  });

  it("validates the fields that are present", () => {
    expect(updateDocumentSchema.parse({ status: "published", category_id: "5" })).toEqual({
      status: "published",
      category_id: 5,
    });
    expect(issuePaths(updateDocumentSchema.safeParse({ title: "x" }))).toEqual(["title"]);
    expect(issuePaths(updateDocumentSchema.safeParse({ event_date: "nope" }))).toEqual(["event_date"]);
  });
});

describe("categorySchema", () => {
  const valid = { name: "PPT Ibadah", slug: "ppt-ibadah", description: "" };

  it("accepts a lowercase slug with digits and dashes", () => {
    expect(categorySchema.parse(valid)).toEqual(valid);
    expect(categorySchema.safeParse({ ...valid, slug: "warta-2026" }).success).toBe(true);
  });

  it.each(["PPT-Ibadah", "ppt ibadah", "ppt_ibadah", "ppt/ibadah", "warta.jemaat"])("rejects slug %j", (slug) => {
    const result = categorySchema.safeParse({ ...valid, slug });
    expect(issuePaths(result)).toEqual(["slug"]);
    expect(result.error!.issues[0].message).toBe("Slug hanya boleh berisi huruf kecil, angka, dan strip");
  });

  it("enforces name and description lengths", () => {
    expect(issuePaths(categorySchema.safeParse({ ...valid, name: "a" }))).toEqual(["name"]);
    expect(issuePaths(categorySchema.safeParse({ ...valid, name: "a".repeat(101) }))).toEqual(["name"]);
    expect(issuePaths(categorySchema.safeParse({ ...valid, description: "a".repeat(301) }))).toEqual(["description"]);
  });
});

describe("servicePeriodSchema", () => {
  it("accepts a named period with valid dates", () => {
    const input = { name: "2026/2027", start_date: "2026-08-01", end_date: "2027-07-31" };
    expect(servicePeriodSchema.parse(input)).toEqual(input);
  });

  it("rejects unparseable dates and short names", () => {
    expect(
      issuePaths(servicePeriodSchema.safeParse({ name: "x", start_date: "kemarin", end_date: "besok" })).sort()
    ).toEqual(["end_date", "name", "start_date"]);
  });
});
