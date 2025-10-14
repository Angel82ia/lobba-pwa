# Visión Completa del Ecosistema LOBBA PWA

## Fecha: 2025-10-14
## Estado: Análisis Integral de 3 Sistemas

---

## RESUMEN EJECUTIVO

He analizado **3 documentos técnicos** que definen el ecosistema completo de LOBBA:

1. **Sistema de Membresías** (Essential & Spirit) - 13 secciones
2. **Integración ERP + Stripe** - Productos y pagos
3. **Carga Masiva de Salones** - CSV con RGPD

Estos **3 sistemas se complementan** y forman la plataforma completa:

```
┌─────────────────────────────────────────────┐
│          LOBBA PWA - ECOSISTEMA             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │ CLIENTES     │  │  SALONES     │        │
│  │ (Membresías) │  │  (CSV/ERP)   │        │
│  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                │
│         └────────┬─────────┘                │
│                  │                          │
│         ┌────────▼────────┐                 │
│         │  E-COMMERCE     │                 │
│         │  (Productos)    │                 │
│         └────────┬────────┘                 │
│                  │                          │
│         ┌────────▼────────┐                 │
│         │    PAGOS        │                 │
│         │   (Stripe)      │                 │
│         └─────────────────┘                 │
│                                             │
│        ┌──────────────────┐                 │
│        │   MIDDLEWARE     │                 │
│        │   ERP (Odoo)     │                 │
│        └──────────────────┘                 │
└─────────────────────────────────────────────┘
```

---

## 1. SISTEMA DE MEMBRESÍAS (Ya Analizado)

### Componentes Principales:
- ✅ Membresías Essential (16€/mes) y Spirit (32€/mes)
- ✅ Límites mensuales (emergencias, powerbanks, uñas, EMS)
- ✅ Programa de referidos (4 amigas = mes gratis + sorteo)
- ✅ Dashboard modular con widgets
- ✅ Compartir membresía (solo Spirit)

### Estado Implementación:
- ✅ **FASE 1 COMPLETADA:** 10 migraciones SQL creadas
- ⏳ Pendiente: Modelos backend, Controllers, Frontend

---

## 2. INTEGRACIÓN ERP + STRIPE (Nuevo)

### Objetivo:
Integrar PWA con ERP (Odoo) + Stripe manteniendo consistencia de stock, pedidos y pagos usando **códigos internos únicos**.

### A. PRODUCTOS Y STOCK

**Reglas clave:**
1. ✅ Cada producto en PWA tiene **código interno único**
2. ✅ Middleware mapea código con ERP
3. ✅ Stock y precios se sincronizan **automáticamente** desde ERP → PWA
4. ❌ **NUNCA** permitir duplicados de códigos
5. ⚠️ Producto sin ERP = marcar "pendiente" y notificar admin

**Flujo:**
```
ERP (Odoo)
  ↓ (webhook: cambio stock/precio)
Middleware
  ↓ (actualiza)
PWA Database
  ↓ (muestra)
Frontend
```

### B. PEDIDOS

**Flujo completo:**
```
1. Cliente añade producto al carrito (PWA)
2. PWA envía pedido a Middleware
3. Middleware valida stock en ERP
4. Si OK → Crea pedido temporal en ERP (estado: "pendiente de pago")
5. Si NO → Rechaza y notifica cliente
```

**Campos críticos pedido:**
- `codigo_interno` (producto)
- `cantidad`
- `user_id`
- `estado` (pendiente_pago, confirmado, enviado, entregado)

### C. PAGOS CON STRIPE

**Stripe maneja:**
1. ✅ Pago de productos ecommerce
2. ✅ Pago de membresías (suscripciones recurrentes)

**Flujo pago:**
```
1. Cliente confirma pedido
2. PWA crea Stripe Payment Intent
3. Cliente paga con Stripe
4. Stripe webhook → Middleware
5. Middleware actualiza:
   - ERP: pedido → "confirmado"
   - PWA: pedido → "activo"
   - ERP: descuenta stock
```

**IMPORTANTE:**
- ❌ Stripe **NUNCA** toca stock ni precios
- ✅ Stripe **SOLO** confirma pago
- ✅ ERP = fuente de verdad para stock y precios

### D. MIDDLEWARE

