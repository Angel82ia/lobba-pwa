# Plan de Implementación: Sistema de Animaciones Personalizadas de Maquillaje

## Descripción General

Implementar un sistema que permite a cada socia de LOBBA tener una animación personalizada que muestra su transformación de maquillaje (antes/después) al iniciar sesión en la PWA.

---

## Fase A: Base de Datos (Migrations)

### A1: Migración tabla `user_animations`
**Objetivo:** Crear tabla principal para almacenar animaciones de usuarios

**Archivo:** `backend/database/migrations/067_create_user_animations.sql`

**Contenido:**
```sql
CREATE TABLE user_animations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- URLs de assets
  before_image_url VARCHAR(500) NOT NULL,
  after_image_url VARCHAR(500) NOT NULL,
  before_image_thumbnail VARCHAR(500),
  after_image_thumbnail VARCHAR(500),
  animation_video_url VARCHAR(500),
  
  -- Configuración
  animation_type VARCHAR(50) DEFAULT 'crossfade',
  animation_duration INTEGER DEFAULT 2500,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_animations_user_id ON user_animations(user_id);
CREATE INDEX idx_user_animations_active ON user_animations(is_active) WHERE is_active = true;
```

**Validación:** Ejecutar migration y verificar tabla creada

---

### A2: Modificar tabla `users`
**Objetivo:** Añadir flags para tracking rápido

**Archivo:** `backend/database/migrations/068_add_animation_flags_to_users.sql`

**Contenido:**
```sql
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS has_custom_animation BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS animation_enabled BOOLEAN DEFAULT true;

CREATE INDEX idx_users_has_animation ON users(has_custom_animation) WHERE has_custom_animation = true;
```

**Validación:** Verificar columnas añadidas en tabla users

---

## Fase B: Backend API

### B1: Modelo UserAnimation
**Objetivo:** Crear modelo para interactuar con tabla user_animations

**Archivo:** `backend/src/models/UserAnimation.js`

**Funciones:**
- `findByUserId(userId)` - Obtener animación de usuario
- `create(userId, data)` - Crear nueva animación
- `update(userId, data)` - Actualizar animación existente
- `delete(userId)` - Marcar como inactiva
- `setUserFlag(userId, hasAnimation)` - Actualizar flag en users

---

### B2: ImageProcessor Service
**Objetivo:** Procesar y optimizar imágenes

**Archivo:** `backend/src/services/imageProcessorService.js`

**Dependencias:** `sharp` (instalar con `npm install sharp`)

**Funciones:**
- `optimize(buffer, options)` - Optimizar imagen a WebP
- `createThumbnail(buffer, size)` - Crear thumbnail 300x300
- `validateImage(buffer)` - Validar tipo/tamaño/dimensiones
- `detectFace(buffer)` - Opcional: validar que contiene rostro

**Especificaciones:**
- Formato salida: WebP
- Calidad: 85% para principal, 80% para thumbnail
- Max width: 1000px
- Thumbnail: 300x300px crop center

---

### B3: CloudStorage Service
**Objetivo:** Subir/eliminar archivos a S3 o storage local (temp)

**Archivo:** `backend/src/services/cloudStorageService.js`

**Opciones de implementación:**

**Opción 1 - Storage Local (MVP):**
```javascript
// Guardar en: backend/uploads/users/{userId}/animations/
// Servir via Express static
```

**Opción 2 - AWS S3 (Producción):**
```javascript
// Usar @aws-sdk/client-s3
// Bucket: lobba-animations
// Path: users/{userId}/animations/
```

**Funciones:**
- `upload(buffer, path)` - Subir archivo, retorna URL
- `delete(path)` - Eliminar archivo
- `generateSignedUrl(path, expiration)` - URL temporal

**Para MVP:** Usar storage local en `/backend/uploads/`

---

### B4: GET /api/users/:userId/animation
**Objetivo:** Obtener datos de animación de usuario

**Archivo:** `backend/src/controllers/animationController.js`

**Endpoint:** `GET /api/users/:userId/animation`

