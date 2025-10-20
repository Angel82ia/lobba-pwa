# ESTRUCTURA COMPLETA DEL SISTEMA DE DESCUENTOS

## 📋 TABLA DE CONTENIDOS
1. [Visión General](#visión-general)
2. [Tipos de Descuentos](#tipos-de-descuentos)
3. [Prioridades y Jerarquías](#prioridades-y-jerarquías)
4. [Estructura de Base de Datos](#estructura-de-base-de-datos)
5. [Flujos Completos](#flujos-completos)
6. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## VISIÓN GENERAL

El sistema tiene **3 ELEMENTOS PRINCIPALES** que funcionan de forma INDEPENDIENTE:

```
┌─────────────────────────────────────────────────────────────┐
│                   SISTEMA DE DESCUENTOS                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DESCUENTOS EN MEMBRESÍA (Primera Cuota)                │
│     ├─ Programa de Referidos (Código Amigas)               │
│     └─ Código Influencer                                    │
│                                                             │
│  2. DESCUENTOS PERMANENTES (Todas las Compras)             │
│     └─ Descuento Base por Membresía Activa                 │
│                                                             │
│  3. DESCUENTOS EN COMPRAS (Uso Único)                      │
│     └─ Código Influencer para Compras                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## TIPOS DE DESCUENTOS

### 🎯 ELEMENTO 1: DESCUENTOS EN MEMBRESÍA (Primera Cuota)

Estos descuentos se aplican **SOLO EN LA PRIMERA CUOTA** de la membresía. Un usuario solo puede beneficiarse de UNO de estos descuentos.

#### 1.1. Programa de Referidos (Código de Amigas)
**PRIORIDAD 1 - La más alta**

```
Usuario: "Tengo código de mi amiga: LOBBA123ABC"
Sistema: ✅ PRIORIDAD 1 ACTIVADA
         → Primera cuota: €0 (MES GRATIS)
         → Total cuotas: 11 (en lugar de 12)
         → Ignora cualquier código influencer que tenga
```

**Estructura:**
- **Tabla principal:** `referral_memberships`
- **Campos clave:**
  - `es_anfitriona`: TRUE si es quien invitó
  - `es_referida`: TRUE si fue invitada
  - `cuotas_totales`: Siempre 11
  - `cuotas_cobradas`: Contador 0-11
  - `puede_cambiar_membresia`: FALSE hasta pagar 2ª cuota

**Funcionamiento:**
```
┌─────────────┐
│ Anfitriona  │ Invita 4 amigas con su código LOBBA123ABC
└─────────────┘
       │
       ├─► Amiga 1 se registra con LOBBA123ABC
       ├─► Amiga 2 se registra con LOBBA123ABC
       ├─► Amiga 3 se registra con LOBBA123ABC
       └─► Amiga 4 se registra con LOBBA123ABC
                    │
                    ▼
        ┌──────────────────────────┐
        │ Campaña Completa (4/4)   │
        └──────────────────────────┘
                    │
                    ▼
        ┌──────────────────────────────────────┐
        │ Se crean 5 registros en             │
        │ referral_memberships:               │
        │  1. Anfitriona (es_anfitriona=TRUE) │
        │  2-5. 4 Amigas (es_referida=TRUE)   │
        │                                     │
        │ TODAS tienen:                       │
        │ - Primera cuota: €0                 │
        │ - 11 cuotas totales                 │
        └──────────────────────────────────────┘
```

#### 1.2. Código Influencer (Primera Cuota)
**PRIORIDAD 2 - Solo si NO tiene código de amigas**

```
Usuario: "Tengo código de influencer: MARIA2024"
Sistema: ¿Tiene código de amigas? NO
         ✅ PRIORIDAD 2 ACTIVADA
         → Primera cuota: 20% descuento
         → Desglose: 10% descuento real + 10% comisión influencer
```

**Estructura:**
- **Tabla principal:** `codigos_influencers`
- **Tabla de comisiones:** `comisiones_influencers`
- **Campos en users:** `codigo_referido`, `tipo_descuento_aplicado`

**Ejemplo con Essential (€50):**
```
┌─────────────────────────────────────┐
│ PRIMERA CUOTA CON CÓDIGO INFLUENCER │
├─────────────────────────────────────┤
│ Cuota original:        €50.00       │
│ Descuento 20%:        -€10.00       │
│ ───────────────────────────────     │
│ Usuario paga:          €40.00       │
│                                     │
│ COMISIÓN Y BENEFICIO:               │
│ - Ingreso LOBBA:       €40.00       │
│ - Comisión influencer: €5.00 (10%)  │
│ - Beneficio neto:      €35.00       │
└─────────────────────────────────────┘
```

**Tabla de comisiones creada:**
```sql
INSERT INTO comisiones_influencers (
  influencer_id = [ID del influencer MARIA],
  user_referido_id = [ID del usuario],
  tipo = 'primera_cuota',
  importe_base = 50.00,
  porcentaje_comision = 10.00,
  importe_comision = 5.00,
  estado = 'pendiente'
)
```

---

### 🎯 ELEMENTO 2: DESCUENTOS PERMANENTES (Membresía Activa)

Este descuento se aplica **AUTOMÁTICAMENTE EN TODAS LAS COMPRAS** mientras la membresía esté activa.

**NO requiere código. NO se consume. Es PERMANENTE.**

```
┌────────────────────────────────────────────┐
│ DESCUENTO AUTOMÁTICO POR MEMBRESÍA        │
├────────────────────────────────────────────┤
│                                            │
│ Membresía Essential:                       │
│   → 10% descuento en TODAS las compras     │
│                                            │
│ Membresía Spirit:                          │
│   → 15% descuento en TODAS las compras     │
│                                            │
│ Sin membresía activa:                      │
│   → 0% descuento automático                │
│                                            │
└────────────────────────────────────────────┘
```

**Estructura:**
- **Servicio:** `membershipDiscountService.js`
- **Función:** `calculateMembershipDiscount(userId, subtotal)`
- **NO tiene tabla dedicada** - se calcula en tiempo real según estado de membresía

**Ejemplo:**
```javascript
// Usuario con membresía Spirit activa compra productos por €100

Subtotal: €100.00
Descuento Spirit (15%): -€15.00
──────────────────────────────
Subtotal con descuento: €85.00

// Este descuento se aplica SIEMPRE, en CADA compra
```

---

### 🎯 ELEMENTO 3: DESCUENTOS EN COMPRAS (Código de Compra - Uso Único)

Este es un código que se aplica **UNA SOLA VEZ EN LA VIDA** del usuario.

**Se SUMA al descuento de membresía** pero **NUNCA puede superar el 25% total**.

```
┌────────────────────────────────────────────┐
│ CÓDIGO DE DESCUENTO EN COMPRAS            │
│ (USO ÚNICO DE POR VIDA)                   │
├────────────────────────────────────────────┤
│                                            │
│ • Código: MARIA10                          │
│ • Descuento adicional: 10%                 │
│ • Se SUMA al descuento de membresía        │
│ • Máximo total: 25%                        │
│ • Usa 1 vez → NUNCA MÁS                    │
│                                            │
└────────────────────────────────────────────┘
```

**Estructura:**
- **Tabla de códigos:** `codigos_descuento`
- **Tabla de uso:** `uso_codigos_descuento` (UNIQUE per user_id)
- **Tabla de comisiones:** `comisiones_influencers`
- **Flag en users:** `ha_usado_codigo_compra` (TRUE/FALSE)

**Lógica de Suma:**
```
┌───────────────────────────────────────────────────┐
│ EJEMPLO 1: Spirit (15%) + Código (10%)           │
├───────────────────────────────────────────────────┤
│ Subtotal:                    €100.00             │
│ Descuento base Spirit:       -€15.00 (15%)       │
│ Descuento código MARIA10:    -€10.00 (10%)       │
│ ─────────────────────────────────────────         │
│ Descuento TOTAL:             -€25.00 (25% MAX)   │
│ Total a pagar:                €75.00             │
│                                                   │
│ Ingreso LOBBA:                €75.00             │
│ Comisión influencer:          €10.00 (10% de €100)│
│ Beneficio neto LOBBA:         €65.00             │
└───────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│ EJEMPLO 2: Essential (10%) + Código (10%)        │
├───────────────────────────────────────────────────┤
│ Subtotal:                    €100.00             │
│ Descuento base Essential:    -€10.00 (10%)       │
│ Descuento código MARIA10:    -€10.00 (10%)       │
│ ─────────────────────────────────────────────     │
│ Descuento TOTAL:             -€20.00 (20%)       │
│ Total a pagar:                €80.00             │
│                                                   │
│ Ingreso LOBBA:                €80.00             │
│ Comisión influencer:          €10.00 (10% de €100)│
│ Beneficio neto LOBBA:         €70.00             │
└───────────────────────────────────────────────────┘
```

**Validación de Uso Único:**
```sql
-- CONSTRAINT en uso_codigos_descuento
CONSTRAINT uso_unico_por_usuario UNIQUE(user_id)

-- Si el usuario intenta usar CUALQUIER código otra vez:
ERROR: duplicate key value violates unique constraint
```

---

## PRIORIDADES Y JERARQUÍAS

### Prioridades en Registro (Primera Cuota)

```
┌─────────────────────────────────────────────────────────┐
│                 SISTEMA DE PRIORIDADES                  │
│                  (authController.js)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Usuario se registra con:                              │
│  - codigo_amigas: "LOBBA123ABC"                        │
│  - codigo_referido: "MARIA2024"                        │
│                                                         │
│  ┌─────────────────────────────────┐                   │
│  │ ¿Tiene codigo_amigas válido?   │                   │
│  └─────────────────────────────────┘                   │
│           │                                             │
│          SÍ ──────► PRIORIDAD 1                        │
│           │         tipo_descuento = 'referido_amigas' │
│           │         Primera cuota: €0                   │
│           │         IGNORA codigo_referido             │
│           │                                             │
│          NO                                             │
│           │                                             │
│           ▼                                             │
│  ┌─────────────────────────────────┐                   │
│  │ ¿Tiene codigo_referido válido? │                   │
│  └─────────────────────────────────┘                   │
│           │                                             │
│          SÍ ──────► PRIORIDAD 2                        │
│           │         tipo_descuento = 'codigo_influencer'│
│           │         Primera cuota: -20%                │
│           │                                             │
│          NO ──────► Sin descuento                      │
│                     tipo_descuento = 'ninguno'         │
│                     Primera cuota: precio normal       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Jerarquía en Compras

```
┌─────────────────────────────────────────────────────────┐
│           CÁLCULO DE DESCUENTO EN COMPRAS               │
│          (purchaseDiscountService.js)                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PASO 1: ¿Tiene membresía activa?                      │
│    SÍ → Descuento base: 10% o 15%                      │
│    NO → Descuento base: 0%                             │
│                                                         │
│  PASO 2: ¿Aplica código de descuento?                  │
│    └─► ¿Ha usado código antes?                         │
│         SÍ → RECHAZAR (ha_usado_codigo_compra = TRUE)  │
│         NO → Validar código                            │
│              ¿Código válido y activo?                   │
│              SÍ → Descuento código: 10%                │
│              NO → Descuento código: 0%                 │
│                                                         │
│  PASO 3: Sumar descuentos                              │
│    Descuento total = base + código                     │
│    SI descuento_total > 25% ENTONCES                   │
│       descuento_total = 25% (MÁXIMO)                   │
│                                                         │
│  PASO 4: Si usó código, marcar como usado             │
│    - INSERT en uso_codigos_descuento                   │
│    - UPDATE users SET ha_usado_codigo_compra = TRUE    │
│    - INSERT comisión en comisiones_influencers         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ESTRUCTURA DE BASE DE DATOS

### Tablas Nuevas Creadas

```
📦 MIGRACIONES 072-077

1️⃣ referral_memberships (072)
   ├─ user_id (UNIQUE) - Un usuario solo puede estar en UN programa
   ├─ referral_campaign_id - Enlace con campaña de referidos
   ├─ es_anfitriona / es_referida - Rol en el programa
   ├─ cuotas_totales - Siempre 11
   ├─ cuotas_cobradas - Contador 0-11
   └─ puede_cambiar_membresia - FALSE hasta 2ª cuota

2️⃣ codigos_descuento (073)
   ├─ codigo (UNIQUE) - Código alfanumérico
   ├─ influencer_id - FK a codigos_influencers
   ├─ porcentaje_descuento - Default 10%, Range 5-15%
   ├─ porcentaje_comision - Default 15%, Range 5-20%
   └─ activo / fecha_expiracion

3️⃣ uso_codigos_descuento (074) ⭐ CRÍTICA
   ├─ user_id (UNIQUE) ← GARANTIZA USO ÚNICO
   ├─ codigo_descuento_id
   ├─ order_id
   ├─ importe_pedido / descuento / comision
   └─ CHECK: descuento_total_aplicado <= 25%

4️⃣ comisiones_influencers (075)
   ├─ influencer_id
   ├─ user_referido_id
   ├─ tipo: 'primera_cuota' | 'compra'
   ├─ membership_payment_id OR order_id
   ├─ importe_comision
   └─ estado: 'pendiente' | 'pagado' | 'cancelado'

5️⃣ UPDATE users (076)
   ├─ tipo_descuento_aplicado: 'ninguno' | 'referido_amigas' | 'codigo_influencer'
   └─ ha_usado_codigo_compra: BOOLEAN (default FALSE)

6️⃣ UPDATE codigos_influencers (077)
   └─ porcentaje_comision_primera_cuota DECIMAL(5,2) DEFAULT 10.00
      └─ CHECK: = 10.00 (FIJO, no modificable)
```

---

## FLUJOS COMPLETOS

### FLUJO 1: Registro con Código de Amigas

```
1. Usuario rellena formulario:
   ├─ Email: maria@example.com
   ├─ Password: ******
   ├─ Nombre: María
   ├─ codigo_amigas: LOBBA123ABC ← Código de su amiga Ana
   └─ codigo_referido: (vacío)

2. Backend valida (authController.js):
   ├─ Busca en users WHERE referral_code = 'LOBBA123ABC'
   └─ ✅ Encontrado → Ana tiene ese código

3. Se crea el usuario:
   ├─ INSERT INTO users (..., tipo_descuento_aplicado = 'referido_amigas')
   └─ Se ignora cualquier codigo_referido

4. Se registra en programa de referidos (referralService.js):
   ├─ Busca campaña activa de Ana
   ├─ Si no existe → Crea nueva campaña
   └─ INSERT INTO referral_campaign_entries
      ├─ campaign_id = [campaña de Ana]
      ├─ referred_user_id = [María]
      └─ status = 'pending_payment'

5. Cuando María paga primera cuota:
   ├─ La campaña de Ana tiene 4/4 referidas
   └─ Se dispara processCampaignCompletion()
      └─ INSERT INTO referral_memberships (5 registros):
         ├─ Ana (es_anfitriona=TRUE, cuotas_totales=11)
         └─ María y 3 más (es_referida=TRUE, cuotas_totales=11)

6. Resultado:
   ├─ Ana: Primera cuota €0, 11 cuotas restantes
   ├─ María: Primera cuota €0, 11 cuotas restantes
   └─ Ana entra en sorteo trimestral
```

### FLUJO 2: Registro con Código Influencer

```
1. Usuario rellena formulario:
   ├─ Email: juan@example.com
   ├─ codigo_amigas: (vacío)
   └─ codigo_referido: MARIA2024 ← Código de influencer

2. Backend valida (authController.js):
   ├─ codigo_amigas vacío → No prioridad 1
   └─ Valida MARIA2024 en codigos_influencers
      └─ ✅ Código activo y vigente

3. Se crea el usuario:
   ├─ INSERT INTO users (
   │    codigo_referido = 'MARIA2024',
   │    tipo_descuento_aplicado = 'codigo_influencer'
   │  )

4. Cuando Juan paga primera cuota Essential (€50):
   ├─ influencerCodeService.calcularPrimeraCuota(juan_id, 'essential')
   ├─ Detecta tipo_descuento_aplicado = 'codigo_influencer'
   └─ Calcula:
      ├─ Cuota original: €50
      ├─ Descuento 20%: -€10
      ├─ Usuario paga: €40
      └─ Comisión: €5 (10% de €50)

5. Se registra el pago:
   └─ INSERT INTO membership_payments (amount = 40.00)

6. Se genera comisión:
   └─ INSERT INTO comisiones_influencers (
        influencer_id = [ID de MARIA],
        tipo = 'primera_cuota',
        importe_comision = 5.00,
        estado = 'pendiente'
      )

7. Resultado:
   ├─ Juan: Pagó €40 en lugar de €50
   ├─ MARIA: Tiene €5 pendiente de cobro
   └─ LOBBA: Ingresó €35 (€40 - €5)
```

### FLUJO 3: Compra con Código de Descuento

```
1. Usuario Spirit hace checkout:
   ├─ Carrito: €100
   ├─ Tiene membresía Spirit activa
   └─ Aplica código: MARIA10

2. Backend calcula (purchaseDiscountService.js):
   
   PASO 1: Descuento base
   ├─ Busca membresía activa
   └─ Spirit → 15% automático
   
   PASO 2: Valida código
   ├─ verifica ha_usado_codigo_compra = FALSE ✅
   ├─ valida código MARIA10 activo ✅
   └─ Código válido → 10% adicional
   
   PASO 3: Suma descuentos
   ├─ Base: 15%
   ├─ Código: +10%
   ├─ Total: 25% ✅ (no excede máximo)
   
   CÁLCULO:
   ├─ Subtotal: €100.00
   ├─ Descuento base: -€15.00
   ├─ Descuento código: -€10.00
   ├─ Total descuento: -€25.00
   └─ A pagar: €75.00
   
   COMISIÓN:
   └─ 15% de €100 = €15.00

3. Usuario confirma pedido:
   └─ Se ejecuta registrarUsoCodigoDescuento()

4. Se registra uso (TRANSACCIÓN):
   ├─ INSERT INTO uso_codigos_descuento (
   │    user_id = [usuario],
   │    codigo_descuento_id = [MARIA10],
   │    importe_final = 75.00,
   │    comision_influencer = 15.00
   │  )
   ├─ UPDATE users SET ha_usado_codigo_compra = TRUE
   └─ INSERT INTO comisiones_influencers (
        tipo = 'compra',
        importe_comision = 15.00,
        estado = 'pendiente'
      )

5. Si usuario intenta usar OTRO código:
   └─ ❌ RECHAZADO
      ├─ ha_usado_codigo_compra = TRUE
      └─ "Ya has usado un código de descuento"

6. Resultado:
   ├─ Usuario: Ahorró €25 (25%)
   ├─ Influencer: €15 pendiente de pago
   ├─ LOBBA: Ingresó €60 (€75 - €15)
   └─ Usuario NO puede usar más códigos NUNCA
```

---

## EJEMPLOS PRÁCTICOS

### CASO 1: Usuario con TODO
```
Ana se registra con:
- codigo_amigas: "LOBBA123" (de su amiga)
- codigo_referido: "MARIA2024" (de influencer)

¿Qué pasa?
✅ PRIORIDAD 1 gana
→ Primera cuota: €0 (mes gratis)
→ 11 cuotas totales
→ codigo_referido ignorado

Luego Ana hace compras:
→ Si tiene Spirit: 15% automático en TODAS las compras
→ Puede usar código MARIA10 UNA VEZ: 15% + 10% = 25%
```

### CASO 2: Usuario Solo Influencer
```
Juan se registra con:
- codigo_referido: "MARIA2024"

Primera cuota Essential:
→ €50 → €40 (20% descuento)
→ Comisión MARIA: €5

Compras posteriores:
→ Si tiene Essential: 10% automático
→ Puede usar código LUIS15 UNA VEZ: 10% + 10% = 20%
```

### CASO 3: Usuario Sin Códigos
```
Pedro se registra sin códigos

Primera cuota Essential:
→ €50 (precio normal)

Compras:
→ Si tiene Essential: 10% automático
→ Si tiene Spirit: 15% automático
→ Puede usar código UNA VEZ para sumar 10% más
```

---

## RESUMEN EJECUTIVO

```
┌────────────────────────────────────────────────────────────┐
│                    SISTEMA COMPLETO                        │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 🎯 MEMBRESÍA (Primera Cuota - Uso Único)                  │
│    ├─ Código Amigas → €0 (PRIORIDAD 1)                    │
│    └─ Código Influencer → 20% off (PRIORIDAD 2)           │
│                                                            │
│ 🎯 COMPRAS (Descuento Permanente)                         │
│    ├─ Essential → 10% SIEMPRE                             │
│    └─ Spirit → 15% SIEMPRE                                │
│                                                            │
│ 🎯 COMPRAS (Código Adicional - Uso Único de por vida)     │
│    ├─ Se suma al descuento base                           │
│    ├─ Máximo 25% total                                    │
│    └─ Solo 1 vez en la vida del usuario                   │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ ✅ 6 migraciones SQL con constraints robustos             │
│ ✅ 2 servicios nuevos completos                           │
│ ✅ 3 servicios existentes actualizados                    │
│ ✅ Validaciones en BD y aplicación                        │
│ ✅ Tracking completo de comisiones                        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```
