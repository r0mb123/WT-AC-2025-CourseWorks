# Архитектура проекта

Детальное описание архитектуры платформы "Спортплощадки «Играем?»"

## Обзор

Проект представляет собой full-stack веб-приложение для бронирования спортивных площадок, построенное на современных технологиях с использованием монорепозиторной структуры.

### Высокоуровневая архитектура

```
┌─────────────────┐
│   Пользователь  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│         Frontend (React)             │
│  - React Router                      │
│  - Axios для HTTP запросов           │
│  - React Hook Form + Zod             │
│  - State Management (Context/Zustand)│
└────────────┬────────────────────────┘
             │ HTTP/REST API
             ▼
┌─────────────────────────────────────┐
│       Backend (Express/Node.js)     │
│  - REST API                          │
│  - JWT Authentication                │
│  - Role-based Authorization          │
│  - Validation (Zod)                  │
│  - Error Handling                    │
└────────────┬────────────────────────┘
             │ Prisma ORM
             ▼
┌─────────────────────────────────────┐
│      PostgreSQL Database             │
│  - Venues, Slots, Bookings, Reviews │
│  - Users, Subscriptions              │
└─────────────────────────────────────┘
```

## Технологический стек

### Backend

- **Runtime**: Node.js 20+
- **Язык**: TypeScript 5.3+
- **Web Framework**: Express.js 4.18+
- **ORM**: Prisma 5.8+
- **База данных**: PostgreSQL 15+
- **Аутентификация**: JWT (jsonwebtoken 9.0+) + bcrypt 5.1+
- **Валидация**: Zod 3.22+ schemas
- **Безопасность**: helmet 7.1+, cors 2.8+
- **Логирование**: morgan 1.10+, Custom logger utility
- **API Docs**: Swagger UI Express 5.0+

### Frontend

- **Framework**: React 18.2+
- **Язык**: TypeScript 5.3+
- **Bundler**: Vite 5.0+
- **Router**: React Router v6.21+
- **HTTP Client**: Axios 1.6+
- **Валидация форм**: React Hook Form 7.49+ + Zod 3.22+
- **Date Utils**: date-fns 3.6+
- **Стилизация**: CSS Modules

### DevOps

- **Контейнеризация**: Docker + Docker Compose
- **Package Manager**: pnpm (workspaces)
- **Version Control**: Git

## Архитектура приложения

### Backend структура

```
src/apps/server/
├── src/
│   ├── index.ts                    # Точка входа
│   ├── app.ts                      # Конфигурация Express
│   ├── routes/
│   │   ├── index.ts                # Агрегация всех routes
│   │   ├── auth.routes.ts
│   │   ├── venues.routes.ts
│   │   ├── slots.routes.ts
│   │   ├── bookings.routes.ts
│   │   └── reviews.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── venues.controller.ts
│   │   ├── slots.controller.ts
│   │   ├── bookings.controller.ts
│   │   └── reviews.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── venues.service.ts
│   │   ├── slots.service.ts
│   │   ├── bookings.service.ts
│   │   └── reviews.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts      # Проверка JWT
│   │   ├── roles.middleware.ts     # Проверка ролей
│   │   ├── validate.middleware.ts  # Валидация запросов
│   │   └── error.middleware.ts     # Обработка ошибок
│   ├── types/
│   │   ├── express.d.ts            # Расширение типов Express
│   │   └── index.ts
│   └── utils/
│       ├── jwt.util.ts
│       ├── password.util.ts
│       ├── logger.util.ts
│       └── prisma.util.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Frontend структура

```
src/apps/web/
├── src/
│   ├── main.tsx                    # Точка входа
│   ├── App.tsx                     # Главный компонент
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── VenueDetailsPage.tsx
│   │   ├── BookingPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── AdminPage.tsx
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Loader.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── venues/
│   │   │   ├── VenueCard.tsx
│   │   │   ├── VenueList.tsx
│   │   │   └── VenueFilters.tsx
│   │   ├── bookings/
│   │   │   ├── BookingForm.tsx
│   │   │   ├── BookingCard.tsx
│   │   │   └── SlotCalendar.tsx
│   │   └── reviews/
│   │       ├── ReviewCard.tsx
│   │       ├── ReviewList.tsx
│   │       └── ReviewForm.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useVenues.ts
│   │   └── useBookings.ts
│   ├── services/
│   │   ├── api.ts                  # Axios instance
│   │   ├── auth.service.ts
│   │   ├── venues.service.ts
│   │   ├── bookings.service.ts
│   │   └── reviews.service.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── types/
│   │   └── index.ts
│   └── utils/
│       ├── validators.ts
│       └── formatters.ts
├── Dockerfile
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Структура данных

