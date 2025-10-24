# Configuración de Google Sheets para Códigos de Referido

## Requisitos Previos

- Cuenta de Google
- Acceso a Google Cloud Console
- Permisos de administrador en el proyecto LOBBA

## Paso 1: Configurar Google Cloud Project

### 1.1 Crear Proyecto

1. Ir a: https://console.cloud.google.com
2. Clic en el selector de proyectos (arriba a la izquierda)
3. Clic en "Nuevo Proyecto"
4. Nombre: **LOBBA-Tracking**
5. Clic en "Crear"
6. Esperar a que se cree el proyecto

### 1.2 Habilitar Google Sheets API

1. En el menú lateral: **APIs y servicios** → **Biblioteca**
2. Buscar: **Google Sheets API**
3. Clic en el resultado
4. Clic en **Habilitar**
5. Esperar confirmación

### 1.3 Crear Service Account

1. En el menú lateral: **APIs y servicios** → **Credenciales**
2. Clic en **Crear credenciales** (arriba)
3. Seleccionar: **Cuenta de servicio**
4. Llenar formulario:
   - **Nombre:** lobba-sheets-service
   - **ID:** (se genera automáticamente)
   - **Descripción:** Servicio para tracking de códigos de referido
5. Clic en **Crear y continuar**
6. En "Otorgar acceso a este proyecto":
   - Rol: **Editor**
7. Clic en **Continuar**
8. Clic en **Listo** (permisos opcionales: dejar en blanco)

### 1.4 Crear Clave JSON

1. En la lista de Service Accounts, clic en **lobba-sheets-service**
2. Ir a pestaña **Claves**
3. Clic en **Agregar clave** → **Crear clave nueva**
4. Tipo: **JSON**
5. Clic en **Crear**
6. ⚠️ **IMPORTANTE:** Se descarga un archivo `.json`
   - Guardar este archivo de forma SEGURA
   - NO compartir públicamente
   - NO subir a GitHub

### 1.5 Copiar Email de Service Account

1. Abrir el archivo JSON descargado
2. Buscar el campo `client_email`
3. Copiar el email completo (ej: `lobba-sheets-service@lobba-tracking.iam.gserviceaccount.com`)

## Paso 2: Crear Google Sheet

### 2.1 Crear Spreadsheet

1. Ir a: https://sheets.google.com
2. Clic en **+ En blanco**
3. Nombrar el Sheet: **LOBBA Referidos**

### 2.2 Crear Hoja "Registros"

1. Renombrar la primera hoja a: **Registros**
2. En la fila 1 (cabeceras), escribir:
   - **A1:** Fecha Registro
   - **B1:** Código Referido
   - **C1:** Nombre
   - **D1:** Email
   - **E1:** Estado
   - **F1:** Membresía Pagada
   - **G1:** Comisión (€)
   - **H1:** Fecha Pago
3. Formatear la fila 1:
   - Seleccionar A1:H1
   - Negrita
   - Fondo gris claro
   - Centrar texto

### 2.3 Crear Hoja "Influencers"

1. Clic en **+** (abajo a la izquierda) para crear nueva hoja
2. Nombrar: **Influencers**
3. En la fila 1, escribir:
   - **A1:** Código
   - **B1:** Email Influencer
   - **C1:** Nombre
4. Añadir datos de ejemplo (fila 2 en adelante):
   - **A2:** MARIA2024
   - **B2:** maria@email.com
   - **C2:** María García
   
   - **A3:** TEST2024
   - **B3:** test@lobba.com
   - **C3:** Test Influencer

### 2.4 Crear Hoja "Resumen"

1. Crear nueva hoja: **Resumen**
2. En **A1**, escribir esta fórmula:
   ```
   =UNIQUE(Registros!B:B)
   ```
3. En **B1**, escribir cabecera: **Total Registros**
4. En **B2**, escribir fórmula:
   ```
   =COUNTIF(Registros!B:B, A2)
   ```
5. En **C1**, escribir cabecera: **Pagadas**
6. En **C2**, escribir fórmula:
   ```
   =COUNTIFS(Registros!B:B, A2, Registros!F:F, "SÍ")
   ```
7. En **D1**, escribir cabecera: **Comisión Total**
8. En **D2**, escribir fórmula:
   ```
   =SUMIF(Registros!B:B, A2, Registros!G:G)
   ```
9. Copiar fórmulas de B2:D2 hacia abajo (arrastrar desde la esquina)

### 2.5 Compartir Sheet con Service Account

⚠️ **PASO CRÍTICO:**

1. Clic en **Compartir** (arriba a la derecha)
2. Pegar el **email del Service Account** (copiado en paso 1.5)
3. Rol: **Editor** (importante)
4. Desmarcar "Notificar a las personas"
5. Clic en **Enviar**

