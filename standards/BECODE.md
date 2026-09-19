# Express.js Architecture Starter

## Architecture Overview

Architecture mempertahankan separation of concerns dari starter sebelumnya. Framework berpindah dari NestJS ke Express.js, tetapi boundary antar-layer tetap tegas.

```txt
server/api/features/{folder-name}/
├── dto/{filename}.dto.ts
├── entities/{filename}.entity.ts
├── repositories/{filename}.repository.ts
├── services/{filename}.service.ts
├── controllers/{filename}.controller.ts
└── module.ts
```

> Repository, service, controller, dan DTO hanya boleh berhubungan dengan domain resource masing-masing. Jangan mendefinisikan concern domain lain di luar batas tersebut.

### Layer Responsibility

```txt
HTTP Request
    │
    ▼
Controller
    │
    ▼
Service
    │
    ▼
Repository
    │
    ▼
Prisma / External Data Source
```

- **Controller**: HTTP layer, routing handler, membaca `req`, menulis `res`, validasi input, dan delegasi.
- **Service**: business logic dan orchestration.
- **Repository**: datasource access. Semua query Prisma berada di sini.
- **DTO**: input/output contract dan validation schema.
- **Entity**: data shape/domain representation tanpa business logic.
- **Module**: composition root feature untuk membuat repository → service → controller → router.

---

## Tech Stack

| Concern | Package |
|---|---|
| **Framework** | Express.js |
| **Language** | TypeScript |
| **ORM** | Prisma (PostgreSQL) |
| **Validation** | `express-validator` |
| **Auth** | `passport` + `passport-jwt` |
| **Config** | `dotenv` |
| **Caching** | `ioredis` + custom `CacheService` |
| **Rate Limiting** | `express-rate-limit` |
| **Queue** | `bullmq` |
| **Testing** | Jest + Supertest |
| **Docs** | `swagger-jsdoc` + `swagger-ui-express` |
| **HTTP** | Express `Request` / `Response` / `NextFunction` |

---

## Shared Directory

```txt
server/shared/
├── prisma/
│   └── prisma.service.ts              # PrismaClient singleton
├── middlewares/
│   ├── jwt-auth.middleware.ts         # JWT auth middleware
│   ├── ai-throttler.middleware.ts     # rate-limit middleware for AI endpoints
│   ├── validation.middleware.ts       # express-validator result handler
│   └── async.middleware.ts             # async controller wrapper
├── decorators/
│   └── current-user.ts                 # helper/type contract for current user
├── filters/
│   └── http-exception.filter.ts        # global Express error handler
├── interceptors/
│   └── transform.middleware.ts         # global response wrapper middleware
├── queues/
│   ├── queue.constants.ts              # queue + job name constants
│   ├── queue.service.ts                # BullMQ enqueue helpers
│   ├── embedding.processor.ts          # FAQ + KB embedding jobs
│   └── drive-sync.processor.ts         # Drive document sync jobs
├── services/
│   ├── ai.service.ts                   # DeepSeek client + Jina embeddings + text chunking
│   ├── supabase.service.ts             # Supabase Storage client
│   ├── drive-processor.service.ts      # Google Drive OAuth + document processing
│   ├── redis.service.ts                # ioredis client wrapper
│   └── cache.service.ts                # caching + session + job status + ephemeral storage
└── utils/
    ├── utils.ts                        # bcrypt helpers
    ├── paginated-result.ts             # PaginatedResult<T>
    └── prisma-error.handler.ts         # Prisma error → HTTP error mapping
```

> Nama folder boleh disesuaikan dengan idiom Express, tetapi boundary dan tanggung jawab layer tidak berubah.

---

# Function Naming Rules

Penamaan function menggunakan format:

```text
{prefix}{ResourceName}
```

### ResourceName

- `ResourceName` menggunakan `PascalCase`.
- Nama mengikuti resource endpoint setelah mengabaikan:
  - base URL
  - prefix `api`
  - versioning (`v1`, `v2`, dst.)
  - parameter dinamis (`{id}`, `{type}`, dst.)

### Contoh

| Endpoint | ResourceName | Function |
|---|---|---|
| `/api/v1/users/profile` | `UsersProfile` | `fetchUsersProfile()` |
| `/api/v1/users/profile` | `UsersProfile` | `storeUsersProfile()` |
| `/api/v1/ai-search/register/file/{type}/{id}` | `AiSearchRegisterFile` | `fetchAiSearchRegisterFile()` |

