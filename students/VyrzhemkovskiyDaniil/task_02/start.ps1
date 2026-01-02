# PowerShell скрипт для запуска проекта через Docker Compose

Write-Host "🚀 Запуск Sports Venues Platform..." -ForegroundColor Green

# Проверка наличия .env файла
if (-not (Test-Path .env)) {
    Write-Host "⚠️  Файл .env не найден. Создаём из .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Файл .env создан. Проверьте настройки перед запуском." -ForegroundColor Green
}

# Остановить и удалить старые контейнеры
Write-Host "🧹 Очистка старых контейнеров..." -ForegroundColor Cyan
docker-compose down

# Запустить все сервисы
Write-Host "🏗️  Сборка и запуск контейнеров..." -ForegroundColor Cyan
docker-compose up --build -d

# Ожидание запуска сервисов
Write-Host "⏳ Ожидание запуска сервисов..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Проверка статуса
Write-Host ""
Write-Host "📊 Статус контейнеров:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "✅ Проект запущен!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Доступные сервисы:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173"
Write-Host "  Backend:   http://localhost:3000"
Write-Host "  API Docs:  http://localhost:3000/api"
Write-Host "  Database:  localhost:5432"
Write-Host ""
Write-Host "📝 Тестовые пользователи:" -ForegroundColor Cyan
Write-Host "  Admin:  admin@example.com / admin123"
Write-Host "  User:   user1@example.com / password123"
Write-Host ""
Write-Host "💡 Полезные команды:" -ForegroundColor Cyan
Write-Host "  docker-compose logs -f        # Просмотр логов"
Write-Host "  docker-compose down           # Остановить проект"
Write-Host "  docker-compose down -v        # Остановить и удалить данные"
Write-Host ""
