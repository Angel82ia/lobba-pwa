# Arquitectura - PWA LOBBA

Este documento describe las decisiones arquitectónicas del proyecto PWA LOBBA.

## 🏛️ Principios Arquitectónicos

### 1. Modularidad
- Cada módulo es independiente y testeable standalone
- Acoplamiento mínimo entre módulos
- Comunicación mediante eventos y APIs bien definidas

### 2. Escalabilidad
- Arquitectura preparada para crecimiento horizontal
- Base de datos con índices optimizados
- Cache en múltiples capas

### 3. Seguridad por Diseño
- Zero Trust: validación en todos los niveles
- Principio de menor privilegio
- Secrets nunca en código fuente

### 4. Mantenibilidad
- Código legible y autoexplicativo
- Separación clara de responsabilidades
- Documentación actualizada

## 🎨 Arquitectura Frontend

### Stack Tecnológico
- **Framework**: React 18
- **Build Tool**: Vite
- **Estado Global**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Estilos**: CSS Modules + Variables CSS
- **Testing**: Vitest + React Testing Library
- **PWA**: Vite PWA Plugin + Workbox

### Estructura de Módulos

Cada módulo sigue esta estructura:

```
src/modules/[nombre-modulo]/
├── components/           # Componentes específicos del módulo
│   ├── [Componente].jsx
│   └── [Componente].test.jsx
├── hooks/               # Custom hooks
│   ├── use[Hook].js
│   └── use[Hook].test.js
├── services/            # Lógica de negocio
│   ├── [service].js
│   └── [service].test.js
├── store/               # Estado del módulo (Zustand slice)
│   └── [module]Store.js
├── utils/               # Utilidades del módulo
├── index.js             # Exports públicos
└── README.md            # Documentación del módulo
```

### Estado Global (Zustand)

```javascript
// Estructura del store global
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    role: 'user' | 'salon' | 'admin' | 'device'
  },
  ui: {
    theme: 'light',
    language: 'es',
    notifications: []
  },
  cart: {
    items: CartItem[],
    total: number
  }
}
```

**Principios**:
- Estado mínimo y derivado cuando sea posible
- Actualizaciones inmutables
- Persistencia selectiva (auth, cart)

### Servicios Comunes

#### api.js
Cliente HTTP centralizado con:
- Interceptores para autenticación (JWT)
- Manejo global de errores
- Retry logic
- Request/response logging

#### auth.js
Gestión de autenticación:
- Login/logout
- Refresh tokens
- Almacenamiento seguro
- Validación de permisos

#### storage.js
Abstracción de almacenamiento:
- LocalStorage
- SessionStorage
- Encriptación sensible

### Routing

```javascript
// Estructura de rutas
/                          # Home (pública)
/login                     # Login
/register                  # Registro
/profile                   # Perfil usuario (protegida)
/salons                    # Listado salones
/salons/:id                # Detalle salón
/services/:id/book         # Reservar servicio
/shop                      # E-commerce
/shop/:productId           # Detalle producto
/cart                      # Carrito
/checkout                  # Checkout
/ai/nails                  # Diseño uñas IA
/ai/hairstyle              # Prueba peinados
/community                 # Feed comunidad
/messages                  # Mensajería
/notifications             # Notificaciones
/admin                     # Panel admin (role=admin)
/device/:deviceId          # Modo kiosko (role=device)
```

**Protección de Rutas**:
- Rutas públicas: acceso libre
- Rutas autenticadas: requieren login
- Rutas con roles: validación de permisos

### PWA Configuration

```javascript
// Service Worker Strategy
{
  networkFirst: ['/api/*'],      // APIs siempre red primero
  cacheFirst: ['/assets/*'],     // Assets estáticos
  staleWhileRevalidate: ['/*']   // Páginas HTML
}
```

## 🔧 Arquitectura Backend

### Stack Tecnológico
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Base de Datos**: PostgreSQL 14+ con PostGIS
- **ORM/Query Builder**: pg (native) o Prisma
- **Autenticación**: JWT (jsonwebtoken)
- **Validación**: Express Validator
- **Logging**: Winston
- **Testing**: Vitest + Supertest

### Estructura de Capas

