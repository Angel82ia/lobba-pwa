# Documentación: Membresías Compartidas (Spirit)

## Descripción General

El módulo de membresías compartidas permite a las titulares de membresías Spirit compartir los beneficios de su membresía con una persona especial (hija, madre, amiga, etc.). Este documento describe la implementación técnica completa.

## Arquitectura

### Base de Datos

#### Tabla: `memberships`
```sql
CREATE TABLE memberships (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan_type VARCHAR(20) CHECK (plan_type IN ('spirit', 'essential')),
  status VARCHAR(20) CHECK (status IN ('active', 'suspended', 'expired', 'cancelled')),
  start_date TIMESTAMP,
  expiry_date TIMESTAMP,
  auto_renew BOOLEAN,
  stripe_subscription_id VARCHAR(255),
  ...
)
```

#### Tabla: `shared_memberships`
```sql
CREATE TABLE shared_memberships (
  id UUID PRIMARY KEY,
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
  shared_with_name TEXT NOT NULL,
  shared_with_birthdate DATE NOT NULL,
  relation TEXT,
  created_by UUID REFERENCES users(id),
  status TEXT CHECK (status IN ('active', 'revoked')),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Características:**
- RLS (Row Level Security) habilitado
- Trigger automático para `updated_at`
- Índice único para prevenir duplicados activos
- Cascada de eliminación si se borra la membresía padre

#### Tabla: `membership_audit`
```sql
CREATE TABLE membership_audit (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT,
  resource_type TEXT,
  resource_id UUID,
  payload JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ
)
```

### API Endpoints

#### 1. Crear Compartición
```
POST /api/membership/share
Authorization: Bearer <jwt>

Request Body:
{
  "membershipId": "uuid",
  "sharedWithName": "María Pérez",
  "sharedWithBirthdate": "2012-05-17",
  "relation": "hija"
}

Response (201):
{
  "id": "uuid",
  "membershipId": "uuid",
  "status": "active",
  "isMinor": true,
  "createdAt": "2025-10-14T10:00:00Z"
}
```

**Validaciones:**
- Membresía debe pertenecer al usuario autenticado
- Membresía debe estar activa
- Solo membresías Spirit pueden compartirse
- No permitir duplicados (misma membresía + mismo nombre)
- Calcular edad automáticamente

#### 2. Obtener Compartición
```
GET /api/membership/:membershipId/share
Authorization: Bearer <jwt>

Response (200):
{
  "id": "uuid",
  "membership_id": "uuid",
  "shared_with_name": "María Pérez",
  "shared_with_birthdate": "2012-05-17",
  "relation": "hija",
  "status": "active",
  "created_at": "2025-10-14T10:00:00Z",
  "updated_at": "2025-10-14T10:00:00Z"
}
```

#### 3. Actualizar Compartición
```
PATCH /api/membership/share/:id
Authorization: Bearer <jwt>

Request Body:
{
  "sharedWithName": "María Pérez González",
  "relation": "hija"
}

Response (200):
{...}
```

#### 4. Revocar Compartición
```
POST /api/membership/share/:id/revoke
Authorization: Bearer <jwt>

Response (200):
{
  "id": "uuid",
  "status": "revoked",
  ...
}
```

#### 5. Listar Mis Comparticiones
```
GET /api/membership/my-shared
Authorization: Bearer <jwt>

