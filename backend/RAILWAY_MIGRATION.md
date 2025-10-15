# Guía de Migración de Vercel a Railway

## ¿Por qué Railway?

Railway es mejor para tu backend porque:

- ✅ Soporte completo para WebSockets (Socket.io)
- ✅ Procesos de larga duración sin límites de tiempo
- ✅ Configuración más simple para APIs tradicionales
- ✅ Mejor para aplicaciones con estado
- ✅ Integración perfecta con Supabase

## 🚀 Quick Start - Resumen Rápido

Si ya sabes lo que haces, estos son los pasos esenciales:

1. **Crea proyecto en Supabase** → Copia la `DATABASE_URL` (Connection Pooling)
2. **Crea proyecto en Railway** → Conecta tu repo GitHub
3. **Configura variables de entorno** en Railway:
   - `DATABASE_URL` = URL de Supabase
   - `CORS_ORIGIN` = URL de tu frontend (ej: `https://lobba-pwa.vercel.app,http://localhost:5173`)
   - Copia todas las demás variables de tu `.env` de Vercel
4. **Deploy** → Railway auto-detecta y despliega
5. **Ejecuta migraciones** en terminal de Railway: `npm run migrate`
6. **Actualiza frontend** con nueva URL del backend de Railway

✅ **Listo!** Tu backend estará corriendo en Railway + Supabase.

---

## Paso 1: Preparar Railway

1. **Crear cuenta en Railway**
   - Ve a https://railway.app
   - Inicia sesión con tu cuenta de GitHub

2. **Crear nuevo proyecto**
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Autoriza a Railway para acceder a tu repositorio
   - Selecciona el repositorio `lobba-pwa`

## Paso 2: Configurar PostgreSQL con Supabase

### Opción Recomendada: Usar Supabase

1. **Crear proyecto en Supabase**
   - Ve a https://supabase.com
   - Crea una cuenta o inicia sesión
   - Click en "New Project"
   - Rellena los datos:
     - **Name**: lobba-backend (o el nombre que prefieras)
     - **Database Password**: Elige una contraseña segura (¡guárdala!)
     - **Region**: Elige la más cercana a tus usuarios
     - **Pricing Plan**: Free (incluye 500MB de DB, 2GB de transferencia)

2. **Obtener credenciales de conexión**
   - En tu proyecto de Supabase, ve a Settings → Database
   - En la sección "Connection String", encontrarás:
     - **Connection Pooling** (Recomendado para Railway): `postgresql://...@...supabase.co:6543/postgres?pgbouncer=true`
     - **Direct Connection**: `postgresql://...@...supabase.co:5432/postgres`
3. **Usar Connection Pooling (Recomendado)**
   - Para Railway, usa la "Connection string" con **Transaction mode**
   - Copia la URL que incluye el puerto `:6543`
   - Esta opción es mejor para aplicaciones con muchas conexiones

### Ventajas de Supabase:

- ✅ **Plan gratuito generoso**: 500MB DB, 2GB bandwidth, 50MB file storage
- ✅ **Backup automático**: Point-in-time recovery (en planes pagos)
- ✅ **Dashboard visual**: Gestiona datos fácilmente
- ✅ **API REST automática**: Opcional, si la necesitas en el futuro
- ✅ **Realtime subscriptions**: PostgreSQL realtime (opcional)
- ✅ **Storage integrado**: Para archivos si lo necesitas

## Paso 3: Configurar el Servicio Backend

1. **Seleccionar el directorio correcto**
   - En la configuración del servicio, establece:
   - **Root Directory:** `backend`
   - Railway detectará automáticamente que es un proyecto Node.js

2. **Railway ejecutará automáticamente:**
   ```bash
   npm install  # o npm ci
   npm start    # definido en tu package.json
   ```

## Paso 4: Configurar Variables de Entorno

En Railway, ve a tu servicio → "Variables" y agrega:

### ⚠️ Variables MÍNIMAS para que funcione (REQUERIDAS):

Estas son las variables **imprescindibles** para que el backend arranque y funcione básicamente:

```bash
# Base de datos (OBLIGATORIO)
DATABASE_URL=postgresql://tu-conexion-de-supabase

# Entorno (OBLIGATORIO)
NODE_ENV=production
PORT=3000

# CORS (OBLIGATORIO)
CORS_ORIGIN=https://lobba-pwa.vercel.app,https://lobba.es

# JWT (OBLIGATORIO - sin esto el registro/login NO funciona)
JWT_SECRET=genera-un-string-aleatorio-largo-aqui
JWT_REFRESH_SECRET=genera-otro-string-aleatorio-diferente
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=7d
```

**💡 Tip para generar secretos JWT seguros:**
```bash
# Puedes usar esto en tu terminal para generar secretos aleatorios:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Variables COMPLETAS (Opcionales según funcionalidades):

```bash
# ========================================
# BASE DE DATOS - SUPABASE
# ========================================
# Usa la Connection String de Supabase (Connection Pooling - Transaction mode)
# Ejemplo: postgresql://postgres.[tu-proyecto]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DATABASE_URL=tu-connection-string-de-supabase

