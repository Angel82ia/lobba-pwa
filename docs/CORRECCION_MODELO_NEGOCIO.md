# CORRECCIÓN CRÍTICA: Modelo de Negocio LOBBA

## Fecha: 2025-10-14
## Estado: ✅ COMPRENDIDO - Modelo Corregido

---

## ❌ LO QUE ENTENDÍ MAL

### Mi error anterior:
```
Cliente con Membresía Spirit
  ↓ Compra en Salon (de CSV)          ← ❌ INCORRECTO
  ↓ Producto sincronizado desde ERP
  ↓ Aplica descuento 15%
```

**PROBLEMA:** Asumí que los salones vendían productos físicos de LOBBA. **ESTO ES FALSO.**

---

## ✅ MODELO CORRECTO DE LOBBA

### LOBBA tiene DOS NEGOCIOS SEPARADOS:

```
┌────────────────────────────────────────┐
│       LOBBA PWA - DOS MODELOS          │
├────────────────────────────────────────┤
│                                        │
│  1️⃣ ECOMMERCE LOBBA                   │
│     (Productos físicos marca LOBBA)   │
│     • Compresas, tampones, cosmética  │
│     • Venta DIRECTA de LOBBA          │
│     • 100% ingresos para LOBBA        │
│     • Stock gestionado por LOBBA ERP  │
│                                        │
│  2️⃣ MARKETPLACE SERVICIOS              │
│     (Servicios en salones adheridos)  │
│     • Peluquería, manicura, masajes   │
│     • Cada salón vende SUS servicios  │
│     • LOBBA cobra 3% comisión         │
│     • 97% para el salón               │
│                                        │
└────────────────────────────────────────┘
```

---

## 1️⃣ ECOMMERCE LOBBA (Productos Físicos)

### Características:
- ✅ **Productos:** Solo marca LOBBA (compresas, tampones, cosmética)
- ✅ **Venta:** Directa desde LOBBA, no desde salones
- ✅ **Stock:** Gestionado por LOBBA en su ERP propio
- ✅ **Descuentos:** 10% Essential, 15% Spirit (membresía)
- ✅ **Envío:** LOBBA envía a domicilio
- ✅ **Pago:** Stripe, 100% para LOBBA
- ❌ **Salones:** NO participan, NO venden productos

### Flujo correcto:
```
Cliente con membresía Spirit
  ↓ Entra a ECOMMERCE de LOBBA (en PWA)
  ↓ Selecciona productos marca LOBBA
  ↓ Carrito: 1 caja compresas (12€) + 1 crema (25€) = 37€
  ↓ Aplica descuento 15% Spirit = -5.55€
  ↓ Subtotal: 31.45€
  ↓ Envío GRATIS (supera 15€)
  ↓ Total: 31.45€
  ↓ Paga con Stripe → 100% a LOBBA
  ↓ LOBBA envía a domicilio cliente
```

### Tabla Products (Ecommerce):
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category VARCHAR(50),  -- 'hygiene', 'cosmetics', etc.
  price DECIMAL(10, 2),
  stock INTEGER,  -- Stock LOBBA
  images JSONB,
  seller VARCHAR(10) DEFAULT 'LOBBA',  -- Siempre LOBBA
  type VARCHAR(20) DEFAULT 'physical_product',
  -- NO hay commerce_id porque LOBBA vende directo
  created_at TIMESTAMP DEFAULT now()
);
```

### Endpoints Ecommerce:
```
GET  /api/products              # Catálogo LOBBA
GET  /api/products/:id          # Detalle producto
POST /api/cart/add              # Añadir al carrito
POST /api/checkout/process      # Comprar (100% a LOBBA)
GET  /api/orders                # Historial pedidos
```

---

## 2️⃣ MARKETPLACE SERVICIOS (Salones)

### Características:
- ✅ **Servicios:** Peluquería, manicura, masajes, depilación
- ✅ **Vendedor:** Cada salón vende SUS servicios
- ✅ **NO hay stock:** Son servicios, no productos
- ✅ **Comisión:** LOBBA cobra 3%, salón recibe 97%
- ✅ **Pago:** Stripe Split Payment (Connect)
- ✅ **Cumplimiento:** Cliente acude al salón físico

### Flujo correcto:
```
Cliente (con o sin membresía)
  ↓ Busca "Salones cerca de mí" (en PWA)
  ↓ Encuentra "Salón Belleza Madrid"
  ↓ Ve servicios: Corte (25€), Manicura (20€), Tinte (60€)
  ↓ Selecciona "Manicura (20€)"
  ↓ Reserva fecha y hora
  ↓ Paga 20€ con Stripe
  ├─ 3% (0.60€) → LOBBA (comisión)
  └─ 97% (19.40€) → Salón
  ↓ Cliente acude al salón en la fecha
  ↓ Recibe servicio de manicura
