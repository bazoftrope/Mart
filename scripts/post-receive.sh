#!/bin/bash

# ============================================
# Post-receive hook для авто-деплоя FoodMart
# ============================================

SERVER="185.72.145.228"
USER="root"
PASS="lgosdset"
DEPLOY_DIR="/var/www/foodmart"

echo "🚀 Начало деплоя на $SERVER"

# Создать bare-репозиторий на сервере (если нет)
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    mkdir -p /root/repo/foodmart.git
    cd /root/repo/foodmart.git
    git init --bare
"

# Создать рабочую директорию
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    mkdir -p $DEPLOY_DIR
"

# Создать post-receive hook
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    cat > /root/repo/foodmart.git/hooks/post-receive << 'HOOK'
#!/bin/bash

DEPLOY_DIR=\"/var/www/foodmart\"
BACKEND_DIR=\"\$DEPLOY_DIR/backend\"
FRONTEND_DIR=\"\$DEPLOY_DIR/frontend\"

echo \"📦 Деплой в \$DEPLOY_DIR...\"

# Checkout изменений
git --work-tree=\$DEPLOY_DIR --git-dir=/root/repo/foodmart.git checkout -f

# Проверить изменения в бэкенде
if git --work-tree=\$DEPLOY_DIR --git-dir=/root/repo/foodmart.git diff --name-only HEAD^ HEAD | grep -q '^backend/'; then
    echo \"🔧 Изменения в бэкенде...\"
    
    # Применить миграции
    cd \$BACKEND_DIR
    ./pocketbase migrate --dir=./pb_migrations
    
    # Перезапустить PocketBase
    pkill -f pocketbase || true
    cd \$BACKEND_DIR
    nohup ./pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data > pocketbase.log 2>&1 &
    sleep 2
    
    echo \"✅ Бэкенд обновлён\"
fi

# Проверить изменения во фронтенде
if git --work-tree=\$DEPLOY_DIR --git-dir=/root/repo/foodmart.git diff --name-only HEAD^ HEAD | grep -q '^frontend/'; then
    echo \"🎨 Изменения в фронтенде...\"
    
    cd \$FRONTEND_DIR
    
    # Установить зависимости (если package-lock.json изменился)
    if git --work-tree=\$DEPLOY_DIR --git-dir=/root/repo/foodmart.git diff --name-only HEAD^ HEAD | grep -q '^frontend/package'; then
        echo \"📦 Установка зависимостей...\"
        npm install --production
    fi
    
    # Собрать фронтенд
    echo \"🔨 Сборка фронтенда...\"
    npm run build
    
    # Исправить права
    chown -R www-data:www-data \$DEPLOY_DIR
    chmod -R 755 \$DEPLOY_DIR
    
    echo \"✅ Фронтенд обновлён\"
fi

# Перезапустить nginx (для обновления кэша)
nginx -t && systemctl reload nginx

echo \"\"
echo \"============================================\"
echo \"✅ ДЕПЛОЙ ЗАВЕРШЁН!\"
echo \"============================================\"
echo \"📍 URL: https://185.72.145.228\"
echo \"🔐 Admin: https://185.72.145.228/_/\"
HOOK

    chmod +x /root/repo/foodmart.git/hooks/post-receive
"

echo "✅ Post-receive hook создан"
echo ""
echo "Теперь добавьте remote на сервере:"
echo "  git remote add production root@$SERVER:/root/repo/foodmart.git"
echo ""
echo "И для деплоя просто сделайте:"
echo "  git push production main"
