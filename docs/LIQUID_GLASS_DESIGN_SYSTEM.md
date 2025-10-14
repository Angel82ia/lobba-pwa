# 🌊 Liquid Glass Design System

## Resumen Ejecutivo

El **Liquid Glass Design System** de LOBBA es un sistema de diseño moderno y único que combina efectos translúcidos, animaciones fluidas y una paleta de colores vibrante (#FF1493 rosa y #8A2BE2 púrpura) para crear una experiencia visual premium.

---

## 📋 Tabla de Contenidos

1. [Filosofía de Diseño](#filosofía-de-diseño)
2. [Sistema de Colores](#sistema-de-colores)
3. [Variables CSS](#variables-css)
4. [Efectos Liquid Glass](#efectos-liquid-glass)
5. [Componentes](#componentes)
6. [Animaciones](#animaciones)
7. [Modo Oscuro](#modo-oscuro)
8. [Tipografías](#tipografías)
9. [Ejemplos de Uso](#ejemplos-de-uso)

---

## 🎨 Filosofía de Diseño

El Liquid Glass Design System se basa en tres principios fundamentales:

### 1. **Translucidez**
Uso extensivo de `backdrop-filter` y transparencias para crear profundidad y capas visuales.

### 2. **Fluidez**
Animaciones suaves y transiciones naturales que imitan el comportamiento de líquidos.

### 3. **Elegancia Moderna**
Combinación de gradientes vibrantes (#FF1493 rosa, #8A2BE2 púrpura) con efectos de luz y sombra.

---

## 🎨 Sistema de Colores

### Colores Principales

```css
--color-primary: #FF1493;           /* Deep Pink */
--color-secondary: #8A2BE2;         /* Blue Violet */
--color-accent: #FF69B4;            /* Hot Pink */
```

### Gradientes

```css
/* Gradiente principal rosa-púrpura */
background: linear-gradient(135deg, #FF1493 0%, #8A2BE2 100%);

/* Gradiente suave */
background: linear-gradient(135deg, 
  rgba(255, 20, 147, 0.2) 0%, 
  rgba(138, 43, 226, 0.2) 100%
);
```

### Colores de Texto

```css
--color-text-primary: #1a1a1a;     /* Texto principal (modo claro) */
--color-text-secondary: #666666;    /* Texto secundario */

/* Modo oscuro */
[data-theme="dark"] {
  --color-text-primary: #ffffff;
  --color-text-secondary: #a0a0a0;
}
```

---

## 🔧 Variables CSS

### Liquid Glass Core

Todas las variables del sistema están en `/src/styles/variables.css`:

```css
:root {
  /* Liquid Glass Effects */
  --liquid-glass-bg: rgba(255, 255, 255, 0.1);
  --liquid-glass-border: rgba(255, 255, 255, 0.2);
  --liquid-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  --liquid-glass-pink-border: rgba(255, 20, 147, 0.4);
  
  /* Spacing */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  
  /* Border Radius */
  --border-radius-sm: 0.25rem;
  --border-radius-md: 0.5rem;
  --border-radius-lg: 0.75rem;
  --border-radius-xl: 1rem;
  --border-radius-full: 9999px;
  
  /* Transitions */
  --transition-base: 0.2s ease-in-out;
  --transition-slow: 0.3s ease-in-out;
}
```

### Dark Mode Variables

```css
[data-theme="dark"] {
  --liquid-glass-bg: rgba(0, 0, 0, 0.3);
  --liquid-glass-border: rgba(255, 255, 255, 0.15);
  --liquid-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --shadow-glow-pink: 0 0 20px rgba(255, 20, 147, 0.3);
}
```

---

## 🌊 Efectos Liquid Glass

### Efecto Básico

Archivo: `/src/styles/liquid-glass/effects.css`

```css
.liquid-glass {
  background: var(--liquid-glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2px solid var(--liquid-glass-border);
  box-shadow: var(--liquid-glass-shadow);
  transition: all 0.3s ease;
}
```

### Variantes Disponibles

#### Fondo Claro
```css
.liquid-glass-light {
  background: rgba(255, 255, 255, 0.15);
}
```

#### Fondo Oscuro
```css
.liquid-glass-dark {
  background: rgba(0, 0, 0, 0.2);
}
```

#### Con Gradiente
```css
.liquid-glass-gradient {
  background: linear-gradient(
    135deg,
    rgba(255, 20, 147, 0.2) 0%,
    rgba(138, 43, 226, 0.2) 100%
  );
}
```

#### Con Brillo Intenso
```css
.liquid-glass-glow {
  box-shadow: 
    var(--liquid-glass-shadow),
    0 0 30px rgba(255, 20, 147, 0.4),
    inset 0 0 20px rgba(255, 20, 147, 0.1);
}
```

---

## 🧩 Componentes

### 1. Button Component

**Ubicación:** `/src/components/common/Button.jsx`

#### Uso Básico

```jsx
import Button from './components/common/Button'

// Botón default
<Button>Clic Aquí</Button>

// Botón liquid glass
<Button variant="liquid-glass">Suscríbete</Button>
```

#### Props Disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'liquid-glass'` | `'primary'` | Estilo del botón |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño del botón |
| `fullWidth` | `boolean` | `false` | Ancho completo |
| `disabled` | `boolean` | `false` | Estado deshabilitado |

#### Ejemplo Liquid Glass

```jsx
<Button 
  variant="liquid-glass"
  size="lg"
  fullWidth
>
  Activar Membresía Spirit
</Button>
```

---

### 2. Card Component

**Ubicación:** `/src/components/common/Card.jsx`

#### Uso Básico

```jsx
import Card from './components/common/Card'

<Card variant="liquid-glass">
  <h3>Membresía Essential</h3>
  <p>Acceso ilimitado a todos los salones</p>
</Card>
```

#### Props Disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'default' \| 'outlined' \| 'elevated' \| 'liquid-glass'` | `'default'` | Estilo de la tarjeta |
| `padding` | `'sm' \| 'md' \| 'lg'` | `'md'` | Padding interno |
| `className` | `string` | `''` | Clases adicionales |

---

### 3. Input Component

**Ubicación:** `/src/components/common/Input.jsx`

#### Uso Básico

```jsx
import Input from './components/common/Input'

<Input 
  variant="liquid-glass"
  label="Email"
  placeholder="tu@email.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

#### Props Disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'default' \| 'liquid-glass'` | `'default'` | Estilo del input |
| `label` | `string` | - | Etiqueta del campo |
| `type` | `string` | `'text'` | Tipo de input |
| `error` | `string` | - | Mensaje de error |
| `required` | `boolean` | `false` | Campo requerido |

---

### 4. ThemeToggle Component

**Ubicación:** `/src/components/common/ThemeToggle.jsx`

Toggle moderno con estilo liquid glass para cambiar entre modo claro y oscuro.

#### Uso Básico

```jsx
import ThemeToggle from './components/common/ThemeToggle'

<ThemeToggle />
```

**Características:**
- Animación de deslizamiento suave
- Gradiente rosa-púrpura en el thumb
- Efectos de brillo en hover
- Transiciones fluidas

---

### 5. LiquidGlassIcon Component

**Ubicación:** `/src/components/common/LiquidGlassIcon.jsx`

Contenedor de íconos con efectos liquid glass.

#### Uso Básico

```jsx
import LiquidGlassIcon from './components/common/LiquidGlassIcon'

<LiquidGlassIcon 
  icon={<span>⭐</span>}
  size="md"
  animated
  glow
/>
```

#### Props Disponibles

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `icon` | `node` | - **(requerido)** | Contenido del ícono |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Tamaño |
| `animated` | `boolean` | `false` | Animación flotante |
| `glow` | `boolean` | `false` | Efecto de brillo |

#### Ejemplo con SVG

```jsx
import HeartIcon from '@/assets/icons/liquid-glass/heart.svg?react'

<LiquidGlassIcon 
  icon={<HeartIcon />}
  size="lg"
  animated
  glow
/>
```

---

## 🎬 Animaciones

### Archivo: `/src/styles/liquid-glass/animations.css`

#### 1. Fade In (Entrada con opacidad)

```css
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-in {
  animation: fade-in 0.3s ease-in;
}
```

#### 2. Slide Up (Deslizamiento hacia arriba)

```css
@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up {
  animation: slide-up 0.4s ease-out;
}
```

#### 3. Liquid Flow (Flujo líquido)

```css
@keyframes liquid-flow {
  0%, 100% {
    transform: translate(-100%, -100%) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: translate(50%, 50%) rotate(180deg);
    opacity: 0.5;
  }
}

.liquid-flow {
  animation: liquid-flow 8s ease-in-out infinite;
}
```

#### 4. Glow Pulse (Pulso de brillo)

```css
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 20, 147, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 20, 147, 0.6);
  }
}

.glow-pulse {
  animation: glow-pulse 2s ease-in-out infinite;
}
```

#### 5. Float (Flotación)

```css
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.float {
  animation: float 3s ease-in-out infinite;
}
```

---

## 🌓 Modo Oscuro

### Implementación

El modo oscuro se gestiona mediante el `ThemeContext` y el atributo `data-theme` en el elemento `<html>`.

#### ThemeContext

**Ubicación:** `/src/contexts/ThemeContext.jsx`

```jsx
import { useTheme } from '@/contexts/ThemeContext'

function MiComponente() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <div>
      <p>Tema actual: {theme}</p>
      <button onClick={toggleTheme}>Cambiar tema</button>
    </div>
  )
}
```

#### Estilos para Dark Mode

```css
/* Modo claro (default) */
.mi-componente {
  background: rgba(255, 255, 255, 0.1);
  color: #1a1a1a;
}

/* Modo oscuro */
[data-theme="dark"] .mi-componente {
  background: rgba(0, 0, 0, 0.3);
  color: #ffffff;
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.3);
}
```

---

## 📝 Tipografías

### Fuentes Principales

El sistema usa dos fuentes de Google Fonts:

#### 1. **Montserrat** (Títulos y encabezados)
```css
--font-primary: 'Montserrat', sans-serif;
```

**Pesos disponibles:** 300, 400, 500, 600, 700

**Uso:**
```css
h1, h2, h3, .heading {
  font-family: var(--font-primary);
  font-weight: 700;
}
```

#### 2. **Open Sans** (Cuerpo de texto)
```css
--font-secondary: 'Open Sans', sans-serif;
```

**Pesos disponibles:** 300, 400, 500, 600, 700

**Uso:**
```css
p, body, .text {
  font-family: var(--font-secondary);
  font-weight: 400;
}
```

### Tamaños de Fuente

```css
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */
```

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Card de Membresía

```jsx
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'

function MembershipCard() {
  return (
    <Card variant="liquid-glass" padding="lg">
      <h2 className="text-2xl font-bold mb-4">Membresía Essential</h2>
      <p className="text-gray-600 mb-6">
        Acceso ilimitado a todos los salones LOBBA
      </p>
      <div className="text-3xl font-bold mb-6">
        €29.90<span className="text-lg">/mes</span>
      </div>
      <Button variant="liquid-glass" fullWidth>
        Suscribirse Ahora
      </Button>
    </Card>
  )
}
```

### Ejemplo 2: Formulario con Liquid Glass

```jsx
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <form className="liquid-glass p-8 rounded-2xl">
      <h2 className="text-2xl font-bold mb-6">Iniciar Sesión</h2>
      
      <Input
        variant="liquid-glass"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
      />
      
      <Input
        variant="liquid-glass"
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />
      
      <Button variant="liquid-glass" fullWidth className="mt-6">
        Entrar
      </Button>
    </form>
  )
}
```

### Ejemplo 3: Header con ThemeToggle

```jsx
import ThemeToggle from '@/components/common/ThemeToggle'
import LiquidGlassIcon from '@/components/common/LiquidGlassIcon'

function Header() {
  return (
    <header className="liquid-glass p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <LiquidGlassIcon 
          icon={<img src="/logo.png" alt="LOBBA" />}
          size="md"
          animated
        />
        <h1 className="text-xl font-bold">LOBBA</h1>
      </div>
      
      <ThemeToggle />
    </header>
  )
}
```

---

## 📁 Estructura de Archivos

```
src/
├── styles/
│   ├── variables.css              # Variables CSS globales
│   └── liquid-glass/
│       ├── index.css              # Importa todos los estilos liquid glass
│       ├── effects.css            # Efectos y variantes
│       └── animations.css         # Animaciones
│
├── components/
│   └── common/
│       ├── Button.jsx / Button.css
│       ├── Card.jsx / Card.css
│       ├── Input.jsx / Input.css
│       ├── ThemeToggle.jsx / ThemeToggle.css
│       └── LiquidGlassIcon.jsx / LiquidGlassIcon.css
│
├── contexts/
│   └── ThemeContext.jsx           # Gestión del tema
│
└── assets/
    ├── icons/
    │   └── liquid-glass/          # Íconos SVG con gradientes
    └── logos/                     # Logos de la marca
```

---

## 🚀 Getting Started

### 1. Importar estilos en tu App

```jsx
// src/App.jsx
import './styles/variables.css'
import './styles/liquid-glass/index.css'
```

### 2. Configurar ThemeContext

```jsx
// src/main.jsx
import { ThemeProvider } from './contexts/ThemeContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
)
```

### 3. Usar componentes

```jsx
import Button from './components/common/Button'
import Card from './components/common/Card'

function MyPage() {
  return (
    <Card variant="liquid-glass">
      <h1>¡Bienvenida a LOBBA!</h1>
      <Button variant="liquid-glass">Comenzar</Button>
    </Card>
  )
}
```

---

## 🎯 Best Practices

### 1. **Usa las variantes liquid-glass en elementos destacados**
Los efectos liquid glass son ideales para CTAs, cards importantes y elementos interactivos.

### 2. **Combina con animaciones**
Aplica clases de animación (`fade-in`, `slide-up`) para transiciones suaves.

```jsx
<Card variant="liquid-glass" className="fade-in">
  {/* contenido */}
</Card>
```

### 3. **Respeta el modo oscuro**
Siempre define estilos para `[data-theme="dark"]` cuando uses efectos liquid glass.

### 4. **Usa las variables CSS**
Nunca valores hardcodeados. Usa las variables definidas en `variables.css`.

```css
/* ✅ Correcto */
background: var(--liquid-glass-bg);

/* ❌ Incorrecto */
background: rgba(255, 255, 255, 0.1);
```

### 5. **Optimiza el backdrop-filter**
El `backdrop-filter` es costoso. Úsalo con moderación y evita aplicarlo a elementos muy grandes.

---

## 🔧 Personalización

### Cambiar el color principal

Edita `/src/styles/variables.css`:

```css
:root {
  --color-primary: #YOUR_COLOR;
  --liquid-glass-pink-border: rgba(YOUR_R, YOUR_G, YOUR_B, 0.4);
}
```

### Ajustar el blur

```css
:root {
  --liquid-glass-blur: 15px; /* Default: 10px */
}

.liquid-glass {
  backdrop-filter: blur(var(--liquid-glass-blur));
}
```

---

## 📚 Recursos Adicionales

- [Backdrop Filter MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Glassmorphism Generator](https://hype4.academy/tools/glassmorphism-generator)

---

## 🤝 Contribuir

Si deseas agregar nuevos componentes o variantes:

1. Crea el componente en `/src/components/common/`
2. Define los estilos usando las variables existentes
3. Añade soporte para dark mode
4. Documenta las props y ejemplos de uso
5. Agrega tests si es posible

---

## 📝 Changelog

### v1.0.0 (2025-10-14)

✅ **Implementado:**
- Variables CSS globales
- Efectos liquid glass (effects.css)
- Animaciones (animations.css)
- Componentes: Button, Card, Input, ThemeToggle, LiquidGlassIcon
- Modo oscuro completo
- PWA manifest e iconos
- Documentación completa

---

## 📧 Soporte

Para dudas o sugerencias sobre el Design System, contacta al equipo de desarrollo de LOBBA.

---

**🌊 Liquid Glass Design System - LOBBA PWA**  
*Versión 1.0.0*
