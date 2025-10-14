# Plan de Implementación: Sistema de Membresías LOBBA
## Dividido en Tareas Pequeñas y Asumibles

---

## FASE 1: MIGRACIONES DE BASE DE DATOS (Sin romper nada)
**Duración estimada: 1-2 horas**
**Riesgo: BAJO** - Solo añade tablas/campos nuevos

### Tarea 1.1: Extender tabla memberships
- **Archivo:** `042_extend_memberships_table.sql`
- **Acción:** ALTER TABLE para añadir campos faltantes
- **Campos a añadir:**
  - `billing_cycle` INTEGER
  - `is_free_month` BOOLEAN
  - `remaining_payments` INTEGER
  - `can_change_membership` BOOLEAN
  - `membership_change_allowed_from` TIMESTAMP
  - `previous_membership` VARCHAR(20)
  - `referral_code` VARCHAR(50) UNIQUE
- **Validación:** SELECT * FROM memberships LIMIT 1

### Tarea 1.2: Crear tabla monthly_limits
- **Archivo:** `043_create_monthly_limits_table.sql`
- **Estructura:**
  ```sql
  CREATE TABLE monthly_limits (
    id UUID PRIMARY KEY,
    membership_id UUID REFERENCES memberships(id),
    emergency_articles INTEGER,
    emergency_articles_used INTEGER DEFAULT 0,
    powerbanks INTEGER,
    powerbanks_used INTEGER DEFAULT 0,
    nail_prints INTEGER,
    nail_prints_used INTEGER DEFAULT 0,
    ems_sessions INTEGER,
    ems_sessions_used INTEGER DEFAULT 0,
    last_reset_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
  )
  ```
- **Validación:** \d monthly_limits

### Tarea 1.3: Crear tabla monthly_shipments
- **Archivo:** `044_create_monthly_shipments_table.sql`
- **Validación:** Insertar registro de prueba

### Tarea 1.4: Crear tabla powerbank_loans
- **Archivo:** `045_create_powerbank_loans_table.sql`
- **Campos críticos:**
  - user_id, powerbank_id, commerce_id
  - loan_date, return_date, status
  - hours_elapsed, penalty_applied, penalty_amount
- **Validación:** \d powerbank_loans

### Tarea 1.5: Crear tabla emergency_article_uses
- **Archivo:** `046_create_emergency_article_uses_table.sql`
- **Validación:** \d emergency_article_uses

### Tarea 1.6: Crear tabla referral_campaigns
- **Archivo:** `047_create_referral_campaigns_table.sql`
- **Validación:** \d referral_campaigns

### Tarea 1.7: Extender tabla users para referidos
- **Archivo:** `048_extend_users_for_referrals.sql`
- **Acción:** ALTER TABLE users ADD COLUMN
  - `referral_code` VARCHAR(50) UNIQUE
  - `referred_by` UUID REFERENCES users(id)
- **Validación:** \d users

### Tarea 1.8: Extender tabla orders
- **Archivo:** `049_extend_orders_for_memberships.sql`
- **Añadir columnas JSONB:**
  - `membership_discount` JSONB
  - `powerbank_penalties` JSONB
- **Validación:** \d orders

---

## FASE 2: MODELOS BACKEND
**Duración estimada: 2 horas**
**Riesgo: BAJO** - Solo crea archivos nuevos

### Tarea 2.1: Extender Membership.js
- **Archivo:** `backend/src/models/Membership.js`
- **Añadir métodos:**
  - `updateBillingCycle(membershipId)`
  - `canChangeMembership(membershipId)`
  - `changeMembershipType(membershipId, newType)`
  - `grantFreeMonth(membershipId)`
- **Validación:** Importar en test y verificar métodos existen

### Tarea 2.2: Crear MonthlyLimit.js
- **Archivo:** `backend/src/models/MonthlyLimit.js`
- **Métodos:**
  - `createMonthlyLimit(membershipId, type)`
  - `incrementUsage(membershipId, limitType)`
  - `resetLimits(membershipId)`
  - `getRemainingLimits(membershipId)`
- **Validación:** Unit test básico