Response (200):
[
  {
    "id": "uuid",
    "membership_id": "uuid",
    "shared_with_name": "María Pérez",
    ...
  }
]
```

### Frontend

#### Componentes

##### 1. SharedMembershipForm
**Ubicación:** `/src/modules/membership/components/SharedMembershipForm.jsx`

**Props:**
```javascript
{
  membership: {
    id: string,
    planType: 'spirit' | 'essential'
  },
  onSubmit: (data) => void,
  disabled: boolean
}
```

**Funcionalidad:**
- Checkbox para activar compartición
- Formulario condicional (solo visible si checkbox activo)
- Validación de campos requeridos
- Detección automática de menores de edad
- Aviso legal para menores

##### 2. SharedMembershipCard
**Ubicación:** `/src/modules/membership/components/SharedMembershipCard.jsx`

**Props:**
```javascript
{
  sharedMembership: {
    id: string,
    shared_with_name: string,
    shared_with_birthdate: string,
    relation: string,
    status: 'active' | 'revoked',
    created_at: string
  },
  onEdit: () => void,
  onRevoke: (id: string) => void,
  loading: boolean
}
```

**Funcionalidad:**
- Muestra información del beneficiario
- Indicador de menor de edad
- Acciones: editar y revocar
- Modal de confirmación para revocar

##### 3. Membership Page
**Ubicación:** `/src/pages/Membership.jsx`

**Funcionalidad:**
- Muestra detalles de la membresía activa
- Integra `SharedMembershipCard` si existe compartición
- CTA para compartir si no hay compartición activa
- Gestión de estados de carga y error

#### Servicios

**Ubicación:** `/src/services/membership.js`

```javascript
export const createSharedMembership = async (data) => {...}
export const getSharedMembership = async (membershipId) => {...}
export const updateSharedMembership = async (id, data) => {...}
export const revokeSharedMembership = async (id) => {...}
export const getMySharedMemberships = async () => {...}
```

## Reglas de Negocio

### 1. Titular vs Beneficiario
- El beneficiario NO es creado como usuario en la plataforma
- La titular mantiene la responsabilidad legal completa
- Solo la titular puede modificar o revocar la compartición

### 2. Menores de Edad
- Si `age < 18`:
  - Mostrar aviso legal prominente
  - No enviar emails al beneficiario
  - La titular asume responsabilidad legal explícita

### 3. Límites
- **1 beneficiario** por membresía Spirit (límite inicial)
- Solo membresías **Spirit** pueden compartirse
- Solo membresías en estado **active** pueden compartirse

### 4. Revocación
- La titular puede revocar en cualquier momento
- Estado cambia a `'revoked'`
- Acción irreversible (no se puede reactivar)

### 5. Duplicidad
- No se permite crear compartición duplicada:
  - Mismo `membership_id`
  - Mismo `shared_with_name`
  - Estado `active`

## Seguridad

### Autenticación
- Todos los endpoints protegidos con JWT
- Role requerido: `user`
- Validación de ownership de la membresía

### Row Level Security (RLS)
```sql
CREATE POLICY "shared_membership_owner_policy" 
ON shared_memberships
FOR ALL
USING (created_by = auth.uid() OR auth.role() = 'service_role')
WITH CHECK (created_by = auth.uid() OR auth.role() = 'service_role');
```

### Protección de Datos (RGPD/LOPD)
- Minimización de datos (solo nombre y fecha de nacimiento)
- Consentimiento explícito en UI
- Derecho al olvido (delete en cascada)
- Auditoría completa en `membership_audit`

### Validación de Entrada
- Express Validator en todos los endpoints
- Validación de UUIDs
- Validación de fechas (no futuras)
- Sanitización de strings

## Testing

### Tests Unitarios (Frontend)
```bash
npm test -- SharedMembershipForm.test.jsx
npm test -- SharedMembershipCard.test.jsx
```

### Tests de Integración (Backend)
```bash
npm test -- membership.test.js
```

### Tests E2E
```bash
npm run test:e2e -- membership-share.spec.js
```

## Deployment

### Migraciones
1. Ejecutar migración `040_create_memberships_table.sql`
2. Ejecutar migración `041_create_shared_memberships_table.sql`

```bash
cd backend
npm run migrate
```

### Feature Flags
```javascript
// .env
FF_MEMBERSHIP_SHARE=true  // Activar compartición Spirit
FF_MEMBERSHIP_ESSENTIAL=true  // Activar membresía Essential
```

### Rollout
1. Deploy a staging con FF off
2. Ejecutar tests (unit + e2e)
3. Activar FF para 5% usuarios (canary)
4. Monitorizar errores 72h
5. Si OK → 100% rollout

## Ejemplos de Uso

### Crear Compartición (Frontend)
```javascript
import { createSharedMembership } from '../services/membership'

const handleShare = async (formData) => {
  try {
    const result = await createSharedMembership({
      membershipId: membership.id,
      sharedWithName: formData.name,
      sharedWithBirthdate: formData.birthdate,
      relation: formData.relation
    })
    
    console.log('Compartición creada:', result)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

### Revocar Compartición
```javascript
const handleRevoke = async (sharedMembershipId) => {
  if (confirm('¿Seguro que quieres revocar esta compartición?')) {
    await revokeSharedMembership(sharedMembershipId)
    alert('Compartición revocada exitosamente')
  }
}
```

## Troubleshooting

### Error: "Membership not found"
- Verificar que la membresía existe
- Verificar que pertenece al usuario autenticado

### Error: "This membership is already shared"
- Ya existe una compartición activa con el mismo nombre
- Revocar la compartición existente primero

### Error: "Only Spirit memberships can be shared"
- El plan_type debe ser 'spirit'
- Las membresías Essential no permiten compartición

## Changelog

### v1.0.0 (2025-10-14)
- Implementación inicial de membresías compartidas
- Soporte para membresías Spirit
- RLS y auditoría completa
- UI responsive con validaciones

## Referencias

- [Documento Técnico Original](../attachments/membresias+tecnico.pdf)
- [AGENTS.md](./AGENTS.md) - Reglas de desarrollo
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitectura general

---

**Última actualización:** 2025-10-14  
**Versión:** 1.0.0  
**Mantenido por:** Equipo de Desarrollo LOBBA
