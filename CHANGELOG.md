# Changelog

## 2026-07-30

### feat
- Реализован клиентский API-слой и перенесена авторизация в `authStore`:
  - `src/lib/apiClient.ts` — базовый HTTP-клиент на `fetch` с единой обработкой ошибок (`ApiClientError`).
  - `src/services/authService.ts` — сервис авторизации: `login`, `register`, `logout`, `refresh`.
  - `src/stores/authStore.ts` — расширен: добавлены `login`, `register`, `logout`, состояния `isLoading`, `error`, `user`.
  - `src/pages/login.tsx`, `src/pages/register.tsx` — убран прямой `fetch`, используется `authStore`.
  - `src/components/Layout.tsx` — логаут через `authStore.logout()`.
  - `src/types/auth.ts` — `UserRole` вынесен из модели БД для безопасного использования на клиенте.

### refactor
- Убрано дублирование обработки ошибок и `credentials: 'include'` из страниц авторизации.

## 2026-07-25

### feat
- Централизовано управление auth-состоянием через Zustand:
  - `src/stores/authStore.ts` — store с `role`, `userId`, `initAuth()`, `clearAuth()`.
  - Убрано дублирование `getCookie('mp_role')` из 20 файлов.
  - Единый источник правды для роли пользователя во всём приложении.

### feat
- Реализован рейтинг участников (Step 8):
  - `src/lib/ratingCalculator.ts` — расчёт рейтинга: `filledDays`, `disciplinePercent`, `rank` для потоков `running`/`finished`.
  - `GET /api/streams/[id]/rating` — таблица рейтинга потока.
  - `POST /api/rating/calculate` — ручной пересчёт рейтинга (admin only).
  - Страница `/dashboard/marathon/[streamId]/rating.tsx` — рейтинг с подсветкой текущего участника.
  - Cron: `node-cron` для ежедневного пересчёта в 00:05 (`npm run cron`).

### feat
- Реализованы результаты и графики (Step 9):
  - `GET /api/streams/[id]/results` — агрегация калорий по дням + среднее по потоку + рейтинг.
  - Страница `/dashboard/marathon/[streamId]/results.tsx` — Recharts LineChart (участник vs среднее) и сводка (ранг, дисциплина, средние калории).

## 2026-07-24

### feat
- Реализован личный кабинет участника: календарь дней и отчёты (Step 7):
  - `GET /api/streams/[id]/day/[dayNumber]` — материалы дня и текущий отчёт участника.
  - `POST /api/streams/[id]/day/[dayNumber]` — создание/сохранение отчёта за день (upsert в транзакции).
  - `PUT /api/reports/[reportId]` — редактирование существующего отчёта.
  - `GET /api/streams/[id]/calendar` — календарь потока: текущий доступный день и сводка по отчётам участника.
  - Страница `/dashboard/marathon/[streamId]/index.tsx` — календарь дней марафона.
  - Страница `/dashboard/marathon/[streamId]/day/[dayNumber].tsx` — просмотр дня и форма отчёта с поиском продуктов.
  - Компонент `CalendarGrid` — сетка дней с индикацией заполненных отчётов.
  - Компонент `ProductSearch` — поиск продуктов с выпадающим списком.
  - Компонент `ReportTable` — таблица строк отчёта с редактированием веса, удалением строк и итоговыми калориями.
  - Реализован расчёт калорий: `line_calories = weight_grams × calories_per_100g / 100`, `total_calories = SUM(line_calories)`.
  - Доступность дня определяется по таймзоне участника (`User.timezone`) относительно `Stream.start_date`.
  - Добавлены Zod-схемы `saveReportSchema` и `reportLineSchema`.
  - Обновлена страница `/dashboard/index.tsx`: ссылки на марафоны ведут в `/dashboard/marathon/[streamId]`.

### feat
- Добавлена утилита `src/lib/calendar.ts` для расчёта текущего дня потока с учётом таймзоны пользователя.

## 2026-07-24

