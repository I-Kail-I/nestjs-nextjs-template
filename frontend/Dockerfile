FROM node:24-slim AS base

USER root
WORKDIR /app

# DEVELOPMENT
FROM base AS dev
COPY package*.json ./
RUN npm install
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000

CMD ["npm", "run", "dev"]

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
COPY --from=builder /app/next.config.mjs ./
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "start"]