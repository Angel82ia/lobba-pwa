# 📅 Sincronización de Google Calendar en Lobba

## 📊 **Estado Actual**

### ✅ **Lo que funciona automáticamente:**

| Acción            | Desde | Hacia           | Estado        |
| ----------------- | ----- | --------------- | ------------- |
| Crear reserva     | Lobba | Google Calendar | ✅ Automático |
| Cancelar reserva  | Lobba | Google Calendar | ✅ Automático |
| Modificar reserva | Lobba | Google Calendar | ✅ Automático |

### ⚠️ **Lo que NO es automático:**

| Acción           | Desde           | Hacia | Estado    |
| ---------------- | --------------- | ----- | --------- |
| Crear evento     | Google Calendar | Lobba | ❌ Manual |
| Modificar evento | Google Calendar | Lobba | ❌ Manual |
| Eliminar evento  | Google Calendar | Lobba | ❌ Manual |

---

## 🔍 **El Problema**

**Escenario actual:**

```
1. Cliente hace reserva en Lobba → ✅ Aparece en Google Calendar
2. Salón crea evento en Google Calendar → ❌ NO bloquea en Lobba
3. Otro cliente intenta reservar esa hora → ⚠️ Conflicto!
```

**¿Por qué pasa esto?**

- La sincronización **Lobba → Google** es automática (push)
- La sincronización **Google → Lobba** requiere activación de webhooks (pull)

---

## ✅ **Solución: Sistema de Webhooks**

### **¿Qué son los Webhooks?**

Google Calendar puede notificar a Lobba cuando hay cambios:

```
Google Calendar detecta cambio
        ↓
Envía notificación HTTP (webhook)
        ↓
Lobba recibe la notificación
        ↓
Sincroniza automáticamente
```

---

## 🔧 **Implementación del Sistema**

### **Backend (Ya Implementado) ✅**

El código ya existe en:

- `backend/src/services/googleCalendarService.js`
- `backend/src/controllers/googleCalendarController.js`
- `backend/src/routes/googleCalendar.js`

**Endpoint webhook:**

```
POST /api/google-calendar/webhook
```

**Funcionalidad:**

1. Recibe notificación de Google
2. Sincroniza eventos → `availability_blocks`
3. Bloquea horarios automáticamente

---

## 🚀 **Cómo Activar Webhooks**

### **Requisitos:**

1. **Dominio público con HTTPS:**
   - ❌ `http://localhost` (Google no acepta)
   - ✅ `https://tudominio.com` (producción)
   - ✅ `https://test.tudominio.com` (staging)
   - ✅ Usar Ngrok para testing local

2. **Variable de entorno:**

   ```bash
   # backend/.env
   BACKEND_URL=https://api.tudominio.com
   ```

3. **Google Calendar API habilitada:**
   - Ya está configurada ✅

---

### **Opción 1: En Producción**

**Configuración automática:**

```javascript
// Cuando el salón conecta Google Calendar
POST /api/google-calendar/webhook/setup/:salonId

// Resultado:
{
  "success": true,
  "webhook": {
    "channelId": "lobba-salon-123-1234567890",
    "resourceId": "xxxxxx",
    "expiration": "2025-11-20T10:00:00Z"
  }
}
```

**Renovación automática:**
Los webhooks de Google expiran cada **7 días**. Necesitas un cron job:

```javascript
// Cada 6 días
cron.schedule('0 0 */6 * *', async () => {
  const salons = await getSalonsWithExpiredWebhooks()
  for (const salon of salons) {
    await renewWebhook(salon.id)
  }
})
```

---

### **Opción 2: Para Testing Local (Ngrok)**

**1. Instalar Ngrok:**

```bash
npm install -g ngrok
```

**2. Iniciar túnel:**

```bash
ngrok http 3000
```

**3. Configurar backend:**

```bash
# backend/.env
BACKEND_URL=https://abc123.ngrok.io
```

**4. Activar webhook:**

