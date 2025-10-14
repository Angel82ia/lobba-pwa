# ANÁLISIS ESTADO ACTUAL - LOBBA PWA

## Fecha: 2025-10-14
## Análisis completo de estructura existente

---

## ✅ 1. STRIPE - YA CONFIGURADO

### Archivos existentes:
- ✅ `/backend/src/utils/stripe.js` - Utilidades Stripe
- ✅ `/backend/.env.example` - Variables configuradas

### Funciones disponibles:
```javascript
// backend/src/utils/stripe.js
- createPaymentIntent()      ✅ Pago simple
- confirmPaymentIntent()      ✅ Confirmar pago
- createRefund()              ✅ Reembolsos
- calculateCommission()       ✅ Calcular comisión
```

### Variables configuradas:
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### ⚠️ LO QUE FALTA EN STRIPE:
- ❌ **Split Payment (Stripe Connect)** - Para marketplace (3%/97%)
- ❌ Cuentas conectadas de salones
- ❌ `application_fee_amount` en pagos de servicios
- ❌ `transfer_data.destination` para enviar al salón

**CONCLUSIÓN STRIPE:** Configurado para ecommerce (100% LOBBA), falta marketplace (split 3%/97%).

---

## ✅ 2. ECOMMERCE - YA EXISTE (80% COMPLETADO)

### Tablas Base de Datos:
| Tabla | Archivo | Estado |
|-------|---------|--------|
| `product_categories` | `011_create_product_categories_table.sql` | ✅ |
| `products` | `012_create_products_table.sql` | ✅ |
| `product_variants` | `013_create_product_variants_table.sql` | ✅ |
| `product_images` | `014_create_product_images_table.sql` | ✅ |
| `carts` | `015_create_cart_and_orders_tables.sql` | ✅ |
| `cart_items` | `015_create_cart_and_orders_tables.sql` | ✅ |
| `orders` | `015_create_cart_and_orders_tables.sql` | ✅ |
| `order_items` | `015_create_cart_and_orders_tables.sql` | ✅ |

### Tabla Products - Ya tiene brand='LOBBA':
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  brand VARCHAR(255) DEFAULT 'LOBBA',  ← ✅ Ya tiene marca
  category_id UUID,
  base_price DECIMAL(10, 2),
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true
);
```

### Tabla Orders - Extendida para membresías:
```sql
-- 049_extend_orders_for_memberships.sql (YA CREADA)
ALTER TABLE orders 
  ADD COLUMN membership_discount DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN membership_type VARCHAR(20),
  ADD COLUMN free_shipping BOOLEAN DEFAULT false;