```
┌─────────────────────────────────────┐
│         Cliente (Frontend)          │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│        Routes (Endpoints)           │
│  - Definición de rutas              │
│  - Validación de inputs             │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│          Middleware                 │
│  - Autenticación (JWT)              │
│  - Rate limiting                    │
│  - Logging                          │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│         Controllers                 │
│  - Lógica de negocio                │
│  - Orquestación de servicios        │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│          Services                   │
│  - Integraciones externas           │
│  - Lógica compleja                  │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│           Models                    │
│  - Acceso a datos                   │
│  - Queries SQL                      │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│    Base de Datos (PostgreSQL)       │
└─────────────────────────────────────┘
```

### Endpoints Principales

#### Autenticación
- `POST /api/auth/register` - Registro usuario
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Info usuario actual

#### Usuarios
- `GET /api/users/:id` - Detalle usuario
- `PUT /api/users/:id` - Actualizar perfil
- `GET /api/users/:id/reservations` - Reservas usuario

#### Salones
- `GET /api/salons` - Listado salones (con filtros, geo)
- `GET /api/salons/:id` - Detalle salón
- `PUT /api/salons/:id` - Actualizar salón (owner/admin)
- `GET /api/salons/:id/services` - Servicios del salón
- `POST /api/salons/:id/services` - Crear servicio
- `POST /api/salons/:id/push` - Enviar notificación push

#### Reservas
- `POST /api/reservations` - Crear reserva
- `GET /api/reservations/:id` - Detalle reserva
- `PUT /api/reservations/:id` - Actualizar estado
- `DELETE /api/reservations/:id` - Cancelar reserva
- `GET /api/reservations/:id/slots` - Slots disponibles

#### E-commerce
- `GET /api/products` - Catálogo productos LOBBA
- `GET /api/products/:id` - Detalle producto
- `POST /api/cart/add` - Añadir al carrito
- `POST /api/checkout` - Procesar compra

#### IA Generativa
- `POST /api/ai/nails/generate` - Generar diseño uñas
- `GET /api/ai/nails/quota` - Consultar cuota
- `POST /api/ai/hairstyle/try` - Probar peinado
- `GET /api/ai/catalog` - Catálogo diseños

#### Notificaciones
- `POST /api/notifications/subscribe` - Suscribir a push
- `POST /api/notifications/send` - Enviar notificación (salon/admin)
- `GET /api/notifications` - Historial notificaciones

#### Equipos Remotos
- `POST /api/devices/register` - Registrar dispositivo
- `POST /api/devices/:id/dispense` - Dispensar artículo
- `POST /api/devices/:id/pickup` - Recoger artículo
- `POST /api/devices/:id/return` - Devolver artículo
- `GET /api/devices/:id/telemetry` - Telemetría dispositivo

### Base de Datos

#### Tablas Principales

```sql
-- Usuarios
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  role VARCHAR CHECK (role IN ('user', 'salon', 'admin', 'device')),
  membership_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Salones/Negocios
salons (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  name VARCHAR,
  category VARCHAR,
  description TEXT,
  address TEXT,
  location GEOGRAPHY(POINT),
  rating DECIMAL,
  created_at TIMESTAMP
)

-- Servicios
services (
  id UUID PRIMARY KEY,
  salon_id UUID REFERENCES salons(id),
  name VARCHAR,
  description TEXT,
  duration_minutes INT,
  price DECIMAL,
  active BOOLEAN
)

-- Reservas
reservations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  created_at TIMESTAMP
)

-- Productos LOBBA
products (
  id UUID PRIMARY KEY,
  name VARCHAR,
  description TEXT,
  price DECIMAL,
  stock INT,
  images JSONB,
  active BOOLEAN
)

-- Transacciones
transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount DECIMAL,
  type VARCHAR CHECK (type IN ('purchase', 'service_payment', 'commission')),
  stripe_payment_id VARCHAR,
  status VARCHAR,
  created_at TIMESTAMP
)

-- Cuotas IA
user_quotas (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  quota_type VARCHAR CHECK (quota_type IN ('nails', 'hairstyle')),
  used_count INT,
  max_count INT,
  reset_date DATE
)

-- Equipos Remotos
devices (
  id UUID PRIMARY KEY,
  device_id VARCHAR UNIQUE,
  location GEOGRAPHY(POINT),
  capabilities JSONB,
  status VARCHAR,
  created_at TIMESTAMP
)

-- Logs Auditoría (inmutable)
audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID,
  action VARCHAR,
  resource_type VARCHAR,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP
)
```

#### Índices Importantes

