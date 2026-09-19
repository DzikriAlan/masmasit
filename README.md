# MasMasIT_Online

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-gccqsyqh)

# MasmasIT

IT community, talent & agency ecosystem for Indonesian practitioners — jobs, projects, team building, courses, events, services and community in one account. Built with Next.js 14 (App Router), React 18, TypeScript and Supabase.

## 🎯 Overview

**MasmasIT** is a fullstack platform where the community (discussions, builds, events) and the ecosystem (paid work: jobs, client projects, team collabs, bookings, courses, services) live in the same place:
- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript with Tailwind CSS & Shadcn/UI components
- **Backend**: Built-in API routes (`src/app/api/v1`) backed by server modules in `server/`
- **Database & Auth**: Supabase (PostgreSQL + Row Level Security + Auth), schema managed through `supabase/migrations`
- **State Management**: Zustand for client state, TanStack Query for server state
- **Forms**: React Hook Form + Zod for form handling and validation
- **Internationalization**: EN / ID toggle handled by the in-app language provider
- **Design system**: ink-black actions on a neutral canvas, with one identity colour per ecosystem area (`src/shared/lib/tones.ts`)

Main areas:
- **Product**: Team Builder, Team Collabs, Jobs, Projects, Spotlight
- **Ecosystem**: Talent, Courses, Agency, Services, Discussions, Members, Builds, Events
- **Discover**: the ecosystem's front door — search, quick links, latest writing, featured practitioners, open roles and upcoming events

External job listings (Discover / Jobs → "From around the web") are fetched live from Remotive on request and cached by Next.js for an hour. They are **never written to the database**; filtering by a search query is passed through to the live fetch (`GET /api/v1/external-jobs?q=...`).

Code, design and API conventions live in [standards/](./standards).

---

## 📚 Tech Stack

| Concern | Package |
|---------|---------|
| Framework | Next.js 14 (App Router) + React 18 + TypeScript |
| Styling | Tailwind CSS + Shadcn/UI (Radix UI, vaul) |
| Server State | TanStack Query (@tanstack/react-query) |
| Client State | Zustand |
| Forms | React Hook Form + Zod |
| Database, Auth & Storage | Supabase (@supabase/supabase-js, @supabase/ssr) |
| Internationalization | In-app EN/ID language provider |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deployment | Netlify (`@netlify/plugin-nextjs`) |
| Node Version | v20+ |

---

## 📋 Prerequisites

- **Node.js**: v20 or higher
- **npm**: v10+ or yarn/pnpm
- **Supabase project**: hosted, or local via the Supabase CLI
- **Git**: for version control

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone git@github.com:DzikriAlan/masmasit.git
cd masmasit
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

Create `.env.local` with your Supabase project values:

```env
# Supabase (browser + server)
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Supabase (server only — never expose to the browser)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Optional: base URL for API calls (defaults to same-origin /api/v1)
NEXT_PUBLIC_API_BASE_URL=""
```

### 4. Setup Database

Apply the migrations in `supabase/migrations` in order (`001` → `015`) to your Supabase project, for example with the Supabase CLI:

```bash
supabase db push
```

> Migration `015` (agencies, community, teams) must be applied before the newer Ecosystem pages (Agency, Team Builder, Team Collabs, Discussions, Builds, Spotlight) will work.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