```bash
curl -X POST https://abc123.ngrok.io/api/google-calendar/webhook/setup/SALON_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 **Opciones de Sincronización**

### **Opción A: Sincronización Manual (Actual)**

**Cuándo usar:**

- Desarrollo local
- Testing
- No tienes dominio público

**Cómo funciona:**

```
1. Salón hace cambios en Google Calendar
2. Salón va a Settings → Google Calendar
3. Clic en "🔄 Sincronizar ahora"
4. Lobba consulta Google Calendar
5. Actualiza availability_blocks
```

**Ventajas:**

- ✅ Funciona en localhost
- ✅ No requiere webhook
- ✅ Control manual

**Desventajas:**

- ❌ Requiere acción del salón
- ❌ No es instantáneo
- ❌ Posibles conflictos si olvidan sincronizar

---

### **Opción B: Webhooks Automáticos (Recomendado)**

**Cuándo usar:**

- Producción
- Staging con dominio público
- UX óptima

**Cómo funciona:**

```
1. Salón hace cambios en Google Calendar
2. Google notifica a Lobba automáticamente (< 1 min)
3. Lobba sincroniza sin intervención
4. availability_blocks actualizado
```

**Ventajas:**

- ✅ Automático e instantáneo
- ✅ Mejor UX
- ✅ Sin conflictos

**Desventajas:**

- ❌ Requiere dominio público con HTTPS
- ❌ Webhooks expiran cada 7 días
- ❌ Requiere cron para renovar

---

### **Opción C: Polling Periódico (Intermedio)**

**Cuándo usar:**

- No puedes usar webhooks
- Quieres automatización sin webhooks

**Cómo funciona:**

```javascript
// Cada 15 minutos
cron.schedule('*/15 * * * *', async () => {
  const salons = await getSalonsWithGoogleCalendar()
  for (const salon of salons) {
    await syncGoogleEventsToBlocks(salon.id)
  }
})
```

**Ventajas:**

- ✅ Funciona sin webhooks
- ✅ Sincronización automática
- ✅ Funciona en localhost

**Desventajas:**

- ❌ No es instantáneo (15 min delay)
- ❌ Consume API de Google
- ❌ Más carga en servidor

---

## 🎯 **Recomendación por Entorno**

### **Desarrollo Local:**

```
✅ Opción A: Sincronización Manual
   - Botón "Sincronizar ahora" en UI
   - Simple y funcional
```

### **Staging/Testing:**

```
✅ Opción C: Polling cada 5-15 minutos
   - Automático sin webhooks
   - Suficiente para testing
```

### **Producción (Vercel + Railway):**

```
✅ Opción B: Webhooks + Renovación automática
   - Mejor UX
   - Instantáneo
   - Escalable
   - ⚠️ REQUIERE: Variable BACKEND_URL configurada en Railway
```

**¿Funciona en lobba.es (Vercel)?**

**✅ Sí**, siempre que:

1. El frontend esté en Vercel (lobba.es) ✅
2. El backend esté en Railway con URL pública (\*.railway.app) ✅
3. La variable `BACKEND_URL` esté configurada en Railway apuntando a la URL del backend ⚠️
4. Google OAuth tenga configurado el redirect URI de producción ⚠️

> **Importante:** El webhook de Google llama al **backend** (Railway), no al frontend (Vercel).

📖 **Ver guía completa:** [`docs/CONFIGURACION_WEBHOOKS_PRODUCCION.md`](./CONFIGURACION_WEBHOOKS_PRODUCCION.md)

---

## 🔄 **Flujo Completo de Sincronización**

### **Escenario: Salón crea evento en Google Calendar**

**Con sincronización manual:**

```
1. Salón crea "Cita con cliente X" a las 14:00 en Google Calendar
2. ⏳ Evento NO bloqueado en Lobba
3. Cliente intenta reservar 14:00 → ✅ Permite (conflicto!)
4. Salón va a Settings → "Sincronizar ahora"
5. ✅ Ahora sí está bloqueado en Lobba
```

**Con webhooks:**

```
1. Salón crea "Cita con cliente X" a las 14:00 en Google Calendar
2. Google notifica a Lobba (< 30 seg)
3. Lobba sincroniza automáticamente
4. ✅ Bloqueado en Lobba
5. Cliente intenta reservar 14:00 → ❌ No disponible (correcto!)
```

---

## 📝 **Mejoras Sugeridas para el Frontend**

### **1. Indicador de Estado de Webhook**

```jsx
{
  status.webhookActive ? (
    <div className="flex items-center gap-2 text-green-600">
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      <span>Sincronización automática activa</span>
    </div>
  ) : (
    <div className="flex items-center gap-2 text-yellow-600">
      <span>⚠️ Sincronización manual</span>
      <Button onClick={handleSetupWebhook} size="small">
        Activar automática
      </Button>
    </div>
  )
}
```

### **2. Mostrar Última Sincronización**

```jsx
{
  status.lastSync && (
    <p className="text-sm text-gray-500">
      Última sincronización: {formatDistanceToNow(new Date(status.lastSync))}
    </p>
  )
}
```

### **3. Botón de Sincronización Manual Mejorado**

```jsx
;<Button onClick={handleSync} disabled={syncing} variant="outline">
  {syncing ? (
    <>
      <Spinner className="mr-2" />
      Sincronizando...
    </>
  ) : (
    <>🔄 Sincronizar ahora</>
  )}
