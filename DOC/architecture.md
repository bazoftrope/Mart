# Архитектура и стек технологий

## Общие принципы

- **Минимум зависимостей** — каждая библиотека должна оправдывать своё существование
- **Один репозиторий** — фронтенд и API в одном проекте Next.js
- **TypeScript везде** — типизация от моделей до компонентов
- **PostgreSQL как источник правды** — все данные в одной базе
- **Timeweb Cloud** — хостинг фронтенда и базы данных

---

## Стек технологий

| Слой | Технология | Версия | Почему |
|------|-----------|--------|--------|
| Фреймворк | Next.js | 14.x | Pages Router, API Routes, деплой на Timeweb |
| Язык | TypeScript | 5.x | Типизация фронта и бэка |
| ORM | Sequelize + sequelize-typescript | 6.x | Знакомый, декораторы для моделей |
| База данных | PostgreSQL | 15+ | Надёжность, сложные агрегации |
| Аутентификация | JWT (jsonwebtoken) | 9.x | Полный контроль, без магии NextAuth |
| Валидация | Zod | 3.x | Схемы для API и форм |
| UI | Tailwind CSS | 3.x | Утилитарный, быстрая вёрстка |
| Иконки | Lucide React | latest | Минималистичные, tree-shakeable |
| Графики | Recharts | 2.x | Для страницы результатов (калории по дням) |
| Хостинг | Timeweb Cloud | — | Фронт + БД в одном месте, Россия |

---

## Архитектура приложения

### Структура (Pages Router)