### Tarea 2.3: Crear PowerbankLoan.js
- **Archivo:** `backend/src/models/PowerbankLoan.js`
- **Métodos:**
  - `createLoan(userId, powerbankId, commerceId)`
  - `returnPowerbank(loanId)`
  - `calculatePenalty(loanId)`
  - `getActiveLoan(userId)`
- **Validación:** Unit test básico

### Tarea 2.4: Crear EmergencyArticleUse.js
- **Archivo:** `backend/src/models/EmergencyArticleUse.js`
- **Métodos:**
  - `recordUse(userId, commerceId, articleType)`
  - `getMonthlyUsage(userId, month)`
  - `canUseArticle(userId)`
- **Validación:** Unit test básico

### Tarea 2.5: Crear ReferralCampaign.js
- **Archivo:** `backend/src/models/ReferralCampaign.js`
- **Métodos:**
  - `createCampaign(hostUserId)`
  - `addReferral(campaignId, newUserId)`
  - `checkCompletion(campaignId)`
  - `grantRewards(campaignId)`
- **Validación:** Unit test básico

---

## FASE 3: SERVICIOS DE LÓGICA DE NEGOCIO
**Duración estimada: 3 horas**
**Riesgo: MEDIO** - Lógica compleja

### Tarea 3.1: Crear membershipService.js
- **Archivo:** `backend/src/services/membershipService.js`
- **Funciones:**
  - `subscribeMembership(userId, type)`
  - `processBillingCycle(userId)`
  - `changeMembership(userId, newType)`
  - `cancelMembership(userId)`
- **Validación:** Test con usuario mock

### Tarea 3.2: Crear billingService.js
- **Archivo:** `backend/src/services/billingService.js`
- **Funciones:**
  - `calculateNextBilling(userId)`
  - `generateInvoice(userId)`
  - `applyPenalties(userId, penalties)`
- **Validación:** Test con datos mock

### Tarea 3.3: Crear discountService.js
- **Archivo:** `backend/src/services/discountService.js`
- **Funciones:**
  - `calculateOrderDiscount(userId, cartTotal)`
  - `applyMembershipDiscount(order)`
  - `calculateShipping(userId, total)`
- **Validación:** Test con diferentes totales

### Tarea 3.4: Crear referralService.js
- **Archivo:** `backend/src/services/referralService.js`
- **Funciones:**
  - `processReferral(hostUserId, newUserId)`
  - `checkAndCompleteCampaign(campaignId)`
  - `conductQuarterlyRaffle(quarter)`
- **Validación:** Test campaña completa

### Tarea 3.5: Crear validationService.js
- **Archivo:** `backend/src/services/validationService.js`
- **Funciones:** Todas las validaciones del documento
- **Validación:** Test cada validación

---

## FASE 4: CONTROLADORES API
**Duración estimada: 2 horas**
**Riesgo: BAJO** - Wrapper sobre servicios

### Tarea 4.1: Extender membershipController.js
- **Archivo:** `backend/src/controllers/membershipController.js`
- **Añadir:**
  - `subscribe(req, res)`
  - `changeMembership(req, res)`
  - `cancel(req, res)`
  - `getStatus(req, res)`
  - `getLimits(req, res)`
- **Validación:** Test con mock request

### Tarea 4.2: Crear powerbankController.js
- **Archivo:** `backend/src/controllers/powerbankController.js`
- **Métodos:**
  - `loanPowerbank(req, res)`
  - `returnPowerbank(req, res)`
  - `getActiveLoan(req, res)`
- **Validación:** Test con mock request

### Tarea 4.3: Crear emergencyArticleController.js
- **Archivo:** `backend/src/controllers/emergencyArticleController.js`
- **Métodos:**
  - `requestArticle(req, res)`
  - `getHistory(req, res)`
- **Validación:** Test con mock request

### Tarea 4.4: Crear referralController.js
- **Archivo:** `backend/src/controllers/referralController.js`
- **Métodos:**
  - `getMyCode(req, res)`
  - `getStats(req, res)`
  - `shareCode(req, res)`
- **Validación:** Test con mock request

