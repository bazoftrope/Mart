#!/bin/bash

# ============================================
# Скрипт настройки сервера для FoodMart
# ============================================

SERVER="185.72.145.228"
USER="root"
PASS="lgosdset"
DEPLOY_DIR="/var/www/foodmart"

echo "🔧 Настройка сервера $SERVER для Git-деплоя..."

# 1. Создать bare-репозиторий
echo "📦 Создание bare-репозитория..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    mkdir -p /root/repo/foodmart.git
    cd /root/repo/foodmart.git
    git init --bare
"

# 2. Создать рабочую директорию
echo "📁 Создание рабочей директории..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no $USER@$SERVER "
    mkdir -p $DEPLOY_DIR
"

# 3. Создать post-receive hook
echo "📝 Создание post-receive hook..."
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
BACKEND_CHANGED=false
FRONTEND_CHANGED=false

# Получаем список изменённых файлов
CHANGED_FILES=\$(git --work-tree=\$DEPLOY_DIR --git-dir=/root/repo/foodmart.git diff --name-only HEAD^ HEAD 2>/dev/null || echo \"\")

if echo \"\$CHANGED_FILES\" | grep -q '^backend/'; then
    BACKEND_CHANGED=true
fi

if echo \"\$CHANGED_FILES\" | grep -q '^frontend/'; then
    FRONTEND_CHANGED=true
fi

# Если HEAD^ не существует (первый деплой), проверяем все файлы
if [ -z \"\$CHANGED_FILES\" ]; then
    CHANGED_FILES=\$(git --work-tree=\$DEPLOY_DIR --git-dir=/root/repo/foodmart.git ls-tree -r --name-only HEAD)
    
    if echo \"\$CHANGED_FILES\" | grep -q '^backend/'; then
        BACKEND_CHANGED=true
    fi
    
    if echo \"\$CHANGED_FILES\" | grep -q '^frontend/'; then
        FRONTEND_CHANGED=true
    fi
fi

echo \"Бэкенд изменён: \$BACKEND_CHANGED\"
echo \"Фронтенд изменён: \$FRONTEND_CHANGED\"

# Обновить бэкенд
if [ \"\$BACKEND_CHANGED\" = true ]; then
    echo \"🔧 Изменения в бэкенде...\"
    
    # Применить миграции
    cd \$BACKEND_DIR
    ./pocketbase migrate --dir=./pb_migrations
    
    # Перезапустить PocketBase
    pkill -f pocketbase || true
    sleep 1
    cd \$BACKEND_DIR
    nohup ./pocketbase serve --http=127.0.0.1:8090 --dir=./pb_data > pocketbase.log 2>&1 &
    sleep 2
    
    # Проверить что запустился
    if curl -s http://localhost:8090/api/health > /dev/null; then
        echo \"✅ PocketBase запущен\"
    else
        echo \"⚠️ PocketBase не запустился, проверяем логи...\"
        cat pocketbase.log
    fi
fi

# Обновить фронтенд
if [ \"\$FRONTEND_CHANGED\" = true ]; then
    echo \"🎨 Изменения в фронтенде...\"
    
    cd \$FRONTEND_DIR
    
    # Установить зависимости (если package-lock.json изменился или node_modules нет)
    if [ ! -d \"node_modules\" ] || echo \"\$CHANGED_FILES\" | grep -q '^frontend/package'; then
        echo \"📦 Установка зависимостей...\"
        npm install --production
    fi
    
    # Собрать фронтенд
    echo \"🔨 Сборка фронтенда...\"
    npm run build
    
    echo \"✅ Фронтенд обновлён\"
fi

# Исправить права
chown -R www-data:www-data \$DEPLOY_DIR
chmod -R 755 \$DEPLOY_DIR

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

# 4. Добавить remote
echo "🔗 Добавление remote..."
cd "$(dirname "$0")/.."
git remote remove production 2>/dev/null || true
git remote add production root@$SERVER:/root/repo/foodmart.git

echo ""
echo "============================================"
echo "✅ СЕРВЕР НАСТРОЕН!"
echo "============================================"
echo ""
echo "Теперь для деплоя выполните:"
echo "  git push production main"
echo ""
echo "Или добавьте в package.json:"
echo '  "deploy": "git push production main"'
