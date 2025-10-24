#!/usr/bin/env node
/**
 * Health Check Script para LOBBA PWA
 * Verifica el estado de todos los servicios y dependencias
 * Uso: node scripts/check-health.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

const { red, green, yellow, blue, bright, reset } = colors;

console.log(`\n${bright}🏥 LOBBA PWA - Health Check${reset}`);
console.log('='.repeat(60));
console.log('');

let allHealthy = true;

/**
 * Ejecuta comando y retorna true si exitoso
 */
function checkCommand(command, silentError = true) {
  try {
    execSync(command, { stdio: silentError ? 'ignore' : 'inherit' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica si un archivo existe
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Lee variable de .env
 */
function getEnvVar(filePath, varName) {
  if (!fileExists(filePath)) return null;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(new RegExp(`^${varName}=(.*)$`, 'm'));
    return match ? match[1].trim() : null;
  } catch (error) {
    return null;
  }
}

/**
 * Imprime resultado de check
 */
function printCheck(name, status, message = '') {
  const icon = status ? `${green}✅` : `${red}❌`;
  const statusText = status ? 'OK' : 'FAIL';
  console.log(`${icon} ${name.padEnd(30)} [${statusText}]${reset} ${message}`);
  
  if (!status) allHealthy = false;
}

console.log(`${bright}1️⃣  Sistema${reset}`);
console.log('-'.repeat(60));

const nodeVersion = checkCommand('node -v');
if (nodeVersion) {
  const version = execSync('node -v').toString().trim();
  printCheck('Node.js', true, version);
} else {
  printCheck('Node.js', false, 'No instalado');
}

const npmVersion = checkCommand('npm -v');
if (npmVersion) {
  const version = execSync('npm -v').toString().trim();
  printCheck('npm', true, `v${version}`);
} else {
  printCheck('npm', false, 'No instalado');
}

console.log('');

console.log(`${bright}2️⃣  Servicios Externos${reset}`);
console.log('-'.repeat(60));

const psqlInstalled = checkCommand('psql --version');
printCheck('PostgreSQL CLI', psqlInstalled, psqlInstalled ? '' : 'Instalar PostgreSQL');

const redisInstalled = checkCommand('redis-cli --version');
if (redisInstalled) {
  const redisRunning = checkCommand('redis-cli ping');
  printCheck('Redis instalado', true, '');
  printCheck('Redis corriendo', redisRunning, redisRunning ? '' : 'Ejecutar: redis-server');
} else {
  printCheck('Redis instalado', false, 'Instalar Redis');
  printCheck('Redis corriendo', false, 'Redis no instalado');
}

console.log('');

console.log(`${bright}3️⃣  Estructura del Proyecto${reset}`);
console.log('-'.repeat(60));

const projectRoot = path.join(__dirname, '..');
const backendPath = path.join(projectRoot, 'backend');

printCheck('Directorio backend/', fs.existsSync(backendPath));
printCheck('Directorio backend/src/', fs.existsSync(path.join(backendPath, 'src')));
printCheck('Directorio backend/database/', fs.existsSync(path.join(backendPath, 'database')));
printCheck('package.json (root)', fileExists(path.join(projectRoot, 'package.json')));
printCheck('package.json (backend)', fileExists(path.join(backendPath, 'package.json')));

console.log('');

console.log(`${bright}4️⃣  Dependencias (Backend)${reset}`);
console.log('-'.repeat(60));

const backendPackageJson = path.join(backendPath, 'package.json');
if (fileExists(backendPackageJson)) {
  const pkg = JSON.parse(fs.readFileSync(backendPackageJson, 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  const criticalDeps = [
    'express',
    'pg',
    'twilio',
    '@sendgrid/mail',
    'redis',
    'ioredis',
    'bull',
    'jsonwebtoken',
    'bcryptjs',
    'socket.io',
  ];
  
  criticalDeps.forEach(dep => {
    const installed = deps.hasOwnProperty(dep);
    printCheck(dep, installed, installed ? `v${deps[dep]}` : 'No instalado');
  });
} else {
  printCheck('package.json backend', false, 'No encontrado');
}

console.log('');

console.log(`${bright}5️⃣  Configuración (.env Backend)${reset}`);
console.log('-'.repeat(60));

const envPath = path.join(backendPath, '.env');
const envExamplePath = path.join(backendPath, '.env.example');

printCheck('.env.example', fileExists(envExamplePath));
printCheck('.env', fileExists(envPath), fileExists(envPath) ? '' : 'Crear desde .env.example');

if (fileExists(envPath)) {
  const criticalVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT',
  ];
  
  const optionalVars = [
    'REDIS_URL',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_WHATSAPP_NUMBER',
    'SENDGRID_API_KEY',
    'EMAIL_FROM',
  ];
  
  console.log(`\n  ${bright}Variables Críticas:${reset}`);
  criticalVars.forEach(varName => {
    const value = getEnvVar(envPath, varName);
    const exists = value && value.length > 0;
    printCheck(`  ${varName}`, exists, exists ? '(configurado)' : 'FALTA');
  });
  
  console.log(`\n  ${bright}Variables Nuevas (Twilio/SendGrid/Redis):${reset}`);
  optionalVars.forEach(varName => {
    const value = getEnvVar(envPath, varName);
    const exists = value && value.length > 0;
    const icon = exists ? `${green}✅` : `${yellow}⚠️`;
    const status = exists ? 'Configurado' : 'Pendiente';
    console.log(`${icon} ${varName.padEnd(30)} [${status}]${reset}`);
  });
}

console.log('');

console.log(`${bright}6️⃣  Instalación de Módulos${reset}`);
console.log('-'.repeat(60));

printCheck('node_modules/ (root)', fs.existsSync(path.join(projectRoot, 'node_modules')));
printCheck('node_modules/ (backend)', fs.existsSync(path.join(backendPath, 'node_modules')));

console.log('');

console.log(`${bright}7️⃣  Base de Datos${reset}`);
console.log('-'.repeat(60));

const migrationsPath = path.join(backendPath, 'database', 'migrations');
if (fs.existsSync(migrationsPath)) {
  const migrations = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql'));
  printCheck('Migraciones encontradas', migrations.length > 0, `${migrations.length} archivos`);
} else {
  printCheck('Directorio migrations/', false, 'No encontrado');
}

console.log('');

console.log('='.repeat(60));
if (allHealthy) {
  console.log(`${green}${bright}✅ Sistema saludable - Todos los checks pasaron${reset}\n`);
} else {
  console.log(`${yellow}${bright}⚠️  Algunos checks fallaron - Revisa los errores arriba${reset}\n`);
  console.log(`${bright}Recomendaciones:${reset}`);
  console.log(`  1. Ejecuta: ${green}npm install${reset} (root y backend)`);
  console.log(`  2. Copia: ${green}cp backend/.env.example backend/.env${reset}`);
  console.log(`  3. Edita: ${green}backend/.env${reset} con tus credenciales`);
  console.log(`  4. Genera secretos: ${green}node scripts/generate-secrets.js${reset}`);
  console.log(`  5. Inicia Redis: ${green}redis-server${reset}`);
  console.log(`  6. Ejecuta migraciones según documentación\n`);
}

process.exit(allHealthy ? 0 : 1);
