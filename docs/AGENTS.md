# Guía para Agentes IA - PWA LOBBA

Este documento proporciona contexto y directrices para agentes IA que trabajen en el proyecto PWA LOBBA.

## 🎯 Visión del Proyecto

PWA LOBBA es una plataforma integral que combina:
- **Servicios de belleza** (reservas, perfiles de salones)
- **E-commerce** (productos exclusivos marca LOBBA)
- **IA generativa** (diseño de uñas, prueba de peinados)
- **Comunidad social** (feed, likes, comentarios)
- **Equipos remotos** (impresoras, dispensadores)

## 📋 Reglas Fundamentales

### Planificación y Gestión
1. **Módulos independientes**: Cada módulo debe poder probarse standalone
2. **TDD obligatorio**: Tests primero, código después
3. **Documentar alternativas**: Mínimo 2 enfoques para funcionalidades críticas
4. **Feature flags**: Usar para probar módulos de forma aislada

### Calidad de Código
1. **Legibilidad extrema**:
   - Nombres descriptivos (no abreviaturas)
   - Early returns para reducir anidamiento
   - Variables intermedias para claridad
   - Funciones pequeñas (máx 20-30 líneas)

2. **Sin comentarios innecesarios**:
   - El código debe ser autoexplicativo
   - Solo comentarios de contexto cuando sea imprescindible

3. **Modularidad**:
   - Composición sobre herencia
   - Desacoplamiento entre módulos
   - Código fácil de eliminar/refactorizar

### Seguridad (OBLIGATORIO)
1. ❌ **NUNCA hardcodear secretos** - usar `.env` o gestores
2. ✅ **JWT con expiración corta** (1h access, 7d refresh)
3. ✅ **HTTPS/TLS 1.2+** obligatorio en producción
4. ✅ **Logs centralizados** e inmutables
5. ✅ **Principio de menor privilegio**
6. ✅ **RGPD/LOPD**: consentimiento explícito, derecho al olvido
7. ✅ **Defensa anti-fraude**: rate limiting, validación

### Validación de Datos
- JSON + esquemas formales (Zod en frontend, Express Validator en backend)
- Validación en ambos lados (cliente y servidor)
- Sanitización de inputs
- Manejo explícito de errores

## 🏗️ Arquitectura del Proyecto

### Frontend (/src/)
```
src/
├── modules/              # Módulos funcionales independientes
│   ├── auth/            # Autenticación (email, Google, Apple)
│   ├── profile/         # Perfiles usuario
│   ├── salon/           # Perfiles salones/negocios
│   ├── ai-nails/        # IA diseño uñas (100 img/mes)
│   ├── hairstyle/       # Prueba peinados (4 img/mes)
│   ├── catalog/         # Catálogo colaborativo
│   ├── community/       # Feed social
│   ├── ecommerce/       # E-commerce LOBBA
│   ├── reservations/    # Sistema reservas
│   ├── messaging/       # Mensajería tiempo real
│   ├── notifications/   # Push notifications
│   ├── chatbot/         # Chatbot Olivia
│   ├── banners/         # Banners y noticias
│   ├── devices/         # Equipos remotos
│   ├── articles/        # Gestión artículos
│   └── admin/           # Panel administración
├── services/            # Servicios compartidos
│   ├── api.js          # Cliente API (axios)
│   ├── auth.js         # Gestión autenticación
│   └── storage.js      # LocalStorage/SessionStorage
├── components/          # Componentes UI reutilizables
│   ├── common/         # Button, Card, Input, etc.
│   └── layouts/        # MainLayout, AuthLayout, etc.
├── styles/              # Sistema de diseño
│   ├── variables.css   # Variables CSS (colores, fuentes)
│   └── reset.css       # Reset CSS
├── store/               # Estado global (Zustand)
└── utils/               # Utilidades
```

### Backend (/backend/src/)
```
backend/src/
├── routes/              # Definición de rutas
├── controllers/         # Lógica de negocio
├── models/              # Modelos de datos
├── middleware/          # Auth, validación, logs
├── services/            # Integraciones externas
│   ├── stripe.js       # Pagos
│   ├── ai.js           # IA generativa
│   ├── calendar.js     # Google Calendar
│   ├── whatsapp.js     # Mensajería
│   └── fcm.js          # Push notifications
└── utils/               # Utilidades
```

## 🎨 Identidad Visual LOBBA

### Colores
- **Principal**: Rosa `#FF1493` (DeepPink)
- **Secundario**: Negro `#000000`
- **Fondo**: Blanco `#FFFFFF`

### Tipografía
- **Primaria**: Montserrat (títulos, headings)
- **Secundaria**: Open Sans (cuerpo, párrafos)

### Estilo
- Elegante y minimalista
- Responsive-first (mobile → desktop)
- Espacios generosos
- Componentes con bordes redondeados

## 👥 Roles de Usuario

### 1. Cliente/Socia (`role=user`)
- Reservas en salones
- Compras e-commerce
- Acceso IA (diseño uñas, peinados)
- Comunidad LOBBA
- Uso equipos remotos (entrega gratis, préstamo con devolución)

**Límites**:
- 100 imágenes IA/mes (diseño uñas)
- 4 imágenes IA/mes (prueba peinados)

