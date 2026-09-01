# Архитектура и стек технологий

Актуально по состоянию на **31.08.2026**.

## Общие принципы

- **Минимум зависимостей** — каждая библиотека должна оправдывать своё существование.
- **Один репозиторий** — фронтенд и API в одном проекте Next.js.
- **TypeScript везде** — strict-режим, типизация от моделей до компонентов.
- **PostgreSQL как источник правды** — все данные в одной базе.
- **Pages Router** — Next.js Pages Router (НЕ App Router).

## Стек технологий

| Слой | Технология | Версия | Почему |
|------|-----------|--------|--------|
| Фреймворк | Next.js (Pages Router) | 14.2 | API Routes, SSR |
| Язык | TypeScript | 5.x | strict |
| ORM | Sequelize + sequelize-typescript | 6.x | Декораторы для моделей |
| База данных | PostgreSQL | 15+ | Надёжность, агрегации |
| Аутентификация | JWT (jsonwebtoken 9.x) в куках | | `mp_access_token`, `mp_refresh_token` |
| Валидация | Zod | 4.x | Схемы API и форм |
| UI | CSS Modules + глобальные переменные | — | `src/styles/globals.css`, без Tailwind |
| Иконки | Lucide React | 1.x | tree-shakeable |
| Графики | Recharts | 3.x | Страницы результатов |
| Состояние | zustand | 5.x | `authStore`, `participantDayStore` |
| Cron | node-cron (dev) | 3.x | `npm run cron` |

**Пути импорта** (tsconfig):
- `@/*` → `src/*`
- `@db/*` → `DB/*` (напр. `@db/models`, `@db/models/User`, `@db/db`)

## Структура проекта

```
marathon-platform/
├── DB/
│   ├── db.ts                    # Подключение Sequelize (из DATABASE_URL или DB_* env)
│   ├── config/config.js         # Конфиг Sequelize CLI (dev/test/prod)
│   ├── models/                  # 14 моделей (index.ts экспортирует все + `models` map + `AppModels`)
│   ├── migrations/              # Sequelize CLI миграции (14 файлов)
│   └── seeders/                 # Seed-данные (продукты)
├── src/
│   ├── pages/                   # Pages Router
│   │   ├── _app.tsx             # Layout + globals.css
│   │   ├── index.tsx            # Главная — список потоков (open)
│   │   ├── login.tsx, register.tsx, onboarding.tsx
│   │   ├── api/                 # API Routes (весь бэкенд)
│   │   ├── dashboard/           # ЛК участника
│   │   ├── mentor/              # ЛК ментора
│   │   ├── admin/               # Админ-панель
│   │   └── streams/[id]/        # Публичная страница потока
│   ├── components/              # UI-компоненты
│   ├── lib/                     # Утилиты и серверная логика
│   ├── services/                # Серверные сервисы
│   ├── stores/                  # zustand-сторы
│   ├── styles/globals.css       # Глобальные стили + переменные
│   ├── types/                   # TS-интерфейсы (@/types)
│   ├── middleware/              # (зарезервировано)
│   └── cron-worker.ts           # Точка входа cron (tsx)
├── .env.example                 # Шаблон env
└── next.config.mjs              # (ESM), реакт strict mode
```

## API Routes — полный список (`src/pages/api/`)

