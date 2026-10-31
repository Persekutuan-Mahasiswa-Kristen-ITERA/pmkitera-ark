import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
  getDownloadUrl: vi.fn(),
  getPublicUrl: vi.fn(),
  fileExists: vi.fn(),
}));

vi.mock("@/lib/db/prisma", async () => {
  const { createPrismaMock } = await import("../helpers/prisma-mock");
  return { prisma: createPrismaMock() };
});
vi.mock("@/lib/storage", () => ({ storageService: storage }));

import { prisma as mockedPrisma } from "@/lib/db/prisma";
import { MAX_FILE_SIZE_BYTES } from "@/lib/validation/file";
import {
  FileValidationError,
  createDocument,
  deleteDocument,
  deleteDocumentFile,
  generateDownloadUrl,
  getDocument,
  getLatestByCategory,
  listDocuments,
  listWorshipServices,
  publishDocument,
  unpublishDocument,
  updateDocument,
  uploadDocumentFile,
  type UploadedFile,
} from "@/services/document-service";
import type { PrismaMock } from "../helpers/prisma-mock";

const db = mockedPrisma as unknown as PrismaMock;

const PDF = "application/pdf";
const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
const STAMP = 1_788_000_000_000;

function file(overrides: Partial<UploadedFile> = {}): UploadedFile {
  return { buffer: Buffer.from("data"), contentType: PDF, filename: "warta.pdf", size: 1024, ...overrides };
}

beforeEach(() => {
  for (const m of Object.values(db)) for (const fn of Object.values(m)) fn.mockReset();
  for (const fn of Object.values(storage)) fn.mockReset();
  storage.uploadFile.mockImplementation(async ({ key }: { key: string }) => ({
    key,
    url: `https://files.example.test/${key}`,
  }));
  storage.deleteFile.mockResolvedValue(true);
  vi.spyOn(Date, "now").mockReturnValue(STAMP);
});

describe("uploadDocumentFile", () => {
  it("rejects unsupported content types before touching storage", async () => {
    const err = await uploadDocumentFile(file({ contentType: "image/png" }), new Date(2026, 8, 4)).catch((e) => e);
    expect(err).toBeInstanceOf(FileValidationError);
    expect(err.message).toBe("Tipe file image/png tidak didukung. Hanya .pptx dan .pdf.");
    expect(storage.uploadFile).not.toHaveBeenCalled();
  });

  it("rejects files above 50 MB but accepts exactly 50 MB", async () => {
    const err = await uploadDocumentFile(file({ size: MAX_FILE_SIZE_BYTES + 1 }), new Date(2026, 8, 4)).catch((e) => e);
    expect(err).toBeInstanceOf(FileValidationError);
    expect(err.message).toBe("Ukuran file 50.0MB melebihi batas.");
    expect(storage.uploadFile).not.toHaveBeenCalled();

    await expect(uploadDocumentFile(file({ size: MAX_FILE_SIZE_BYTES }), new Date(2026, 8, 4))).resolves.toMatchObject({
      ext: "pdf",
    });
  });

  it("rejects a supported MIME type with the wrong extension", async () => {
    const err = await uploadDocumentFile(file({ filename: "warta.docx" }), new Date(2026, 8, 4)).catch((e) => e);
    expect(err).toBeInstanceOf(FileValidationError);
    expect(err.message).toBe("Ekstensi file harus .pptx atau .pdf");
    expect(storage.uploadFile).not.toHaveBeenCalled();
  });

  it.each([
    ["warta.pdf", PDF, new Date(2026, 8, 4), `documents/2026/09/warta-${STAMP}.pdf`, "pdf"],
    ["Ibadah Jumat (Final) v2.PPTX", PPTX, new Date(2027, 0, 15), `documents/2027/01/ibadah-jumat-final-v2-${STAMP}.pptx`, "pptx"],
    ["__Warta  Jemaat__.pdf", PDF, new Date(2026, 11, 31), `documents/2026/12/warta-jemaat-${STAMP}.pdf`, "pdf"],
    ["khotbah.natal.2026.pdf", PDF, new Date(2026, 11, 25), `documents/2026/12/khotbah-natal-2026-${STAMP}.pdf`, "pdf"],
    ["Khotbah---Paskah ✝.pdf", PDF, new Date(2026, 3, 3), `documents/2026/04/khotbah-paskah-${STAMP}.pdf`, "pdf"],
  ])("stores %j under a dated, sanitised key", async (filename, contentType, eventDate, key, ext) => {
    const result = await uploadDocumentFile(file({ filename, contentType }), eventDate);
    expect(result).toEqual({ key, url: `https://files.example.test/${key}`, ext });
    expect(storage.uploadFile).toHaveBeenCalledWith({
      key,
      body: expect.any(Buffer),
      contentType,
      metadata: { original_filename: filename, uploaded_at: expect.any(String) },
    });
    const { uploaded_at } = storage.uploadFile.mock.calls[0][0].metadata;
    expect(new Date(uploaded_at).toISOString()).toBe(uploaded_at);
  });
});

