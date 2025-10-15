# Módulo de Programa de Referidos

## 📋 Descripción General

El Programa de Referidos permite a las socias de LOBBA invitar a amigas y obtener recompensas cuando completen su suscripción. Este módulo implementa:

- **Recompensa Principal**: Invita 4 amigas que se suscriban → Todas (5 personas) reciben 1 mes gratis
- **Sorteo Trimestral**: Participación automática en sorteo de 1 año de membresía gratis
- **Bloqueo de Cambio**: Las usuarias no pueden cambiar de membresía hasta el segundo cobro

## 🗄️ Base de Datos

### Tablas

#### `referral_campaigns`
Almacena las campañas de referidos de cada usuaria.

```sql
- id: UUID (PK)
- host_user_id: UUID (FK a users)
- host_referral_code: VARCHAR(50)
- status: VARCHAR(20) ['in_progress', 'completed', 'expired']
- completed_at: TIMESTAMP
- free_months_granted: BOOLEAN
- raffle_entry_granted: BOOLEAN
- raffle_quarter: VARCHAR(10) (e.g., 'Q1-2025')
```

#### `referral_campaign_entries`
Registra cada amiga referida dentro de una campaña.

```sql
- id: UUID (PK)
- campaign_id: UUID (FK a referral_campaigns)
- referred_user_id: UUID (FK a users)
- registered_at: TIMESTAMP
- membership_chosen: VARCHAR(20) ['essential', 'spirit']
- status: VARCHAR(20) ['pending_payment', 'completed']
- completed_at: TIMESTAMP
```

#### `raffle_entries`
Registra las participaciones en sorteos trimestrales.

```sql
- id: UUID (PK)
- user_id: UUID (FK a users)
- campaign_id: UUID (FK a referral_campaigns)
- quarter: VARCHAR(10) (e.g., 'Q1-2025')
- entry_date: TIMESTAMP
- is_winner: BOOLEAN
- won_at: TIMESTAMP
- prize: VARCHAR(100)
```

#### `users` (campos adicionales)
```sql
- referral_code: VARCHAR(50) UNIQUE - Código único generado automáticamente (formato: LOBBAXXXXXX)
- referred_by: UUID - ID de la usuaria que refirió a esta usuaria
```

## 🔧 Backend

### Servicios

#### `referralService.js`

**Funciones principales:**

- `getUserReferralCode(userId)` - Obtiene el código de referido de una usuaria
- `createReferralCampaign(userId)` - Crea una nueva campaña de referidos
- `registerReferral(referredUserId, referralCode)` - Registra un nuevo referido
- `completeReferralEntry(referredUserId, membershipType)` - Marca un referido como completado después del pago
- `getReferralStats(userId)` - Obtiene estadísticas de la campaña actual
- `getReferralHistory(userId)` - Obtiene historial de referidos

**Lógica de negocio:**

1. **Generación automática de códigos**: Cada usuaria recibe un código único al registrarse (trigger en BD)
2. **Registro de referidos**: Cuando una nueva usuaria usa un código de referido
3. **Completar referido**: Se marca como completado cuando la referida paga su primera suscripción
4. **Recompensas automáticas**: Cuando se completan 4 referidos:
   - Se marca `free_months_granted = true`
   - Se crea entrada en `raffle_entries`
   - Se otorga mes gratis a las 5 usuarias (host + 4 referidas)

### Controladores

#### `referralController.js`

**Endpoints:**

- `GET /api/referral/code` - Obtener código de referido
- `POST /api/referral/campaign` - Crear campaña de referidos
- `POST /api/referral/register` - Registrar un nuevo referido
- `POST /api/referral/complete` - Completar un referido (después del pago)
- `GET /api/referral/stats` - Obtener estadísticas
- `GET /api/referral/history` - Obtener historial

## 🎨 Frontend

### Componentes

#### `ReferralDashboard.jsx`

Dashboard principal del programa de referidos con diseño Liquid Glass.

**Características:**

