# 🔍 Verificación Google OAuth en Producción

## El problema

Tienes configuradas las redirect URIs en Google Cloud Console (modo test, ambas URLs: producción y local), pero sigues recibiendo:

```
Error 400: redirect_uri_mismatch
```

## ⚠️ Dos posibles causas:

### 1. **Variable `GOOGLE_REDIRECT_URI` no está en Railway**

Aunque tengas las URLs configuradas en Google Cloud, si Railway no tiene la variable de entorno `GOOGLE_REDIRECT_URI`, el backend usará el valor por defecto: `http://localhost:3000/api/google-calendar/callback`

### 2. **Google Cloud en "Modo Test" (Publishing Status: Testing)**

Cuando tu aplicación OAuth está en modo test, **solo los usuarios que agregues manualmente** a la lista de "Test Users" pueden autorizar la app.

---

## 🚀 Solución Paso a Paso

### **Paso 1: Hacer push del código con logs**

```bash
cd /Users/leireaguirre/Repos/Lobba/lobba-pwa
git push origin main
```

Espera a que Railway detecte el cambio y despliegue automáticamente (1-3 minutos).

---

### **Paso 2: Verificar logs en Railway**

1. Ve a [Railway Dashboard](https://railway.app/)
2. Selecciona tu proyecto backend
3. Click en **Deployments** (o **Logs**)
4. Intenta conectar Google Calendar desde lobba.es
5. En los logs deberías ver:

```
🔍 [Google Calendar] Generating auth URL with:
   GOOGLE_REDIRECT_URI: https://tu-backend.railway.app/api/google-calendar/callback
   Salon ID: 123
```

**Si ves `http://localhost:3000/...`** → La variable NO está configurada en Railway.

---

### **Paso 3A: Si la variable NO está en Railway**

1. En Railway, ve a tu proyecto backend
2. Click en **Variables**
3. Click en **New Variable**
4. Agrega:
   ```
   GOOGLE_REDIRECT_URI=https://TU-BACKEND.railway.app/api/google-calendar/callback
   ```
5. Click en **Add**
6. Espera 1 minuto a que se redespliegue
7. Prueba de nuevo

---

### **Paso 3B: Si la variable SÍ está correcta, verifica Google Cloud**

El problema probablemente es el **"Modo Test"** de Google Cloud.

#### **Opción A: Agregar test users (rápido)**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto LOBBA
3. **APIs & Services** → **OAuth consent screen**
4. Scroll hasta **Test users**
5. Click en **+ ADD USERS**
6. Agrega las cuentas de email que quieres que puedan conectar:
   ```
   leire987@gmail.com
   tu-email-de-salon@example.com
   ```
7. Click en **Save**
8. Prueba de nuevo con esas cuentas

#### **Opción B: Publicar la app (producción)**

⚠️ **Solo hazlo si la app está lista para usuarios reales**

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto LOBBA
3. **APIs & Services** → **OAuth consent screen**
4. Verás: **Publishing status: Testing**
5. Click en **PUBLISH APP**
6. Confirma que quieres publicar
7. **Importante:** Google puede requerir una verificación si tu app solicita scopes sensibles

**Estado después:**

```
Publishing status: In production
```

Esto permite que **cualquier usuario** con cuenta de Google pueda autorizar tu app (sin límite de test users).

---

### **Paso 4: Comparar redirect URIs**

Asegúrate de que las URLs coincidan **EXACTAMENTE**:

#### **En Railway:**

```bash
GOOGLE_REDIRECT_URI=https://lobba-backend-production.up.railway.app/api/google-calendar/callback
```

#### **En Google Cloud Console:**

```
https://lobba-backend-production.up.railway.app/api/google-calendar/callback
```

**Errores comunes:**

- ❌ Trailing slash: `.../callback/` vs `.../callback`
- ❌ HTTP vs HTTPS: `http://...` vs `https://...`
- ❌ Puerto diferente: `...railway.app:3000/...` vs `...railway.app/...`
- ❌ Subdominio diferente: `backend.railway.app` vs `backend-prod.railway.app`

---

## 🔍 Comandos útiles

### Ver variables en Railway (Railway CLI)

```bash
railway variables
```

### Ver logs en tiempo real

```bash
railway logs --follow
```

### Verificar que el backend responde

```bash
curl https://TU-BACKEND.railway.app/api/health
```

---

## ✅ Checklist completo

Antes de volver a probar:

- [ ] Push del código con logs a GitHub
- [ ] Railway detectó y desplegó el nuevo código
- [ ] Variable `GOOGLE_REDIRECT_URI` está configurada en Railway (verificado en logs)
- [ ] La URL de Railway coincide EXACTAMENTE con Google Cloud Console
- [ ] Si está en "Modo Test": Tu email está en la lista de test users
- [ ] Esperaste 5+ minutos después de cualquier cambio en Google Cloud Console
- [ ] Probaste en modo incógnito (para evitar cache)

---

## 📊 Flujo esperado (sin errores)

```
1. Usuario en lobba.es click "Conectar Google Calendar"
   ↓
2. Frontend llama: GET /api/google-calendar/auth/:salonId
   ↓
3. Backend genera authUrl con GOOGLE_REDIRECT_URI correcto
   ↓
4. Backend logs: "🔍 [Google Calendar] Generating auth URL with: https://..."
   ↓
5. Usuario redirigido a Google OAuth
   ↓
6. Google verifica redirect_uri (debe coincidir con lo configurado)
   ↓
7. Usuario autoriza permisos
   ↓
8. Google redirige a: https://TU-BACKEND.railway.app/api/google-calendar/callback?code=...
   ↓
9. Backend intercambia code por tokens
   ↓
10. Backend redirige a: https://lobba.es/salon/:id/settings?calendar=connected
```

---

## 🆘 Si nada funciona

Comparte:

1. **Logs de Railway** (filtra por "Google Calendar"):

   ```bash
   railway logs | grep "Google Calendar"
   ```

2. **Screenshot de Google Cloud Console:**
   - OAuth consent screen (publishing status)
   - Credentials → OAuth 2.0 Client ID → Authorized redirect URIs

3. **Variables de Railway:**

   ```bash
   railway variables | grep GOOGLE
   ```

4. **El email que estás usando** para probar (para verificar si está en test users)

---

**Última actualización:** 2025-10-20  
**Commit con logs:** `feat: agregar logs de diagnóstico para Google OAuth`
