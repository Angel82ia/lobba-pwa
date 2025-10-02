# API Documentation - PWA LOBBA

Especificación de la API REST del backend de PWA LOBBA.

**Base URL**: `http://localhost:3000/api` (desarrollo)

**Formato**: JSON

**Autenticación**: JWT Bearer Token

---

## 📋 Tabla de Contenidos

- [Autenticación](#autenticación)
- [Usuarios](#usuarios)
- [Salones](#salones)
- [Servicios](#servicios)
- [Reservas](#reservas)
- [E-commerce](#e-commerce)
- [IA Generativa](#ia-generativa)
- [Notificaciones](#notificaciones)
- [Equipos Remotos](#equipos-remotos)
- [Comunidad](#comunidad)
- [Mensajería](#mensajería)
- [Admin](#admin)
- [Códigos de Error](#códigos-de-error)

---

## 🔐 Autenticación

### POST /api/auth/register

Registrar nuevo usuario.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "María",
  "lastName": "García",
  "role": "user"
}
```

**Response 201**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "membershipActive": false
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

---

### POST /api/auth/login

Iniciar sesión.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response 200**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "membershipActive": true
  },
  "tokens": {
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

---

### POST /api/auth/refresh

Renovar access token.

**Request Body**:
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response 200**:
```json
{
  "accessToken": "new_jwt_token"
}
```

---

### POST /api/auth/logout

Cerrar sesión (invalida refresh token).

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response 204**: No Content

---

### GET /api/auth/me

Obtener información del usuario actual.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response 200**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "María",
  "lastName": "García",
  "role": "user",
  "membershipActive": true,
  "avatar": "https://...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## 👤 Usuarios

### GET /api/users/:id

Obtener perfil de usuario.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response 200**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "María",
  "lastName": "García",
  "role": "user",
  "bio": "Apasionada del cuidado personal",
  "avatar": "https://...",
  "membershipActive": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

### PUT /api/users/:id

Actualizar perfil de usuario (solo el propio usuario o admin).

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body** (campos opcionales):
```json
{
  "firstName": "María",
  "lastName": "García",
  "bio": "Nueva biografía",
  "avatar": "https://..."
}
```

**Response 200**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "María",
  "lastName": "García",
  "bio": "Nueva biografía",
  "avatar": "https://...",
  "updatedAt": "2024-01-20T15:45:00Z"
}
```

---

## 💈 Salones

### GET /api/salons

Listar salones con filtros y geolocalización.

**Query Parameters**:
- `lat` (number): Latitud
- `lng` (number): Longitud
- `radius` (number): Radio en km (1-50)
- `category` (string): Categoría del negocio
- `minRating` (number): Rating mínimo (0-5)
- `page` (number): Página (default: 1)
- `limit` (number): Resultados por página (default: 20)

**Example**:
```
GET /api/salons?lat=40.4168&lng=-3.7038&radius=5&category=belleza&minRating=4
```

**Response 200**:
```json
{
  "salons": [
    {
      "id": "uuid",
      "name": "Beauty Dreams",
      "category": "belleza",
      "description": "Salón de belleza integral",
      "address": "Calle Mayor 1, Madrid",
      "location": {
        "lat": 40.4168,
        "lng": -3.7038
      },
      "distance": 2.5,
      "rating": 4.8,
      "reviewCount": 120,
      "images": ["https://...", "https://..."],
      "openNow": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### GET /api/salons/:id

Detalle de salón.

**Response 200**:
```json
{
  "id": "uuid",
  "name": "Beauty Dreams",
  "category": "belleza",
  "description": "Salón de belleza integral...",
  "address": "Calle Mayor 1, Madrid",
  "location": {
    "lat": 40.4168,
    "lng": -3.7038
  },
  "phone": "+34 912345678",
  "email": "info@beautydreams.com",
  "website": "https://beautydreams.com",
  "hours": {
    "monday": "10:00-20:00",
    "tuesday": "10:00-20:00",
    "..."
  },
  "rating": 4.8,
  "reviewCount": 120,
  "images": ["https://...", "https://..."],
  "services": [
    {
      "id": "uuid",
      "name": "Corte de pelo",
      "duration": 30,
      "price": 25.00
    }
  ],
  "reviews": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "María G.",
      "rating": 5,
      "comment": "Excelente servicio",
      "createdAt": "2024-01-10T12:00:00Z"
    }
  ]
}
```

---

### PUT /api/salons/:id

Actualizar salón (solo owner del salón o admin).

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body** (campos opcionales):
```json
{
  "name": "Beauty Dreams",
  "description": "Nueva descripción",
  "category": "belleza",
  "phone": "+34 912345678",
  "hours": { "monday": "10:00-20:00" }
}
```

**Response 200**: Salón actualizado

---

### POST /api/salons/:id/push

Enviar notificación push geolocalizada (solo owner del salón).

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "title": "¡Oferta especial!",
  "message": "20% descuento en corte de pelo hoy",
  "radius": 5,
  "expiresAt": "2024-01-25T18:00:00Z"
}
```

**Response 200**:
```json
{
  "sent": 234,
  "failed": 5,
  "notificationId": "uuid"
}
```

---

## 💇 Servicios

### GET /api/salons/:salonId/services

Listar servicios de un salón.

**Response 200**:
```json
{
  "services": [
    {
      "id": "uuid",
      "name": "Corte de pelo",
      "description": "Corte y peinado profesional",
      "duration": 30,
      "price": 25.00,
      "active": true
    },
    {
      "id": "uuid",
      "name": "Tinte completo",
      "description": "Tinte completo + tratamiento",
      "duration": 120,
      "price": 65.00,
      "active": true
    }
  ]
}
```

---

### POST /api/salons/:salonId/services

Crear nuevo servicio (solo owner del salón).

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "name": "Manicura",
  "description": "Manicura completa con esmaltado",
  "duration": 45,
  "price": 20.00
}
```

**Response 201**: Servicio creado

---

## 📅 Reservas

### GET /api/services/:serviceId/slots

Obtener slots disponibles para un servicio.

**Query Parameters**:
- `date` (string): Fecha en formato YYYY-MM-DD
- `days` (number): Número de días a consultar (default: 7)

**Example**:
```
GET /api/services/uuid/slots?date=2024-01-25&days=7
```

**Response 200**:
```json
{
  "slots": [
    {
      "date": "2024-01-25",
      "slots": [
        {
          "startTime": "10:00",
          "endTime": "10:30",
          "available": true
        },
        {
          "startTime": "10:30",
          "endTime": "11:00",
          "available": false
        }
      ]
    }
  ]
}
```

---

### POST /api/reservations

Crear reserva.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "serviceId": "uuid",
  "startTime": "2024-01-25T10:00:00Z",
  "notes": "Preferencia corte corto"
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "serviceId": "uuid",
  "userId": "uuid",
  "startTime": "2024-01-25T10:00:00Z",
  "endTime": "2024-01-25T10:30:00Z",
  "status": "pending",
  "calendarEventId": "google_calendar_id"
}
```

---

### GET /api/reservations/:id

Detalle de reserva.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response 200**:
```json
{
  "id": "uuid",
  "service": {
    "id": "uuid",
    "name": "Corte de pelo",
    "price": 25.00
  },
  "salon": {
    "id": "uuid",
    "name": "Beauty Dreams",
    "address": "Calle Mayor 1"
  },
  "user": {
    "id": "uuid",
    "name": "María García"
  },
  "startTime": "2024-01-25T10:00:00Z",
  "endTime": "2024-01-25T10:30:00Z",
  "status": "confirmed",
  "notes": "Preferencia corte corto",
  "createdAt": "2024-01-20T15:00:00Z"
}
```

---

### PUT /api/reservations/:id

Actualizar estado de reserva.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "status": "confirmed"
}
```

**Response 200**: Reserva actualizada

**Valores válidos para status**:
- `pending`: Pendiente de confirmación
- `confirmed`: Confirmada
- `completed`: Completada
- `cancelled`: Cancelada
- `no_show`: No se presentó

---

## 🛍️ E-commerce

### GET /api/products

Listar productos LOBBA.

**Query Parameters**:
- `category` (string): Categoría de producto
- `minPrice` (number): Precio mínimo
- `maxPrice` (number): Precio máximo
- `inStock` (boolean): Solo productos con stock
- `page` (number): Página
- `limit` (number): Resultados por página

**Response 200**:
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Secador LOBBA Pro",
      "description": "Secador profesional...",
      "price": 89.99,
      "stock": 45,
      "images": ["https://...", "https://..."],
      "category": "herramientas",
      "rating": 4.7,
      "reviewCount": 89
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

---

### GET /api/products/:id

Detalle de producto.

**Response 200**:
```json
{
  "id": "uuid",
  "name": "Secador LOBBA Pro",
  "description": "Secador profesional de alta potencia...",
  "price": 89.99,
  "stock": 45,
  "images": ["https://...", "https://..."],
  "category": "herramientas",
  "specifications": {
    "power": "2000W",
    "weight": "450g",
    "warranty": "2 años"
  },
  "rating": 4.7,
  "reviewCount": 89,
  "reviews": [...]
}
```

---

### POST /api/cart/add

Añadir producto al carrito.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "productId": "uuid",
  "quantity": 2
}
```

**Response 200**:
```json
{
  "cartId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "name": "Secador LOBBA Pro",
      "price": 89.99,
      "quantity": 2,
      "subtotal": 179.98
    }
  ],
  "total": 179.98
}
```

---

### POST /api/checkout

Procesar compra.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "paymentMethodId": "stripe_pm_id",
  "shippingAddress": {
    "street": "Calle Mayor 1",
    "city": "Madrid",
    "postalCode": "28001",
    "country": "ES"
  },
  "shippingMethod": "standard"
}
```

**Response 200**:
```json
{
  "orderId": "uuid",
  "paymentIntent": "stripe_pi_id",
  "status": "processing",
  "total": 179.98,
  "estimatedDelivery": "2024-01-30"
}
```

---

## 🎨 IA Generativa

### POST /api/ai/nails/generate

Generar diseño de uñas con IA.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "prompt": "Uñas francesas con flores rosas",
  "style": "realistic"
}
```

**Response 200**:
```json
{
  "imageUrl": "https://cloudinary.com/...",
  "prompt": "Uñas francesas con flores rosas",
  "quotaUsed": 45,
  "quotaRemaining": 55,
  "resetDate": "2024-02-01"
}
```

**Response 429** (cuota excedida):
```json
{
  "error": "Quota exceeded",
  "quotaUsed": 100,
  "resetDate": "2024-02-01"
}
```

---

### GET /api/ai/nails/quota

Consultar cuota de IA (uñas).

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response 200**:
```json
{
  "used": 45,
  "remaining": 55,
  "max": 100,
  "resetDate": "2024-02-01"
}
```

---

### POST /api/ai/hairstyle/try

Probar peinado con IA (subir selfie).

**Headers**:
```
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data
```

**Request Body** (form-data):
- `image` (file): Selfie del usuario
- `hairstyleId` (string): ID del peinado a probar

**Response 200**:
```json
{
  "resultUrl": "https://cloudinary.com/...",
  "quotaUsed": 2,
  "quotaRemaining": 2,
  "resetDate": "2024-02-01"
}
```

---

### GET /api/ai/catalog

Catálogo de diseños IA (compartidos por comunidad).

**Query Parameters**:
- `type` (string): `nails` o `hairstyle`
- `page` (number): Página
- `limit` (number): Resultados por página

**Response 200**:
```json
{
  "designs": [
    {
      "id": "uuid",
      "imageUrl": "https://...",
      "prompt": "Uñas francesas con flores",
      "userId": "uuid",
      "userName": "María G.",
      "likes": 234,
      "createdAt": "2024-01-20T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

## 🔔 Notificaciones

### POST /api/notifications/subscribe

Suscribirse a notificaciones push.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "fcmToken": "firebase_token",
  "location": {
    "lat": 40.4168,
    "lng": -3.7038
  }
}
```

**Response 200**:
```json
{
  "subscribed": true,
  "radius": 10
}
```

---

### GET /api/notifications

Historial de notificaciones del usuario.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response 200**:
```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "¡Oferta especial!",
      "message": "20% descuento en corte de pelo",
      "salonId": "uuid",
      "salonName": "Beauty Dreams",
      "read": false,
      "createdAt": "2024-01-20T14:30:00Z"
    }
  ]
}
```

---

## 🖨️ Equipos Remotos

### POST /api/devices/register

Registrar nuevo dispositivo remoto.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "deviceId": "LOBBA-PRINTER-001",
  "location": {
    "lat": 40.4168,
    "lng": -3.7038
  },
  "capabilities": ["dispense", "print"]
}
```

**Response 201**:
```json
{
  "id": "uuid",
  "deviceId": "LOBBA-PRINTER-001",
  "status": "active",
  "token": "device_jwt_token"
}
```

---

### POST /api/devices/:id/dispense

Dispensar artículo (validación backend obligatoria).

**Headers**:
```
Authorization: Bearer {device_token}
```

**Request Body**:
```json
{
  "userId": "uuid",
  "articleId": "uuid",
  "token": "temporary_user_token"
}
```

**Response 200**:
```json
{
  "success": true,
  "eventId": "uuid",
  "message": "Artículo dispensado"
}
```

---

## 👥 Comunidad

### GET /api/community/feed

Feed de la comunidad.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Query Parameters**:
- `page` (number): Página
- `limit` (number): Resultados por página

**Response 200**:
```json
{
  "posts": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "María G.",
      "userAvatar": "https://...",
      "content": "¡Miren mis nuevas uñas! 💅",
      "images": ["https://..."],
      "likes": 45,
      "comments": 12,
      "liked": false,
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

### POST /api/community/posts

Crear publicación.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "content": "¡Miren mis nuevas uñas! 💅",
  "images": ["https://..."]
}
```

**Response 201**: Publicación creada

---

## 💬 Mensajería

### GET /api/messages

Listar conversaciones.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response 200**:
```json
{
  "conversations": [
    {
      "id": "uuid",
      "participantId": "uuid",
      "participantName": "Beauty Dreams",
      "participantAvatar": "https://...",
      "lastMessage": "¿A qué hora prefieres tu cita?",
      "lastMessageAt": "2024-01-20T16:30:00Z",
      "unreadCount": 2
    }
  ]
}
```

---

### GET /api/messages/:conversationId

Obtener mensajes de una conversación.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response 200**:
```json
{
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "content": "Hola, quisiera reservar cita",
      "createdAt": "2024-01-20T16:25:00Z"
    },
    {
      "id": "uuid",
      "senderId": "uuid",
      "content": "¿A qué hora prefieres?",
      "createdAt": "2024-01-20T16:30:00Z"
    }
  ]
}
```

---

### POST /api/messages/:conversationId

Enviar mensaje.

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Request Body**:
```json
{
  "content": "Prefiero a las 10:00"
}
```

**Response 201**: Mensaje enviado

---

## 🔧 Admin

### GET /api/admin/stats

Estadísticas generales (solo admin).

**Headers**:
```
Authorization: Bearer {accessToken}
```

**Response 200**:
```json
{
  "users": {
    "total": 12450,
    "active": 8920,
    "new": 234
  },
  "salons": {
    "total": 567,
    "active": 489
  },
  "reservations": {
    "today": 156,
    "week": 1023,
    "month": 4567
  },
  "revenue": {
    "today": 2450.50,
    "month": 45678.90
  }
}
```

---

## ⚠️ Códigos de Error

### Errores Comunes

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: email ya existe) |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error |

### Formato de Error

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Email is required",
    "details": {
      "field": "email",
      "value": null
    }
  }
}
```

---

**Última actualización**: Fase 0 - Setup Inicial

**Nota**: Esta es una especificación inicial. Los endpoints se implementarán progresivamente según el plan de fases.
