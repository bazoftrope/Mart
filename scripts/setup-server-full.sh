#!/bin/bash

# ============================================
# Полная настройка сервера FoodMart с нуля
# ============================================

SERVER="185.72.145.228"
USER="root"
PASS="lgosdset"
DEPLOY_DIR="/var/www/foodmart"
REPO_DIR="/root/repo/foodmart.git"

echo "🚀 Полная настройка сервера $SERVER"

# 1. Очистка
echo "📦 Очистка сервера..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    # Остановить службы
    pkill -f pocketbase || true
    systemctl stop nginx || true
    
    # Удалить старое
    rm -rf $DEPLOY_DIR
    rm -rf $REPO_DIR
    rm -rf /root/app
    
    echo '✅ Сервер очищен'
"

# 2. Установка Node.js
echo "📦 Установка Node.js..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    node --version
    npm --version
    echo '✅ Node.js установлен'
"

# 3. Создание bare-репозитория
echo "📦 Создание Git репозитория..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    mkdir -p $REPO_DIR
    cd $REPO_DIR
    git init --bare
    echo '✅ Репозиторий создан'
"

# 4. Создание post-receive hook
echo "📝 Создание post-receive hook..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    cat > $REPO_DIR/hooks/post-receive << 'HOOK'
#!/bin/bash

DEPLOY_DIR=\"/var/www/foodmart\"
BACKEND_DIR=\"\$DEPLOY_DIR/backend\"
FRONTEND_DIR=\"\$DEPLOY_DIR/frontend\"

echo \"📦 Деплой в \$DEPLOY_DIR...\"

# Checkout изменений
git --work-tree=\$DEPLOY_DIR --git-dir=/root/repo/foodmart.git checkout main -f

# Бэкенд: применить миграции и перезапустить
if [ -d \"\$BACKEND_DIR\" ]; then
    echo \"🔧 Настройка бэкенда...\"
    cd \$BACKEND_DIR
    
    # Применить миграции
    ./pocketbase migrate --dir=./pb_migrations
    
    # Перезапустить PocketBase
    pkill -f pocketbase || true
    sleep 1
    nohup ./pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data > pocketbase.log 2>&1 &
    sleep 2
    
    if curl -s http://localhost:8090/api/health > /dev/null; then
        echo \"✅ PocketBase запущен\"
    else
        echo \"⚠️ PocketBase не запустился\"
    fi
fi

# Фронтенд: собрать
if [ -d \"\$FRONTEND_DIR\" ]; then
    echo \"🎨 Сборка фронтенда...\"
    cd \$FRONTEND_DIR
    
    # Установить зависимости
    npm install --production
    
    # Собрать
    npm run build
    
    echo \"✅ Фронтенд собран\"
fi

# Исправить права
chown -R www-data:www-data \$DEPLOY_DIR
chmod -R 755 \$DEPLOY_DIR

# Настроить nginx
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
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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

    # Создать сертификат (если нет)
    if [ ! -f /etc/ssl/private/app.key ]; then
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\
            -keyout /etc/ssl/private/app.key \\
            -out /etc/ssl/certs/app.crt \\
            -subj '/CN=185.72.145.228' \\
            -addext 'subjectAltName=IP:185.72.145.228'
    fi

    # Включить сайт
    ln -sf /etc/nginx/sites-available/foodmart /etc/nginx/sites-enabled/foodmart
    rm -f /etc/nginx/sites-enabled/default

    # Проверить и перезапустить
    nginx -t && systemctl restart nginx

    echo \"✅ nginx настроен\"
    echo \"\"
    echo \"============================================\"
    echo \"✅ ДЕПЛОЙ ЗАВЕРШЁН!\"
    echo \"============================================\"
    echo \"📍 URL: https://185.72.145.228\"
    echo \"🔐 Admin: https://185.72.145.228/_/\"
HOOK

    chmod +x $REPO_DIR/hooks/post-receive
"

# 5. Добавить remote локально
echo "🔗 Настройка remote..."
cd "$(dirname "$0")"
git remote remove production 2>/dev/null || true
git remote add production root@$SERVER:$REPO_DIR

echo ""
echo "============================================"
echo "✅ СЕРВЕР ГОТОВ!"
echo "============================================"
echo ""
echo "Теперь выполни:"
echo "  git push production main"
echo ""
echo "Это запустит полный деплой (сборку фронтенда и запуск бэкенда)"