**auth/**
- `POST /api/auth/register` — регистрация (участник/ментор)
- `POST /api/auth/login` — вход (incl. admin по `ADMIN_EMAIL`)
- `POST /api/auth/logout` — выход, чистка кук
- `POST /api/auth/refresh` — обновление access-токена

**users/**
- `GET /api/users/me` — текущий юзер + `profileCompleted`
- `PATCH /api/users/me` — заполнение профиля (онбординг)

**marathons/**
- `GET/POST /api/marathons` — шаблоны ментора (список/создание)
- `GET/PUT/DELETE /api/marathons/[id]` — шаблон по ID
- `POST /api/marathons/[id]/submit` — отправить на проверку
- `GET/POST /api/marathons/[id]/days` — дни шаблона (bulk-обновление)

**admin/**
- `GET /api/admin/pending` — марафоны на проверке
- `POST /api/admin/[id]/approve` — одобрить марафон
- `GET /api/admin/users` — список юзеров (filter `?role=`)
- `GET/PUT /api/admin/users/[id]` — просмотр/смена роли

**streams/**
- `GET /api/streams` — публичный список (open)
- `POST /api/streams` — запустить поток из approved-шаблона (ментор)
- `GET /api/streams/my` — мои потоки (ментор/участник)
- `GET /api/streams/[id]` — публичная страница потока (+ isEnrolled)
- `POST /api/streams/[id]/enroll` — записаться (участник; считает targetCalories)
- `GET /api/streams/[id]/calendar` — календарь дней (участник)
- `GET /api/streams/[id]/days` — bulk-данные всех дней (участник)
- `POST /api/streams/[id]/day/[dayNumber]` — создать отчёт за день
- `GET /api/streams/[id]/rating` — рейтинг (участник)
- `GET /api/streams/[id]/results` — результаты (участник)
- `GET /api/streams/[id]/enrollments` — участники потока (ментор)
- `GET /api/streams/[id]/participants/[participantId]` — детали участника (ментор)

**reports/**
- `PUT /api/reports/[reportId]` — редактировать отчёт (участник)

**products/**
- `GET /api/products?search=` — поиск продуктов (autocomplete, max 20)

**messages/**
- `GET/POST /api/messages` — список бесед / создать беседу
- `GET/POST /api/messages/[id]` — сообщения беседы / отправить сообщение

**rating/**
- `POST /api/rating/calculate` — ручной пересчёт рейтинга (admin)

**health/**
- `GET /api/health/db` — проверка подключения к БД

## Аутентификация и middleware

### Куки
| Cookie | HttpOnly | Срок | Назначение |
|--------|----------|------|------------|
| `mp_access_token` | да | 15 мин | Доступ к API |
| `mp_refresh_token` | да | 7 дней | Обновление access |
| `mp_role` | нет | 7 дней | Роль для фронта |
| `mp_user_id` | нет | 7 дней | ID пользователя для фронта |

(секции куков и middleware описаны в `src/lib/auth.ts` и `src/lib/middleware.ts`)

### Middleware (`src/lib/middleware.ts`)
- `withAuth(handler)` — проверка access-токена из куки, кладёт `req.user` (TokenPayload)
- `withRole(role)(handler)` — проверка роли после `withAuth`
- готова: `withAdmin`, `withMentor`, `withParticipant`

### Схема API Request/Response
```typescript
// src/lib/apiHandler.ts
{ success: true, data: ... }        // ApiSuccessResponse
{ success: false, error, message }  // ApiErrorResponse
{ success: false, error: 'VALIDATION_ERROR', message, issues: {...} }  // Zod-ошибка
```
- `apiHandler(methods)` — единая обёртка: CORS, OPTIONS, 405, обработка `AppError`, `ZodError`, 500.
- `success(res, data, status=200)`, `error(res, status, code, message)`.
- Хелпер `@/lib/api.ts` реэкспортирует `apiHandler, success, error` и ошибки; `ApiError` помечен `@deprecated`.

### Ошибки (`src/lib/errors.ts`) — наследуют `AppError`
| Класс | HTTP | Код |
|-------|------|-----|
| `BadRequest` | 400 | `BAD_REQUEST` |
| `Unauthorized` | 401 | `UNAUTHORIZED` |
| `Forbidden` | 403 | `FORBIDDEN` |
| `NotFound` | 404 | `NOT_FOUND` |
| `Conflict` | 409 | `CONFLICT` |

### Канонический пример API-роута
```typescript
import '@/lib/db';
import { apiHandler, success } from '@/lib/apiHandler';
import { withMentor } from '@/lib/middleware';
import { NotFound } from '@/lib/errors';
import type { AuthenticatedRequest } from '@/types/auth';

async function getHandler(req, res) {
  const { user } = req as AuthenticatedRequest;
  // ... логика
  return success(res, data);
}

export default apiHandler({ GET: withMentor(getHandler) });
```

## База данных

- Подключение `DB/db.ts` (`sequelize`), реэкспорт через `src/lib/db.ts` (`import '@/lib/db'` в роутах).
- Источник подключения: `DATABASE_URL` (URL) или `DB_HOST/DB_NAME/DB_USER/DB_PASSWORD/DB_PORT` — см. `DB/db.ts` и `DB/config/config.js`.
- Модели регистрируются явным списком в `DB/db.ts` и `DB/models/index.ts`.

### Миграции
| Файл | Назначение |
|------|-----------|
| `20240724000001-create-users.js` | users |
| `20240724000002-create-products.js` | products |
| `20240724000003-create-marathon-templates.js` | marathon_templates |
| `20240724000004-create-template-days.js` | template_days |
| `20240724000005-create-streams.js` | streams |
| `20240724000006-create-stream-enrollments.js` | stream_enrollments |
| `20240724000007-create-daily-reports.js` | daily_reports |
| `20240724000008-create-report-lines.js` | report_lines |
| `20240724000009-create-stream-ratings.js` | stream_ratings |
| `20240724000010-create-pulse-readings.js` | pulse_readings |
| `20240815000001-add-body-measurements-to-daily-reports.js` | ОГ/ОТ/ОБ/ОН |
| `20240815000002-create-conversations.js` | conversations + members + messages |
| `20240816000001-add-weight-fields-to-stream-ratings.js` | вес в рейтинге |
| `20260831000001-add-video-id-to-template-days.js` | `video_id` Kinescope |

Команды: `npx sequelize-cli db:migrate` / `db:migrate:undo` / `db:seed:all` / `db:seed:undo:all`.

## Расчёт калорий (`src/lib/calorieCalculator.ts`)

Формула Миффлина-Сан Жеора с фиксированным коэффициентом активности **1.2**:
```
female: База = (6.25×Рост + 10×Вес − 5×Возраст − 161) × 1.2
male:   База = (6.25×Рост + 10×Вес − 5×Возраст + 5) × 1.2
```
Итог с учётом цели:
| Цель (`Goal`) | Множитель | Описание |
|-------------|-----------|----------|
| `lose` | 0.85 | дефицит 15% |
| `maintain` | 1.0 | без изменений |
| `gain` | 1.15 | профицит 15% |

`calculateTargetCalories` округляет до целого. Заполнение профиля проверяется через `isProfileComplete`.

## Расчёт рейтинга (`src/lib/ratingCalculator.ts`)

- `calculateRatingsForStream(streamId)` — для каждого участника считает `filledDays`, `entryWeight`/`currentWeight` (первый/последний вес в отчётах), `weightLossPercent = (entry − current)/entry × 100`.
- Сортировка по убыванию `weightLossPercent`, `rank = index + 1`. Всё в транзакции.
- `calculateAllRatings()` — по всем `running`/`finished` потокам.

### Запуск
- Cron: `npm run cron` → `src/cron-worker.ts` → `src/lib/cron.ts` (node-cron, ежедневно 00:05).
- Ручной: `POST /api/rating/calculate` (admin).

## Клиентская сторона

- **API-клиент:** `src/lib/apiClient.ts` — `apiClient.get/post/put/patch/delete<T>()` и `apiFetch()`; автоматический refresh access-токена при 401 (единственный refreshPromise), редирект на `/login` при неудаче.
- **Куки на клиенте:** `src/lib/cookies.ts` — `getCookie`/`deleteCookie`.
- **Авторизация:** `useAuthStore` (zustand) — `initAuth()` читает `mp_role`/`mp_user_id`; login/register/logout через `authService`.
- **Роль/ID на фронте:** через `getCookie('mp_role')` / `readUserId()`.
- **День участника:** `useParticipantDayStore` (zustand) — кэш дней `daysCache`, lines/metrics/pulseReadings, `saveReport`.

## Типы клиента (`src/types/`)

- `auth.ts` — `UserRole`, `TokenPayload`, `AuthenticatedRequest`, `PublicUser`.
- `participantDay.ts` — данные дня участника (`ParticipantDayData`, `DayReportData`, `MetricsState`, `PulseReadingItem`).
- `pg.d.ts` — декларация типов для `pg`.

## Cron в проде

Локально — `node-cron` (`npm run cron`). В проде схема может отличаться (внешний cron или отдельный процесс): при добавлении задач учитывать это.

## Key design & рефакторинги

- Структура дня участника вынесена в компоненты `src/components/day/*` (`DayHeader`, `DayMaterials`, `DayReport`, `DayTabs`, `KinescopePlayer`) и `src/components/marathon/*` (`MarathonWindow`, `DayView`, `DayNavbar`, `MarathonHeader`).
- Чат: `src/components/Chat/Chat.tsx` — переиспользуется в `dashboard/messages` и `mentor/messages`.
- Планы рефакторингов: `DOC/css-refactor-plan.md`, `DOC/participant-day-refactor-plan.md`, `DOC/report-extension-plan.md`.
