# Full-Stack Monorepo Template

A production-ready full-stack monorepo with **NestJS 11** (backend) and **Next.js 16** (frontend), containerized with Docker.

## Stack

| Layer    | Tech                                                                       |
| -------- | -------------------------------------------------------------------------- |
| Backend  | NestJS 11, TypeScript, Prisma 7 + PostgreSQL, SWC, bcryptjs, Helmet        |
| Frontend | Next.js 16, React 19, Tailwind v4, shadcn/ui (base-vega), Base UI         |
| Data     | TanStack React Query, Zustand, Zod v4, Axios                              |
| Logging  | Pino (nestjs-pino), Morgan HTTP middleware                                 |
| Infra    | Docker, Docker Compose, Caddy reverse proxy, GitHub Actions               |

## Prerequisites

- Node.js `24.15.0` (set via `.nvmrc`)
- Docker & Docker Compose (for Postgres + Redis)

## Quick Start

```bash
npm install                          # install root deps
npm --prefix app/backend install     # install backend deps
npm --prefix app/frontend install    # install frontend deps
docker compose up -d                 # start Postgres & Redis
npm --prefix app/backend run db:migrate-dev  # run Prisma migrations
npm run dev                          # starts both backend & frontend
```

## Project Structure

```
├── .env                              # Local environment variables (gitignored)
├── .env.example                      # Environment variable template
├── .gitignore                        # Root gitignore
├── .nvmrc                            # Node.js 24.15.0
├── .prettierrc                       # Prettier config (Tailwind plugin, prose wrap)
├── eslint.config.mjs                 # @antfu/eslint-config (global + per-tier overrides)
├── tsconfig.json                     # TypeScript project references (frontend + backend)
├── package.json                      # Root workspace (concurrently, lint, format, test)
├── package-lock.json
├── docker-compose.yml                # Dev services (Postgres 17, Redis 7)
├── docker-compose.prod.yml           # Production stack (Caddy + backend + frontend)
│
├── caddy/
│   ├── Caddyfile                     # Reverse proxy rules (api/* → backend, rest → frontend)
│   └── Dockerfile                    # Caddy 2 Alpine based
│
├── .github/
│   └── workflows/
│       └── test.yml                  # CI: install → cache → parallel lint + test jobs
│
└── app/
    │
    ├── backend/                      # NestJS 11 API (port 8000)
    │   ├── package.json
    │   ├── package-lock.json
    │   ├── tsconfig.json             # ESNext, decorators, path aliases (@/)
    │   ├── tsconfig.build.json       # Build config (excludes tests, dist)
    │   ├── nest-cli.json             # SWC builder, deleteOutDir
    │   ├── prisma.config.ts          # Prisma 7 config (schema path, datasource from env)
    │   ├── .dockerignore
    │   ├── Dockerfile                # Multi-stage: builder (npm ci + generate + build) → prod
    │   │
    │   ├── prisma/
    │   │   ├── schema.prisma         # PostgreSQL datasource (schema: auth), User + Role enums
    │   │   └── migrations/
    │   │       ├── migration_lock.toml
    │   │       └── <timestamp>_initialize/
    │   │           └── migration.sql
    │   │
    │   ├── test/
    │   │   └── jest-e2e.json         # E2E test runner config
    │   │
    │   └── src/
    │       ├── main.ts                # App bootstrap: ValidationPipe, CORS, Helmet, cookie-parser, Swagger (dev), global prefix 'api'
    │       ├── app.module.ts          # Root module: ThrottlerModule (rate limiting), LoggerModule (Pino), MorganMiddleware, PrismaModule, AuthModule, HealthController
    │       │
    │       ├── common/
    │       │   ├── prisma/
    │       │   │   ├── prisma.module.ts         # @Global module, exports PrismaService
    │       │   │   └── prisma.service.ts        # PrismaPg adapter, Pool connection, onModuleInit/onModuleDestroy lifecycle hooks
    │       │   ├── filter/
    │       │   │   └── http-exception.filter.ts # Global exception filter (env-aware stack traces, structured errors)
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
    │       │   │   ├── auth.module.ts         # Module definition
    │       │   │   ├── auth.controller.ts     # POST register/login, DELETE delete
    │       │   │   ├── auth.service.ts        # register (hash + create), login (compare), findOne, remove
    │       │   │   ├── auth.controller.spec.ts # Controller unit tests (mocked service)
    │       │   │   ├── auth.service.spec.ts    # Service unit tests (mocked Prisma + bcrypt)
    │       │   │   └── dto/
    │       │   │       └── create-auth.dto.ts # CreateAuthDto (first_name, last_name, email, password), LoginDto (email, password)
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
        ├── package-lock.json
        ├── tsconfig.json             # bundler mode, composite, path alias @/ → src/*
        ├── next.config.ts            # API rewrites, React Compiler enabled
        ├── next-env.d.ts
        ├── jest.config.ts            # jsdom, ts-jest, CSS mocks, @testing-library setup
        ├── components.json           # shadcn config (base-vega style, Lucide icons, CSS variables)
        ├── postcss.config.mjs        # @tailwindcss/postcss plugin
        ├── .env.example              # Frontend-specific env vars (API_URL, NEXT_PUBLIC_API_PREFIX)
        ├── .gitignore
        ├── .dockerignore
        ├── Dockerfile                # Multi-stage: builder (npm install + build) → prod (omit=dev, copy .next)
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
                ├── setup.ts            # Jest setup: @testing-library/jest-dom
                └── __mocks__/
                    └── styleMock.js     # CSS module mock for Jest
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

- `_components/` / `_hooks/` / `_sections/` — private folders (excluded from routing)
- `user.dto.ts` — Zod schema + derived TypeScript type
- `hooks.ts` — pure fetch function, HTTP call + Zod parse
- `hooks.client.ts` — TanStack React Query wrapper, handles stale time and query keys

## NestJS Module Pattern (Backend)

Each module in `app/backend/src/modules/` follows standard NestJS structure:

```
auth/
├── auth.module.ts         # Module definition
├── auth.controller.ts     # Route handlers (decorator-based)
├── auth.service.ts        # Business logic (Prisma + bcrypt)
├── dto/
│   └── create-auth.dto.ts # class-validator + @nestjs/swagger decorators
├── auth.controller.spec.ts # Controller unit tests (mocked service)
├── auth.service.spec.ts    # Service unit tests (mocked Prisma + bcrypt)
└── *.e2e-spec.ts           # E2E tests (optional, under test/)
```

## API Documentation

In development mode, Swagger UI is available at `/api/docs`. Endpoints:

| Method | Endpoint                  | Description          |
| ------ | ------------------------- | -------------------- |
| GET    | `/api/health`             | Health check         |
| POST   | `/api/auth/register/email-password` | Register user |
| POST   | `/api/auth/login/email-password`    | Login (validate credentials) |
| DELETE | `/api/auth/delete/:email` | Delete user          |

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

# Backend
NODE_ENV=development            # development | production
CHOKIDAR_USEPOLLING=true        # Hot reload in Docker
CHOKIDAR_INTERVAL=1000
BACKEND_PORT=8000
DATABASE_URL=postgresql://username:password@localhost:5432/mydatabase
REDIS_URL=redis://:my_secure_password@localhost:6379/0
JWT_SECRET=your-secret-key-change-this
FRONTEND_URL=http://backend:3000

# Frontend
FRONTEND_PORT=3000
API_URL=http://backend:8000/api
NEXT_PUBLIC_API_PREFIX=/api
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

| Command                   | Description                            |
| ------------------------- | -------------------------------------- |
| `npm run dev`             | Run backend + frontend concurrently    |
| `npm run dev:backend`     | Backend only (port 8000)               |
| `npm run dev:frontend`    | Frontend only (port 3000)              |
| `npm run lint`            | ESLint (both projects)                 |
| `npm run lint:fix`        | ESLint auto-fix                        |
| `npm run lint:backend`    | ESLint (backend only)                  |
| `npm run lint:frontend`   | ESLint (frontend only)                 |
| `npm run test`            | Run all tests (backend → frontend)     |
| `npm run test:backend`    | Backend unit tests                     |
| `npm run test:frontend`   | Frontend unit tests                    |
| `npm run format`          | Prettier (all files)                   |
| `npm run format:check`    | Prettier check only                    |
| `npm run format:backend`  | Prettier (backend only)                |
| `npm run format:frontend` | Prettier (frontend only)               |

### Docker

| Command                        | Description                           |
| ------------------------------ | ------------------------------------- |
| `docker compose up -d`        | Start Postgres + Redis (dev)          |
| `npm run build-prod`          | Build production Docker images        |
| `npm run build:no-cache-prod` | Build from scratch (no layer cache)   |
| `npm run docker:up-prod`      | Deploy full stack (Caddy + backend + frontend) |
| `npm run docker:down`         | Stop production stack                 |

### Backend (run from `app/backend`)

| Command               | Description                      |
| --------------------- | -------------------------------- |
| `npm start`           | Start production server          |
| `npm run start:dev`   | Watch mode (SWC)                 |
| `npm run start:debug` | Debug mode                       |
| `npm run build`       | Compile TypeScript               |
| `npm run start:prod`  | Run compiled code                |
| `npm test`            | Unit tests (Jest)                |
| `npm run test:watch`  | Watch mode                       |
| `npm run test:cov`    | With coverage                    |
| `npm run test:e2e`    | E2E tests                        |
| `npm run db:generate` | Generate Prisma client           |
| `npm run db:migrate-dev` | Create a dev migration         |
| `npm run db:migrate-prod`| Deploy prod migrations         |
| `npm run db:studio`   | Open Prisma Studio               |
| `npm run db:push`     | Push schema directly to DB       |

### Frontend (run from `app/frontend`)

| Command              | Description                     |
| -------------------- | ------------------------------- |
| `npm run dev`        | Next.js dev server (Turbopack)  |
| `npm run build`      | Production build                |
| `npm start`          | Start production server         |
| `npm test`           | Jest tests (jsdom)              |
| `npm run test:watch` | Watch mode                      |
| `npm run test:coverage` | With coverage                |

## CI/CD

GitHub Actions (`.github/workflows/test.yml`) runs on every push and pull request:

1. **Root** — installs all dependencies (`npm ci`), caches `node_modules` across jobs
2. **Backend** — restores cache, `db:generate`, `lint`, `test`
3. **Frontend** — restores cache, `lint`, `test`

Backend and frontend jobs run in parallel for speed.

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
  id         String   @id @default(uuid())
  first_name String
  last_name  String
  email      String   @unique
  password   String
  role       Role     @default(user)
  is_active  Boolean  @default(true)
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  @@map("users")
  @@schema("auth")
}
```

