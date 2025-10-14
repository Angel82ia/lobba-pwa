# 🎨 Liquid Glass Design System - Quick Start

Guía rápida de implementación del Liquid Glass Design System para el equipo de desarrollo LOBBA.

---

## 🚀 Inicio Rápido (5 minutos)

### 1. Importar Estilos

En tu componente raíz (`App.jsx`):

```jsx
import './styles/variables.css'
import './styles/liquid-glass/index.css'
```

### 2. Configurar Tema

En `main.jsx`:

```jsx
import { ThemeProvider } from './contexts/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
```

### 3. Usar Componentes

```jsx
import Button from './components/common/Button'
import Card from './components/common/Card'

<Card variant="liquid-glass">
  <h2>Membresía Essential</h2>
  <Button variant="liquid-glass">Suscribirse</Button>
</Card>
```

---

## 📦 Componentes Disponibles

| Componente | Variante Liquid Glass | Uso Principal |
|------------|----------------------|---------------|
| **Button** | ✅ `variant="liquid-glass"` | CTAs, acciones principales |
| **Card** | ✅ `variant="liquid-glass"` | Tarjetas de membresías, productos |
| **Input** | ✅ `variant="liquid-glass"` | Formularios premium |
| **ThemeToggle** | ✅ Integrado | Toggle dark/light mode |
| **LiquidGlassIcon** | ✅ Por defecto | Íconos con efectos |

---

## 🎨 Paleta de Colores

```css
/* Rosa principal */
#FF1493 - Deep Pink

/* Púrpura secundario */
#8A2BE2 - Blue Violet

/* Gradiente principal */
linear-gradient(135deg, #FF1493 0%, #8A2BE2 100%)
```

---

## 📋 Cheat Sheet - Clases CSS

### Efectos Liquid Glass

```html
<!-- Básico -->
<div class="liquid-glass"></div>

<!-- Con gradiente -->
<div class="liquid-glass liquid-glass-gradient"></div>

<!-- Con brillo -->
<div class="liquid-glass liquid-glass-glow"></div>

<!-- Fondo claro -->
<div class="liquid-glass liquid-glass-light"></div>
```

### Animaciones

```html
<!-- Fade in -->
<div class="fade-in"></div>

<!-- Slide up -->
<div class="slide-up"></div>

<!-- Float (flotación) -->
<div class="float"></div>

<!-- Glow pulse -->
<div class="glow-pulse"></div>
```

---

## 🌓 Dark Mode

### Activar/Desactivar

```jsx
import { useTheme } from '@/contexts/ThemeContext'

function MyComponent() {
  const { theme, toggleTheme } = useTheme()
  
  return <button onClick={toggleTheme}>Toggle Theme</button>
}
```

### Estilos Específicos

```css
/* Modo claro */
.my-element {
  background: white;
  color: black;
}

/* Modo oscuro */
[data-theme="dark"] .my-element {
  background: black;
  color: white;
}
```

---

## 💡 Ejemplos Comunes

### Card de Membresía

```jsx
<Card variant="liquid-glass" padding="lg" className="fade-in">
  <h2 className="text-2xl font-bold">Essential</h2>
  <p className="text-gray-600">Acceso ilimitado</p>
  <div className="text-3xl font-bold">€29.90/mes</div>
  <Button variant="liquid-glass" fullWidth>Suscribirse</Button>
</Card>
```

### Formulario de Login

```jsx
<div className="liquid-glass p-8 rounded-2xl">
  <Input 
    variant="liquid-glass"
    label="Email"
    type="email"
    placeholder="tu@email.com"
  />
  <Input 
    variant="liquid-glass"
    label="Contraseña"
    type="password"
    placeholder="••••••••"
  />
  <Button variant="liquid-glass" fullWidth>Entrar</Button>
</div>
```

### Íconos Animados

```jsx
import LiquidGlassIcon from '@/components/common/LiquidGlassIcon'

<LiquidGlassIcon 
  icon={<span>⭐</span>}
  size="lg"
  animated
  glow
/>
```

---

## 🔧 Variables CSS Clave

```css
/* Colores */
--color-primary: #FF1493
--color-secondary: #8A2BE2

/* Liquid Glass */
--liquid-glass-bg: rgba(255, 255, 255, 0.1)
--liquid-glass-border: rgba(255, 255, 255, 0.2)
--liquid-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1)

/* Spacing */
--spacing-sm: 0.5rem
--spacing-md: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem

/* Border Radius */
--border-radius-lg: 0.75rem
--border-radius-xl: 1rem
--border-radius-full: 9999px
```

---

## ✅ Checklist de Implementación

- [ ] Importar estilos en App.jsx
- [ ] Configurar ThemeProvider
- [ ] Reemplazar buttons con variante liquid-glass
- [ ] Aplicar liquid-glass a cards importantes
- [ ] Añadir ThemeToggle en header
- [ ] Verificar dark mode en todos los componentes
- [ ] Añadir animaciones (`fade-in`, `slide-up`)
- [ ] Usar variables CSS (no valores hardcoded)
- [ ] Testear en móvil y desktop
- [ ] Verificar performance de backdrop-filter

---

## 🎯 Best Practices

1. **Usa liquid-glass para elementos destacados** (CTAs, cards principales)
2. **Aplica animaciones para transiciones** (`fade-in`, `slide-up`)
3. **Siempre define estilos para dark mode**
4. **Usa variables CSS, no valores hardcoded**
5. **Optimiza backdrop-filter** (úsalo con moderación)

---

## 📚 Documentación Completa

Para información detallada, consulta: [`LIQUID_GLASS_DESIGN_SYSTEM.md`](./LIQUID_GLASS_DESIGN_SYSTEM.md)

---

## 🐛 Troubleshooting

### El backdrop-filter no funciona

**Solución:** Añade el prefijo `-webkit-`:

```css
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);
```

### Los colores no se ven bien en dark mode

**Solución:** Define estilos específicos con `[data-theme="dark"]`:

```css
[data-theme="dark"] .my-element {
  background: rgba(0, 0, 0, 0.3);
  color: white;
}
```

### Las animaciones no se ejecutan

**Solución:** Verifica que hayas importado `animations.css`:

```jsx
import './styles/liquid-glass/index.css' // Ya incluye animations.css
```

---

## 📞 Contacto

Para dudas o sugerencias, contacta al equipo de desarrollo LOBBA.

---

**🌊 Liquid Glass Design System - LOBBA PWA**  
*Quick Start Guide v1.0.0*
