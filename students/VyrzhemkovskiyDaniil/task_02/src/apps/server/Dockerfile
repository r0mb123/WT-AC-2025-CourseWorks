# Dockerfile для сервера (backend)

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Установить pnpm
RUN npm install -g pnpm

# Копировать package.json из корня и workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY src/apps/server/package.json ./src/apps/server/

# Установить зависимости
RUN pnpm install

# Копировать исходники сервера
COPY src/apps/server ./src/apps/server

# Сгенерировать Prisma Client
WORKDIR /app/src/apps/server
RUN pnpm prisma generate

# Собрать TypeScript
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Установить pnpm
RUN npm install -g pnpm

# Копировать package.json
COPY package.json pnpm-workspace.yaml ./
COPY src/apps/server/package.json ./src/apps/server/

# Установить только production зависимости + prisma для миграций
RUN pnpm install --prod
RUN pnpm add -g prisma

# Копировать собранный код из builder
COPY --from=builder /app/src/apps/server/dist ./src/apps/server/dist
COPY --from=builder /app/src/apps/server/prisma ./src/apps/server/prisma
COPY --from=builder /app/src/apps/server/node_modules/.prisma ./src/apps/server/node_modules/.prisma
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/src/apps/server

# Открыть порт
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Запустить приложение
CMD ["node", "dist/index.js"]
