<p align="center">
  <img src="public/logo-pmk.avif" alt="PMK ITERA Logo" width="120" height="120" style="border-radius: 16px;">
</p>

<h1 align="center">PMK ARK — Archive & Resource Knowledge</h1>

<p align="center">
  <strong>Repositori Resmi Arsip Digital <a href="https://pmk.itera.ac.id">PMK ITERA</a></strong> (Persekutuan Mahasiswa Kristen Institut Teknologi Sumatera)
</p>

<p align="center">
  Platform terpadu untuk menyimpan, mengelola, dan mempublikasikan bahan ibadah mingguan:
  <br>
  📎 <strong>PPT Ibadah Jumat</strong>  •  📄 <strong>Warta Mingguan</strong>  •  🎤 <strong>PPT Khotbah</strong>
</p>

<p align="center">
  <!-- Badges -->
  <a href="https://github.com/Persekutuan-Mahasiswa-Kristen-ITERA/pmkitera-ark/actions"><img src="https://img.shields.io/github/actions/workflow/status/Persekutuan-Mahasiswa-Kristen-ITERA/pmkitera-ark/ci.yml?branch=main&label=CI&logo=github" alt="CI Status"></a>
  <a href="https://github.com/Persekutuan-Mahasiswa-Kristen-ITERA/pmkitera-ark/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Persekutuan-Mahasiswa-Kristen-ITERA/pmkitera-ark?color=blue" alt="License"></a>
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15">
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" alt="TypeScript 5">
  <img src="httpsimg.shields.io/badge/TailwindCSS-4-38bdf8?logo=tailwindcss" alt="TailwindCSS 4">
  <img src="https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma" alt="Prisma 6">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/Cloudflare-R2-f38020?logo=cloudflare" alt="Cloudflare R2">
  <img src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel" alt="Vercel">
</p>

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🗂️ **Grup per Tanggal Ibadah** | PPT Ibadah, Warta, & PPT Khotbah otomatis terkumpul jadi 1 folder per Jumat |
| 🔍 **Arsip Lengkap & Filter** | Cari berdasarkan kategori, periode pelayanan, tahun, bulan — dengan pagination |
| 📱 **QR Code Sharing** | Satu klik generate QR → jemaat scan langsung buka bahan ibadah minggu ini |
| 🔐 **Admin Panel Aman** | Login lokal (bcrypt + session cookie), role-based access (admin/pengurus/jemaat) |
| ☁️ **Storage Abstraction** | Interface `StorageService` → mudah migrasi R2 ↔ S3 ↔ Supabase Storage |
| 🎨 **UI Modern & Aksesibel** | Glassmorphism, dark/light mode, 24h format, WIB pinned, bilingual ID/EN |
| ♿ **Accessibility First** | Semantic HTML, focus-visible, ARIA labels, keyboard navigable |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Server Components, Server Actions) |
| **Language** | TypeScript 5 (strict mode) |
| **Styling** | TailwindCSS v4 (CSS-first config) |
| **Database** | PostgreSQL via **Supabase** (connection pooling + direct) |
| **ORM** | Prisma 6 (type-safe, auto-generated client) |
| **Auth** | Supabase Auth / Custom Session Cookie + bcryptjs |
| **Storage** | **Cloudflare R2** (S3-compatible) via `@aws-sdk/client-s3` |
| **Validation** | Zod (schema + form validation) |
| **Icons** | Lucide React only (no emoji) |
| **QR Code** | `qrcode` library (client-side generation) |
| **Deploy** | Vercel (recommended) / Docker / VPS |

---

## 🚀 Quick Start (Development)

### Prasyarat
- Node.js **v20+** (recommended v22 LTS)
- **pnpm v10+** (`corepack enable && corepack prepare pnpm@latest --activate`)
- Akun **Supabase** (project PostgreSQL)
- Akun **Cloudflare** (R2 bucket + API token)

### 1. Clone & Install
```bash
git clone https://github.com/Persekutuan-Mahasiswa-Kristen-ITERA/pmkitera-ark.git
cd pmkitera-ark
pnpm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```
Isi `.env` dengan kredensial kamu:
```env
# Supabase (Database)
DATABASE_URL="postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Cloudflare R2 (File Storage)
R2_ACCOUNT_ID="xxx"
R2_ACCESS_KEY_ID="xxx"
R2_SECRET_ACCESS_KEY="xxx"
R2_BUCKET_NAME="pmk-ark-storage"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"
STORAGE_ENDPOINT="https://<ACCOUNT_ID>.r2.cloudflarestorage.com"
STORAGE_REGION="auto"
```

### 3. Database & Seed
```bash
# Generate Prisma Client
pnpm db:generate

# Push schema ke database (development)
pnpm db:push

# Atau untuk production: migrasi terstruktur
# pnpm db:migrate:deploy

# Isi data awal: kategori, periode, admin user, dokumen contoh
pnpm db:seed
```
> **Default admin login**: `admin@pmk.itera.ac.id` / `pmkark2025`

