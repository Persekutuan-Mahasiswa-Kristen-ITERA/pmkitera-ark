# ERD & Diagram Sistem — Website Arsip Digital PMK ITERA

Dokumen ini melengkapi `PRD.md`. Semua diagram ditulis dalam sintaks **Mermaid** — bisa langsung dirender oleh GitHub, editor Markdown modern, atau AI coding agent (Claude Code, Cursor, dll) sebagai acuan struktur teknis.

## 1. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ DOCUMENTS : mengunggah
    CATEGORIES ||--o{ DOCUMENTS : mengelompokkan
    SERVICE_PERIODS ||--o{ DOCUMENTS : mengarsipkan
    DOCUMENTS ||--o{ NOTIFICATION_LOGS : memicu

    USERS {
        bigint id PK
        string name
        string email UK
        string password
        string role "admin | pengurus | jemaat"
        timestamp created_at
    }

    CATEGORIES {
        bigint id PK
        string name "Ibadah Jumat | Warta Mingguan | Khotbah"
        string slug UK
        string description
    }

    SERVICE_PERIODS {
        bigint id PK
        string name "contoh: 2025/2026"
        date start_date
        date end_date
    }

    DOCUMENTS {
        bigint id PK
        string title
        bigint category_id FK
        bigint service_period_id FK
        date event_date
        string speaker "pengkhotbah / pengisi"
        text description
        string file_path
        string file_type "pptx | pdf"
        string thumbnail_path "nullable, diisi Fase 2"
        string status "draft | published"
        bigint uploaded_by FK
        timestamp created_at
        timestamp updated_at
    }

    NOTIFICATION_LOGS {
        bigint id PK
        bigint document_id FK
        string channel "whatsapp | telegram"
        string status "sent | failed"
        timestamp sent_at
    }
```

### Catatan implementasi (Prisma migration)

- `users.role`, `documents.status`, `documents.file_type`, `notification_logs.channel/status` — implementasikan sebagai kolom `string` + validasi enum di level aplikasi (lebih portable antar DB) **atau** native Postgres `enum` bila tim nyaman migrasi manual.
- Tabel `notification_logs` dan kolom `thumbnail_path` baru dipakai di **Fase 2** — boleh dibuat nullable/kosong dari awal supaya skema tidak berubah drastis nanti (hindari breaking migration).
- Tambahkan index pada `documents.category_id`, `documents.service_period_id`, `documents.event_date` untuk mempercepat filter arsip.

## 2. Diagram Arsitektur Sistem

```mermaid
flowchart LR
    A["Next.js + TS + Tailwind<br/>Public Website"] --> B["Next.js App Router<br/>API / Server Actions + Business Logic"]
    C["Next.js Admin Dashboard"] --> B
    B --> D[("Supabase PostgreSQL<br/>Metadata")]
    B --> H["Supabase Auth<br/>Authentication"]
    B --> E["Cloudflare R2<br/>PPTX / PDF Storage"]
    B --> F["Background Job / External Worker<br/>Thumbnail (Fase 2)"]
    B --> G["WhatsApp/Telegram<br/>Notifikasi (Fase 2)"]
```

## 3. Sequence Diagram — Alur Upload Dokumen

```mermaid
sequenceDiagram
    participant P as Pengurus
    participant F as Next.js Admin Dashboard
    participant API as Next.js Server/API
    participant DB as Supabase PostgreSQL
    participant S as Cloudflare R2
    participant AD as Admin

    P->>F: Upload file + isi metadata
    F->>API: Simpan dokumen (status: draft)
    API->>DB: Insert record dokumen
    API->>S: Simpan file asli
    AD->>F: Review dokumen draft
    AD->>API: Approve & publish
    API->>DB: Update status = published
    Note over API,DB: Fase 2: dispatch background job thumbnail + kirim notifikasi WA/Telegram
```

## 4. Flowchart — Alur Akses Berdasarkan Role

```mermaid
flowchart TD
    Start([Pengguna membuka website]) --> Auth{Login?}
    Auth -- Tidak --> Public["Akses sebagai Jemaat:<br/>lihat & unduh dokumen published"]
    Auth -- Ya --> Role{Cek Role}
    Role -- Pengurus --> Pengurus["Upload dokumen (status draft),<br/>edit dokumen milik sendiri"]
    Role -- Admin --> AdminAccess["Full akses:<br/>publish/unpublish, hapus,<br/>kelola kategori & periode & user"]
```