---

# Prefix Rules

> Setiap layer memiliki kumpulan prefix sendiri dan tidak boleh saling digunakan.

| Prefix | Repository | Service | Controller |
|---|:---:|:---:|:---:|
| `get` | ✅ | ❌ | ❌ |
| `post` | ✅ | ❌ | ❌ |
| `update` | ✅ | ❌ | ❌ |
| `patch` | ✅ | ❌ | ❌ |
| `delete` | ✅ | ❌ | ❌ |
| `fetch` | ❌ | ✅ | ❌ |
| `store` | ❌ | ✅ | ❌ |
| `change` | ❌ | ✅ | ❌ |
| `remove` | ❌ | ✅ | ❌ |
| `load` | ❌ | ❌ | ✅ |
| `save` | ❌ | ❌ | ✅ |
| `modify` | ❌ | ❌ | ✅ |
| `destroy` | ❌ | ❌ | ✅ |

---

# Convention per Layer

## Repository

Repository merepresentasikan operasi datasource.

```ts
getUsersProfile()
getUsersProfileMany()
postUsersProfile()
updateUsersProfile()
patchUsersProfile()
deleteUsersProfile()
```

Repository tidak boleh menerima `Request` atau `Response` Express.

---

## Service

Service merepresentasikan business logic.

```ts
fetchUsersProfile()
fetchUsersProfileList()
storeUsersProfile()
changeUsersProfile()
removeUsersProfile()
```

Service tidak boleh mengakses Prisma langsung dan tidak boleh menerima `Request` / `Response`.

---

## Controller

Controller menangani HTTP request dan mendelegasikan ke service.

```ts
loadUsersProfile()
saveUsersProfile()
modifyUsersProfile()
destroyUsersProfile()
```

Controller boleh menerima `Request`, `Response`, dan `NextFunction` hanya untuk kebutuhan HTTP layer.

---

# Contoh Mapping

| HTTP Method | Repository | Service | Controller |
|---|---|---|---|
| GET | `getUsersProfile()` | `fetchUsersProfile()` | `loadUsersProfile()` |
| POST | `postUsersProfile()` | `storeUsersProfile()` | `saveUsersProfile()` |
| PUT | `updateUsersProfile()` | `changeUsersProfile()` | `modifyUsersProfile()` |
| PATCH | `patchUsersProfile()` | `changeUsersProfile()` | `modifyUsersProfile()` |
| DELETE | `deleteUsersProfile()` | `removeUsersProfile()` | `destroyUsersProfile()` |

---

# Larangan

Hindari penggunaan prefix lain agar seluruh project memiliki vocabulary yang terbatas dan konsisten.

```ts
createUsersProfile()
findUsersProfile()
existsUsersProfile()
validateUsersProfile()
transformUsersProfile()
mapUsersProfile()
buildUsersProfile()
parseUsersProfile()
generateUsersProfile()
calculateUsersProfile()
processUsersProfile()
executeUsersProfile()
runUsersProfile()
handleUsersProfile()
```

> Utilitas internal yang benar-benar dibutuhkan tetap boleh dibuat sebagai `private` method di dalam class yang sama. Prefix larangan di atas berlaku untuk public method antar-layer.

---

# Express Application Bootstrap

Express tidak memiliki `Module`, `Guard`, `Interceptor`, dan `ExceptionFilter` native seperti NestJS. Konsep yang sama diwujudkan menggunakan app bootstrap, middleware, composition root, dan error middleware.

```txt
server/
├── app.ts                 # configure Express app + global middleware
├── server.ts              # start HTTP server
├── config/
├── api/
│   └── features/
├── shared/
└── routes/
    └── index.ts           # mount feature routers
```

### `server.ts`

```typescript
import { app } from './app'

const port = Number(process.env.PORT ?? 3000)

app.listen(port, () => {
  // gunakan Logger abstraction, bukan console.log
})
```

### `app.ts`

```typescript
import express from 'express'
import { routes } from './routes'
import { transformResponse } from './shared/interceptors/transform.middleware'
import { httpExceptionFilter } from './shared/filters/http-exception.filter'

export const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(transformResponse)
app.use(routes)
app.use(httpExceptionFilter)
```