```
marathon-platform/
├── DB/                                 # Всё, что связано с базой данных
│   ├── config/
│   │   └── config.js                   # Конфигурация Sequelize CLI (dev/test/prod)
│   ├── db.ts                           # Подключение Sequelize к PostgreSQL
│   ├── models/                         # Sequelize модели (sequelize-typescript)
│   │   ├── index.ts                    # Экспорт всех моделей + инициализация связей
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── MarathonTemplate.ts
│   │   ├── TemplateDay.ts
│   │   ├── Stream.ts
│   │   ├── StreamEnrollment.ts
│   │   ├── DailyReport.ts
│   │   ├── ReportLine.ts
│   │   └── StreamRating.ts
│   ├── migrations/                     # Sequelize CLI миграции
│   │   ├── 001-create-users.js
│   │   ├── 002-create-products.js
│   │   ├── 003-create-marathon-templates.js
│   │   ├── 004-create-template-days.js
│   │   ├── 005-create-streams.js
│   │   ├── 006-create-stream-enrollments.js
│   │   ├── 007-create-daily-reports.js
│   │   ├── 008-create-report-lines.js
│   │   └── 009-create-stream-ratings.js
│   └── seeders/                        # Seed-данные
│       └── 001-products.js             # Базовые продукты (яйца, помидоры, курица и т.д.)
├── src/
│   ├── pages/                          # Next.js Pages Router
│   │   ├── api/                        # API Routes — весь бэкенд
│   │   │   ├── auth/
│   │   │   │   ├── register.ts         # POST /api/auth/register
│   │   │   │   ├── login.ts            # POST /api/auth/login
│   │   │   │   ├── logout.ts           # POST /api/auth/logout
│   │   │   │   └── refresh.ts          # POST /api/auth/refresh
│   │   │   ├── marathons/
│   │   │   │   ├── index.ts            # GET/POST — список и создание шаблонов
│   │   │   │   └── [id]/
│   │   │   │       ├── index.ts        # GET/PUT/DELETE — шаблон по ID
│   │   │   │       ├── submit.ts       # POST — отправить на проверку
│   │   │   │       └── days.ts         # GET/POST — дни шаблона
│   │   │   ├── streams/
│   │   │   │   ├── index.ts            # GET — публичный список потоков (open)
│   │   │   │   ├── my.ts               # GET — мои потоки (ментор/участник)
│   │   │   │   └── [id]/
│   │   │   │       ├── index.ts        # GET — поток по ID
│   │   │   │       ├── enroll.ts       # POST — записаться на поток
│   │   │   │       ├── rating.ts       # GET — рейтинг потока
│   │   │   │       └── day/[dayNumber].ts  # GET/POST — день марафона + отчёт
│   │   │   ├── reports/
│   │   │   │   └── [reportId].ts       # PUT — редактировать отчёт
│   │   │   ├── admin/
│   │   │   │   └── pending.ts          # GET — марафоны на проверке
│   │   │   │   └── [id]/
│   │   │   │       └── approve.ts      # POST — одобрить марафон
│   │   │   ├── rating/
│   │   │   │   └── calculate.ts        # POST — триггер пересчёта рейтинга (cron)
│   │   │   └── products/
│   │   │       └── index.ts            # GET — поиск продуктов (autocomplete)
│   │   ├── index.tsx                   # Главная — список потоков (open)
│   │   ├── login.tsx                   # Страница входа
│   │   ├── register.tsx                # Страница регистрации
│   │   ├── dashboard/                  # ЛК участника
│   │   │   ├── index.tsx               # "Мои марафоны"
│   │   │   ├── marathon/
│   │   │   │   └── [streamId]/
│   │   │   │       ├── index.tsx       # Календарь дней
│   │   │   │       ├── day/
│   │   │   │       │   └── [dayNumber].tsx  # День марафона + отчёт
│   │   │   │       ├── rating.tsx      # Рейтинг потока
│   │   │   │       └── results.tsx     # Результаты (после финиша)
│   │   ├── mentor/                     # ЛК ментора
│   │   │   ├── index.tsx               # Дашборд ментора
│   │   │   ├── templates/
│   │   │   │   ├── index.tsx           # Мои шаблоны
│   │   │   │   ├── new.tsx             # Создание шаблона (шаг 1: основная инфо)
│   │   │   │   └── [id]/
│   │   │   │       ├── edit.tsx        # Редактирование шаблона (дни, материалы)
│   │   │   │       └── days.tsx        # Управление днями
│   │   │   └── streams/
│   │   │       ├── index.tsx           # Мои потоки
│   │   │       └── [id]/
│   │   │           ├── index.tsx       # Страница потока (участники, результаты)
│   │   │           └── launch.tsx      # Запуск потока из шаблона
│   │   └── admin/                      # Админ-панель
│   │       └── index.tsx               # Марафоны на проверке
│   ├── components/                     # React компоненты
│   │   ├── ui/                         # Базовые: Button, Input, Select, Card
│   │   ├── layout/                     # Header, Navigation, Footer
│   │   ├── forms/                      # ProductSearch, ReportTable, DayEditor
│   │   ├── marathon/                   # CalendarGrid, DayCard, MaterialViewer
│   │   └── rating/                     # RatingTable, ResultsChart
│   ├── lib/                            # Утилиты и конфигурация
│   │   ├── auth.ts                     # JWT: sign, verify, refresh, куки
│   │   ├── validate.ts                 # Zod-схемы для валидации
│   │   ├── errors.ts                   # Классы ошибок API (BadRequest, Unauthorized, etc.)
│   │   ├── apiHandler.ts               # Обёртка для API Routes (try/catch, auth, CORS)
│   │   └── ratingCalculator.ts         # Логика пересчёта рейтинга
│   ├── hooks/                          # React hooks
│   │   ├── useAuth.ts                  # Проверка авторизации, данные пользователя
│   │   ├── useApi.ts                   # Fetch-обёртка с авторизацией
│   │   └── useMarathon.ts              # Данные марафона, дни, отчёты
│   └── types/                          # TypeScript интерфейсы (дублируют модели для фронта)
│       ├── api.ts
│       ├── auth.ts
│       └── marathon.ts
├── public/                             # Статика
├── .env.example                        # Шаблон переменных окружения
├── .env.local                          # Локальные переменные (не в git)
├── next.config.js                      # Конфиг Next.js (output: 'standalone' для Timeweb)
├── docker-compose.yml                  # Локально: PostgreSQL в контейнере
├── package.json
└── tsconfig.json
```