**Rol del Middleware:**
- 🔄 Puente bidireccional PWA ↔ ERP
- 🔄 Recibe webhooks de Stripe
- 📝 Logs de **todas** las operaciones críticas
- 🚨 Alertas automáticas (stock crítico, cambios precio, retrasos)

**Responsabilidades:**
```javascript
// Ejemplo conceptual
middleware.on('product.updated', (product) => {
  // 1. Validar código interno único
  // 2. Actualizar PWA database
  // 3. Log operación
  // 4. Si stock crítico → alerta
})

middleware.on('stripe.payment.succeeded', (payment) => {
  // 1. Buscar pedido en ERP
  // 2. Actualizar estado → "confirmado"
  // 3. Descontar stock en ERP
  // 4. Actualizar PWA
  // 5. Log completo
})
```

### E. TRAZABILIDAD

**Cada código interno debe tener:**
- 📅 Fecha creación
- 📦 Historial de pedidos
- 💰 Historial de pagos
- 📊 Historial de stock
- 🚚 Historial de envíos

---

## 3. CARGA MASIVA DE SALONES (Nuevo)

### Objetivo:
Permitir a **administradores** subir múltiples salones de belleza mediante CSV con cumplimiento RGPD.

### A. ESTRUCTURA CSV

**Campos obligatorios:**
```csv
salon_name,legal_name,owner_name,email,phone,address,province,country,
vat_number,iban,gdpr_consent,agreement_date
```

**Campos opcionales:**
```csv
billing_address,bic_swift,website,instagram,facebook,latitude,longitude
```

**Ejemplo de línea:**
```csv
Estética Luna;Estética Luna S.L.;María Pérez;info@esteticaluna.com;
+34911222333;Calle Mayor 12, Madrid;Madrid;España;B12345678;
ES9820385778983400000000;true;2025-10-14
```

### B. TABLA SALONS

