# 🚨 Error 400: redirect_uri_mismatch - Solución

## El Problema

```
Error 400: redirect_uri_mismatch
Acceso bloqueado: la solicitud de LOBBA no es válida
```

Este error ocurre cuando el **redirect URI** que usa tu backend no coincide con los configurados en Google Cloud Console.

## ✅ Solución Paso a Paso

### **Paso 1: Obtén la URL de tu backend en Railway**

1. Ve a [Railway Dashboard](https://railway.app/)
2. Selecciona tu proyecto backend
3. Ve a la pestaña **Settings**
4. Copia la URL pública (ej: `lobba-backend-production.up.railway.app`)

> **Nota:** Tu URL será algo como `https://lobba-backend-production-xxxx.up.railway.app`

---

### **Paso 2: Configurar variables en Railway**

1. En Railway, ve a tu proyecto backend
2. Click en **Variables**
3. Agrega o edita estas variables:

```bash
GOOGLE_REDIRECT_URI=https://TU-BACKEND.railway.app/api/google-calendar/callback
BACKEND_URL=https://TU-BACKEND.railway.app
```

**Ejemplo real:**

```bash
GOOGLE_REDIRECT_URI=https://lobba-backend-production.up.railway.app/api/google-calendar/callback
BACKEND_URL=https://lobba-backend-production.up.railway.app
```

4. Click en **Add** y después **Deploy** (si pregunta)

---

### **Paso 3: Configurar Google Cloud Console**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)

2. **Selecciona tu proyecto LOBBA**

3. En el menú lateral: **APIs & Services** → **Credentials**

4. Encuentra tu **OAuth 2.0 Client ID** (el que usas en `GOOGLE_CLIENT_ID`)

5. Click en el nombre del Client ID para editarlo

6. En la sección **Authorized redirect URIs**, verás algo como:

   ```
   http://localhost:3000/api/google-calendar/callback
   ```

7. **AGREGA** (no reemplaces, agrega uno nuevo):

   ```
   https://TU-BACKEND.railway.app/api/google-calendar/callback
   ```

   **Ejemplo real:**

   ```
   https://lobba-backend-production.up.railway.app/api/google-calendar/callback
   ```

8. Click en **SAVE**

> ⚠️ **IMPORTANTE:** Los cambios en Google pueden tardar hasta 5 minutos en aplicarse.

---

### **Paso 4: Verificar que funciona**

1. **Espera 5 minutos** después de guardar en Google Cloud Console

2. Ve a **lobba.es** y login como dueño de salón

3. Ve a **Configuración del Salón** → **Google Calendar**

4. Click en **"Conectar Google Calendar"**

5. Deberías ver la pantalla de autorización de Google (sin error 400)

---

## 🔍 Verificación Técnica

### **Opción A: Verificar variables en Railway**

```bash
# Railway CLI
railway variables

# Deberías ver:
# GOOGLE_REDIRECT_URI=https://tu-backend.railway.app/api/google-calendar/callback
```

### **Opción B: Verificar desde código**

Agrega temporalmente este log en `backend/src/services/googleCalendarService.js`:

```javascript
export const getAuthUrl = salonId => {
  const oauth2Client = createOAuth2Client()

  console.log('🔍 GOOGLE_REDIRECT_URI:', GOOGLE_REDIRECT_URI) // <-- AGREGAR ESTO

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ]
  // ...
}
```

Luego revisa los logs en Railway:

```bash
railway logs | grep "GOOGLE_REDIRECT_URI"
```

Debería mostrar:

```
🔍 GOOGLE_REDIRECT_URI: https://tu-backend.railway.app/api/google-calendar/callback
```

Si muestra `http://localhost:3000/...` → **La variable no está configurada en Railway**

---

## 🚨 Troubleshooting

### Error persiste después de configurar todo

**Posibles causas:**

1. **Los cambios de Google no se aplicaron aún**
   - Espera 5-10 minutos
   - Limpia cookies y caché del navegador
   - Intenta en modo incógnito

2. **La variable no se aplicó en Railway**
   - Verifica que guardaste la variable
   - Reinicia el servicio: `railway service restart`
   - Verifica los logs como se explicó arriba

3. **URL incorrecta**
   - Verifica que sea HTTPS (no HTTP)
   - Verifica que termine en `/api/google-calendar/callback`
   - Verifica que sea exactamente la misma en Railway y Google Cloud Console

### La URL de Railway cambió

Si desplegaste de nuevo y cambió la URL:

1. Actualiza `GOOGLE_REDIRECT_URI` en Railway
2. Actualiza el Authorized redirect URI en Google Cloud Console
3. Espera 5 minutos
4. Reinicia el servicio en Railway

### Tengo múltiples entornos (dev, staging, prod)

Agrega TODOS los redirect URIs en Google Cloud Console:

```
http://localhost:3000/api/google-calendar/callback          (desarrollo)
https://lobba-backend-staging.railway.app/api/google-calendar/callback   (staging)
https://lobba-backend-production.railway.app/api/google-calendar/callback (producción)
```

Google permite múltiples redirect URIs en el mismo Client ID.

---

## 📋 Checklist Final

Antes de probar de nuevo, verifica:

- [ ] Variable `GOOGLE_REDIRECT_URI` configurada en Railway
- [ ] Variable `BACKEND_URL` configurada en Railway
- [ ] URL agregada en Google Cloud Console → Authorized redirect URIs
- [ ] Esperaste 5+ minutos después de guardar en Google
- [ ] Reiniciaste el servicio en Railway (opcional pero recomendado)
- [ ] La URL usa HTTPS (no HTTP)
- [ ] La URL termina en `/api/google-calendar/callback`

---

## ✅ Resultado Esperado

Después de configurar correctamente:

1. Usuario hace click en "Conectar Google Calendar"
2. Se abre la pantalla de autorización de Google
3. Usuario selecciona su cuenta de Google
4. Usuario autoriza los permisos de calendario
5. Redirige de vuelta a lobba.es
6. Muestra "✅ Google Calendar conectado"

---

## 🆘 Si nada funciona

1. **Exporta la configuración actual:**

   ```bash
   railway variables > railway-vars.txt
   ```

2. **Captura de pantalla de Google Cloud Console:**
   - OAuth 2.0 Client ID
   - Authorized redirect URIs

3. **Logs del backend:**

   ```bash
   railway logs > backend-logs.txt
   ```

4. Comparte estos archivos para debug adicional.

---

**Última actualización:** 2025-10-20  
**Documentación relacionada:** `docs/CONFIGURACION_WEBHOOKS_PRODUCCION.md`
