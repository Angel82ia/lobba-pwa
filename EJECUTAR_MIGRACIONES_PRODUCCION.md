# 🚀 Ejecutar Migraciones en Producción

## Problema actual

Tu base de datos en producción no tiene las columnas necesarias para:
1. Google Calendar (`google_access_token`, etc.)
2. Availability Blocks (`is_active`, etc.)

## ✅ Solución rápida (Supabase)

### **Paso 1: Ir a Supabase**

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto LOBBA
3. En el menú lateral, click en **SQL Editor**

### **Paso 2: Ejecutar el script**

1. Click en **+ New query**
2. Copia TODO el contenido del archivo:
   ```
   backend/database/run-missing-migrations.sql
   ```
3. Pégalo en el editor SQL
4. Click en **Run** (botón de play ▶️ en la esquina inferior derecha)

### **Paso 3: Verificar**

Deberías ver un resultado como:
```
table_name                           | column_count
-------------------------------------|-------------
availability_blocks                  | 13
salon_profiles (google columns)      | 10
```

## 🎯 Resultado esperado

Después de ejecutar el script:

✅ **Google Calendar funcionará**:
- Podrás conectar Google Calendar
- Los tokens se guardarán correctamente

✅ **Reservas funcionarán**:
- Podrás ver slots disponibles
- Los bloqueos de Google Calendar aparecerán

---

## 📋 Alternativa: Ejecutar archivo individual

Si prefieres ejecutar los archivos originales uno por uno:

### 1. Crear availability_blocks
```sql
-- Copiar contenido de:
backend/database/migrations/059_create_availability_blocks.sql
```

### 2. Agregar columnas Google Calendar
```sql
-- Copiar contenido de:
backend/database/migrations/060_add_google_calendar_to_salons.sql
```

### 3. Fix timestamps
```sql
-- Copiar contenido de:
backend/database/migrations/066_fix_timestamps_timezone.sql
```

---

## 🔍 Verificar que se aplicaron

Después de ejecutar, verifica en Supabase:

```sql
-- Verificar availability_blocks
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'availability_blocks';

-- Verificar salon_profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'salon_profiles' 
  AND column_name LIKE 'google%';
```

Deberías ver:
- `availability_blocks.is_active` → `boolean`
- `salon_profiles.google_access_token` → `text`

---

## ⚠️ Si algo falla

Si ves errores como:
```
relation "availability_blocks" already exists
```
→ **Es normal**, significa que esa parte ya está creada. El script usa `IF NOT EXISTS` para evitar errores.

Si ves:
```
foreign key constraint violation
```
→ Ejecuta las migraciones en orden (availability_blocks primero, luego google calendar).

---

## 🚀 Después de ejecutar

1. **No necesitas reiniciar Railway** - Los cambios son en la DB, no en el código
2. Intenta de nuevo:
   - Conectar Google Calendar
   - Ver slots disponibles para reservas

Todo debería funcionar correctamente.

---

## 📞 Si necesitas ayuda

Comparte el error exacto que aparece en el SQL Editor de Supabase.

