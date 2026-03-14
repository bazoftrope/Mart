# FoodMart — Марафон ЗОЖ

## Структура проекта

```
online-marathon-nutrition/
├── .vscode/
│   └── settings.json
├── node_modules/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   └── pocketbase.ts          # PocketBase клиент и хелперы
│   ├── assets/
│   │   └── styles.css             # Глобальные стили (CSS переменные)
│   ├── components/
│   │   ├── CreateEditMarathonModal.vue  # Создание/редактирование марафона
│   │   ├── DashboardStats.vue           # Статистика на дашборде
│   │   └── MarathonList.vue             # Список марафонов (карточки)
│   ├── router/
│   │   └── index.ts               # Vue Router с auth guards
│   ├── stores/
│   │   ├── auth.ts                # Pinia store: авторизация
│   │   └── marathons.ts           # Pinia store: марафоны и задачи
│   ├── types/
│   │   └── index.ts               # TypeScript интерфейсы
│   ├── views/
│   │   ├── AllMarathonsView.vue   # Список всех марафонов
│   │   ├── DashboardView.vue      # Главная страница (дашборд)
│   │   ├── LoginView.vue          # Вход
│   │   ├── MarathonView.vue       # Страница марафона (разная для ментора/участника)
│   │   └── RegisterView.vue       # Регистрация
│   ├── App.vue                    # Корневой компонент с layout
│   └── main.ts                    # Точка входа
├── .gitignore
├── .env                           # Переменные окружения (VITE_POCKETBASE_URL)
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── struct.md                      # Этот файл
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

## Ключевые изменения

### Компоненты
- `CreateEditMarathonModal.vue` — универсальная модалка для создания и редактирования марафона
- `MarathonList.vue` — переиспользуемый список марафонов
- `DashboardStats.vue` — статистика участника/ментора

### Представления
- `AllMarathonsView.vue` — публичный список всех марафонов
- `MarathonView.vue` — страница марафона с визуальным отличием для ментора (синяя шапка)

### Stores
- `auth.ts` — логин, регистрация, выход, восстановление сессии
- `marathons.ts` — CRUD марафонов, задачи, участие в марафоне

### API
- `pocketbase.ts` — клиент PocketBase, коллекции, хелперы

## Роли пользователей

| Роль | Возможности |
|------|-------------|
| **Ментор** | Создание марафонов, редактирование, добавление заданий, проверка отчётов |
| **Участник** | Просмотр марафонов, участие, сдача отчётов |

## Технологический стек

- **Frontend:** Vue 3 + TypeScript + Vite
- **State:** Pinia
- **Router:** Vue Router 5
- **Backend:** PocketBase
- **UI:** Кастомные стили (CSS переменные)