> Error middleware harus dipasang setelah seluruh route middleware agar dapat menangkap error dari controller dan middleware berikutnya.

---

# Redis Architecture

Redis digunakan untuk 5 concern terpisah. Semua akses Redis melalui `RedisService` dan `CacheService` di `server/shared/services/`.

## 1. Caching

```typescript
async fetchAgentsList() {
  return this.cacheService.getOrSet(
    'agents:list',
    () => this.agentsRepository.getAgentsMany(),
    this.cacheService.ttl.AGENTS,
  )
}
```

Invalidate setelah mutation:

```typescript
async storeAgents(dto: CreateAgentsDto) {
  const result = await this.agentsRepository.postAgents(dto)
  await this.cacheService.invalidate('agents:list')
  return result
}
```

| Resource | Cache Key | TTL |
|---|---|---|
| Agents list | `agents:list` | 5 menit |
| Knowledge Base list | `knowledge-base:list` | 10 menit |
| Questions list | `questions:list` | 30 menit |
| Dashboard stats | `dashboard:stats` | 1 menit |
| Documents list | `documents:list` | 1 menit |

## 2. Session / State

```typescript
await this.cacheService.storeSessionContext(sessionId, {
  lastMessages: [...],
})

const ctx = await this.cacheService.getSessionContext<SessionCtx>(sessionId)
```

TTL default session context: 1 jam.

## 3. Rate Limiting

Semua endpoint dapat memakai default limiter. Endpoint AI menggunakan limiter khusus.

| Name | Limit | Window | Digunakan untuk |
|---|---:|---:|---|
| `default` | 100 req | 60 detik | Semua endpoint |
| `ai` | 20 req | 60 detik | `/chat` POST, `/ai-chat` POST |

Contoh:

```typescript
router.post(
  '/chat',
  aiThrottlerMiddleware,
  controller.saveChat.bind(controller),
)
```

## 4. Queue / Pub-Sub

BullMQ digunakan untuk operasi berat yang tidak harus blocking.

| Queue | Job | Trigger | Action |
|---|---|---|---|
| `embedding` | `faq-embed` | POST /faq-manager | Generate + save embedding |
| `embedding` | `kb-embed` | POST /knowledge-base | Generate + save embedding |
| `drive-sync` | `process-document` | POST /documents/sync | Proses satu dokumen Drive |
| `drive-sync` | `run-cron-tick` | Cron interval | Sync semua dokumen Drive |

```typescript
async storeFaqManager(userId: string, dto: CreateFaqManagerDto) {
  const item = await this.faqManagerRepository.postFaqManager(userId, dto)
  await this.queueService.enqueueFaqEmbed(
    item.id,
    dto.question,
    dto.answer,
  )
  return item
}
```

## 5. Ephemeral Storage

```typescript
await this.cacheService.storeJobStatus('drive-sync-xyz', {
  status: 'running',
  progress: 0,
})

await this.cacheService.storeEphemeral(
  'upload-metadata:abc',
  { size: 1024 },
  3600,
)
```

### Env Variables Redis

```env
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
```

> Redis bersifat opsional saat development. Semua operasi Redis wajib gagal secara graceful sehingga aplikasi tetap dapat berjalan ketika Redis tidak tersedia.

---

# Error Handling — Try-Catch Pattern

Setiap layer menangkap error sesuai tanggung jawabnya. Raw Prisma errors tidak boleh bocor ke client.

## Repository Layer

Repository menangkap Prisma errors dan menerjemahkannya melalui `handlePrismaError()`.

```typescript
export class AgentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAgentsMany() {
    try {
      return await this.prisma.agent.findMany()
    } catch (error) {
      throw handlePrismaError(error, 'agents')
    }
  }

  async deleteAgents(id: string) {
    try {
      return await this.prisma.agent.delete({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'agents')
    }
  }
}
```

| Prisma Code | HTTP Exception | Kondisi |
|---|---|---|
| `P2025` | 404 Not Found | Record tidak ditemukan |
| `P2002` | 409 Conflict | Unique constraint violation |
| Others | 500 Internal Server Error | Error database lainnya |

## Service Layer

Service membiarkan HTTP error dari repository diterus. Error non-HTTP dilog lalu dikonversi menjadi internal error.

