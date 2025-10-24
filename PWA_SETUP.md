# Configuración PWA - LOBBA

## ✅ Cambios Realizados

### 1. **Service Worker Registration**

Se agregó el registro del Service Worker en `src/main.jsx`:

```javascript
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Nueva versión disponible. ¿Deseas actualizar?')) {
      updateSW(true)
    }
  },
  onOfflineReady() {
    console.log('App lista para funcionar offline')
  },
})
```

### 2. **Iconos PWA**

Se generaron los siguientes iconos en el directorio `public/`:

- `icon-192x192.png` - Icono pequeño para PWA
- `icon-512x512.png` - Icono grande para PWA
- `apple-touch-icon.png` - Icono para dispositivos Apple
- `icon.svg` - Icono vectorial fuente
- `favicon.ico` - Favicon del sitio

### 3. **Meta Tags PWA**

Se actualizó `index.html` con las etiquetas necesarias:

```html
<!-- PWA Meta Tags -->
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="LOBBA" />

<!-- Microsoft Tiles -->
<meta name="msapplication-TileColor" content="#FF1493" />
<meta name="msapplication-TileImage" content="/icon-512x512.png" />
```

### 4. **Dependencias**

Se agregó `workbox-window` a las dependencias:

```json
"dependencies": {
  "workbox-window": "^7.3.0"
}
```

### 5. **Archivos Generados**

La aplicación ahora genera en `dist/`:

- `manifest.webmanifest` - Manifiesto de la PWA
- `sw.js` - Service Worker
- `workbox-*.js` - Librerías de Workbox para caching
- Todos los iconos necesarios

## 🧪 Cómo Probar la PWA

### En Desarrollo

1. Iniciar el servidor de desarrollo:

   ```bash
   pnpm dev
   ```

2. Abrir en el navegador: `http://localhost:5173`

3. **Chrome/Edge DevTools:**
   - Abrir DevTools (F12)
   - Ir a la pestaña "Application" o "Aplicación"
   - En el panel izquierdo, verificar:
     - **Manifest**: Debe mostrar la información de LOBBA
     - **Service Workers**: Debe aparecer como activo
     - **Storage**: Verificar el cache de Workbox

### En Producción

1. Compilar la aplicación:

   ```bash
   pnpm build
   ```

2. Previsualizar en producción:

   ```bash
   pnpm preview
   ```

3. O desplegar en tu servidor y acceder vía HTTPS (requerido para PWA)

### Instalar como App

#### En Móvil (Android/iOS)

1. Abrir la app en el navegador
2. En Chrome Android: Ver el banner "Agregar a pantalla de inicio"
3. En Safari iOS: Tap en el botón "Compartir" → "Agregar a pantalla de inicio"

#### En Desktop (Chrome/Edge)

1. Buscar el icono de instalación en la barra de direcciones (generalmente a la derecha)
2. Hacer clic en "Instalar LOBBA"
3. La app se abrirá como una ventana independiente

## 🔍 Verificar Funcionalidad PWA

### Lighthouse Audit

1. Abrir Chrome DevTools
2. Ir a la pestaña "Lighthouse"
3. Seleccionar "Progressive Web App"
4. Hacer clic en "Generate report"
5. Debería obtener una puntuación alta (>90)

### Características Activas

- ✅ **Instalable**: La app puede instalarse en el dispositivo
- ✅ **Offline**: Funciona sin conexión después de la primera carga
- ✅ **Auto-actualización**: Notifica cuando hay una nueva versión
- ✅ **Iconos**: Iconos personalizados en todos los tamaños
- ✅ **Splash Screen**: Pantalla de inicio automática en móviles
- ✅ **Standalone**: Se ejecuta como app nativa (sin barra del navegador)

## 🚀 Despliegue

### Vercel/Netlify

Los archivos ya están configurados. Solo necesitas hacer push a tu repositorio y estos servicios detectarán automáticamente la configuración de PWA.

### Servidor Propio

1. Compilar: `pnpm build`
2. Subir el contenido de `dist/` a tu servidor
3. Asegurarse de que:
   - Se sirve vía HTTPS
   - El header `Content-Type` para `.webmanifest` es `application/manifest+json`
   - Los Service Workers tienen las cabeceras CORS correctas

## 📱 Características PWA de LOBBA

El manifest incluye:

- **Nombre**: LOBBA
- **Color de tema**: #FF1493 (rosa característico)
- **Modo de visualización**: standalone (sin barra del navegador)
- **Orientación**: portrait (vertical)
- **Descripción**: "Plataforma integral para servicios de belleza y e-commerce"

## 🔧 Troubleshooting

### La PWA no se muestra como instalable

1. Verificar que estás en HTTPS (o localhost)
2. Comprobar que el manifest está accesible: `http://localhost:5173/manifest.webmanifest`
3. Verificar en DevTools → Application → Manifest que no haya errores
4. Asegurarse de que los iconos existen y son accesibles

### El Service Worker no se registra

1. Verificar en DevTools → Console que no haya errores
2. Comprobar en Application → Service Workers el estado
3. Hacer "Hard Refresh" (Ctrl+Shift+R o Cmd+Shift+R)

### Los cambios no se reflejan

1. En DevTools → Application → Service Workers
2. Marcar "Update on reload"
3. Click en "Unregister" y recargar la página
4. O click en "Skip waiting" si hay una nueva versión esperando

## 📝 Notas Adicionales

- El Service Worker usa la estrategia "NetworkFirst" para las llamadas a API
- Los assets estáticos se cachean automáticamente con Workbox
- La app pregunta al usuario si desea actualizar cuando hay una nueva versión
- Los iconos tienen un fondo rosa (#FF1493) con la letra "L" de LOBBA

---

**¡La app ahora está completamente configurada como PWA!** 🎉
