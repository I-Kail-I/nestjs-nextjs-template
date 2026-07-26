FROM node:24.15.0-slim@sha256:4e6b70dd6cbfc88c8157ba19aa3d9f9cce6ba4703576d55459e45efcbc9c5f5d AS base

USER root
WORKDIR /app

# ===== BUILD STAGE =====
FROM base AS builder

# Copy manifest files first for cache optimization
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY app/frontend/package.json ./app/frontend/

# Install ALL dependencies
RUN npm ci

# Copy source code
COPY shared ./shared
COPY app/frontend ./app/frontend

# Build Next.js app (creates .next/standalone)
RUN npm run build --workspace=frontend


# ===== PRODUCTION STAGE =====
FROM base AS prod

# Copy static assets and standalone bundle from builder stage
COPY --from=builder /app/app/frontend/public ./app/frontend/public
COPY --from=builder /app/app/frontend/.next/static ./app/frontend/.next/static
COPY --from=builder /app/app/frontend/.next/standalone ./

EXPOSE 3000

CMD ["node", "app/frontend/server.js"]