### 2.6 Copiar ID del Spreadsheet

1. En la URL del Sheet, copiar el ID:
   ```
   https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
   ```
   Ejemplo: Si la URL es:
   ```
   https://docs.google.com/spreadsheets/d/1ABC123xyz456DEF/edit
   ```
   El ID es: `1ABC123xyz456DEF`

## Paso 3: Configurar Variables de Entorno

### 3.1 En el Servidor/Producción

Añadir estas variables de entorno:

```bash
GOOGLE_SHEET_ID=<TU_SPREADSHEET_ID_AQUI>
GOOGLE_CREDENTIALS_JSON='<CONTENIDO_COMPLETO_DEL_JSON>'
```

**Para GOOGLE_CREDENTIALS_JSON:**
1. Abrir el archivo JSON descargado
2. Copiar **TODO** el contenido (desde `{` hasta `}`)
3. Pegarlo entre comillas simples en la variable de entorno

**Ejemplo:**
```bash
GOOGLE_CREDENTIALS_JSON='{"type":"service_account","project_id":"lobba-tracking","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...","client_email":"lobba-sheets-service@lobba-tracking.iam.gserviceaccount.com",...}'
```

### 3.2 Para Desarrollo Local (OPCIONAL)

Si quieres probar en local:

1. Crear archivo `.env` en la carpeta `backend/`
2. Añadir:
   ```bash
   GOOGLE_SHEET_ID=<TU_SPREADSHEET_ID>
   GOOGLE_CREDENTIALS_JSON='<CONTENIDO_JSON>'
   ```

⚠️ **NUNCA** hacer commit de `.env`

## Paso 4: Verificar Configuración

### 4.1 Verificar que el Sheet tiene permisos

1. Abrir el Google Sheet
2. Verificar que en "Personas con acceso" aparece el email del Service Account

### 4.2 Test de Conexión (después de desplegar)

El backend debería mostrar en los logs:
```
✅ Google Sheets service initialized
```

Si hay error:
```
❌ Error initializing Google Sheets: [mensaje de error]
```

## Paso 5: Añadir Nuevos Códigos de Influencers

### Opción A: Directamente en Google Sheet

1. Ir a la hoja **Influencers**
2. Añadir nueva fila:
   - **Columna A:** Código (ej: LAURA2024)
   - **Columna B:** Email de la influencer
   - **Columna C:** Nombre de la influencer

### Opción B: En la Base de Datos

```sql
INSERT INTO codigos_influencers (codigo, nombre_influencer, email_influencer) 
VALUES ('LAURA2024', 'Laura Martínez', 'laura@email.com');
```

⚠️ **Importante:** Los códigos en la BD y en el Sheet deben coincidir para reportes correctos

## Troubleshooting

### Error: "Invalid credentials"
- ✅ Verificar que `GOOGLE_CREDENTIALS_JSON` está correctamente copiado
- ✅ Verificar que las comillas están bien cerradas
- ✅ Verificar que el JSON no tiene saltos de línea extra

### Error: "Permission denied"
- ✅ Verificar que el Sheet está compartido con el Service Account
- ✅ Verificar que el rol es "Editor", no "Viewer"
- ✅ Copiar nuevamente el email del Service Account del JSON

### Error: "Spreadsheet not found"
- ✅ Verificar que el `GOOGLE_SHEET_ID` es correcto
- ✅ Copiar el ID directamente desde la URL del Sheet
- ✅ No incluir caracteres extra (espacios, comillas)

### No se envían datos al Sheet
- ✅ Verificar logs del backend: buscar "Enviado a Google Sheets"
- ✅ Verificar que las variables de entorno están cargadas
- ✅ Hacer un registro de prueba con código válido

## Checklist Final

Antes de dar por completada la configuración:

- [ ] Proyecto creado en Google Cloud
- [ ] Google Sheets API habilitada
- [ ] Service Account creada con rol "Editor"
- [ ] Archivo JSON descargado y guardado de forma segura
- [ ] Email de Service Account copiado
- [ ] Google Sheet creado con nombre "LOBBA Referidos"
- [ ] Hoja "Registros" con 8 columnas (A-H)
- [ ] Hoja "Influencers" con códigos de ejemplo
- [ ] Hoja "Resumen" con fórmulas funcionando
- [ ] Sheet compartido con Service Account (rol Editor)
- [ ] SPREADSHEET_ID copiado de la URL
- [ ] Variables de entorno configuradas en servidor
- [ ] Test de conexión exitoso

## Contacto y Soporte

Si tienes problemas con la configuración:
1. Revisar los logs del backend
2. Verificar cada paso de este documento
3. Contactar al equipo de desarrollo con capturas de pantalla del error

---

**Última actualización:** 2025-10-16  
**Versión:** 1.0
