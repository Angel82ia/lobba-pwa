# 🔍 Cómo Verificar el Estado de tu OAuth en Google Cloud

## Paso 1: Ir a Pantalla de Consentimiento

1. Abre: https://console.cloud.google.com/apis/credentials/consent
2. O navega manualmente:
   - Google Cloud Console
   - Selecciona tu proyecto (arriba izquierda)
   - Menú lateral → APIs y servicios
   - Click en **"Pantalla de consentimiento de OAuth"**

---

## Paso 2: Identificar el Estado

### 🔴 Si está en TESTING

Verás algo como esto en la parte superior:

```
┌────────────────────────────────────────────────┐
│ Publishing status: Testing                     │
│                                                │
│ Your app is currently limited to test users   │
│ only. To make it available to all users,      │
│ publish your app.                              │
│                                                │
│ [PUBLISH APP] button                           │
└────────────────────────────────────────────────┘
```

**Características del modo Testing:**

- ✅ Solo usuarios de prueba pueden usar la app
- ✅ No requiere verificación de Google
- ✅ Ideal para desarrollo
- ⚠️ Límite de 100 usuarios de prueba

---

### 🟢 Si está en PRODUCTION

Verás algo como esto:

```
┌────────────────────────────────────────────────┐
│ Publishing status: In production               │
│                                                │
│ Your app is available to all users            │
└────────────────────────────────────────────────┘
```

**Características del modo Production:**

- ✅ Cualquiera puede usar la app
- ⚠️ Requiere verificación de Google (si pide scopes sensibles)
- ⚠️ Proceso de revisión puede tardar semanas

---

## Paso 3: Ver/Agregar Usuarios de Prueba (si está en Testing)

Baja en la misma página hasta la sección **"Test users"**:

### Si NO hay usuarios agregados:

```
┌────────────────────────────────────────────────┐
│ Test users                                     │
│                                                │
│ No test users                                  │
│                                                │
│ [+ ADD USERS]                                  │
└────────────────────────────────────────────────┘
```

### Si YA hay usuarios agregados:

```
┌────────────────────────────────────────────────┐
│ Test users                              [EDIT] │
│                                                │
│ • admin@example.com                            │
│ • developer@example.com                        │
│                                                │
│ [+ ADD USERS]                                  │
└────────────────────────────────────────────────┘
```

---

## Paso 4: Agregar tu Email como Usuario de Prueba

1. **Click en "+ ADD USERS"** o **"EDIT"**

2. Se abre un cuadro de texto:

   ```
   ┌──────────────────────────────────────┐
   │ Add test users                       │
   │                                      │
   │ Enter email addresses, one per line  │
   │ ┌──────────────────────────────────┐ │
   │ │ leire987@gmail.com               │ │
   │ │                                  │ │
   │ └──────────────────────────────────┘ │
   │                                      │
   │         [CANCEL]  [ADD]              │
   └──────────────────────────────────────┘
   ```

3. Escribe: **leire987@gmail.com**

4. Presiona Enter o click en **ADD**

5. Click en **SAVE** (abajo de la página)

---

## Paso 5: Verificar que se agregó correctamente

Después de guardar, deberías ver:

```
┌────────────────────────────────────────────────┐
│ Test users                              [EDIT] │
│                                                │
│ • leire987@gmail.com                     ✓     │
│                                                │
└────────────────────────────────────────────────┘
```

---

## ✅ Checklist Final

- [ ] Verificaste que está en modo **Testing**
- [ ] **leire987@gmail.com** está en la lista de test users
- [ ] Esperaste 1-2 minutos después de guardar
- [ ] Probaste en ventana de incógnito

---

## 🧪 Probar de nuevo

Una vez agregado el email:

1. **Espera 1-2 minutos** (Google necesita actualizar)

2. **Abre Chrome en modo incógnito** (Cmd+Shift+N)

3. En `api-tests/google-calendar.http`, ejecuta:

   ```http
   GET {{baseUrl}}/google-calendar/auth/{{salonId}}
   Authorization: Bearer {{token}}
   ```

4. **Copia el authUrl** de la respuesta

5. **Pégalo en la ventana de incógnito**

6. Deberías ver una de estas pantallas:

   ### Opción A: Pantalla de verificación (normal en Testing)

   ```
   ┌──────────────────────────────────────────┐
   │ Google hasn't verified this app          │
   │                                          │
   │ This app has not been verified yet...   │
   │                                          │
   │ [Back to safety]  [Continue to LOBBA]   │
   └──────────────────────────────────────────┘
   ```

   👉 **Click en "Continue to LOBBA"** (o "Continuar a LOBBA" en español)

   ### Opción B: Pantalla de permisos

   ```
   ┌──────────────────────────────────────────┐
   │ LOBBA wants to access your Google       │
   │ Account                                  │
   │                                          │
   │ leire987@gmail.com                       │
   │                                          │
   │ This will allow LOBBA to:                │
   │ ☑ See, edit, share, and delete all     │
   │   calendars you can access using        │
   │   Google Calendar                        │
   │                                          │
   │ [Cancel]  [Allow]                        │
   └──────────────────────────────────────────┘
   ```

   👉 **Click en "Allow"** (o "Permitir")

7. **Serás redirigido** a:
   ```
   http://localhost:5173/salon/58459050-.../settings?google_calendar=connected
   ```

---

## ❌ Si sigues viendo "Acceso bloqueado"

Significa que **el email NO está en la lista de test users**. Revisa:

1. ¿Guardaste los cambios? (botón SAVE)
2. ¿Esperaste 1-2 minutos?
3. ¿El email está bien escrito? **leire987@gmail.com**
4. ¿Estás usando ese email en el navegador?

---

## 🆘 Alternativa: Publicar la App (NO recomendado para desarrollo)

Si no quieres agregar emails uno por uno:

1. En "Pantalla de consentimiento de OAuth"
2. Click en **"PUBLISH APP"**
3. Confirmar

**⚠️ No recomendado porque:**

- Si usas scopes "sensibles", Google requerirá verificación
- El proceso de verificación puede tardar semanas
- Para desarrollo, es mejor usar modo Testing

---

## 📸 Enlaces Directos

- **Pantalla de consentimiento:** https://console.cloud.google.com/apis/credentials/consent
- **Credenciales:** https://console.cloud.google.com/apis/credentials
- **Google Calendar API:** https://console.cloud.google.com/apis/library/calendar-json.googleapis.com

---

## 💡 Tip Extra

Puedes agregar múltiples emails de prueba (hasta 100):

```
leire987@gmail.com
otro@gmail.com
equipo@lobba.com
```

Útil si tienes un equipo de desarrollo.

---

Una vez verificado y agregado el email, ¡debería funcionar perfectamente! 🎉