### Tarea 4.5: Crear billingController.js
- **Archivo:** `backend/src/controllers/billingController.js`
- **Métodos:**
  - `getNextBilling(req, res)`
  - `getHistory(req, res)`
  - `getInvoice(req, res)`
- **Validación:** Test con mock request

---

## FASE 5: RUTAS API
**Duración estimada: 1 hora**
**Riesgo: BAJO** - Solo configuración

### Tarea 5.1: Extender routes/membership.js
- **Añadir rutas:**
  ```javascript
  POST   /api/membership/subscribe
  PUT    /api/membership/change
  DELETE /api/membership/cancel
  GET    /api/membership/status
  GET    /api/membership/limits
  ```
- **Validación:** curl cada endpoint

### Tarea 5.2: Crear routes/powerbank.js
- **Rutas:**
  ```javascript
  POST /api/powerbanks/loan
  POST /api/powerbanks/return
  GET  /api/powerbanks/active
  ```
- **Validación:** curl cada endpoint

### Tarea 5.3: Crear routes/emergencyArticle.js
- **Rutas:**
  ```javascript
  POST /api/emergency-articles/request
  GET  /api/emergency-articles/history
  ```
- **Validación:** curl cada endpoint

### Tarea 5.4: Crear routes/referral.js
- **Rutas:**
  ```javascript
  GET  /api/referrals/my-code
  GET  /api/referrals/stats
  POST /api/referrals/share
  ```
- **Validación:** curl cada endpoint

### Tarea 5.5: Crear routes/billing.js
- **Rutas:**
  ```javascript
  GET /api/billing/next
  GET /api/billing/history
  GET /api/billing/invoice/:id
  ```
- **Validación:** curl cada endpoint

### Tarea 5.6: Registrar rutas en index.js
- **Archivo:** `backend/src/index.js`
- **Añadir:**
  ```javascript
  app.use('/api/powerbanks', powerbankRoutes)
  app.use('/api/emergency-articles', emergencyArticleRoutes)
  app.use('/api/referrals', referralRoutes)
  app.use('/api/billing', billingRoutes)
  ```
- **Validación:** npm start y verificar rutas

---

## FASE 6: FRONTEND - SERVICIOS
**Duración estimada: 1 hora**
**Riesgo: BAJO**

### Tarea 6.1: Extender services/membership.js
- **Añadir funciones:**
  ```javascript
  subscribeMembership(type)
  changeMembership(newType)
  cancelMembership()
  getMembershipStatus()
  getMonthlyLimits()
  ```
- **Validación:** Import en componente test

### Tarea 6.2: Crear services/powerbank.js
- **Funciones:**
  ```javascript
  loanPowerbank(powerbankId, commerceId)
  returnPowerbank(loanId)
  getActiveLoan()
  ```
- **Validación:** Import en componente test

### Tarea 6.3: Crear services/emergencyArticle.js
- **Funciones:**
  ```javascript
  requestArticle(commerceId, articleType)
  getHistory()
  ```
- **Validación:** Import en componente test

### Tarea 6.4: Crear services/referral.js
- **Funciones:**
  ```javascript
  getMyCode()
  getStats()
  shareCode()
  ```
- **Validación:** Import en componente test

---

## FASE 7: FRONTEND - DASHBOARD MODULAR
**Duración estimada: 4 horas**
**Riesgo: MEDIO**

### Tarea 7.1: Crear configuración de widgets
- **Archivo:** `src/config/dashboardWidgets.js`
- **Definir:** Objeto DASHBOARD_WIDGETS con todos los widgets
- **Validación:** Import y verificar estructura

### Tarea 7.2: Crear DashboardService
- **Archivo:** `src/services/dashboardService.js`
- **Métodos:**
  - `getActiveWidgets(user)`
  - `getWidgetData(user, widget)`
  - `calculatePercentage(limitData)`
- **Validación:** Unit test

### Tarea 7.3: Crear Dashboard.jsx (página principal)
- **Archivo:** `src/pages/Dashboard.jsx`
- **Componente:** Contenedor principal
- **Validación:** Renderiza sin errores

### Tarea 7.4: Crear WidgetRenderer.jsx
- **Archivo:** `src/components/Dashboard/WidgetRenderer.jsx`
- **Componente:** Renderizador dinámico
- **Validación:** Renderiza widget mock