</Button>

{
  syncResult && (
    <Alert variant="success">✅ Sincronizado: {syncResult.eventsToBlocks} eventos bloqueados</Alert>
  )
}
```

### **4. Explicación para el Usuario**

```jsx
<div className="bg-blue-50 p-4 rounded-lg">
  <h4 className="font-semibold mb-2">ℹ️ Cómo funciona:</h4>
  <ul className="text-sm space-y-1">
    <li>✅ Las reservas de Lobba se crean automáticamente en tu calendario</li>
    <li>⚠️ Los eventos que crees en Google Calendar se sincronizan manualmente</li>
    <li>💡 Clic en "Sincronizar ahora" para actualizar los bloqueos</li>
  </ul>
</div>
```

---

## 🔐 **Seguridad**

### **Validar Notificaciones de Google**

```javascript
// En el webhook endpoint
export const handleWebhook = async (req, res) => {
  // 1. Verificar que viene de Google
  const channelId = req.headers['x-goog-channel-id']
  const resourceId = req.headers['x-goog-resource-id']

  // 2. Verificar que está en nuestra base de datos
  const salon = await findSalonByWebhookIds(channelId, resourceId)

  if (!salon) {
    return res.status(404).json({ error: 'Invalid webhook' })
  }

  // 3. Procesar sincronización
  await syncGoogleEventsToBlocks(salon.id)

  res.status(200).json({ success: true })
}
```

---

## 📊 **Monitoreo**

### **Métricas Importantes:**

1. **Tasa de sincronización:**
   - ¿Cuántos salones sincronizan manualmente al día?
   - ¿Cuántos tienen webhooks activos?

2. **Conflictos detectados:**
   - Reservas que coinciden con eventos de Google

3. **Latencia de webhook:**
   - Tiempo entre cambio en Google y sincronización

4. **Renovaciones de webhook:**
   - ¿Cuántos webhooks expiran?
   - ¿Se renuevan automáticamente?

---

## 🚀 **Próximos Pasos**

### **Corto Plazo (Desarrollo):**

- [x] Mantener sincronización manual funcionando
- [ ] Agregar indicador visual en UI
- [ ] Mejorar UX del botón "Sincronizar ahora"
- [ ] Mostrar resultado de sincronización

### **Medio Plazo (Staging):**

- [ ] Implementar polling cada 15 minutos
- [ ] Métricas de sincronización
- [ ] Testing con múltiples salones

### **Largo Plazo (Producción):**

- [ ] Activar webhooks automáticos
- [ ] Cron job para renovar webhooks
- [ ] Dashboard de monitoreo
- [ ] Alertas si webhook falla

---

## 📚 **Referencias**

- [Google Calendar API - Push Notifications](https://developers.google.com/calendar/api/guides/push)
- [Google Calendar API - Watch Events](https://developers.google.com/calendar/api/v3/reference/events/watch)
- [Best Practices for Webhooks](https://webhooks.fyi/best-practices/google-calendar)

---

**Última actualización:** 20 octubre 2025  
**Estado:** Sistema de sincronización manual activo ✅  
**Próximo:** Implementar webhooks automáticos 🚀
