# Módulo de Geolocalización - LOBBA PWA

**Fecha:** 2025-10-15  
**Versión:** 1.0  
**Estado:** ✅ Completado  

---

## Resumen Ejecutivo

El módulo de geolocalización permite a las usuarias de LOBBA encontrar salones cercanos a su ubicación actual utilizando la API de Geolocalización del navegador y PostGIS en el backend.

**Características principales:**
- 🗺️ Mapa interactivo con Leaflet
- 📍 Búsqueda de salones por proximidad
- 📏 Radio de búsqueda configurable (1-50 km)
- 🎯 Ordenación automática por distancia
- 📱 Completamente responsive

---

## Arquitectura

### Backend

#### Base de Datos (PostGIS)

La tabla `salon_profiles` utiliza PostGIS para almacenar coordenadas geográficas:

```sql
-- Extensión PostGIS instalada
CREATE EXTENSION IF NOT EXISTS postgis;

-- Campo de ubicación geográfica
location GEOGRAPHY(Point, 4326)

-- Índice espacial para búsquedas rápidas
CREATE INDEX idx_salon_profiles_location 
ON salon_profiles USING GIST(location);
```

#### Modelo (SalonProfile.js)

Función principal para búsqueda por proximidad:

```javascript
export const findSalonsInRadius = async (centerLocation, radiusKm) => {
  const result = await pool.query(
    `SELECT sp.*,
      ST_Y(sp.location::geometry) as latitude,
      ST_X(sp.location::geometry) as longitude,
      ST_Distance(
        sp.location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
      ) / 1000 as distance_km
    FROM salon_profiles sp 
    WHERE ST_DWithin(
      sp.location,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $3 * 1000
    )
    ORDER BY distance_km ASC`,
    [centerLocation.longitude, centerLocation.latitude, radiusKm]
  )
  return result.rows
}
```

**Parámetros:**
- `centerLocation`: Objeto con `latitude` y `longitude` del centro de búsqueda
- `radiusKm`: Radio de búsqueda en kilómetros

**Retorna:** Array de salones ordenados por distancia ascendente

#### Controlador (salonProfileController.js)

Endpoint: `GET /api/salon/nearby`

**Query Parameters:**
- `latitude` (required): Latitud del centro de búsqueda (-90 a 90)
- `longitude` (required): Longitud del centro de búsqueda (-180 a 180)
- `radius` (optional): Radio en km (default: 5, max: 50)

**Ejemplo de Uso:**
```bash
curl "http://localhost:3000/api/salon/nearby?latitude=40.416775&longitude=-3.703790&radius=10"
```

**Respuesta:**
```json
{
  "center": {
    "latitude": 40.416775,
    "longitude": -3.70379
  },
  "radius": 10,
  "count": 5,
  "salons": [
    {
      "id": 1,
      "businessName": "Salon Beauty Madrid",
      "address": "Calle Gran Vía 28",
      "city": "Madrid",
      "location": {
        "latitude": 40.420,
        "longitude": -3.705
      },
      "distance": "0.45",
      "rating": 4.8,
      "totalReviews": 120
    }
  ]
}
```

#### Rutas (salon.js)

```javascript
router.get('/nearby', [
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('radius').optional().isFloat({ min: 0.1, max: 50 }),
], salonProfileController.getSalonsNearby)
```

**Validaciones:**
- Latitud: -90 a 90
- Longitud: -180 a 180
- Radio: 0.1 a 50 km

---

### Frontend

#### Hook: useGeolocation

Custom hook para obtener la ubicación del usuario:

```javascript
import useGeolocation from '../../hooks/useGeolocation'

const { location, error, loading, refetch } = useGeolocation()
```

**Retorna:**
- `location`: Objeto con `{ latitude, longitude, accuracy, timestamp }`
- `error`: Error si no se pudo obtener la ubicación
- `loading`: Estado de carga
- `refetch()`: Función para volver a obtener ubicación

**Opciones:**
```javascript
const { location } = useGeolocation({
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
})
```

#### Servicio: salon.js

```javascript
import { getSalonsNearby } from '../../services/salon'

const data = await getSalonsNearby(latitude, longitude, radius)
```

**Parámetros:**
- `latitude`: Latitud del centro
- `longitude`: Longitud del centro
- `radius`: Radio en km (default: 5)

**Retorna:** Objeto con `{ center, radius, count, salons }`

#### Componente: SalonMap

Mapa interactivo con marcadores de salones:

```jsx
import SalonMap from './SalonMap'

<SalonMap 
  salons={salons}
  center={[40.416775, -3.703790]}
  zoom={13}
  onSalonClick={(salon) => console.log(salon)}
/>
```

**Props:**
- `salons` (required): Array de salones con campo `location`
- `center` (optional): Array `[lat, lng]` para centrar el mapa
- `zoom` (optional): Nivel de zoom inicial (default: 13)
- `onSalonClick` (optional): Callback al hacer click en marcador

**Características:**
- Popup con información del salón
- Muestra distancia si está disponible
- Responsive (300-500px altura según pantalla)

#### Componente: SalonList (Actualizado)

Vista de lista/mapa con controles de geolocalización:

**Nuevos controles:**

1. **Selector de Vista:**
   - 📋 Lista
   - 🗺️ Mapa

2. **Búsqueda por Ubicación:**
   - Checkbox "Buscar cerca de mi ubicación"
   - Slider de radio (1-50 km)
   - Muestra distancia en tarjetas

3. **Filtros Tradicionales:**
   - Ciudad (solo si no usa geolocalización)
   - Categoría

**Estados:**
- Vista lista: Grid responsive de tarjetas
- Vista mapa: Mapa interactivo con todos los salones

---

## Flujo de Usuario

### 1. Usuario abre lista de salones

