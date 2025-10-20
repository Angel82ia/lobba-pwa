# Sistema de Códigos de Referido - LOBBA PWA

## Descripción General

Sistema completo de códigos de referido para influencers que permite:
- Registrar usuarios con códigos de influencers
- Seguimiento automático en Google Sheets
- Cálculo automático de comisiones (10% de membresías)
- Reportes y estadísticas por código

## Estructura de la Base de Datos

### Tabla: `codigos_influencers`

```sql
CREATE TABLE codigos_influencers (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(20) UNIQUE NOT NULL,
  nombre_influencer VARCHAR(100) NOT NULL,
  email_influencer VARCHAR(100) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Constraints:**
- `codigo` debe estar en mayúsculas (CHECK)
- `codigo` solo acepta letras y números (CHECK alphanumeric)

### Modificación en tabla `users`

```sql
ALTER TABLE users 
ADD COLUMN codigo_referido VARCHAR(20) DEFAULT NULL;

-- Foreign key para validar códigos
ALTER TABLE users
ADD CONSTRAINT fk_codigo_referido 
FOREIGN KEY (codigo_referido) 
REFERENCES codigos_influencers(codigo)
ON DELETE SET NULL;
```

### Vista: `vista_reportes_influencers`

Vista que calcula automáticamente métricas por código:
- Total de registros
- Membresías activas
- Comisiones totales (10% de membresías activas)

```sql
CREATE VIEW vista_reportes_influencers AS
SELECT 
  ci.codigo,
  ci.nombre_influencer,
  ci.email_influencer,
  COUNT(u.id) as total_registros,
  COUNT(CASE WHEN u.membership_active = TRUE THEN 1 END) as membresias_activas,
  COALESCE(SUM(...), 0) as comisiones_totales
FROM codigos_influencers ci
LEFT JOIN users u ON u.codigo_referido = ci.codigo
WHERE ci.activo = TRUE
GROUP BY ci.codigo, ci.nombre_influencer, ci.email_influencer
ORDER BY total_registros DESC;
```

## Backend (Node.js/Express)

### Archivos Creados/Modificados

#### 1. Migraciones
- `backend/database/migrations/069_create_codigos_influencers.sql`
- `backend/database/migrations/070_add_codigo_referido_to_users.sql`
- `backend/database/migrations/071_create_vista_reportes_influencers.sql`

#### 2. Modelo: `backend/src/models/CodigoInfluencer.js`

```javascript
export const findCodigoByValue = async codigo => { ... }
export const createCodigo = async ({ codigo, nombreInfluencer, emailInfluencer }) => { ... }
export const getAllCodigos = async () => { ... }
export const deactivateCodigo = async codigo => { ... }
export const getReportesInfluencers = async () => { ... }
```

#### 3. Servicio: `backend/src/services/googleSheetsService.js`

**Funciones principales:**
- `initialize()` - Inicializa conexión con Google Sheets
- `enviarRegistroASheet(datos)` - Envía registro nuevo a Sheet
- `actualizarMembresiaPagada(email, montoPagado)` - Actualiza cuando se paga membresía
- `testConexion()` - Test de conexión

**Configuración requerida (variables de entorno):**
```bash
GOOGLE_SHEET_ID=<tu_spreadsheet_id>
GOOGLE_CREDENTIALS_JSON='{"type":"service_account",...}'
```

#### 4. Controlador: `backend/src/controllers/authController.js`

**Modificación en `register`:**
1. Valida código de referido si se proporciona
2. Si el código es válido, lo guarda en la BD
3. Si el código es inválido, registra al usuario pero sin código
4. Envía datos a Google Sheets de forma asíncrona (no crítico)

```javascript
// Validar código
let codigoReferidoValido = null
if (codigo_referido) {
  const codigoExistente = await findCodigoByValue(codigo_referido)
  if (codigoExistente) {
    codigoReferidoValido = codigo_referido
  }
}

// Crear usuario con código
const user = await createUser({
  ...userData,
  codigoReferido: codigoReferidoValido,
})

// Enviar a Google Sheets (no bloqueante)
if (codigoReferidoValido) {
  enviarRegistroASheet({...}).catch(err => logger.error(...))
}
```

#### 5. Rutas: `backend/src/routes/auth.js`

**Validación añadida:**
```javascript
body('codigo_referido')
  .optional()
  .trim()
  .isLength({ max: 20 })
  .withMessage('El código de referido no puede exceder 20 caracteres')
```

## Frontend (React/Vite)

### Archivos Modificados

#### 1. Formulario de Registro: `src/modules/auth/RegisterForm.jsx`

**Cambios principales:**

1. **Estado ampliado:**
```javascript
const [formData, setFormData] = useState({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  codigoReferido: '',  // NUEVO
})
```

2. **Captura automática desde URL:**
```javascript
useEffect(() => {
  const ref = searchParams.get('ref')
  if (ref) {
    setFormData(prev => ({
      ...prev,
      codigoReferido: ref.toUpperCase(),
    }))
  }
}, [searchParams])
```

3. **Validación de formato:**
```javascript
const handleChange = (e) => {
  let value = e.target.value
  
  if (e.target.name === 'codigoReferido') {
    value = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  }
  
  setFormData({ ...formData, [e.target.name]: value })
}
```

4. **Campo de input:**
```jsx
<Input
  label="¿Tienes un código de recomendación?"
  name="codigoReferido"
  type="text"
  value={formData.codigoReferido}
  onChange={handleChange}
  placeholder="Ej: MARIA2024"
  maxLength={20}
  fullWidth
/>
<p className="text-xs text-gray-500 mt-1">
  Introduce el código de tu influencer favorita (opcional)
