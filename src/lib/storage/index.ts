import { storageService as r2Service } from "./r2";
import { StorageService } from "./types";

// Aturan arsitektur: business logic tidak boleh import langsung dari r2.ts.
// Hanya file ini yang memilih implementasi storage.
// Untuk migrasi ke S3/Supabase Storage/dll, cukup tambahkan implementasi baru
// di sini dan ganti export di bawah ini.
export const storageService: StorageService = r2Service;
export type { StorageService, UploadOptions } from "./types";
