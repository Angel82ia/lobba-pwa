# SISTEMA DE DESCUENTOS Y CÓDIGOS - IMPLEMENTACIÓN COMPLETA

## ✅ FASES COMPLETADAS

### FASE 1: Base de Datos ✅
### FASE 2: Backend - Programa Referidos ✅
### FASE 3: Backend - Códigos Influencer (Cuotas) ✅
### FASE 4: Backend - Códigos Descuento (Compras) ✅

---

## 📊 ARQUITECTURA DEL SISTEMA

### ELEMENTO 1: Programa de Referidos (Mes Gratis)
**Objetivo:** Anfitriona invita 4 amigas → todas reciben 1 mes gratis (11 cuotas en lugar de 12)

**Flujo Completo:**
1. Usuario se registra con `codigo_amigas` (código de referencia de la anfitriona)
2. Sistema valida código → `authController.js` línea 46-58
3. Se marca `tipo_descuento_aplicado = 'referido_amigas'` (PRIORIDAD 1)
4. Se registra en `referral_campaign_entries` vía `referralService.registerReferral()`
5. Cuando 4 amigas completan registro → `processCampaignCompletion()` crea `referral_memberships` para las 5 usuarias
6. Primera cuota = €0 (mes gratis)
7. Cuotas restantes: 11 en lugar de 12

**Archivos Modificados:**
- `backend/src/services/referralService.js` - Actualizado `processCampaignCompletion()` para crear `referral_memberships`
- `backend/src/controllers/authController.js` - Integración de prioridades en registro
- `backend/database/migrations/072_create_referral_memberships.sql` - Nueva tabla

**Validaciones:**
- ✅ Un usuario solo puede estar en un programa (UNIQUE constraint)
- ✅ 11 cuotas exactamente (CHECK constraint)
- ✅ Bloqueo de cambio de membresía hasta 2ª cuota

---

### ELEMENTO 2: Código Influencer - Primera Cuota
**Objetivo:** Usuario se registra con código influencer → 20% descuento en primera cuota

**Desglose del 20%:**
- 10% descuento real para el usuario
- 10% comisión para influencer

**Ejemplo con Essential (€50):**
```javascript
Cuota original: €50
Descuento 20%: -€10
Usuario paga: €40
Comisión influencer: €5 (10% de €50)
Ingreso LOBBA: €35 (€40 - €5)
```

**Flujo Completo:**
1. Usuario se registra con `codigo_referido` (sin `codigo_amigas`)
2. Sistema valida código → `influencerCodeService.validarCodigoInfluencer()`
3. Se marca `tipo_descuento_aplicado = 'codigo_influencer'` (PRIORIDAD 2)
4. Primera cuota calculada con `influencerCodeService.calcularPrimeraCuota()`
5. Al cobrar primera cuota → `generarComisionPrimeraCuota()` crea registro en `comisiones_influencers`

**Archivos Creados:**
- `backend/src/services/influencerCodeService.js` - Nuevo servicio completo
  - `validarCodigoInfluencer()` - Valida código activo y vigente
  - `calcularPrimeraCuota()` - Calcula con prioridades (referidos > influencer)
  - `generarComisionPrimeraCuota()` - Crea registro de comisión

**Migraciones:**
- `075_create_comisiones_influencers.sql` - Tabla de comisiones
- `077_update_codigos_influencers.sql` - Añade campo comisión fija 10%

**Validaciones:**
- ✅ Comisión SIEMPRE 10% (CHECK constraint)
- ✅ Prioridad sobre referidos
- ✅ Un solo código por usuario

---

### ELEMENTO 3: Descuento Base Automático
**Objetivo:** Descuento automático en TODAS las compras según membresía

**Descuentos:**
- Essential: 10% automático
- Spirit: 15% automático

**Estado:** ✅ Ya existía - NO se modificó

**Archivo:**
- `backend/src/services/membershipDiscountService.js` - `calculateMembershipDiscount()`

---

### ELEMENTO 4: Código Influencer - Compras
**Objetivo:** Código de descuento que se SUMA al descuento base (uso ÚNICO de por vida)

**Lógica de Suma:**
```javascript
// Ejemplo Spirit (15% base) + Código (10%)
Descuento base: 15%
Descuento código: +10%
Descuento total: 25% (MÁXIMO)

// Ejemplo Essential (10% base) + Código (10%)
Descuento base: 10%
Descuento código: +10%
Descuento total: 20%
```

