FROM node:24-slim AS base

USER root
WORKDIR /app

# BUILD STAGE
FROM base AS builder
COPY package*.json ./
RUN npm install
COPY . .
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