```typescript
export class AgentsService {
  constructor(
    private readonly agentsRepository: AgentsRepository,
    private readonly logger: Logger,
  ) {}

  async fetchAgentsList() {
    try {
      return await this.agentsRepository.getAgentsMany()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get agents list', error)
      throw new InternalServerErrorException('Failed to get agents list')
    }
  }
}
```

> Jangan menangkap HTTP error dari repository lalu menggantinya dengan error lain tanpa alasan yang jelas. Error mapping datasource tetap terpusat di repository.

## Controller Layer

Controller dapat meneruskan error ke Express error middleware melalui `next(error)`.

```typescript
async loadAgentsList(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await this.agentsService.fetchAgentsList()
    return res.json(data)
  } catch (error) {
    return next(error)
  }
}
```

Untuk menghindari `try/catch` berulang pada setiap handler, gunakan `asyncHandler` pada route boundary. Tetapi business error tetap harus dipetakan oleh service/repository sesuai aturan di atas.

---

# Cross-Feature Sharing

Ketika dua feature atau lebih membutuhkan logic yang sama:

```txt
server/shared/
└── services/
    └── {shared-resource}.service.ts
```

Ketentuan:

- Service yang dikonsumsi lebih dari satu feature wajib berada di `server/shared/services/`.
- Feature tidak boleh mengimpor service feature lain secara langsung.
- Shared service boleh diekspor dari composition root atau dependency container aplikasi.

Contoh:

```typescript
export function createSharedServices() {
  const prismaService = new PrismaService()
  const redisService = new RedisService()
  const cacheService = new CacheService(redisService)

  return {
    prismaService,
    redisService,
    cacheService,
  }
}
```

---

# Penamaan Folder & File

Dari URL endpoint, buang segmen berikut:

- Base URL / domain
- Prefix `api`
- Versioning: segmen yang cocok pola `v{angka}`

Sisa path yang bermakna dibagi menjadi tiga konsep:

| Konsep | Aturan | Digunakan untuk |
|---|---|---|
| **folder-name** | Segmen pertama sisa path, `kebab-case` | Nama folder domain |
| **filename** | `folder-name` dikonversi ke `camelCase` | Prefix nama file `.ts` |

### Contoh

| URL | folder-name | filename |
|---|---|---|
| `/api/v1/users/profile` | `users` | `users` |
| `/api/v1/ai-search/register/file/{type}/{id}` | `ai-search` | `aiSearch` |

> Segmen dinamis (`{param}`) selalu diabaikan.

---

# Aturan Per File

## DTO (`{filename}.dto.ts`)

Express tidak membutuhkan class DTO NestJS. File DTO tetap dipertahankan sebagai contract dan validator.

```typescript
import { body, query } from 'express-validator'

export const createUsersProfileValidation = [
  body('field').isString().notEmpty(),
]

export const updateUsersProfileValidation = [
  body('field').optional().isString(),
]

export interface CreateUsersProfileDto {
  field: string
}

export interface UpdateUsersProfileDto {
  field?: string
}

export interface QueryUsersProfileDto {
  field?: string
}

export interface UsersProfileResponseDto {
  id: string
  field: string
  createdAt: Date
}
```

### Aturan DTO

| Kondisi | Buat DTO? |
|---|---|
| POST body | ✅ `Create{ResourceName}Dto` |
| PUT/PATCH body | ✅ `Update{ResourceName}Dto` |
| GET query params | ✅ `Query{ResourceName}Dto` |
| Response shape | ✅ `{ResourceName}ResponseDto` |
| DELETE tanpa body | ❌ Tidak perlu DTO |

---

## Entity (`{filename}.entity.ts`)

Entity merefleksikan data domain / Prisma model. Hanya shape, tidak ada business logic.

```typescript
export interface UsersProfileEntity {
  id: string
  field: string
  createdAt: Date
  updatedAt: Date
}
```

> Entity tidak boleh mengandung method atau business logic.

---

## Repository (`{filename}.repository.ts`)

Semua query Prisma harus berada di repository. Service tidak boleh memanggil Prisma langsung.

