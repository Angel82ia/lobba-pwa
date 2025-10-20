# Configuración de Webhooks en Producción

## 🎯 Arquitectura actual

```
Frontend (Vercel)          Backend (Railway)         Google Calendar
lobba.es                   *.railway.app             calendar.google.com
    |                            |                          |
    | [1] Setup webhook          |                          |
    |---------------------------->|                          |
    |                            | [2] Register webhook     |
    |                            |------------------------->|
    |                            |                          |
    |                            | [3] Webhook notifications|
    |                            |<-------------------------|
```

## ✅ Checklist de Configuración

### 1. Variables de entorno en Railway

Ve a tu proyecto en Railway > Variables:

```bash
# ⚠️ CRÍTICA - URL pública de tu backend
BACKEND_URL=https://tu-proyecto.railway.app

# ⚠️ CRÍTICA - Redirect URI para OAuth de Google
GOOGLE_REDIRECT_URI=https://tu-proyecto.railway.app/api/google-calendar/callback

# Otras variables necesarias
FRONTEND_URL=https://lobba.es
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_secret
```

**⚠️ IMPORTANTE:** Si falta `GOOGLE_REDIRECT_URI`, el backend usará `http://localhost:3000/api/google-calendar/callback` por defecto, lo que causará el error **"Error 400: redirect_uri_mismatch"** en producción.

📖 **Si ves este error, consulta:** [`docs/GOOGLE_OAUTH_ERROR_400.md`](./GOOGLE_OAUTH_ERROR_400.md)

### 2. Verificar que el backend es accesible públicamente

```bash
curl https://tu-proyecto.railway.app/api/health
# Debería responder 200 OK
```

### 3. Verificar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Tu proyecto > **Credentials**
3. OAuth 2.0 Client ID > **Authorized redirect URIs** debe incluir:
   ```
   https://tu-proyecto.railway.app/api/google-calendar/callback
   ```

## 🔧 Cómo verificar si está funcionando

### Opción A: Desde el código (API test)

Crea `api-tests/check-webhook-config.http`:

```http
### 1. Login como admin
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@lobba.es",
  "password": "tu_password"
}

### 2. Setup webhook (reemplaza SALON_ID)
POST {{baseUrl}}/google-calendar/webhook/setup/SALON_ID
Authorization: Bearer {{token}}

### 3. Ver respuesta - debe incluir:
# {
#   "success": true,
#   "webhook": {
#     "channelId": "lobba-123-...",
#     "resourceId": "...",
#     "expiration": "..."
#   }
# }
```

### Opción B: Desde la UI del Salón

1. Login como dueño del salón
2. Ve a Configuración del Salón
3. Sección "Google Calendar"
4. Click en "Activar sincronización automática"
5. Si funciona, verás:
   ```
   ✅ Sincronización automática activa
   Expira en: X días
   ```

## 🐛 Troubleshooting

### Error: "Invalid domain"

**Causa:** `BACKEND_URL` no está configurada o es incorrecta
**Solución:** Verifica que apunta a tu dominio Railway con HTTPS

### Error: "Unauthorized redirect_uri"

**Causa:** Google OAuth no tiene configurado el callback de producción
**Solución:** Agrega `https://tu-backend.railway.app/api/google-calendar/callback` en Google Cloud Console

### Webhook no recibe notificaciones

**Causa 1:** URL no es accesible públicamente

```bash
# Test desde fuera de Railway:
curl -X POST https://tu-backend.railway.app/api/google-calendar/webhook \
  -H "X-Goog-Channel-ID: test" \
  -H "X-Goog-Resource-ID: test"

# Debería responder 404 (no 502/503)
```

**Causa 2:** Webhook expiró (duran 7 días)
**Solución:** Reactivar desde la UI o crear cron job para renovar

## 🚀 Activación en Producción

### Paso 1: Configurar variables en Railway

```bash
# Railway CLI
railway variables set BACKEND_URL=https://tu-proyecto.railway.app
railway variables set FRONTEND_URL=https://lobba.es
```

O desde la UI de Railway:

- Dashboard > Variables > New Variable

### Paso 2: Reiniciar servicio

```bash
railway service restart
```

### Paso 3: Probar desde un salón

1. Login como dueño del salón en https://lobba.es
2. Ir a Configuración > Google Calendar
3. Si no está conectado:
   - Click "Conectar Google Calendar"
   - Autorizar
   - Seleccionar calendario
4. Click "Activar sincronización automática"
5. Verificar que aparece "✅ Sincronización automática activa"

### Paso 4: Probar la sincronización

1. En Google Calendar, crea un evento nuevo
2. Espera ~30 segundos
3. En Lobba, ve al calendario del salón
4. El evento debería aparecer como bloque no disponible

## 📊 Monitoreo

### Logs en Railway

```bash
# Ver logs en tiempo real
railway logs

# Buscar webhook notifications
railway logs | grep "Webhook notification"
```

### Ver estado de webhooks en DB

```sql
SELECT
  id,
  business_name,
  google_calendar_enabled,
  google_webhook_channel_id IS NOT NULL as webhook_configured,
  google_webhook_expiration > NOW() as webhook_active,
  google_webhook_expiration - NOW() as time_until_expiration
FROM salon_profiles
WHERE google_calendar_enabled = true;
```

## 🔄 Renovación automática de webhooks

Los webhooks de Google expiran cada **7 días**. Opciones:

### Opción A: Cron job manual (Railway Cron)

Crear `backend/src/cron/renewWebhooks.js`:

```javascript
import pool from '../config/database.js'
import { setupWebhook } from '../services/googleCalendarService.js'

export const renewExpiredWebhooks = async () => {
  // Renovar webhooks que expiran en menos de 1 día
  const result = await pool.query(
    `SELECT id FROM salon_profiles 
     WHERE google_calendar_enabled = true 
     AND google_webhook_channel_id IS NOT NULL
     AND google_webhook_expiration < NOW() + INTERVAL '1 day'`
  )

  for (const row of result.rows) {
    try {
      const webhookUrl = `${process.env.BACKEND_URL}/api/google-calendar/webhook`
      await setupWebhook(row.id, webhookUrl)
      console.log(`✅ Renewed webhook for salon ${row.id}`)
    } catch (error) {
      console.error(`❌ Failed to renew webhook for salon ${row.id}:`, error)
    }
  }
}

// Ejecutar cada 6 horas
setInterval(renewExpiredWebhooks, 6 * 60 * 60 * 1000)
```

### Opción B: GitHub Actions (recomendado)

Crear `.github/workflows/renew-webhooks.yml`:

```yaml
name: Renew Google Calendar Webhooks

on:
  schedule:
    - cron: '0 */6 * * *' # Cada 6 horas
  workflow_dispatch: # Manual trigger

jobs:
  renew:
    runs-on: ubuntu-latest
    steps:
      - name: Call renew endpoint
        run: |
          curl -X POST ${{ secrets.BACKEND_URL }}/api/google-calendar/webhooks/renew-all \
            -H "Authorization: Bearer ${{ secrets.ADMIN_TOKEN }}"
```

## ✅ Resultado esperado

Cuando todo está configurado correctamente:

1. **Lobba → Google:** Automático (siempre ha funcionado)
   - Cliente hace reserva → Aparece en Google Calendar

2. **Google → Lobba:** Automático (nuevo con webhooks)
   - Salón crea evento en Google → Bloquea disponibilidad en Lobba
   - Salón modifica evento → Actualiza bloqueo en Lobba
   - Salón elimina evento → Libera disponibilidad en Lobba

3. **Sin intervención manual del salón** 🎉