describe("deleteDocumentFile / generateDownloadUrl", () => {
  it("does nothing for an empty key", async () => {
    await expect(deleteDocumentFile(null)).resolves.toBe(false);
    await expect(deleteDocumentFile(undefined)).resolves.toBe(false);
    await expect(deleteDocumentFile("")).resolves.toBe(false);
    expect(storage.deleteFile).not.toHaveBeenCalled();
  });

  it("returns the storage result and swallows storage errors", async () => {
    await expect(deleteDocumentFile("documents/a.pdf")).resolves.toBe(true);
    storage.deleteFile.mockRejectedValueOnce(new Error("boom"));
    await expect(deleteDocumentFile("documents/a.pdf")).resolves.toBe(false);
  });

  it("asks storage for a presigned URL with a 1 hour default TTL", async () => {
    storage.getDownloadUrl.mockResolvedValue("https://signed.example.test/a");
    await expect(generateDownloadUrl("documents/a.pdf")).resolves.toBe("https://signed.example.test/a");
    expect(storage.getDownloadUrl).toHaveBeenCalledWith("documents/a.pdf", 3600);
    await generateDownloadUrl("documents/a.pdf", 60);
    expect(storage.getDownloadUrl).toHaveBeenLastCalledWith("documents/a.pdf", 60);
  });
});

const input = {
  title: "Warta Jemaat",
  category_id: 2,
  service_period_id: 1,
  event_date: "2026-09-04",
  speaker: "Pdt. Contoh",
  description: "",
  status: "draft" as const,
};

describe("createDocument", () => {
  it("uploads the file then stores the record with BigInt ids and the detected type", async () => {
    db.document.create.mockResolvedValue({ id: BigInt(10) });
    await expect(createDocument(input, file({ filename: "slides.pptx", contentType: PPTX }), 7)).resolves.toEqual({
      id: BigInt(10),
    });

    const expectedKey = `documents/2026/09/slides-${STAMP}.pptx`;
    expect(db.document.create).toHaveBeenCalledWith({
      data: {
        title: "Warta Jemaat",
        category_id: BigInt(2),
        service_period_id: BigInt(1),
        event_date: new Date("2026-09-04"),
        speaker: "Pdt. Contoh",
        description: null,
        file_path: expectedKey,
        file_type: "pptx",
        status: "draft",
        uploaded_by: BigInt(7),
      },
    });
  });

  it("removes the uploaded object when the database insert fails", async () => {
    db.document.create.mockRejectedValue(new Error("FK violation"));
    await expect(createDocument(input, file(), 7)).rejects.toThrow("FK violation");
    expect(storage.deleteFile).toHaveBeenCalledWith(`documents/2026/09/warta-${STAMP}.pdf`);
  });

  it("does not write to the database when the file is invalid", async () => {
    await expect(createDocument(input, file({ contentType: "text/plain" }), 7)).rejects.toBeInstanceOf(
      FileValidationError
    );
    expect(db.document.create).not.toHaveBeenCalled();
  });
});

