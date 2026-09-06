# Panduan Deployment & Warisan Pengurus — PMK ARK (Archive & Resource Knowledge)

Dokumen ini adalah panduan operasional untuk pengurus baru, administrator teknis, atau developer yang mewarisi website **PMK ARK — PMK ITERA**.

---

## 1. Arsitektur Sistem Singkat

```text
               ┌───────────────────────┐
               │    Vercel (Hosting)   │
               │    Next.js 15 App     │
               └───────────┬───────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
     ┌───────────────┐           ┌───────────────┐
     │   Supabase    │           │ Cloudflare R2 │
     │  PostgreSQL   │           │   PPTX / PDF  │
     │  (Metadata)   │           │  (File Store) │
     └───────────────┘           └───────────────┘
```

- **Aplikasi (Frontend & Backend)**: Di-deploy ke **Vercel Free Tier**.
- **Database Metadata**: Supabase PostgreSQL. Menggunakan Prisma ORM.
- **File Storage**: Cloudflare R2 (S3-compatible API). File **tidak** disimpan di filesystem serverless Vercel, melainkan di-upload langsung ke R2 melalui *Storage Service Abstraction Layer* (`src/lib/storage/`).

---

## 2. Environment Variables (.env)

Berikut adalah daftar variabel lingkungan yang wajib diset di Vercel Dashboard maupun `.env` lokal:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.co:5432/postgres"

# Supabase Auth / Project Ref
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Cloudflare R2 / S3-Compatible Storage
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="pmk-ark-storage"
R2_PUBLIC_URL="https://pub-[HASH].r2.dev"
STORAGE_ENDPOINT="https://[ACCOUNT_ID].r2.cloudflarestorage.com"
STORAGE_REGION="auto"

# App Session Secret (minimal 32 karakter acak)
SESSION_SECRET="ganti-dengan-string-rahasia-panjang-di-production"
```

---

## 3. Panduan Migrasi Database & Backup

### Menjalankan Migrasi ke Production (Supabase)
```bash
# Pastikan DATABASE_URL dan DIRECT_URL di .env mengarah ke Supabase production
pnpm db:migrate:deploy
```

### Melakukan Backup Database (PostgreSQL)
Gunakan fitur backup otomatis di dashboard Supabase, atau via CLI:
```bash
pg_dump "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" > backup_pmk_ark_$(date +%Y%m%d).sql
```

---

## 4. Panduan Migrasi Cloudflare R2 ke Provider Lain (S3-Compatible)
Karena aplikasi menggunakan **Storage Service Abstraction Layer** (`src/lib/storage/`), jika di kemudian hari Cloudflare R2 ingin dipindahkan ke Amazon S3 atau Supabase Storage:
1. Buat file baru di `src/lib/storage/` (misal: `s3.ts`) yang mengimplementasikan interface `StorageService` (`src/lib/storage/types.ts`).
2. Ganti export di `src/lib/storage/index.ts` untuk mengarah ke implementasi baru.
3. **Tidak ada satu pun** file business logic atau komponen UI yang perlu diubah.

---

## 5. Panduan Onboarding Pengurus Baru (Admin & Pengurus)

1. **Membuat Akun Admin Pertama**:
   Jalankan script seed atau buat via Prisma Studio:
   ```bash
   pnpm db:seed
   ```
   Akun bawaan dari seed:
   - **Admin**: `admin@pmkitera.org` / (atur password lewat hash bcrypt)
   - **Pengurus**: `pengurus@pmkitera.org`

2. **Cara Upload Dokumen Mingguan**:
   - Buka `/admin/login`.
   - Masuk menggunakan akun pengurus/admin.
   - Pilih menu **Kelola Dokumen** → **Upload Baru**.
   - Tarik & letakkan file `.pptx` atau `.pdf` (maks 50MB).
   - Isi judul, kategori (Ibadah Jumat / Warta / Khotbah), periode pelayanan, tanggal kegiatan, dan nama pengkhotbah.
   - Simpan sebagai *Draft* atau langsung *Published*.

3. **Pergantian Pengurus Tiap Periode**:
   - Setiap tahun ajaran baru, admin cukup membuka menu **Periode Pelayanan** di panel admin dan membuat periode baru (contoh: `2026/2027`).
   - Tidak perlu mengubah struktur kode atau database.

---

## 6. Troubleshooting Umum

- **Error koneksi database (P1001)**: Periksa kembali `DATABASE_URL` dan pastikan IP Supabase Anda tidak diblokir firewall.
- **Upload file gagal / timeout**: Pastikan ukuran file tidak melebihi 50MB dan kredensial Cloudflare R2 (`R2_ACCESS_KEY_ID` dan `R2_SECRET_ACCESS_KEY`) benar.
- **Session login terhapus**: Pastikan `SESSION_SECRET` di environment production tidak berubah-ubah antar deploy.
