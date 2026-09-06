# Prompt: Perbaikan Security & Performance — PMK ARK

> Copy semua isi file ini sebagai instruksi ke coding agent kamu. Agent perlu akses ke repo `pmkitera-ark` (atau kode aktual yang sedang berjalan, karena kode di GitHub baru scaffold kosong — pastikan agent kerja di kode yang benar).

## Konteks

PMK ARK adalah aplikasi Next.js (App Router) buat arsip dokumen pelayanan (PPT Ibadah, Warta, Khotbah). Stack: Prisma + PostgreSQL (Supabase), Cloudflare R2 (via `@aws-sdk/client-s3`) untuk file storage, session auth custom pakai JWT (`jose`) disimpan di cookie httpOnly. Sudah dilakukan audit manual dan ditemukan sejumlah bug performa & celah keamanan konkret. Tugasmu adalah memperbaiki semuanya sesuai checklist di bawah, **tanpa mengubah tech stack, desain UI, atau struktur database**.

## Cara Kerja

1. Kerjakan checklist berikut **urut sesuai prioritas** (keamanan kritis dulu, baru performa).
2. Untuk tiap item: baca file terkait dulu (isinya bisa beda sedikit dari cuplikan di bawah), terapkan fix, lalu di akhir kasih ringkasan singkat apa yang diubah + cara verifikasi.
3. Kalau ketemu pola bug yang sama di tempat lain yang tidak disebut eksplisit di sini (misal fallback credential lain), boleh sekalian dibenerin — catat saja di ringkasan.
4. Jangan berhenti minta konfirmasi untuk keputusan kecil (nama variabel, dsb) — ambil keputusan yang masuk akal dan lanjutkan. Baru tanya kalau butuh keputusan besar (mis. mengubah skema database).
5. Setelah semua selesai, jalankan `pnpm build` dan pastikan tidak ada error sebelum melapor selesai.

---

## 🔴 Prioritas 1 — Keamanan Kritis

### 1. Hapus fallback session secret hardcoded
**File:** `src/lib/auth/session.ts`

Saat ini:
```ts
function getSecret(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ||
    "pmk-ark-dev-only-secret-please-change-this-in-production-32b";
  return new TextEncoder().encode(secret);
}
```
Karena repo public, string fallback ini sudah diketahui semua orang — kalau `SESSION_SECRET` lupa di-set di production, siapapun bisa forge JWT session dengan role admin.

**Fix:** hapus fallback-nya, throw error kalau env var tidak ada:
```ts
function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET wajib diset (minimal 32 karakter) di environment variable.");
  }
  return new TextEncoder().encode(secret);
}
```
Tambahkan juga `SESSION_SECRET` acak yang kuat (generate baru, minimal 32 byte random) ke `.env` production yang sebenarnya — jangan pakai string default lama.

### 2. Hapus fallback kredensial mock di storage R2
**File:** `src/lib/storage/r2.ts`

Saat ini constructor fallback ke `"mock-account"`, `"mock-access-key"`, dst kalau env var kosong — bikin request diam-diam nyoba connect ke endpoint palsu dan hang lama sebelum gagal.

**Fix:** validasi di constructor, throw kalau ada yang kosong:
```ts
constructor() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error(
      "Konfigurasi R2 tidak lengkap. Pastikan R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, dan R2_PUBLIC_URL sudah diset."
    );
  }
  // lanjutkan assign seperti biasa, tanpa fallback mock
}
```

### 3. Tambahkan middleware proteksi route admin
**File baru:** `src/middleware.ts` (belum ada sama sekali saat ini)

Buat middleware yang cek session dari cookie sebelum mengizinkan akses ke path admin (sesuaikan prefix path admin yang sebenarnya dipakai, misal `/admin`):
```ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const session = await getSessionFromCookie();
    if (!session || !["admin", "pengurus"].includes(session.role)) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```
Sesuaikan path `/login` dan role yang diizinkan dengan implementasi aktual. Tujuannya: proteksi terpusat di satu tempat, bukan dicek manual berulang di tiap halaman admin.

### 4. Audit filter status "published" di query dokumen publik
**File:** kemungkinan `src/services/document-service.ts` (belum sempat direview)