```typescript
import type {
  CreateUsersProfileDto,
  QueryUsersProfileDto,
  UpdateUsersProfileDto,
} from '../dto/users.dto'
import { PrismaService } from '../../shared/prisma/prisma.service'

export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUsersProfileById(id: string) {
    try {
      return await this.prisma.userProfile.findUnique({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'users')
    }
  }

  async getUsersProfileMany(query: QueryUsersProfileDto) {
    try {
      return await this.prisma.userProfile.findMany({
        where: { field: query.field },
      })
    } catch (error) {
      throw handlePrismaError(error, 'users')
    }
  }

  async postUsersProfile(dto: CreateUsersProfileDto) {
    try {
      return await this.prisma.userProfile.create({ data: dto })
    } catch (error) {
      throw handlePrismaError(error, 'users')
    }
  }

  async updateUsersProfile(id: string, dto: UpdateUsersProfileDto) {
    try {
      return await this.prisma.userProfile.update({
        where: { id },
        data: dto,
      })
    } catch (error) {
      throw handlePrismaError(error, 'users')
    }
  }

  async patchUsersProfile(id: string, dto: UpdateUsersProfileDto) {
    try {
      return await this.prisma.userProfile.update({
        where: { id },
        data: dto,
      })
    } catch (error) {
      throw handlePrismaError(error, 'users')
    }
  }

  async deleteUsersProfile(id: string) {
    try {
      return await this.prisma.userProfile.delete({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'users')
    }
  }
}
```

> Repository hanya datasource access. Tidak ada business logic dan tidak ada `Request` / `Response` Express.

---

## Service (`{filename}.service.ts`)

Business logic murni. Memanggil repository, bukan Prisma langsung.

```typescript
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: Logger,
  ) {}

  async fetchUsersProfile(id: string) {
    try {
      const data = await this.usersRepository.getUsersProfileById(id)
      if (!data) throw new NotFoundException('UsersProfile not found')
      return data
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to fetch UsersProfile', error)
      throw new InternalServerErrorException('Failed to fetch UsersProfile')
    }
  }

  async fetchUsersProfileList(query: QueryUsersProfileDto) {
    return this.usersRepository.getUsersProfileMany(query)
  }

  async storeUsersProfile(dto: CreateUsersProfileDto) {
    return this.usersRepository.postUsersProfile(dto)
  }

  async changeUsersProfile(
    id: string,
    dto: UpdateUsersProfileDto,
  ) {
    await this.fetchUsersProfile(id)
    return this.usersRepository.patchUsersProfile(id, dto)
  }

  async removeUsersProfile(id: string) {
    await this.fetchUsersProfile(id)
    return this.usersRepository.deleteUsersProfile(id)
  }
}
```

> Tidak ada Prisma langsung. Tidak ada `req` / `res`. Hanya business logic dan dependency yang dibutuhkan.

---

## Controller (`{filename}.controller.ts`)

Controller adalah HTTP layer murni.

```typescript
import type { NextFunction, Request, Response } from 'express'

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  async loadUsersProfileList(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await this.usersService.fetchUsersProfileList(
        req.query as QueryUsersProfileDto,
      )
      return res.json(data)
    } catch (error) {
      return next(error)
    }
  }

  async loadUsersProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await this.usersService.fetchUsersProfile(req.params.id)
      return res.json(data)
    } catch (error) {
      return next(error)
    }
  }

  async saveUsersProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await this.usersService.storeUsersProfile(
        req.body as CreateUsersProfileDto,
      )
      return res.status(201).json(data)
    } catch (error) {
      return next(error)
    }
  }

  async modifyUsersProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await this.usersService.changeUsersProfile(
        req.params.id,
        req.body as UpdateUsersProfileDto,
      )
      return res.json(data)
    } catch (error) {
      return next(error)
    }
  }

  async destroyUsersProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const data = await this.usersService.removeUsersProfile(req.params.id)
      return res.json(data)
    } catch (error) {
      return next(error)
    }
  }
}
```

### Prefix method controller

| HTTP | Prefix | Contoh |
|---|---|---|
| GET | `load` | `loadUsersProfile()` |
| POST | `save` | `saveRegisterFile()` |
| PUT/PATCH | `modify` | `modifyUsersProfile()` |
| DELETE | `destroy` | `destroyUsersProfile()` |

---

## Module (`module.ts`)

Express tidak memiliki module decorator. File `module.ts` dipertahankan sebagai composition root feature agar architecture lama tetap mudah dikenali.

Tugas `module.ts` hanya:

1. Membuat dependency repository.
2. Membuat service dengan repository.
3. Membuat controller dengan service.
4. Membuat router.
5. Memasang middleware route yang diperlukan.