# Alternativamente, si prefieres variables individuales:
# PGHOST=aws-0-us-east-1.pooler.supabase.com
# PGPORT=6543
# PGUSER=postgres.[tu-proyecto]
# PGPASSWORD=tu-password-de-supabase
# PGDATABASE=postgres

# ========================================
# SERVIDOR
# ========================================
NODE_ENV=production
PORT=3000

# ========================================
# CORS - MUY IMPORTANTE
# ========================================
# Puedes especificar MÚLTIPLES orígenes separados por comas
# Incluye: dominio de producción, previews de Vercel, y localhost para desarrollo local

# Opción 1: Solo producción (más seguro)
# CORS_ORIGIN=https://lobba.com

# Opción 2: Dominio de Vercel
# CORS_ORIGIN=https://lobba-pwa.vercel.app

# Opción 3: Múltiples orígenes (RECOMENDADO para desarrollo y producción)
CORS_ORIGIN=https://lobba.com,https://lobba-pwa.vercel.app,https://lobba-pwa-git-main.vercel.app,http://localhost:5173

# Opción 4: Permitir todos los orígenes (NO RECOMENDADO en producción)
# CORS_ORIGIN=*

# ========================================
# AUTENTICACIÓN
# ========================================
# JWT - IMPORTANTE: Usa secretos diferentes para access y refresh tokens
JWT_SECRET=tu-secreto-jwt-aqui
JWT_REFRESH_SECRET=tu-otro-secreto-jwt-diferente
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
GOOGLE_CALLBACK_URL=https://tu-backend.railway.app/api/auth/google/callback

# ========================================
# PAGOS
# ========================================
# Stripe
STRIPE_SECRET_KEY=tu-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=tu-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=tu-stripe-webhook-secret

# ========================================
# COMUNICACIONES
# ========================================
# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=tu-twilio-account-sid
TWILIO_AUTH_TOKEN=tu-twilio-auth-token
TWILIO_PHONE_NUMBER=tu-twilio-phone-number

# ========================================
# ALMACENAMIENTO
# ========================================
# Cloudinary
CLOUDINARY_CLOUD_NAME=tu-cloudinary-cloud-name
CLOUDINARY_API_KEY=tu-cloudinary-api-key
CLOUDINARY_API_SECRET=tu-cloudinary-api-secret

# ========================================
# INTELIGENCIA ARTIFICIAL
# ========================================
# OpenRouter AI
OPENROUTER_API_KEY=tu-openrouter-api-key

# Perfect Corp (AI Beauty)
PERFECT_CORP_API_KEY=tu-perfect-corp-api-key

# ========================================
# NOTIFICACIONES
# ========================================
# Firebase Admin
FIREBASE_PROJECT_ID=tu-firebase-project-id
FIREBASE_PRIVATE_KEY=tu-firebase-private-key
FIREBASE_CLIENT_EMAIL=tu-firebase-client-email
```

### 📝 Nota sobre DATABASE_URL:

La URL de conexión de Supabase tiene este formato:

```
postgresql://postgres.[proyecto-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Importante:**

- Usa el puerto `:6543` (Connection Pooling) para mejor rendimiento
- Si tienes problemas, prueba con `:5432` (Direct Connection)
- La contraseña es la que elegiste al crear el proyecto en Supabase

### 🌐 Configuración de CORS - Dominios Permitidos

**¿Qué dominio usar en CORS_ORIGIN?**

Depende de dónde esté tu frontend:

#### Escenario 1: Tienes dominio personalizado (lobba.com)

```bash
CORS_ORIGIN=https://lobba.com,http://localhost:5173
```

#### Escenario 2: Solo usas Vercel sin dominio propio

```bash
CORS_ORIGIN=https://lobba-pwa.vercel.app,http://localhost:5173
```

#### Escenario 3: Tienes dominio personalizado + Vercel (RECOMENDADO)

```bash
# Incluye todos los posibles orígenes para máxima flexibilidad
CORS_ORIGIN=https://lobba.com,https://www.lobba.com,https://lobba-pwa.vercel.app,https://lobba-pwa-git-main.vercel.app,http://localhost:5173
```

**Notas importantes sobre CORS:**

1. ✅ **Siempre incluye `http://localhost:5173`** si quieres desarrollar localmente contra el backend de Railway
2. ✅ **Vercel genera URLs de preview por cada branch**: `https://lobba-pwa-git-[branch].vercel.app`
3. ✅ **Separa múltiples URLs con comas** (sin espacios)
4. ⚠️ **NUNCA uses `*` en producción** - es inseguro
5. 🔒 **Sin `www` vs con `www`** - son diferentes, incluye ambos si usas los dos

**¿Cómo saber qué URL usar?**

1. Abre tu frontend en el navegador
2. Mira la URL en la barra de direcciones
3. Usa exactamente esa URL (incluyendo `https://` y sin barra final `/`)

## Paso 5: Ejecutar Migraciones

Después del primer deploy:

1. **Acceder a la terminal de Railway:**
   - En tu servicio, click en "..." → "Terminal"
