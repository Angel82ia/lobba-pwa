# 🔍 Cómo Ver Logs en Railway

## Opción 1: Dashboard Web (más fácil)

1. Ve a [Railway Dashboard](https://railway.app/)
2. Click en tu proyecto backend
3. En el menú lateral, busca **"Deployments"** o **"Observability"** → **"Logs"**
4. Verás logs en tiempo real

**Busca esta línea:**

```
🔍 [Google Calendar] Generating auth URL with:
   GOOGLE_REDIRECT_URI: https://...
```

## Opción 2: Railway CLI

Si tienes Railway CLI instalado:

```bash
# Ver logs en tiempo real
railway logs --follow

# Filtrar por Google Calendar
railway logs | grep "Google Calendar"
```

## Opción 3: API de Railway

Si no tienes acceso a ninguna de las anteriores, puedes usar el navegador:

1. Abre la consola de Railway en el navegador
2. Ve a tu proyecto
3. Logs debería estar visible en la parte inferior o lateral

---

## 📸 Lo que necesito ver:

Cuando hagas click en "Conectar Google Calendar" en lobba.es, en los logs de Railway debería aparecer:

```
🔍 [Google Calendar] Generating auth URL with:
   GOOGLE_REDIRECT_URI: https://tu-backend.railway.app/api/google-calendar/callback
   Salon ID: 051fdcaf-9940-4e6e-891f-0abba90f6c11
```

**Copia esa línea completa** y compártela.

---

## ⚠️ Posibles resultados:

### ✅ Si ves la URL de Railway:

```
GOOGLE_REDIRECT_URI: https://lobba-backend-production.railway.app/api/google-calendar/callback
```

→ La variable está bien. El problema es **Google Cloud en modo test** (necesitas agregar test users).

### ❌ Si ves localhost:

```
GOOGLE_REDIRECT_URI: http://localhost:3000/api/google-calendar/callback
```

→ Railway no tiene la variable `GOOGLE_REDIRECT_URI`. Necesitas agregarla.

### ❌ Si no ves ningún log:

→ Railway aún no desplegó el nuevo código. Espera 1-2 minutos más.
