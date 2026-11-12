# CVE-2026-111497: pin patched Node (24.22.1+) and Bun (1.4.4+)
FROM node:24.22.2-alpine AS build

# Stage 1 — Build the application
RUN apk add --no-cache git ca-certificates && update-ca-certificates
RUN npm install -g bun@1.4.4
WORKDIR /app
ENV NODE_OPTIONS=--max-old-space-size=8192
ARG AUTH_LAYER_URI
ARG LOGGER_LAYER_URI

COPY package.json bun.lock ./
RUN bun install --ci

COPY . .
RUN bun x nuxi prepare
RUN bun x nuxi build

# Stage 2 — Run the application
FROM node:24.22.2-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_PORT=8033
ENV NITRO_HOST=0.0.0.0

COPY --from=build /app/.output ./

EXPOSE 8033

CMD ["node", "server/index.mjs"]
