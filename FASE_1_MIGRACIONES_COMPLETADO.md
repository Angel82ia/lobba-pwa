# FASE 1: MIGRACIONES DE BASE DE DATOS - COMPLETADO

## ✅ Migraciones Creadas

Se han creado 6 nuevas migraciones siguiendo EXACTAMENTE las especificaciones del documento 3.0:

### 072_create_referral_memberships.sql
**Propósito:** Tracking de membresías con beneficio de programa de referidos
- Control de cuotas reducidas (11 en lugar de 12)
- Tracking de anfitrionas y referidas
- Control de cambio de membresía (bloqueado hasta 2ª cuota)
- Constraint: `UNIQUE(user_id)` - un usuario solo puede estar en un programa

### 073_create_codigos_descuento.sql
**Propósito:** Códigos de descuento para COMPRAS (Elemento 4)
- Códigos que se SUMAN al descuento base de membresía
- Porcentaje de descuento: típicamente 10%
- Porcentaje de comisión: típicamente 15%
- Validación: descuento entre 5-15%, comisión entre 5-20%
- Códigos de ejemplo insertados: MARIA10, TEST10

### 074_create_uso_codigos_descuento.sql
**Propósito:** Tracking de uso de códigos de descuento en compras
- **CRÍTICO:** Constraint `UNIQUE(user_id)` garantiza uso único por usuario
- Desglose completo de descuentos (base + código)
- Validación: máximo 25% de descuento total
- Tracking de comisiones para influencer

### 075_create_comisiones_influencers.sql
**Propósito:** Registro de comisiones de influencers
- Tipos: `primera_cuota` y `compra`
- Estados: `pendiente`, `pagado`, `cancelado`
- Vista `vista_comisiones_influencers` para reportes
- Tracking de importes base, porcentajes y montos

### 076_update_users_for_discounts.sql
**Propósito:** Añadir campos a tabla users para sistema de descuentos
- Campo `tipo_descuento_aplicado`: tracking de qué descuento se aplicó en primera cuota
- Valores permitidos: `referido_amigas`, `codigo_influencer`, `ninguno`, NULL
- Campo `ha_usado_codigo_compra`: flag de uso único de código en compras
- Constraint de validación de valores

### 077_update_codigos_influencers.sql
**Propósito:** Añadir campos de comisión a tabla codigos_influencers
- Campo `porcentaje_comision_primera_cuota`: FIJO al 10%
- Campo `fecha_fin_contrato`: control de vigencia de códigos
- Constraint: la comisión de primera cuota SIEMPRE es 10%
- Índice para búsquedas de códigos vigentes

---

## 📊 Estructura del Sistema Completo

### ELEMENTO 1: Programa de Referidos (Cuotas)
**Tablas involucradas:**
- `referral_campaigns` (✅ existente)
- `referral_campaign_entries` (✅ existente)
- `referral_memberships` (✅ NUEVA - migración 072)
- `raffle_entries` (✅ existente)

**Flujo:**
1. Anfitriona comparte código
2. 4 amigas se registran con código
3. Las 4 completan su registro → campaña completada
4. Sistema crea `referral_memberships` para las 5 usuarias
5. Cuotas reducidas: 11 en lugar de 12 (mes gratis)

---

### ELEMENTO 2: Código Influencer - Registro (Cuotas)
**Tablas involucradas:**
- `codigos_influencers` (✅ existente + actualizada en migración 077)
- `users.codigo_referido` (✅ existente)
- `users.tipo_descuento_aplicado` (✅ NUEVA - migración 076)
- `comisiones_influencers` (✅ NUEVA - migración 075)

**Flujo:**
1. Usuario se registra con código influencer (si NO tiene código de amigas)
2. Se marca `tipo_descuento_aplicado = 'codigo_influencer'`
3. Primera cuota: 20% descuento (10% usuario + 10% comisión)
4. Se genera registro en `comisiones_influencers` tipo `primera_cuota`