const existing = {
  id: BigInt(5),
  title: "Lama",
  category_id: BigInt(1),
  service_period_id: BigInt(1),
  event_date: new Date(2026, 7, 7),
  speaker: "Lama",
  description: "desc lama",
  status: "draft",
  file_path: "documents/2026/08/lama-1.pdf",
  file_type: "pdf",
};

describe("updateDocument", () => {
  it("throws when the document does not exist", async () => {
    db.document.findUnique.mockResolvedValue(null);
    await expect(updateDocument(5, { title: "Baru" })).rejects.toThrow("Dokumen tidak ditemukan");
    expect(db.document.update).not.toHaveBeenCalled();
  });

  it("merges a partial patch over the existing record without touching the file", async () => {
    db.document.findUnique.mockResolvedValue(existing);
    db.document.update.mockResolvedValue({ id: BigInt(5) });

    await updateDocument(5, { title: "Baru", status: "published" });

    expect(db.document.update).toHaveBeenCalledWith({
      where: { id: BigInt(5) },
      data: {
        title: "Baru",
        category_id: BigInt(1),
        service_period_id: BigInt(1),
        event_date: existing.event_date,
        speaker: "Lama",
        description: "desc lama",
        status: "published",
        file_path: existing.file_path,
        file_type: "pdf",
      },
    });
    expect(storage.uploadFile).not.toHaveBeenCalled();
    expect(storage.deleteFile).not.toHaveBeenCalled();
  });

  it("converts changed ids and dates and records the uploader when given", async () => {
    db.document.findUnique.mockResolvedValue(existing);
    db.document.update.mockResolvedValue({ id: BigInt(5) });

    await updateDocument(5, { category_id: 3, service_period_id: 2, event_date: "2026-10-02", description: "" }, 9);

    expect(db.document.update.mock.calls[0][0].data).toMatchObject({
      category_id: BigInt(3),
      service_period_id: BigInt(2),
      event_date: new Date("2026-10-02"),
      description: "",
      uploaded_by: BigInt(9),
    });
  });

  it("replaces the file: uploads under the new event date and deletes the old object after saving", async () => {
    db.document.findUnique.mockResolvedValue(existing);
    db.document.update.mockResolvedValue({ id: BigInt(5) });

    await updateDocument(5, { event_date: "2026-10-02" }, undefined, file({ filename: "baru.pptx", contentType: PPTX }));

    const newKey = `documents/2026/10/baru-${STAMP}.pptx`;
    expect(db.document.update.mock.calls[0][0].data).toMatchObject({ file_path: newKey, file_type: "pptx" });
    expect(storage.deleteFile).toHaveBeenCalledWith(existing.file_path);
    expect(db.document.update.mock.invocationCallOrder[0]).toBeLessThan(
      storage.deleteFile.mock.invocationCallOrder[0]
    );
  });

  it("uses the existing event date for the key when the patch has none", async () => {
    db.document.findUnique.mockResolvedValue(existing);
    db.document.update.mockResolvedValue({ id: BigInt(5) });

    await updateDocument(5, {}, undefined, file());
    expect(db.document.update.mock.calls[0][0].data.file_path).toBe(`documents/2026/08/warta-${STAMP}.pdf`);
  });
});

describe("deleteDocument / publishDocument / unpublishDocument", () => {
  it("deletes the record and then its file", async () => {
    db.document.findUnique.mockResolvedValue(existing);
    await deleteDocument(5);
    expect(db.document.delete).toHaveBeenCalledWith({ where: { id: BigInt(5) } });
    expect(storage.deleteFile).toHaveBeenCalledWith(existing.file_path);
  });

  it.each([deleteDocument, publishDocument, unpublishDocument])("%o throws for a missing document", async (fn) => {
    db.document.findUnique.mockResolvedValue(null);
    await expect(fn(99)).rejects.toThrow("Dokumen tidak ditemukan");
    expect(db.document.update).not.toHaveBeenCalled();
    expect(db.document.delete).not.toHaveBeenCalled();
  });

  it("publish and unpublish only flip the status", async () => {
    db.document.findUnique.mockResolvedValue(existing);
    await publishDocument(5);
    expect(db.document.update).toHaveBeenLastCalledWith({ where: { id: BigInt(5) }, data: { status: "published" } });
    await unpublishDocument(5);
    expect(db.document.update).toHaveBeenLastCalledWith({ where: { id: BigInt(5) }, data: { status: "draft" } });
  });
});

