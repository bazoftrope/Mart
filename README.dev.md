# Разработка FoodMart

## 🚀 Быстрый старт

### 1. Установить зависимости

```bash
cd frontend
npm install
```

### 2. Создать .env

```bash
cd frontend
cat > .env << 'EOF'
VITE_POCKETBASE_URL=https://185.72.145.228
EOF
```

### 3. Запустить dev-сервер

```bash
cd frontend
npm run dev
```

Открой: **http://localhost:5173**

---

## 📦 Деплой

```bash
# Запушил изменения
git push origin main

# Обновил сервер
./scripts/deploy.sh
```

---

## 🔧 Локальный PocketBase (опционально)

Если нужен локальный бэкенд:

```bash
# Скачать PocketBase для macOS
curl -L https://github.com/pocketbase/pocketbase/releases/download/v0.25.4/pocketbase_0.25.4_darwin_amd64.zip -o pocketbase.zip
unzip pocketbase.zip
rm pocketbase.zip

# Запустить
cd backend
./pocketbase serve
```

И измени `.env`:
```
VITE_POCKETBASE_URL=http://localhost:8090
```

---

## 📁 Структура

```
Mart/
├── frontend/           # Vue приложение
│   ├── src/
│   ├── .env           # Переменные (не в git)
│   └── ...
├── backend/            # PocketBase
│   ├── pb_migrations/  # Миграции
│   └── pb_data/        # БД (не в git)
├── scripts/            # Скрипты
│   ├── setup-server.sh
│   └── deploy.sh
└── README.dev.md       # Этот файл
```

---

## 🌐 Доступы

| Компонент | URL | Логин/Пароль |
|-----------|-----|--------------|
| Фронтенд (dev) | http://localhost:5173 | — |
| Фронтенд (prod) | https://185.72.145.228 | — |
| PocketBase Admin | https://185.72.145.228/_/ | 4433800@gmail.com / lgosdset |

---

## 🆘 Troubleshooting

### Mixed Content ошибка

Проверь `.env`:
```
VITE_POCKETBASE_URL=https://185.72.145.228
```

Перезапусти `npm run dev`.

### Ошибка авторизации

Проверь что PocketBase запущен:
```bash
curl http://localhost:8090/api/health
```

### Сервер не обновляется

```bash
./scripts/deploy.sh
```

Или вручную:
```bash
ssh root@185.72.145.228
cd /var/www/foodmart && git pull origin main
cd frontend && npm run build:prod
cd ../backend && pkill pocketbase && ./pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data &
```
