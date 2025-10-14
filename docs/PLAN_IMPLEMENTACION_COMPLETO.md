# PLAN DE IMPLEMENTACIÓN COMPLETO - LOBBA PWA

## Fecha: 2025-10-14
## Orden: A → B → C → D → Revisión General

---

## 🎯 FASE A: COMPLETAR ECOMMERCE

### Objetivo:
Integrar descuentos de membresía y checkout Stripe completo en ecommerce LOBBA.

### Tareas:

#### A1. Extender tabla `orders`
```sql
-- 051_extend_orders_for_ecommerce.sql
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS seller VARCHAR(20) DEFAULT 'LOBBA',
  ADD COLUMN IF NOT EXISTS type VARCHAR(30) DEFAULT 'product_order';

CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(type);
```

#### A2. Backend - Servicio cálculo descuentos membresía
**Archivo:** `/backend/src/services/membershipDiscountService.js`
```javascript
// Calcular descuento según membresía
export const calculateMembershipDiscount = (userId, cartTotal) => {
  // 10% Essential, 15% Spirit
}

// Calcular envío según umbral
export const calculateShipping = (membershipType, cartTotal) => {
  // Gratis si >30€ Essential, >15€ Spirit
}
```

#### A3. Backend - Controlador checkout productos
**Archivo:** `/backend/src/controllers/productCheckoutController.js`
```javascript
export const processProductCheckout = async (req, res) => {
  // 1. Validar usuario y membresía
  // 2. Calcular descuentos
  // 3. Calcular envío
  // 4. Crear Payment Intent Stripe (100% LOBBA)
  // 5. Guardar order en DB
  // 6. Actualizar stock
}
```

#### A4. Backend - Ruta checkout
**Archivo:** `/backend/src/routes/productCheckout.js`
```javascript
POST /api/checkout/products/calculate  // Calcular totales
POST /api/checkout/products/process    // Procesar pago
```

#### A5. Frontend - Componente CheckoutProducts
**Archivo:** `/src/modules/ecommerce/CheckoutProducts.jsx`
```jsx
// 1. Mostrar resumen carrito
// 2. Aplicar descuento membresía (si tiene)
// 3. Calcular envío
// 4. Stripe Elements para pago
// 5. Confirmar pedido
```

#### A6. Testing
- [ ] Test: Usuario sin membresía → Sin descuento
- [ ] Test: Usuario Essential → 10% descuento, envío gratis >30€
- [ ] Test: Usuario Spirit → 15% descuento, envío gratis >15€
- [ ] Test: Pago Stripe exitoso → Order creada
- [ ] Test: Stock se actualiza tras compra

---

## 🎯 FASE B: COMPLETAR MARKETPLACE

### Objetivo:
Implementar comisiones LOBBA (3%/97%) y Stripe Connect para pagos a salones.

### Tareas:

#### B1. Extender tabla `reservations`
```sql
-- 052_extend_reservations_for_commission.sql
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS commission_percentage DECIMAL(5, 2) DEFAULT 3.00,
  ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS amount_to_lobba DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS amount_to_commerce DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_reservations_payment_status ON reservations(payment_status);
```

#### B2. Extender tabla `salon_profiles`
```sql
-- 053_extend_salon_profiles_for_stripe_connect.sql
ALTER TABLE salon_profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_enabled BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_salon_stripe_account ON salon_profiles(stripe_connect_account_id);
```

#### B3. Backend - Servicio Stripe Connect
**Archivo:** `/backend/src/services/stripeConnectService.js`
```javascript
// Crear cuenta Connect para salón
export const createConnectAccount = async (salonId) => {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'ES'
  });
  // Guardar account.id en salon_profiles
}

// Generar link onboarding
export const createAccountLink = async (accountId) => {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: 'https://lobba.app/salon/connect/refresh',
    return_url: 'https://lobba.app/salon/connect/return',
    type: 'account_onboarding'
  });
}

// Split Payment (3% LOBBA, 97% Salón)
export const createSplitPayment = async (reservation) => {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: reservation.total_price * 100,
    currency: 'eur',
    application_fee_amount: Math.round(reservation.total_price * 100 * 0.03),
    transfer_data: {
      destination: salon.stripe_connect_account_id
    }
  });
}
```

#### B4. Backend - Controlador reservas con pago
**Archivo:** `/backend/src/controllers/reservationCheckoutController.js`
```javascript
export const processReservationCheckout = async (req, res) => {
  // 1. Validar servicio y horario
  // 2. Calcular comisión (3%)
  // 3. Crear Split Payment Stripe
  // 4. Crear reservation con payment_status='pending'
  // 5. Confirmar tras pago exitoso
}
```