### Entity-Relationship диаграмма

```
┌──────────────┐
│     User     │
├──────────────┤
│ id           │ PK (UUID)
│ email        │ UNIQUE
│ password     │
│ name         │
│ phone        │
│ role         │ ENUM(USER, ADMIN, OWNER)
│ createdAt    │
└──────┬───────┘
       │
       │ 1:N (author)
       │
┌──────▼───────┐       ┌──────────────┐
│   Booking    │ N:1   │     Slot     │
├──────────────┤───────┤──────────────┤
│ id           │ PK    │ id           │ PK
│ userId       │ FK    │ venueId      │ FK
│ slotId       │ FK    │ date         │
│ status       │       │ startTime    │
│ totalPrice   │       │ endTime      │
│ paymentStatus│       │ status       │ ENUM
│ createdAt    │       │ maxBookings  │
└──────┬───────┘       └──────┬───────┘
       │                      │
       │                      │ N:1
       │                      │
       │               ┌──────▼───────┐
       │               │    Venue     │
       │         ┌─────┤──────────────┤
       │         │     │ id           │ PK
       │         │     │ name         │
       │         │     │ type         │ ENUM
       │         │     │ address      │
       │         │     │ description  │
       │         │     │ pricePerHour │ DECIMAL
       │         │     │ imageUrl     │
       │         │     │ amenities    │ JSON
       │         │     │ isActive     │ BOOLEAN
       │         │     │ averageRating│ FLOAT
       │         │     │ reviewCount  │ INT
       │         │     │ ownerId      │ FK
       │         │     │ createdAt    │
       │         │     └──────────────┘
       │         │
       │ 1:N     │ 1:N
       │         │
┌──────▼─────────────────▼──────┐
│          Review                │
├───────────────────────────────┤
│ id                            │ PK
│ userId                        │ FK
│ venueId                       │ FK
│ bookingId                     │ FK (optional)
│ rating                        │ INT(1-5)
│ comment                       │
│ createdAt                     │
└───────────────────────────────┘
       ▲
       │ 1:N
       │
┌──────┴────────┐
│ Subscription  │
├───────────────┤
│ id            │ PK
│ userId        │ FK
│ type          │ ENUM(MONTHLY, YEARLY)
│ validUntil    │ DATE
│ discount      │ INT
│ isActive      │ BOOLEAN
│ createdAt     │
└───────────────┘
```

### Prisma Schema

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String
  name          String
  phone         String?
  role          Role           @default(USER)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  ownedVenues   Venue[]        @relation("VenueOwner")
  bookings      Booking[]
  reviews       Review[]
  subscriptions Subscription[]
}

model Venue {
  id            String       @id @default(uuid())
  name          String
  type          VenueType
  address       String
  description   String?
  pricePerHour  Decimal      @db.Decimal(10, 2)
  imageUrl      String?
  amenities     Json?
  isActive      Boolean      @default(true)
  averageRating Float        @default(0)
  reviewCount   Int          @default(0)
  ownerId       String
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  owner         User         @relation("VenueOwner", fields: [ownerId], references: [id])
  slots         Slot[]
  reviews       Review[]
}

model Slot {
  id          String       @id @default(uuid())
  venueId     String
  date        DateTime
  startTime   String
  endTime     String
  status      SlotStatus   @default(AVAILABLE)
  maxBookings Int          @default(1)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  venue       Venue        @relation(fields: [venueId], references: [id])
  bookings    Booking[]
}

model Booking {
  id            String        @id @default(uuid())
  userId        String
  slotId        String
  status        BookingStatus @default(PENDING)
  totalPrice    Decimal       @db.Decimal(10, 2)
  paymentStatus PaymentStatus @default(PENDING)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  user          User          @relation(fields: [userId], references: [id])
  slot          Slot          @relation(fields: [slotId], references: [id])
  review        Review?
}

model Review {
  id         String   @id @default(uuid())
  userId     String
  venueId    String
  bookingId  String?  @unique
  rating     Int
  comment    String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  user       User     @relation(fields: [userId], references: [id])
  venue      Venue    @relation(fields: [venueId], references: [id])
  booking    Booking? @relation(fields: [bookingId], references: [id])
  
  @@unique([userId, venueId])
}

