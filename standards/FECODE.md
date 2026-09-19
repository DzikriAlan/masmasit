## Architecture Overview

```txt
src/features/{folderName}/
├── types/{filename}Types.ts
├── states/{filename}States.ts
├── services/{filename}Services.ts
├── controllers/{filename}Controllers.ts
└── components/{filename}{Action}.tsx
```

> states, services, dan controllers hanya boleh berhubungan dengan API yang sudah dibuat. Jangan mendefinisikan hal lain di luar itu.

## Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **Server State**: TanStack Query (`@tanstack/react-query`)
- **Client State**: Zustand
- **Forms**: React Hook Form + Zod
- **Database ORM**: Prisma (PostgreSQL)

## Shared Directory

```txt
src/shared/
├── lib/
│   ├── prisma.ts       # Prisma client singleton
│   └── utils.ts        # cn() utility
├── styles/
│   └── globals.css     # Tailwind base + Shadcn CSS variables
└── locales/
    ├── en.json
    └── id.json
```

---

## Function Naming Rules

| Prefix   | Service | Controller | emit | UI Component | Utilisasi (inner function) |
| -------- | :-----: | :--------: | :--: | :----------: | :------------------------: |
| `get`    |   ✅    |     ❌     |  ❌  |      ❌      |             ✅             |
| `post`   |   ✅    |     ❌     |  ❌  |      ❌      |             ✅             |
| `update` |   ✅    |     ❌     |  ❌  |      ❌      |             ✅             |
| `patch`  |   ✅    |     ❌     |  ❌  |      ❌      |             ✅             |
| `delete` |   ✅    |     ❌     |  ❌  |      ❌      |             ✅             |
| `fetch`  |   ❌    |     ✅     |  ❌  |      ❌      |             ❌             |
| `store`  |   ❌    |     ✅     |  ❌  |      ❌      |             ❌             |
| `modify` |   ❌    |     ✅     |  ❌  |      ❌      |             ❌             |
| `remove` |   ❌    |     ✅     |  ❌  |      ❌      |             ❌             |
| `load`   |   ❌    |     ❌     |  ✅  |      ✅      |             ❌             |
| `submit` |   ❌    |     ❌     |  ✅  |      ✅      |             ❌             |
| `edit`   |   ❌    |     ❌     |  ✅  |      ✅      |             ❌             |
| `clear`  |   ❌    |     ❌     |  ✅  |      ✅      |             ❌             |

---

## Penamaan Folder & File

Dari URL endpoint, buang segmen berikut:
- Base URL / domain
- Prefix `api`
- Versioning: segmen yang cocok pola `v{angka}` (contoh: `v1`, `v2`)

Sisa path yang bermakna dibagi menjadi tiga konsep:

| Konsep           | Aturan                                       | Digunakan untuk                                       |
| ---------------- | -------------------------------------------- | ----------------------------------------------------- |
| **folderName**   | Segmen **pertama** sisa path, `kebab-case`   | Nama folder domain                                    |
| **fileName**     | `folderName` dikonversi ke `camelCase`       | Prefix nama file `.ts`                                |
| **resourceName** | gabungan semua segmen, digabung `PascalCase` | Nama TypeScript: types, controllers, services, states |

**Contoh:**

| URL                                           | folderName  | fileName   | resourceName           |
| --------------------------------------------- | ----------- | ---------- | ---------------------- |
| `/api/v1/users/profile`                       | `users`     | `users`    | `UsersProfile`         |
| `/api/v1/ai-search/register/file/{type}/{id}` | `ai-search` | `aiSearch` | `AiSearchRegisterFile` |

> Segmen dinamis (`{param}`) selalu diabaikan.

---

## Aturan Per File

### Types (`{filename}Types.ts`)

```typescript
// Payload: hanya untuk GET & POST
export interface Payload{Method}{ResourceName} {
  field: type
}

// ⚠️ Hanya buat jika response API mengembalikan data (bukan void/empty)
export interface Data{ResourceName} {
  id: string
  // ... fields
}

// Reactive state shape
export interface {ResourceName} {
  status: string         // 'loading' | 'error' | 'empty' | 'success' — selalu ada
  statusTitle: string    // selalu ada
  statusSubtitle: string // selalu ada
  data: Data{ResourceName} | null  // hanya jika response tidak kosong/void
}
```

**Kapan `Data{ResourceName}` & field `data` dibuat:**

| Kondisi response            | Buat `Data{ResourceName}`? | Tambah field `data`? |
| --------------------------- | -------------------------- | -------------------- |
| Mengembalikan objek/array   | ✅ Ya                      | ✅ Ya                |
| Void / empty (misal DELETE) | ❌ Tidak                   | ❌ Tidak             |