#### B5. Backend - Rutas marketplace
**Archivo:** `/backend/src/routes/reservationCheckout.js`
```javascript
POST /api/reservations/checkout        // Crear reserva + pago
GET  /api/reservations/:id/status      // Estado pago
POST /api/salon/connect/create         // Crear cuenta Connect
GET  /api/salon/connect/status         // Estado onboarding
```

#### B6. Frontend - Componente ReservationCheckout
**Archivo:** `/src/modules/reservations/ReservationCheckout.jsx`
```jsx
// 1. Seleccionar servicio
// 2. Elegir fecha/hora
// 3. Mostrar precio (con desglose: precio + comisión)
// 4. Stripe Elements para pago
// 5. Confirmar reserva
```

#### B7. Frontend - Panel Stripe Connect para salones
**Archivo:** `/src/modules/salon/StripeConnectOnboarding.jsx`
```jsx
// 1. Botón "Conectar Stripe"
// 2. Redirigir a Stripe onboarding
// 3. Mostrar estado conexión
```

#### B8. Testing
- [ ] Test: Crear cuenta Stripe Connect para salón
- [ ] Test: Split Payment: 3% LOBBA, 97% salón
- [ ] Test: Reserva creada con payment_status='pending'
- [ ] Test: Webhook confirma pago → status='confirmed'
- [ ] Test: Salón recibe 97% en su cuenta Connect

---

## 🎯 FASE C: COMPLETAR MEMBRESÍAS

### Objetivo:
Dashboard cliente con límites mensuales, powerbanks, y emergencias.

### Tareas:

#### C1. Backend - Servicio límites mensuales
**Archivo:** `/backend/src/services/membershipLimitsService.js`
```javascript
// Obtener límites del mes actual
export const getCurrentMonthLimits = async (userId) => {
  // Consultar monthly_limits tabla
  // Devolver: emergencias usadas, powerbanks activos, etc.
}

// Verificar si puede usar emergencia
export const canUseEmergency = async (userId) => {
  const limits = await getCurrentMonthLimits(userId);
  return limits.emergencies_used < limits.max_emergencies;
}
```

#### C2. Backend - Controlador membresía dashboard
**Archivo:** `/backend/src/controllers/membershipDashboardController.js`
```javascript
export const getMembershipDashboard = async (req, res) => {
  // 1. Info membresía (tipo, estado, próxima factura)
  // 2. Límites mensuales (emergencias, envíos)
  // 3. Powerbanks activos
  // 4. Historial envíos mensuales
  // 5. Compartidos (si es titular)
}
```

#### C3. Backend - Rutas dashboard
**Archivo:** `/backend/src/routes/membershipDashboard.js`
```javascript
GET  /api/membership/dashboard              // Dashboard completo
GET  /api/membership/limits/current-month   // Límites mes actual
POST /api/membership/emergency/use          // Usar emergencia
GET  /api/membership/powerbanks/active      // Powerbanks prestados
POST /api/membership/powerbanks/return      // Devolver powerbank
```

#### C4. Frontend - Componente MembershipDashboard
**Archivo:** `/src/modules/membership/components/MembershipDashboard.jsx`
```jsx
// Secciones:
// 1. Resumen membresía (tipo, estado, renovación)
// 2. Límites mensuales con progreso visual
// 3. Botón "Usar Emergencia"
// 4. Lista powerbanks activos + devolver
// 5. Historial envíos mensuales
// 6. Gestionar compartidos (si titular)
```

#### C5. Backend - Lógica powerbanks
**Archivo:** `/backend/src/services/powerbankService.js`
```javascript
// Registrar préstamo powerbank
export const loanPowerbank = async (userId, salonId, qrCode) => {
  // Crear powerbank_loans registro
  // Estado: 'active', deadline: now + 24h
}

// Devolver powerbank
export const returnPowerbank = async (loanId) => {
  // Actualizar estado: 'returned'
  // Si tardó >24h → penalización 10€
}

// Verificar penalizaciones
export const checkPenalties = async () => {
  // Cron job: cada hora
  // Si loan.deadline < now && status='active' → penalizar
}
```

#### C6. Backend - Lógica emergencias
**Archivo:** `/backend/src/services/emergencyService.js`
```javascript
// Usar artículo emergencia
export const useEmergency = async (userId, articleType) => {
  // 1. Verificar límite mensual
  // 2. Registrar en emergency_article_uses
  // 3. Incrementar counter en monthly_limits
  // 4. Notificar salón más cercano
}
```