---

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout (providers, fonts)
│   ├── page.tsx             # Home page
│   ├── {route}/page.tsx     # jobs, projects, talents, discover, events, ...
│   └── api/v1/              # API routes (admin, external-jobs, ...)
├── components/               # Shared UI: navbar, footer, app-shell, load-data, ui/*
├── features/
│   └── {folderName}/        # kebab-case, derived from endpoint (see standards/FECODE.md)
│       ├── types/           # {fileName}Types.ts — TypeScript interfaces & types
│       ├── states/          # {fileName}States.ts — Zustand stores
│       ├── services/        # {fileName}Services.ts — API call functions
│       ├── controllers/     # {fileName}Controllers.ts — TanStack Query hooks
│       └── components/      # {fileName}{Action}.tsx — React components
├── shared/
│   ├── lib/
│   │   ├── supabase.ts     # Supabase browser client
│   │   ├── api.ts          # apiGet / apiPost helpers
│   │   ├── tones.ts        # Ecosystem-area colour identity
│   │   └── utils.ts        # cn() utility & helper functions
│   ├── styles/
│   │   └── globals.css     # Tailwind base & CSS variables (light + .dark tokens)
│   └── images/             # Bundled brand assets
└── middleware.ts            # Session refresh / route protection
server/                       # Server-side modules used by API routes (jobs, events, ...)
supabase/migrations/          # Database schema, RLS policies and seeds
standards/                    # FECODE / BECODE / RESPONSE conventions
public/                       # Static files
```

---

## 💻 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 3001 with hot-reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint (`next lint`) |
| `npm run typecheck` | Run TypeScript type-check (`tsc --noEmit`) |

---

## 🧭 Next Steps: Building on This Starter

Every new feature must follow the documents in the [standards/](./standards) folder. Read them before writing code.

| Step | What to do | Standard |
|------|-----------|----------|
| 1 | Define the endpoint and derive names from the URL (drop base URL, `api`, `v{n}`, and dynamic segments) → `folderName`, `fileName`, `resourceName` | [FECODE.md](./standards/FECODE.md#penamaan-folder--file) |
| 2 | Design the API response contract (`success`, `data`, `error`, `pagination`, `message`) and HTTP status codes | [RESPONSE.md](./standards/RESPONSE.md) |
| 3 | Build the backend feature: DTO → Entity → Repository → Service → Controller → `module.ts`, then mount it in the routes | [BECODE.md](./standards/BECODE.md) |
| 4 | Build the frontend feature in `src/features/{folderName}/`: Types → States → Services → Controllers → Components | [FECODE.md](./standards/FECODE.md) |
| 5 | Verify: `npm run lint` and `npm run typecheck` pass, and no function name uses a prefix outside the convention | [FECODE.md](./standards/FECODE.md#final-rules), [BECODE.md](./standards/BECODE.md#final-rules) |

### Frontend flow (FECODE)

```txt
src/features/{folderName}/
├── types/{fileName}Types.ts
├── states/{fileName}States.ts
├── services/{fileName}Services.ts
├── controllers/{fileName}Controllers.ts
└── components/{fileName}{Action}.tsx
```

### Backend flow (BECODE)

```txt
src/features/{folder-name}/
├── dto/{fileName}.dto.ts
├── entities/{fileName}.entity.ts
├── repositories/{fileName}.repository.ts
├── services/{fileName}.service.ts
├── controllers/{fileName}.controller.ts
└── module.ts
```

### Function prefixes per layer

| Layer | Prefixes |
|-------|----------|
| FE Service | `get` `post` `update` `patch` `delete` |
| FE Controller | `fetch` `store` `modify` `remove` |
| FE Component / emit | `load` `submit` `edit` `clear` |
| BE Repository | `get` `post` `update` `patch` `delete` |
| BE Service | `fetch` `store` `change` `remove` |
| BE Controller | `load` `save` `modify` `destroy` |

> Do not introduce prefixes outside these lists (e.g. `create`, `find`, `handle`, `process`).

---

## 🏗️ Architecture Guide

Complete documentation for architecture, naming conventions, and best practices lives in the [standards/](./standards) folder:

| Document | Scope |
|----------|-------|
| [FECODE.md](./standards/FECODE.md) | Frontend architecture, naming, Types/States/Services/Controllers/Components rules |
| [BECODE.md](./standards/BECODE.md) | Backend architecture, layer boundaries, error handling, Redis/queue, testing |
| [RESPONSE.md](./standards/RESPONSE.md) | Standard API response and HTTP status codes |

**Key Topics:**
- Naming conventions (functions, files, folders)
- Layer structure (FE: Types, States, Services, Controllers, Components; BE: DTO, Entity, Repository, Service, Controller, Module)
- React component best practices
- TanStack Query (React Query) patterns
- Zustand store management
- Zod validation schema
- API integration patterns
- Standard API response format
- Scraped/external data (e.g. Remotive jobs) is fetched live and cached, never persisted to the database

---

## 🤝 Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

Developed by Dzikri Alan's Team