### 2. Salón/Negocio (`role=salon`)
- Gestión servicios propios (NO productos)
- Recepción reservas y pagos
- Notificaciones push geolocalización (1-50 km)
- Click&Collect
- Perfil editable multisector (no solo belleza)
- Categorías editables

### 3. Administrador (`role=admin`)
- Control total sistema
- Gestión usuarios, catálogo, comunidad
- Configuración global
- Auditoría y logs
- Banners y noticias

### 4. Equipo Remoto (`role=device`)
- Modo kiosko (PWA)
- Validación backend obligatoria
- Telemetría y logs

## 🔗 Integraciones Externas

### Pagos
- **Stripe Connect**: comisiones 3% servicios, 15% productos
- Webhooks para eventos
- Métodos: tarjeta, Apple Pay, Google Pay, Bizum

### IA Generativa
- **OpenAI / Stability AI**: diseño uñas, peinados
- Prompts texto y voz
- Límites por usuario

### Notificaciones
- **Firebase Cloud Messaging** (FCM)
- Geolocalización con PostGIS (1-50 km)
- Anti-spam

### Calendario
- **Google Calendar API**: sincronización reservas
- Gestión slots y buffers

### Mensajería
- **WhatsApp Business API**: comunicación cliente↔salón
- WebSockets: mensajería tiempo real

## 📝 Flujo de Trabajo

### Para Nuevos Módulos

1. **Planificación**:
   - Definir requisitos funcionales
   - Documentar 2+ enfoques técnicos
   - Identificar dependencias

2. **Tests (TDD)**:
   - Escribir tests que fallen
   - Implementar código mínimo
   - Refactorizar manteniendo tests verdes

3. **Implementación**:
   - Crear estructura módulo en `/src/modules/`
   - Implementar servicios necesarios
   - Crear componentes UI
   - Integrar con estado global

4. **Validación**:
   - Tests unitarios pasan
   - Tests integración pasan
   - Lint sin errores
   - Módulo funciona standalone

5. **Documentación**:
   - Actualizar API.md si hay endpoints
   - Comentarios de contexto
   - README del módulo

### Para Corregir Bugs

1. **Reproducir**:
   - Crear test que reproduzca el bug
   - Verificar que falla

2. **Diagnosticar**:
   - Logs y debugging
   - Identificar causa raíz

3. **Corregir**:
   - Implementar fix mínimo
   - Verificar test pasa
   - No romper otros tests

4. **Prevenir**:
   - Añadir tests adicionales
   - Actualizar validaciones si aplica

## 🚨 Errores Comunes a Evitar

### ❌ NO HACER
1. Hardcodear credenciales o secretos
2. Modificar tests para que pasen (sin causa justificada)
3. Crear datos fake cuando hay datos reales
4. Saltarse TDD
5. Hacer commits con lint errors
6. Modificar múltiples módulos sin tests
7. Asumir que código sin tests funciona
8. Usar `any` o ignorar type checks
9. Crear pop-ups no solicitados
10. Añadir marcas que no sean LOBBA

### ✅ SÍ HACER
1. Usar `.env` para configuración
2. Escribir tests primero (TDD)
3. Validar datos en cliente y servidor
4. Logs estructurados y centralizados
5. Manejo explícito de errores
6. Commits atómicos y descriptivos
7. Documentar decisiones técnicas
8. Revisar que todo funciona antes de commit
9. Seguir convenciones del proyecto
10. Preguntar si algo no está claro

## 🎯 Prioridades

### Alta Prioridad
- Seguridad (JWT, HTTPS, no secrets)
- Autenticación y roles
- E-commerce y pagos
- Reservas y mensajería

### Media Prioridad
- IA generativa (uñas, peinados)
- Notificaciones push
- Comunidad LOBBA
- Chatbot Olivia

### Baja Prioridad (pero importante)
- Banners y noticias
- Estadísticas y analytics
- Optimizaciones de rendimiento

## 📚 Recursos

### Documentación Proyecto
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Decisiones arquitectura
- [API.md](./API.md) - Especificación OpenAPI
- [PLAN_IMPLEMENTACION_PWA_LOBBA.md](../PLAN_IMPLEMENTACION_PWA_LOBBA.md) - Plan completo

### Referencias Externas
- Treatwell.es - Inspiración perfiles salones
- Druni.es - Inspiración e-commerce

**IMPORTANTE**: Los enlaces son solo guía de UX/UI. Los módulos a implementar están definidos en el documento técnico.

## 🔍 Checklist Pre-Commit

Antes de cada commit, verificar:

- [ ] Tests unitarios pasan (`npm test`)
- [ ] Lint sin errores (`npm run lint`)
- [ ] Build exitoso (`npm run build`)
- [ ] Sin secretos hardcodeados
- [ ] Variables `.env` documentadas en `.env.example`
- [ ] Código legible y autoexplicativo
- [ ] Commits siguiendo convenciones (feat/fix/docs/test)

## 💬 Comunicación

Si encuentras:
- **Ambigüedad en requisitos** → Preguntar al usuario
- **Problemas de entorno** → Reportar con `report_environment_issue`
- **Bloqueo técnico** → Documentar problema y escalar
- **Alternativas de diseño** → Documentar opciones y consultar

---

**Desarrollado con ❤️ por el equipo LOBBA**
