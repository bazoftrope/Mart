#!/bin/bash

# ============================================
# Скрипт деплоя FoodMart на сервер
# ============================================

SERVER="185.72.145.228"
USER="root"
PASS="lgosdset"

echo "🚀 Деплой на $SERVER"

sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no -o RequestTTY=no $USER@$SERVER "
    echo '📦 Pull изменений...'
    cd /var/www/foodmart
    git pull origin main

    echo '🔨 Сборка фронтенда...'
    cd /var/www/foodmart/frontend
    npm run build:prod

    echo '🔄 Перезапуск PocketBase...'
    cd /var/www/foodmart/backend
    pkill pocketbase || true
    sleep 1
    nohup ./pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data > pocketbase.log 2>&1 &
    sleep 2

    if curl -s http://localhost:8090/api/health > /dev/null; then
        echo '✅ PocketBase запущен'
    else
        echo '⚠️ PocketBase не запустился, проверяй логи'
    fi

    echo '🔄 Перезапуск nginx...'
    nginx -t && systemctl reload nginx

    echo ''
    echo '============================================'
    echo '✅ ДЕПЛОЙ ЗАВЕРШЁН!'
    echo '============================================'
    echo '📍 URL: https://185.72.145.228'
    echo '🔐 Admin: https://185.72.145.228/_/'
"

echo ""
echo "Готово!"
