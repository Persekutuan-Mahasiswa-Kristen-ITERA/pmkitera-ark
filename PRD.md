# PRD — Website Arsip Digital PMK ITERA

## 1. Latar Belakang

PMK ITERA membutuhkan tempat penyimpanan terpusat untuk konten pelayanan mingguan: PPT Ibadah Jum'at, Warta Mingguan, dan PPT Khotbah. Saat ini file-file tersebut kemungkinan tersebar di WhatsApp/Google Drive personal, sehingga sulit dicari kembali saat pergantian kepengurusan. Dibutuhkan website arsip dengan desain selaras dengan website PMK ITERA yang sudah ada (nuansa hangat, editorial, serif + sans).

## 2. Tujuan

- Menyediakan satu sumber kebenaran (single source of truth) untuk semua dokumen pelayanan mingguan.
- Memudahkan pencarian arsip lama lewat filter kategori dan tanggal/tahun pelayanan.
- Sistem harus mudah diwariskan ke pengurus baru tiap pergantian periode (dokumentasi jelas, stack yang stabil, komunitas besar).

## 3. Target Pengguna & Role

| Role | Deskripsi | Hak akses |
|---|---|---|
| **Jemaat** | Pengunjung publik | Lihat & unduh dokumen yang berstatus *published* |
| **Pengurus** | Anggota kepanitiaan non-admin | Upload dokumen (status *draft*), edit dokumen miliknya |
| **Admin** | Penanggung jawab teknis/BPH | Semua hak Pengurus + publish/unpublish, hapus, kelola kategori, kelola periode pelayanan, kelola user |

## 4. Ruang Lingkup

### Fase 1 — MVP
- CRUD dokumen (judul, kategori, tanggal, pengisi/pengkhotbah, deskripsi, file utama)
- Upload file PPT/PDF
- Filter kombinasi kategori × tahun/bulan pelayanan
- Halaman publik: Beranda, Arsip, Detail Dokumen
- Admin dashboard native Next.js untuk kelola dokumen, kategori, periode pelayanan, user
- Role-based access (admin/pengurus/jemaat)
- Desain sesuai design system (lihat bagian 9)

### Fase 2 — Nice-to-have (dikerjakan setelah MVP stabil)
- Thumbnail otomatis dari slide pertama PPT
- Preview in-browser tanpa perlu download
- Notifikasi WhatsApp/Telegram otomatis saat dokumen baru diunggah
- Arsip per tahun pelayanan (rekap tahunan)
- PWA / installable

## 5. User Stories

**Jemaat**
- Sebagai jemaat, saya ingin memfilter arsip berdasarkan kategori dan tahun agar cepat menemukan warta/PPT lama.
- Sebagai jemaat, saya ingin melihat preview dokumen sebelum download agar tidak salah unduh.

**Pengurus**
- Sebagai pengurus, saya ingin mengunggah PPT khotbah minggu ini beserta metadatanya lewat form sederhana.
- Sebagai pengurus, saya ingin dokumen yang saya unggah berstatus draft dulu sampai disetujui admin.

**Admin**
- Sebagai admin, saya ingin mempublish/menolak dokumen draft dari pengurus.
- Sebagai admin, saya ingin mengelola kategori dan periode pelayanan tanpa perlu bantuan developer.
- Sebagai admin baru (hasil regenerasi), saya ingin dokumentasi sistem cukup jelas untuk saya pelajari sendiri dalam waktu singkat.

## 6. Functional Requirements

| ID | Requirement |
|---|---|
| FR-1 | Sistem menyimpan dokumen dengan metadata: judul, kategori, tanggal kegiatan, pengisi/pengkhotbah, deskripsi singkat, file utama (pptx/pdf), status |
| FR-2 | Sistem menyediakan filter kombinasi kategori × rentang tanggal/tahun pada halaman arsip publik |
| FR-3 | Sistem membedakan hak akses tiga role: admin, pengurus, jemaat |
| FR-4 | Dokumen berstatus *draft* tidak tampil di halaman publik, hanya *published* |
| FR-5 | Admin dapat mengelola master data kategori dan periode pelayanan lewat admin panel |
| FR-6 | (Fase 2) Sistem membuat thumbnail otomatis dari slide pertama file PPT |
| FR-7 | (Fase 2) Sistem mengirim notifikasi ke grup WhatsApp/Telegram saat dokumen baru dipublish |
| FR-8 | (Fase 2) Dokumen dapat dipreview langsung di browser tanpa diunduh dulu |

## 7. Non-Functional Requirements

