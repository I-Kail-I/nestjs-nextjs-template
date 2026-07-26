FROM node:24.15.0-slim@sha256:4e6b70dd6cbfc88c8157ba19aa3d9f9cce6ba4703576d55459e45efcbc9c5f5d AS base

USER root
WORKDIR /app

# BUILD STAGE
FROM base AS builder
COPY package*.json ./
RUN npm install
COPY . .
ENV next_telemetry_disabled=1
ENV NODE_ENV=production
RUN npm run build

# PRODUCTION
FROM base AS prod
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "start"]