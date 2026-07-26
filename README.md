# Full-Stack Monorepo Template

A production-ready full-stack starter with **NestJS** (backend) and **Next.js**
(frontend), containerized with Docker.

## Quick Start

```bash
npm install             # install root deps
npm --prefix app/backend install    # install backend deps
npm --prefix app/frontend install   # install frontend deps
npm run dev             # starts both backend & frontend
```

### Prerequisites

- Node.js `24.15.0` (see `.nvmrc`)
- Docker & Docker Compose (for Postgres + Redis)

### First time

```bash
docker compose up -d                     # start Postgres & Redis
npm --prefix app/backend run prisma:migrate  # run migrations
npm run dev                              # start dev servers
```

## Structure

```
├── app/
│   ├── backend/                # NestJS 11 API
│   │   ├── prisma/
│   │   │   └── schema.prisma       # Prisma schema
│   │   │   └── migrations          # Prisma migrations
│   │   └── src/
│   │       ├── main.ts             # App bootstrap
│   │       ├── app.module.ts       # Root module
│   │       ├── auth/               # Auth module (register/login)
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── auth.module.ts
│   │       │   └── dto/            # Validation DTOs
│   │       ├── common/             # Shared modules (prisma, etc.)
│   │       │   └── prisma/         # Prisma client service
│   │       ├── lib/                # Utility functions (bcrypt, etc.)
│   │       ├── utils/              # General helpers
│   │       └── generated/prisma/   # Auto-generated (gitignored)
│   └── frontend/               # Next.js 16 app
│       └── src/
│           ├── app/
│           │   ├── layout.tsx      # Root layout
│           │   ├── page.tsx        # Home page
│           │   └── example/        # Example feature
│           ├── components/ui/      # shadcn-styled primitives
│           └── lib/                # Shared utils (Axios, cn)
├── docker-compose.yml          # Dev services (Postgres, Redis)
├── docker-compose.prod.yml     # Production deploy
└── .github/workflows/test.yml  # CI pipeline
```

## Project Structure

### Frontend — feature-first pattern

Each feature in `app/frontend/src/app/` follows a consistent pattern:

```
example/
├── page.tsx            # Route page (client component)
├── user.dto.ts         # Zod schema & type
├── _components/        # Feature-specific client components
│   └── user-container.tsx
└── hooks/              # Data fetching & React Query hooks
    ├── hooks.ts          # Server-side fetch function
    └── hooks.client.ts   # Client-side query hook
```

### Backend — NestJS module pattern

Each backend module follows the standard NestJS structure:

```
auth/
├── auth.controller.ts    # Route handlers
├── auth.service.ts       # Business logic
├── auth.module.ts        # Module definition
├── dto/                  # Request validation DTOs
├── entities/             # Entity classes (if needed)
├── *.spec.ts             # Unit tests
└── *.e2e-spec.ts         # E2E tests
```

## Commands

| Command                  | Description                    |
| ------------------------ | ------------------------------ |
| `npm run dev`            | Run both servers concurrently  |
| `npm run dev:backend`    | Backend only (port 8000)       |
| `npm run dev:frontend`   | Frontend only (port 3000)      |
| `npm run lint`           | Lint both projects             |
| `npm run test`           | Test both projects             |
| `npm run format`         | Format all files with Prettier |
| `docker compose up -d`   | Start Postgres & Redis         |
| `npm run docker:up-prod` | Deploy full stack with Docker  |

## Stack

| Layer    | Tech                                                       |
| -------- | ---------------------------------------------------------- |
| Backend  | NestJS 11, TypeScript, Prisma (PostgreSQL), bcrypt, Helmet |
| Frontend | Next.js 16, React 19, Tailwind v4, shadcn/ui               |
| Data     | TanStack React Query, Zustand, Zod v4, Axios               |
| Infra    | Docker, Docker Compose, GitHub Actions                     |
