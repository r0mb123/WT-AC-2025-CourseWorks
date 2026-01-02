# Спортплощадки «Играем?»

> Платформа для бронирования спортивных площадок с системой управления слотами и отзывами

## О проекте

Веб-приложение для онлайн-бронирования спортивных площадок, разработанное для упрощения процесса аренды спортивных объектов. Платформа объединяет владельцев площадок и пользователей, предоставляя удобный интерфейс для поиска, бронирования и оценки спортивных объектов.

### Основные возможности

- **Каталог площадок** - просмотр спортивных объектов с фильтрацией по типу, цене и локации
- **Бронирование** - онлайн-резервирование временных слотов с выбором даты и времени
- **Управление слотами** - массовое создание и редактирование доступных временных интервалов
- **Отзывы** - система оценок и комментариев для площадок
- **Гибкая отмена** - правила возврата средств в зависимости от времени отмены
- **Админ-панель** - полное управление площадками, слотами и бронированиями

## Быстрый старт

### Предварительные требования

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Docker & Docker Compose (опционально)

### Установка и запуск

#### Вариант 1: Локальная разработка

```bash
# Клонировать репозиторий
cd task_05

# Установить зависимости
pnpm install

# Настроить переменные окружения
cp .env.example .env

# Запустить PostgreSQL через Docker
docker-compose up -d postgres

# Применить миграции базы данных
cd src/apps/server
pnpm prisma generate
pnpm prisma migrate dev --name init

# Заполнить БД тестовыми данными
pnpm prisma db seed

# Вернуться в корень и запустить dev серверы
cd ../..
pnpm dev
```

Приложение будет доступно:
- **Backend API**: http://localhost:3000/api
- **Frontend**: http://localhost:5173

#### Вариант 2: Через Docker Compose

```bash
# Запустить все сервисы
docker-compose up -d

# Применить миграции
docker-compose exec server pnpm prisma migrate dev

# Заполнить БД
docker-compose exec server pnpm prisma db seed
```

### Тестовые учётные записи

После выполнения seed будут доступны следующие пользователи:

- **Admin**: `admin@sports-venues.com` / `password123`
- **User 1**: `ivan.ivanov@example.com` / `password123`
- **User 2**: `petr.petrov@example.com` / `password123`

### Тестирование API

```bash
# Использовать REST Client extension в VS Code
code --install-extension humao.rest-client

# Открыть тестовые файлы
# - test-api.http (Auth, Venues, Slots)
# - bookings-tests.http (Bookings)
# - reviews-tests.http (Reviews)
```

Или использовать Prisma Studio для просмотра БД:

```bash
cd src/apps/server
pnpm prisma studio
# Откроется http://localhost:5555
```

## Архитектура

Проект построен на монорепозиторной архитектуре с разделением на backend и frontend приложения.

### Структура проекта

```
task_05/
├── src/
│   ├── apps/
│   │   ├── server/          # Backend (Express + TypeScript)
│   │   │   ├── src/
│   │   │   │   ├── routes/      # API маршруты
│   │   │   │   ├── controllers/ # Контроллеры
│   │   │   │   ├── services/    # Бизнес-логика
│   │   │   │   ├── middleware/  # Middleware (auth, validation)
│   │   │   │   ├── types/       # TypeScript типы
│   │   │   │   └── utils/       # Утилиты (JWT, logger)
│   │   │   └── prisma/
│   │   │       ├── schema.prisma    # Схема БД
│   │   │       ├── migrations/      # Миграции
│   │   │       └── seed.ts          # Seed данные
│   │   └── web/             # Frontend (React + TypeScript)
│   │       └── src/
│   │           ├── pages/       # Страницы
│   │           ├── components/  # React компоненты
│   │           ├── hooks/       # Custom hooks
│   │           └── services/    # API клиенты
│   ├── README.md        # Основная документация
│   └── docs/
│       └── ARCHITECTURE.md  # Детальная архитектура
├── docker-compose.yaml
└── package.json
```

### Основные компоненты

#### Backend (src/apps/server)

- Express.js сервер с TypeScript
- Prisma ORM для работы с PostgreSQL
- JWT аутентификация
- Zod валидация запросов
- Middleware для авторизации и ролей

#### Frontend (src/apps/web)

- React 18 с TypeScript
- Vite для сборки
- React Router v6 для маршрутизации
- Axios для HTTP запросов
- React Hook Form + Zod для валидации форм

#### База данных

- PostgreSQL 15+
- 6 основных таблиц: User, Venue, Slot, Booking, Review, Subscription

## Технологический стек

### Backend

| Технология | Версия | Назначение |
|------------|--------|------------|
| Node.js | 20+ | Runtime окружение |
| TypeScript | 5.3+ | Типизация |
| Express.js | 4.18+ | Web framework |
| Prisma | 5.8+ | ORM |
| PostgreSQL | 15+ | База данных |
| JWT | 9.0+ | Аутентификация |
| bcrypt | 5.1+ | Хэширование паролей |
| Zod | 3.22+ | Валидация схем |
| Swagger UI | 5.0+ | API документация |
| morgan | 1.10+ | HTTP логирование |

### Frontend

| Технология | Версия | Назначение |
|------------|--------|------------|
| React | 18.2+ | UI библиотека |
| TypeScript | 5.3+ | Типизация |
| Vite | 5.0+ | Сборщик |
| React Router | 6.21+ | Маршрутизация |
| Axios | 1.6+ | HTTP клиент |
| React Hook Form | 7.49+ | Управление формами |
| date-fns | 3.6+ | Работа с датами |

### DevOps

- **Docker** - контейнеризация приложений
- **Docker Compose** - оркестрация контейнеров
- **pnpm workspaces** - управление монорепозиторием

## API Endpoints