---

## Аутентификация

### Схема JWT в куках

| Токен | Хранение | Срок | Назначение |
|-------|----------|------|------------|
| Access Token | httpOnly cookie | 15 минут | Доступ к API, проверка на каждом запросе |
| Refresh Token | httpOnly cookie | 7 дней | Обновление access token |

### Поток

```
Регистрация / Вход
    ↓
Сервер генерирует access + refresh → ставит в httpOnly куки
    ↓
Каждый API запрос → access token из куки → verify → данные пользователя в req.user
    ↓
Access протух (15 мин) → 401 → фронт дергает /api/auth/refresh → новый access
    ↓
Refresh протух (7 дней) → полный ре-логин
```

### Middleware

- `withAuth` — проверка access token, добавление `req.user` в API Route
- `withRole` — проверка роли после `withAuth` (mentor/participant/admin)
- `withAdmin` — проверка роли admin

---

## База данных

### Подключение (Sequelize)

```typescript
// DB/db.ts
import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import { User } from './models/User';
// ... остальные модели

export const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  dialect: 'postgres',
  models: [User, /* ... */],
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
});
```

### Миграции и Seed

| Команда | Назначение |
|---------|------------|
| `npx sequelize-cli db:migrate` | Применить миграции |
| `npx sequelize-cli db:migrate:undo` | Откатить последнюю |
| `npx sequelize-cli db:seed:all` | Залить seed-данные |
| `npx sequelize-cli db:seed:undo:all` | Очистить seed |

**Правило:** в dev — `sync({ alter: true })` для скорости, в prod — только миграции.

---

## API Convention

### Структура ответа

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### HTTP статусы

| Статус | Когда |
|--------|-------|
| 200 | Успешный GET/PUT |
| 201 | Успешный POST (создано) |
| 400 | Невалидные данные (Zod error) |
| 401 | Нет токена / токен протух |
| 403 | Нет прав (не та роль) |
| 404 | Ресурс не найден |
| 409 | Конфликт (уже записан, уже существует) |
| 500 | Серверная ошибка |

### Пример API Route

```typescript
// pages/api/marathons/index.ts
import { apiHandler } from '@/lib/apiHandler';
import { withAuth, withRole } from '@/lib/auth';
import { MarathonTemplate } from '@/models/MarathonTemplate';

export default apiHandler({
  get: async (req, res) => {
    // Публичный список одобренных шаблонов (для ментора — свои)
    const templates = await MarathonTemplate.findAll({ where: { status: 'approved' } });
    return res.status(200).json({ success: true, data: templates });
  },

  post: [
    withAuth,
    withRole('mentor'),
    async (req, res) => {
      const template = await MarathonTemplate.create({
        ...req.body,
        mentorId: req.user.id,
        status: 'draft',
      });
      return res.status(201).json({ success: true, data: template });
    }
  ]
});
```

---

## Расчёт рейтинга

### Алгоритм (запускается раз в сутки)

```typescript
// lib/ratingCalculator.ts
export async function calculateStreamRating(streamId: string) {
  const stream = await Stream.findByPk(streamId, { include: [MarathonTemplate] });
  if (!stream) return;

  const enrollments = await StreamEnrollment.findAll({ where: { streamId } });
  const duration = stream.template.durationDays;

  const ratings = [];

  for (const enrollment of enrollments) {
    const filledDays = await DailyReport.count({
      where: { enrollmentId: enrollment.id },
    });

    const disciplinePercent = (filledDays / duration) * 100;

    ratings.push({
      streamId,
      participantId: enrollment.participantId,
      filledDays,
      disciplinePercent,
      // rank назначается после сортировки
    });
  }

  // Сортировка и назначение rank
  ratings.sort((a, b) => {
    if (b.disciplinePercent !== a.disciplinePercent) {
      return b.disciplinePercent - a.disciplinePercent;
    }
    return b.filledDays - a.filledDays;
  });

  ratings.forEach((r, index) => {
    r.rank = index + 1;
  });

  // Bulk upsert
  await StreamRating.bulkCreate(ratings, {
    updateOnDuplicate: ['filledDays', 'disciplinePercent', 'rank', 'calculatedAt'],
  });
}
```