</p>
```

## Google Sheets

### Configuración Requerida

#### 1. Crear Proyecto en Google Cloud Console

1. Ir a: https://console.cloud.google.com
2. Crear proyecto: "LOBBA-Tracking"
3. Habilitar "Google Sheets API"
4. Crear Service Account con rol "Editor"
5. Descargar credenciales JSON

#### 2. Estructura del Google Sheet

**Hoja "Registros"** (Columnas A-H):
- A: Fecha Registro
- B: Código Referido
- C: Nombre
- D: Email
- E: Estado (siempre "Registrada")
- F: Membresía Pagada ("SÍ" o "NO")
- G: Comisión (€)
- H: Fecha Pago

**Hoja "Resumen"** (fórmulas automáticas):
```
A1: =UNIQUE(Registros!B:B)
B1: "Total Registros"
B2: =COUNTIF(Registros!B:B, A2)
C1: "Pagadas"
C2: =COUNTIFS(Registros!B:B, A2, Registros!F:F, "SÍ")
D1: "Comisión Total"
D2: =SUMIF(Registros!B:B, A2, Registros!G:G)
```

**IMPORTANTE:** Compartir el Sheet con el email de la Service Account (del archivo JSON)

#### 3. Obtener SPREADSHEET_ID

De la URL: `https://docs.google.com/spreadsheets/d/1ABC123XYZ/edit`
El ID es: `1ABC123XYZ`

## Flujo de Trabajo

### 1. Registro de Usuario con Código

1. Usuario accede a `/register?ref=MARIA2024`
2. El campo "Código de recomendación" se precarga con "MARIA2024"
3. Usuario completa el formulario
4. Frontend envía request con `codigo_referido: "MARIA2024"`
5. Backend valida que el código existe y está activo
6. Backend crea usuario con `codigo_referido = "MARIA2024"`
7. Backend envía datos a Google Sheets (asíncrono, no crítico)

### 2. Registro de Usuario sin Código

1. Usuario accede a `/register` (sin parámetro)
2. Usuario completa el formulario (campo código opcional vacío)
3. Backend crea usuario con `codigo_referido = NULL`
4. No se envía nada a Google Sheets

### 3. Pago de Membresía

Cuando un usuario paga su membresía:

```javascript
import { actualizarMembresiaPagada } from '../services/googleSheetsService.js'

// En el controlador de pago/checkout
await actualizarMembresiaPagada(user.email, montoPagado)
```

Esto actualiza automáticamente:
- Columna F: "SÍ"
- Columna G: comisión (10% del monto)

## Variables de Entorno

**Backend (.env):**
```bash
# Google Sheets
GOOGLE_SHEET_ID=1ABC123XYZ456
GOOGLE_CREDENTIALS_JSON='{"type":"service_account","project_id":"lobba-tracking",...}'
```

**NUNCA** commitear:
- `.env`
- `google-credentials.json`

Añadir a `.gitignore`:
```
.env
.env.local
google-credentials.json
```

## Testing

### 1. Test Manual de Registro

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "password123",
    "codigo_referido": "TEST2024"
  }'
```

### 2. Verificar en Base de Datos

```sql
SELECT email, first_name, last_name, codigo_referido 
FROM users 
WHERE email = 'test@example.com';
```

### 3. Verificar en Google Sheets

Revisar que aparece nueva fila en hoja "Registros"

### 4. Test de Conexión

```javascript
import { testConexion } from './src/services/googleSheetsService.js'
await testConexion()
```

## Comandos Útiles

### Ejecutar Migraciones

```bash
cd backend
node database/migrate.js
```

### Ver Reportes

```sql
SELECT * FROM vista_reportes_influencers;
```

### Crear Nuevo Código de Influencer

```sql
INSERT INTO codigos_influencers (codigo, nombre_influencer, email_influencer) 
VALUES ('LAURA2024', 'Laura Martínez', 'laura@email.com');
```

### Desactivar Código

```sql
UPDATE codigos_influencers 
SET activo = FALSE 
WHERE codigo = 'MARIA2024';
```

## Roadmap / Mejoras Futuras

- [ ] Panel de admin para gestionar códigos
- [ ] Endpoint API para crear/desactivar códigos
- [ ] Notificaciones email a influencers cuando hay nuevo registro
- [ ] Dashboard de influencer (ver sus métricas)
- [ ] Exportar reportes a CSV/PDF
- [ ] Integración con sistema de pagos a influencers
- [ ] Página de landing personalizada por código

## Seguridad

✅ **Implementado:**
- Validación de códigos antes de guardar
- Foreign key constraint en BD
- Códigos solo en mayúsculas
- Solo caracteres alfanuméricos
- Envío a Google Sheets no bloqueante (no falla registro si Sheets falla)

⚠️ **Consideraciones:**
- Las credenciales de Google deben estar en variables de entorno
- El Service Account solo tiene permisos de "Editor" en el Sheet específico
- Los códigos inválidos se ignoran silenciosamente (UX: usuario se registra igual)

## Soporte

Si algo falla:
1. Verificar logs del backend: `console.log` en cada función
2. Test de conexión: ejecutar `testConexion()`
3. Verificar BD: queries SQL de cada migración
4. Google Sheet: verificar permisos del service account

**Errores comunes:**
- "Invalid credentials": Revisar `.env` y service account
- "Permission denied": Compartir Sheet con `client_email`
- "Spreadsheet not found": Verificar `GOOGLE_SHEET_ID`

---

**Versión:** 1.0  
**Fecha:** 2025-10-16  
**Stack:** Node.js + Express + PostgreSQL + React + Google Sheets API