```

### Modelos Backend:
- ✅ `/backend/src/models/Product.js`
- ✅ `/backend/src/models/ProductImage.js`
- ✅ `/backend/src/models/Order.js`

### Componentes Frontend:
- ✅ `/src/modules/ecommerce/ProductGrid.jsx`
- ✅ `/src/modules/ecommerce/ProductDetail.jsx`
- ✅ `/src/modules/ecommerce/Cart.jsx`
- ✅ `/src/modules/ecommerce/CheckoutForm.jsx`
- ✅ `/src/modules/ecommerce/Wishlist.jsx`

### ⚠️ LO QUE FALTA EN ECOMMERCE:
- ❌ Campo `seller` en tabla orders (para diferenciar origen)
- ❌ Campo `type` = 'product_order' en orders
- ❌ Lógica de descuentos membresía en checkout (10% Essential, 15% Spirit)
- ❌ Lógica de envío gratis (>30€ Essential, >15€ Spirit)
- ❌ Integración Stripe completa en checkout

**CONCLUSIÓN ECOMMERCE:** Casi terminado, solo falta integrar lógica membresías + Stripe.

---

## ✅ 3. MARKETPLACE - YA EXISTE (70% COMPLETADO)

### Tablas Base de Datos:
| Tabla | Archivo | Estado |
|-------|---------|--------|
| `salon_profiles` | `004_create_salon_profiles_table.sql` | ✅ |
| `salon_categories` | `005_create_salon_categories_table.sql` | ✅ |
| `salon_services` | `006_create_salon_services_table.sql` | ✅ |
| `salon_gallery` | `007_create_salon_gallery_table.sql` | ✅ |
| `reservations` | `009_create_reservations_table.sql` | ✅ |

### Tabla salon_profiles - Ya tiene geolocalización:
```sql
CREATE TABLE salon_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  business_name VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  phone VARCHAR(50),
  website TEXT,
  
  location GEOGRAPHY(Point, 4326),  ← ✅ PostGIS para búsqueda cercana
  business_hours JSONB,             ← ✅ Horarios dinámicos
  
  is_click_collect BOOLEAN DEFAULT false,
  accepts_reservations BOOLEAN DEFAULT true,
  
  rating DECIMAL(2, 1) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false
);
```

### Tabla salon_services - Ya tiene todo necesario:
```sql
CREATE TABLE salon_services (
  id UUID PRIMARY KEY,
  salon_profile_id UUID REFERENCES salon_profiles(id),
  category_id UUID,
  
  name VARCHAR(255) NOT NULL,       ← ✅ 'Corte', 'Manicura'
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,    ← ✅ Precio servicio
  duration_minutes INTEGER NOT NULL, ← ✅ Duración
  
  discount_percentage INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

### Tabla reservations - Ya completa:
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  salon_profile_id UUID REFERENCES salon_profiles(id),
  service_id UUID REFERENCES salon_services(id),
  
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  buffer_minutes INTEGER DEFAULT 15,
  
  status VARCHAR(20),  -- 'pending', 'confirmed', 'completed', 'cancelled'
  
  deposit_paid BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(10, 2),
  total_price DECIMAL(10, 2) NOT NULL,  ← ✅ Precio total
  
  google_calendar_event_id VARCHAR(255)
);
```

### Modelos Backend:
- ✅ `/backend/src/models/SalonProfile.js`
- ✅ `/backend/src/models/SalonService.js`
- ✅ `/backend/src/models/SalonCategory.js`
- ✅ `/backend/src/models/SalonGallery.js`
- ✅ `/backend/src/models/Reservation.js`

### Rutas Backend:
- ✅ `/backend/src/routes/salon.js`
- ✅ `/backend/src/routes/reservation.js`

### Componentes Frontend:
- ✅ `/src/modules/salon/SalonList.jsx`
- ✅ `/src/modules/salon/SalonProfile.jsx`
- ✅ `/src/modules/salon/EditSalonProfile.jsx`
- ✅ `/src/modules/reservations/ReservationCalendar.jsx`
- ✅ `/src/modules/reservations/ReservationList.jsx`

### ⚠️ LO QUE FALTA EN MARKETPLACE:
- ❌ **Campos de comisión en tabla `reservations`:**
  ```sql
  commission_percentage DECIMAL(5, 2) DEFAULT 3.00,
  commission_amount DECIMAL(10, 2),
  amount_to_lobba DECIMAL(10, 2),
  amount_to_commerce DECIMAL(10, 2),
  payment_status VARCHAR(20)
  ```
- ❌ **Campo Stripe Connect en `salon_profiles`:**
  ```sql
  stripe_connect_account_id VARCHAR(255)
  ```
- ❌ **Split Payment Stripe** (3% LOBBA, 97% salón)
- ❌ Flujo de pago en checkout de servicios
- ❌ Webhook para confirmar reserva tras pago

**CONCLUSIÓN MARKETPLACE:** Estructura completa, solo falta lógica comisión + Stripe Connect.

---

## ✅ 4. MEMBRESÍAS - EN PROGRESO (50% COMPLETADO)

### Tablas creadas (migraciones 040-050):
| Tabla | Archivo | Estado |
|-------|---------|--------|
| `memberships` | `040_create_memberships_table.sql` | ✅ |
| `shared_memberships` | `041_create_shared_memberships_table.sql` | ✅ |
| **Extensiones:** | `042_extend_memberships_table.sql` | ✅ |
| - `billing_cycle` | 042 | ✅ |
| - `is_free_month` | 042 | ✅ |
| - `referral_code` | 042 | ✅ |
| `monthly_limits` | `043_create_monthly_limits_table.sql` | ✅ |
| `monthly_shipments` | `044_create_monthly_shipments_table.sql` | ✅ |
| `powerbank_loans` | `045_create_powerbank_loans_table.sql` | ✅ |
| `emergency_article_uses` | `046_create_emergency_article_uses_table.sql` | ✅ |
| `referral_campaigns` | `047_create_referral_campaigns_table.sql` | ✅ |
| Users extension | `048_extend_users_for_referrals.sql` | ✅ |
| Orders extension | `049_extend_orders_for_memberships.sql` | ✅ |
| Sync triggers | `050_create_sync_triggers.sql` | ✅ |

### Componentes creados:
- ✅ `/src/pages/Membership.jsx`
- ✅ `/src/modules/membership/components/SharedMembershipForm.jsx`
- ✅ `/src/modules/membership/components/SharedMembershipCard.jsx`
- ✅ `/backend/src/models/SharedMembership.js`
- ✅ `/backend/src/controllers/membershipController.js`
- ✅ `/backend/src/routes/membership.js`

### ⚠️ LO QUE FALTA EN MEMBRESÍAS:
- ❌ FASES 2-7 del plan de implementación
- ❌ Dashboard membresía con límites mensuales
- ❌ Lógica powerbanks
- ❌ Lógica emergencias
- ❌ Sistema referidos completo
- ❌ Webhooks Stripe suscripciones

**CONCLUSIÓN MEMBRESÍAS:** Fase 1 completada (estructura DB), faltan fases 2-7.

---

## ❌ 5. ERP (ODOO) - NO EXISTE

### Estado:
- ❌ No hay integración ERP
- ❌ No hay middleware sincronización
- ❌ No hay códigos internos productos
- ❌ No hay sincronización stock automática

### Documentos revisados:
- `/home/ubuntu/attachments/e5db77c3-d600-4dc0-b8f1-8456de77b16d/erp+lobba+productos++stripe.pdf`

### Lo que necesitaría:
1. Códigos internos únicos por producto
2. Middleware sincronización stock
3. Webhook ERP → PWA cuando cambia stock
4. Validación stock antes de venta

**CONCLUSIÓN ERP:** Usuario dice "probable que lo dejemos para una segunda fase" ✅

---

## ❌ 6. CSV MASS IMPORT SALONES - NO EXISTE

### Estado:
- ❌ No hay endpoint mass import
- ❌ No hay validación CSV
- ❌ No hay parser CSV → DB

### Documentos revisados:
- `/home/ubuntu/attachments/0cfa146b-a655-477c-a622-ff7e27d2ba46/csv+negocios+y+guia+para+rellenado+ayuda..pdf`

### Lo que necesitaría:
1. Template CSV con columnas exactas
2. Endpoint `/api/admin/salons/import-csv`
3. Validación datos (coordenadas, teléfonos, etc.)
4. Procesamiento masivo (chunking)

**CONCLUSIÓN CSV:** Pendiente de implementar cuando usuario lo pida.

---

## 📊 RESUMEN ESTADO ACTUAL

### ✅ LO QUE YA FUNCIONA:

**ECOMMERCE (80% COMPLETO):**
- ✅ Base de datos products completa
- ✅ Carrito de compra
- ✅ Frontend product catalog
- ✅ Stock management
- ❌ Falta: Integrar descuentos membresía + Stripe checkout

**MARKETPLACE (70% COMPLETO):**
- ✅ Base de datos salons completa
- ✅ Servicios por salón
- ✅ Sistema reservas
- ✅ Frontend búsqueda salones
- ❌ Falta: Comisión 3%/97% + Stripe Connect

**MEMBRESÍAS (50% COMPLETO):**
- ✅ Estructura DB completa (10 migraciones)
- ✅ Componentes compartir membresía
- ❌ Falta: Fases 2-7 (dashboard, límites, powerbanks, etc.)

**STRIPE:**
- ✅ Configurado básico
- ❌ Falta: Stripe Connect (marketplace)

### ❌ LO QUE NO EXISTE:

1. **ERP (Odoo)** - Segunda fase según usuario
2. **CSV Mass Import** - Pendiente
3. **Split Payment Marketplace** - Necesario
4. **Descuentos automáticos membresía** - Necesario
5. **Dashboard membresías cliente** - Necesario

---

## 🔄 COMPARACIÓN CON DOCUMENTOS

### Documento: "flujo de ecomerce- negocios.pdf"

**✅ CORRECTO EN PROYECTO ACTUAL:**
- ✅ Productos LOBBA separados de salones
- ✅ Servicios en salones (no productos)
- ✅ `brand = 'LOBBA'` en tabla products
- ✅ Reservations solo para servicios

**❌ FALTA IMPLEMENTAR:**
- ❌ Tabla `orders.seller` = 'LOBBA' (para distinguir)
- ❌ Tabla `reservations` campos comisión
- ❌ Stripe Split Payment

### Documento: "membresias tecnico.pdf"

**✅ YA IMPLEMENTADO:**
- ✅ Membresía Essential / Spirit
- ✅ Compartir membresía (max 5)
- ✅ Billing cycle, free month
- ✅ Tablas límites mensuales

**❌ FALTA IMPLEMENTAR:**
- ❌ UI Dashboard membresía
- ❌ Lógica powerbanks
- ❌ Lógica emergencias
- ❌ Aplicar descuentos en checkout

### Documento: "erp+lobba+productos+stripe.pdf"

**❌ NO IMPLEMENTADO:**
- ❌ Integración ERP (segunda fase)
- ❌ Códigos internos productos
- ❌ Sincronización stock automática

### Documento: "csv+negocios.pdf"

**❌ NO IMPLEMENTADO:**
- ❌ Endpoint import CSV
- ❌ Validación masiva
- ❌ Parser CSV

---

## 🎯 PRIORIDADES SEGÚN DOCUMENTOS

### ALTA PRIORIDAD (Necesario para funcionamiento):

**1. ECOMMERCE - Completar integración:**
- [ ] Campo `orders.seller` = 'LOBBA'
- [ ] Campo `orders.type` = 'product_order'
- [ ] Lógica descuento membresía en checkout (10%/15%)
- [ ] Lógica envío gratis (>30€ Essential, >15€ Spirit)
- [ ] Integrar Stripe en ProductCheckout

**2. MARKETPLACE - Agregar comisiones:**
- [ ] Migración: Extender `reservations` con campos comisión
- [ ] Migración: Campo `stripe_connect_account_id` en `salon_profiles`
- [ ] Implementar Split Payment Stripe Connect
- [ ] Checkout servicios con pago (3%/97%)

**3. MEMBRESÍAS - Dashboard cliente:**
- [ ] UI Dashboard membresía
- [ ] Mostrar límites mensuales
- [ ] Tracking envíos mensuales
- [ ] Gestión powerbanks

### MEDIA PRIORIDAD:

**4. CSV IMPORT SALONES:**
- [ ] Endpoint `/api/admin/salons/import-csv`
- [ ] Validación CSV
- [ ] Parser y procesamiento masivo

**5. STRIPE WEBHOOKS:**
- [ ] Webhook suscripciones membresías
- [ ] Webhook pagos marketplace
- [ ] Sincronización automática estados

### BAJA PRIORIDAD (Segunda fase):

**6. ERP (ODOO):**
- [ ] Integración middleware
- [ ] Sincronización stock
- [ ] Códigos internos

---

## 📋 ARQUITECTURA MÓDULOS ACTUAL

```
lobba-pwa/
├── src/
│   └── modules/
│       ├── ecommerce/          ← ✅ 80% completo
│       │   ├── ProductGrid.jsx
│       │   ├── ProductDetail.jsx
│       │   ├── Cart.jsx
│       │   ├── CheckoutForm.jsx  ← ❌ Falta Stripe + membresías
│       │   └── Wishlist.jsx
│       │
│       ├── salon/              ← ✅ 70% completo
│       │   ├── SalonList.jsx
│       │   ├── SalonProfile.jsx
│       │   └── EditSalonProfile.jsx
│       │
│       ├── reservations/       ← ✅ 70% completo
│       │   ├── ReservationCalendar.jsx
│       │   └── ReservationList.jsx  ← ❌ Falta checkout pago
│       │
│       └── membership/         ← ⚠️ 50% completo
│           └── components/
│               ├── SharedMembershipForm.jsx  ✅
│               └── SharedMembershipCard.jsx  ✅
│               └── MembershipDashboard.jsx   ❌ NO EXISTE
│
└── backend/
    ├── database/migrations/
    │   ├── 011-015_*          ← ✅ Ecommerce
    │   ├── 004-009_*          ← ✅ Marketplace
    │   └── 040-050_*          ← ✅ Membresías
    │
    ├── src/
    │   ├── models/
    │   │   ├── Product.js     ✅
    │   │   ├── Order.js       ✅
    │   │   ├── SalonProfile.js ✅
    │   │   ├── SalonService.js ✅
    │   │   └── Reservation.js ✅ (falta comisión)
    │   │
    │   └── utils/
    │       └── stripe.js      ⚠️ (falta Split Payment)