model Subscription {
  id         String           @id @default(uuid())
  userId     String
  type       SubscriptionType
  validUntil DateTime
  discount   Int              @default(10)
  isActive   Boolean          @default(true)
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt
  
  user       User             @relation(fields: [userId], references: [id])
}

enum Role {
  USER
  ADMIN
  OWNER
}

enum VenueType {
  FOOTBALL
  BASKETBALL
  TENNIS
  VOLLEYBALL
  BADMINTON
}

enum SlotStatus {
  AVAILABLE
  BOOKED
  BLOCKED
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
}

enum SubscriptionType {
  MONTHLY
  YEARLY
}
```

## API Endpoints

### Authentication

**POST** `/api/auth/register` - регистрация нового пользователя

```json
Request:
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Иван Иванов",
  "phone": "+375291234567"
}

Response (201):
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "Иван Иванов", "role": "USER" },
    "token": "jwt-token"
  }
}
```

**POST** `/api/auth/login` - вход в систему

```json
Request:
{
  "email": "user@example.com",
  "password": "password123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "Иван Иванов", "role": "USER" },
    "token": "jwt-token"
  }
}
```

**GET** `/api/auth/me` - получение профиля текущего пользователя (Private)

Headers: `Authorization: Bearer {token}`

```json
Response (200):
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "role": "USER",
    "phone": "+375291234567",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Venues (Площадки)

**GET** `/api/venues` - список площадок с фильтрацией (Public)

Query параметры:
- `type` - VenueType (FOOTBALL, BASKETBALL, TENNIS, VOLLEYBALL, BADMINTON)
- `priceMin` - минимальная цена за час
- `priceMax` - максимальная цена за час
- `search` - поиск по названию
- `page` - номер страницы (по умолчанию 1)
- `limit` - количество на странице (по умолчанию 10)
- `sortBy` - поле сортировки (name, pricePerHour, createdAt)
- `order` - порядок (asc, desc)

```json
Response (200):
{
  "success": true,
  "data": {
    "venues": [
      {
        "id": "uuid",
        "name": "Футбольная площадка Динамо",
        "type": "FOOTBALL",
        "address": "г. Минск, пр-т Победителей 3",
        "description": "Современная футбольная площадка",
        "pricePerHour": 45.00,
        "imageUrl": "https://example.com/image.jpg",
        "amenities": ["Душ", "Раздевалка", "Парковка"],
        "isActive": true,
        "averageRating": 4.5,
        "reviewCount": 12,
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

**GET** `/api/venues/:id` - детали площадки (Public)

**POST** `/api/venues` - создание площадки (Admin)

**PUT** `/api/venues/:id` - обновление площадки (Admin)

**DELETE** `/api/venues/:id` - удаление площадки (Admin)

### Slots (Временные слоты)

**GET** `/api/slots` - список слотов (Public)

Query параметры: `venueId`, `date`, `status`

**GET** `/api/venues/:venueId/slots` - слоты конкретной площадки (Public)

**POST** `/api/slots` - создание слота (Admin)

**POST** `/api/slots/bulk` - массовое создание слотов (Admin)

```json
Request:
{
  "venueId": "uuid",
  "startDate": "2025-01-01",
  "endDate": "2025-01-07",
  "timeSlots": [
    { "startTime": "08:00", "endTime": "10:00" },
    { "startTime": "10:00", "endTime": "12:00" }
  ]
}
```

**PUT** `/api/slots/:id` - обновление слота (Admin)

**DELETE** `/api/slots/:id` - удаление слота (Admin)

### Bookings (Бронирования)

**GET** `/api/bookings` - брони текущего пользователя (Private)

**GET** `/api/bookings/:id` - детали брони (Private, owner or admin)

**POST** `/api/bookings` - создание бронирования (Private)

```json
Request:
{
  "slotId": "uuid"
}

Response (201):
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "slotId": "uuid",
    "status": "PENDING",
    "totalPrice": 45.00,
    "paymentStatus": "PENDING",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**PUT** `/api/bookings/:id/cancel` - отмена бронирования (Private, owner or admin)

Правила возврата средств:
- > 24 часа: 100% возврат
- 12-24 часа: 50% возврат
- < 12 часов: без возврата

**GET** `/api/admin/bookings` - все брони (Admin)

### Reviews (Отзывы)

**GET** `/api/reviews` - список всех отзывов (Public)

**GET** `/api/reviews/:id` - детали отзыва (Public)

