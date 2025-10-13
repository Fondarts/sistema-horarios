# Script de inicio para Windows PowerShell
Write-Host "🚀 Iniciando Sistema de Gestión de Horarios..." -ForegroundColor Green
Write-Host ""

# Verificar si Node.js está instalado
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion detectado" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado. Por favor instala Node.js 16+ desde https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Verificar si npm está disponible
try {
    $npmVersion = npm -v
    Write-Host "✅ npm $npmVersion detectado" -ForegroundColor Green
} catch {
    Write-Host "❌ npm no está disponible" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Instalar dependencias si no existen
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

Write-Host "🎯 Usuarios de prueba disponibles:" -ForegroundColor Cyan
Write-Host "   👨‍💼 Encargado: encargado1 / 12345" -ForegroundColor White
Write-Host "   👷 Empleado: empleado1 / 67890" -ForegroundColor White
Write-Host ""

Write-Host "🌐 Iniciando servidor de desarrollo..." -ForegroundColor Yellow
Write-Host "   La aplicación estará disponible en: http://localhost:3000" -ForegroundColor White
Write-Host ""

# Iniciar el servidor de desarrollo
npm start