### feat
- Реализованы потоки и запись участников (Step 6):
  - `POST /api/streams` — ментор запускает поток из approved-шаблона.
  - `GET /api/streams` — публичный список открытых и идущих потоков с данными шаблона и ментора.
  - `GET /api/streams/my` — потоки текущего пользователя (ментор видит свои запуски, участник — свои записи).
  - `GET /api/streams/[id]` — детали потока, количество участников, флаг записи.
  - `POST /api/streams/[id]/enroll` — участник записывается на поток.
  - `GET /api/streams/[id]/enrollments` — ментор видит список записавшихся на свой поток.
  - Страница `/index.tsx` — главная с карточками публичных потоков.
  - Страница `/streams/[id]/index.tsx` — страница потока для участника с кнопкой «Enroll».
  - Страница `/dashboard/index.tsx` — «Мои марафоны» участника с его записями.
  - Страница `/mentor/streams/index.tsx` — потоки ментора.
  - Страница `/mentor/streams/launch.tsx` — форма запуска потока из approved-шаблона.
  - Страница `/mentor/streams/[id]/index.tsx` — детали потока и список участников для ментора.
  - Добавлен middleware `withParticipant`.
  - Добавлена Zod-схема `createStreamSchema`.

### feat
- Реализована общая навигация и ролевой вход:
  - Добавлен общий `Layout`/`Header` (`src/components/Layout.tsx`) с меню по ролям.
  - Все страницы оборачиваются в `Layout` через `_app.tsx`.
  - После входа/регистрации пользователь перенаправляется в свой раздел: `/admin`, `/mentor` или `/dashboard`.
  - Добавлена кнопка «Logout» в шапке.
  - Добавлены хелперы для работы с cookie (`src/lib/cookies.ts`).

### fix
- Исправлена ошибка `column "updated_at" does not exist` при создании потока и записи участника:
  - Добавлена миграция, создающая колонку `updated_at` в таблицах `streams` и `stream_enrollments`.
  - В моделях `Stream` и `StreamEnrollment` добавлено поле `@UpdatedAt updatedAt`.

## 2026-07-24

### feat
- Реализован личный кабинет ментора: шаблоны и дни (Step 5):
  - `GET /api/marathons` — список шаблонов текущего ментора.
  - `POST /api/marathons` — создание шаблона марафона.
  - `GET /api/marathons/[id]` — получение шаблона по ID с днями.
  - `PUT /api/marathons/[id]` — редактирование шаблона (только в статусе `draft`).
  - `DELETE /api/marathons/[id]` — удаление шаблона (только в статусе `draft`).
  - `POST /api/marathons/[id]/submit` — отправка шаблона на проверку (`pending_review`) с валидацией количества дней.
  - `GET /api/marathons/[id]/days` — получение дней шаблона.
  - `POST /api/marathons/[id]/days` — создание/обновление дней шаблона (атомарно в транзакции, только для `draft`).
  - Страница `/mentor/index.tsx` — дашборд ментора.
  - Страница `/mentor/templates/index.tsx` — список шаблонов с кнопками редактирования, дней, отправки и удаления.
  - Страница `/mentor/templates/new.tsx` — создание нового шаблона.
  - Страница `/mentor/templates/[id]/edit.tsx` — редактирование основной информации.
  - Страница `/mentor/templates/[id]/days.tsx` — управление днями: текст, аудио- и видео-URL, сохранение и отправка на проверку.
  - Endpoints защищены `withMentor`; на клиенте проверка роли через cookie `mp_role`.
  - Добавлены Zod-схемы `marathonTemplateSchema`, `templateDaySchema`, `updateTemplateDaysSchema`.

## 2026-07-24