**Auth:** JWT required, solo el usuario o admin

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "hasCustomAnimation": true,
    "animationType": "crossfade",
    "animationDuration": 2500,
    "assets": {
      "beforeImage": "http://localhost:3000/uploads/...",
      "afterImage": "http://localhost:3000/uploads/...",
      "beforeThumbnail": "http://localhost:3000/uploads/...",
      "afterThumbnail": "http://localhost:3000/uploads/..."
    }
  }
}
```

**Si no tiene animación:**
```json
{
  "success": true,
  "data": {
    "userId": 123,
    "hasCustomAnimation": false
  }
}
```

---

### B5: POST /api/users/:userId/upload-animation-photos
**Objetivo:** Subir fotos y crear animación

**Archivo:** Mismo `animationController.js`

**Endpoint:** `POST /api/users/:userId/upload-animation-photos`

**Auth:** JWT required, solo el usuario

**Dependencia:** `multer` para multipart/form-data

**Request (multipart):**
- `beforePhoto`: File (max 5MB)
- `afterPhoto`: File (max 5MB)

**Proceso:**
1. Validar archivos (tipo, tamaño, dimensiones)
2. Optimizar imágenes con ImageProcessor
3. Crear thumbnails
4. Subir a CloudStorage
5. Guardar URLs en DB
6. Actualizar flag en users

**Response:**
```json
{
  "success": true,
  "message": "Animación creada exitosamente",
  "data": {
    "animationId": "uuid-123",
    "processingStatus": "completed"
  }
}
```

---

### B6: PUT /api/users/:userId/animation/settings
**Objetivo:** Actualizar configuración de animación

**Endpoint:** `PUT /api/users/:userId/animation/settings`

**Request:**
```json
{
  "animationType": "crossfade",
  "animationDuration": 3000,
  "isEnabled": true
}
```

---

### B7: DELETE /api/users/:userId/animation
**Objetivo:** Eliminar animación del usuario

**Endpoint:** `DELETE /api/users/:userId/animation`

**Proceso:**
1. Marcar `is_active = false` en user_animations
2. Actualizar `has_custom_animation = false` en users
3. Opcional: eliminar archivos físicos

---

### Rutas Backend
**Archivo:** `backend/src/routes/animation.js`

```javascript
router.get('/users/:userId/animation', authenticate, getAnimation)
router.post('/users/:userId/upload-animation-photos', authenticate, upload.fields([...]), uploadPhotos)
router.put('/users/:userId/animation/settings', authenticate, updateSettings)
router.delete('/users/:userId/animation', authenticate, deleteAnimation)
```

Registrar en `backend/src/index.js`:
```javascript
app.use('/api', animationRoutes)
```

---

## Fase C: Frontend (React)

### C1: Componente PersonalizedAnimation
**Objetivo:** Componente React que muestra la animación

**Archivo:** `frontend/src/components/PersonalizedAnimation.jsx`

**Props:**
- `userId: number` - ID del usuario
- `autoPlay: boolean` - Reproducir automáticamente (default: true)
- `onComplete: function` - Callback al finalizar

**Estados:**
- `animationData` - Datos de la animación
- `isLoading` - Estado de carga
- `error` - Errores
- `animationProgress` - Progreso 0-1

**Lógica:**
1. Al montar: `loadAnimation()` fetch GET /api/users/:userId/animation
2. Si `hasCustomAnimation = true`: cargar assets
3. Si `autoPlay = true`: iniciar animación
4. Usar `requestAnimationFrame` para suavidad
5. Crossfade: opacidad before (1 → 0), opacidad after (0 → 1)
6. Al completar: llamar `onComplete()`

**Fallback:**
Si no tiene animación custom, mostrar `<DefaultAnimation />` genérica

---

### C2: Estilos PersonalizedAnimation.css
**Archivo:** `frontend/src/components/PersonalizedAnimation.css`

**Características:**
- Container con aspect-ratio 1:1
- Max-width 500px
- Border-radius 20px
- Box-shadow suave
- Gradient background rosa
- Transición suave de opacidad
- Spinner de carga

---

### C3: Servicio de Precarga
**Objetivo:** Precargar imágenes antes de mostrar animación

**Archivo:** `frontend/src/services/animationPreloader.js`

**Función:** `preloadUserAnimation(userId)`

**Lógica:**
1. Fetch GET /api/users/:userId/animation
2. Si tiene animación: crear objetos Image()
3. Esperar `onload` de ambas imágenes
4. Retornar true/false según éxito

**Uso:** Llamar en login success antes de navegar

---

### C4: Integración en LoginSuccess
**Archivo:** Crear `frontend/src/pages/LoginSuccess.jsx`

**Flujo:**
1. Usuario hace login exitoso
2. Sistema navega a `/login-success`
3. Página muestra `<PersonalizedAnimation />`
4. Animación se reproduce (2-3 seg)
5. Al completar: navegar a `/dashboard`

**Ruta:** Añadir en router:
```jsx
<Route path="/login-success" element={<LoginSuccess />} />
```

---

### C5: Página UploadAnimation
**Objetivo:** UI para que usuario suba sus fotos

**Archivo:** `frontend/src/pages/UploadAnimation.jsx`

**Componentes:**
- Título: "Crea tu animación personalizada"
- Input file para "Foto sin maquillaje"
- Input file para "Foto con maquillaje"
- Preview de ambas fotos
- Botón "Crear animación"
- Loading state durante upload
- Success/error messages

**Validaciones frontend:**
- Tipo: solo .jpg, .jpeg, .png
- Tamaño: max 5MB
- Mostrar preview antes de subir

**Llamada API:**
```javascript
const formData = new FormData()
formData.append('beforePhoto', beforeFile)
formData.append('afterPhoto', afterFile)

