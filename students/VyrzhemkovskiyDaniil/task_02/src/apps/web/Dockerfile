# Dockerfile для клиента (frontend)

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Установить pnpm
RUN npm install -g pnpm@latest

# Копировать package.json из корня и workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY src/apps/web/package.json ./src/apps/web/

# Установить зависимости
RUN pnpm install

# Копировать исходники клиента
COPY src/apps/web ./src/apps/web

# Собрать production build
WORKDIR /app/src/apps/web
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

# Stage 2: Production (nginx)
FROM nginx:alpine

# Копировать собранные файлы
COPY --from=builder /app/src/apps/web/dist /usr/share/nginx/html

# Копировать nginx конфигурацию (создадим позже)
COPY src/apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Открыть порт
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Запустить nginx
CMD ["nginx", "-g", "daemon off;"]
