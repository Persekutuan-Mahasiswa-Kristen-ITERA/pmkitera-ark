import { prisma } from "@/lib/db/prisma";
import { storageService } from "@/lib/storage";
import {
  CreateDocumentInput,
  UpdateDocumentInput,
} from "@/lib/validation/document";
import {
  detectFileExtension,
  isAcceptedFileType,
  MAX_FILE_SIZE_BYTES,
  AcceptedFileExtension,
} from "@/lib/validation/file";

export interface UploadedFile {
  buffer: Buffer;
  contentType: string;
  filename: string;
  size: number;
}

export interface ListFilter {
  categoryId?: number;
  year?: number;
  month?: number; // 1-12
  search?: string;
  page?: number;
  pageSize?: number;
  includeDrafts?: boolean;
}

function buildStorageKey(filename: string, ext: AcceptedFileExtension, eventDate: Date): string {
  const year = eventDate.getFullYear();
  const month = String(eventDate.getMonth() + 1).padStart(2, "0");
  const base = filename
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const stamp = Date.now();
  return `documents/${year}/${month}/${base}-${stamp}.${ext}`;
}

export class FileValidationError extends Error {}

export async function uploadDocumentFile(file: UploadedFile, eventDate: Date) {
  if (!isAcceptedFileType(file.contentType)) {
    throw new FileValidationError(
      `Tipe file ${file.contentType} tidak didukung. Hanya .pptx dan .pdf.`
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileValidationError(
      `Ukuran file ${(file.size / 1024 / 1024).toFixed(1)}MB melebihi batas.`
    );
  }
  const ext = detectFileExtension(file.filename);
  if (!ext) {
    throw new FileValidationError("Ekstensi file harus .pptx atau .pdf");
  }

  const key = buildStorageKey(file.filename, ext, eventDate);
  const result = await storageService.uploadFile({
    key,
    body: file.buffer,
    contentType: file.contentType,
    metadata: {
      original_filename: file.filename,
      uploaded_at: new Date().toISOString(),
    },
  });
  return { key: result.key, url: result.url, ext };
}

export async function deleteDocumentFile(key: string | null | undefined): Promise<boolean> {
  if (!key) return false;
  try {
    return await storageService.deleteFile(key);
  } catch {
    return false;
  }
}

export async function generateDownloadUrl(key: string, ttlSeconds = 3600) {
  return await storageService.getDownloadUrl(key, ttlSeconds);
}

export async function createDocument(
  input: CreateDocumentInput,
  file: UploadedFile,
  uploadedBy: number
) {
  const eventDate = new Date(input.event_date);
  const uploaded = await uploadDocumentFile(file, eventDate);

  try {
    const document = await prisma.document.create({
      data: {
        title: input.title,
        category_id: BigInt(input.category_id),
        service_period_id: BigInt(input.service_period_id),
        event_date: eventDate,
        speaker: input.speaker,
        description: input.description || null,
        file_path: uploaded.key,
        file_type: uploaded.ext, // auto-detected (.pptx or .pdf)
        status: input.status,
        uploaded_by: BigInt(uploadedBy),
      },
    });

    return document;
  } catch (err) {
    await deleteDocumentFile(uploaded.key);
    throw err;
  }
}

export async function updateDocument(
  id: number,
  input: UpdateDocumentInput,
  uploadedBy?: number,
  replaceFile?: UploadedFile
) {
  const existing = await prisma.document.findUnique({
    where: { id: BigInt(id) },
  });
  if (!existing) throw new Error("Dokumen tidak ditemukan");

  let newFilePath = existing.file_path;
  let newFileType = existing.file_type;
  let oldFilePath: string | null = null;

  if (replaceFile) {
    const eventDate = input.event_date ? new Date(input.event_date) : existing.event_date;
    const uploaded = await uploadDocumentFile(replaceFile, eventDate);
    newFilePath = uploaded.key;
    newFileType = uploaded.ext;
    oldFilePath = existing.file_path;
  }

  const updated = await prisma.document.update({
    where: { id: BigInt(id) },
    data: {
      title: input.title ?? existing.title,
      category_id: input.category_id !== undefined ? BigInt(input.category_id) : existing.category_id,
      service_period_id:
        input.service_period_id !== undefined
          ? BigInt(input.service_period_id)
          : existing.service_period_id,
      event_date: input.event_date ? new Date(input.event_date) : existing.event_date,
      speaker: input.speaker ?? existing.speaker,
      description: input.description !== undefined ? input.description : existing.description,
      status: input.status ?? existing.status,
      file_path: newFilePath,
      file_type: newFileType,
      ...(uploadedBy !== undefined ? { uploaded_by: BigInt(uploadedBy) } : {}),
    },
  });

  if (oldFilePath) {
    await deleteDocumentFile(oldFilePath);
  }

  return updated;
}

export async function deleteDocument(id: number) {
  const existing = await prisma.document.findUnique({ where: { id: BigInt(id) } });
  if (!existing) throw new Error("Dokumen tidak ditemukan");

  await prisma.document.delete({ where: { id: BigInt(id) } });
  await deleteDocumentFile(existing.file_path);
}

export async function publishDocument(id: number) {
  const doc = await prisma.document.findUnique({ where: { id: BigInt(id) } });
  if (!doc) throw new Error("Dokumen tidak ditemukan");

  return await prisma.document.update({
    where: { id: BigInt(id) },
    data: { status: "published" },
  });
}

export async function unpublishDocument(id: number) {
  const doc = await prisma.document.findUnique({ where: { id: BigInt(id) } });
  if (!doc) throw new Error("Dokumen tidak ditemukan");

  return await prisma.document.update({
    where: { id: BigInt(id) },
    data: { status: "draft" },
  });
}

export async function getDocument(id: number, includeDrafts = false) {
  const where: any = { id: BigInt(id) };
  if (!includeDrafts) {
    where.status = "published";
  }

  const doc = await prisma.document.findFirst({
    where,
    include: {
      category: true,
      service_period: true,
      uploader: { select: { id: true, name: true, email: true } },
    },
  });
  return doc;
}

export async function listDocuments(filter: ListFilter = {}) {
  const where: any = {};
  if (!filter.includeDrafts) where.status = "published";
  if (filter.categoryId) where.category_id = BigInt(filter.categoryId);
  if (filter.year || filter.month) {
    where.event_date = {};
    if (filter.year) {
      where.event_date.gte = new Date(`${filter.year}-01-01T00:00:00.000Z`);
      where.event_date.lte = new Date(`${filter.year}-12-31T23:59:59.999Z`);
    }
    if (filter.month && filter.year) {
      const start = new Date(`${filter.year}-${String(filter.month).padStart(2, "0")}-01T00:00:00.000Z`);
      const end = new Date(filter.year, filter.month, 0, 23, 59, 59, 999);
      where.event_date = { gte: start, lte: end };
    }
  }
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { speaker: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const page = filter.page ?? 1;
  const pageSize = filter.pageSize ?? 12;
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        category: true,
        service_period: true,
      },
      orderBy: { event_date: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.document.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getLatestByCategory(limit = 1) {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const result: Record<string, any[]> = {};
  for (const cat of categories) {
    const docs = await prisma.document.findMany({
      where: { category_id: cat.id, status: "published" },
      include: { category: true, service_period: true },
      orderBy: { event_date: "desc" },
      take: limit,
    });
    result[cat.slug] = docs;
  }
  return result;
}

export interface WorshipServiceGroup {
  // Kunci grup: tanggal ibadah dalam format YYYY-MM-DD
  date: string;
  event_date: Date;
  documents: any[];
}

/**
 * Opsi B: kelompokkan dokumen published per tanggal ibadah (1 ibadah = 1 grup,
 * mis. PPT Ibadah + Warta Jemaat + PPT Khotbah dengan event_date sama).
 */
export async function listWorshipServices(filter: Omit<ListFilter, "page" | "pageSize"> = {}, page = 1, groupsPerPage = 4): Promise<{
  groups: WorshipServiceGroup[];
  totalGroups: number;
  page: number;
  totalPages: number;
}> {
  const where: any = { status: "published" };
  if (filter.categoryId) where.category_id = BigInt(filter.categoryId);
  if (filter.year || filter.month) {
    where.event_date = {};
    if (filter.year) {
      where.event_date.gte = new Date(`${filter.year}-01-01T00:00:00.000Z`);
      where.event_date.lte = new Date(`${filter.year}-12-31T23:59:59.999Z`);
    }
    if (filter.month && filter.year) {
      const start = new Date(`${filter.year}-${String(filter.month).padStart(2, "0")}-01T00:00:00.000Z`);
      const end = new Date(filter.year, filter.month, 0, 23, 59, 59, 999);
      where.event_date = { gte: start, lte: end };
    }
  }
  if (filter.search) {
    where.OR = [
      { title: { contains: filter.search, mode: "insensitive" } },
      { speaker: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  // 1. Ambil daftar tanggal ibadah (distinct event_date) yang punya dokumen published.
  const dateRows = await prisma.document.findMany({
    where,
    select: { event_date: true },
    distinct: ["event_date"],
    orderBy: { event_date: "desc" },
  });

  // Normalisasi ke kunci YYYY-MM-DD (event_date bisa punya komponen jam berbeda).
  const dateKeys = Array.from(
    new Set(
      dateRows.map((r) => {
        const d = new Date(r.event_date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })
    )
  );

  const totalGroups = dateKeys.length;
  const totalPages = Math.max(1, Math.ceil(totalGroups / groupsPerPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageKeys = dateKeys.slice((safePage - 1) * groupsPerPage, safePage * groupsPerPage);

  if (pageKeys.length === 0) {
    return { groups: [], totalGroups, page: safePage, totalPages };
  }

  // 2. Ambil semua dokumen published yang jatuh pada tanggal-tanggal halaman ini.
  const dayRanges = pageKeys.map((key) => {
    const [y, m, d] = key.split("-").map(Number);
    return {
      gte: new Date(y, m - 1, d, 0, 0, 0, 0),
      lte: new Date(y, m - 1, d, 23, 59, 59, 999),
    };
  });

  const docs = await prisma.document.findMany({
    where: { ...where, OR: dayRanges.map((r) => ({ event_date: r })) },
    include: { category: true, service_period: true },
    orderBy: { event_date: "desc" },
  });

  // 3. Kelompokkan berdasarkan kunci tanggal, urut kategori di dalam grup.
  const byKey = new Map<string, any[]>();
  for (const doc of docs) {
    const d = new Date(doc.event_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(doc);
  }

  const groups: WorshipServiceGroup[] = pageKeys.map((key) => {
    const [y, m, d] = key.split("-").map(Number);
    return {
      date: key,
      event_date: new Date(y, m - 1, d),
      documents: (byKey.get(key) || []).sort((a, b) =>
        String(a.category?.name || "").localeCompare(String(b.category?.name || ""))
      ),
    };
  });

  return { groups, totalGroups, page: safePage, totalPages };
}
