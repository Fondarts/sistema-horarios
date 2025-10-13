#!/bin/bash

echo "🚀 Iniciando Sistema de Gestión de Horarios..."
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instala Node.js 16+ desde https://nodejs.org"
    exit 1
fi

# Verificar versión de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Se requiere Node.js 16 o superior. Versión actual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Verificar si npm está disponible
if ! command -v npm &> /dev/null; then
    echo "❌ npm no está disponible"
    exit 1
fi

echo "✅ npm $(npm -v) detectado"
echo ""

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    echo ""
fi

echo "🎯 Usuarios de prueba disponibles:"
echo "   👨‍💼 Encargado: encargado1 / 12345"
echo "   👷 Empleado: empleado1 / 67890"
echo ""

echo "🌐 Iniciando servidor de desarrollo..."
echo "   La aplicación estará disponible en: http://localhost:3000"
echo ""

# Iniciar el servidor de desarrollo
npm start


