# Módulo Compartir Membresía Spirit

## 📋 Descripción General

El módulo de Compartir Membresía Spirit permite a las socias con membresía Spirit compartir todos los beneficios con un familiar o amiga. Este módulo implementa:

- **Compartir con una persona**: Las socias Spirit pueden compartir su membresía con un familiar o amiga
- **Gestión completa**: Crear, editar y revocar accesos compartidos
- **Validación de edad**: Detección y registro de menores de edad
- **Auditoría**: Registro completo de todas las acciones

## 🗄️ Base de Datos

### Tablas

#### `shared_memberships`
Almacena las membresías compartidas.

```sql
- id: UUID (PK)
- membership_id: UUID (FK a memberships)
- shared_with_name: TEXT
- shared_with_birthdate: DATE
- relation: TEXT ['daughter', 'mother', 'sister', 'friend', 'partner', 'other']
- created_by: UUID (FK a users)
- status: TEXT ['active', 'revoked']
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

**Índices:**
- `idx_shared_memberships_membership_id` - Buscar por membresía
- `idx_shared_memberships_created_by` - Buscar por creadora
- `idx_shared_memberships_status` - Filtrar por estado
- `idx_shared_memberships_unique_active` - Único activo por membresía + nombre

**Constraint único:** Solo una membresía compartida activa por `membership_id` y `shared_with_name`

#### `membership_audit`
Registro de auditoría para todas las acciones de membresía.

```sql
- id: UUID (PK)
- user_id: UUID (FK a users)
- action: TEXT
- resource_type: TEXT
- resource_id: UUID
- payload: JSONB
- ip_address: INET
- user_agent: TEXT
- created_at: TIMESTAMPTZ
```

## 🔧 Backend

### Modelo

#### `SharedMembership.js`

**Funciones principales:**

- `createSharedMembership({ membershipId, sharedWithName, sharedWithBirthdate, relation, createdBy })`
- `findSharedMembershipById(id)`
- `findSharedMembershipByMembershipId(membershipId)`
- `findSharedMembershipsByCreatedBy(createdBy)`
- `updateSharedMembership(id, updates)`
- `revokeSharedMembership(id)`
- `checkDuplicateActive(membershipId, sharedWithName)`

### Controlador

#### `membershipController.js`

**Endpoints:**

- `POST /api/membership/shared` - Crear membresía compartida
- `GET /api/membership/shared/:membershipId` - Obtener membresía compartida por ID de membresía
- `GET /api/membership/shared` - Obtener todas las membresías compartidas del usuario
- `PUT /api/membership/shared/:id` - Actualizar membresía compartida
- `DELETE /api/membership/shared/:id` - Revocar membresía compartida

**Validaciones:**

- Solo membresías Spirit pueden compartirse
- Solo membresías activas pueden compartirse
- No se permiten duplicados (mismo nombre en la misma membresía activa)
- Solo el propietario puede editar o revocar
- Validación de propiedad de membresía

**Auditoría:**

Todas las acciones se registran en `membership_audit`:
- `create_shared_membership`
- `update_shared_membership`
- `revoke_shared_membership`

## 🎨 Frontend

### Servicios

#### `sharedMembership.js`

Cliente API para comunicación con el backend:

- `createSharedMembership(membershipId, data)`
- `getSharedMembershipByMembershipId(membershipId)`
- `getMySharedMemberships()`
- `updateSharedMembership(id, data)`
- `revokeSharedMembership(id)`

### Componentes

#### `SpiritSharingDashboard.jsx`

Componente principal que orquesta todo el flujo.

**Props:**
- `membershipId` (string, required) - ID de la membresía
- `membershipType` (string, required) - Tipo de membresía ('essential' o 'spirit')

**Características:**
- Verifica si el tipo de membresía es Spirit
- Gestiona el estado de compartición
- Alterna entre mostrar formulario y lista
- Diseño Liquid Glass

#### `SpiritSharingForm.jsx`

Formulario para crear una nueva membresía compartida.

**Props:**
- `membershipId` (string, required) - ID de la membresía
- `onSuccess` (function, required) - Callback al crear exitosamente
- `onCancel` (function, optional) - Callback al cancelar

**Características:**
- Validación en tiempo real
- Cálculo automático de edad
- Advertencia para menores de edad
- Selector de relación
- Información contextual

**Campos del formulario:**
- Nombre completo (requerido)
- Fecha de nacimiento (requerido)
- Relación (opcional)

#### `SpiritSharingList.jsx`

Lista y gestión de membresía compartida existente.

**Props:**
- `membershipId` (string, required) - ID de la membresía
- `onRevoke` (function, optional) - Callback al revocar

**Características:**
- Vista detallada de la persona con quien se comparte
- Modo de edición inline
- Confirmación antes de revocar
- Indicador de edad y menor de edad
- Formateo de relación legible
- Estados: activa, revocada

## 📊 Flujo de Usuario

### 1. Usuario accede al dashboard de membresía Spirit

```jsx
<SpiritSharingDashboard
  membershipId={userMembership.id}
  membershipType={userMembership.plan_type}
