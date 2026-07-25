# Сущности и связи

## Список сущностей

### 1. User (Пользователь)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID / int PK | Уникальный идентификатор |
| email | string, unique | Email для входа |
| password_hash | string | Хеш пароля |
| role | enum | `mentor`, `participant`, `admin` |
| name | string | Имя для отображения |
| timezone | string | Часовой пояс (IANA, например `Europe/Moscow`) |
| created_at | datetime | Дата регистрации |
| updated_at | datetime | Дата последнего обновления |

**Ограничения:**
- Один пользователь = одна роль. Для смены роли — новый аккаунт.
- Роль `admin` зашита в системе, не создаётся через регистрацию.

---

### 2. Product (Продукт)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID / int PK | |
| name | string, unique | Название продукта |
| calories_per_100g | decimal(8,2) | Калорийность на 100 грамм |
| created_at | datetime | |

**Ограничения:**
- Глобальная база, заполняется администратором платформы.
- В MVP участник не может добавлять продукты.

---

### 3. MarathonTemplate (Марафон-шаблон)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID / int PK | |
| mentor_id | FK → User.id | Создатель (роль mentor) |
| title | string | Название марафона |
| description | text | Описание |
| duration_days | int | Длительность в днях |
| status | enum | `draft` → `pending_review` → `approved` |
| created_at | datetime | |
| updated_at | datetime | |

**Статусы:**
- `draft` — ментор создаёт и редактирует
- `pending_review` — отправлен на проверку админу, ментор может редактировать по комментариям
- `approved` — одобрен, доступен для запуска потоков

**Переходы статусов:**
```
draft → pending_review (ментор отправляет на проверку)
pending_review → approved (админ одобряет)
pending_review → draft (ментор снимает с проверки для правки)
```

---

### 4. TemplateDay (День шаблона)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID / int PK | |
| template_id | FK → MarathonTemplate.id | |
| day_number | int | Номер дня (1..N) |
| text_content | text, nullable | Текстовый материал |
| audio_url | string, nullable | Ссылка на аудио |
| video_url | string, nullable | Ссылка на видео |

**Ограничения:**
- Все поля материалов nullable — день может быть пустым.
- `day_number` уникален в рамках шаблона.
- В MVP редактирование шаблона после отправки на проверку — только пока статус `pending_review`.

---

### 5. Stream (Поток)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID / int PK | |
| template_id | FK → MarathonTemplate.id | Шаблон-основа |
| start_date | date | Дата начала |
| status | enum | `open` → `running` → `finished` |
| created_at | datetime | |

**Статусы:**
- `open` — набор участников, до start_date
- `running` — start_date наступила, марафон идёт
- `finished` — все дни пройдены (start_date + duration_days)

**Автоматические переходы:**
```
open → running (по start_date)
running → finished (по start_date + duration_days)
```

---

### 6. StreamEnrollment (Запись на поток)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID / int PK | |
| stream_id | FK → Stream.id | |
| participant_id | FK → User.id | Участник (роль participant) |
| enrolled_at | datetime | Дата записи |

**Ограничения:**
- Запись только до start_date потока.
- Один участник — одна запись на поток (уникальность stream_id + participant_id).

---

### 7. DailyReport (Отчёт за день)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID / int PK | |
| enrollment_id | FK → StreamEnrollment.id | |
| day_number | int | Номер дня (1..N) |
| total_calories | decimal(10,2) | Автоматический расчёт |
| filled_at | datetime | Первое заполнение |
| updated_at | datetime | Последнее обновление |

**Ограничения:**
- Уникальность enrollment_id + day_number.
- Отчёт можно редактировать неограниченное количество раз.
- День доступен для заполнения, если day_number ≤ текущий день потока по таймзоне участника.

---

### 8. ReportLine (Строка отчёта)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID / int PK | |
| report_id | FK → DailyReport.id | |
| product_id | FK → Product.id | |
| weight_grams | decimal(8,2) | Вес в граммах |
| line_calories | decimal(10,2) | Автоматический расчёт: weight_grams × calories_per_100g / 100 |

**Расчёт:**
```
line_calories = weight_grams × Product.calories_per_100g / 100
DailyReport.total_calories = SUM(ReportLine.line_calories)
```

---

### 9. StreamRating (Рейтинг потока)

| Поле | Тип | Описание |
|------|-----|----------|
| id | UUID / int PK | |
| stream_id | FK → Stream.id | |
| participant_id | FK → User.id | |
| filled_days | int | Количество заполненных дней |
| discipline_percent | decimal(5,2) | Процент: filled_days / Stream.duration_days × 100 |
| rank | int | Место в рейтинге потока |
| calculated_at | datetime | Дата последнего расчёта |

**Расчёт:**
```
discipline_percent = filled_days / template.duration_days × 100
rank = место по убыванию discipline_percent (при равенстве — по filled_days, затем по enrolled_at)
```

**Обновление:** раз в сутки (cron-задача).

---

## Диаграмма связей (текстовая)

```
User (1) ───< (N) MarathonTemplate
                │
                └──< (N) TemplateDay

MarathonTemplate (1) ───< (N) Stream
                              │
                              └──< (N) StreamEnrollment
                                        │
                                        ├── (N) DailyReport
                                        │         │
                                        │         └──< (N) ReportLine
                                        │                   │
                                        │                   └── (N) Product
                                        │
                                        └── (N) StreamRating

Stream (1) ───< (N) StreamRating
```

## Индексы

| Таблица | Поля | Причина |
|---------|------|---------|
| User | email | Уникальность, вход |
| Product | name | Поиск по первым буквам |
| MarathonTemplate | mentor_id, status | Фильтр ментором и админом |
| TemplateDay | template_id, day_number | Уникальность дня в шаблоне |
| Stream | template_id, status | Фильтр потоков |
| Stream | start_date, status | Публичный список (только open) |
| StreamEnrollment | stream_id, participant_id | Уникальность записи |
| DailyReport | enrollment_id, day_number | Уникальность отчёта за день |
| StreamRating | stream_id, discipline_percent | Сортировка рейтинга |
