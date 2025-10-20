# REGLAS DE DESCUENTOS Y COMISIONES - SISTEMA LOBBA

## 🎯 REGLA FUNDAMENTAL

**LA COMISIÓN DEL INFLUENCER ES SIEMPRE 10% FIJO**

**EL DESCUENTO AL USUARIO VARÍA SEGÚN SU MEMBRESÍA:**
- Essential: 10% automático
- Spirit: 15% automático

---

## 📊 EJEMPLOS CORRECTOS

### CASO 1: Usuario Spirit con Código Influencer

```
Compra: €100.00

DESCUENTOS APLICADOS:
├─ Descuento base Spirit: 15% → -€15.00
├─ Código influencer:     10% → -€10.00
└─ TOTAL DESCUENTO:       25% → -€25.00 (MÁXIMO)

────────────────────────────────
Usuario paga:              €75.00
────────────────────────────────

COMISIÓN:
└─ Influencer: 10% de €100 = €10.00

────────────────────────────────
Ingreso LOBBA:             €75.00
Pago a influencer:        -€10.00
────────────────────────────────
Beneficio neto LOBBA:      €65.00
```

### CASO 2: Usuario Essential con Código Influencer

```
Compra: €100.00

DESCUENTOS APLICADOS:
├─ Descuento base Essential: 10% → -€10.00
├─ Código influencer:        10% → -€10.00
└─ TOTAL DESCUENTO:          20% → -€20.00

────────────────────────────────
Usuario paga:              €80.00
────────────────────────────────

COMISIÓN:
└─ Influencer: 10% de €100 = €10.00

────────────────────────────────
Ingreso LOBBA:             €80.00
Pago a influencer:        -€10.00
────────────────────────────────
Beneficio neto LOBBA:      €70.00
```

### CASO 3: Usuario Sin Membresía con Código Influencer

```
Compra: €100.00

DESCUENTOS APLICADOS:
├─ Descuento base (sin membresía): 0%  → €0.00
├─ Código influencer:              10% → -€10.00
└─ TOTAL DESCUENTO:                10% → -€10.00

────────────────────────────────
Usuario paga:              €90.00
────────────────────────────────

COMISIÓN:
└─ Influencer: 10% de €100 = €10.00

────────────────────────────────
Ingreso LOBBA:             €90.00
Pago a influencer:        -€10.00
────────────────────────────────
Beneficio neto LOBBA:      €80.00
```

---

## 🔐 REGLAS DE CÁLCULO

### 1. Descuento al Usuario

```javascript
// Base según membresía
const descuentoBase = {
  'essential': 0.10,  // 10%
  'spirit': 0.15,     // 15%
  'ninguno': 0.00     // 0%
}

// Código influencer (si aplica)
const descuentoCodigo = 0.10  // Siempre 10%

// Total con límite
let descuentoTotal = descuentoBase + descuentoCodigo
if (descuentoTotal > 0.25) {
  descuentoTotal = 0.25  // MÁXIMO 25%
}

// Precio final
const precioFinal = importeOriginal * (1 - descuentoTotal)
```

### 2. Comisión Influencer

```javascript
// SIEMPRE sobre el importe ORIGINAL
const comisionInfluencer = importeOriginal * 0.10

// NUNCA sobre el precio con descuento
// ❌ INCORRECTO: precioFinal * 0.10
// ✅ CORRECTO:   importeOriginal * 0.10
```

### 3. Ingreso LOBBA

```javascript
// Ingreso bruto (lo que paga el usuario)
const ingresoLOBBA = precioFinal

// Beneficio neto (después de comisión)
const beneficioNeto = ingresoLOBBA - comisionInfluencer
```

---

## ⚠️ ERRORES COMUNES A EVITAR

### ❌ ERROR 1: Calcular comisión sobre precio con descuento
```javascript
// MAL
const comision = precioFinal * 0.10  // ❌

// BIEN
const comision = importeOriginal * 0.10  // ✅
```

### ❌ ERROR 2: Sumar comisión al descuento
```javascript
// MAL: Interpretar que el código da 10% + comisión 10% = 20% total
const descuentoTotal = 0.15 + 0.10 + 0.10  // ❌ = 35%

// BIEN: El código da 10% de descuento, la comisión es aparte
const descuentoTotal = 0.15 + 0.10  // ✅ = 25%
const comision = importeOriginal * 0.10  // ✅ Se calcula aparte
```

### ❌ ERROR 3: Restar comisión del ingreso en el cálculo
```javascript
// MAL: Confundir "ingreso" con "beneficio neto"
const ingresoLOBBA = precioFinal - comision  // ❌

// BIEN: El ingreso es lo que paga el usuario
const ingresoLOBBA = precioFinal  // ✅
const beneficioNeto = ingresoLOBBA - comision  // ✅ (esto es aparte)
```

---

## 📋 RESUMEN EJECUTIVO

```
┌─────────────────────────────────────────────────┐
│         REGLAS INMUTABLES DEL SISTEMA           │
├─────────────────────────────────────────────────┤
│                                                 │
│ 1. Comisión influencer: SIEMPRE 10% FIJO       │
│    └─ Se calcula sobre importe ORIGINAL        │
│                                                 │
│ 2. Descuento usuario: VARIABLE según membresía │
│    ├─ Essential: 10% base                      │
│    ├─ Spirit: 15% base                         │
│    └─ Sin membresía: 0% base                   │
│                                                 │
│ 3. Código influencer: Añade 10% de descuento   │
│    └─ Se SUMA al descuento base                │
│                                                 │
│ 4. Descuento máximo total: 25%                 │
│    └─ No importa la combinación                │
│                                                 │
│ 5. Ingreso LOBBA = Lo que paga el usuario      │
│    └─ La comisión se paga DESPUÉS              │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 🧮 FÓRMULAS DEFINITIVAS

```javascript
// PASO 1: Calcular descuento total
const descuentoBase = DESCUENTO_MEMBRESIA[membershipType]  // 0, 0.10 o 0.15
const descuentoCodigo = tieneCodigo ? 0.10 : 0.00
let descuentoTotal = descuentoBase + descuentoCodigo
if (descuentoTotal > 0.25) descuentoTotal = 0.25

// PASO 2: Calcular precio que paga usuario
const importeDescuento = importeOriginal * descuentoTotal
const precioFinal = importeOriginal - importeDescuento

// PASO 3: Calcular comisión (sobre ORIGINAL)
const comisionInfluencer = tieneCodigo ? (importeOriginal * 0.10) : 0

// PASO 4: Resultados
return {
  importeOriginal,        // €100
  descuentoTotal,         // 25% (0.25)
  importeDescuento,       // €25
  precioFinal,            // €75 (lo que paga el usuario)
  ingresoLOBBA: precioFinal,  // €75
  comisionInfluencer,     // €10
  beneficioNetoLOBBA: precioFinal - comisionInfluencer  // €65
}
```
