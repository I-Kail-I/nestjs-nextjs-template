FROM oven/bun:1-slim@sha256:e0ee68d16ccb9927bf02aa7dd8fd4bf3369ee6d46da04faa72b05ce8bfd135f6 AS base


USER root
WORKDIR /app

# ===== BUILD STAGE =====
FROM base AS builder

# Copy manifest files first for cache optimization
COPY package.json bun.lock ./
COPY app/frontend/package.json ./app/frontend/

# Install ALL dependencies
RUN bun install --frozen-lockfile --filter frontend

# Copy source code
COPY app/frontend ./app/frontend

# Build Next.js app (creates .next/standalone)
RUN bun run --filter frontend build

# ===== PRODUCTION STAGE =====
FROM base AS prod

# Copy static assets and standalone bundle from builder stage
COPY --from=builder /app/app/frontend/public ./app/frontend/public
COPY --from=builder /app/app/frontend/.next/static ./app/frontend/.next/static
COPY --from=builder /app/app/frontend/.next/standalone ./

EXPOSE 3000

CMD ["bun", "app/frontend/server.js"]
