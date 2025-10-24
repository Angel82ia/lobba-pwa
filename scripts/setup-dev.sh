#!/bin/bash

set -e  # Exit on error

echo "🚀 LOBBA PWA - Setup Entorno de Desarrollo"
echo "==========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📁 Directorio del proyecto: $PROJECT_ROOT"
echo ""

echo "1️⃣  Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "   Instala Node.js 18+ desde: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js instalado: $NODE_VERSION${NC}"
echo ""

echo "2️⃣  Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm instalado: v$NPM_VERSION${NC}"
echo ""

echo "3️⃣  Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL CLI no encontrado${NC}"
    echo "   Asegúrate de tener PostgreSQL instalado y corriendo"
    echo "   Instalación: https://www.postgresql.org/download/"
else
    PSQL_VERSION=$(psql --version)
    echo -e "${GREEN}✅ PostgreSQL instalado: $PSQL_VERSION${NC}"
fi
echo ""

echo "4️⃣  Verificando Redis..."
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠️  Redis CLI no encontrado${NC}"
    echo "   Redis es REQUERIDO para esta versión"
    echo "   Instalación:"
    echo "     • macOS:   brew install redis"
    echo "     • Ubuntu:  sudo apt install redis-server"
    echo "     • Windows: https://redis.io/docs/getting-started/installation/install-redis-on-windows/"
    echo ""
    read -p "¿Continuar sin Redis? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    REDIS_VERSION=$(redis-cli --version)
    echo -e "${GREEN}✅ Redis instalado: $REDIS_VERSION${NC}"
    
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✅ Redis está corriendo${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis no está corriendo${NC}"
        echo "   Inicia Redis con: redis-server"
    fi
fi
echo ""

echo "5️⃣  Instalando dependencias del Backend..."
cd "$PROJECT_ROOT/backend"

if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ Dependencias del backend instaladas${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules ya existe, ejecutando npm install por si acaso...${NC}"
    npm install
fi
echo ""

echo "6️⃣  Instalando dependencias del Frontend..."
cd "$PROJECT_ROOT"

if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✅ Dependencias del frontend instaladas${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules ya existe, ejecutando npm install por si acaso...${NC}"
    npm install
fi
echo ""

echo "7️⃣  Configurando .env del Backend..."
cd "$PROJECT_ROOT/backend"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Archivo .env creado desde .env.example${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANTE: Edita backend/.env con tus credenciales${NC}"
        echo ""
        echo "   Para generar secretos seguros, ejecuta:"
        echo "   ${GREEN}node scripts/generate-secrets.js${NC}"
    else
        echo -e "${RED}❌ .env.example no encontrado${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  .env ya existe, no se sobrescribirá${NC}"
fi
echo ""

echo "8️⃣  Verificación de Base de Datos..."
echo -e "${YELLOW}⚠️  Debes crear la base de datos manualmente si no existe:${NC}"
echo ""
echo "   Ejecuta en PostgreSQL:"
echo "   ${GREEN}CREATE DATABASE lobba_dev;${NC}"
echo "   ${GREEN}CREATE USER lobba_user WITH PASSWORD 'your_password';${NC}"
echo "   ${GREEN}GRANT ALL PRIVILEGES ON DATABASE lobba_dev TO lobba_user;${NC}"
echo ""
read -p "¿Ya creaste la base de datos? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Crea la base de datos antes de continuar${NC}"
fi
echo ""

echo "9️⃣  ¿Ejecutar migraciones de base de datos?"
read -p "Esto creará/actualizará las tablas (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd "$PROJECT_ROOT/backend"
    if [ -f "scripts/run-migrations.js" ]; then
        node scripts/run-migrations.js
        echo -e "${GREEN}✅ Migraciones ejecutadas${NC}"
    else
        echo -e "${YELLOW}⚠️  Script de migraciones no encontrado${NC}"
        echo "   Ejecuta las migraciones manualmente desde database/migrations/"
    fi
fi
echo ""

echo "=========================================="
echo "✅ Setup completado con éxito!"
echo "=========================================="
echo ""
echo "📋 Siguientes pasos:"
echo ""
echo "1. Edita backend/.env con tus credenciales:"
echo "   ${GREEN}nano backend/.env${NC}"
echo ""
echo "2. Genera secretos seguros:"
echo "   ${GREEN}node scripts/generate-secrets.js${NC}"
echo ""
echo "3. Inicia Redis (si no está corriendo):"
echo "   ${GREEN}redis-server${NC}"
echo ""
echo "4. Inicia el Backend:"
echo "   ${GREEN}cd backend && npm run dev${NC}"
echo ""
echo "5. En otra terminal, inicia el Frontend:"
echo "   ${GREEN}npm run dev${NC}"
echo ""
echo "6. Accede a la aplicación:"
echo "   ${GREEN}http://localhost:5173${NC}"
echo ""
echo "🔍 Para verificar el estado del sistema:"
echo "   ${GREEN}node scripts/check-health.js${NC}"
echo ""
echo "📚 Documentación completa en: README.md"
echo ""
