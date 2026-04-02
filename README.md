# FoodMart

Монорепозиторий: Vue 3 frontend + PocketBase backend

## 📁 Структура

```
Mart/
├── frontend/           # Vue 3 приложение
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
├── backend/            # PocketBase
│   ├── pocketbase      # Бинарник
│   ├── pb_migrations/  # Миграции
│   └── pb_data/        # БД (не в git)
├── scripts/            # Скрипты деплоя
│   ├── setup-server.sh
│   └── post-receive.sh
└── DEPLOYMENT.md       # Инструкция по деплою
```

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
# Frontend
cd frontend && npm install

# Backend (локально)
cd ../backend && ./pocketbase serve
```

### 2. Настройка окружения

```bash
# Frontend
cd frontend
cp .env.example .env
# Отредактируйте .env при необходимости
```

### 3. Запуск разработки

```bash
# Терминал 1: Backend
cd backend && ./pocketbase serve

# Терминал 2: Frontend
cd frontend && npm run dev
```

Frontend: http://localhost:5173  
PocketBase Admin: http://localhost:8090/_/

## 📦 Деплой

### Первый раз: настройка сервера

```bash
cd scripts
./setup-server.sh
```

### Деплой изменений

```bash
git push production main
```

Или:
```bash
npm run deploy
```

## 🔧 Ручное управление

### PocketBase миграции

```bash
cd backend
./pocketbase migrate
```

### Создать суперпользователя

```bash
cd backend
./pocketbase superuser upsert email@example.com password
```

## 📚 Документация

- [DEPLOYMENT.md](./DEPLOYMENT.md) — полная инструкция по деплою
- [PocketBase Docs](https://pocketbase.io/docs/)
- [Vue 3 Docs](https://vuejs.org/)

## 🛠️ Стек

- **Frontend:** Vue 3, Vite, Pinia, Vue Router, TypeScript
- **Backend:** PocketBase 0.25.4
- **Server:** nginx, SSL (самоподписанный)