fetch(`/api/users/${userId}/upload-animation-photos`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
```

**Ruta:** `/profile/animation/upload`

---

## Fase D: Optimizaciones PWA

### D1: Service Worker - Cache de Animaciones
**Archivo:** `frontend/public/service-worker.js` (si existe) o crear

**Lógica:**
```javascript
const ANIMATION_CACHE = 'animations-v1'

// Interceptar requests a /uploads/users/.../animations/
// Cache first strategy
// Si existe en cache: servir
// Si no: fetch + guardar en cache
```

**Beneficio:** Animaciones se cargan instantáneamente después de primera vez

---

## Fase E: Testing

### E1: Testing Backend
**Tests con curl:**

```bash
# 1. GET animación (usuario sin animación)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/users/1/animation

# 2. POST upload fotos
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -F "beforePhoto=@before.jpg" \
  -F "afterPhoto=@after.jpg" \
  http://localhost:3000/api/users/1/upload-animation-photos

# 3. GET animación (después de crear)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/users/1/animation

# 4. PUT settings
curl -X PUT \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"animationDuration": 3000}' \
  http://localhost:3000/api/users/1/animation/settings

# 5. DELETE animación
curl -X DELETE \
  -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/users/1/animation
```

---

### E2: Testing Frontend
**Tests manuales:**

1. **Login sin animación:**
   - Login como usuario sin animación
   - Verificar: muestra animación genérica
   - Navega a dashboard correctamente

2. **Upload animación:**
   - Ir a /profile/animation/upload
   - Subir 2 fotos válidas
   - Verificar: success message
   - Verificar: animación creada en DB

3. **Login con animación:**
   - Logout + login de nuevo
   - Verificar: muestra animación personalizada
   - Verificar: transición suave
   - Verificar: navegación automática

4. **Perfil:**
   - Ir a perfil de usuario
   - Verificar: animación se muestra

5. **Eliminar animación:**
   - Eliminar animación desde settings
   - Login de nuevo
   - Verificar: vuelve a animación genérica

---

## Fase F: Documentación y PR

### F1: Crear Pull Request
**Título:** "Sistema de Animaciones Personalizadas de Maquillaje"

**Descripción incluir:**
- Objetivo del feature
- Componentes implementados
- Endpoints API (4)
- Screenshots/GIF de la animación
- Instrucciones de testing
- Migraciones incluidas (2)

---

### F2: Documentar en README
**Crear:** `backend/ANIMATION_SYSTEM.md`

**Contenido:**
- Descripción del sistema
- Estructura de archivos
- Endpoints API documentados
- Ejemplos de uso
- Configuración requerida
- Troubleshooting

---

## Resumen de Tareas (18 tareas)

### Base de Datos (2)
- [A1] Migration user_animations
- [A2] Modificar tabla users

### Backend (7)
- [B1] Modelo UserAnimation
- [B2] ImageProcessor service
- [B3] CloudStorage service
- [B4] GET endpoint
- [B5] POST endpoint
- [B6] PUT endpoint
- [B7] DELETE endpoint

### Frontend (5)
- [C1] Componente PersonalizedAnimation
- [C2] Estilos CSS
- [C3] Servicio precarga
- [C4] Integración LoginSuccess
- [C5] Página UploadAnimation

### Optimizaciones (1)
- [D1] Service Worker cache

### Testing (2)
- [E1] Testing backend (curl)
- [E2] Testing frontend (manual)

### Documentación (2)
- [F1] Crear PR
- [F2] Documentación README

---

## Estimación de Tiempo

**Total estimado:** 3-4 días de desarrollo

- Fase A (DB): 30 min
- Fase B (Backend): 1.5 días
- Fase C (Frontend): 1.5 días
- Fase D (PWA): 0.5 días
- Fase E (Testing): 0.5 días
- Fase F (Docs): 0.5 días

---

## Dependencias NPM Nuevas

**Backend:**
```bash
npm install sharp multer
```

**Frontend:**
Ninguna (usa React existente)

---

## Configuración Requerida

**Backend `.env`:**
```env
# Storage local (MVP)
UPLOAD_DIR=/uploads
UPLOAD_MAX_SIZE=5242880  # 5MB

# O AWS S3 (producción)
AWS_S3_BUCKET=lobba-animations
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:3000
```

---

## Notas Importantes

1. **Seguridad:**
   - Validar JWT en todos los endpoints
   - Verificar que userId del token = userId del parámetro
   - Validar tipos de archivo (solo imágenes)
   - Limitar tamaño (5MB max)

2. **Performance:**
   - Usar WebP para menor tamaño
   - Crear thumbnails para previews rápidos
   - Implementar precarga de imágenes
   - Cache con Service Worker

3. **UX:**
   - Mostrar loading states
   - Animación genérica como fallback
   - Preview antes de upload
   - Mensajes de error claros

4. **Escalabilidad:**
   - Para producción: migrar a S3
   - Considerar CDN para distribución global
   - Lifecycle policies para limpieza

---

**¿Comenzamos con la implementación?**