**GET** `/api/reviews/stats/:venueId` - статистика отзывов для площадки (Public)

```json
Response (200):
{
  "success": true,
  "data": {
    "averageRating": 4.5,
    "totalReviews": 12,
    "ratingDistribution": {
      "1": 0,
      "2": 1,
      "3": 2,
      "4": 4,
      "5": 5
    }
  }
}
```

**POST** `/api/reviews` - создание отзыва (Private, требует завершённую бронь)

```json
Request:
{
  "venueId": "uuid",
  "bookingId": "uuid",
  "rating": 5,
  "comment": "Отличная площадка!"
}
```

**PUT** `/api/reviews/:id` - обновление отзыва (Private, author only)

**DELETE** `/api/reviews/:id` - удаление отзыва (Private, author or admin)

## Сценарии использования (User Flows)

### 1. Регистрация и вход

```
1. Пользователь → /register
2. Заполняет форму (email, password, name, phone)
3. POST /api/auth/register
4. Перенаправление на /login
5. Вход → POST /api/auth/login
6. Получение JWT токена
7. Сохранение в localStorage
8. Перенаправление на /
```

### 2. Бронирование площадки

```
1. Пользователь → /
2. Просмотр списка площадок
3. Применение фильтров (тип, цена)
4. Клик на площадку → /venues/:id
5. Просмотр деталей, отзывов
6. Выбор даты → GET /api/venues/:id/slots?date=...
7. Выбор слота → /booking/:slotId
8. Подтверждение → POST /api/bookings
9. Mock оплата → POST /api/payments/create
10. Подтверждение оплаты → POST /api/payments/confirm
11. Перенаправление на /profile (мои брони)
```

### 3. Отмена бронирования

```
1. Пользователь → /profile
2. Список броней
3. Клик "Отменить" → PUT /api/bookings/:id/cancel
4. Расчёт возврата по правилам
5. Обновление статуса брони
6. Уведомление пользователя
```

### 4. Добавление отзыва

```
1. Пользователь → /venues/:id
2. После завершённой брони
3. Заполнение формы отзыва (rating, comment)
4. POST /api/reviews
5. Отображение отзыва в списке
```

### 5. Администрирование (Admin)

```
1. Админ → /admin
2. Управление площадками:
   - Создание → POST /api/venues
   - Редактирование → PUT /api/venues/:id
   - Удаление → DELETE /api/venues/:id
3. Управление слотами:
   - Создание → POST /api/slots
   - Массовое создание (на неделю вперёд) → POST /api/slots/bulk
4. Просмотр всех броней → GET /api/admin/bookings
```

## Авторизация и роли

### Роли пользователей

**USER** (обычный пользователь)
- Просмотр площадок и отзывов
- Бронирование слотов
- Отмена собственных броней
- Создание/редактирование собственных отзывов
- Просмотр собственных бронирований

**ADMIN** (администратор)
- Все права USER +
- Управление площадками (CRUD)
- Управление слотами (CRUD)
- Просмотр всех бронирований
- Удаление любых отзывов

**OWNER** (владелец площадок)
- Все права USER +
- Управление собственными площадками
- Управление слотами своих площадок
- Просмотр броней своих площадок

### Матрица прав доступа

| Действие | Guest | User | Admin | Owner |
|----------|-------|------|-------|-------|
| Просмотр площадок | ✅ | ✅ | ✅ | ✅ |
| Просмотр отзывов | ✅ | ✅ | ✅ | ✅ |
| Регистрация/Вход | ✅ | - | - | - |
| Бронирование | ❌ | ✅ | ✅ | ✅ |
| Отмена своей брони | ❌ | ✅ | ✅ | ✅ |
| Создание отзыва | ❌ | ✅ | ✅ | ✅ |
| Удаление своего отзыва | ❌ | ✅ | ✅ | ✅ |
| Создание площадки | ❌ | ❌ | ✅ | ❌ |
| Редактирование своей площадки | ❌ | ❌ | ✅ | ✅ |
| Редактирование любой площадки | ❌ | ❌ | ✅ | ❌ |
| Удаление площадки | ❌ | ❌ | ✅ | ❌ |
| Управление слотами | ❌ | ❌ | ✅ | ✅* |
| Просмотр всех бронирований | ❌ | ❌ | ✅ | ❌ |
| Удаление любого отзыва | ❌ | ❌ | ✅ | ❌ |

*только для своих площадок

## Безопасность

### Аутентификация