Default values: `string → ""`, `number → 0`, `boolean → false`, `Array → []`, `Object → {}`

---

### States (`{filename}States.ts`)

Gunakan **Zustand** untuk client state.

```typescript
import { create } from 'zustand'
import type { Payload{Method}{ResourceName}, {ResourceName} } from '../types/{filename}Types'

interface {Filename}Store {
  payload{Method}{ResourceName}: Payload{Method}{ResourceName}
  {camelResourceName}: {ResourceName}
  set{Method}{ResourceName}: (payload: Partial<Payload{Method}{ResourceName}>) => void
}

export const use{Filename}States = create<{Filename}Store>((set) => ({
  payload{Method}{ResourceName}: { /* empty defaults */ },

  {camelResourceName}: {
    status: 'loading',
    statusTitle: 'Something went wrong',
    statusSubtitle: 'Please try again later.',
    data: null, // hapus jika response void
  },

  set{Method}{ResourceName}: (payload) =>
    set((state) => ({
      payload{Method}{ResourceName}: { ...state.payload{Method}{ResourceName}, ...payload },
    })),
}))
```

**Aturan**: Hanya state dan setter, tidak ada async logic. Payload hanya untuk GET & POST, tidak untuk PATCH/PUT/DELETE.

---

### Services (`{filename}Services.ts`)

```typescript
import type { Payload{Method}{ResourceName} } from '../types/{filename}Types'

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL

// ✅ BENAR
export const {get|post|update|patch|delete}{ResourceName} = async (payload?: Payload{Method}{ResourceName}) => {
  try {
    const queryString = payload ? '?' + new URLSearchParams(payload as Record<string, string>).toString() : ''
    const res = await fetch(`${baseUrl}/path/to/endpoint${queryString}`, {
      method: '{METHOD}',
      headers: { 'Content-Type': 'application/json' },
      // body: JSON.stringify(payload), // hanya untuk POST/PUT/PATCH
    })
    if (!res.ok) throw new Error(res.statusText)
    return res.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return null
    throw error
  }
}

// ❌ DILARANG — jangan tulis return type annotation
export const {get|post|update|patch|delete}{ResourceName} = async (payload): Promise<Data{ResourceName} | null> => { ... }
```

**Prefix method service:**

| HTTP   | Prefix   | Contoh                 |
| ------ | -------- | ---------------------- |
| GET    | `get`    | `getUsersProfile()`    |
| POST   | `post`   | `postRegisterFile()`   |
| PUT    | `update` | `updateUsersProfile()` |
| PATCH  | `patch`  | `patchUsersProfile()`  |
| DELETE | `delete` | `deleteUsersProfile()` |

**Aturan**: Tidak ada state logic. Hanya pure API call. **Dilarang menulis return type annotation**.

---

### Controllers (`{filename}Controllers.ts`)

Gunakan **TanStack Query** untuk server state management.

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { use{Filename}States } from '../states/{filename}States'
import { {method}{ResourceName} } from '../services/{filename}Services'
import type { Payload{Method}{ResourceName} } from '../types/{filename}Types'

// GET → useQuery
export const use{Filename}Controllers = () => {
  const { {camelResourceName}, payload{Method}{ResourceName} } = use{Filename}States()

  const fetch{ResourceName} = useQuery({
    queryKey: ['{resourceName}', payload{Method}{ResourceName}],
    queryFn: () => get{ResourceName}(payload{Method}{ResourceName}),
    onSuccess: (data) => {
      {camelResourceName}.data = data ?? null
      {camelResourceName}.status = data ? 'success' : 'empty'
    },
    onError: () => {
      {camelResourceName}.status = 'error'
    },
  })

  return { fetch{ResourceName} }
}

