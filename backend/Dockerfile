FROM node:24.15.0-slim@sha256:4e6b70dd6cbfc88c8157ba19aa3d9f9cce6ba4703576d55459e45efcbc9c5f5d AS base

USER root
WORKDIR /app

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run db:generate
RUN npm run build

FROM base AS prod
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 8000
CMD ["npm", "run", "start:prod"]