import { z } from "zod";

export const documentStatusSchema = z.enum(["draft", "published"]);
export const fileTypeSchema = z.enum(["pptx", "pdf"]);
export const userRoleSchema = z.enum(["admin", "pengurus", "jemaat"]);

export const createDocumentSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(200),
  category_id: z.coerce.number().int().positive("Kategori wajib dipilih"),
  service_period_id: z.coerce.number().int().positive("Periode pelayanan wajib dipilih"),
  event_date: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Tanggal tidak valid"),
  speaker: z.string().min(2, "Pengisi wajib diisi").max(150),
  description: z.string().max(2000).optional().or(z.literal("")),
  status: documentStatusSchema.default("draft"),
});

// Field tambahan yang tidak di-validate dari klien: file_type akan di-infer
// otomatis dari ekstensi file yang di-upload (lihat document-service.ts).
export const updateDocumentSchema = createDocumentSchema.partial();

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh berisi huruf kecil, angka, dan strip"),
  description: z.string().max(300).optional().or(z.literal("")),
});

export const servicePeriodSchema = z.object({
  name: z.string().min(2).max(50),
  start_date: z.string().refine((v) => !Number.isNaN(Date.parse(v))),
  end_date: z.string().refine((v) => !Number.isNaN(Date.parse(v))),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ServicePeriodInput = z.infer<typeof servicePeriodSchema>;