// POST/PUT/PATCH/DELETE → useMutation
export const use{Filename}Controllers = () => {
  const queryClient = useQueryClient()
  const { {camelResourceName} } = use{Filename}States()

  const store{ResourceName} = useMutation({
    mutationFn: (payload: Payload{Method}{ResourceName}) => post{ResourceName}(payload),
    onMutate: () => {
      {camelResourceName}.status = 'loading'
    },
    onSuccess: (data) => {
      {camelResourceName}.data = data ?? null
      {camelResourceName}.status = data ? 'success' : 'empty'
      queryClient.invalidateQueries({ queryKey: ['{resourceName}'] })
    },
    onError: () => {
      {camelResourceName}.status = 'error'
    },
  })

  return { store{ResourceName} }
}
```

**Prefix method controller:**

| HTTP      | Prefix   | Contoh                 |
| --------- | -------- | ---------------------- |
| GET       | `fetch`  | `fetchUsersProfile()`  |
| POST      | `store`  | `storeRegisterFile()`  |
| PUT/PATCH | `modify` | `modifyUsersProfile()` |
| DELETE    | `remove` | `removeUsersProfile()` |

> `update` dan `patch` di layer service keduanya dibungkus oleh `modify` di layer controller.

---

### Components (`{filename}{Action}.tsx`)

```typescript
'use client' // hanya jika butuh interaktivitas
```

**Aturan**:

#### 1. Struktur Penulisan Kode React

Urutan penulisan wajib mengikuti struktur berikut:

```tsx
// 1. Import External Library (do not write this comment)
import { useEffect, useMemo, useState } from 'react'
// 2. Import Types (do not write this comment)
import type { DataUsersProfile } from './types/usersTypes'
// 4. Import States / Stores (do not write this comment)
import { useUsersStates } from './states/usersStates'
// 5. Import Controllers (do not write this comment)
import { useUsersControllers } from './controllers/usersControllers'
// 7. Props (do not write this comment)
interface Props {
  userId: string
}

export default function UsersList({ userId }: Props) {
  // 8. Store / Controller (do not write this comment)
  const { usersProfile, usersCategories, assets } = useUsersStates()
  const { fetchUsersProfile, removeUsersProfile } = useUsersControllers()
  // 9. State (do not write this comment)
  const [filters, setFilters] = useState({
    filter: {
      categoryId: '',
      year: '',
    },
    pagination: {
      currentPage: 1,
      perPage: 10,
      totalItem: 0,
      totalPage: 0,
    },
    search: '',
    // bisa ada field lain jika dibutuhkan
  })
  // 10. Computed / Derived (do not write this comment)
  const data = useMemo(() => {
    // utilisasi wajib ditulis di dalam parent function
    const getMappedItem = (item: DataUsersProfile, categoryName: string) => ({
      id: item.id,
      title: item.title,
      category: categoryName,
    })

    const activeCategory = usersCategories.data.find((category) => category.isActive)
    const categories = activeCategory?.categories ?? []
    const tabs = ['Semua', ...categories.map((category) => category.name)]
    const isCategoryTabActive = !!activeCategory && filters.activeSubCategory === activeCategory.name
    const filteredList = isCategoryTabActive
      ? usersProfile.data.filter((raw) => !raw.sub_category_name)
      : usersProfile.data
    const mappedList = filteredList.map((raw) => getMappedItem(raw, raw.category_name))

    return {
      data: mappedList,
      isLoading: usersProfile.status === 'loading',
      isError: usersProfile.status === 'error',
      isEmpty: usersProfile.status === 'success' && !mappedList.length,
      emptyTitle: 'Data Tidak Ditemukan',
      emptySubtitle: 'Belum ada data yang dapat ditampilkan untuk kategori ini. Cek kategori lain atau kembali lagi nanti.',
      emptyImage: assets?.noData3Svg,
      pagination: filters.pagination,
      // bisa ada field lain jika dibutuhkan
    }
  }, [filters, usersProfile, usersCategories, assets])
  // 11. Methods / Handlers (do not write this comment)
  const loadUsersProfile = (page: number) => {
    setFilters((prev) => ({ ...prev, pagination: { ...prev.pagination, currentPage: page } }))
    fetchUsersProfile.refetch()
  }
  const submitUsersProfile = () => {}
  const editUsersProfile = () => {}
  const clearUsersProfile = () => {
    // utilisasi wajib ditulis di dalam parent function
    const getSelectedIds = () => data.data.map((item) => item.id)

    removeUsersProfile.mutate({ ids: getSelectedIds() })
  }
  // 12. Effects
  useEffect(() => {}, [])

  return (
    <div>
      {/* template hanya untuk rendering */}
    </div>
  )
}
```

**Aturan `filters` & `data`:**

- Semua kondisi tampilan (filter, pagination, search, tab aktif, toggle UI) digabung ke dalam **satu** state bernama `filters`.
- Semua derived value dihitung di dalam **satu** computed bernama `data` (`useMemo`), tidak tersebar di luar.
- Function utilisasi (`get*`) ditulis di dalam `data`, bukan di scope module.
- Update `filters` selalu immutable: `setFilters((prev) => ({ ...prev, ... }))`.

**Field wajib pada return `data`:**

| Field           | Tipe      | Keterangan                                      |
| --------------- | --------- | ----------------------------------------------- |
| `data`          | `Array`   | Hasil mapping list yang siap dirender           |
| `isLoading`     | `boolean` | Status loading dari controller                  |
| `isError`       | `boolean` | Status error dari controller                    |
| `isEmpty`       | `boolean` | `true` jika sudah selesai load tapi data kosong |
| `emptyTitle`    | `string`  | Judul saat state kosong                         |
| `emptySubtitle` | `string`  | Deskripsi saat state kosong                     |
| `emptyImage`    | `string`  | Ilustrasi saat state kosong                     |
| `pagination`    | `Object`  | Pagination aktif dari `filters`                 |
/** bisa ada field lain jika dibutuhkan */

**Prefix method component & emit:**

| Aksi              | Prefix   | Contoh handler         | Contoh callback prop   |
| ----------------- | -------- | ---------------------- | ---------------------- |
| Baca / muat data  | `load`   | `loadUsersProfile()`   | `onLoadUsersProfile`   |
| Kirim / buat data | `submit` | `submitUsersProfile()` | `onSubmitUsersProfile` |
| Ubah data         | `edit`   | `editUsersProfile()`   | `onEditUsersProfile`   |
| Hapus data        | `clear`  | `clearUsersProfile()`  | `onClearUsersProfile`  |

> Prefix service (`get`, `post`, `update`, `patch`, `delete`) di dalam component **hanya** boleh dipakai untuk function utilisasi di dalam parent function, bukan untuk handler maupun callback props.

---

#### 2. Penggunaan Template
- Template hanya bertanggung jawab untuk rendering UI.
- Dilarang menulis business logic kompleks langsung di JSX.
- Dilarang menggunakan expression yang panjang atau nested condition yang sulit dibaca.
- Logic perhitungan harus dipindahkan ke variabel derived, handler, atau custom hook.
- Setiap section besar wajib dipisahkan menjadi komponen tersendiri.
- Gunakan komponen Shadcn/UI terlebih dahulu sebelum membuat elemen custom.
- Hindari nested JSX yang terlalu dalam (> 3 level).
- Setiap komponen child harus menerima data melalui props dan mengirim aksi melalui callback props.
- Dilarang mengakses state milik komponen lain secara langsung dari JSX.

Contoh:

```tsx
// ❌ Salah
<div>{users.filter(user => user.active).length}</div>