Key details:

- Uses Prisma PostgreSQL adapter (`@prisma/adapter-pg`) with `pg` Pool for connection pooling
- User table lives under `auth` schema (`@@schema("auth")`)
- Client output goes to `src/generated/prisma/` (gitignored, auto-generated)
- Prisma config via `prisma.config.ts` (Prisma v7 config file format)

## Production Deployment

The production stack (`docker-compose.prod.yml`) includes three services:

| Service  | Role                            | Ports         |
| -------- | ------------------------------- | ------------- |
| **Caddy**   | Reverse proxy + automatic HTTPS | 80, 443       |
| **Backend** | NestJS API (compiled, no dev deps) | 8000 (internal) |
| **Frontend**| Next.js (built .next, no dev deps) | 3000 (internal) |

Caddy routes `/api/*` to the backend and everything else to the frontend. Each service runs with JSON file logging (10MB max, 3 files retained). The backend exposes a health check endpoint for container orchestration.

## Tooling

### ESLint

Single config (`eslint.config.mjs`) using `@antfu/eslint-config` with tier-specific overrides:

- **Global** — relaxed base rules, `ts/no-explicit-any: error`, `unused-imports/no-unused-vars: error`
- **Backend** (`app/backend/**/*.ts`) — strict type safety: `no-unsafe-assignment`, `no-unsafe-call`, `strict-boolean-expressions`, etc.
- **Frontend** (`app/frontend/**/*.{ts,tsx}`) — Next.js + React rules, looser type safety
- **Tests** (`**/*.spec.ts`, `**/*.test.ts{x}`) — loosest type safety for mocks/assertions

### Prettier

Configured via `.prettierrc`:

- Single quotes, semicolons, trailing commas
- 100 character print width, 2-space tabs
- Tailwind CSS plugin for class sorting
- YAML overrides (no single quotes)
- Markdown overrides (80 char width, prose wrap)