```

### Tabla Services (Marketplace):
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY,
  commerce_id UUID REFERENCES salons(id),  -- Salón que ofrece
  name TEXT NOT NULL,  -- 'Corte + Lavado', 'Manicura'
  description TEXT,
  duration INTEGER,  -- minutos
  price DECIMAL(10, 2),
  category VARCHAR(50),  -- 'hair', 'nails', 'massage'
  type VARCHAR(20) DEFAULT 'service',  -- NO es producto físico
  -- Disponibilidad
  availability JSONB,  -- {monday: [{start: '09:00', end: '20:00'}]}
  created_at TIMESTAMP DEFAULT now()
);
```

### Tabla ServiceBookings (Reservas):
```sql
CREATE TABLE service_bookings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  commerce_id UUID REFERENCES salons(id),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  price DECIMAL(10, 2),
  -- Comisión LOBBA
  commission_percentage DECIMAL(5, 2) DEFAULT 3.00,
  commission_amount DECIMAL(10, 2),  -- price * 0.03
  -- Distribución pago
  amount_to_lobba DECIMAL(10, 2),    -- price * 0.03
  amount_to_commerce DECIMAL(10, 2), -- price * 0.97
  payment_status VARCHAR(20),
  status VARCHAR(20),  -- 'pending', 'confirmed', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT now()
);
```

### Endpoints Marketplace:
```
GET  /api/commerces              # Buscar salones
GET  /api/commerces/:id          # Perfil salón
GET  /api/services/commerce/:id  # Servicios del salón
POST /api/bookings/create        # Reservar servicio
GET  /api/bookings/my-bookings   # Mis reservas
POST /api/payments/service       # Pagar (split 3%/97%)
```

---

## COMPARACIÓN LADO A LADO

| Aspecto | ECOMMERCE LOBBA | MARKETPLACE SERVICIOS |
|---------|-----------------|----------------------|
| **Qué se vende** | Productos físicos marca LOBBA | Servicios de salones |
| **Vendedor** | LOBBA directamente | Cada salón adherido |
| **Stock** | Gestionado por LOBBA ERP | No aplica (son servicios) |
| **Descuentos** | 10% Essential, 15% Spirit | Los que decida cada salón |
| **Entrega** | Envío a domicilio | En local físico del salón |
| **Pago** | 100% a LOBBA | 3% LOBBA, 97% salón |
| **Stripe** | Payment Intent simple | Split Payment (Connect) |
| **Tabla productos** | `products` | `services` |
| **Tabla pedidos** | `orders` | `service_bookings` |
| **Comercios** | NO participan | Protagonistas |

---

## ❌ LO QUE NO EXISTE EN LOBBA

1. ❌ **Venta de productos LOBBA en salones**
   - Los salones NO venden productos marca LOBBA
   - NO hay stock de productos en salones
   - NO hay sincronización inventario con salones

2. ❌ **Productos en perfil de salones**
   - En el perfil de un salón SOLO aparecen servicios
   - NO aparecen productos LOBBA

3. ❌ **Middleware de sincronización productos con salones**
   - No se necesita sincronizar stock con salones
   - Solo LOBBA ERP gestiona productos

4. ❌ **ERP compartido de productos**
   - Cada salón puede tener su ERP para agenda
   - Pero NO gestionan productos LOBBA

---

## ARQUITECTURA DE MÓDULOS CORRECTA

```
lobba-pwa/
└── src/
    └── modules/
        ├── ecommerce/              ← Productos LOBBA
        │   ├── components/
        │   │   ├── ProductCatalog.jsx
        │   │   ├── Cart.jsx
        │   │   └── ProductCheckout.jsx
        │   └── services/
        │       └── EcommerceService.js
        │
        ├── marketplace/            ← Servicios en salones
        │   ├── components/
        │   │   ├── CommerceSearch.jsx
        │   │   ├── ServiceList.jsx
        │   │   ├── BookingCalendar.jsx
        │   │   └── ServiceCheckout.jsx
        │   └── services/
        │       └── BookingService.js
        │
        ├── membership/             ← Sistema membresías
        ├── powerbanks/             ← Préstamo powerbanks
        └── shared/
            ├── components/
            └── services/
                └── StripeService.js
```

---

## INTEGRACIÓN CORRECTA CON MEMBRESÍAS

### Caso 1: Cliente con membresía compra PRODUCTO
```
Cliente con membresía Spirit
  ↓ Va a ECOMMERCE LOBBA (no a salón)
  ↓ Añade productos al carrito
  ↓ Aplica descuento 15% (Spirit)
  ↓ Envío gratis si > 15€
  ↓ Paga con Stripe
  ↓ LOBBA envía a domicilio
```

### Caso 2: Cliente con membresía reserva SERVICIO
```
Cliente con membresía Spirit
  ↓ Busca salones en MARKETPLACE
  ↓ Reserva servicio en salón
  ↓ Paga con Stripe
  ├─ 3% → LOBBA
  └─ 97% → Salón
  ↓ Acude al salón físico
  ↓ Recibe servicio
```

**NOTA:** La membresía da descuentos en PRODUCTOS LOBBA, no necesariamente en servicios de salones (salvo que el salón decida ofrecer descuento).

