FROM oven/bun:1-slim@sha256:e0ee68d16ccb9927bf02aa7dd8fd4bf3369ee6d46da04faa72b05ce8bfd135f6 AS base

USER root
WORKDIR /app

# ===== BUILD STAGE =====
FROM base AS builder

# Copy manifests for caching
COPY package.json bun.lock ./
COPY app/backend/package.json ./app/backend/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY app/backend ./app/backend

# Build backend app & generate database client
RUN bun run --filter backend db:generate
RUN bun run --filter backend build


# ===== PRODUCTION STAGE =====
FROM base AS prod

# Copy manifests for production install
COPY package.json bun.lock ./
COPY app/backend/package.json ./app/backend/

# Install production dependencies only
RUN bun install --frozen-lockfile --production --filter backend

# Compiled build from builder
COPY --from=builder /app/app/backend/dist ./app/backend/dist

EXPOSE 8000
CMD ["bun", "run", "--filter", "backend", "start:prod"]
