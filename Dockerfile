# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app

# better-sqlite3 falls back to compiling from source if no prebuilt binary
# matches this platform/Node ABI.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev

COPY server.cjs schema.sql ./
COPY --from=build /app/dist ./public

ENV DB_PATH=/app/data/kinoderrn.sqlite
EXPOSE 3000
CMD ["node", "server.cjs"]
