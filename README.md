# Full-Stack Monorepo Template

A production-ready full-stack monorepo with **NestJS 11** (backend) and
**Next.js 16** (frontend), containerized with Docker.

## Stack

| Layer    | Tech                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------- |
| Runtime  | Bun (runtime, package manager, test runner)                                                     |
| Backend  | NestJS 11, TypeScript, Prisma 7 + PostgreSQL, SWC, Passport (cookie sessions), bcryptjs, Helmet |
| Frontend | Next.js 16, React 19, Tailwind v4, shadcn/ui (base-vega), Base UI                               |
| Data     | TanStack React Query, Zustand, Zod v4, Axios                                                    |
| Logging  | Pino (nestjs-pino), Morgan HTTP middleware                                                      |
| Infra    | Docker, Docker Compose, Caddy reverse proxy, GitHub Actions                                     |

## Prerequisites

- Bun `1.4` (runtime + package manager + test runner) — the same version
  pinned in the Dockerfiles and GitHub Actions workflow
- Docker & Docker Compose (for Postgres + Redis)

## Quick Start

```bash
bun install                          # install all the deps
docker compose up -d                 # start Postgres & Redis
bun run --filter backend db:migrate-dev <migration-name>   # create/apply a Prisma dev migration
bun run dev                          # starts both backend & frontend
```

> Running an existing migration instead? Use
> `bun run --filter backend db:migrate-prod` (applies all pending migrations
> without creating a new one).

## Project Structure

