# ✅ Solución: Error "Salón no ha configurado pagos"

## 🔴 Problema Original

Al intentar hacer una reserva, aparecía el error:

```json
{
  "error": "This salon has not configured payment reception yet. Please contact the salon."
}
```

## 🎯 Causa

El salón no tiene configurado **Stripe Connect**, que es necesario para recibir pagos de reservas.

## ✅ Solución Implementada

### 1. **Componente de Configuración**

Se ha creado `StripeConnectIntegration.jsx` que permite a los salones:

- Crear cuenta Stripe Connect
- Completar verificación KYC
- Ver estado de configuración

**Ubicación:** `/salon/:id/settings`

### 2. **Flujo UX Claro**

**Para el Salón:**

1. Ir a "Configuración del Salón"
2. Sección "💳 Pagos y Reservas" (primera sección)
3. Clic en "🚀 Conectar con Stripe"
4. Completar onboarding en Stripe (5-10 min)
5. ✅ Listo para recibir reservas

**Para el Cliente:**

- Si intenta reservar en salón sin configuración → Error claro
- Mensaje mejorado con contacto del salón

---

## 📋 Cómo Configurar Stripe Connect (Paso a Paso)

### **Paso 1: Acceder a Configuración**

```
1. Iniciar sesión como dueño del salón
2. Ir a "Mi Salón" o Dashboard
3. Clic en "⚙️ Configuración" o "Ajustes"
4. Buscar sección "💳 Pagos y Reservas"
```

### **Paso 2: Iniciar Conexión**

```
1. Verás un card con título "Configura tus Pagos"
2. Lee los beneficios:
   ✓ Cobro inmediato al reservar
   ✓ Transferencias directas a tu cuenta
   ✓ Solo 3% de comisión

3. Clic en botón "🚀 Conectar con Stripe"
```

### **Paso 3: Completar en Stripe**

Serás redirigido al sitio de Stripe donde deberás proporcionar:

**Información del Negocio:**

- CIF o NIF del negocio
- Nombre fiscal
- Dirección fiscal
- Tipo de negocio

**Datos Bancarios:**

- IBAN de la cuenta bancaria
- Nombre del titular

**Verificación de Identidad:**

- DNI/NIE del representante legal
- Foto o escaneo del documento

**Tiempo estimado:** 5-10 minutos

### **Paso 4: Confirmación**

```
1. Al completar, Stripe te redirige a Lobba
2. Verás mensaje: ✅ "¡Configuración completada!"
3. Tu salón ya puede recibir reservas con pago
```

---

## 🎨 Estados del Sistema

### **Estado 1: Sin Configurar** ⚠️

```
Card con borde rojo/naranja
Título: "Configura tus Pagos"
Botón: "🚀 Conectar con Stripe"
```

**Lo que el salón NO puede hacer:**

- ❌ Recibir reservas con pago online
- ✓ Crear servicios
- ✓ Editar horarios

### **Estado 2: En Proceso** ⏳

```
Card con borde amarillo
Título: "Configuración Pendiente"
Botón: "📝 Completar Verificación"
```

**Causas:**

- Onboarding iniciado pero no completado
- Verificación pendiente por Stripe
- Documentación faltante

### **Estado 3: Configurado** ✅

```
Card con borde verde
Título: "Pagos Configurados"
Badges: ✓ Cuenta | ✓ Cobros | ✓ Transferencias
```

**El salón puede:**

- ✅ Recibir reservas con pago online
- ✅ Ver pagos en dashboard
- ✅ Recibir transferencias automáticas

---

## 💰 Comisiones y Pagos

### **Estructura de Pago**

Ejemplo con servicio de **50€**:

```
Cliente paga:        50.00€
─────────────────────────────
Comisión Lobba (3%): -1.50€
Salón recibe:        48.50€
```

### **Calendario de Transferencias**

- **Frecuencia:** Según configuración Stripe (diario/semanal)
- **Primera transferencia:** 7-14 días (verificación)
- **Siguientes:** Automáticas
- **Moneda:** EUR
- **Cuenta:** La configurada en Stripe

---

## 🚨 Problemas Comunes

### 1. **Link de Onboarding Expiró**

**Síntoma:** No puedes acceder al link que te enviaron

**Solución:**

```
1. Volver a /salon/:id/settings
2. Clic en "📝 Completar Verificación"
3. Se genera nuevo link (válido 24h)
```

### 2. **Verificación Rechazada**

**Síntoma:** Stripe rechaza tus documentos

**Causas comunes:**

- Documento ilegible o borroso
- Datos no coinciden con registro
- Documento caducado

**Solución:**

1. Revisa email de Stripe con detalles
2. Corrige información
3. Reinicia onboarding

### 3. **No Recibo Pagos**

**Verifica:**

- [ ] Stripe Connect está "Enabled"
- [ ] Cuenta bancaria verificada
- [ ] No hay alertas en dashboard Stripe
- [ ] Han pasado >7 días desde primera reserva

### 4. **Error al Intentar Configurar**

**Mensaje:** "Salon already has a Stripe Connect account"

**Causa:** Ya existe una cuenta

**Solución:**

```
1. Verifica estado actual
2. Si está pendiente, completa verificación
3. Si hay problema, contacta soporte
```

---

## 📱 Accesos Rápidos

### **Para Salones:**

- Configuración: `/salon/:id/settings`
- Dashboard pagos: [Stripe Dashboard](https://dashboard.stripe.com)
- Soporte: support@lobba.app

### **Para Clientes:**

- Si un salón no tiene pagos configurados:
  - Contactar directamente al salón
  - Solicitar que configure Stripe
  - Esperar confirmación

---

## 🔐 Seguridad

**Tus datos están seguros:**

- 🔒 Certificación PCI DSS Level 1 (Stripe)
- 🔒 Encriptación end-to-end
- 🔒 Nunca guardamos datos de tarjetas
- 🔒 Cumple GDPR europeo

**Stripe procesa pagos para:**

- Amazon
- Shopify
- Booking.com
- Y millones de negocios globalmente

---

## 📊 Beneficios de Configurar Pagos

### **Para el Salón:**

1. ✅ Reservas confirmadas al instante (sin no-shows)
2. ✅ Cobro garantizado antes del servicio
3. ✅ No gestión manual de pagos
4. ✅ Transferencias automáticas
5. ✅ Dashboard con todas las transacciones

### **Para el Cliente:**

1. ✅ Reserva en segundos
2. ✅ Pago seguro con tarjeta
3. ✅ Confirmación inmediata
4. ✅ Recibo automático
5. ✅ Reembolso fácil si cancela (políticas del salón)

---

## 📞 Soporte Técnico

**¿Necesitas ayuda?**

**Chat en vivo:**

- Disponible en la app
- Horario: L-V 9:00-18:00

**Email:**

- support@lobba.app
- Respuesta en < 24h

**Teléfono:**

- +34 XXX XXX XXX (solo urgencias)

**Centro de ayuda:**

- help.lobba.app/stripe-connect
- Guías paso a paso con capturas

---

## ✅ Checklist para Salones

Antes de publicar tu salón:

- [ ] Perfil completo (nombre, descripción, fotos)
- [ ] Servicios creados con precios
- [ ] Horarios configurados
- [ ] **💳 Stripe Connect configurado** ← ¡Importante!
- [ ] Primera reserva de prueba realizada
- [ ] Notificaciones activadas

---

**Fecha de implementación:** 20 octubre 2025  
**Última actualización:** 20 octubre 2025  
**Versión:** 1.0
