#!/usr/bin/env node
/**
 * Script para generar secretos seguros para .env
 * Uso: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 Generador de Secretos Seguros para LOBBA PWA\n');
console.log('Copia estos valores en tu archivo backend/.env:\n');
console.log('=' .repeat(60));

const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log(`JWT_SECRET=${jwtSecret}`);

const refreshSecret = crypto.randomBytes(32).toString('hex');
console.log(`REFRESH_TOKEN_SECRET=${refreshSecret}`);

const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);

const webhookSecret = crypto.randomBytes(16).toString('hex');
console.log(`WEBHOOK_SECRET=${webhookSecret}`);

const redisPassword = crypto.randomBytes(24).toString('base64');
console.log(`REDIS_PASSWORD=${redisPassword}`);

console.log('=' .repeat(60));
console.log('\n⚠️  IMPORTANTE:');
console.log('   • NO compartas estos secretos públicamente');
console.log('   • NO los subas a Git');
console.log('   • Usa diferentes valores para desarrollo/producción');
console.log('   • Guarda estos valores en un gestor de contraseñas\n');