**Prioridades:**
- Si tiene código amigas → `tipo_descuento_aplicado = 'referido_amigas'` (PRIORIDAD 1)
- Si NO tiene código amigas pero SÍ código influencer → `tipo_descuento_aplicado = 'codigo_influencer'` (PRIORIDAD 2)
- Sin códigos → `tipo_descuento_aplicado = 'ninguno'`

---

### ELEMENTO 3: Descuento Base Automático (Compras)
**Tablas involucradas:**
- `memberships` (✅ existente)
- Servicio: `membershipDiscountService.js` (✅ existente)

**Descuentos:**
- Essential: 10% automático en TODAS las compras
- Spirit: 15% automático en TODAS las compras

**Estado:** ✅ Ya implementado - NO requiere cambios

---

### ELEMENTO 4: Código Influencer - Compras
**Tablas involucradas:**
- `codigos_descuento` (✅ NUEVA - migración 073)
- `uso_codigos_descuento` (✅ NUEVA - migración 074)
- `users.ha_usado_codigo_compra` (✅ NUEVA - migración 076)
- `comisiones_influencers` (✅ NUEVA - migración 075)

**Flujo:**
1. Usuario aplica código de descuento en checkout
2. Validar que `ha_usado_codigo_compra = FALSE`
3. Calcular descuento total:
   - Descuento base (10% Essential / 15% Spirit) +
   - Descuento código (10%)
   - Máximo total: 25%
4. Registrar uso en `uso_codigos_descuento` (constraint UNIQUE)
5. Marcar `users.ha_usado_codigo_compra = TRUE`
6. Generar comisión en `comisiones_influencers` tipo `compra`

---

## 🔑 Validaciones Críticas Implementadas

### Uso Único de Códigos de Compra
```sql
-- En tabla uso_codigos_descuento
CONSTRAINT uso_unico_por_usuario UNIQUE(user_id)
```
Garantiza que un usuario NUNCA puede usar más de un código de descuento en compras.

### Máximo Descuento 25%
```sql
-- En tabla uso_codigos_descuento
CONSTRAINT descuento_maximo CHECK (descuento_total_aplicado <= 25.00)
```

### Comisión Fija Primera Cuota
```sql
-- En tabla codigos_influencers
CONSTRAINT comision_fija CHECK (porcentaje_comision_primera_cuota = 10.00)
```

### Tipo de Descuento Válido
```sql
-- En tabla users
CONSTRAINT tipo_desc_valido 
CHECK (tipo_descuento_aplicado IN ('referido_amigas', 'codigo_influencer', 'ninguno', NULL))
```

---

## 📝 Próximos Pasos

### FASE 2: Backend - Programa Referidos
- Integración con membresías (reducir cuotas de 12 a 11)
- Aplicación automática de "mes gratis"
- Validación de prioridades

### FASE 3: Backend - Cuotas
- Cálculo de primera cuota con código influencer (20%)
- Generación de comisiones
- Validación de uso único

### FASE 4: Backend - Compras
- Códigos de descuento para compras
- Suma de descuentos (base + código)
- Validación de máximo 25%
- Uso único de código de compra

### FASE 5: Frontend
- Campo para código influencer en registro
- Campo para código de descuento en checkout
- Visualización de descuentos aplicados

### FASE 6: Testing
- Tests de todo el sistema

---

## ⚠️ Notas Importantes

1. **Las migraciones NO han sido ejecutadas aún** - requieren base de datos configurada
2. El usuario debe ejecutar `node database/migrate.js` cuando tenga la BD configurada
3. Las tablas respetan EXACTAMENTE la especificación del documento 3.0
4. Se mantiene compatibilidad con tablas existentes (referral_campaigns, etc.)
5. Todos los constraints críticos están implementados

---

## 🔗 Referencias

- Documento: SISTEMA DE DESCUENTOS Y CÓDIGOS - ESPECIFICACIÓN TÉCNICA.pdf
- Documento: DOCUMENTO 3.0 - Tareas Devin: Implementación Sistema de Códigos.pdf