```typescript
import { Router } from 'express'
import { SharedServices } from '../../shared/shared-services'
import { UsersRepository } from './repositories/users.repository'
import { UsersService } from './services/users.service'
import { UsersController } from './controllers/users.controller'
import {
  createUsersProfileValidation,
  updateUsersProfileValidation,
} from './dto/users.dto'
import { validationMiddleware } from '../../shared/middlewares/validation.middleware'

export function createUsersModule(shared: SharedServices) {
  const repository = new UsersRepository(shared.prismaService)
  const service = new UsersService(repository, shared.logger)
  const controller = new UsersController(service)
  const router = Router()

  router.get('/', controller.loadUsersProfileList.bind(controller))
  router.get('/:id', controller.loadUsersProfile.bind(controller))
  router.post(
    '/',
    createUsersProfileValidation,
    validationMiddleware,
    controller.saveUsersProfile.bind(controller),
  )
  router.patch(
    '/:id',
    updateUsersProfileValidation,
    validationMiddleware,
    controller.modifyUsersProfile.bind(controller),
  )
  router.delete('/:id', controller.destroyUsersProfile.bind(controller))

  return router
}
```

> `module.ts` bukan tempat business logic. Ia hanya composition/wiring layer.

---

# Routing

Global route mounting mengikuti folder feature.

```typescript
import { Router } from 'express'
import { createUsersModule } from '../api/features/users/module'
import { createSharedServices } from '../shared/shared-services'

export const routes = Router()
const shared = createSharedServices()

routes.use('/api/v1/users', createUsersModule(shared))
```

### Controller tidak boleh dipanggil langsung dari route root

Route root hanya melakukan mounting module/feature router. Detail HTTP handler tetap berada di controller.

---

# Authentication

JWT auth diterapkan sebagai Express middleware.

```typescript
export function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  passport.authenticate('jwt', { session: false }, (error, user) => {
    if (error) return next(error)
    if (!user) return next(new UnauthorizedException('Unauthorized'))

    req.user = user
    return next()
  })(req, res, next)
}
```

Feature router menggunakan middleware tersebut sebelum controller.

```typescript
router.get(
  '/',
  jwtAuthMiddleware,
  controller.loadUsersProfileList.bind(controller),
)
```

---

# Validation

Validasi request dilakukan sebelum controller.

```typescript
export const createUsersProfileValidation = [
  body('field')
    .isString()
    .withMessage('Field must be a string')
    .notEmpty()
    .withMessage('Field is required'),
]
```

Validation result wajib diproses oleh `validationMiddleware` dan menghasilkan format error API standar.

```typescript
export function validationMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return next(
      new ValidationException(
        errors.array().map((error) => ({
          field: 'path' in error ? error.path : 'unknown',
          message: error.msg,
        })),
      ),
    )
  }

  return next()
}
```

---

# Prisma Service — Singleton Wajib

PrismaClient hanya dibuat satu kali untuk application process.

```typescript
import { PrismaClient } from '@prisma/client'

export class PrismaService extends PrismaClient {
  private static instance: PrismaService

  private constructor() {
    super()
  }

  static getInstance() {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService()
    }

    return PrismaService.instance
  }
}
```

> Jangan membuat `new PrismaClient()` di setiap request atau repository instance.

---

# Response Middleware

Response middleware mengubah hasil controller menjadi format success standar tanpa memaksa setiap controller menduplikasi wrapper.

```typescript
export function transformResponse(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const originalJson = res.json.bind(res)

  res.json = (payload: unknown) => {
    if (payload instanceof PaginatedResult) {
      return originalJson({
        success: true,
        code: res.statusCode,
        message: 'Success',
        data: payload.data,
        meta: {
          ...payload.meta,
          timestamp: new Date().toISOString(),
          request_id: req.id,
        },
      })
    }

    return originalJson({
      success: true,
      code: res.statusCode,
      message: 'Success',
      data: payload,
      meta: {
        timestamp: new Date().toISOString(),
        request_id: req.id,
      },
    })
  }

  return next()
}
```

> SSE/streaming response harus melewati wrapper menggunakan jalur response langsung.

---

# Global Error Middleware

Express error middleware harus memiliki signature empat parameter.

```typescript
export function httpExceptionFilter(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const httpError = normalizeHttpError(error)

  return res.status(httpError.code).json({
    success: false,
    code: httpError.code,
    message: httpError.message,
    ...(httpError.errors
      ? { errors: httpError.errors }
      : { data: null }),
    meta: {
      timestamp: new Date().toISOString(),
      request_id: req.id,
    },
  })
}
```