**Flujo Completo:**
1. Usuario en checkout aplica código de descuento
2. Sistema valida:
   - Código existe y está activo → `validarCodigoDescuento()`
   - Usuario NO ha usado código antes → `validarUsoCodigoDescuento()`
3. Calcula descuento total → `calcularDescuentoCompra()`
   - Obtiene descuento base (10% o 15%)
   - Suma descuento código (10%)
   - Limita a máximo 25%
4. Al confirmar pedido → `registrarUsoCodigoDescuento()`
   - Inserta en `uso_codigos_descuento` (UNIQUE por user_id)
   - Marca `users.ha_usado_codigo_compra = TRUE`
   - Genera comisión en `comisiones_influencers`

**Archivos Creados:**
- `backend/src/services/purchaseDiscountService.js` - Nuevo servicio completo
  - `calcularDescuentoCompra()` - Calcula descuentos con suma
  - `registrarUsoCodigoDescuento()` - Registra uso único y genera comisión
  - `verificarDisponibilidadCodigo()` - Verifica si puede usar código

**Archivos Modificados:**
- `backend/src/services/membershipDiscountService.js` - Actualizado `calculateCheckoutTotals()` para aceptar código

**Migraciones:**
- `073_create_codigos_descuento.sql` - Códigos para compras
- `074_create_uso_codigos_descuento.sql` - Tracking de uso único
- `076_update_users_for_discounts.sql` - Flag `ha_usado_codigo_compra`

**Validaciones Críticas:**
- ✅ Uso ÚNICO por usuario (UNIQUE constraint en `uso_codigos_descuento.user_id`)
- ✅ Máximo 25% descuento total (CHECK constraint)
- ✅ Flag en users previene intentos de reuso

---

## 🔐 PRIORIDADES IMPLEMENTADAS

### Registro de Usuario
```javascript
if (codigo_amigas) {
  // PRIORIDAD 1: Programa de referidos
  tipo_descuento_aplicado = 'referido_amigas'
  // Ignora codigo_referido aunque lo tenga
} else if (codigo_referido) {
  // PRIORIDAD 2: Código influencer
  tipo_descuento_aplicado = 'codigo_influencer'
} else {
  tipo_descuento_aplicado = 'ninguno'
}
```

**Archivo:** `backend/src/controllers/authController.js` líneas 42-70

---

## 📁 ESTRUCTURA DE ARCHIVOS

### Nuevos Archivos Creados
```
backend/
├── database/migrations/
│   ├── 072_create_referral_memberships.sql
│   ├── 073_create_codigos_descuento.sql
│   ├── 074_create_uso_codigos_descuento.sql
│   ├── 075_create_comisiones_influencers.sql
│   ├── 076_update_users_for_discounts.sql
│   └── 077_update_codigos_influencers.sql
└── src/services/
    ├── influencerCodeService.js (NUEVO)
    └── purchaseDiscountService.js (NUEVO)
```

### Archivos Modificados
```
backend/src/
├── controllers/
│   └── authController.js (prioridades en registro)
└── services/
    ├── referralService.js (integración con referral_memberships)
    └── membershipDiscountService.js (integración con códigos de descuento)
```

---

## 🔑 FUNCIONES PRINCIPALES

### influencerCodeService.js
```javascript
// Validar código de influencer (para registro)
validarCodigoInfluencer(codigo)

// Calcular primera cuota con prioridades
calcularPrimeraCuota(userId, membershipType)

// Generar comisión de primera cuota
generarComisionPrimeraCuota(userId, cuotaCalculada, paymentId)

// Validar código de descuento (para compras)
validarCodigoDescuento(codigo)

// Verificar si usuario puede usar código de compra
validarUsoCodigoDescuento(userId)
```

### purchaseDiscountService.js
```javascript
// Calcular descuento de compra (base + código)
calcularDescuentoCompra(userId, importeOriginal, codigoDescuento)

// Registrar uso de código (único de por vida)
registrarUsoCodigoDescuento(userId, orderId, calculoDescuento)

// Verificar disponibilidad de código para usuario
verificarDisponibilidadCodigo(userId)
```

### referralService.js (actualizado)
```javascript
// Crear registros en referral_memberships cuando campaña completa
processCampaignCompletion(client, campaignId)
```

---

## 🧪 EJEMPLOS DE USO

### Ejemplo 1: Registro con código de amigas
```javascript
POST /api/auth/register
{
  "email": "maria@example.com",
  "password": "password123",
  "firstName": "María",
  "lastName": "García",
  "codigo_amigas": "LOBBA123ABC"
}

// Resultado:
// - tipo_descuento_aplicado = 'referido_amigas'
// - Se crea entrada en referral_campaign_entries
// - Primera cuota será €0 (mes gratis)
// - Total cuotas: 11 (en lugar de 12)
```