- **Tarjeta de código**: Muestra el código de referido con botón de copiar
- **Progreso**: Barra de progreso visual mostrando X/4 referidos completados
- **Estadísticas**: Total, completados, pendientes
- **Recompensas**: Estado de mes gratis y sorteo trimestral
- **Historial**: Lista de amigas referidas con estado

**Estilos Liquid Glass:**
- Efectos translúcidos con `backdrop-filter: blur()`
- Gradientes animados con `liquidFlow`
- Modo oscuro compatible
- Animaciones suaves

### Servicios

#### `referral.js`

Cliente API para comunicación con el backend:

- `getReferralCode()`
- `createReferralCampaign()`
- `registerReferral(referralCode)`
- `completeReferral(membershipType)`
- `getReferralStats()`
- `getReferralHistory()`

## 🔗 Integración con Sistema de Membresías

### Flujo de Registro

1. **Nueva usuaria se registra** con código de referido
2. Se llama a `registerReferral(userId, referralCode)` después del registro
3. Se crea entrada en `referral_campaign_entries` con estado `pending_payment`

### Flujo de Pago

Cuando una usuaria referida completa su primer pago de membresía:

```javascript
// En el webhook de Stripe o después de confirmar pago
await completeReferralEntry(userId, membershipType)
```

Este proceso:
1. Actualiza el estado a `completed`
2. Verifica si se completaron 4 referidos
3. Si es así, otorga recompensas automáticamente

### Bloqueo de Cambio de Membresía

**Implementación recomendada:**

En `membershipController.js` o donde se maneje el cambio de membresía:

```javascript
// Verificar si es el primer o segundo pago
const paymentCount = await pool.query(
  `SELECT COUNT(*) FROM membership_payments 
   WHERE user_id = $1 AND status = 'completed'`,
  [userId]
)

if (parseInt(paymentCount.rows[0].count) < 2) {
  // Verificar si fue referida
  const wasReferred = await pool.query(
    `SELECT referred_by FROM users WHERE id = $1`,
    [userId]
  )
  
  if (wasReferred.rows[0].referred_by) {
    return res.status(403).json({
      error: 'No puedes cambiar de membresía hasta tu segundo cobro'
    })
  }
}
```

### Otorgamiento de Mes Gratis

**Implementación recomendada:**

Cuando una campaña se completa, en el servicio de membresías:

```javascript
// Extender suscripción 1 mes para el host
await pool.query(
  `UPDATE memberships 
   SET end_date = end_date + INTERVAL '1 month'
   WHERE user_id = $1`,
  [hostUserId]
)

// Extender suscripción 1 mes para cada referida
const referrals = await pool.query(
  `SELECT referred_user_id FROM referral_campaign_entries
   WHERE campaign_id = $1`,
  [campaignId]
)

for (const referral of referrals.rows) {
  await pool.query(
    `UPDATE memberships 
     SET end_date = end_date + INTERVAL '1 month'
     WHERE user_id = $1`,
    [referral.referred_user_id]
  )
}
```

## 📊 Casos de Uso

### 1. Socia comparte su código
```javascript
const { referralCode } = await getReferralCode()
// Mostrar código en UI para compartir
```

### 2. Nueva usuaria se registra con código
```javascript
// Durante el registro
await registerReferral(newUserId, referralCodeFromForm)
```

### 3. Nueva usuaria completa pago
```javascript
// En webhook de Stripe o después de pago exitoso
await completeReferralEntry(userId, 'essential')
```

### 4. Socia ve su progreso
```javascript
const stats = await getReferralStats()
// stats.stats.completed = 2
// stats.stats.remaining = 2
// stats.stats.needed = 4
```

### 5. Campaña completada (4 referidos)
```javascript
// Automático al completar el 4º referido
// Se activa en el trigger de BD o en completeReferralEntry()
// - free_months_granted = true
// - Se crea entrada en raffle_entries
// - Se otorgan meses gratis
```

## 🎰 Sorteos Trimestrales

### Gestión de Sorteos

