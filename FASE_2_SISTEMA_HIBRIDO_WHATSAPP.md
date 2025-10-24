# FASE 2: Sistema Híbrido WhatsApp - Implementación Completa

## 📋 Resumen

Se ha implementado el **Sistema Híbrido WhatsApp** que integra notificaciones automatizadas ONE-WAY utilizando el número centralizado de LOBBA (+34614392922) mientras se mantiene intacto el sistema de click-to-chat de cada salón.

## ✅ Componentes Implementados

### 1. Base de Datos

#### Migración 079: Tabla `notifications`
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  appointment_id INTEGER REFERENCES appointments(id),
  to_phone VARCHAR(20),
  to_email VARCHAR(255),
  message_sid VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  content TEXT,
  error_code VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Migración 080: Columnas de recordatorio en `appointments`
```sql
ALTER TABLE appointments 
ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN reminder_sent_at TIMESTAMP;
```

### 2. Servicios Creados (FASE 1)

- ✅ `TwilioNotificationService` - WhatsApp ONE-WAY
- ✅ `EmailService` - SendGrid
- ✅ `VerifyService` - Verificación 2FA

### 3. Servicios Integrados (FASE 2)

#### `NotificationOrchestrator`
**Ubicación:** `/backend/src/services/notificationOrchestrator.js`

Orquesta el envío multi-canal:
- WhatsApp a socias (Twilio + número LOBBA)
- Email a socias (SendGrid)
- Email a salones (notificación interna)

**Métodos principales:**
```javascript
sendAppointmentConfirmation(appointment, salonData)
sendAppointmentReminder(appointment, salonData)
sendAppointmentCancellation(appointment, salonData, reason)
getAppointmentNotifications(appointmentId)
resendNotification(notificationId)
```

#### `appointmentReminderCron`
**Ubicación:** `/backend/src/services/appointmentReminderCron.js`

Cron job que ejecuta cada hora:
- Busca citas entre 23-25h en el futuro
- Envía recordatorios WhatsApp + Email
- Marca citas como `reminder_sent = TRUE`

### 4. Integración en Controllers

#### `reservationController.js`
- ✅ Integrado en `createReservation()` - Confirmación inmediata
- ✅ Integrado en `cancelReservation()` - Notificación de cancelación

**Flujo de creación de cita:**
```javascript
1. Se crea la reserva en BD
2. Se llama al sistema existente de notificaciones
3. Se llama al NotificationOrchestrator:
   - Envía WhatsApp a la socia
   - Envía Email a la socia
   - Envía Email al salón
4. Se registra en tabla `notifications` para tracking
```

### 5. Webhooks

#### `/api/webhooks/twilio/status`
**Ubicación:** `/backend/src/controllers/webhookController.js`

Recibe callbacks de Twilio con estados:
- `queued` - En cola
- `sent` - Enviado
- `delivered` - Entregado
- `read` - Leído
- `failed` - Fallido
- `undelivered` - No entregado

Actualiza automáticamente la tabla `notifications` con el estado real.

### 6. API Endpoints de Administración

**Base URL:** `/api/notification-admin`

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/health` | GET | Health check de servicios |
| `/appointment/:id` | GET | Historial de notificaciones de una cita |
| `/:notificationId/resend` | POST | Reenviar notificación fallida |
| `/stats` | GET | Estadísticas de notificaciones |
| `/recent` | GET | Notificaciones recientes |

**Ejemplos:**

```bash
# Ver health de servicios
GET /api/notification-admin/health

# Ver notificaciones de una cita
GET /api/notification-admin/appointment/123

# Reenviar notificación
POST /api/notification-admin/456/resend

# Estadísticas
GET /api/notification-admin/stats?startDate=2024-01-01&endDate=2024-12-31

# Notificaciones recientes
GET /api/notification-admin/recent?limit=50&status=failed
```

## 🔧 Variables de Entorno Requeridas

```env
# Twilio WhatsApp
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_FROM=whatsapp:+34614392922

# SendGrid Email
SENDGRID_API_KEY=SG.xxxx
SENDGRID_FROM_EMAIL=notifications@lobba.com
SENDGRID_FROM_NAME=LOBBA