```sql
CREATE TABLE salons (
  id UUID PRIMARY KEY,
  salon_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  province TEXT NOT NULL,
  country TEXT DEFAULT 'España',
  billing_address TEXT,
  vat_number TEXT UNIQUE NOT NULL,  -- NIF/CIF
  iban TEXT NOT NULL,
  bic_swift TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  agreement_date DATE NOT NULL,
  gdpr_consent BOOLEAN NOT NULL DEFAULT false,
  consent_id UUID REFERENCES consents(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### C. CUMPLIMIENTO RGPD

**Texto de consentimiento:**
> "He leído y acepto la Política de Protección de Datos de LOBBA S.L., conforme al Reglamento Europeo (UE) 2016/679, exclusivamente para fines de colaboración comercial, facturación y promoción dentro del ecosistema Lobba."

**Tabla de auditoría:**
```sql
CREATE TABLE consents (
  id UUID PRIMARY KEY,
  entity_type TEXT,  -- 'salon', 'client'
  entity_id UUID,
  consent_text TEXT,
  consent_hash TEXT,
  date_given TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### D. ENDPOINT API

```javascript
POST /api/admin/salons/import
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

Body:
  file: salons_import.csv

Response:
{
  "total_processed": 25,
  "inserted": 22,
  "duplicates": 2,
  "errors": 1,
  "error_details": [
    {
      "line": 5,
      "email": "salon@example.com",
      "reason": "IBAN inválido"
    }
  ]
}
```

### E. VALIDACIONES

**Antes de insertar:**
1. ✅ Email único (no duplicado)
2. ✅ IBAN válido (formato español ES + 24 dígitos)
3. ✅ NIF/CIF válido
4. ✅ `gdpr_consent = true`
5. ✅ Todos los campos obligatorios presentes
6. ✅ Formato UTF-8

### F. INTERFAZ ADMIN

**Componentes:**
- `<FileUploadCard />` - Subir CSV con drag & drop
- `<ImportReport />` - Informe de resultados
- `<SalonsList />` - Lista de salones importados
- `<DownloadTemplate />` - Descargar plantilla CSV vacía

---

## 4. INTEGRACIÓN DE LOS 3 SISTEMAS

### A. CÓMO SE RELACIONAN

#### 1. **Cliente con Membresía compra producto:**
```
Cliente (membership: 'spirit')
  ↓ compra producto
Ecommerce
  ↓ aplica descuento 15% (desde membership)
  ↓ envío gratis si > 15€ (desde membership)
Carrito
  ↓ checkout
Stripe (paga)
  ↓ webhook
Middleware
  ↓ actualiza stock en ERP
  ↓ crea pedido en ERP
PWA confirma pedido
```

#### 2. **Salon vende productos a cliente con membresía:**
```
Salon (registrado vía CSV)
  ↓ tiene productos en ERP
Middleware sincroniza
  ↓ productos con códigos internos
PWA muestra productos
  ↓ cliente con membresía compra
Aplica descuento membresía
  ↓ pago Stripe
ERP descuenta stock
  ↓ envía a cliente
```

#### 3. **Cliente usa powerbank en Salon:**
```
Cliente (membership: 'spirit')
  ↓ escanea QR en Salon
PWA registra préstamo powerbank
  ↓ valida límite mensual (4 para Spirit)
Salon (de tabla salons) confirma entrega
  ↓ cuenta regresiva 24h
Si no devuelve → penalización 10€
  ↓ se añade a próxima factura Stripe
```

### B. TABLAS RELACIONADAS

```sql
-- Relación Cliente → Membership → Limits
users (id) → memberships (user_id) → monthly_limits (membership_id)

-- Relación Pedido → Membership discount
orders (membership_discount JSONB) → referencia user_id + membership_type

-- Relación Powerbank → Salon → Cliente
powerbank_loans (user_id, commerce_id)
  → users (id)
  → salons (id)  // commerce_id puede ser salon_id

-- Relación Productos → ERP
products (codigo_interno UNIQUE) ↔ ERP Odoo (producto.id)
```

---

## 5. PLAN DE IMPLEMENTACIÓN COMPLETO

### ORDEN RECOMENDADO:

#### **ETAPA 1: SISTEMA DE MEMBRESÍAS (En progreso)**
- ✅ FASE 1: Migraciones DB (COMPLETADO)
- ⏳ FASE 2-7: Backend + Frontend membresías
- **Prioridad:** ALTA
- **Tiempo:** ~20 horas restantes

#### **ETAPA 2: CARGA SALONES (Más simple)**
- Crear tabla `salons` + `consents`
- Endpoint `/api/admin/salons/import`
- Componente admin subida CSV
- **Prioridad:** MEDIA
- **Tiempo:** ~4-6 horas
- **Dependencias:** Solo requiere autenticación admin

#### **ETAPA 3: INTEGRACIÓN ERP + STRIPE (Más complejo)**
- Crear middleware (Node.js independiente)
- Webhooks ERP → Middleware → PWA
- Webhooks Stripe → Middleware
- Sistema de sincronización productos
- Gestión de códigos internos
- **Prioridad:** ALTA (pero último por complejidad)
- **Tiempo:** ~15-20 horas
- **Dependencias:** Requiere acceso a Odoo ERP

---

## 6. ARQUITECTURA TÉCNICA PROPUESTA

### A. STACK ACTUAL (Mantener)
```
Frontend: React + Tailwind + Zustand
Backend: Node.js + Express
Database: PostgreSQL (Supabase)
Auth: JWT
```

### B. NUEVO: MIDDLEWARE ERP
```
Tecnología: Node.js + Express (separado)
Puerto: 3001
Funciones:
  - Webhook receiver (ERP)
  - Webhook receiver (Stripe)
  - Sincronizador productos
  - Logger auditoría
  - Sistema de alertas
```

### C. DIAGRAMA DE COMPONENTES

```
┌─────────────┐
│   FRONTEND  │
│  (React PWA)│
└──────┬──────┘
       │
       ↓ HTTP
┌─────────────┐
│   BACKEND   │  ←──────┐
│  (Express)  │         │
└──────┬──────┘         │
       │                │ Sync
       ↓                │
┌─────────────┐         │
│  PostgreSQL │         │
│  (Supabase) │         │
└─────────────┘         │
                        │
┌──────────────────┐    │
│   MIDDLEWARE     │────┘
│   (Node 3001)    │
└────┬─────┬───────┘
     │     │
     │     └──────► ERP (Odoo)
     │
     └────────────► Stripe API
```

---

## 7. MIGRACIONES ADICIONALES NECESARIAS

### Para Salones:
```sql
051_create_salons_table.sql
052_create_consents_table.sql
053_create_salon_products_table.sql  -- Relación salon → productos
```

### Para ERP Integration:
```sql
054_extend_products_for_erp.sql
055_create_erp_sync_logs_table.sql
056_create_product_stock_history_table.sql
```

---

## 8. FEATURE FLAGS NECESARIOS

```javascript
// .env
FF_MEMBERSHIP_SHARE=true          // Compartir membresía Spirit
FF_MEMBERSHIP_ESSENTIAL=true      // Membresía Essential
FF_MEMBERSHIP_SPIRIT=true         // Membresía Spirit
FF_SALONS_IMPORT=true            // Carga masiva salones
FF_ERP_SYNC=false                // Sincronización ERP (staging)
FF_STRIPE_PRODUCTS=true          // Pagos productos Stripe
FF_STRIPE_MEMBERSHIPS=true       // Suscripciones membresías
FF_DASHBOARD_WIDGETS=true        // Dashboard modular
FF_POWERBANKS=true               // Sistema powerbanks
FF_EMERGENCY_ARTICLES=true       // Artículos emergencia
FF_REFERRAL_PROGRAM=true         // Programa referidos
```

---

## 9. DEPENDENCIES NUEVAS

### Backend:
```json
{
  "stripe": "^14.0.0",
  "axios": "^1.6.0",          // Para llamadas ERP
  "bull": "^4.11.0",          // Queue jobs (sync)
  "node-cron": "^3.0.2",      // Cron jobs
  "csv-parser": "^3.0.0",     // Parse CSV salones
  "iban": "^0.0.14",          // Validar IBAN
  "validator": "^13.11.0"     // Validaciones generales
}
```

### Middleware (nuevo proyecto):
```json
{
  "express": "^4.18.0",
  "axios": "^1.6.0",
  "stripe": "^14.0.0",
  "winston": "^3.11.0",       // Logging
  "bull": "^4.11.0"           // Queue
}
```

---

## 10. PRÓXIMAS DECISIONES NECESARIAS

### PREGUNTA 1: ¿Orden de implementación?
**Opción A:** Terminar membresías completo → Salones → ERP
**Opción B:** Salones primero (más simple) → Membresías → ERP
**Opción C:** Paralelo: Yo membresías + Tú defines acceso ERP

### PREGUNTA 2: ¿Acceso a ERP Odoo?
- ¿Ya existe instancia Odoo?
- ¿Tengo credenciales API?
- ¿Debo crear middleware desde cero?

### PREGUNTA 3: ¿Stripe ya configurado?
- ¿Existe cuenta Stripe?
- ¿Tengo API keys (test + production)?
- ¿Webhooks ya creados?

### PREGUNTA 4: ¿Qué priorizar?
1. **Membresías** (experiencia cliente)
2. **Salones** (red de partners)
3. **ERP** (operaciones backend)

---

## 11. ESTIMACIÓN TIEMPO TOTAL

| Sistema | Horas | Prioridad |
|---------|-------|-----------|
| Membresías (fases 2-7) | 20h | 🔴 ALTA |
| Salones CSV | 6h | 🟡 MEDIA |
| Middleware ERP | 15h | 🔴 ALTA |
| Integración Stripe | 10h | 🔴 ALTA |
| Testing E2E todo | 8h | 🔴 ALTA |
| **TOTAL** | **~59h** | |

**Con trabajo enfocado:** 2-3 semanas

---

## 12. RECOMENDACIÓN FINAL

### **ESTRATEGIA PROPUESTA:**

**Semana 1:**
1. ✅ Terminar FASE 2-4 Membresías (backend)
2. ✅ Implementar Salones CSV (paralelo)

**Semana 2:**
3. ✅ FASE 5-7 Membresías (frontend + dashboard)
4. ✅ Testing membresías completo

**Semana 3:**
5. ✅ Crear Middleware ERP
6. ✅ Integración Stripe completa
7. ✅ Testing E2E de todo el ecosistema

---

**Documento creado:** 2025-10-14  
**Autor:** Sistema de Análisis Devin  
**Estado:** Listo para decisión de prioridades
