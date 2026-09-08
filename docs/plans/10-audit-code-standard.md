# Audit Kode terhadap CODE.md

Audit menyeluruh atas `src/` beserta perbaikannya. Seluruh perbaikan di
bawah ini **sudah diterapkan** — `npx tsc --noEmit` dan `npm run build`
lolos tanpa galat.

## Ringkasan Sebelum dan Sesudah

| Aspek | Sebelum | Sesudah |
| --- | --- | --- |
| Feature folder | 5 (`auth`, `courses`, `jobs`, `projects`, `talents`) | 20 |
| Folder `states/` (Zustand) | 0 | 19 |
| Folder `controllers/` (TanStack Query) | 0 | 19 |
| Logika bisnis di `src/app/**/page.tsx` | 11 halaman | 0 |
| Komponen mengakses Supabase langsung | 16 berkas | 0 |
| `QueryClientProvider` | Belum terpasang | Terpasang di root layout |
| Envelope response (RESPONSE.md) | Tidak ada | Dipakai seluruh service dan API route |
| Direktori `server/` | Tidak ada | 5 berkas |
| API route (`src/app/api/v1`) | Tidak ada | 9 endpoint |

## 1. Halaman Dipindahkan ke Feature

`src/app/**/page.tsx` sebelumnya memuat logika bisnis. Sekarang setiap
halaman hanya melakukan re-export, mengikuti pola yang sudah dipakai
`/jobs`, `/courses`, dan `/talents`.

| Halaman | Tujuan baru |
| --- | --- |
| `/admin` | `features/admin/components/AdminDashboard.tsx` |
| `/coach` | `features/coach/components/CoachDashboard.tsx` |
| `/events` | `features/events/components/EventsList.tsx` |
| `/onboarding` | `features/onboarding/components/OnboardingForm.tsx` |
| `/pesan` | `features/messages/components/MessagesInbox.tsx` |
| `/dashboard` | `features/dashboard/components/DashboardOverview.tsx` |
| `/directory` | `features/directory/components/DirectoryList.tsx` |
| `/directory/[id]` | `features/directory/components/DirectoryDetail.tsx` |
| `/services` | `features/services/components/ServicesList.tsx` |
| `/profile` | `features/profile/components/ProfileForm.tsx` |
| `/case-studies` | `features/case-studies/components/CaseStudiesList.tsx` |

## 2. Struktur Lengkap per Feature

Ke-15 feature kini punya `types/`, `states/`, `services/`, `controllers/`,
dan `components/` sesuai CODE.md:

```
src/features/{folderName}/
├── types/{fileName}Types.ts
├── states/{fileName}States.ts
├── services/{fileName}Services.ts
├── controllers/{fileName}Controllers.ts
└── components/{FileName}{Action}.tsx
```

## 3. Envelope Response (RESPONSE.md)

Ditambahkan `src/shared/lib/apiResponse.ts` berisi:

- `ApiResponse<T>` — `{ success, data?, error?, pagination?, message? }`.
  Field yang tidak bermakna **tidak dikirim**, sesuai catatan RESPONSE.md.
- `successResponse()` dan `errorResponse()`.
- `API_ERROR_CODE` — `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`,
  `NOT_FOUND`, `CONFLICT`, `INTERNAL_SERVER_ERROR`.
- `toApiResponse()` — membungkus hasil Supabase menjadi envelope dan
  memetakan kode galat PostgREST ke kode RESPONSE.md
  (`23505` → `CONFLICT`, `PGRST116` → `NOT_FOUND`, `42501` → `FORBIDDEN`, dst).
- `unwrapApiResponse()` — membuka envelope untuk TanStack Query.

Dampak nyata: pengecekan duplikat yang dulu membaca teks galat
(`error.message.includes('duplicate')`) kini memakai kode
`API_ERROR_CODE.CONFLICT` — dipakai pada lamaran kerja, bid proyek,
RSVP event, dan pendaftaran kursus.

Saat endpoint REST asli dibuat di `src/pages/api/**` nanti, endpoint itu
tinggal mengembalikan envelope yang sama sehingga service tidak berubah.

## 4. Penamaan Fungsi

Disesuaikan dengan tabel prefix CODE.md.

| Lapisan | Prefix | Contoh perubahan |
| --- | --- | --- |
| Service | `get`, `post`, `update`, `delete` | `getUserCompany` → `getJobsCompany` |
| Controller | `fetch`, `store`, `change`, `remove` | `useJobsControllers().fetchJobs` |
| Komponen | `load`, `save`, `modify`, `destroy` | `handleApply` → `saveApplication` |

Contoh lain: `handlePost` → `saveProject`, `handleRSVP` → `saveRsvp`,
`createModule` → `saveModule`, `deleteQuiz` → `destroyQuiz`,
`approveCompany` → `modifyCompanyApproval`, `markPaymentPaid` → `modifyPaymentPaid`.

Nama fungsi komponen juga diselaraskan dengan nama berkasnya
(`JobsPage()` di `JobsList.tsx` → `JobsList()`).

## 5. TanStack Query Diaktifkan