### Tarea 7.5: Crear MembershipSummaryWidget.jsx
- **Archivo:** `src/components/Dashboard/widgets/MembershipSummaryWidget.jsx`
- **Validación:** Renderiza con datos mock

### Tarea 7.6: Crear NextShipmentWidget.jsx
- **Archivo:** `src/components/Dashboard/widgets/NextShipmentWidget.jsx`
- **Validación:** Renderiza con datos mock

### Tarea 7.7: Crear LimitCounterWidget.jsx
- **Archivo:** `src/components/Dashboard/widgets/LimitCounterWidget.jsx`
- **Validación:** Renderiza con datos mock

### Tarea 7.8: Crear PowerbankWidget.jsx
- **Archivo:** `src/components/Dashboard/widgets/PowerbankWidget.jsx`
- **Validación:** Renderiza con datos mock

### Tarea 7.9: Crear ReferralWidget.jsx
- **Archivo:** `src/components/Dashboard/widgets/ReferralWidget.jsx`
- **Validación:** Renderiza con datos mock

### Tarea 7.10: Crear EmsSessionsWidget.jsx (solo Spirit)
- **Archivo:** `src/components/Dashboard/widgets/EmsSessionsWidget.jsx`
- **Validación:** Renderiza con datos mock

### Tarea 7.11: Crear SurpriseArticleWidget.jsx (solo Spirit)
- **Archivo:** `src/components/Dashboard/widgets/SurpriseArticleWidget.jsx`
- **Validación:** Renderiza con datos mock

### Tarea 7.12: Crear CSS para widgets
- **Archivo:** `src/components/Dashboard/widgets/widgets.css`
- **Validación:** Widgets se ven bien

---

## FASE 8: INTEGRACIÓN ECOMMERCE
**Duración estimada: 2 horas**
**Riesgo: MEDIO** - Modificar módulo existente

### Tarea 8.1: Integrar descuentos en checkout
- **Archivo:** `src/pages/Checkout.jsx` (o similar)
- **Añadir:** Llamada a `calculateOrderDiscount()`
- **Mostrar:** Descuento aplicado
- **Validación:** Compra con membresía vs sin membresía

### Tarea 8.2: Integrar envío gratis
- **Mostrar:** Umbral de envío gratis según membresía
- **Validación:** Essential 30€, Spirit 15€

### Tarea 8.3: Integrar límite de nail prints
- **Validar:** Impresiones disponibles antes de añadir al carrito
- **Mostrar:** "Te quedan X impresiones este ciclo"
- **Validación:** Bloquea si excede límite

---

## FASE 9: CRON JOBS Y AUTOMATIZACIONES
**Duración estimada: 2 horas**
**Riesgo: MEDIO**

### Tarea 9.1: Crear cron para facturación mensual
- **Archivo:** `backend/src/jobs/billingCron.js`
- **Frecuencia:** Mensual (día 1 a las 3:00 AM)
- **Acción:** Procesar ciclos de facturación
- **Validación:** Ejecutar manualmente y verificar

### Tarea 9.2: Crear cron para reset de límites
- **Archivo:** `backend/src/jobs/resetLimitsCron.js`
- **Frecuencia:** Mensual (día 1 a las 3:00 AM)
- **Acción:** Resetear contadores mensuales
- **Validación:** Ejecutar manualmente

### Tarea 9.3: Crear cron para powerbanks vencidos
- **Archivo:** `backend/src/jobs/powerbankCron.js`
- **Frecuencia:** Diaria (2:00 AM)
- **Acción:** Verificar préstamos > 24h
- **Validación:** Simular préstamo vencido

### Tarea 9.4: Crear cron para sorteos trimestrales
- **Archivo:** `backend/src/jobs/raffleCron.js`
- **Frecuencia:** Trimestral
- **Acción:** Realizar sorteo anual
- **Validación:** Ejecutar manualmente con datos test

### Tarea 9.5: Registrar crons en backend
- **Archivo:** `backend/src/jobs/index.js`
- **Iniciar:** Todos los cron jobs
- **Validación:** Verificar que se ejecutan