### Ejemplo 2: Registro con código influencer
```javascript
POST /api/auth/register
{
  "email": "juan@example.com",
  "password": "password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "codigo_referido": "MARIA2024"
}

// Resultado:
// - tipo_descuento_aplicado = 'codigo_influencer'
// - Primera cuota Essential: €40 (en lugar de €50)
// - Comisión influencer: €5 (pendiente)
```

### Ejemplo 3: Compra con código de descuento
```javascript
// Usuario Spirit (15% base) aplica código MARIA10 (10%)
POST /api/checkout/calculate
{
  "userId": "uuid",
  "cartItems": [...],
  "codigoDescuento": "MARIA10"
}

// Cálculo:
// Subtotal: €100
// Descuento base Spirit: -€15 (15%)
// Descuento código: -€10 (10%)
// Total descuento: -€25 (25% - MÁXIMO)
// Subtotal final: €75
// Comisión influencer: €15 (15% de €100)
```

---

## ⚠️ VALIDACIONES CRÍTICAS

### 1. Uso Único de Código de Compra
```sql
-- En tabla uso_codigos_descuento
CONSTRAINT uso_unico_por_usuario UNIQUE(user_id)
```
**Garantiza:** Un usuario NUNCA puede usar más de un código de descuento en compras.

### 2. Máximo Descuento 25%
```sql
-- En tabla uso_codigos_descuento
CONSTRAINT descuento_maximo CHECK (descuento_total_aplicado <= 25.00)
```
**Garantiza:** El descuento total nunca excede el 25%.

### 3. Comisión Fija Primera Cuota
```sql
-- En tabla codigos_influencers
CONSTRAINT comision_fija CHECK (porcentaje_comision_primera_cuota = 10.00)
```
**Garantiza:** La comisión de primera cuota es siempre 10%.

### 4. Cuotas Válidas en Programa Referidos
```sql
-- En tabla referral_memberships
CONSTRAINT cuotas_validas CHECK (cuotas_totales = 11 AND cuotas_cobradas <= 11)
```
**Garantiza:** Siempre 11 cuotas (12 - 1 mes gratis).

---

## 📈 TRACKING Y REPORTES

### Vista de Comisiones por Influencer
```sql
SELECT * FROM vista_comisiones_influencers;
```
Retorna:
- Total comisiones generadas
- Comisiones por tipo (primera_cuota / compra)
- Total pendiente vs pagado
- Por influencer

### Vista de Reportes de Influencers
```sql
SELECT * FROM vista_reportes_influencers;
```
Retorna:
- Total registros por código
- Membresías activas
- Comisiones totales generadas

---

## 🚀 PRÓXIMOS PASOS

### Pendiente: FASE 5 - Frontend
- Campo `codigo_amigas` en formulario de registro
- Campo `codigo_referido` en formulario de registro
- Campo `codigoDescuento` en checkout
- Visualización de descuentos aplicados
- Mensajes de error si código inválido o ya usado

### Pendiente: FASE 6 - Testing
- Tests unitarios de servicios
- Tests de integración
- Tests de validaciones
- Tests de casos extremos

---

## 📝 NOTAS IMPORTANTES

1. **Migraciones pendientes de ejecutar:** Todas las migraciones están creadas pero requieren ejecutar `node database/migrate.js` con la BD configurada.

2. **Códigos de ejemplo creados:**
   - `TEST2024` - Código influencer para registro
   - `MARIA2024` - Código influencer para registro
   - `MARIA10` - Código descuento para compras
   - `TEST10` - Código descuento para compras

3. **Compatibilidad:** El sistema es 100% compatible con las tablas existentes de referidos (`referral_campaigns`, etc.).

4. **Seguridad:** Todos los códigos se validan en el backend. No confiar en validaciones del frontend.

5. **Comisiones:** Se generan automáticamente en estado `pendiente`. Se requiere un proceso separado para marcarlas como `pagado`.

---

## 🔗 Referencias

- Documento: `SISTEMA DE DESCUENTOS Y CÓDIGOS - ESPECIFICACIÓN TÉCNICA.pdf`
- Documento: `DOCUMENTO 3.0 - Tareas Devin: Implementación Sistema de Códigos.pdf`
- Fase 1 Completada: `FASE_1_MIGRACIONES_COMPLETADO.md`