`@tanstack/react-query` sudah terpasang di `package.json` tetapi
**belum pernah dipakai** — tidak ada `QueryClientProvider` di aplikasi.
Ditambahkan `src/components/query-provider.tsx` dan dipasang di
`src/app/layout.tsx`.

Pengambilan data yang dulu memakai `useState` + `useEffect` kini melalui
controller. Perilaku yang dipertahankan: debounce 300 ms pada pencarian
(sekarang mendorong payload ke store Zustand), gabungan data dummy,
dan seluruh pesan toast.

## 6. Tiga Catatan Arsitektur — Penyelesaian

### 6.1 CODE.md vs kondisi nyata (App Router + Supabase)

**Diselesaikan dengan menyesuaikan CODE.md, bukan migrasi router.**
Memindahkan App Router ke Pages Router berarti menulis ulang seluruh halaman
tanpa manfaat fungsional, dan melanggar Final Rules "tidak boleh merubah kode,
UI/UX, dan logika lain yang sudah ada". CODE.md kini menyebut App Router dan
Supabase + RLS, disertai catatan mengapa. `prisma` masih terpasang di
`package.json` tetapi tidak dipakai dan tidak ada `schema.prisma`.

### 6.2 `server/` dan API routes

**Dibuat, dengan batas yang eksplisit.** Struktur:

```txt
server/
├── supabase.ts      # getServerSupabase (cookie → RLS) / getServiceSupabase
├── apiResponse.ts   # envelope + pemetaan kode galat PostgREST → RESPONSE.md
├── serverAuth.ts    # withAuth / withOptionalAuth / withAdmin / withSuperAdmin
├── admin/adminService.ts
└── audit/auditService.ts
```

Route handler di `src/app/api/v1/**/route.ts` (9 endpoint), dipanggil klien
lewat `src/shared/lib/api.ts`.

Yang **tidak** dipindah ke API route: query milik user sendiri yang sudah
dibatasi RLS. Memproksikan itu lewat HTTP menambah latensi dan lapisan auth
kedua tanpa menambah keamanan — RLS tetap berlaku pada koneksi mana pun.
Yang **dipindah** adalah operasi yang memang butuh wewenang lintas user atau
pencatatan audit. Tabel batasnya ada di CODE.md bagian "Batas Client vs Server".

Dua hal ini memang tidak bisa diproksikan dan tetap di klien: sesi auth
(`supabase.auth.*`, mengelola cookie di browser) dan langganan Realtime.

**Bug yang ketahuan saat ini dikerjakan:** grafik distribusi peran di Panel
Admin selama ini hanya membaca peran milik admin yang sedang melihat, karena
policy `select_own_roles` membatasi `auth.uid() = user_id`. Migrasi 014
menambahkan klausa `is_admin()` dan pembacaannya dipindah ke server.

### 6.3 Komponen bersama yang mengakses Supabase

**Selesai — `src/components` tidak lagi menyentuh database.** Empat komponen
dipindah menjadi feature sendiri berikut lapisan lengkapnya:

| Sebelum | Sesudah |
| --- | --- |
| `components/notification-bell.tsx` | `features/notifications/components/NotificationBell.tsx` |
| `components/global-search.tsx` | `features/search/components/GlobalSearch.tsx` |
| `components/file-upload.tsx` | `features/uploads/components/FileUpload.tsx` |
| `components/payment-card.tsx` | `features/payments/components/PaymentCard.tsx` |

`auth-provider.tsx` tetap di `src/components` karena harus membungkus seluruh
aplikasi, tetapi seluruh akses tabelnya dipindah ke
`features/auth/services/authServices.ts`.

---

## 7. Migrasi Database

`supabase/migrations/20260909000000_014_platform_hardening.sql` berisi
`user_roles.region_id`, helper `is_admin()`/`is_super_admin()`,
`events.created_by` + `approval_status` + RLS pengganti migrasi 012,
RPC `create_event_rsvp` dan `accept_project_bid`, `profiles.hourly_rate`,
serta tabel `audit_logs`.

> **Belum diterapkan ke database produksi.** File migrasi ikut di-commit,
> tetapi `supabase db push` adalah tindakan terpisah terhadap database live —
> jalankan setelah ditinjau. Sampai migrasi dijalankan, fitur yang
> bergantung padanya (approval event, kelola peran, catatan audit, RSVP
> berkapasitas, penerimaan bid atomik, tarif talent) belum berfungsi.

## 8. Sisa Pekerjaan

1. `SUPABASE_SERVICE_ROLE_KEY` belum di-set, padahal `src/shared/lib/supabase.ts`
   mengekspor `supabaseAdmin` dengan key placeholder. Lapisan server yang baru
   sengaja tidak memerlukannya (memakai client ber-cookie + RLS), tetapi
   `supabaseAdmin` sebaiknya dihapus atau diberi pengaman.
2. Belum ada `src/shared/locales/en.json` / `id.json`; terjemahan masih inline
   `t('English', 'Indonesia')`.
3. Item bertanda ⬜ pada dokumen 01–09.