- JWT токены с истечением срока действия (24 часа)
- Refresh токены (опционально)
- Хэширование паролей через bcrypt (10 раундов)
- Middleware для проверки JWT на защищённых маршрутах

### Валидация

- Zod схемы для всех входящих данных
- Валидация на уровне роутов через middleware
- Типобезопасность через TypeScript
- Prisma валидация на уровне БД

### HTTP безопасность

- Helmet.js для защиты заголовков
- CORS настроен для разрешённых origin
- Rate limiting (опционально)
- HTTPS only в production

### Защита данных

- SQL injection защита (Prisma ORM)
- XSS защита (sanitization входных данных)
- CSRF защита для критических операций
- Ограничение размера запросов

## Производительность и масштабируемость

### Оптимизация базы данных

- Индексы на часто используемые поля (email, venueId, userId)
- Connection pooling для PostgreSQL
- Пагинация для всех списков (limit 10-20)
- Eager/lazy loading через Prisma

### Кэширование

- Redis для кэширования списка площадок (опционально)
- HTTP кэширование для статических ресурсов
- Кэширование результатов поиска

### Масштабируемость

- Stateless backend (JWT в заголовках)
- Горизонтальное масштабирование через Kubernetes
- Разделение статики и API
- Load balancing через Ingress

## Доступность (a11y)

- Семантическая разметка HTML5
- ARIA атрибуты для интерактивных элементов
- Навигация с клавиатуры (Tab, Enter, Esc)
- Контрастность цветов (WCAG AA)
- Alt текст для изображений
- Focus indicators

## Мониторинг и логирование

### Логирование

- Структурированные логи (JSON формат)
- Уровни логирования (error, warn, info, debug)
- Request ID для трейсинга
- Логирование всех критических операций

### Метрики

- Prometheus метрики (опционально)
- Request duration
- Error rates
- Database query performance

### Health checks

- `/health` endpoint
- Проверка подключения к БД
- Проверка состояния сервисов

## Kubernetes архитектура (опционально)

```
┌─────────────────────────────────────────────────┐
│              Ingress (nginx)                     │
│  - sports-venues.local → web:80                  │
│  - sports-venues.local/api → server:3000         │
└────────────────────┬────────────────────────────┘
                     │
         ┌───────────┴──────────┐
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│   Web Service    │   │  Server Service  │
│   (ClusterIP)    │   │   (ClusterIP)    │
└────────┬─────────┘   └────────┬─────────┘
         │                      │
         ▼                      ▼
┌──────────────────┐   ┌──────────────────┐
│  Web Deployment  │   │ Server Deployment│
│  replicas: 2     │   │  replicas: 3     │
│  image: web:1.0  │   │  image: srv:1.0  │
└──────────────────┘   └────────┬─────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ PostgreSQL       │
                       │ StatefulSet      │
                       │ replicas: 1      │
                       │ PVC: 10Gi        │
                       └──────────────────┘
```

### Kubernetes ресурсы

- **Namespace**: sports-venues
- **ConfigMap**: переменные окружения
- **Secret**: JWT_SECRET, DATABASE_URL
- **PersistentVolumeClaim**: PostgreSQL данные
- **Deployments**: web (2 реплики), server (3 реплики)
- **StatefulSet**: PostgreSQL
- **Services**: web, server, postgres (ClusterIP)
- **Ingress**: маршрутизация трафика

### Probes

- **Liveness probe**: `/health` endpoint
- **Readiness probe**: `/health` endpoint
- **Startup probe**: для медленного старта

### Resource limits

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

## CI/CD Pipeline (опционально)

### GitHub Actions

```yaml
1. Lint & Format
   - ESLint
   - Prettier

2. Test
   - Unit tests (Jest)
   - Integration tests
   - E2E tests (Playwright)

3. Build
   - Docker images
   - TypeScript compilation

4. Deploy
   - Push to registry
   - Deploy to Kubernetes
```

## Дальнейшее развитие

### Планируемые улучшения

- **Real-time уведомления**: WebSockets для броней
- **Email уведомления**: Nodemailer для подтверждений
- **Push уведомления**: Web Push API
- **Абонементы**: скидки для постоянных клиентов
- **Платёжная интеграция**: Stripe/PayPal
- **Геолокация**: поиск площадок рядом
- **Календарь**: интеграция с Google Calendar
- **Чат**: онлайн-поддержка
- **Аналитика**: дашборд для владельцев

---

Документ обновлён: 31 декабря 2025