### 4. Run Dev Server
```bash
pnpm dev
```
Buka [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Struktur Project

```text
pmkitera-ark/
├── .github/workflows/      # CI/CD GitHub Actions
├── prisma/
│   ├── schema.prisma       # Schema database (users, categories, service_periods, documents, notification_logs)
│   ├── seed.ts             # Data awal: kategori, periode, admin, dokumen contoh
│   └── migrations/         # File migrasi Prisma (version controlled)
├── public/
│   └── logo-pmk.avif       # Logo PMK (favicon + header)
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── (public)/       # Route group: beranda, arsip, detail dokumen
│   │   ├── (admin)/        # Route group: login, dashboard, documents, categories, service-periods
│   │   └── api/            # REST API routes (auth, documents, categories, service-periods)
│   ├── components/
│   │   ├── admin/          # AdminLayout, DocumentList, DocumentUploadForm
│   │   ├── public/         # Header, Footer, QRCodeButton, QRCodeModal
│   │   └── ui/             # Button, Card, Input, Select, Modal, Badge, Label, Textarea
│   ├── lib/
│   │   ├── auth/           # session.ts, roles.ts, supabase.ts
│   │   ├── db/             # prisma.ts (singleton)
│   │   ├── storage/        # index.ts (interface), r2.ts (implementasi), types.ts
│   │   ├── validation/     # document.ts, file.ts (Zod schemas)
│   │   └── utils/          # cn.ts, date.ts, json.ts
│   └── services/           # Server-side business logic (document-service, auth-service, dll)
├── .env.example            # Template environment variables
├── .gitignore              # Git ignore rules (aman untuk secrets)
├── next.config.ts          # Next.js config
├── tailwind.config.ts      # Tailwind v4 config
├── tsconfig.json           # TypeScript config (strict)
└── package.json
```

---

## 🔐 Admin Panel

Akses: `/admin/login`

**Fitur Admin:**
- 📤 **Upload Dokumen** — drag & drop, validasi tipe/file size, preview thumbnail
- 📝 **Kelola Metadata** — kategori, periode pelayanan, tanggal ibadah, pengkhotbah, deskripsi
- 📋 **Daftar Dokumen** — filter, search, pagination, publish/unpublish, hapus
- 🏷️ **Kelola Kategori** — CRUD kategori (PPT Ibadah, Warta, PPT Khotbah, dll)
- 📅 **Kelola Periode** — CRUD periode pelayanan (tahun akademik)
- 📊 **Audit Log** — riwayat notifikasi terkirim (WhatsApp/Telegram)

---

## 🔗 QR Code untuk Jemaat

1. Buka beranda → folder ibadah minggu ini
2. Klik tombol **"Scan QR"** di header folder
3. Tampilkan QR code di layar proyektor / TV / cetak
4. Jemaat arahkan kamera HP → langsung buka halaman bahan ibadah lengkap

> QR code meng-encode URL halaman arsip tanggal ibadah tersebut. Bisa diunduh sebagai PNG untuk dicetak/poster.

---

## 🚢 Deployment ke Vercel (Recommended)

1. Push repo ke GitHub
2. Buka [vercel.com/new](https://vercel.com/new) → Import repository `pmkitera-ark`
3. Framework Preset: **Next.js** (auto-detected)
4. Tambahkan **Environment Variables** dari `.env` (semua variabel)
5. **Deploy** → selesai dalam 2-3 menit
6. (Opsional) Pasang custom domain: `ark.pmk.itera.ac.id`

> **Tip**: Supabase & Cloudflare R2 sudah *serverless-ready*, tidak perlu konfigurasi tambahan di Vercel.

---

## 📜 Scripts Tersedia

```bash
pnpm dev              # Development server (port 3000)
pnpm build            # Production build
pnpm start            # Jalankan production server
pnpm lint             # ESLint check
pnpm db:generate      # Generate Prisma Client
pnpm db:push          # Push schema ke DB (dev)
pnpm db:migrate       # Buat migrasi baru (dev)
pnpm db:migrate:deploy# Deploy migrasi (production)
pnpm db:seed          # Jalankan seeder
pnpm db:studio        # Buka Prisma Studio (GUI database)
```

---

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur: `git checkout -b feat/nama-fitur`
3. Commit perubahan: `git commit -m "feat: deskripsi singkat"`
4. Push ke fork: `git push origin feat/nama-fitur`
5. Buat **Pull Request** ke `main`

> Semua PR wajib lulus `pnpm lint` && `pnpm build` sebelum di-merge.

---

## 📄 Lisensi

**MIT License** — bebas digunakan, dimodifikasi, dan didistribusikan.
Kredit & atribusi ke **PMK ITERA** sangat diapresiasi.

---

## 👥 Tim Pengembang

| Peran | Nama |
|-------|------|
| **Project Lead** | Febrian Yoel Anggara Saputra (NIM 124140031) |
| **Asisten Dosen Agama Protestan** | Martin Clinton, S.Kom., M.Kom. |
| **Organisasi** | Persekutuan Mahasiswa Kristen (PMK) ITERA |

---

<p align="center">
  Dibangun dengan ❤️ untuk jemaat PMK ITERA — <em>"Menjaga Bahan Ibadah, Melayani Jemaat"</em>
</p>

<p align="center">
  <a href="https://pmk.itera.ac.id">Website PMK</a> •
  <a href="https://github.com/Persekutuan-Mahasiswa-Kristen-ITERA">Organisasi GitHub</a> •
  <a href="mailto:pmk@itera.ac.id">Email</a>
</p>