### Аутентификация

- `POST /api/auth/register` - регистрация нового пользователя
- `POST /api/auth/login` - вход (возвращает JWT токен)
- `GET /api/auth/me` - получение профиля текущего пользователя

### Площадки (Venues)

- `GET /api/venues` - список площадок (фильтры: type, priceMin, priceMax, search)
- `GET /api/venues/:id` - детали конкретной площадки
- `POST /api/venues` - создание площадки (admin)
- `PUT /api/venues/:id` - обновление площадки (admin)
- `DELETE /api/venues/:id` - удаление площадки (admin)

### Временные слоты (Slots)

- `GET /api/slots` - список слотов (фильтры: venueId, date, status)
- `GET /api/venues/:venueId/slots` - слоты для конкретной площадки
- `POST /api/slots` - создание слота (admin)
- `POST /api/slots/bulk` - массовое создание слотов (admin)
- `PUT /api/slots/:id` - обновление слота (admin)
- `DELETE /api/slots/:id` - удаление слота (admin)

### Бронирования (Bookings)

- `GET /api/bookings` - брони текущего пользователя
- `GET /api/bookings/:id` - детали конкретной брони
- `POST /api/bookings` - создание бронирования
- `PUT /api/bookings/:id/cancel` - отмена бронирования
- `GET /api/admin/bookings` - все брони (admin)

### Отзывы (Reviews)

- `GET /api/reviews` - список всех отзывов
- `GET /api/reviews/:id` - детали отзыва
- `GET /api/reviews/stats/:venueId` - статистика отзывов для площадки
- `POST /api/reviews` - создание отзыва (требует завершённую бронь)
- `PUT /api/reviews/:id` - обновление отзыва (автор)
- `DELETE /api/reviews/:id` - удаление отзыва (автор/admin)

## Модель данных

### Основные сущности

**User** - Пользователи системы
- Роли: USER, ADMIN, OWNER
- JWT аутентификация
- Хэширование паролей через bcrypt

**Venue** - Спортивные площадки
- Типы: FOOTBALL, BASKETBALL, TENNIS, VOLLEYBALL, BADMINTON
- Автоматический расчёт среднего рейтинга из отзывов
- Мягкое удаление (флаг isActive)

**Slot** - Временные слоты для бронирования
- Статусы: AVAILABLE, BOOKED, BLOCKED
- Проверка пересечений при создании
- Защита от изменения забронированных слотов

**Booking** - Бронирования
- Статусы: PENDING, CONFIRMED, CANCELLED, COMPLETED
- Автоматический расчёт итоговой стоимости
- Правила возврата средств при отмене

**Review** - Отзывы о площадках
- Рейтинг от 1 до 5 звёзд
- Ограничение: один отзыв на пользователя на площадку
- Требуется завершённое бронирование

**Subscription** - Абонементы (готово к использованию)
- Типы: MONTHLY, YEARLY
- Активация и деактивация

### Правила отмена бронирования

- **> 24 часа до начала**: 100% возврат средств
- **12-24 часа до начала**: 50% возврат средств
- **< 12 часов до начала**: без возврата

## Безопасность

- ✅ JWT токены с истечением срока действия
- ✅ Хэширование паролей (bcrypt, 10 раундов)
- ✅ Helmet для защиты HTTP заголовков
- ✅ CORS настроен для разрешённых origin
- ✅ Валидация всех входных данных (Zod)
- ✅ Защита от SQL injection (Prisma ORM)
- ✅ Защита от XSS атак
- ✅ Ролевая модель доступа (USER, ADMIN, OWNER)

## Матрица прав доступа

| Действие | Guest | User | Admin |
|----------|-------|------|-------|
| Просмотр площадок | ✅ | ✅ | ✅ |
| Просмотр отзывов | ✅ | ✅ | ✅ |
| Регистрация/Вход | ✅ | - | - |
| Бронирование | ❌ | ✅ | ✅ |
| Отмена своей брони | ❌ | ✅ | ✅ |
| Создание отзыва | ❌ | ✅ | ✅ |
| Удаление своего отзыва | ❌ | ✅ | ✅ |
| Создание площадки | ❌ | ❌ | ✅ |
| Управление слотами | ❌ | ❌ | ✅ |
| Просмотр всех броней | ❌ | ❌ | ✅ |
| Удаление любого отзыва | ❌ | ❌ | ✅ |

## Производительность

- **Индексы БД** - на часто используемые поля (email, venueId, userId)
- **Пагинация** - для списков (по умолчанию 10 элементов на страницу)
- **Connection pooling** - оптимизация подключений к PostgreSQL
- **Валидация** - на клиенте и сервере для предотвращения некорректных запросов

## Документация

Детальная техническая документация доступна в:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - архитектура системы, структура данных, API endpoints

## Дальнейшее развитие

### Планируемые улучшения

- **Frontend UI** - полный интерфейс на React
- **API Documentation** - Swagger/OpenAPI спецификация
- **Unit/Integration тесты** - покрытие кода минимум 70%
- **E2E тесты** - Playwright для критических user flows
- **Kubernetes** - конфигурации для оркестрации
- **CI/CD** - GitHub Actions для автоматизации
- **Кэширование** - Redis для списка площадок
- **Real-time уведомления** - WebSockets для броней
- **Email уведомления** - Nodemailer для подтверждений
- **Метрики** - Prometheus для мониторинга

## Статус проекта

**Текущий статус**: Full-Stack MVP Complete (100%)

- ✅ База данных и миграции
- ✅ Аутентификация и авторизация
- ✅ CRUD для всех сущностей
- ✅ Валидация и обработка ошибок
- ✅ Логирование и безопасность
- ✅ Frontend интерфейс (React + TypeScript)
- ✅ API документация (Swagger)