describe("getDocument", () => {
  it("hides drafts from the public", async () => {
    db.document.findFirst.mockResolvedValue(null);
    await getDocument(5);
    expect(db.document.findFirst.mock.calls[0][0].where).toEqual({ id: BigInt(5), status: "published" });
  });

  it("includes drafts for staff", async () => {
    db.document.findFirst.mockResolvedValue(existing);
    await expect(getDocument(5, true)).resolves.toBe(existing);
    expect(db.document.findFirst.mock.calls[0][0].where).toEqual({ id: BigInt(5) });
    expect(db.document.findFirst.mock.calls[0][0].include.uploader).toEqual({
      select: { id: true, name: true, email: true },
    });
  });
});

describe("listDocuments", () => {
  beforeEach(() => {
    db.document.findMany.mockResolvedValue([]);
    db.document.count.mockResolvedValue(25);
  });

  it("defaults to published documents, page 1 of 12, newest first", async () => {
    await expect(listDocuments()).resolves.toEqual({ items: [], total: 25, page: 1, pageSize: 12, totalPages: 3 });
    const args = db.document.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ status: "published" });
    expect(args).toMatchObject({ orderBy: { event_date: "desc" }, skip: 0, take: 12 });
    expect(db.document.count).toHaveBeenCalledWith({ where: { status: "published" } });
  });

  it("paginates with skip/take", async () => {
    const result = await listDocuments({ page: 3, pageSize: 5 });
    expect(db.document.findMany.mock.calls[0][0]).toMatchObject({ skip: 10, take: 5 });
    expect(result.totalPages).toBe(5);
  });

  it("drops the status filter for staff and applies category and search filters", async () => {
    await listDocuments({ includeDrafts: true, categoryId: 4, search: "natal" });
    expect(db.document.findMany.mock.calls[0][0].where).toEqual({
      category_id: BigInt(4),
      OR: [
        { title: { contains: "natal", mode: "insensitive" } },
        { speaker: { contains: "natal", mode: "insensitive" } },
      ],
    });
  });

  it("filters a whole year in UTC", async () => {
    await listDocuments({ year: 2026 });
    expect(db.document.findMany.mock.calls[0][0].where.event_date).toEqual({
      gte: new Date("2026-01-01T00:00:00.000Z"),
      lte: new Date("2026-12-31T23:59:59.999Z"),
    });
  });

  it("narrows to a month when year and month are given", async () => {
    await listDocuments({ year: 2026, month: 2 });
    expect(db.document.findMany.mock.calls[0][0].where.event_date).toEqual({
      gte: new Date("2026-02-01T00:00:00.000Z"),
      // End of month is built in server-local time (UTC on Vercel).
      lte: new Date(2026, 2, 0, 23, 59, 59, 999),
    });
  });

  it("ignores a month without a year", async () => {
    await listDocuments({ month: 5 });
    expect(db.document.findMany.mock.calls[0][0].where.event_date).toEqual({});
  });
});

describe("getLatestByCategory", () => {
  it("returns the newest published documents keyed by category slug", async () => {
    db.category.findMany.mockResolvedValue([
      { id: BigInt(1), slug: "ppt-ibadah" },
      { id: BigInt(2), slug: "warta" },
    ]);
    db.document.findMany.mockImplementation(async ({ where }: { where: { category_id: bigint } }) =>
      where.category_id === BigInt(1) ? [{ id: BigInt(11) }] : []
    );

    await expect(getLatestByCategory(2)).resolves.toEqual({ "ppt-ibadah": [{ id: BigInt(11) }], warta: [] });
    expect(db.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { category_id: BigInt(1), status: "published" }, take: 2 })
    );
  });
});