```
├── .env                              # Local environment variables (gitignored)
├── .env.example                      # Environment variable template
├── .gitignore                        # Root gitignore
├── biome.json                        # Biome config (formatter + linter, overrides)
├── tsconfig.json                     # TypeScript project references (frontend + backend)
├── package.json                      # Root workspace (dev scripts, lint, format, test)
├── bun.lock                          # Bun lockfile (all workspaces)
├── docker-compose.yml                # Dev services (Postgres 17, Redis 7)
├── docker-compose.prod.yml           # Production stack (Caddy + backend + frontend)
│
├── caddy/
│   ├── Caddyfile                     # Reverse proxy rules (api/* → backend, rest → frontend)
│   └── Dockerfile                    # Caddy 2 Alpine based
│
├── .github/
│   └── workflows/
│       └── test.yml                  # CI: parallel backend + frontend lint + test jobs
│
└── app/
    │
    ├── backend/                      # NestJS 11 API (port 8000)
    │   ├── package.json
    │   ├── .env.example              # Backend environment variables (PORT, DATABASE_URL, ...)
    │   ├── tsconfig.json             # ES2023, nodenext, decorators, path aliases (@/)
    │   ├── tsconfig.build.json       # Build config (excludes tests, dist)
    │   ├── nest-cli.json             # SWC builder, deleteOutDir
    │   ├── prisma.config.ts          # Prisma 7 config (schema path, datasource from env)
    │   ├── .dockerignore
    │   ├── Dockerfile                # Multi-stage: builder (bun install + generate + build) → prod
    │   │
    │   ├── prisma/
    │   │   ├── schema.prisma         # PostgreSQL datasource (schema: auth), User + Session + Role enums
    │   │   └── migrations/
    │   │       ├── migration_lock.toml
    │   │       └── <timestamp>_initialize/
    │   │           └── migration.sql
    │   │
    │   ├── test/
    │   │   └── auth.e2e-spec.ts      # Auth E2E tests (bun test, opt-in; register, login, session, delete-account)
    │   │
    │   └── src/
    │       ├── main.ts                # App bootstrap: ValidationPipe, Helmet, cookie-parser, global filters, Swagger (dev), global prefix 'api'
    │       ├── app.module.ts          # Root module: ThrottlerModule (rate limiting), LoggerModule (Pino), MorganMiddleware, PrismaModule, AuthModule, HealthController
    │       │
    │       ├── common/
    │       │   ├── decorators/
    │       │   │   └── roles.decorator.ts        # @Roles() metadata decorator
    │       │   ├── guards/
    │       │   │   └── roles.guard.ts            # Role-based access control guard
    │       │   ├── prisma/
    │       │   │   ├── prisma.module.ts          # @Global module, exports PrismaService
    │       │   │   └── prisma.service.ts         # PrismaPg adapter, Pool connection, onModuleInit/onModuleDestroy lifecycle hooks
    │       │   ├── filter/
    │       │   │   ├── http-exception.filter.ts  # AllExceptionsFilter (env-aware stack traces, structured errors)
    │       │   │   └── prisma-client-exception.filter.ts # Maps Prisma errors (e.g. P2002 → 409 Conflict)
    │       │   ├── redis/
    │       │   │   ├── redis.module.ts            # @Global module, exports RedisService
    │       │   │   └── redis.service.ts           # ioredis client, lazyConnect + retry strategy (boots without Redis)
    │       │   └── middleware/
    │       │       └── morgan.middleware.ts      # Morgan HTTP logger piped to Pino, excludes Swagger routes
    │       │
    │       ├── lib/
    │       │   └── bcrypt.ts         # bcryptjs wrappers (hashPassword, comparePassword)
    │       │
    │       ├── utils/
    │       │   └── check-env.ts      # isProduction / isDevelopment helpers
    │       │
    │       ├── modules/
    │       │   ├── auth/
    │       │   │   ├── auth.module.ts              # Module definition (Passport + RolesGuard)
    │       │   │   ├── auth.controller.ts          # register, login, me, logout, delete-account
    │       │   │   ├── auth.service.ts             # register, login (DB session), logout, remove, findOne
    │       │   │   ├── passport-session.guard.ts   # Passport AuthGuard('db-session')
    │       │   │   ├── passport-session.strategy.ts # DB session strategy (cookie 'session', 7-day TTL)
    │       │   │   ├── auth.controller.spec.ts     # Controller unit tests (mocked service)
    │       │   │   ├── auth.service.spec.ts        # Service unit tests (mocked Prisma + bcrypt)
    │       │   │   └── dto/
    │       │   │       ├── auth.dto.ts             # RegisterDto, LoginDto (class-validator + Swagger)
    │       │   │       └── response-auth.dto.ts    # AuthResponseDto, LoginSuccessDto
    │       │   │
    │       │   └── health/
    │       │       ├── health.controller.ts       # GET /api/health → { status: 'ok' }
    │       │       └── health.controller.spec.ts  # Health check unit tests
    │       │
    │       └── generated/             # Auto-generated Prisma client (gitignored)
    │           └── prisma/            # PrismaClient, enums, types
    │
    └── frontend/                     # Next.js 16 App Router (port 3000)
        ├── package.json
        ├── tsconfig.json             # bundler mode, composite, path alias @/ → src/*
        ├── next.config.ts            # API rewrites, React Compiler enabled
        ├── next-env.d.ts
        ├── bunfig.toml               # bun test preload (happy-dom + Testing Library setup)
        ├── components.json           # shadcn config (base-vega style, Lucide icons, CSS variables)
        ├── postcss.config.mjs        # @tailwindcss/postcss plugin
        ├── .env.example              # Frontend-specific env vars (API_URL, NEXT_PUBLIC_API_PREFIX)
        ├── .gitignore
        ├── .dockerignore
        ├── Dockerfile                # Multi-stage: builder (bun install + build) → prod (copy .next)
        │
        ├── public/
        │   └── .gitkeep
        │
        └── src/
            ├── app/
            │   ├── layout.tsx        # Root layout: Geist Sans/Mono + Inter fonts, Providers (React Query), global classes
            │   ├── globals.css       # Tailwind v4 imports (tw-animate-css, shadcn/tailwind), CSS custom variables (oklch), dark mode
            │   ├── favicon.ico
            │   │
            │   └── (user)/
            │       └── (home)/
            │           ├── page.tsx              # Client page (useUser query → UserContainer)
            │           ├── user.dto.ts            # Zod v4 schema (name, email) + inferred UserDto type
            │           ├── _hooks/
            │           │   ├── hooks.ts            # fetchUser: Axios GET → Zod parse
            │           │   ├── hooks.client.ts     # useUser: TanStack useQuery (5min staleTime)
            │           │   └── .gitkeep
            │           ├── _components/
            │           │   ├── user-container.tsx   # Renders userName
            │           │   └── .gitkeep
            │           └── _sections/
            │               └── .gitkeep
            │
            ├── components/
            │   ├── provider.tsx        # QueryClientProvider wrapper (60s staleTime)
            │   │
            │   └── ui/                # shadcn/ui components (CVA + Base UI primitives)
            │       ├── button.tsx       # Variants: default, outline, secondary, ghost, destructive, link
            │       ├── button.spec.tsx
            │       ├── card.tsx
            │       ├── card.spec.tsx
            │       ├── input.tsx
            │       ├── input.spec.tsx
            │       ├── skeleton.tsx
            │       ├── skeleton.spec.tsx
            │       ├── spinner.tsx
            │       └── spinner.spec.tsx
            │
            ├── lib/
            │   ├── axios.ts            # Axios instance: baseURL from NEXT_PUBLIC_API_PREFIX, withCredentials
            │   └── utils.ts            # cn() utility (clsx + tailwind-merge)
            │
            └── test/
                ├── happydom.ts         # bun test preload: registers happy-dom globals
                ├── testing-library.ts  # bun test preload: jest-dom matchers + cleanup
                └── matchers.d.ts       # TS types for jest-dom matchers under bun:test
```

