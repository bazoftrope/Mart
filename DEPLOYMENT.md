# FoodMart — Инструкция по деплою

## 📁 Структура монорепозитория

```
Mart/
├── frontend/           # Vue приложение
├── backend/            # PocketBase
├── scripts/            # Скрипты
└── DEPLOYMENT.md
```

## 🌐 Доступы

| Компонент | URL | Логин/Пароль |
|-----------|-----|--------------|
| **Сервер** | 185.72.145.228 | root / lgosdset |
| **PocketBase Admin** | https://185.72.145.228/_/ | 4433800@gmail.com / lgosdset |
| **Фронтенд** | https://185.72.145.228 | — |

---

## 🚀 Автоматический деплой (Git)

### Первый раз: настройка сервера

```bash
cd scripts
./setup-server.sh
```

Скрипт:
1. Создаёт bare-репозиторий на сервере (`/root/repo/foodmart.git`)
2. Создаёт post-receive hook
3. Добавляет remote `production`

### Деплой изменений

```bash
git push production main
```

Hook автоматически:
- Проверит изменения (frontend/backend)
- Применит миграции PocketBase (если есть)
- Перезапустит PocketBase (если изменения в бэкенде)
- Соберёт фронтенд (если изменения во фронтенде)
- Перезапустит nginx

---

## 🔧 Ручной деплой

### 1. Подключение к серверу

```bash
sshpass -p 'lgosdset' ssh -o StrictHostKeyChecking=no root@185.72.145.228
```

### 2. Проверка состояния

```bash
# Проверить процессы
ps aux | grep -E 'pocketbase|nginx'

# Проверить PocketBase
curl http://localhost:8090/api/health

# Проверить nginx
nginx -t && systemctl status nginx
```

### 3. Обновление вручную (если Git не работает)

```bash
cd /var/www/foodmart

# Pull изменений
git pull

# Если изменения в бэкенде
cd backend
./pocketbase migrate --dir=./pb_migrations
pkill -f pocketbase
nohup ./pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data > pocketbase.log 2>&1 &

# Если изменения во фронтенде
cd ../frontend
npm install --production
npm run build

# Исправить права
chown -R www-data:www-data /var/www/foodmart
chmod -R 755 /var/www/foodmart

# Перезапустить nginx
nginx -t && systemctl reload nginx
```

---

## 📊 Логи

```bash
# PocketBase
ssh root@185.72.145.228 "tail -50 /var/www/foodmart/backend/pocketbase.log"

# nginx (ошибки)
ssh root@185.72.145.228 "tail -50 /var/log/nginx/error.log"

# nginx (доступ)
ssh root@185.72.145.228 "tail -50 /var/log/nginx/access.log"
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
ssh root@185.72.145.228 "ls -la /var/www/foodmart/"

# Исправить права
ssh root@185.72.145.228 "chown -R www-data:www-data /var/www/foodmart && chmod -R 755 /var/www/foodmart"

# Проверить логи
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

### Git push не работает

```bash
# Проверить remote
git remote -v

# Пересоздать remote
git remote remove production
git remote add production root@185.72.145.228:/root/repo/foodmart.git

# Проверить hook на сервере
ssh root@185.72.145.228 "cat /root/repo/foodmart.git/hooks/post-receive"
```

### Деплой не сработал

```bash
# Посмотреть логи git
ssh root@185.72.145.228 "cat /root/repo/foodmart.git/logs/receive.log"

# Проверить post-receive
ssh root@185.72.145.228 "ls -la /root/repo/foodmart.git/hooks/"
```

---

## 📝 История изменений

| Дата | Что сделано |
|------|-------------|
| 2026-04-02 | Монорепозиторий + Git авто-деплой |
| 2026-03-25 | Деплой на SprintBox (IP: 185.72.145.228) |
| 2026-03-18 | Первоначальная настройка сервера |

---

## 📞 Контакты

- **Репозиторий:** https://github.com/bazoftrope/Mart
