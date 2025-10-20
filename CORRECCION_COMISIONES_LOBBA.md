# CORRECCIÓN COMISIONES LOBBA - ESPECIFICACIÓN DEFINITIVA

**Fecha:** 2025-10-16  
**Origen:** Documento Técnico PWA LOBBA (Leire)  
**Fuente:** Línea 82-83 del documento maestro

---

## ⚠️ CORRECCIÓN CRÍTICA DETECTADA

### ❌ ERROR PREVIO:
En mi explicación anterior mencioné:
```
Split payment: 15% LOBBA, 85% Salón
```

### ✅ CORRECCIÓN (FUENTE OFICIAL):

Según el **Documento Técnico Integral PWA LOBBA**, línea 82-83:

> **"Comisiones: -3% por servicios cobrados en app, +15% en vendidos productos LOBBA. (salones)"**

---

## 📋 ESPECIFICACIÓN CORRECTA DE COMISIONES

### 1. SERVICIOS/RESERVAS EN SALONES

**Comisión LOBBA:** **3%** (NO 15%)

#### Ejemplo Split Payment Correcto:

```
Cliente reserva servicio de maquillaje: €100
    ↓
Stripe procesa el pago
    ↓
Split automático:
├─→ €3.00 (3%) → LOBBA
└─→ €97.00 (97%) → Salón
```

#### Implementación Stripe:

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // €100
  currency: 'eur',
  application_fee_amount: 300, // €3 para LOBBA (3%)
  transfer_data: {
    destination: salon.stripe_account_id, // €97 van al salón
  },
  metadata: {
    reservation_id: reservation.id,
    commission_percentage: 3.00,
    commission_amount: 3.00,
    amount_to_lobba: 3.00,
    amount_to_commerce: 97.00
  }
});
```

#### Flujo de Dinero Real:

```
Cliente paga: €100.00
    ↓
Stripe fees: ~€2.30 (aprox 2% + €0.30)
    ↓
Total a distribuir: €97.70
    ↓
LOBBA recibe: €3.00 (3% del total original)
Salón recibe: €94.70 (€97.70 - €3.00)
```

**Nota:** Stripe cobra sus fees (~2%) adicionales del total, que son absorbidos proporcionalmente.

---

### 2. PRODUCTOS ECOMMERCE LOBBA

**Comisión LOBBA:** **15%**

#### Aplicable a:
- Productos vendidos por LOBBA directamente
- Cremas, maquillaje, accesorios del catálogo LOBBA
- NO aplicable a servicios de salones

#### Ejemplo:

```
Cliente compra crema LOBBA: €50
    ↓
LOBBA recibe: €50 (100%)
    ↓
Coste producto: ~€35 (estimado)
Ganancia LOBBA: €15
```

**Nota:** En productos LOBBA, LOBBA es el vendedor directo, no hay split payment.

---

## 🗂️ RESUMEN DE COMISIONES LOBBA

| 
Concepto | Comisión LOBBA | Recibe Comercio | Notas |
|----------|----------------|-----------------|-------|
| **Servicios/Reservas en Salones** | **3%** | **97%** | Split payment automático |
| **Productos LOBBA (ecommerce)** | **15% margen** | **N/A** | LOBBA es vendedor directo |
| **Códigos Influencer (Compras)** | Variable | N/A | Comisión influencer: 10% |
| **Códigos Influencer (Registro)** | Variable | N/A | Comisión influencer: 10% |

---

## ✅ ESTADO ACTUAL IMPLEMENTACIÓN

### Base de Datos: ✅ CORRECTO

**Migración 052:** `extend_reservations_for_commission.sql`

```sql
ALTER TABLE reservations
  ADD COLUMN commission_percentage DECIMAL(5, 2) DEFAULT 3.00, ✅
  ADD COLUMN commission_amount DECIMAL(10, 2),
  ADD COLUMN amount_to_lobba DECIMAL(10, 2),
  ADD COLUMN amount_to_commerce DECIMAL(10, 2),
  ADD COLUMN payment_status VARCHAR(30) DEFAULT 'pending',
  ADD COLUMN stripe_payment_intent_id VARCHAR(255);

COMMENT ON COLUMN reservations.commission_percentage IS 'Porcentaje de comisión LOBBA (default 3%)'; ✅
COMMENT ON COLUMN reservations.amount_to_lobba IS 'Cantidad que recibe LOBBA (3% del total)'; ✅
COMMENT ON COLUMN reservations.amount_to_commerce IS 'Cantidad que recibe el comercio (97% del total)'; ✅
```

**Estado:** ✅ **YA ESTÁ CORRECTO CON 3%**

---

## 🔧 ACTUALIZACIÓN REQUERIDA EN DOCUMENTACIÓN

### Archivos a Actualizar:

1. **`AUDITORIA_MVP_COMPLETA.md`**
   - ❌ Cambiar: "Split payment (15% LOBBA, 85% salón)"
   - ✅ Por: "Split payment (3% LOBBA, 97% salón)"

2. **`MVP_TAREAS_PENDIENTES_DETALLADAS.md`**
   - ❌ Cambiar todos los ejemplos con 15%
   - ✅ Por: ejemplos con 3%

3. **Cualquier código de ejemplo en comentarios**

---

## 📊 EJEMPLOS CORREGIDOS

### Ejemplo 1: Reserva Básica

```javascript
// Cliente reserva corte de pelo: €30

