FROM bun:1.4-slim@sha256:e0ee68d16ccb9927bf02aa7dd8fd4bf3369ee6d46da04faa72b05ce8bfd135f6 AS base

USER root
WORKDIR /app

# ===== BUILD STAGE =====
FROM base AS builder

# Copy manifests for caching
COPY package.json package-lock.json ./
COPY app/backend/package.json ./app/backend/

# Install dependencies
RUN npm ci

# Copy source code
COPY app/backend ./app/backend

# Build backend app & generate database client
RUN npm run db:generate --workspace=backend
RUN npm run build --workspace=backend


# ===== PRODUCTION STAGE =====
FROM base AS prod

# Copy manifests for production install
COPY package.json package-lock.json ./
COPY app/backend/package.json ./app/backend/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=backend

# Compiled build from builder
COPY --from=builder /app/app/backend/dist ./app/backend/dist

EXPOSE 8000
CMD ["npm", "run", "start:prod", "--workspace=backend"]