/>
```

### 2. Usuario crea una membresía compartida

1. Click en "Compartir Membresía"
2. Rellenar formulario:
   - Nombre: "María García"
   - Fecha de nacimiento: "2010-05-15"
   - Relación: "Hija"
3. El sistema calcula que es menor (13 años)
4. Muestra advertencia de menor
5. Usuario confirma y envía
6. Se crea en base de datos
7. Se registra en auditoría

### 3. Usuario edita información

1. Click en "Editar"
2. Modificar campos
3. Click en "Guardar Cambios"
4. Se actualiza en base de datos
5. Se registra en auditoría

### 4. Usuario revoca acceso

1. Click en "Revocar Acceso"
2. Confirmar en diálogo
3. Estado cambia a 'revoked'
4. Se registra en auditoría
5. Puede crear nueva membresía compartida

## 🔒 Validaciones y Seguridad

### Backend

```javascript
// Verificar que es membresía Spirit
if (membership.plan_type !== 'spirit') {
  return res.status(400).json({ error: 'Only Spirit memberships can be shared' })
}

// Verificar que está activa
if (membership.status !== 'active') {
  return res.status(400).json({ error: 'Only active memberships can be shared' })
}

// Verificar propiedad
if (membership.user_id !== userId) {
  return res.status(403).json({ error: 'You can only share your own membership' })
}

// Verificar duplicados
const duplicate = await SharedMembership.checkDuplicateActive(membershipId, sharedWithName)
if (duplicate) {
  return res.status(409).json({ error: 'This membership is already shared with this person' })
}
```

### Frontend

```javascript
// Validar edad
const calculateAge = (birthdate) => {
  const today = new Date()
  const birth = new Date(birthdate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Detectar menores
const isMinor = age !== null && age < 18
```

## 🎨 Diseño UI

El módulo utiliza el sistema de diseño Liquid Glass:

**Componentes Card:**
- `variant="glass"` - Para formulario y lista principal
- `variant="info"` - Para estado vacío
- `variant="error"` - Para errores

**Efectos:**
- Translúcidos con `backdrop-filter: blur()`
- Gradientes rosa (#FF1493)
- Animaciones hover
- Modo oscuro compatible

**Responsive:**
- Desktop: Layout de 2 columnas
- Móvil: Stack vertical completo

## 📱 Integración

### En el dashboard de membresía

```jsx
import SpiritSharingDashboard from './components/SpiritSharingDashboard'

// Dentro del componente de membresía
{membership.plan_type === 'spirit' && (
  <div className="spirit-section">
    <SpiritSharingDashboard
      membershipId={membership.id}
      membershipType={membership.plan_type}
    />
  </div>
)}
```

### En navegación standalone

```jsx
import SpiritSharingDashboard from './modules/membership/components/SpiritSharingDashboard'

// En el router
<Route 
  path="/membership/share" 
  element={
    <SpiritSharingDashboard
      membershipId={currentMembership.id}
      membershipType={currentMembership.plan_type}
    />
  } 
/>
```

## 🧪 Testing

### Endpoints a probar

```bash
# Crear membresía compartida
curl -X POST http://localhost:3000/api/membership/shared \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "membershipId": "uuid-here",
    "sharedWithName": "María García",
    "sharedWithBirthdate": "1995-05-15",
    "relation": "friend"
  }'

# Obtener por membership ID
curl -X GET http://localhost:3000/api/membership/shared/uuid-here \
  -H "Authorization: Bearer TOKEN"

# Actualizar
curl -X PUT http://localhost:3000/api/membership/shared/uuid-here \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sharedWithName": "María García López",
    "relation": "sister"
  }'