- **Mobile-first**: mayoritas jemaat mengakses lewat HP saat hari ibadah.
- **Maintainability**: arsitektur full-stack Next.js dalam satu repository, dokumentasi setup lengkap di README, stack dengan komunitas besar.
- **Performance**: halaman arsip tetap ringan meski dokumen sudah ratusan (pagination/infinite scroll).
- **Keamanan**: upload file dibatasi tipe (.pptx, .pdf) dan ukuran maksimum; autentikasi admin/pengurus wajib.
- **Biaya hosting rendah**: ditargetkan kompatibel dengan layanan gratis seperti Vercel untuk aplikasi, Supabase untuk PostgreSQL/Auth, dan Cloudflare R2 untuk file storage.

## 8. Tech Stack (Keputusan Final)

| Layer | Pilihan | Alasan singkat |
|---|---|---|
| Full-stack framework | Next.js + TypeScript (App Router) | Satu framework untuk frontend, backend/API, authentication integration, dan server-side logic; cocok untuk deployment serverless/gratis |
| Styling | TailwindCSS | Cepat dikembangkan, mudah dibuat sebagai design token, dan konsisten dengan design system |
| ORM | Prisma | Type-safe database access, schema terpusat, migration jelas, dan mudah dipelihara oleh pengurus/developer berikutnya |
| Database | Supabase PostgreSQL | Relasional, cocok untuk metadata terstruktur, tersedia tier gratis, dan mudah diakses dari Next.js |
| Authentication | Supabase Auth | Mengurangi kebutuhan membangun sistem autentikasi sendiri dan terintegrasi dengan ekosistem Supabase |
| File storage | Cloudflare R2 | Cocok untuk menyimpan PPT/PDF, S3-compatible, dan dirancang agar storage provider dapat diganti melalui abstraction/service layer |
| Hosting aplikasi | Vercel | Deployment Next.js sederhana dan tersedia tier gratis untuk tahap awal |
| Admin dashboard | Next.js + React + TailwindCSS | Menggantikan Filament; admin dashboard dibuat native agar tidak bergantung pada framework admin PHP |
| Validation | Zod | Validasi input yang type-safe dan dapat digunakan bersama TypeScript |

## 9. Design System

| Token | Nilai | Pemakaian |
|---|---|---|
| `background` | `#F5F1E8` | Section terang |
| `background-alt` | `#EFE9DC` | Section selang-seling |
| `text-primary` | `#3D2A1A` | Heading & body gelap |
| `text-muted` | `#6B5D4F` | Deskripsi, meta info |
| `accent` | `#A05A34` | Tombol solid, underline heading |
| `accent-hover` | `#8A4A29` | Hover state |
| `card-bg` | `#FFFFFF` | Kartu dokumen |
| `border` | `#E3DCCB` | Garis tipis antar elemen |

Font: **Playfair Display** atau **Lora** (heading, serif) + **Inter** atau **Work Sans** (body, sans). Nuansa "jurnal/majalah rohani", bukan dashboard SaaS generik.

## 10. Sitemap / Struktur Halaman

**Publik**
- `/` — Beranda (highlight dokumen terbaru per kategori)
- `/arsip` — Daftar arsip + filter kategori & tahun/bulan
- `/arsip/:slug` — Detail dokumen (preview + download)
- `/tentang` — Tentang PMK ITERA (opsional)

**Admin (Next.js)**
- Dashboard ringkas (jumlah dokumen, upload terbaru)
- Kelola Dokumen (CRUD + approve/publish)
- Kelola Kategori
- Kelola Periode Pelayanan
- Kelola User & Role

## 11. Arsitektur Sistem (ringkas)

Aplikasi full-stack Next.js menangani halaman publik, admin dashboard, authentication integration, business logic, dan API/server actions dalam satu repository. Metadata disimpan di Supabase PostgreSQL, sedangkan file PPT/PDF disimpan di Cloudflare R2 melalui storage service abstraction. Detail diagram lengkap ada di file `ERD.md`.

## 12. Metrik Keberhasilan

- Pengurus baru bisa upload dokumen pertama tanpa training lebih dari 10 menit (berkat admin dashboard native Next.js yang sederhana).
- Waktu pencarian dokumen lama turun signifikan dibanding cara manual (WA/Drive).
- Admin baru hasil regenerasi bisa memahami sistem hanya dari README + PRD ini, tanpa harus tanya developer sebelumnya.

## 13. Roadmap Fitur Tambahan (Fase 2, urut prioritas)

1. Thumbnail otomatis dari slide pertama PPT (LibreOffice headless)
2. Preview in-browser
3. Role-based access lanjutan (kalau perlu granular per kategori)
4. Notifikasi WhatsApp/Telegram bot
5. Arsip rekap per tahun pelayanan
6. PWA / installable