```sql
-- Geoespaciales (PostGIS)
CREATE INDEX idx_salons_location ON salons USING GIST(location);
CREATE INDEX idx_devices_location ON devices USING GIST(location);

-- Búsquedas frecuentes
CREATE INDEX idx_reservations_user_id ON reservations(user_id);
CREATE INDEX idx_reservations_service_id ON reservations(service_id);
CREATE INDEX idx_reservations_start_time ON reservations(start_time);
CREATE INDEX idx_services_salon_id ON services(salon_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);

-- Full-text search
CREATE INDEX idx_salons_name_trgm ON salons USING GIN(name gin_trgm_ops);
CREATE INDEX idx_products_name_trgm ON products USING GIN(name gin_trgm_ops);
```

### Seguridad

#### Autenticación JWT

```javascript
// Token Structure
{
  access_token: {
    userId: UUID,
    role: 'user' | 'salon' | 'admin' | 'device',
    exp: timestamp (1 hour)
  },
  refresh_token: {
    userId: UUID,
    exp: timestamp (7 days)
  }
}
```

#### Rate Limiting

```javascript
// Por endpoint
{
  '/api/auth/login': 5 requests / 15 min,
  '/api/ai/*': 10 requests / hour,
  '/api/*': 100 requests / 15 min (default)
}
```

#### Validación de Inputs

Todos los endpoints usan Express Validator:
- Sanitización de strings
- Validación de tipos
- Límites de tamaño
- Regex patterns cuando sea necesario

### Logging

```javascript
// Formato de Logs (Winston)
{
  timestamp: ISO8601,
  level: 'error' | 'warn' | 'info' | 'debug',
  message: string,
  userId?: UUID,
  requestId: UUID,
  ip: string,
  endpoint: string,
  duration: number (ms),
  error?: {
    message: string,
    stack: string
  }
}
```

## 🔗 Integraciones Externas

### Stripe Connect

**Flujo de Pagos**:
1. Cliente selecciona producto/servicio
2. Frontend crea PaymentIntent (backend)
3. Frontend muestra Stripe Elements
4. Cliente confirma pago
5. Webhook confirma transacción
6. Backend actualiza estado pedido

**Comisiones**:
- Servicios salones: 3%
- Productos LOBBA: 15%

### IA Generativa

**Proveedores**:
- OpenAI (DALL-E)
- Stability AI (Stable Diffusion)
- Flux

**Flujo**:
1. Usuario envía prompt (texto/voz)
2. Backend valida cuota
3. Llamada a API IA
4. Imagen generada se guarda en Cloudinary
5. URL se devuelve al cliente
6. Se actualiza contador de cuota

### Firebase Cloud Messaging

**Notificaciones Push**:
1. Salon crea notificación
2. Backend consulta usuarios en radio (PostGIS)
3. Envío masivo vía FCM
4. Logs de entregas

### Google Calendar

**Sincronización Reservas**:
1. Reserva creada en LOBBA
2. OAuth con Google Calendar
3. Evento creado en calendario salón
4. Bidireccional (cambios sincronizados)

## 📊 Decisiones Técnicas

### ¿Por qué Zustand sobre Redux?
- Menos boilerplate
- API más simple
- Mejor performance
- Suficiente para nuestras necesidades

### ¿Por qué PostgreSQL?
- PostGIS para geolocalización
- ACID completo
- JSON support
- Madurez y ecosistema

### ¿Por qué Vite sobre CRA?
- Build más rápido
- HMR instantáneo
- Mejor DX
- Menor tamaño de bundle

### ¿Por qué Vitest sobre Jest?
- Integración con Vite
- Más rápido
- API compatible con Jest
- ESM nativo

## 🚀 Deployment

### Frontend
- **Plataforma**: Vercel / Netlify
- **CD**: Push a `main` → deploy automático
- **Staging**: Branch `develop`

### Backend
- **Plataforma**: Railway / Fly.io
- **CD**: Push a `main` → deploy automático
- **Health Checks**: `/api/health`

### Base de Datos
- **Hosting**: Railway / Supabase
- **Backups**: Diarios automáticos
- **Migraciones**: Manual con revisión

## 📈 Monitoreo

### Métricas Clave
- Request rate
- Error rate
- Response time (p50, p95, p99)
- Database query time
- Uptime

### Alertas
- Error rate > 1%
- Response time p95 > 1s
- Downtime > 1 min
- Database connections > 80%

---

**Última actualización**: Fase 0 - Setup Inicial
