#!/bin/bash

# ============================================
# Настройка сервера FoodMart — ОДИН РАЗ
# ============================================

SERVER="185.72.145.228"
USER="root"
PASS="lgosdset"
DEPLOY_DIR="/var/www/foodmart"

echo "🔧 Настройка сервера..."

# 1. Копируем systemd сервис
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    echo '📋 Создаю systemd сервис PocketBase...'
    cat > /etc/systemd/system/pocketbase.service << 'EOF'
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
WorkingDirectory=$DEPLOY_DIR/backend
ExecStart=$DEPLOY_DIR/backend/pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

    # Активируем сервис
    systemctl daemon-reload
    systemctl enable pocketbase

    # 2. Убиваем старые процессы PocketBase
    echo '🔄 Останавливаю старые процессы...'
    pkill -f 'pocketbase serve' 2>/dev/null || true
    sleep 1

    # 3. Запускаем через systemd
    echo '🚀 Запускаю PocketBase через systemd...'
    systemctl start pocketbase
    sleep 2

    if systemctl is-active --quiet pocketbase; then
        echo '✅ PocketBase работает (systemd)'
    else
        echo '⚠️ PocketBase не запустился'
        systemctl status pocketbase --no-pager
    fi

    # 4. nginx — убедиться что раздаёт из правильной папки
    echo '🔄 Проверяю nginx...'
    nginx -t && systemctl reload nginx

    # 5. git — настрой safe directory
    echo '📦 Настраиваю git...'
    cd $DEPLOY_DIR
    git config --global --add safe.directory $DEPLOY_DIR

    echo ''
    echo '============================================'
    echo '✅ СЕРВЕР НАСТРОЕН!'
    echo '============================================'
    echo ''
    echo 'Теперь деплой:'
    echo '  ./scripts/deploy.sh'
"

echo "Готово!"
