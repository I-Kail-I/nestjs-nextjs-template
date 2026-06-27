FROM node:24-slim AS base

USER root
WORKDIR /app

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM base AS prod
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 8000
CMD ["npm", "run", "start:prod"]