Los sorteos se realizan manualmente por administradores:

```sql
-- Obtener participantes del trimestre actual
SELECT u.*, re.* 
FROM raffle_entries re
JOIN users u ON re.user_id = u.id
WHERE re.quarter = 'Q1-2025' AND re.is_winner = false;

-- Seleccionar ganadora aleatoriamente
UPDATE raffle_entries
SET is_winner = true, won_at = CURRENT_TIMESTAMP, prize = '1 year free membership'
WHERE id = (
  SELECT id FROM raffle_entries
  WHERE quarter = 'Q1-2025' AND is_winner = false
  ORDER BY RANDOM()
  LIMIT 1
);
```

## 🔒 Seguridad

- ✅ Validación de códigos de referido
- ✅ Prevención de auto-referidos (no puedes usar tu propio código)
- ✅ Control de duplicados (no puedes referir a la misma persona dos veces)
- ✅ Autenticación requerida en todos los endpoints
- ✅ Verificación de propiedad de campañas

## 📝 Notas de Implementación

### Triggers de Base de Datos

1. **Generación automática de códigos** (`trg_users_generate_referral_code`)
   - Se ejecuta al crear una nueva usuaria
   - Genera código único formato LOBBAXXXXXX

2. **Verificación de campaña completada** (`trg_check_campaign_completion`)
   - Se ejecuta al actualizar un entry a 'completed'
   - Marca la campaña como completada si hay 4 referidos

### Funciones de Base de Datos

- `generate_user_referral_code()` - Genera códigos únicos
- `check_campaign_completion()` - Verifica y completa campañas
- `update_referral_timestamp()` - Actualiza timestamps automáticamente

## 🚀 Próximos Pasos de Integración

1. **Integrar con registro de usuarias**: Llamar a `registerReferral()` si se proporcionó código
2. **Integrar con pagos**: Llamar a `completeReferralEntry()` después del primer pago exitoso
3. **Implementar otorgamiento de mes gratis**: Extender suscripciones cuando se complete campaña
4. **Implementar bloqueo de cambio**: Validar en cambio de membresía
5. **Crear panel de administración**: Para gestionar sorteos trimestrales

## 🎨 Diseño UI

El dashboard utiliza el sistema de diseño Liquid Glass:

- **Colores**: Gradientes rosa (#FF1493) y oscuros
- **Efectos**: Translúcidos con blur
- **Animaciones**: Fade-in, slide-up, liquid-flow
- **Responsive**: Adaptado a móvil y desktop
- **Modo oscuro**: Totalmente compatible

## 📱 Ejemplo de Integración en Navegación

```jsx
import ReferralDashboard from './modules/referral/ReferralDashboard'

// En el menú de navegación
<Route path="/referral" element={<ReferralDashboard />} />
```

## 🧪 Testing

**Endpoints a probar:**

```bash
# Obtener código de referido
curl -X GET http://localhost:3000/api/referral/code \
  -H "Authorization: Bearer TOKEN"

# Crear campaña
curl -X POST http://localhost:3000/api/referral/campaign \
  -H "Authorization: Bearer TOKEN"

# Registrar referido
curl -X POST http://localhost:3000/api/referral/register \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"referralCode": "LOBBA123456"}'

# Completar referido
curl -X POST http://localhost:3000/api/referral/complete \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"membershipType": "essential"}'

# Obtener estadísticas
curl -X GET http://localhost:3000/api/referral/stats \
  -H "Authorization: Bearer TOKEN"
```

## ✅ Estado Actual

- ✅ Migraciones de base de datos
- ✅ Servicios backend completos
- ✅ Controladores y rutas
- ✅ Componente frontend ReferralDashboard
- ✅ Servicios API frontend
- ✅ Estilos Liquid Glass
- ⏳ Integración con registro de usuarias (pendiente)
- ⏳ Integración con pagos de membresías (pendiente)
- ⏳ Implementación de mes gratis (pendiente)
- ⏳ Implementación de bloqueo de cambio (pendiente)