---

## INTEGRACIÓN CORRECTA CON POWERBANKS

```
Cliente con membresía
  ↓ Está en salón físico
  ↓ Escanea QR powerbank
  ↓ PWA registra préstamo
  ↓ Salón entrega powerbank
  ↓ Cliente tiene 24h gratis
  ↓ Si no devuelve → 10€ penalización
  ↓ Se añade a próxima factura membresía
```

**Relación:**
- `powerbank_loans.commerce_id` → `salons.id`
- Salones SÍ participan en powerbanks
- Pero NO venden productos

---

## MIGRACIONES SQL CORRECTAS

### Ya creadas (✅ Correctas):
- `040_create_memberships_table.sql` ✅
- `041_create_shared_memberships_table.sql` ✅
- `042-050_*` (sistema membresías) ✅

### Necesarias para ECOMMERCE:
```sql
-- 051_create_products_table.sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category VARCHAR(50),
  price DECIMAL(10, 2),
  stock INTEGER,
  seller VARCHAR(10) DEFAULT 'LOBBA',
  type VARCHAR(20) DEFAULT 'physical_product',
  -- NO commerce_id
);

-- 052_extend_orders_for_products.sql
ALTER TABLE orders ADD COLUMN seller VARCHAR(10) DEFAULT 'LOBBA';
ALTER TABLE orders ADD COLUMN type VARCHAR(20) DEFAULT 'product_order';
-- Campo membership_discount ya existe (049)
```

### Necesarias para MARKETPLACE:
```sql
-- 053_create_services_table.sql
CREATE TABLE services (
  id UUID PRIMARY KEY,
  commerce_id UUID REFERENCES salons(id),
  name TEXT NOT NULL,
  price DECIMAL(10, 2),
  duration INTEGER,
  category VARCHAR(50),
  type VARCHAR(20) DEFAULT 'service',
  availability JSONB
);

-- 054_create_service_bookings_table.sql
CREATE TABLE service_bookings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  commerce_id UUID REFERENCES salons(id),
  scheduled_date DATE,
  scheduled_time TIME,
  price DECIMAL(10, 2),
  commission_percentage DECIMAL(5, 2) DEFAULT 3.00,
  commission_amount DECIMAL(10, 2),
  amount_to_lobba DECIMAL(10, 2),
  amount_to_commerce DECIMAL(10, 2),
  status VARCHAR(20)
);
```

---

## STRIPE: DOS TIPOS DE PAGO

### 1. Pago Productos (Simple - 100% a LOBBA)
```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmount * 100,
  currency: 'eur',
  customer: stripeCustomerId,
  metadata: {
    orderId: order.id,
    type: 'product_order',
    seller: 'LOBBA'
  }
});
// Todo el dinero va a LOBBA
```

### 2. Pago Servicios (Split - 3% LOBBA, 97% Salón)
```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: servicePrice * 100,
  currency: 'eur',
  customer: stripeCustomerId,
  // Comisión LOBBA (3%)
  application_fee_amount: Math.round(servicePrice * 100 * 0.03),
  // Resto al salón (97%)
  transfer_data: {
    destination: commerce.stripeConnectAccountId
  },
  metadata: {
    bookingId: booking.id,
    commerceId: commerce.id,
    type: 'service_booking'
  }
});
```

---

## RESUMEN PARA IMPLEMENTACIÓN

### ✅ IMPLEMENTAR:

**MÓDULO 1: ECOMMERCE LOBBA**
- [ ] Catálogo productos marca LOBBA
- [ ] Carrito de compra
- [ ] Checkout con descuentos membresía
- [ ] Pago Stripe (100% LOBBA)
- [ ] Gestión envíos

**MÓDULO 2: MARKETPLACE SERVICIOS**
- [ ] Búsqueda salones
- [ ] Catálogo servicios por salón
- [ ] Sistema reservas con calendario
- [ ] Pago Stripe Split (3%/97%)
- [ ] Notificaciones a salones

**MÓDULO 3: MEMBRESÍAS** (Ya en progreso)
- [x] FASE 1 completada
- [ ] FASES 2-7 pendientes

### ❌ NO IMPLEMENTAR:
- ❌ Venta productos LOBBA en salones
- ❌ Sincronización stock con salones
- ❌ ERP compartido productos
- ❌ Productos en perfiles salones

---

## CASOS DE USO FINALES

**Caso 1: María quiere compresas**
→ Ecommerce LOBBA → Compra a LOBBA → Recibe en casa

**Caso 2: María quiere manicura**
→ Busca salones → Reserva servicio → Paga (3% LOBBA) → Va al salón

**Caso 3: Salón quiere vender productos**
→ NO puede vender productos LOBBA → Solo ofrece servicios → Puede recomendar ecommerce

---

**Estado:** ✅ COMPRENDIDO CORRECTAMENTE  
**Fecha:** 2025-10-14  
**Próximo paso:** Actualizar plan implementación con modelo correcto