# Revocar
curl -X DELETE http://localhost:3000/api/membership/shared/uuid-here \
  -H "Authorization: Bearer TOKEN"
```

## 📝 Casos de Uso

### Caso 1: Madre comparte con hija menor

```javascript
// Frontend detecta menor automáticamente
{
  sharedWithName: "Laura Martínez",
  sharedWithBirthdate: "2010-03-20", // 14 años
  relation: "daughter"
}

// Backend lo registra normalmente
// UI muestra badge de "menor de edad"
```

### Caso 2: Compartir con amiga

```javascript
{
  sharedWithName: "Ana Rodríguez",
  sharedWithBirthdate: "1992-08-10",
  relation: "friend"
}
```

### Caso 3: Editar información

```javascript
// Usuario se equivocó en el nombre
await updateSharedMembership(id, {
  sharedWithName: "Ana Rodríguez García" // Nombre completo
})
```

### Caso 4: Revocar y compartir con otra persona

```javascript
// 1. Revocar actual
await revokeSharedMembership(currentId)

// 2. Crear nueva
await createSharedMembership(membershipId, {
  sharedWithName: "Carmen López",
  sharedWithBirthdate: "1988-12-05",
  relation: "sister"
})
```

## 🔍 Consideraciones Especiales

### Privacidad

- No se almacena información sensible más allá de nombre y fecha de nacimiento
- Los datos están protegidos por Row Level Security
- Solo el creador puede ver/editar sus membresías compartidas

### Reglas de Negocio

1. **Solo Spirit**: Solo membresías Spirit pueden compartirse
2. **Solo activas**: Solo membresías activas pueden compartirse
3. **Una a la vez**: Solo puede compartirse con una persona activa a la vez
4. **Revocable**: Puede revocarse en cualquier momento
5. **Editable**: La información puede editarse mientras esté activa

### Menores de Edad

- Se detectan automáticamente (< 18 años)
- Se muestran con badge especial
- Se registran normalmente (sin restricciones especiales)
- El sistema solo alerta, no bloquea

## ✅ Estado Actual

- ✅ Tabla de base de datos creada
- ✅ Modelo backend completo
- ✅ Controlador y rutas completos
- ✅ Servicio API frontend
- ✅ Componente SpiritSharingForm
- ✅ Componente SpiritSharingList
- ✅ Componente SpiritSharingDashboard
- ✅ Estilos Liquid Glass
- ✅ Validaciones completas
- ✅ Auditoría implementada
- ✅ Responsive design

## 🚀 Próximos Pasos

1. **Integrar en MembershipDashboard**: Añadir pestaña o sección
2. **Notificaciones**: Enviar notificación cuando se comparte/revoca
3. **Email**: Enviar email a la socia cuando comparte con alguien
4. **Analytics**: Trackear cuántas usuarias comparten su membresía
5. **QR Code**: Generar QR para que la persona compartida pueda validarse
6. **App móvil**: Validación en salones mediante QR