// ✅ Benar
const activeUsersCount = users.filter((u) => u.active).length
<div>{activeUsersCount}</div>
```

---

#### 3. Penggunaan Existing Component

Urutan pencarian komponen wajib:

```text
1. Shadcn/UI Component (src/components/ui)
2. Existing Component Project (src/components)
3. Reusable Component
4. Buat Component Baru
```

Sebelum membuat komponen baru wajib memeriksa:

```text
src/features/{nama_feature}/components
```

Ketentuan:
- Dilarang membuat komponen yang memiliki fungsi sama dengan komponen existing.
- Dilarang melakukan duplikasi wrapper component tanpa alasan yang jelas.
- Jika hanya berbeda sedikit behavior atau tampilan, lakukan extend terhadap komponen existing.
- Props harus mengikuti pola komponen yang sudah ada.
- Nama komponen harus konsisten dengan domain fitur.
- Komponen parent bertanggung jawab terhadap koordinasi data.
- Komponen child bertanggung jawab terhadap rendering dan aksi spesifik.
- Reusable component tidak boleh mengandung business logic fitur tertentu.
- Feature component tidak boleh digunakan sebagai pengganti reusable component jika kebutuhan bersifat umum.

---

#### 4. React Hook Form + Zod (untuk form)

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
})

type FormValues = z.infer<typeof schema>

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: '' },
})
```

---

# Final Rules

- Tidak boleh merubah kode, UI/UX, dan logika lain yang sudah ada.
- Tidak boleh ada penambahan atau perbaikan diluar kebutuhan task.
- Tidak boleh menggunakan penamaan function diluar dari convention yang sudah ditentukan.
- Harus melakukan utilisasi dengan membuat function baru di dalam parent function.
- Function utilitas tidak boleh berada di luar parent function.
- Function utilitas (inner function) hanya boleh memakai prefix `get`, `post`, `update`, `patch`, `delete`.
- Penamaan callback props menggunakan rumus `(on + emit prefix + subject)`:
  ```tsx
  onLoadUser={loadUser}
  onSubmitUser={submitUser}
  onEditUser={editUser}
  onClearUser={clearUser}

  onLoadModal={loadModal}
  onClearModal={clearModal}
  ```