## Feature-first Pattern (Frontend)

Each route group in `app/frontend/src/app/` follows a consistent pattern:

```
(user)/(home)/
├── page.tsx              # Route page (client component)
├── user.dto.ts           # Zod v4 schema & inferred type
├── _components/          # Feature-specific client components
│   └── user-container.tsx
├── _hooks/               # Data fetching & TanStack Query hooks
│   ├── hooks.ts          # Server-side fetch function (Axios + Zod validation)
│   └── hooks.client.ts   # Client-side useQuery hook
└── _sections/            # Page sections (reserved for future use)
```

Pattern conventions:

- `_components/` / `_hooks/` / `_sections/` — private folders (excluded from
  routing)
- `user.dto.ts` — Zod schema + derived TypeScript type
- `hooks.ts` — pure fetch function, HTTP call + Zod parse
- `hooks.client.ts` — TanStack React Query wrapper, handles stale time and query
  keys

## NestJS Module Pattern (Backend)

Each module in `app/backend/src/modules/` follows standard NestJS structure:

```
auth/
├── auth.module.ts              # Module definition
├── auth.controller.ts          # Route handlers (decorator-based)
├── auth.service.ts             # Business logic (Prisma + bcrypt + DB sessions)
├── passport-session.guard.ts   # AuthGuard('db-session') for protected routes
├── passport-session.strategy.ts # Passport session strategy backed by the Session table
├── dto/
│   ├── auth.dto.ts             # RegisterDto, LoginDto (class-validator + @nestjs/swagger)
│   └── response-auth.dto.ts    # AuthResponseDto, LoginSuccessDto
├── auth.controller.spec.ts     # Controller unit tests (mocked service)
├── auth.service.spec.ts        # Service unit tests (mocked Prisma + bcrypt)
└── *.e2e-spec.ts               # E2E tests (under test/)
```

## API Documentation

In development mode, Swagger UI is available at `/api/docs`. Endpoints:

| Method | Endpoint                            | Description                            |
| ------ | ----------------------------------- | -------------------------------------- |
| GET    | `/api/health`                       | Health check                           |
| POST   | `/api/auth/register/email-password` | Register user                          |
| POST   | `/api/auth/login/email-password`    | Login (sets session cookie)            |
| POST   | `/api/auth/logout`                  | Logout (revokes session)               |
| GET    | `/api/auth/me`                      | Current user (session required)        |
| DELETE | `/api/auth/delete-account`          | Delete current user (session required) |

## Environment Variables

### Root `.env`

Defined once at project root. See `.env.example`:

```ini
# Database
DB_USERNAME=postgres
DB_PASSWORD=your_db_password
DB_NAME=your_db_database

# Redis
REDIS_PASSWORD=your_redis_password

# Domain (production)
DOMAIN=your-domain.com
```

### Backend `.env`

Located at `app/backend/.env.example`:

```ini
# Backend environment
NODE_ENV=development
CHOKIDAR_USEPOLLING=true            # Hot reload in Docker
CHOKIDAR_INTERVAL=1000

# Server
PORT=8000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mydatabase

# Cache
REDIS_URL=redis://:my_secure_password@localhost:6379/0

# Frontend connection
FRONTEND_URL=http://backend:3000
```

### Frontend `.env` (local override)

Located at `app/frontend/.env.example`:

