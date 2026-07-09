# Full-Stack Monorepo Template

A production-ready full-stack starter with **NestJS** (backend) and **Next.js** (frontend), containerized with Docker.

## Quick Start

```bash
npm install             # install root deps
npm --prefix backend install    # install backend deps
npm --prefix frontend install   # install frontend deps
npm run dev             # starts both backend & frontend
```

### Prerequisites

- Node.js `24.15.0` (see `.nvmrc`)
- Docker & Docker Compose (for Postgres + Redis)

### First time

```bash
docker compose up -d                     # start Postgres & Redis
npm --prefix backend run prisma:migrate  # run migrations
npm run dev                              # start dev servers
```

## Structure

```
├── backend/          # NestJS 11 API
│   ├── prisma/       # Prisma schema & migrations
│   └── src/
│       ├── auth/     # Auth module (register/login)
│       └── prisma/   # Prisma service
├── frontend/         # Next.js 16 app
│   └── src/
│       ├── app/
│       │   ├── example/         # Example feature
│       │   │   ├── _components/ # Feature-specific components
│       │   │   ├── hooks/       # Data fetching & query hooks
│       │   │   └── user.dto.ts  # Zod validation schema
│       │   └── ...
│       ├── components/ui/       # shadcn-styled primitives
│       └── lib/                 # Shared utils (Axios, cn)
├── docker-compose.yml          # Dev services (Postgres, Redis)
├── docker-compose.prod.yml     # Production deploy
└── .github/workflows/test.yml  # CI pipeline
```

## Project Structure (Feature-First)

Each feature in `frontend/src/app/` follows a consistent pattern:

```
example/
├── page.tsx            # Route page (server component)
├── user.dto.ts         # Zod schema & type
├── _components/        # Feature-specific client components
│   └── user-container.tsx
└── hooks/              # Data fetching & React Query hooks
    ├── hooks.ts          # Server-side fetch function
    └── hooks.client.ts   # Client-side query hook
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both servers concurrently |
| `npm run dev:backend` | Backend only (port 8000) |
| `npm run dev:frontend` | Frontend only (port 3000) |
| `npm run lint` | Lint both projects |
| `npm run test` | Test both projects |
| `npm run format` | Format all files with Prettier |
| `docker compose up -d` | Start Postgres & Redis |
| `npm run docker:up-prod` | Deploy full stack with Docker |

## Stack

| Layer | Tech |
|-------|------|
| Backend | NestJS 11, TypeScript, Prisma (PostgreSQL), bcrypt, Helmet |
| Frontend | Next.js 16, React 19, Tailwind v4, shadcn/ui |
| Data | TanStack React Query, Zustand, Zod v4, Axios |
| Infra | Docker, Docker Compose, GitHub Actions |