Error middleware menjadi satu-satunya pintu terakhir untuk response error HTTP.

---

# Testing Guide

### Struktur Test

```txt
server/api/features/{folder-name}/
├── services/{filename}.service.spec.ts
├── repositories/{filename}.repository.spec.ts
└── controllers/{filename}.controller.spec.ts
```

### Service Test

Service diuji dengan repository mock.

```typescript
describe('UsersService', () => {
  const mockRepository = {
    getUsersProfileById: jest.fn(),
    getUsersProfileMany: jest.fn(),
    postUsersProfile: jest.fn(),
    patchUsersProfile: jest.fn(),
    deleteUsersProfile: jest.fn(),
  }

  it('fetchUsersProfile throws when not found', async () => {
    mockRepository.getUsersProfileById.mockResolvedValue(null)

    const service = new UsersService(mockRepository, mockLogger)

    await expect(
      service.fetchUsersProfile('nonexistent-id'),
    ).rejects.toThrow(NotFoundException)
  })
})
```

### Repository Test

Repository diuji dengan mocked PrismaService.

```typescript
describe('UsersRepository', () => {
  const mockPrisma = {
    userProfile: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }

  it('getUsersProfileById calls prisma.findUnique', async () => {
    mockPrisma.userProfile.findUnique.mockResolvedValue({ id: '1' })

    const repository = new UsersRepository(mockPrisma as PrismaService)
    await repository.getUsersProfileById('1')

    expect(mockPrisma.userProfile.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    })
  })
})
```

### Controller E2E Test

Gunakan Express application + Supertest.

```typescript
import request from 'supertest'

it('GET /api/v1/users returns 200', async () => {
  await request(app)
    .get('/api/v1/users')
    .expect(200)
})

it('POST /api/v1/users with invalid body returns 400', async () => {
  await request(app)
    .post('/api/v1/users')
    .send({})
    .expect(400)
})
```

---

# Package Structure

Contoh dependency yang dibutuhkan untuk Express version:

```json
{
  "dependencies": {
    "express": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "bullmq": "^5.51.1",
    "dotenv": "^16.0.0",
    "express-rate-limit": "^7.0.0",
    "express-validator": "^7.0.0",
    "ioredis": "^5.3.2",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.0"
  },
  "devDependencies": {
    "@types/express": "latest",
    "@types/passport-jwt": "latest",
    "@types/swagger-ui-express": "latest",
    "jest": "^29.0.0",
    "supertest": "^7.0.0",
    "@types/supertest": "latest",
    "prisma": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

> Versi package mengikuti kompatibilitas project. Jangan melakukan upgrade dependency yang tidak diperlukan oleh task.

---

# ESLint / SonarQube

### SonarQube Rules

- Cognitive Complexity maksimal **15** per method.
- Method parameters maksimal **7**.
- Hapus semua unused imports/variables.
- Prefer optional chaining `?.` daripada `&&` chain.
- Dilarang `any`; gunakan generic atau `unknown`.
- Dilarang `console.log` di production code; gunakan logger abstraction.

### `.eslintrc.js`

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': 'error',
  },
}
```

### Import order

```txt
Express / Node core
↓
Third-party
↓
Shared
↓
Internal feature
```

Dilarang `// eslint-disable-next-line` kecuali benar-benar unavoidable dan disertai alasan teknis.

---

# CI Pipeline

```yaml
name: CI

on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npx prisma generate
      - run: npm run test
      - run: npm run test:e2e
```

---

# Final Rules

- Tidak boleh merubah kode dan logika lain yang sudah ada.
- Tidak boleh ada penambahan atau perbaikan di luar kebutuhan task.
- Tidak boleh menggunakan penamaan function di luar convention yang sudah ditentukan.
- Utilitas internal wajib dibuat sebagai `private` method jika memang hanya digunakan class tersebut.
- Private utility method tidak boleh berada di luar class-nya.
- Controller tidak boleh memanggil repository secara langsung.
- Service tidak boleh memanggil Prisma secara langsung.
- Repository tidak boleh mengandung business logic.
- Repository tidak boleh menerima `Request` atau `Response` Express.
- Service tidak boleh menerima `Request` atau `Response` Express.
- Controller adalah satu-satunya feature layer yang berhubungan langsung dengan HTTP.
- `module.ts` hanya melakukan dependency wiring dan route composition.
- Semua Prisma query wajib berada di Repository.
- Semua error response wajib melalui global error middleware kecuali streaming/SSE.
- Semua feature harus dapat dipasang melalui router tanpa mengubah boundary layer feature lain.

