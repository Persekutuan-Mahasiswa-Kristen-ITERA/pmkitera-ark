# Prompt untuk AI Coding Agent — Website Arsip Digital PMK ITERA

> **Cara pakai:** Salin seluruh isi file ini sebagai pesan pertama ke AI agent kamu (Claude Code, Cursor, dsb). Lampirkan juga `PRD.md` dan `ERD.md` di folder project. Setelah itu kamu cukup membalas **"lanjut"** setiap kali agent selesai satu fase.

---

Kamu adalah senior full-stack engineer yang akan membangun **Website Arsip Digital PMK ITERA** dari nol dengan nama website **PMK ARK** dan kepanjangan dari ARK adalah **Archive & Resource Knowledge**, mengikuti `PRD.md` dan `ERD.md` yang terlampir sebagai sumber kebenaran utama. Baca kedua file itu sepenuhnya sebelum mulai coding.

## Konteks Proyek

Website ini adalah repositori dokumen pelayanan mingguan (PPT Ibadah Jum'at, Warta Mingguan, PPT Khotbah) dengan metadata terstruktur (kategori, tanggal, pengisi, deskripsi) dan filter kombinasi kategori × tahun/bulan. Prioritas utama: **stabil jangka panjang** dan **mudah diwariskan** ke pengurus baru tiap pergantian periode kepengurusan kampus.

## Tech Stack

Tech stack dipilih dengan mempertimbangkan bahwa website ditujukan untuk **hosting gratis dan layanan database/storage gratis**, sehingga tidak bergantung pada hosting PHP berbayar atau VPS.

### Frontend & Backend

* Framework utama: **Next.js + TypeScript**
* Arsitektur: **full-stack Next.js**
* Routing: **Next.js App Router**
* API: **Next.js Route Handlers / Server Actions** sesuai kebutuhan
* Styling: **TailwindCSS**
* ORM: **Prisma**
* Validation: **Zod**
* Database client: Prisma Client

Frontend dan backend **tidak perlu dipisahkan menjadi dua repository**. Gunakan satu repository Next.js yang menangani halaman publik, autentikasi, admin dashboard, API, dan integrasi storage.

### Hosting

Target deployment utama:

* **Vercel Free**
* Next.js harus dikembangkan dengan mempertimbangkan batasan environment serverless/managed hosting.
* Jangan bergantung pada filesystem lokal sebagai permanent storage.
* Jangan menggunakan proses background yang membutuhkan server VPS yang selalu aktif.
* Jangan membuat dependency terhadap konfigurasi server Linux tertentu yang tidak tersedia pada hosting serverless.

### Database

Gunakan:

* **PostgreSQL melalui Supabase**
* **Prisma ORM** sebagai database abstraction layer.

Database hanya digunakan untuk menyimpan **data terstruktur/metadata**, seperti:

* users
* categories
* service_periods
* documents
* notification_logs
* dan tabel lain yang secara eksplisit ditentukan oleh `ERD.md`.

**Jangan menyimpan file PPTX/PDF sebagai BLOB di PostgreSQL.**

File dokumen harus disimpan di object storage.

### File Storage

Gunakan:

* **Cloudflare R2**
* API yang kompatibel dengan **S3-compatible object storage**.
* Gunakan abstraction/service layer untuk storage agar implementasi storage dapat diganti di masa depan tanpa mengubah business logic.

Struktur kode harus memungkinkan:

```text
Application
    ↓
Storage Service
    ↓
Cloudflare R2
```

Bukan:

```text
Application
    ↓
Cloudflare R2 SDK langsung di banyak tempat
```

Semua operasi seperti upload, delete, generate download URL, dan pengecekan file sebaiknya melewati satu service/interface storage.

Jika suatu saat storage perlu dipindahkan ke Amazon S3, Supabase Storage, atau provider S3-compatible lainnya, perubahan cukup dilakukan pada implementasi storage service tanpa refactor besar pada aplikasi.

### Authentication

Gunakan authentication yang kompatibel dengan arsitektur Next.js dan PostgreSQL.

Prioritas:

1. **Supabase Auth**, jika integrasinya paling sederhana dan stabil.
2. Gunakan session/cookie yang aman.
3. Password tidak boleh pernah disimpan secara plaintext.
4. Role dan authorization tetap mengikuti struktur `users` serta requirement pada `PRD.md` dan `ERD.md`.

Jangan membuat sistem authentication sendiri jika fitur authentication provider sudah dapat memenuhi kebutuhan proyek.

### Admin Panel

Karena proyek tidak lagi menggunakan Laravel + Filament, **jangan menggunakan Filament**.

Buat admin dashboard native menggunakan:

* Next.js App Router
* React
* TypeScript
* TailwindCSS
* komponen UI yang sederhana dan mudah dipelihara.

Admin dashboard harus dibuat sesederhana mungkin agar pengurus non-teknis dapat:

* login
* upload dokumen
* mengisi metadata
* melihat dokumen
* mengedit metadata
* menghapus dokumen sesuai permission
* melakukan approve/publish
* mengelola kategori
* mengelola periode pelayanan

Jangan menggunakan admin framework besar jika kebutuhan tersebut dapat dipenuhi dengan komponen Next.js sederhana.

## Prinsip Arsitektur

Gunakan arsitektur modular yang mudah diwariskan kepada pengurus berikutnya.

Struktur konseptual:

```text
Next.js Application
│
├── Public Website
│
├── Admin Dashboard
│
├── Authentication
│
├── API / Server Actions
│
├── Business Logic
│
├── Prisma
│      └── Supabase PostgreSQL
│
└── Storage Service
       └── Cloudflare R2
```

Pisahkan dengan jelas:

* UI
* business logic
* database access
* authentication/authorization
* file storage
* validation
* API/server actions.

Jangan menaruh seluruh logic di React component atau Route Handler.

## Design System (WAJIB diikuti persis)

```text
background:      #F5F1E8
background-alt:  #EFE9DC
text-primary:    #3D2A1A
text-muted:      #6B5D4F
accent:          #A05A34
accent-hover:    #8A4A29
card-bg:         #FFFFFF
border:          #E3DCCB
```

Font heading: Playfair Display atau Lora (serif). Font body: Inter atau Work Sans (sans). Terapkan sebagai design token di konfigurasi TailwindCSS, jangan hardcode hex di banyak tempat.

## Cara Kerja yang Aku Harapkan Darimu

1. Kerjakan **satu fase penuh per giliran**, jangan meloncat ke fase berikutnya sebelum aku konfirmasi.
2. Di akhir setiap giliran, berikan **ringkasan singkat** apa yang sudah dibuat, file apa saja yang berubah, dan **cara menjalankan/menguji** hasilnya.
3. Setelah ringkasan, tuliskan secara eksplisit **"Fase berikutnya: ..."** lalu berhenti dan tunggu balasanku.
4. Aku akan membalas cukup dengan **"lanjut"** — jadi pastikan setiap giliran benar-benar mandiri dan tidak butuh klarifikasi tambahan dariku. Kalau ada keputusan kecil yang ambigu (nama variabel, struktur folder detail, dsb), **ambil keputusan sendiri yang masuk akal** dan catat asumsinya, jangan berhenti untuk bertanya.
5. Kalau ada keputusan besar yang benar-benar butuh persetujuanku (mis. mengubah tech stack, menambah dependency besar), baru boleh bertanya.
6. Tulis kode yang rapi, ada komentar secukupnya, dan sertakan file `README.md` di repository berisi cara install, environment variable yang dibutuhkan (`.env.example`), dan cara menjalankan secara lokal.
7. Ikuti struktur tabel di `ERD.md` persis — nama tabel, kolom, tipe data, dan relasi.
8. Jangan mengubah struktur database yang ditentukan `ERD.md` tanpa alasan yang sangat kuat. Jika terdapat konflik antara kebutuhan implementasi dan ERD, catat masalah tersebut sebelum melakukan perubahan.
9. Jangan memasukkan file PPTX/PDF ke database sebagai BLOB. Gunakan Cloudflare R2 untuk file storage.
10. Jangan menyimpan file permanen di filesystem lokal server/hosting.
11. Gunakan environment variables untuk seluruh credential dan konfigurasi provider.
12. Pastikan aplikasi dapat dijalankan secara lokal tanpa bergantung pada Vercel, Supabase, atau Cloudflare secara langsung untuk fitur yang tidak diperlukan saat development.

## Environment Variables

Sediakan `.env.example` yang minimal mencakup konfigurasi yang dibutuhkan, misalnya:

```env
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
```

Jangan pernah commit `.env` asli atau credential ke repository.

Gunakan `.env.example` sebagai template onboarding untuk pengurus/developer baru.

## Daftar Fase Pengerjaan

### **Fase 0 — Setup Project**

* Inisialisasi project Next.js menggunakan TypeScript.
* Gunakan Next.js App Router.
* Setup TailwindCSS.
* Setup ESLint dan formatting dasar.
* Setup Prisma.
* Setup koneksi PostgreSQL melalui Supabase.
* Setup struktur folder dasar.
* Setup konfigurasi environment variables.
* Buat `.env.example`.
* Setup abstraction/service layer untuk Cloudflare R2.
* Pastikan konfigurasi R2 dapat digunakan untuk upload/download file.
* Setup authentication provider yang dipilih.
* Buat README.md berisi cara menjalankan project secara lokal.
* Pastikan project dapat dijalankan tanpa error sebelum melanjutkan.

### **Fase 1 — Database & Model**

* Buat Prisma schema berdasarkan `ERD.md`.
* Struktur database harus mengikuti `ERD.md` secara persis:

  * users
  * categories
  * service_periods
  * documents
  * notification_logs
  * serta tabel lain jika ditentukan oleh `ERD.md`.
* Buat migration Prisma.
* Buat model dan relasi.
* Buat seeder untuk data dummy:

  * beberapa kategori
  * beberapa periode pelayanan
  * beberapa user dengan role yang sesuai
  * contoh dokumen
* Pastikan database dapat di-reset dan di-seed dengan mudah untuk development.

### **Fase 2 — Backend/API**

Implementasikan business logic menggunakan Next.js Route Handlers dan/atau Server Actions sesuai kebutuhan.

* Endpoint/operation autentikasi login/logout.
* Authorization berdasarkan role.
* CRUD dokumen.
* CRUD kategori.
* CRUD periode pelayanan.
* Workflow approve/publish.
* Endpoint publik untuk list & detail dokumen.
* Hanya dokumen dengan status `published` yang dapat muncul pada halaman publik.
* Dukungan filter kategori × tahun/bulan.
* Validasi metadata.
* Validasi upload file:

  * `.pptx`
  * `.pdf`
  * batas ukuran file sesuai requirement yang ditetapkan.
* Upload file ke Cloudflare R2.
* Delete file dari R2 ketika dokumen benar-benar dihapus.
* Jangan meninggalkan orphan file di storage jika memungkinkan.
* Gunakan signed URL atau mekanisme akses yang sesuai untuk file privat jika dibutuhkan.

### **Fase 3 — Admin Dashboard**

Buat admin dashboard native menggunakan Next.js.

Resource/fitur:

* Dokumen
* Kategori
* Periode Pelayanan
* User & Role

Untuk Dokumen:

* upload file dengan drag & drop
* input judul
* kategori
* tanggal
* pengisi
* periode pelayanan
* deskripsi
* status
* preview metadata sebelum submit
* approve/publish
* edit
* delete

Pastikan pengurus non-teknis bisa upload dokumen tanpa training panjang.

UI admin harus sederhana, jelas, dan tidak berlebihan.

### **Fase 4 — Frontend: Setup & Design System**

* Terapkan design token Tailwind sesuai bagian "Design System" di atas.
* Setup routing menggunakan Next.js App Router.
* Buat layout dasar.
* Header.
* Footer.
* Section terang/selang-seling.
* Setup Google Fonts:

  * Playfair Display/Lora
  * Inter/Work Sans.
* Buat reusable components.
* Pastikan mobile-first.

### **Fase 5 — Frontend: Halaman Utama**

* Halaman Beranda:

  * hero section
  * highlight dokumen terbaru per kategori
  * akses cepat ke arsip
* Halaman Arsip:

  * filter kategori
  * filter tahun
  * filter bulan
  * kombinasi filter kategori × tahun/bulan
  * pagination jika diperlukan
* Halaman Detail Dokumen:

  * judul
  * kategori
  * tanggal
  * pengisi
  * deskripsi
  * informasi periode pelayanan
  * tombol download
* Pastikan mobile-first dan sesuai palet warna PRD.

### **Fase 6 — Integrasi Frontend-Backend**

Hubungkan seluruh frontend dengan database dan storage.

Uji end-to-end:

```text
Admin login
    ↓
Upload PPT/PDF
    ↓
File → Cloudflare R2
    ↓
Metadata → Supabase PostgreSQL
    ↓
Admin approve/publish
    ↓
Dokumen muncul di halaman publik
    ↓
User membuka detail
    ↓
User download file
```

Pastikan:

* authentication berjalan
* authorization berjalan
* upload berjalan
* metadata tersimpan
* filtering berjalan
* publish workflow berjalan
* download berjalan
* error handling berjalan.

### **Fase 7 — Fitur Fase 2 (opsional, kerjakan setelah MVP disetujui)**

* Thumbnail otomatis dari slide pertama PPT.
* Jika membutuhkan LibreOffice headless, gunakan pendekatan yang kompatibel dengan environment deployment. Jangan mengasumsikan Vercel dapat menjalankan proses LibreOffice secara permanen.
* Preview in-browser tanpa download.
* Notifikasi WhatsApp/Telegram saat dokumen baru dipublish.
* PWA / installable.

Fitur yang membutuhkan background worker, queue worker, atau binary eksternal harus dipisahkan dari deployment utama jika platform hosting gratis tidak mendukungnya.

### **Fase 8 — Dokumentasi Deployment**

Buat dokumentasi lengkap untuk deployment:

* Deploy Next.js ke Vercel.
* Setup Supabase PostgreSQL.
* Setup Supabase Auth.
* Setup Cloudflare R2.
* Konfigurasi environment variables.
* Konfigurasi domain.
* Panduan migration database.
* Panduan backup database.
* Panduan backup/migrasi file.
* Panduan migrasi storage dari Cloudflare R2 ke provider S3-compatible lain.
* Panduan onboarding admin baru.
* Panduan pergantian pengurus.
* Panduan troubleshooting umum.

Dokumentasi harus dibuat sesederhana mungkin karena project akan diwariskan kepada pengurus PMK ITERA berikutnya.

## Prinsip Penting untuk Pengembangan

### Jangan overengineering

Project ini adalah website arsip organisasi kampus, bukan sistem enterprise.

Prioritaskan:

1. Stabilitas
2. Kemudahan maintenance
3. Keamanan
4. Kemudahan onboarding
5. Biaya operasional serendah mungkin
6. Kemudahan migrasi

Hindari dependency yang tidak benar-benar diperlukan.

### Jangan bergantung pada satu provider secara berlebihan

Walaupun deployment awal menggunakan:

```text
Vercel
+
Supabase
+
Cloudflare R2
```

business logic harus tetap dibuat portable.

Terutama storage harus menggunakan abstraction layer sehingga provider dapat diganti tanpa mengubah sebagian besar aplikasi.

### Target akhir

Arsitektur deployment yang diharapkan:

```text
                    ┌─────────────────┐
                    │     Users       │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     Vercel      │
                    │    Next.js      │
                    └───────┬─┬───────┘
                            │ │
              ┌─────────────┘ └─────────────┐
              ▼                             ▼
      ┌─────────────────┐          ┌─────────────────┐
      │    Supabase     │          │  Cloudflare R2  │
      │   PostgreSQL    │          │   PPTX / PDF    │
      │                 │          │                 │
      │ Metadata        │          │ File Storage    │
      │ Users           │          │                 │
      │ Categories      │          │                 │
      │ Documents       │          │                 │
      └─────────────────┘          └─────────────────┘
```

Tujuan akhirnya adalah menghasilkan **PMK ARK — Archive & Resource Knowledge**, sebuah arsip digital PMK ITERA yang:

* mudah digunakan
* mudah dikelola
* murah/gratis untuk tahap awal
* aman
* mobile-friendly
* mudah diwariskan ke kepengurusan berikutnya
* dan tidak terkunci pada satu provider.