Pastikan fungsi `getDocument(id, includeDraft)` dan `listWorshipServices(...)` benar-benar filter `WHERE status = 'published'` **di level query Prisma** ketika dipanggil dari halaman publik — bukan cuma dicek belakangan di komponen. Kalau parameter kedua `false`, query harus punya `where: { status: "published", ... }`. Tambahkan test/manual check: akses `/arsip/{id-dokumen-draft}` langsung by ID harus menghasilkan 404, bukan menampilkan isinya.

---

## 🟠 Prioritas 2 — Performa (penyebab situs terasa berat)

### 5. Hilangkan self-fetch di halaman detail dokumen
**File:** `src/app/arsip/[id]/page.tsx`

Saat ini Server Component melakukan HTTP fetch ke API route-nya sendiri:
```ts
const downloadRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/documents/${doc.id}/download`)...
```
Ini nambah round-trip HTTP penuh di setiap page view, dan bisa hang lama kalau `NEXT_PUBLIC_SITE_URL` salah/kosong.

**Fix:** panggil langsung fungsi storage-nya di server, tanpa lewat HTTP:
```ts
import { storageService } from "@/lib/storage/r2";
// ...
const downloadUrl = await storageService.getDownloadUrl(doc.file_path).catch(() => null);
```
Hapus penggunaan `fetch` ke API route sendiri. Kalau API route `/api/documents/[id]/download` juga dipakai dari client-side lain (misal tombol download di halaman lain), boleh dibiarkan ada, tapi Server Component ini tidak boleh manggilnya lewat HTTP — panggil fungsinya langsung.

### 6. Perbaiki connection string database ke Supabase pooler
**File:** `.env.example` (dan **cek `.env` asli di server/deployment yang sebenarnya**)

Saat ini:
```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?pgboiler=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
```
Dua masalah: (1) typo `pgboiler=true` seharusnya `pgbouncer=true`, (2) `DATABASE_URL` tidak lewat pooler Supavisor sama sekali (masih port 5432 langsung).

**Fix**, sesuai dokumentasi resmi Prisma+Supabase:
```
# DATABASE_URL — lewat Supavisor transaction pooler, dipakai runtime queries
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# DIRECT_URL — koneksi langsung, dipakai migrate/db push
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
```
Ganti `[region]` sesuai region project Supabase kamu (bisa dilihat di connection string asli dari dashboard Supabase → Settings → Database). **Update juga `.env` asli di environment production/staging**, bukan cuma `.env.example`.

### 7. Ganti `force-dynamic` jadi caching yang lebih hemat
**File:** `src/app/arsip/page.tsx` dan `src/app/arsip/[id]/page.tsx`

Saat ini `export const dynamic = "force-dynamic"` bikin setiap request selalu render ulang + query DB dari nol, padahal data cuma berubah saat admin publish dokumen baru.

**Fix:** ganti ke ISR dengan revalidate time-based sebagai baseline:
```ts
export const revalidate = 300; // 5 menit, sesuaikan kebutuhan
```
Lalu tambahkan `revalidatePath("/arsip")` (dan halaman detail terkait) di action/endpoint yang dipakai admin untuk publish/edit/hapus dokumen, supaya perubahan langsung muncul tanpa nunggu 5 menit. Kalau halaman arsip pakai `searchParams` untuk filter (jadi banyak variasi URL), pertimbangkan cache di level data-fetching (`unstable_cache` atau cache Prisma query) daripada full-page revalidate.

---

## Setelah Selesai

- Jalankan `pnpm build`, pastikan tidak ada error/warning baru.
- Test manual: buka `/arsip` dan `/arsip/[id]`, pastikan tombol download tetap berfungsi dan terasa lebih responsif.
- Coba jalankan app **tanpa** `SESSION_SECRET` dan tanpa env var R2 — pastikan sekarang app gagal start dengan pesan error yang jelas, bukan diam-diam jalan dengan fallback.
- Laporkan balik: file apa saja yang berubah, dan sebutkan kalau ada asumsi/keputusan yang kamu ambil sendiri.