### feat
- Реализована админ-панель и поиск продуктов (Step 4):
  - `GET /api/admin/pending` — список шаблонов марафонов на проверке (`pending_review`) с данными ментора.
  - `GET /api/admin/pending/[id]` — детали шаблона: описание, ментор, дни программы.
  - `POST /api/admin/[id]/approve` — одобрение шаблона, переход в статус `approved`.
  - `GET /api/products?search=...` — регистронезависимый поиск продуктов по имени (`ILIKE`), лимит 20 результатов.
  - Страница `/admin/index.tsx` — список шаблонов на проверке со ссылками на детали.
  - Страница `/admin/[id].tsx` — просмотр шаблона, дней программы и кнопка «Approve Template»; после одобрения редирект на `/admin`.
  - Админские endpoints защищены `withAdmin`, поиск продуктов — `withAuth`.
  - На клиенте проверка роли администратора через cookie `mp_role` перед загрузкой страниц.

## 2026-07-24

### feat
- Реализована базовая API-обвёртка (Step 3):
  - `src/lib/apiHandler.ts` — единый обработчик API-роутов: маршрутизация по HTTP-методам, try/catch, CORS, унифицированный формат ответа.
  - `src/lib/errors.ts` — доменные ошибки `BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict` и базовый `AppError`.
  - `src/lib/validate.ts` — Zod-схемы общих полей (`email`, `password`, `name`, `role`, `id`, `uuid`) и схемы `login`/`register`.
  - Формат ответа: `{ success: true, data: ... }` / `{ success: false, error: ..., message: ... }`.
- Все существующие API-эндпоинты (`/api/auth/*`, `/api/health/db`) переведены на новый формат.

### refactor
- `src/lib/api.ts` и `src/lib/validation.ts` теперь реэкспортируют новые модули; `ApiError` помечен как deprecated.
- `src/lib/middleware.ts` (`withAuth`, `withRole`) адаптирован под единый формат ответа.
- Страницы `/login` и `/register` — читают сообщение об ошибке из `data.message`.

## 2026-07-24

### feat
- Создана схема БД: 9 моделей Sequelize (`User`, `Product`, `MarathonTemplate`, `TemplateDay`, `Stream`, `StreamEnrollment`, `DailyReport`, `ReportLine`, `StreamRating`).
- Настроены связи между моделями в `DB/models/index.ts`.
- Созданы миграции для всех таблиц с UUID-PK, snake_case полями, FK `ON DELETE CASCADE` и индексами.
- Добавлен seeder с базовыми продуктами.
- Создан `DB/db.ts` — подключение Sequelize с поддержкой `DATABASE_URL` и отдельных `DB_*` переменных.
- Добавлен `.sequelizerc` и `DB/config/config.js` для Sequelize CLI.

### refactor
- Всё DB-специфичное вынесено в папку `DB/`: модели, миграции, сидеры, конфиг и подключение.
- Добавлен path alias `@db/*` в `tsconfig.json`.
- Обновлена документация `DOC/architecture.md` в соответствии с новой структурой.

### fix
- Добавлен `src/types/pg.d.ts` для типизации модуля `pg` в `src/pages/api/health/db.ts`.

## 2026-07-24

### feat
- Реализована авторизация (Step 2):
  - JWT-сервис: генерация access/refresh токенов, установка httpOnly cookies (`src/lib/auth.ts`).
  - Middleware `withAuth`, `withRole`, `withAdmin` (`src/lib/middleware.ts`).
  - API routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`.
  - Страницы `/login` и `/register`.
  - Валидация входных данных через Zod (`src/lib/validation.ts`).
  - Проверка админа по `ADMIN_EMAIL` / `ADMIN_PASSWORD_HASH`.
- Установлены `cookie` и `@types/cookie`.
- В `.env.example` добавлены `JWT_REFRESH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`.

### refactor
- Убраны декораторы ассоциаций (`@HasMany`, `@BelongsTo`, `@ForeignKey`) из моделей `DB/models/*.ts`, чтобы устранить циклические импорты, приводившие к ошибке `Cannot access ... before initialization` при загрузке моделей в API-роутах.
- Добавлен `src/lib/db.ts` для единообразного импорта подключения к БД.

### fix
- Исправлен импорт модуля `cookie` — теперь используются именованные импорты `parse`/`serialize`.
- Очищена `.next`-сборка после изменений моделей.