```ini
PORT=3000
NODE_ENV=development
API_URL=http://backend:8000/api
NEXT_PUBLIC_API_PREFIX=/api
```

## Commands

### Global (root)

| Command                    | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `bun run dev`              | Run backend + frontend in parallel             |
| `bun run dev:backend`      | Backend only (port 8000)                       |
| `bun run dev:frontend`     | Frontend only (port 3000)                      |
| `bun run lint`             | Biome lint (both projects)                     |
| `bun run lint:fix`         | Biome lint auto-fix                            |
| `bun run lint:backend`     | Biome lint (backend only)                      |
| `bun run lint:frontend`    | Biome lint (frontend only)                     |
| `bun run test`             | Run all tests (backend → frontend)             |
| `bun run test:backend`     | Backend unit tests (bun test)                  |
| `bun run test:frontend`    | Frontend unit tests (bun test)                 |
| `bun run format`           | Biome check --write (all files)                |
| `bun run format:check`     | Biome check                                    |
| `bun run format:backend`   | Biome check --write (backend only)             |
| `bun run format:frontend`  | Biome check --write (frontend only)            |
| `bun run check`            | Biome check (lint + format)                    |
| `bun run check:fix`        | Biome check --write                            |

### Docker

| Command                          | Description                                    |
| -------------------------------- | ---------------------------------------------- |
| `docker compose up -d`           | Start Postgres + Redis (dev)                   |
| `bun run build-prod`             | Build production Docker images                 |
| `bun run build:no-cache-prod`    | Build from scratch (no layer cache)            |
| `bun run docker:up-prod`         | Deploy full stack (Caddy + backend + frontend) |
| `bun run docker:down`            | Stop production stack                          |

### Backend (run from `app/backend`)

| Command                   | Description                        |
| ------------------------- | ---------------------------------- |
| `bun run start`           | Start server (Nest CLI)            |
| `bun run start:dev`       | Watch mode (`nest start --watch`)  |
| `bun run start:debug`     | Debug mode (`nest start --debug --watch`) |
| `bun run build`           | Compile TypeScript (SWC)           |
| `bun run start:prod`      | Run compiled code (Bun)            |
| `bun test`                | Unit tests (bun test)              |
| `bun run test:watch`      | Watch mode                         |
| `bun run test:cov`        | With coverage                      |
| `bun run test:e2e`        | E2E tests (needs Postgres + Redis) |
| `bun run db:generate`     | Generate Prisma client             |
| `bun run db:migrate-dev`  | Create a dev migration             |
| `bun run db:migrate-prod` | Deploy prod migrations             |
| `bun run db:studio`       | Open Prisma Studio                 |
| `bun run db:push`         | Push schema directly to DB         |

### Frontend (run from `app/frontend`)

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `bun run dev`           | Next.js dev server (Turbopack) |
| `bun run build`         | Production build               |
| `bun start`             | Start standalone prod server   |
| `bun test`              | Component tests (happy-dom)    |
| `bun run test:watch`    | Watch mode                     |
| `bun run test:coverage` | With coverage                  |

## CI/CD

GitHub Actions (`.github/workflows/test.yml`) runs on every push and pull
request with two parallel jobs. Both use `oven-sh/setup-bun@v2` pinned to
Bun `1.4.0` — the same version used by the production Dockerfiles.

- **Backend** — installs dependencies (`bun install --frozen-lockfile` at the
  repo root), then runs `db:generate`, `lint`, and `bun test`
- **Frontend** — installs dependencies (`bun install --frozen-lockfile`), then
  runs `lint` and `bun test`

## Prisma Schema

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  schemas  = ["public", "auth"]
}

enum Role {
  user
  admin
  @@schema("auth")
}

model User {
  id         String    @id @default(uuid())
  first_name String
  last_name  String
  email      String    @unique
  password   String
  role       Role      @default(user)
  is_active  Boolean   @default(true)
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  sessions   Session[]

  @@map("users")
  @@schema("auth")
}

