# FoodMart — Инструкция по деплою

## 📦 Что развёрнуто

| Компонент | Версия | Порт | Путь |
|-----------|--------|------|------|
| **PocketBase** | 0.25.4 | 8090 | `/root/app/pocketbase` |
| **Vue Frontend** | 3.5.29 | 443 (nginx) | `/var/www/mart` |
| **nginx** | 1.24.0 | 80, 443 | `/etc/nginx/sites-available/app` |

---

## 🌐 Доступы

### Сервер (SprintBox)
- **IP:** `185.72.145.228`
- **SSH:** `root` / `lgosdset`

### PocketBase Admin
- **URL:** https://185.72.145.228/_/
- **Email:** `4433800@gmail.com`
- **Пароль:** `lgosdset`

### Фронтенд
- **URL:** https://185.72.145.228

---

## 🚀 Быстрый деплой (автоматически)

```bash
cd /Users/bazoftrope/projects/PocketBase
./deploy.sh
```

Скрипт делает:
1. Очищает сервер
2. Загружает PocketBase и миграции
3. Собирает Vue приложение
4. Загружает `dist` на сервер
5. Настраивает nginx
6. Запускает PocketBase

---

## 🔧 Ручной деплой (по шагам)

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

### 3. Обновление PocketBase
```bash
# Остановить текущий процесс
pkill -f pocketbase

# Скачать свежую версию (если нужно)
cd /root/app/pocketbase
curl -L https://github.com/pocketbase/pocketbase/releases/download/v0.25.4/pocketbase_0.25.4_linux_amd64.zip -o pb.zip
unzip -o pb.zip && rm pb.zip
chmod +x pocketbase

# Запустить
nohup ./pocketbase serve --http=0.0.0.0:8090 --dir=/root/app/pocketbase/pb_data > pocketbase.log 2>&1 &

# Проверить
curl http://localhost:8090/api/health
```

### 4. Обновление фронтенда
```bash
# Локально: собрать проект
cd /Users/bazoftrope/projects/Mart
npm run build

# Загрузить на сервер
sshpass -p 'lgosdset' scp -r dist/* root@185.72.145.228:/var/www/mart/

# Исправить права
sshpass -p 'lgosdset' ssh root@185.72.145.228 "chown -R www-data:www-data /var/www/mart && chmod -R 755 /var/www/mart"
```

### 5. Перезапуск nginx
```bash
sshpass -p 'lgosdset' ssh root@185.72.145.228 "nginx -t && systemctl restart nginx"
```

---

## 📁 Структура на сервере

```
/root/app/
├── pocketbase/
│   ├── pocketbase              # Бинарник
│   ├── pb_data/                # База данных
│   ├── pb_migrations/          # Миграции
│   └── pocketbase.log          # Логи
└── vue-app/                    # Старая папка (не используется)

/var/www/mart/                  # Фронтенд
├── index.html
├── favicon.ico
└── assets/
```

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

## 🗄️ Коллекции PocketBase

Миграции находятся в `/root/app/pocketbase/pb_migrations/`:

| Коллекция | Описание |
|-----------|----------|
| `users` | Пользователи (роли: ментор, участник) |
| `marathons` | Марафоны |
| `tasks` | Задания |
| `reports` | Отчёты участников |
| `messages` | Сообщения |

### Применить миграции вручную
```bash
cd /root/app/pocketbase
./pocketbase migrate
```

---

## 📊 Логи

```bash
# PocketBase
ssh root@185.72.145.228 "tail -50 /root/app/pocketbase/pocketbase.log"

# nginx (ошибки)
ssh root@185.72.145.228 "tail -50 /var/log/nginx/error.log"

# nginx (доступ)
ssh root@185.72.145.228 "tail -50 /var/log/nginx/access.log"

# systemd (nginx)
ssh root@185.72.145.228 "journalctl -u nginx --no-pager -n 50"
```

---

## 🛠️ Управление службами

```bash
# Перезапустить nginx
ssh root@185.72.145.228 "systemctl restart nginx"

# Перезапустить PocketBase
ssh root@185.72.145.228 "pkill -f pocketbase && cd /root/app/pocketbase && nohup ./pocketbase serve --http=0.0.0.0:8090 --dir=/root/app/pocketbase/pb_data > pocketbase.log 2>&1 &"

# Проверить статус
ssh root@185.72.145.228 "systemctl status nginx && ps aux | grep pocketbase"
```

---

## 🔑 Суперпользователь

### Создать/обновить
```bash
ssh root@185.72.145.228 "cd /root/app/pocketbase && ./pocketbase superuser upsert EMAIL PASSWORD"
```

### Пример
```bash
./pocketbase superuser upsert 4433800@gmail.com lgosdset
```

---

## 🆘 Troubleshooting

### Ошибка 500 на фронтенде
```bash
# Проверить права
ssh root@185.72.145.228 "ls -la /var/www/mart/"

# Исправить права
ssh root@185.72.145.228 "chown -R www-data:www-data /var/www/mart && chmod -R 755 /var/www/mart"

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
ssh root@185.72.145.228 "cd /root/app/pocketbase && ./pocketbase serve --http=0.0.0.0:8090 --dir=/root/app/pocketbase/pb_data &"
```

### Mixed Content Error
Убедитесь, что `.env` файл содержит:
```
VITE_POCKETBASE_URL=https://185.72.145.228
```

И пересоберите фронтенд:
```bash
cd /Users/bazoftrope/projects/Mart
npm run build
```

---

## 📝 История изменений

| Дата | Что сделано |
|------|-------------|
| 2026-03-25 | Деплой на SprintBox (IP: 185.72.145.228) |
| 2026-03-18 | Первоначальная настройка сервера |

---

## 📞 Контакты

- **Репозиторий Vue:** https://github.com/bazoftrope/Mart
- **Репозиторий PocketBase:** https://github.com/bazoftrope/Mart/tree/main/PocketBase