```

---

## ✅ CONCLUSIONES FINALES

### 1. **Stripe:** YA CONFIGURADO
- ✅ Básico funciona
- ❌ Falta Stripe Connect para marketplace

### 2. **ERP (Odoo):** NO, SEGUNDA FASE ✅
- Usuario confirma: "probable que lo dejemos para una segunda fase"

### 3. **Ecommerce:** NO DUPLICADO ✅
- Ya existe completo (80%)
- Solo falta integrar membresías + Stripe

### 4. **Marketplace:** NO DUPLICADO ✅
- Ya existe completo (70%)
- Solo falta comisiones + Stripe Connect

### 5. **NO HAY CONFLICTOS** ✅
- Productos = Solo LOBBA ✅
- Servicios = Solo salones ✅
- Separación clara ✅

---

## 🚀 PRÓXIMOS PASOS RECOMENDADOS

### Opción A: Completar Ecommerce (más rápido)
1. Extender orders (seller, type)
2. Integrar descuentos membresía en checkout
3. Integrar Stripe en checkout productos
4. Lógica envío gratis

### Opción B: Completar Marketplace (más valor)
1. Extender reservations (comisiones)
2. Stripe Connect accounts
3. Split Payment implementación
4. Checkout servicios con pago

### Opción C: Completar Membresías (más complejo)
1. Dashboard membresía
2. Límites mensuales UI
3. Powerbanks lógica
4. Emergencias lógica

---

**RECOMENDACIÓN:** Empezar por **Opción A** (Ecommerce) porque:
- ✅ Más rápido (menos cambios)
- ✅ Genera ingresos directos
- ✅ No requiere Stripe Connect
- ✅ Permite testear flujo completo

Luego **Opción B** (Marketplace) y finalmente **Opción C** (Membresías dashboard).

---

**Fecha:** 2025-10-14  
**Análisis:** Completo ✅  
**Conflictos:** Ninguno ✅  
**Listo para implementar:** Sí ✅
