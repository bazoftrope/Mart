#!/bin/bash

# ============================================
# Деплой обновлений FoodMart
# ============================================

SERVER="185.72.145.228"
USER="root"
PASS="lgosdset"
DEPLOY_DIR="/var/www/foodmart"

echo "🚀 Деплой на $SERVER"

# 1. Pull — с обработкой конфликтов
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    echo '📦 Pull изменений...'
    cd $DEPLOY_DIR

    # Если есть конфликты — сбрасываем локальные изменения
    git stash --include-untracked 2>/dev/null || true
    git pull origin main

    if [ \$? -ne 0 ]; then
        echo '❌ Git pull failed even after stash'
        exit 1
    fi

    # 2. Сборка фронтенда
    echo '🔨 Сборка фронтенда...'
    cd $DEPLOY_DIR/frontend
    npm run build:prod

    if [ \$? -ne 0 ]; then
        echo '❌ Build failed'
        exit 1
    fi

    # 3. Миграции PocketBase
    echo '📋 Миграции...'
    cd $DEPLOY_DIR/backend
    ./pocketbase migrate 2>&1

    # 4. Перезапуск PocketBase (systemd)
    echo '🔄 Перезапуск PocketBase...'
    systemctl restart pocketbase

    sleep 2
    if curl -s http://127.0.0.1:8090/api/health > /dev/null; then
        echo '✅ PocketBase запущен'
    else
        echo '⚠️ PocketBase не запустился!'
        systemctl status pocketbase --no-pager
    fi

    # 5. nginx
    echo '🔄 nginx...'
    nginx -t && systemctl reload nginx

    echo ''
    echo '============================================'
    echo '✅ ДЕПЛОЙ ЗАВЕРШЁН!'
    echo '============================================'
    echo '📍 URL: https://185.72.145.228'
"

echo "Готово!"
