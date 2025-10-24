# 💳 Flujo de Configuración de Pagos (Stripe Connect)

## 📋 Resumen

Este documento explica **cuándo** y **cómo** los salones deben configurar Stripe Connect para recibir pagos de reservas.

---

## 🎯 ¿Cuándo se debe configurar?

### **Momento Ideal: Antes de publicar servicios**

```
1. Salón crea su perfil ✓
2. Salón agrega servicios ✓
3. 🔴 Salón configura pagos (AQUÍ)
4. Salón publica y recibe reservas ✓
```

### **Momentos Clave en la UX**

#### 1️⃣ **Durante el Onboarding del Salón**

**Pantalla:** Wizard de registro de salón (paso 3 o 4)

```jsx
// Sugerencia de implementación
<OnboardingWizard>
  <Step1 title="Información básica" />
  <Step2 title="Ubicación y horarios" />
  <Step3 title="Servicios" />
  <Step4 title="Configurar pagos" /> {/* NUEVO */}
  <Step5 title="¡Listo!" />
</OnboardingWizard>
```

**Mensaje al usuario:**

> "Para recibir reservas con pago, necesitas conectar tu cuenta bancaria a través de Stripe. Es rápido y seguro."

---

#### 2️⃣ **En la Configuración del Salón**

**Ruta:** `/salon/:id/settings`

Ya implementado en `src/pages/SalonSettings.jsx`:

- Primera sección visible
- Icono llamativo 💳
- Estado claro (pendiente/configurado)

**Estados visuales:**

| Estado         | Visual            | Acción                   |
| -------------- | ----------------- | ------------------------ |
| Sin configurar | ⚠️ Alerta roja    | "Configurar pagos ahora" |
| En proceso     | ⏳ Badge amarillo | "Completar verificación" |
| Configurado    | ✅ Badge verde    | "Activo"                 |

---

#### 3️⃣ **Bloqueo al Intentar Reservar**

**Cuándo:** Un usuario intenta reservar en un salón sin Stripe Connect

**Error actual:**

```json
{
  "error": "This salon has not configured payment reception yet. Please contact the salon."
}
```

**Mejora UX sugerida en frontend:**

```jsx
// src/modules/reservations/ReservationCheckoutForm.jsx
if (error?.includes('not configured payment')) {
  return (
    <Alert variant="warning">
      <h3>🔧 Salón en configuración</h3>
      <p>Este salón aún no ha activado los pagos online.</p>
      <p>Por favor, contacta directamente al salón para reservar.</p>
      <Button onClick={() => (window.location.href = `tel:${salon.phone}`)}>
        📞 Llamar al salón
      </Button>
    </Alert>
  )
}
```

---

#### 4️⃣ **Dashboard del Salón - Banner Persistente**

**Cuándo:** Mientras Stripe Connect no esté configurado

```jsx
// Sugerencia para Dashboard principal del salón
{
  !stripeConfigured && (
    <Alert variant="warning" sticky>
      <strong>⚠️ Acción requerida:</strong>
      No puedes recibir reservas hasta configurar pagos.
      <Button onClick={navigateToSettings}>Configurar ahora</Button>
    </Alert>
  )
}
```

---

## 🔄 Flujo Completo de Configuración

### **Paso 1: Acceder a Configuración**

1. Usuario va a `/salon/:id/settings`
2. Ve sección "💳 Pagos y Reservas"
3. Card muestra estado "Sin configurar"

### **Paso 2: Iniciar Conexión**

```
Usuario: Clic en "🚀 Conectar con Stripe"
    ↓
Frontend: POST /api/stripe-connect/create
    ↓
Backend: Crea cuenta Stripe Express
    ↓
Backend: Devuelve onboardingUrl
    ↓
Frontend: Redirige a Stripe
```

### **Paso 3: Onboarding de Stripe**

Usuario completa en **sitio de Stripe** (externo):

1. Información del negocio (CIF/NIF)
2. Datos bancarios (IBAN)
3. Documentos de identidad
4. Verificación KYC

**Tiempo estimado:** 5-10 minutos

### **Paso 4: Retorno a Lobba**

```
Stripe: Redirige a return_url
    ↓
Lobba: /salon/:id/settings?stripe_return=true
    ↓
Frontend: Verifica estado
    ↓
GET /api/stripe-connect/status/:salonId
    ↓
Muestra: ✅ "¡Configuración completada!"
```

### **Paso 5: Actualización Automática**

```
Stripe: Webhook → account.updated
    ↓
Backend: /api/stripe-connect/webhook
    ↓
Actualiza DB: stripe_connect_enabled = true
```

---

## 🎨 Estados del Componente

### **Estado 1: Sin Cuenta**

```jsx
<StripeConnectIntegration />

Muestra:
- Icono 💳
- Título: "Configura tus Pagos"
- Explicación de beneficios
- Lista de requisitos
- Botón: "🚀 Conectar con Stripe"
```

### **Estado 2: Cuenta Creada, Verificación Pendiente**