2. **Ejecutar migraciones:**
   ```bash
   npm run migrate
   ```

## Paso 6: Actualizar Frontend

Actualiza la URL del backend en tu frontend (archivo `.env` o configuración):

```bash
VITE_API_URL=https://tu-backend.railway.app
```

## Paso 7: Configurar Dominio (Opcional)

Railway genera automáticamente un dominio como:

- `tu-proyecto.railway.app`

Si quieres usar un dominio personalizado:

1. Ve a Settings → Domains
2. Click "Add Domain"
3. Sigue las instrucciones para configurar DNS

## Paso 8: Configurar Webhooks

Actualiza las URLs de webhooks en servicios externos:

### Stripe Webhooks:

- Nuevo endpoint: `https://tu-backend.railway.app/api/webhooks/stripe`

### Twilio Webhooks:

- Actualiza en la consola de Twilio con tu nueva URL de Railway

## Diferencias Clave vs Vercel

| Aspecto       | Vercel            | Railway + Supabase       |
| ------------- | ----------------- | ------------------------ |
| WebSockets    | ❌ Limitado       | ✅ Completo              |
| Timeouts      | ⏱️ 10-300s        | ⏱️ Sin límite            |
| Base de datos | 🔌 Externa        | 🔌 Supabase (PostgreSQL) |
| Configuración | 📄 vercel.json    | 📄 Auto-detect           |
| Precio        | 💰 Por invocación | 💰 Por uso continuo      |
| Plan Gratuito | ⚠️ Limitado       | ✅ Generoso              |

## Monitoring y Logs

Railway proporciona:

- **Logs en tiempo real** en el dashboard
- **Métricas de uso** (CPU, RAM, Network)
- **Alertas** configurables

## Troubleshooting

### Error de conexión a base de datos:

```bash
# Verifica que las variables de Railway estén correctamente referenciadas
# Revisa los logs en Railway dashboard
```

### WebSocket no funciona:

```bash
# Railway soporta WebSockets nativamente, no necesitas configuración especial
# Asegúrate de que el frontend apunte a la URL correcta
```

### Puerto incorrecto:

```bash
# Railway proporciona la variable PORT automáticamente
# Tu código ya usa: process.env.PORT || 3000
```

## Ventajas de Railway para tu Proyecto

1. **WebSockets funcionan perfectamente** - Tu chat en tiempo real no tendrá problemas
2. **Base de datos integrada** - PostgreSQL incluido y fácil de gestionar
3. **No hay cold starts** - Tu servidor estará siempre activo
4. **Mejor para APIs tradicionales** - Diseñado para servidores Express/Node.js
5. **Desarrollo más simple** - Menos configuración, más productividad

## Costos Aproximados

### Railway:

- **Plan Hobby**: $5 de crédito mensual (suficiente para desarrollo y proyectos pequeños)
- **Plan Developer**: $5/mes base + uso ($0.000231/GB-hour RAM, $0.000463/vCPU-hour)
- **Plan Pro**: $20/mes base + uso con descuentos

### Supabase:

- **Plan Free**: ✅ GRATIS
  - 500 MB de base de datos
  - 1 GB de transferencia de archivos
  - 2 GB de ancho de banda
  - 50 MB de almacenamiento de archivos
  - Proyectos pausados después de 1 semana de inactividad (fácilmente reactivables)
- **Plan Pro**: $25/mes
  - 8 GB de base de datos
  - 250 GB de ancho de banda
  - 100 GB de almacenamiento
  - Sin pausa por inactividad
  - Point-in-time recovery (backups)

### Estimación de Costos Total:

| Escenario              | Railway               | Supabase  | Total/mes  |
| ---------------------- | --------------------- | --------- | ---------- |
| **Desarrollo/MVP**     | $5 (crédito gratuito) | $0 (Free) | **$0-5**   |
| **Producción pequeña** | ~$10-15               | $0 (Free) | **$10-15** |
| **Producción media**   | ~$15-25               | $25 (Pro) | **$40-50** |

**Comparación con Vercel:**

- Vercel Hobby: Gratis (pero limitaciones con WebSockets y timeouts)
- Vercel Pro: $20/mes + funciones serverless ($20-100/mes típico)

**Tu setup (Railway + Supabase) será más económico y funcional** especialmente para WebSockets y APIs tradicionales.

## Siguiente Paso Después de Deploy

Una vez que tu backend esté en Railway:

1. ✅ Verifica el endpoint de health: `https://tu-backend.railway.app/api/health`
2. ✅ Prueba el login/registro
3. ✅ Verifica WebSockets (chat)
4. ✅ Actualiza todas las URLs en servicios externos
5. ✅ Monitorea los logs durante las primeras horas

## Rollback a Vercel (Si es necesario)

Railway mantiene todos tus deploys anteriores. Si algo falla:

1. Click en el deploy anterior
2. Click "Redeploy"
3. Vuelve a la versión que funcionaba

---

**¿Necesitas ayuda?**

- Documentación de Railway: https://docs.railway.app
- Discord de Railway: https://discord.gg/railway