### Запуск

- **Локально:** `node-cron` внутри Next.js процесса (не идеально, но для MVP)
- **На Timeweb:** внешний cron (если есть) или отдельный скрипт по расписанию
- **Ручной:** API endpoint `/api/rating/calculate` (POST, admin only) — для тестирования

---

## Деплой на Timeweb

### Конфигурация next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',        // Самодостаточный билд для Node.js сервера
  experimental: {
    // Ничего критичного для Pages Router
  },
  env: {
    DB_HOST: process.env.DB_HOST,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  },
};

module.exports = nextConfig;
```

### Переменные окружения (Timeweb)

```
NODE_ENV=production
DB_HOST=xxx.xxx.xxx.xxx       # IP PostgreSQL от Timeweb
DB_PORT=5432
DB_NAME=marathon
DB_USER=marathon_user
DB_PASSWORD=****************
JWT_SECRET=*******************
JWT_REFRESH_SECRET=***********
```

### Процесс деплоя

1. Пуш в репозиторий
2. Timeweb билдит (`npm ci && npm run build`)
3. Стартует standalone сервер (`node .next/standalone/server.js`)
4. Применяем миграции (`npx sequelize-cli db:migrate`)
5. Заливаем seed (`npx sequelize-cli db:seed:all`) — первый раз

---

## Граничные случаи и решения

| Ситуация | Решение |
|----------|---------|
| Таймзона участника | Сохраняем в `User.timezone`. Логика «сегодня» считается на бэкенде через `date-fns-tz` с timezone пользователя. |
| День открывается в 00:00 | Сравниваем `currentDate >= stream.startDate + dayNumber - 1` в timezone участника. |
| Два запроса на запись одновременно | Уникальный индекс `streamId + participantId` в `StreamEnrollment` — PostgreSQL выбросит ошибку, обрабатываем 409. |
| Ментор удаляет шаблон на проверке | CASCADE удаление связанных `TemplateDay`. Админ больше не видит. |
| Рейтинг считается во время марафона | Ок — промежуточный рейтинг. После финиша — фиксируется (rank не меняется). |
| Файлы аудио/видео | В MVP — URL (YouTube, облако). Ментор вставляет ссылку при создании дня. Загрузка файлов — v2. |
| Админ зашит | `ADMIN_EMAIL` и `ADMIN_PASSWORD_HASH` в `.env`. Проверка при логине: если email совпадает — роль admin. |

---

## Что НЕ входит в стек (и почему)

| Технология | Почему нет |
|------------|-----------|
| NextAuth.js | Лишняя абстракция. JWT в куках — проще и контролируемо. |
| Prisma | Хороший ORM, но Sequelize уже знаком. Миграция — потеря времени. |
| tRPC | Не нужен для MVP. REST + Zod достаточно. |
| Redis | Нет сессий, нет кэша. JWT stateless. |
| Docker (prod) | Timeweb управляет контейнером. Локально — docker-compose для PostgreSQL. |
| S3 / облако | Файлы не храним в MVP. URL на внешние ресурсы. |
| WebSocket / SSE | Нет real-time. Рейтинг обновляется раз в сутки. |
| Email (SMTP) | Нет уведомлений в MVP. |
| Swagger / OpenAPI | Документация API — позже, если команда вырастет. |
