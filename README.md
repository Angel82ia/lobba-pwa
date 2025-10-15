# PWA LOBBA

Plataforma integral Progressive Web App para servicios de belleza, reservas, e-commerce y comunidad.

## 🎨 Identidad Visual

- **Colores principales:**
  - Rosa: `#FF1493` (DeepPink)
  - Negro: `#000000`
  - Blanco: `#FFFFFF`
- **Tipografía:** Montserrat / Open Sans
- **Estilo:** Elegante, minimalista, responsive-first

## 🏗️ Arquitectura

### Estructura del Proyecto

```
pwa-lobba/
├── src/                          # Frontend (React + Vite)
│   ├── modules/                  # Módulos funcionales independientes
│   │   ├── auth/                # Autenticación y roles
│   │   ├── profile/             # Perfiles de usuario
│   │   ├── salon/               # Perfiles de salones/negocios
│   │   ├── ai-nails/            # IA generación imágenes uñas
│   │   ├── hairstyle/           # Prueba de peinados con IA
│   │   ├── catalog/             # Catálogo colaborativo
│   │   ├── community/           # Comunidad LOBBA (feed social)
│   │   ├── ecommerce/           # E-commerce productos LOBBA
│   │   ├── reservations/        # Sistema de reservas
│   │   ├── messaging/           # Mensajería en tiempo real
│   │   ├── notifications/       # Notificaciones push
│   │   ├── chatbot/             # Chatbot Olivia
│   │   ├── banners/             # Banners y noticias
│   │   ├── devices/             # Equipos remotos
│   │   ├── articles/            # Gestión artículos
│   │   └── admin/               # Panel administración
│   ├── services/                # Servicios compartidos
│   │   ├── api.js              # Cliente API
│   │   ├── auth.js             # Gestión autenticación
│   │   └── storage.js          # LocalStorage/SessionStorage
│   ├── components/              # Componentes UI reutilizables
│   │   ├── common/             # Botones, inputs, cards, etc.
│   │   └── layouts/            # Layouts principales
│   ├── styles/                  # Estilos globales y variables
│   ├── store/                   # Estado global (Zustand)
│   └── utils/                   # Utilidades
├── backend/                     # Backend (Node.js + Express)
│   ├── src/
│   │   ├── routes/             # Definición de rutas
│   │   ├── controllers/        # Lógica de negocio
│   │   ├── models/             # Modelos de datos
│   │   ├── middleware/         # Middlewares (auth, validación)
│   │   ├── services/           # Servicios (Stripe, IA, etc.)
│   │   └── utils/              # Utilidades
│   └── tests/                  # Tests backend
├── database/                    # Migraciones y seeds
│   ├── migrations/
│   └── seeds/
├── tests/                       # Tests e2e
└── docs/                        # Documentación adicional
```

### Módulos Implementados

- ✅ **Autenticación:** Login multi-proveedor (email, Google, Apple)
- ✅ **Perfiles:** Cliente/Socia, Salón/Negocio, Administrador, Equipo Remoto
- ✅ **Reservas:** Sistema de slots + sincronización Google Calendar
- ✅ **E-commerce:** Productos exclusivos LOBBA + integración Stripe Connect
- ✅ **IA Generativa:** Diseño uñas (100 img/mes) + prueba peinados (4 img/mes)
- ✅ **Notificaciones Push:** Geolocalización 1-50 km + FCM
- ✅ **Comunidad:** Feed social, likes, comentarios
- ✅ **Equipos Remotos:** Impresoras LOBBA + dispensadores
- ✅ **Chatbot Olivia:** Soporte 24/7
- ✅ **Seguridad:** JWT, HTTPS, logs inmutables, RGPD/LOPD

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14
- Cuentas configuradas:
  - Stripe Connect
  - OpenAI / Stability AI
  - Google Cloud (Calendar, Auth)
  - Firebase (FCM)
  - WhatsApp Business API

### Instalación

1. **Clonar repositorio:**
```bash
git clone <repository-url>
cd pwa-lobba
```

2. **Instalar dependencias:**
```bash
# Frontend
pnpm install

# Backend
cd backend
npm install
```

3. **Configurar variables de entorno:**
```bash
# Copiar plantilla
cp .env.example .env
cp backend/.env.example backend/.env

# Editar .env con tus credenciales
```

