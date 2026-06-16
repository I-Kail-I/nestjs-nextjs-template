FROM node:24-slim as base

USER root
WORKDIR /app

FROM base as dev
COPY package*.json ./
RUN npm ci
COPY . ./
EXPOSE 8000
CMD ["npm", "run", "start:dev"]

FROM base as builder
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM base as prod
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 8000
CMD ["npm", "start:prod"]