# Twilio Verify (2FA)
TWILIO_VERIFY_SERVICE_SID=VAxxxx
```

## 📊 Flujo Completo de Notificaciones

### Creación de Cita

```
Usuario crea cita
    ↓
Backend crea registro en BD
    ↓
NotificationOrchestrator activado
    ↓
    ├─→ TwilioService.sendAppointmentConfirmation()
    │   └─→ WhatsApp enviado a socia
    │       └─→ Registrado en notifications (message_sid)
    │
    ├─→ EmailService.sendAppointmentConfirmation()
    │   └─→ Email enviado a socia
    │       └─→ Registrado en notifications
    │
    └─→ EmailService.notifySalonNewAppointment()
        └─→ Email enviado al salón
            └─→ Salón informado de nueva cita
```

### Recordatorio 24h Antes

```
Cron job ejecuta cada hora
    ↓
Busca citas en 23-25h
    ↓
Para cada cita encontrada:
    ↓
    ├─→ WhatsApp recordatorio a socia
    ├─→ Email recordatorio a socia
    └─→ appointments.reminder_sent = TRUE
```

### Tracking de Estado (Webhook)

```
Twilio envía status update
    ↓
/api/webhooks/twilio/status
    ↓
Actualiza notifications.status
    ↓
Estados: queued → sent → delivered → read
```

## 🎯 Modelo Híbrido: ¿Qué se mantiene?

### ✅ SE MANTIENE (sin cambios):
- Click-to-chat de cada salón (número propio)
- WhatsApp links en cards de salones
- Conversaciones bidireccionales salón-socia

### ✨ NUEVO (sistema centralizado):
- Notificaciones automatizadas desde número LOBBA
- Confirmaciones de cita (WhatsApp + Email)
- Recordatorios 24h (WhatsApp + Email)
- Cancelaciones (WhatsApp + Email)
- Tracking de entrega en tiempo real

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/api/notification-admin/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "services": {
    "twilio": { "configured": false, "status": "disabled" },
    "email": { "configured": false, "status": "disabled" },
    "verify": { "configured": false, "status": "disabled" },
    "orchestrator": { "available": true, "status": "active" }
  }
}
```

### Webhook Test
```bash
curl -X POST http://localhost:3000/api/webhooks/twilio/status \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "MessageSid=SM123&MessageStatus=delivered"
```

## 📝 Próximos Pasos (FASE 3)

1. Configurar credenciales reales de Twilio/SendGrid en producción
2. Configurar StatusCallback URL en Twilio console
3. Testing con números reales
4. Monitoreo de métricas de entrega
5. Ajuste de templates de mensajes
6. Implementar rate limiting para prevenir spam

## 🔒 Seguridad

- ✅ Webhooks de Twilio validados por firma
- ✅ Endpoints admin protegidos con `authenticateToken`
- ✅ Rate limiting en APIs
- ✅ Logs detallados de errores (sin exponer datos sensibles)
- ✅ Graceful degradation si servicios no están configurados

## 📈 Métricas a Monitorear

- Tasa de entrega WhatsApp
- Tasa de entrega Email
- Tiempo promedio de entrega
- Tasa de lectura (WhatsApp)
- Notificaciones fallidas
- Recordatorios enviados vs citas totales

## 🐛 Troubleshooting

### Notificaciones no se envían
1. Verificar health endpoint: `/api/notification-admin/health`
2. Verificar variables de entorno
3. Revisar logs: `docker logs lobba-backend`
4. Verificar tabla `notifications` para errores

### Webhook no funciona
1. Configurar URL pública en Twilio Console
2. Verificar que StatusCallback URL está configurada
3. Revisar logs de webhook en Twilio Console

## 📚 Referencias

- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp/api)
- [SendGrid API](https://docs.sendgrid.com/)
- [Node-cron](https://www.npmjs.com/package/node-cron)

---

**Estado:** ✅ FASE 2 Completada
**Fecha:** 2024-10-16
**Próximo:** FASE 3 - Configuración en Producción