const reservation = {
  service_price: 30.00,
  commission_percentage: 3.00, // ✅ 3%
  commission_amount: 0.90,     // €30 * 0.03 = €0.90
  amount_to_lobba: 0.90,       // LOBBA recibe €0.90
  amount_to_commerce: 29.10,   // Salón recibe €29.10
  total_client_pays: 30.00
};
```

### Ejemplo 2: Reserva con IVA

```javascript
// Cliente reserva tratamiento facial: €80 + IVA

const reservation = {
  service_price_net: 80.00,
  iva_percentage: 21.00,
  iva_amount: 16.80,
  service_price_total: 96.80,      // €80 + €16.80 IVA
  
  commission_percentage: 3.00,      // ✅ 3%
  commission_amount: 2.90,          // €96.80 * 0.03 = €2.90
  amount_to_lobba: 2.90,            // LOBBA recibe €2.90
  amount_to_commerce: 93.90,        // Salón recibe €93.90
  
  total_client_pays: 96.80
};
```

### Ejemplo 3: Split Payment Stripe Correcto

```javascript
async function createReservationPayment(reservation, salon) {
  const totalAmount = reservation.total_price; // €100
  const commissionPercentage = 3.00; // 3%
  const commissionAmount = totalAmount * (commissionPercentage / 100); // €3
  const amountToCommerce = totalAmount - commissionAmount; // €97
  
  // Crear Payment Intent con Application Fee
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100, // €100 = 10000 cents
    currency: 'eur',
    application_fee_amount: commissionAmount * 100, // €3 = 300 cents ✅
    transfer_data: {
      destination: salon.stripe_account_id,
      // El salón recibirá €97 (después de Stripe fees)
    },
    metadata: {
      reservation_id: reservation.id,
      salon_id: salon.id,
      commission_percentage: commissionPercentage,
      commission_amount: commissionAmount,
      amount_to_lobba: commissionAmount,
      amount_to_commerce: amountToCommerce
    }
  });
  
  // Actualizar reserva en BD
  await pool.query(`
    UPDATE reservations
    SET 
      commission_percentage = $1,
      commission_amount = $2,
      amount_to_lobba = $3,
      amount_to_commerce = $4,
      payment_status = 'processing',
      stripe_payment_intent_id = $5
    WHERE id = $6
  `, [
    commissionPercentage,  // 3.00
    commissionAmount,       // 3.00
    commissionAmount,       // 3.00
    amountToCommerce,       // 97.00
    paymentIntent.id,
    reservation.id
  ]);
  
  return paymentIntent;
}
```

---

## 🎯 DIFERENCIAS ENTRE COMISIONES

### Reservas/Servicios: 3%
- **Bajo porcentaje** para atraer salones
- **Comisión por facilitación** (LOBBA solo conecta)
- Salones mantienen la mayoría del ingreso (97%)
- Modelo marketplace típico (bajo % alto volumen)

### Productos LOBBA: 15% margen
- **Alto margen** porque LOBBA compra y revende
- LOBBA asume inventario y logística
- Precio venta - precio coste = margen ~15%
- Modelo retail tradicional

### Códigos Influencer: 10%
- Comisión marketing/afiliación
- Beneficio para influencer que trae clientes
- LOBBA paga de su margen

---

## ✅ VALIDACIÓN FINAL

**Porcentajes Definitivos:**

```
┌──────────────────────────────────────────────┐
│        COMISIONES LOBBA OFICIALES            │
├──────────────────────────────────────────────┤
│                                              │
│  Servicios/Reservas:           3%  ✅       │
│  Productos LOBBA (margen):    15%  ✅       │
│  Códigos Influencer:          10%  ✅       │
│                                              │
└──────────────────────────────────────────────┘
```

**Fuente:** Documento Técnico PWA LOBBA (Leire), sección 6: E-commerce y Pagos

---

## 🔄 PRÓXIMOS PASOS

1. ✅ Base de datos ya tiene 3% correcto
2. ⚠️ Actualizar documentación (AUDITORIA_MVP, MVP_TAREAS)
3. ⚠️ Implementar checkout reservas con 3%
4. ⚠️ Verificar cualquier hardcoded 15% en código

**¿Confirmado el 3% para reservas?** 

Si es correcto, procedo a actualizar toda la documentación y ejemplos de código.
