# FoodMart — Инструкция по деплою

## 📁 Структура

```
Mart/
├── frontend/           # Vue приложение
├── backend/            # PocketBase
├── scripts/            # Скрипты
│   └── deploy.sh       # Деплой на сервер
└── DEPLOYMENT.md
```

## 🌐 Доступы

| Компонент | URL | Логин/Пароль |
|-----------|-----|--------------|
| **Сервер** | 185.72.145.228 | root / lgosdset |
| **PocketBase Admin** | https://185.72.145.228/_/ | 4433800@gmail.com / lgosdset |
| **Фронтенд** | https://185.72.145.228 | — |

---

## 🚀 Быстрый деплой (одной командой)

```bash
./scripts/deploy.sh
```

Скрипт сам:
1. Подключится к серверу
2. Сделаем `git pull`
3. Соберёт фронтенд
4. Перезапустит PocketBase
5. Перезапустит nginx

---

## 🔧 Ручной деплой (по шагам)

### 1. Зайти на сервер

```bash
ssh root@185.72.145.228
# пароль: lgosdset
```

### 2. Обновить код

```bash
cd /var/www/foodmart
git pull origin main
```

### 3. Собрать фронтенд

```bash
cd /var/www/foodmart/frontend
npm run build:prod
```

### 4. Перезапустить PocketBase

```bash
cd /var/www/foodmart/backend
pkill pocketbase || true
nohup ./pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data > pocketbase.log 2>&1 &
```

### 5. Перезапустить nginx

```bash
nginx -t && systemctl reload nginx
```

### 6. Выйти

```bash
exit
```

---

## 📊 Логи

```bash
# PocketBase
ssh root@185.72.145.228 "tail -50 /var/www/foodmart/backend/pocketbase.log"

# nginx (ошибки)
ssh root@185.72.145.228 "tail -50 /var/log/nginx/error.log"
```

---

## 🛠️ Управление службами

```bash
# Перезапустить nginx
ssh root@185.72.145.228 "systemctl restart nginx"

# Перезапустить PocketBase
ssh root@185.72.145.228 "
    pkill -f pocketbase
    cd /var/www/foodmart/backend
    nohup ./pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data > pocketbase.log 2>&1 &
"

# Проверить статус
ssh root@185.72.145.228 "systemctl status nginx && ps aux | grep pocketbase"
```

---

## 🗄️ Коллекции PocketBase

Миграции в `backend/pb_migrations/`:

| Коллекция | Описание |
|-----------|----------|
| `users` | Пользователи (роли: ментор, участник) |
| `marathons` | Марафоны |
| `tasks` | Задания |
| `reports` | Отчёты участников |
| `messages` | Сообщения |

---

## 🔐 SSL сертификат

Самоподписанный сертификат (обновляется раз в год):

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/app.key \
    -out /etc/ssl/certs/app.crt \
    -subj '/CN=185.72.145.228' \
    -addext 'subjectAltName=IP:185.72.145.228'
```

⚠️ Браузер будет показывать предупреждение — это нормально.

---

## 🆘 Troubleshooting

### Ошибка 500 на фронтенде

```bash
# Проверить права
ssh root@185.72.145.228 "ls -la /var/www/foodmart/frontend/dist/"

# Исправить права
ssh root@185.72.145.228 "chown -R www-data:www-data /var/www/foodmart && chmod -R 755 /var/www/foodmart"

# Проверить логи nginx
ssh root@185.72.145.228 "tail -20 /var/log/nginx/error.log"
```

### PocketBase не запускается

```bash
# Проверить порт
ssh root@185.72.145.228 "netstat -tlnp | grep 8090"

# Убить зависший процесс
ssh root@185.72.145.228 "pkill -f pocketbase"

# Запустить заново
ssh root@185.72.145.228 "
    cd /var/www/foodmart/backend
    ./pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data &
"
```

### Фронтенд не собирается

```bash
# Зайти на сервер
ssh root@185.72.145.228

# Перейти в папку
cd /var/www/foodmart/frontend

# Установить зависимости заново
rm -rf node_modules package-lock.json
npm install

# Собрать
npm run build:prod
```

---

## 📝 Рабочий процесс

```
┌─────────────────────────────────────────────────────────┐
│  1. Внёс изменения в код                               │
│  2. git add . && git commit -m "fix: что-то"          │
│  3. git push origin main                               │
│  4. ./scripts/deploy.sh  ← деплой на сервер            │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 История изменений

| Дата | Что сделано |
|------|-------------|
| 2026-04-02 | Простой деплой через deploy.sh |
| 2026-03-25 | Деплой на SprintBox (IP: 185.72.145.228) |
| 2026-03-18 | Первоначальная настройка сервера |

---

## 📞 Контакты

- **Репозиторий:** https://github.com/bazoftrope/Mart