4. **Configurar base de datos:**
```bash
# Crear base de datos
createdb pwa_lobba
createdb pwa_lobba_test

# Ejecutar migraciones
cd backend
npm run migrate
npm run seed
```

5. **Iniciar en desarrollo:**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
pnpm dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## 🧪 Testing

### Tests Unitarios

```bash
# Frontend
pnpm test
pnpm test:coverage

# Backend
cd backend
npm test
npm run test:coverage
```

### Tests E2E

```bash
pnpm test:e2e
```

## 🔐 Seguridad

### Principios Obligatorios

1. ✅ **Nunca hardcodear secretos** - usar `.env` y gestores de secretos
2. ✅ **JWT con expiración corta** (1h access, 7d refresh)
3. ✅ **HTTPS/TLS 1.2+ obligatorio** en producción
4. ✅ **Logs centralizados e inmutables** (Winston)
5. ✅ **Principio de menor privilegio** en permisos
6. ✅ **Cumplimiento RGPD/LOPD** - consentimiento explícito
7. ✅ **Defensa anti-fraude** - rate limiting, validación

### Variables Sensibles

**NUNCA** commitear:
- Archivos `.env`
- Claves privadas (`.pem`, `.key`)
- Tokens de API
- Credenciales de base de datos

Usar variables de entorno o servicios como:
- AWS Secrets Manager
- HashiCorp Vault
- GitHub Secrets (CI/CD)

## 📚 Documentación Adicional

- [Plan de Implementación Completo](./PLAN_IMPLEMENTACION_PWA_LOBBA.md)
- [Documento Técnico](./docs/DOCUMENTO_TECNICO.md)
- [Reglas de Desarrollo](./docs/REGLAS_IA.md)
- [API Documentation](./docs/API.md) (OpenAPI/Swagger)

## 🎯 Roles de Usuario

### 1. Cliente/Socia (`role=user`)
- Reservas en salones
- Compras e-commerce
- Acceso IA (uñas, peinados)
- Comunidad LOBBA
- Uso equipos remotos

### 2. Salón/Negocio (`role=salon`)
- Gestión servicios propios
- Recepción reservas y pagos
- Notificaciones push geolocalización
- Click&Collect
- Estadísticas

### 3. Administrador (`role=admin`)
- Control total sistema
- Gestión usuarios
- Configuración global
- Auditoría y logs
- Soporte

### 4. Equipo Remoto (`role=device`)
- Modo kiosko (PWA)
- Validación backend
- Telemetría

## 🔗 Integraciones Externas

- **Stripe Connect** - Pagos y comisiones
- **OpenAI / Stability AI** - Generación imágenes IA
- **Google Calendar** - Sincronización reservas
- **WhatsApp Business API** - Mensajería
- **Firebase Cloud Messaging** - Push notifications
- **PostGIS** - Consultas geoespaciales
- **Cloudinary / AWS S3** - Almacenamiento imágenes

## 🛠️ Stack Tecnológico

### Frontend
- React 18
- Vite
- Zustand (estado global)
- React Router
- Axios
- Vite PWA Plugin

### Backend
- Node.js + Express
- PostgreSQL + PostGIS
- JWT
- Winston (logs)
- Express Validator

### DevOps
- GitHub Actions (CI/CD)
- Docker (opcional)
- Vercel (frontend)
- Railway (backend)
- Supabase (PostgreSQL)

## 📝 Convenciones de Código

### Principios TDD
1. **Red:** Escribir test que falla
2. **Green:** Implementar código mínimo para pasar test
3. **Refactor:** Mejorar código manteniendo tests verdes

### Estilo
- **Nombres descriptivos** (no abreviaturas)
- **Early returns** para reducir anidamiento
- **Variables intermedias** para legibilidad
- **Comentarios de contexto** solo cuando sea necesario
- **Funciones pequeñas** (máx 20-30 líneas)

### Commits
```bash
git commit -m "feat(module): descripción concisa"
git commit -m "fix(module): corrección de bug"
git commit -m "test(module): añadir tests"
git commit -m "docs: actualizar README"
```

## 📞 Soporte

Para reportar bugs o solicitar features, abrir un issue en el repositorio.

## 📄 Licencia

Propietario - LOBBA © 2024

---

**Desarrollado con ❤️ por el equipo LOBBA**