---

# AI Assistant Memory Directive

> SETIAP AI CODING ASSISTANT YANG BEKERJA DI PROJECT INI WAJIB:

1. Membaca dan memahami seluruh isi file ini sebelum menulis kode.
2. Mematuhi semua aturan architecture dan naming di atas.
3. Melakukan verifikasi `npm run lint` dan `npm run test` setelah setiap perubahan.
4. Project ini menggunakan **Express.js + TypeScript** dengan **Prisma** sebagai ORM utama.
5. Controller tidak boleh akses repository. Service tidak boleh akses Prisma langsung.
6. Semua Prisma query wajib berada di layer Repository.
7. Jangan mengubah logic di luar scope task.

---

# Migration Mapping — NestJS → Express.js

| NestJS | Express.js |
|---|---|
| `@Controller()` | `Router` + Controller class |
| `@Get/@Post/@Patch/@Delete` | `router.get/post/patch/delete` |
| Provider / DI | Manual dependency injection di `module.ts` |
| `@Injectable()` | Plain TypeScript class |
| Guard | Express middleware |
| Pipe / `ValidationPipe` | `express-validator` + validation middleware |
| Interceptor | Express middleware / response wrapper |
| Exception Filter | Express error middleware |
| Module | `module.ts` composition root |
| `@Req/@Res` | `Request` / `Response` |
| Swagger decorators | `swagger-jsdoc` definitions |
| Nest Logger | Logger abstraction |
| `@nestjs/cache-manager` | Custom `CacheService` + `ioredis` |
| `@nestjs/throttler` | `express-rate-limit` / custom limiter middleware |
| `@nestjs/bullmq` | Native `bullmq` workers/queues |
| `@nestjs/testing` | Jest + direct class testing |

> Migration hanya mengganti framework plumbing. Domain boundary, naming convention, repository/service/controller separation, response contract, Redis concerns, queue boundaries, dan testing intent tetap dipertahankan.

---

# Target Directory Structure

```txt
server/
├── app.ts
├── server.ts
├── config/
│   └── env.ts
├── routes/
│   └── index.ts
├── api/
│   └── features/
│       ├── users/
│       │   ├── dto/
│       │   │   └── users.dto.ts
│       │   ├── entities/
│       │   │   └── users.entity.ts
│       │   ├── repositories/
│       │   │   └── users.repository.ts
│       │   ├── services/
│       │   │   └── users.service.ts
│       │   ├── controllers/
│       │   │   └── users.controller.ts
│       │   └── module.ts
│       └── ...
└── shared/
    ├── prisma/
    ├── middlewares/
    ├── filters/
    ├── interceptors/
    ├── queues/
    ├── services/
    └── utils/
```

### Arus dependency

```txt
routes
  ↓
module
  ↓
controller
  ↓
service
  ↓
repository
  ↓
Prisma
```

Shared services hanya menjadi dependency lintas feature ketika benar-benar reusable.

---

# Kesimpulan Architecture

Express.js digunakan sebagai HTTP framework tanpa menghapus architecture yang sudah dibangun.

Yang tetap:

- Feature-based architecture.
- DTO → Entity → Repository → Service → Controller.
- Prefix naming per layer.
- Semua query Prisma di Repository.
- Business logic di Service.
- HTTP concern di Controller.
- Shared service untuk cross-feature logic.
- Redis untuk cache, session/state, rate limiting, queue support, dan ephemeral storage.
- BullMQ untuk pekerjaan async.
- Standard response `success/code/message/data/meta`.
- Global error normalization.
- Unit test per layer dan E2E dengan Supertest.
- ESLint, SonarQube, dan CI tetap menjadi gate kualitas.

Yang berubah hanya adapter/framework-specific plumbing:

```txt
NestJS decorators + module system + guards + pipes + interceptors
                           ↓
Express Router + middleware + module.ts composition + error middleware
```

Architecture domain tetap sama; hanya mesin HTTP-nya yang diganti.