model Session {
  id         String   @id @default(uuid())
  user_id    String
  expires_at DateTime
  created_at DateTime @default(now())
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([expires_at])
  @@map("sessions")
  @@schema("auth")
}
```

Key details:

- Uses Prisma PostgreSQL adapter (`@prisma/adapter-pg`) with `pg` Pool for
  connection pooling
- `User` and `Session` tables live under the `auth` schema (`@@schema("auth")`)
- `Session` model backs cookie-based auth (opaque token, 7-day TTL, cascade
  delete on user removal)
- Client output goes to `src/generated/prisma/` (gitignored, auto-generated)
- Prisma config via `prisma.config.ts` (Prisma v7 config file format)

## Production Deployment

The production stack (`docker-compose.prod.yml`) includes five services:

| Service      | Role                               | Ports           |
| ------------ | ---------------------------------- | --------------- |
| **Caddy**    | Reverse proxy + automatic HTTPS    | 80, 443         |
| **Backend**  | NestJS API (compiled, no dev deps) | 8000 (internal) |
| **Frontend** | Next.js (built .next, no dev deps) | 3000 (internal) |
| **Database** | PostgreSQL 17                      | 5432 (internal) |
| **Cache**    | Redis 8                            | 6379 (internal) |

Caddy routes `/api/*` to the backend and everything else to the frontend. Each
service runs with JSON file logging (10MB max, 3 files retained). The backend
exposes a health check endpoint for container orchestration. The database and
cache services are bundled for convenience — the compose file recommends
managing them externally (e.g. AWS RDS / ElastiCache) in real production.

## Optional Configurations

Several parts of the codebase ship with commented-out alternatives or optional
behaviors. Each choice is documented inline in code; this section summarizes
what you can toggle and how.

### API hosting: reverse proxy vs. separate domains

`app/backend/src/main.ts` contains a commented-out `app.enableCors(...)` block.

- **Default (active):** reverse proxy — Next.js rewrites in production and Caddy
  route `/api/*` to the backend on the same domain. No CORS needed.
- **Alternative (commented):** host backend and frontend on separate domains.
  Uncomment `app.enableCors()` and set `FRONTEND_URL` in the backend env. The
  block also sets `origin` to `FRONTEND_URL` in production and `*` in
  development.

### Database & cache in production

`docker-compose.prod.yml` bundles `database` (PostgreSQL) and `cache` (Redis)
services with an inline note explaining the trade-off:

- **Bundled (default):** DB and cache run as containers in the same stack.
  Change passwords/usernames/DB name in the root `.env`.
- **Recommended in note:** remove the `database`/`cache` services and their
  volumes, and point `DATABASE_URL` / `REDIS_URL` at a managed service (AWS RDS,
  ElastiCache) or a separate server.

> **Note:** if you keep the bundled services, add `depends_on` to the `backend`
> service (pointing at `database` and `cache`) so they start before the backend.
> The inline comment mentions this, but the compose file does not currently
> include it.

### User banning via `is_active`

`app/backend/prisma/schema.prisma` — `User.is_active` carries an inline note:

- **Active (default):** `is_active` gates login, session validation, and account
  deletion. Set it to `false` to block a user without deleting them.
- **Alternative:** if you don't need soft-banning, delete the column and the
  checks in `auth.service.ts` / `passport-session.strategy.ts`.

### Prisma `public` schema

`schema.prisma` datasource declares `schemas = ["public", "auth"]`, but every
model and enum targets `auth` via `@@schema("auth")`:

- **Default:** keep `public` if you plan to add models to the default schema.
- **Alternative:** remove `"public"` from the datasource if all models stay in
  `auth`.

### Redis availability

`app/backend/src/common/redis/redis.service.ts` uses `lazyConnect` with a
background connection attempt:

- **Redis up:** app connects and Redis is available for use.
- **Redis down:** the app still boots and serves requests — connection is
  retried with backoff, and failures only log a warning. No hard dependency.

## Tooling

### Biome

Single config (`biome.json`) for formatter and linter with overrides:

- **Global** — `preset: recommended`, `noUnusedVariables: error`,
  `noExplicitAny: error`, `noConsole: off`
- **Frontend** (`app/frontend/**/*.ts{x}`) — `noExplicitAny: off`
- **Tests** (`**/*.spec.ts`, `**/*.test.ts{x}`) — `noExplicitAny: off`,
  `noUnusedVariables: off`, `noUnusedImports: off`, `noImgElement: off`
- **Formatter** — single quotes, semicolons, trailing commas `all`,
  100 width, 2-space, `tailwindDirectives: true` for CSS
- **Parser** — `unsafeParameterDecoratorsEnabled: true` for NestJS