```jsx
Muestra:
- Icono ⚠️
- Título: "Configuración Pendiente"
- Alerta warning
- Información pendiente (del endpoint)
- 3 badges: Cuenta ✓ | Verificación ⏳ | Pagos ✗
- Botón: "📝 Completar Verificación"
```

### **Estado 3: Completamente Configurado**

```jsx
Muestra:
- Icono ✅
- Título: "Pagos Configurados"
- Card verde con confirmación
- 3 badges verdes: Cuenta ✓ | Cobros ✓ | Transferencias ✓
- Account ID (truncado)
```

---

## 🔗 Endpoints Utilizados

| Método | Endpoint                              | Descripción                    |
| ------ | ------------------------------------- | ------------------------------ |
| POST   | `/api/stripe-connect/create`          | Crear cuenta + link onboarding |
| GET    | `/api/stripe-connect/status/:salonId` | Verificar estado actual        |
| POST   | `/api/stripe-connect/refresh-link`    | Renovar link si expiró         |
| POST   | `/api/stripe-connect/webhook`         | Webhook de Stripe              |

---

## 📱 Experiencia Móvil

Consideraciones especiales:

- El onboarding de Stripe es responsive
- Guardar progreso si el usuario sale
- Notificación push cuando verificación completa
- Link rápido desde notificación a settings

---

## 🚨 Casos Especiales

### **Link de Onboarding Expirado**

**Problema:** Los links de Stripe expiran en 24h

**Solución:**

```jsx
if (error.includes('expired')) {
  ;<Button onClick={refreshLink}>🔄 Generar nuevo link</Button>
}
```

### **Verificación Rechazada por Stripe**

**Problema:** Stripe puede rechazar si datos incorrectos

**Solución:**

- Mostrar razón específica de rechazo
- Botón para reintentar con datos correctos
- Soporte: Link a chat o email

### **Salón con Múltiples Ubicaciones**

**Problema:** ¿Una cuenta Stripe o varias?

**Solución actual:** Una cuenta por `salon_profile_id`

- Cada ubicación = perfil separado = cuenta Stripe separada

---

## 💡 Mejoras UX Sugeridas

### 1. **Indicador de Progreso en Dashboard**

```jsx
<ProgressBar
  steps={[
    { name: 'Perfil', done: true },
    { name: 'Servicios', done: true },
    { name: 'Pagos', done: false }, // 🔴 Bloqueante
    { name: 'Publicado', done: false },
  ]}
/>
```

### 2. **Tooltip Explicativo**

```jsx
<Tooltip content="Los clientes pagarán al instante. El 97% va a ti, 3% a Lobba.">
  <InfoIcon />
</Tooltip>
```

### 3. **Preview de Comisión**

```jsx
<Card>
  <h4>Ejemplo de pago</h4>
  <p>Servicio: 50€</p>
  <p>Comisión Lobba: 1.50€ (3%)</p>
  <p className="font-bold">Recibes: 48.50€</p>
</Card>
```

### 4. **Video Tutorial**

```jsx
<Button variant="link" onClick={openVideoModal}>
  🎥 Ver cómo configurar pagos (2 min)
</Button>
```

### 5. **Notificación por Email**

```
Asunto: "¡Última paso para recibir reservas en Lobba!"

Hola [Salón],

Tu perfil está casi listo. Solo falta configurar los pagos
para comenzar a recibir reservas.

[Botón: Configurar en 5 minutos]

Beneficios:
✓ Cobro inmediato al reservar
✓ Sin gestión manual de pagos
✓ Solo 3% de comisión

¿Necesitas ayuda? Responde este email.
```

---

## 🔒 Seguridad y Compliance

- **PCI DSS:** Stripe maneja datos de tarjetas
- **GDPR:** Datos bancarios nunca en Lobba
- **KYC/AML:** Verificación por Stripe
- **2FA:** Recomendado para cuenta Stripe

---

## 📊 Métricas a Trackear

1. **Conversión de onboarding:**
   - % de salones que inician configuración
   - % que completan verificación
   - Tiempo medio de configuración

2. **Abandono:**
   - % que abandona en Stripe
   - Razones de rechazo más comunes

3. **Tiempo hasta primera reserva:**
   - Desde registro → configuración → reserva

---

## 🎯 Checklist de Implementación

- [x] Servicio `stripeConnect.js` (API calls)
- [x] Componente `StripeConnectIntegration.jsx`
- [x] Integrado en `SalonSettings.jsx`
- [x] Rutas backend registradas
- [ ] Banner en dashboard principal
- [ ] Email de recordatorio
- [ ] Mensaje mejorado en error de reserva
- [ ] Analytics/tracking
- [ ] Tests E2E

---

## 📞 Soporte

**Para usuarios (salones):**

- Chat en vivo: Botón en SalonSettings
- Email: support@lobba.app
- Teléfono: +34 XXX XXX XXX

**Documentación Stripe:**

- [Stripe Connect Express](https://stripe.com/docs/connect/express-accounts)
- [Testing](https://stripe.com/docs/connect/testing)

---

**Última actualización:** 20 octubre 2025  
**Responsable:** Equipo Lobba