#### C7. Frontend - Componente PowerbankScanner
**Archivo:** `/src/modules/membership/components/PowerbankScanner.jsx`
```jsx
// 1. Escanear QR powerbank
// 2. Confirmar préstamo
// 3. Mostrar countdown 24h
// 4. Botón "Devolver"
```

#### C8. Frontend - Componente EmergencyRequest
**Archivo:** `/src/modules/membership/components/EmergencyRequest.jsx`
```jsx
// 1. Seleccionar artículo (compresas/tampones)
// 2. Verificar límite mensual
// 3. Confirmar solicitud
// 4. Mostrar salón más cercano
```

#### C9. Testing
- [ ] Test: Dashboard muestra info correcta
- [ ] Test: Límites mensuales actualizan
- [ ] Test: Powerbank préstamo/devolución
- [ ] Test: Penalización si >24h
- [ ] Test: Emergencia respeta límite mensual
- [ ] Test: Envío mensual se registra

---

## 🎯 FASE D: CSV IMPORT SALONES

### Objetivo:
Importación masiva de salones desde CSV con validación completa.

### Tareas:

#### D1. Template CSV
**Archivo:** `/docs/SALON_CSV_TEMPLATE.csv`
```csv
business_name,address,city,postal_code,latitude,longitude,phone,email,website,category,accepts_reservations
Salón Belleza Madrid,Calle Gran Vía 1,Madrid,28013,40.4168,-3.7038,+34912345678,salon@example.com,https://salon.com,hair,true
```

#### D2. Backend - Servicio parser CSV
**Archivo:** `/backend/src/services/csvParserService.js`
```javascript
import csv from 'csv-parser';

// Validar fila CSV
export const validateSalonRow = (row) => {
  const errors = [];
  
  if (!row.business_name) errors.push('business_name required');
  if (!row.address) errors.push('address required');
  if (!isValidCoordinates(row.latitude, row.longitude)) {
    errors.push('invalid coordinates');
  }
  if (row.phone && !isValidPhone(row.phone)) {
    errors.push('invalid phone');
  }
  
  return { valid: errors.length === 0, errors };
}

// Procesar CSV completo
export const parseSalonCSV = async (fileBuffer) => {
  const results = [];
  const errors = [];
  
  // Parse CSV
  // Validar cada fila
  // Retornar: { valid: [], invalid: [] }
}
```

#### D3. Backend - Servicio import masivo
**Archivo:** `/backend/src/services/salonImportService.js`
```javascript
// Importar salones en chunks
export const importSalons = async (validatedData, adminUserId) => {
  const BATCH_SIZE = 50;
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (let i = 0; i < validatedData.length; i += BATCH_SIZE) {
    const batch = validatedData.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (salonData) => {
      try {
        // 1. Crear user para el salón (rol='salon')
        // 2. Crear salon_profile
        // 3. Asignar categorías
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ salon: salonData.business_name, error: err.message });
      }
    }));
  }
  
  return results;
}
```

#### D4. Backend - Controlador import
**Archivo:** `/backend/src/controllers/salonImportController.js`
```javascript
export const importCSV = async (req, res) => {
  // 1. Verificar rol admin
  // 2. Recibir archivo CSV (multer)
  // 3. Validar CSV
  // 4. Si errores → devolver preview con errores
  // 5. Si ok → procesar import
  // 6. Devolver resumen: X creados, Y errores
}

export const previewCSV = async (req, res) => {
  // Validar sin importar
  // Devolver: primeras 10 filas + errores
}
```

#### D5. Backend - Rutas import
**Archivo:** `/backend/src/routes/salonImport.js`
```javascript
// Middleware: requireAdmin

POST /api/admin/salons/import/preview   // Validar CSV
POST /api/admin/salons/import/process   // Importar
GET  /api/admin/salons/import/template  // Descargar template
```

#### D6. Frontend - Componente SalonCSVImport (Admin)
**Archivo:** `/src/modules/admin/SalonCSVImport.jsx`
```jsx
// 1. Upload CSV file
// 2. Botón "Validar"
// 3. Mostrar preview + errores
// 4. Si ok → Botón "Importar"
// 5. Mostrar progreso
// 6. Resumen final: X creados, Y errores
```

#### D7. Backend - Middleware multer
**Archivo:** `/backend/src/middleware/upload.js`
```javascript
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/csv') {
      return cb(new Error('Only CSV files allowed'));
    }
    cb(null, true);
  }
});

export default upload;
```