describe("listWorshipServices", () => {
  // Server runs in WIB in these tests; event dates are stored as instants.
  const at = (y: number, m: number, d: number, h = 0) => new Date(y, m - 1, d, h);

  it("groups published documents by local event day and sorts each group by category name", async () => {
    db.document.findMany
      .mockResolvedValueOnce([
        { event_date: at(2026, 9, 11, 18) },
        { event_date: at(2026, 9, 11, 19) },
        { event_date: at(2026, 9, 4, 18) },
      ])
      .mockResolvedValueOnce([
        { id: BigInt(1), event_date: at(2026, 9, 11, 18), category: { name: "Warta Jemaat" } },
        { id: BigInt(2), event_date: at(2026, 9, 11, 19), category: { name: "PPT Ibadah" } },
        { id: BigInt(3), event_date: at(2026, 9, 4, 18), category: { name: "PPT Khotbah" } },
      ]);

    const result = await listWorshipServices({}, 1, 4);

    expect(result).toMatchObject({ totalGroups: 2, page: 1, totalPages: 1 });
    expect(result.groups.map((g) => g.date)).toEqual(["2026-09-11", "2026-09-04"]);
    expect(result.groups[0].event_date).toEqual(at(2026, 9, 11));
    expect(result.groups[0].documents.map((d) => d.id)).toEqual([BigInt(2), BigInt(1)]);
    expect(result.groups[1].documents.map((d) => d.id)).toEqual([BigInt(3)]);

    const [distinctCall, docsCall] = db.document.findMany.mock.calls.map((c) => c[0]);
    expect(distinctCall).toMatchObject({ where: { status: "published" }, distinct: ["event_date"] });
    expect(docsCall.where.AND[0].OR).toEqual([
      { event_date: { gte: at(2026, 9, 11), lte: new Date(2026, 8, 11, 23, 59, 59, 999) } },
      { event_date: { gte: at(2026, 9, 4), lte: new Date(2026, 8, 4, 23, 59, 59, 999) } },
    ]);
  });

  it("clamps the page into range and slices the date groups", async () => {
    db.document.findMany
      .mockResolvedValueOnce([at(2026, 9, 25), at(2026, 9, 18), at(2026, 9, 11)].map((d) => ({ event_date: d })))
      .mockResolvedValueOnce([]);

    const result = await listWorshipServices({}, 99, 2);
    expect(result).toMatchObject({ totalGroups: 3, totalPages: 2, page: 2 });
    expect(result.groups.map((g) => g.date)).toEqual(["2026-09-11"]);
    expect(result.groups[0].documents).toEqual([]);
  });

  it("returns an empty first page when nothing is published", async () => {
    db.document.findMany.mockResolvedValueOnce([]);
    await expect(listWorshipServices({}, 0)).resolves.toEqual({ groups: [], totalGroups: 0, page: 1, totalPages: 1 });
    expect(db.document.findMany).toHaveBeenCalledTimes(1);
  });

  it("passes category and search filters to both queries", async () => {
    db.document.findMany.mockResolvedValueOnce([{ event_date: at(2026, 9, 4) }]).mockResolvedValueOnce([]);
    await listWorshipServices({ categoryId: 3, search: "paskah" });
    const [first, second] = db.document.findMany.mock.calls.map((c) => c[0].where);
    expect(first).toMatchObject({ status: "published", category_id: BigInt(3) });
    expect(first.OR).toHaveLength(2);
    expect(second).toMatchObject({ status: "published", category_id: BigInt(3) });
  });

  // Regresi: OR rentang tanggal dulu menimpa OR pencarian.
  it("keeps the search clause when loading the documents for each date", async () => {
    db.document.findMany.mockResolvedValueOnce([{ event_date: at(2026, 9, 4) }]).mockResolvedValueOnce([]);
    await listWorshipServices({ search: "paskah" });
    const second = JSON.stringify(db.document.findMany.mock.calls[1][0].where);
    expect(second).toContain("paskah");
  });
});