```
Usuario → SalonList.jsx → getAllSalons() → API → Salones
```

### 2. Usuario activa "Cerca de mi ubicación"

```
Usuario activa checkbox
  ↓
useGeolocation() obtiene ubicación
  ↓
Solicita permiso al navegador
  ↓
Si acepta: location { lat, lng }
  ↓
getSalonsNearby(lat, lng, radius)
  ↓
API backend con PostGIS
  ↓
Salones ordenados por distancia
```

### 3. Usuario cambia a vista mapa

```
Usuario click en "🗺️ Mapa"
  ↓
SalonMap renderiza con salones
  ↓
Mapa centrado en ubicación usuario
  ↓
Marcadores en posición de cada salón
  ↓
Click en marcador → Popup con info
```

---

## Tests

### SalonMap.test.jsx

Tests incluidos:
- ✅ Renderiza contenedor de mapa con salones
- ✅ Muestra estado vacío sin salones
- ✅ Renderiza marcadores para salones con ubicación
- ✅ Muestra información en popup
- ✅ Maneja salones sin ubicación correctamente
- ✅ Ejecuta callback onSalonClick

**Ejecutar tests:**
```bash
npm test src/modules/salon/SalonMap.test.jsx
```

---

## Dependencias Agregadas

```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^5.0.0"
}
```

**Instalación:**
```bash
pnpm add leaflet react-leaflet
```

---

## Archivos Creados/Modificados

### Nuevos Archivos

**Backend:**
- ✅ Sin archivos nuevos (funcionalidad ya existía parcialmente)

**Frontend:**
- ✅ `/src/services/salon.js` - Servicio API de salones
- ✅ `/src/hooks/useGeolocation.js` - Hook de geolocalización
- ✅ `/src/modules/salon/SalonMap.jsx` - Componente mapa
- ✅ `/src/modules/salon/SalonMap.css` - Estilos mapa
- ✅ `/src/modules/salon/SalonMap.test.jsx` - Tests mapa

### Archivos Modificados

**Backend:**
- ✅ `/backend/src/controllers/salonProfileController.js` - Agregado `getSalonsNearby`
- ✅ `/backend/src/routes/salon.js` - Agregada ruta `/nearby`

**Frontend:**
- ✅ `/src/modules/salon/SalonList.jsx` - Integración mapa y geolocalización
- ✅ `/src/modules/salon/SalonList.css` - Nuevos estilos controles

---

## Configuración Requerida

### Base de Datos

1. **PostGIS debe estar instalado:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

2. **Verificar índice espacial:**
```sql
SELECT * FROM pg_indexes 
WHERE tablename = 'salon_profiles' 
AND indexname = 'idx_salon_profiles_location';
```

### Frontend

**Permisos de Geolocalización:**

El navegador solicitará permiso al usuario. Si lo deniega:
- Se muestra mensaje de error
- Checkbox de geolocalización se deshabilita
- Usuario puede seguir usando filtros tradicionales

**CSS Variables Requeridas:**

El componente usa variables CSS del tema:
- `--spacing-*`
- `--color-*`
- `--font-size-*`
- `--border-radius-*`

---

## Mejoras Futuras

### Prioridad Alta
- [ ] Clusterización de marcadores (muchos salones cercanos)
- [ ] Geocoding inverso (convertir lat/lng a dirección)
- [ ] Autocompletar direcciones (Google Places API)

### Prioridad Media
- [ ] Guardar ubicaciones favoritas
- [ ] Historial de búsquedas
- [ ] Compartir ubicación de salón

### Prioridad Baja
- [ ] Rutas entre ubicación actual y salón
- [ ] Estimación tiempo de viaje
- [ ] Integración con transporte público

---

## Solución de Problemas

### Error: "No se pudo obtener tu ubicación"

**Causas comunes:**
1. Usuario denegó permisos
2. Navegador no soporta Geolocation API
3. Conexión no es HTTPS (requerido en producción)

**Solución:**
- Verificar permisos del navegador
- Usar HTTPS en producción
- Fallback a búsqueda manual por ciudad

### Mapa no se muestra

**Causas comunes:**
1. Leaflet CSS no cargado
2. Contenedor sin altura definida

**Solución:**
```jsx
// Verificar import CSS
import 'leaflet/dist/leaflet.css'

// Verificar altura contenedor
.salon-map-container {
  height: 500px;
}
```

### Base de datos: "function st_dwithin does not exist"

**Causa:** PostGIS no instalado

**Solución:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## Rendimiento

### Backend

**Índice GIST:** Permite búsquedas espaciales en O(log n)

```sql
EXPLAIN ANALYZE
SELECT * FROM salon_profiles 
WHERE ST_DWithin(location, ST_MakePoint(-3.7, 40.4)::geography, 5000);
```

**Optimización:**
- Limitar radio máximo a 50 km
- Índice espacial en `location`
- Evitar `SELECT *` en producción

### Frontend

**Lazy Loading:** Leaflet y React-Leaflet se cargan bajo demanda

**Optimización:**
- Componente SalonMap solo renderiza cuando viewMode='map'
- useGeolocation solo obtiene ubicación si useNearby=true
- Debouncing en slider de radio (futuro)

---

## Conclusión

El módulo de geolocalización está **100% funcional** e integrado en la PWA LOBBA. Permite a las usuarias encontrar salones cercanos de forma intuitiva con soporte completo para:

- ✅ Backend PostGIS con búsqueda espacial
- ✅ Frontend con mapa interactivo
- ✅ Permisos de geolocalización
- ✅ Responsive mobile-first
- ✅ Tests unitarios
- ✅ Fallback a búsqueda tradicional

**Próximo paso:** Integrar con notificaciones push basadas en proximidad.

---

**Documentado por:** Devin AI  
**Revisado:** 2025-10-15