#### D8. Documentación CSV
**Archivo:** `/docs/CSV_IMPORT_GUIDE.md`
```markdown
# Guía Import CSV Salones

## Formato CSV:
- Separador: coma (,)
- Encoding: UTF-8
- Headers obligatorios

## Columnas:
1. business_name (obligatorio)
2. address (obligatorio)
3. city (obligatorio)
4. postal_code
5. latitude (decimal, ej: 40.4168)
6. longitude (decimal, ej: -3.7038)
7. phone (formato: +34...)
8. email
9. website
10. category (hair, nails, massage, etc.)
11. accepts_reservations (true/false)

## Validaciones:
- Coordenadas válidas (latitude: -90 a 90, longitude: -180 a 180)
- Teléfono formato internacional
- Email válido
- URL website válida

## Ejemplo:
Ver: SALON_CSV_TEMPLATE.csv
```

#### D9. Testing
- [ ] Test: CSV válido → Import exitoso
- [ ] Test: CSV con errores → Devuelve errores
- [ ] Test: Coordenadas inválidas → Rechaza fila
- [ ] Test: Email duplicado → Maneja error
- [ ] Test: Import masivo 1000 salones → Performance ok
- [ ] Test: Solo admin puede importar

---

## 🔍 REVISIÓN GENERAL FINAL

### Checklist completo:

#### ✅ ECOMMERCE
- [ ] Descuentos membresía funcionan (10%/15%)
- [ ] Envío gratis según umbral
- [ ] Stripe checkout completo
- [ ] Stock se actualiza
- [ ] Orders guardan seller='LOBBA', type='product_order'

#### ✅ MARKETPLACE
- [ ] Split Payment Stripe Connect (3%/97%)
- [ ] Salones pueden conectar Stripe
- [ ] Reservas con comisión calculada
- [ ] Pagos se distribuyen correctamente
- [ ] Webhooks confirman reservas

#### ✅ MEMBRESÍAS
- [ ] Dashboard muestra info completa
- [ ] Límites mensuales funcionan
- [ ] Powerbanks: préstamo/devolución/penalización
- [ ] Emergencias respetan límite
- [ ] Envíos mensuales se registran
- [ ] Compartir membresía funciona

#### ✅ CSV IMPORT
- [ ] Template descargable
- [ ] Validación CSV funciona
- [ ] Preview muestra errores
- [ ] Import masivo exitoso
- [ ] Manejo errores robusto

#### ✅ INTEGRACIÓN GENERAL
- [ ] Membresía → Ecommerce (descuentos)
- [ ] Membresía → Powerbanks (en salones)
- [ ] Marketplace → Salones (servicios)
- [ ] Ecommerce → Productos LOBBA (separado)

#### ✅ CALIDAD CÓDIGO
- [ ] Tests backend funcionan
- [ ] Tests frontend funcionan
- [ ] Lint pasa (npm run lint)
- [ ] Typecheck pasa (si aplica)
- [ ] Sin warnings consola

#### ✅ BASE DE DATOS
- [ ] Todas migraciones aplicadas
- [ ] Índices optimizados
- [ ] Constraints correctos
- [ ] Triggers funcionan

#### ✅ DOCUMENTACIÓN
- [ ] README actualizado
- [ ] API endpoints documentados
- [ ] Diagramas actualizados
- [ ] Guías usuario creadas

---

## 📋 PLAN DE EJECUCIÓN

### Día 1: FASE A - ECOMMERCE
1. Migración 051
2. Backend services + controllers
3. Frontend checkout
4. Testing

### Día 2: FASE B - MARKETPLACE
1. Migraciones 052-053
2. Stripe Connect setup
3. Backend split payment
4. Frontend checkout reservas
5. Testing

### Día 3: FASE C - MEMBRESÍAS
1. Backend services (límites, powerbanks, emergencias)
2. Controllers dashboard
3. Frontend dashboard completo
4. Testing

### Día 4: FASE D - CSV IMPORT
1. Template CSV
2. Backend parser + validator
3. Import service
4. Frontend admin panel
5. Testing

### Día 5: REVISIÓN GENERAL
1. Tests integración completos
2. Fix bugs encontrados
3. Optimizaciones
4. Documentación final
5. **CREAR PR**

---

## 🚀 PRÓXIMO PASO

**Empezar FASE A: ECOMMERCE**

Tareas inmediatas:
1. Crear migración 051_extend_orders_for_ecommerce.sql
2. Crear membershipDiscountService.js
3. Crear productCheckoutController.js
4. Actualizar CheckoutForm.jsx

**¿Confirmamos arranque FASE A?**

---

**Fecha:** 2025-10-14  
**Plan:** Completo ✅  
**Orden:** A → B → C → D → Revisión  
**Listo para empezar:** SÍ ✅
