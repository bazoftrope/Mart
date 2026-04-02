#!/bin/bash

# ============================================
# Настройка сервера FoodMart с нуля
# ============================================

SERVER="185.72.145.228"
USER="root"
PASS="lgosdset"
DEPLOY_DIR="/var/www/foodmart"

echo "🚀 Настройка сервера $SERVER"

# 1. Очистка
echo "📦 Очистка..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    rm -rf $DEPLOY_DIR
    pkill -f pocketbase || true
"

# 2. Клонирование репозитория
echo "📥 Клонирование репозитория..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    cd /var/www
    git clone https://github.com/bazoftrope/Mart.git foodmart
"

# 3. Скачать PocketBase для Linux
echo "📦 Установка PocketBase (Linux)..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    cd $DEPLOY_DIR/backend
    wget -q https://github.com/pocketbase/pocketbase/releases/download/v0.25.4/pocketbase_0.25.4_linux_amd64.zip
    unzip -o pocketbase_0.25.4_linux_amd64.zip
    rm pocketbase_0.25.4_linux_amd64.zip
    chmod +x pocketbase
"

# 4. Установить зависимости фронтенда
echo "📦 Установка зависимостей фронтенда..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    cd $DEPLOY_DIR/frontend
    npm install
"

# 5. Собрать фронтенд
echo "🔨 Сборка фронтенда..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    cd $DEPLOY_DIR/frontend
    npm run build:prod
"

# 6. Настроить nginx
echo "⚙️ Настройка nginx..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    # Создать сертификат
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/app.key \
        -out /etc/ssl/certs/app.crt \
        -subj '/CN=185.72.145.228' \
        -addext 'subjectAltName=IP:185.72.145.228'

    # Конфиг nginx
    cat > /etc/nginx/sites-available/foodmart << 'NGINX'
server {
    listen 443 ssl;
    server_name 185.72.145.228;

    ssl_certificate /etc/ssl/certs/app.crt;
    ssl_certificate_key /etc/ssl/private/app.key;

    location / {
        root /var/www/foodmart/frontend/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8090/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /_/ {
        proxy_pass http://localhost:8090/_/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}

server {
    listen 80;
    server_name 185.72.145.228;
    return 301 https://\$host\$request_uri;
}
NGINX

    # Включить сайт
    ln -sf /etc/nginx/sites-available/foodmart /etc/nginx/sites-enabled/foodmart
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
"

# 7. Запустить PocketBase
echo "🚀 Запуск PocketBase..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    cd $DEPLOY_DIR/backend
    nohup ./pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data > pocketbase.log 2>&1 &
    sleep 2
    
    if curl -s http://localhost:8090/api/health > /dev/null; then
        echo '✅ PocketBase запущен'
    else
        echo '⚠️ PocketBase не запустился'
    fi
"

echo ""
echo "============================================"
echo "✅ СЕРВЕР НАСТРОЕН!"
echo "============================================"
echo "📍 URL: https://185.72.145.228"
echo "🔐 Admin: https://185.72.145.228/_/"
echo ""
echo "Для обновлений теперь используй:"
echo "  ./scripts/deploy.sh"
