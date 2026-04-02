# FoodMart — Деплой

## 🌐 Доступы

| Компонент | URL | Логин/Пароль |
|-----------|-----|--------------|
| **Сервер** | 185.72.145.228 | root / lgosdset |
| **PocketBase Admin** | https://185.72.145.228/_/ | 4433800@gmail.com / lgosdset |
| **Фронтенд** | https://185.72.145.228 | — |

---

## 🚀 Первый раз: настройка сервера

```bash
./scripts/setup-server.sh
```

Скрипт:
1. Очистит сервер
2. Склонирует репозиторий
3. Скачает PocketBase для Linux
4. Установит зависимости
5. Соберёт фронтенд
6. Настроит nginx
7. Запустит PocketBase

---

## 🔄 Деплой обновлений

```bash
# 1. Запушил изменения в GitHub
git push origin main

# 2. Задеплоил на сервер
./scripts/deploy.sh
```

Всё! Скрипт сам:
- Pull изменений
- Сборка фронтенда
- Перезапуск PocketBase
- Перезапуск nginx

---

## 🔧 Ручное управление

```bash
# Зайти на сервер
ssh root@185.72.145.228
# пароль: lgosdset

# Pull
cd /var/www/foodmart && git pull origin main

# Сборка
cd frontend && npm run build:prod

# PocketBase
cd ../backend && pkill pocketbase && ./pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data &

# nginx
nginx -t && systemctl reload nginx
```

---

## 📊 Логи

```bash
# PocketBase
ssh root@185.72.145.228 "tail -f /var/www/foodmart/backend/pocketbase.log"

# nginx
ssh root@185.72.145.228 "tail -f /var/log/nginx/error.log"
```