---

## FASE 10: TESTING
**Duración estimada: 3 horas**
**Riesgo: BAJO**

### Tarea 10.1: Tests unitarios - Modelos
- **Archivos:** `backend/tests/models/*.test.js`
- **Validación:** npm test

### Tarea 10.2: Tests unitarios - Servicios
- **Archivos:** `backend/tests/services/*.test.js`
- **Validación:** npm test

### Tarea 10.3: Tests unitarios - Controladores
- **Archivos:** `backend/tests/controllers/*.test.js`
- **Validación:** npm test

### Tarea 10.4: Tests de integración - API
- **Archivos:** `backend/tests/integration/*.test.js`
- **Validación:** npm run test:integration

### Tarea 10.5: Tests frontend - Componentes
- **Archivos:** `src/components/**/*.test.jsx`
- **Validación:** npm test

### Tarea 10.6: Tests E2E - Flujos completos
- **Archivos:** `tests/e2e/*.spec.js`
- **Flujos:**
  - Suscribirse a membresía
  - Solicitar artículo emergencia
  - Préstamo powerbank
  - Referir amiga
- **Validación:** npm run test:e2e

### Tarea 10.7: Validar que NO se rompe nada existente
- **Tests:** Ejecutar TODOS los tests existentes
- **Validación:** 100% pasan

---

## FASE 11: DOCUMENTACIÓN Y LIMPIEZA
**Duración estimada: 1 hora**
**Riesgo: BAJO**

### Tarea 11.1: Documentar endpoints API
- **Archivo:** `docs/API_MEMBERSHIPS.md`
- **Contenido:** Todos los endpoints con ejemplos

### Tarea 11.2: Documentar widgets
- **Archivo:** `docs/DASHBOARD_WIDGETS.md`
- **Contenido:** Cómo añadir nuevo widget

### Tarea 11.3: Actualizar README.md
- **Añadir:** Sección de membresías
- **Comandos:** Cómo ejecutar cron jobs

### Tarea 11.4: Limpiar console.logs
- **Buscar:** console.log en todo el código
- **Eliminar:** Logs de debug

### Tarea 11.5: Lint y format
- **Ejecutar:** npm run lint
- **Ejecutar:** npm run format
- **Validación:** Sin errores

---

## FASE 12: DEPLOYMENT
**Duración estimada: 1 hora**
**Riesgo: MEDIO**

### Tarea 12.1: Ejecutar migraciones en staging
- **Validación:** Todas las migraciones ejecutan OK

### Tarea 12.2: Deploy backend a staging
- **Validación:** Health check OK

### Tarea 12.3: Deploy frontend a staging
- **Validación:** App carga OK

### Tarea 12.4: Smoke tests en staging
- **Tests:** Flujos críticos funcionan
- **Validación:** Sin errores

### Tarea 12.5: Crear PR
- **Branch:** `feature/membership-system`
- **Descripción:** Completa con screenshots
- **Reviewers:** Asignar

---

## RESUMEN

**Total de tareas:** ~80 tareas pequeñas
**Total de fases:** 12 fases
**Duración estimada total:** ~24-28 horas
**Riesgo global:** BAJO-MEDIO (con validación constante)

## ORDEN DE EJECUCIÓN

1. **FASE 1** → Base de datos (crítico, base de todo)
2. **FASE 2** → Modelos (depende de FASE 1)
3. **FASE 3** → Servicios (depende de FASE 2)
4. **FASE 4-5** → Controllers + Routes (depende de FASE 3)
5. **FASE 6-7** → Frontend (puede paralelizarse)
6. **FASE 8** → Integración ecommerce
7. **FASE 9** → Cron jobs
8. **FASE 10** → Testing exhaustivo
9. **FASE 11** → Documentación
10. **FASE 12** → Deployment

## VALIDACIÓN CONTINUA

Después de CADA tarea:
- ✅ Commit pequeño con mensaje descriptivo
- ✅ Verificar que no hay errores
- ✅ Test básico funciona
- ✅ No se rompe nada existente

---

**Documento creado:** 2025-10-14  
**Listo para empezar:** SÍ ✅
