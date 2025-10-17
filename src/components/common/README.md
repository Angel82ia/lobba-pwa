# Componentes Comunes LOBBA con Tailwind CSS

Biblioteca de componentes reutilizables construidos con React y Tailwind CSS, con soporte completo para modo claro y oscuro.

## 📦 Componentes Disponibles

- [Alert](#alert) - Paneles de mensajes (info, success, warning, error)
- [Button](#button) - Botones con múltiples variantes y estados
- [Card](#card) - Contenedores para agrupar contenido
- [Dropdown](#dropdown) - Menús desplegables
- [Input](#input) - Campos de texto
- [Select](#select) - Selectores con estilo similar a Input
- [Textarea](#textarea) - Áreas de texto multilínea
- [ThemeToggle](#themetoggle) - Botón para cambiar entre modo claro/oscuro

## 🚀 Uso

### Importación

```jsx
// Importar componentes individuales
import { Button, Input, Alert } from '@/components/common'

// O importar todos
import * as CommonComponents from '@/components/common'
```

---

## Alert

Panel para mostrar mensajes informativos, de éxito, advertencia o error.

### Props

| Prop        | Tipo                                          | Default  | Descripción                          |
| ----------- | --------------------------------------------- | -------- | ------------------------------------ |
| `children`  | `node`                                        | -        | Contenido del alert                  |
| `variant`   | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Variante de color                    |
| `title`     | `string`                                      | -        | Título opcional                      |
| `onClose`   | `function`                                    | -        | Callback al cerrar (muestra botón X) |
| `className` | `string`                                      | `''`     | Clases CSS adicionales               |

### Ejemplos

```jsx
// Alert simple
<Alert variant="info">
  Este es un mensaje informativo.
</Alert>

// Alert con título
<Alert variant="success" title="¡Éxito!">
  La operación se completó correctamente.
</Alert>

// Alert dismissible
<Alert variant="error" title="Error" onClose={() => console.log('cerrado')}>
  Ocurrió un error al procesar la solicitud.
</Alert>
```

---

## Button

Botón con múltiples variantes, tamaños y estados.

### Props

| Prop        | Tipo                                                                                     | Default     | Descripción                    |
| ----------- | ---------------------------------------------------------------------------------------- | ----------- | ------------------------------ |
| `children`  | `node`                                                                                   | -           | Contenido del botón            |
| `variant`   | `'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'outline' \| 'ghost'` | `'primary'` | Variante de estilo             |
| `size`      | `'small' \| 'medium' \| 'large'`                                                         | `'medium'`  | Tamaño del botón               |
| `fullWidth` | `boolean`                                                                                | `false`     | Ocupa todo el ancho disponible |
| `disabled`  | `boolean`                                                                                | `false`     | Deshabilita el botón           |
| `loading`   | `boolean`                                                                                | `false`     | Muestra spinner de carga       |
| `onClick`   | `function`                                                                               | -           | Callback al hacer clic         |
| `type`      | `'button' \| 'submit' \| 'reset'`                                                        | `'button'`  | Tipo de botón HTML             |
| `className` | `string`                                                                                 | `''`        | Clases CSS adicionales         |

### Ejemplos

```jsx
// Botones básicos
<Button variant="primary">Guardar</Button>
<Button variant="secondary">Cancelar</Button>
<Button variant="danger">Eliminar</Button>

// Diferentes tamaños
<Button size="small">Pequeño</Button>
<Button size="medium">Mediano</Button>
<Button size="large">Grande</Button>

// Con estados
<Button loading>Cargando...</Button>
<Button disabled>Deshabilitado</Button>
<Button fullWidth>Ancho completo</Button>

// Con acción
<Button onClick={() => alert('Click!')} variant="success">
  Hacer clic
</Button>
```

---

## Card

Contenedor con bordes redondeados y sombra para agrupar contenido.

### Props

| Prop        | Tipo                                       | Default     | Descripción              |
| ----------- | ------------------------------------------ | ----------- | ------------------------ |
| `children`  | `node`                                     | -           | Contenido de la card     |
| `variant`   | `'default' \| 'outlined' \| 'elevated'`    | `'default'` | Variante de estilo       |
| `padding`   | `'none' \| 'small' \| 'medium' \| 'large'` | `'medium'`  | Padding interno          |
| `hover`     | `boolean`                                  | `false`     | Efecto hover (elevación) |
| `onClick`   | `function`                                 | -           | Hace la card clickeable  |
| `className` | `string`                                   | `''`        | Clases CSS adicionales   |

### Ejemplos

```jsx
// Card básica
<Card>
  <h3>Título</h3>
  <p>Contenido de la card.</p>
</Card>

// Card con variantes
<Card variant="outlined" padding="large">
  Card con borde destacado y padding grande
</Card>

// Card clickeable con hover
<Card hover onClick={() => console.log('click')}>
  Haz clic aquí
</Card>
```

---

## Dropdown

Menú desplegable activado por un trigger.

### Props

| Prop        | Tipo                            | Default   | Descripción                     |
| ----------- | ------------------------------- | --------- | ------------------------------- |
| `trigger`   | `node`                          | -         | Elemento que activa el dropdown |
| `children`  | `node \| function`              | -         | Contenido o función render      |
| `align`     | `'left' \| 'right' \| 'center'` | `'right'` | Alineación del menú             |
| `className` | `string`                        | `''`      | Clases CSS adicionales          |

### Ejemplos

```jsx
// Dropdown básico
<Dropdown
  trigger={<Button>Menú ▼</Button>}
  align="right"
>
  <div className="py-1">
    <div className="px-4 py-2">Opción 1</div>
    <div className="px-4 py-2">Opción 2</div>
  </div>
</Dropdown>

// Con función render (acceso a close)
<Dropdown
  trigger={<Button>Acciones ▼</Button>}
>
  {(close) => (
    <div>
      <button onClick={() => { doSomething(); close(); }}>
        Acción 1
      </button>
      <button onClick={close}>Cerrar</button>
    </div>
  )}
</Dropdown>
```

---

## Input

Campo de entrada de texto con label, error y validación.

### Props

| Prop          | Tipo       | Default  | Descripción            |
| ------------- | ---------- | -------- | ---------------------- |
| `label`       | `string`   | -        | Etiqueta del input     |
| `type`        | `string`   | `'text'` | Tipo de input HTML     |
| `value`       | `string`   | -        | Valor controlado       |
| `onChange`    | `function` | -        | Callback al cambiar    |
| `placeholder` | `string`   | -        | Texto placeholder      |
| `error`       | `string`   | -        | Mensaje de error       |
| `disabled`    | `boolean`  | `false`  | Deshabilita el input   |
| `required`    | `boolean`  | `false`  | Campo requerido        |
| `fullWidth`   | `boolean`  | `false`  | Ocupa todo el ancho    |
| `className`   | `string`   | `''`     | Clases CSS adicionales |

### Ejemplos

```jsx
// Input básico
<Input
  label="Nombre"
  placeholder="Ingresa tu nombre"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// Con validación
<Input
  label="Email"
  type="email"
  required
  error={emailError}
  fullWidth
/>

// Deshabilitado
<Input
  label="Campo bloqueado"
  value="No editable"
  disabled
/>
```

---

## Select

Selector desplegable con estilo similar a Input.

### Props

| Prop          | Tipo               | Default           | Descripción            |
| ------------- | ------------------ | ----------------- | ---------------------- |
| `label`       | `string`           | -                 | Etiqueta del select    |
| `value`       | `string \| number` | -                 | Valor seleccionado     |
| `onChange`    | `function`         | -                 | Callback al cambiar    |
| `options`     | `array`            | `[]`              | Array de opciones      |
| `placeholder` | `string`           | `'Selecciona...'` | Placeholder            |
| `error`       | `string`           | -                 | Mensaje de error       |
| `disabled`    | `boolean`          | `false`           | Deshabilita el select  |
| `required`    | `boolean`          | `false`           | Campo requerido        |
| `fullWidth`   | `boolean`          | `false`           | Ocupa todo el ancho    |
| `className`   | `string`           | `''`              | Clases CSS adicionales |

### Opciones

Las opciones pueden ser:

- `string[]` - Array simple de strings
- `number[]` - Array simple de números
- `Array<{value, label, disabled?}>` - Objetos con más control

### Ejemplos

```jsx
// Con array simple
<Select
  label="Ciudad"
  options={['Madrid', 'Barcelona', 'Valencia']}
  value={city}
  onChange={(e) => setCity(e.target.value)}
/>

// Con objetos
<Select
  label="País"
  options={[
    { value: 'es', label: 'España' },
    { value: 'fr', label: 'Francia' },
    { value: 'uk', label: 'Reino Unido', disabled: true }
  ]}
  placeholder="Selecciona un país"
  fullWidth
/>
```

---

## Textarea

Área de texto multilínea con contador de caracteres opcional.

### Props

| Prop            | Tipo       | Default | Descripción             |
| --------------- | ---------- | ------- | ----------------------- |
| `label`         | `string`   | -       | Etiqueta del textarea   |
| `value`         | `string`   | -       | Valor controlado        |
| `onChange`      | `function` | -       | Callback al cambiar     |
| `placeholder`   | `string`   | -       | Texto placeholder       |
| `error`         | `string`   | -       | Mensaje de error        |
| `disabled`      | `boolean`  | `false` | Deshabilita el textarea |
| `required`      | `boolean`  | `false` | Campo requerido         |
| `fullWidth`     | `boolean`  | `false` | Ocupa todo el ancho     |
| `rows`          | `number`   | `4`     | Número de filas         |
| `maxLength`     | `number`   | -       | Límite de caracteres    |
| `showCharCount` | `boolean`  | `false` | Muestra contador        |
| `className`     | `string`   | `''`    | Clases CSS adicionales  |

### Ejemplos

```jsx
// Textarea básico
<Textarea
  label="Descripción"
  placeholder="Escribe aquí..."
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  rows={6}
/>

// Con contador de caracteres
<Textarea
  label="Comentarios"
  maxLength={200}
  showCharCount
  fullWidth
/>
```

---

## ThemeToggle

Botón para cambiar entre modo claro y oscuro.

### Props

No requiere props. Utiliza automáticamente el contexto `ThemeContext`.

### Ejemplo

```jsx
<ThemeToggle />
```

---

## 🎨 Personalización

### Clases Tailwind Personalizadas

Todos los componentes aceptan la prop `className` para añadir clases adicionales:

```jsx
<Button className="mt-4 shadow-lg">Botón personalizado</Button>
```

### Estilos Base en `tailwind.css`

Los componentes usan clases base definidas en `src/styles/tailwind.css`:

- `.form-input-base` - Base para inputs, selects y textareas
- `.btn-base` - Base para botones
- `.card-base` - Base para cards
- `.alert-base` - Base para alerts

Puedes modificar estas clases en `tailwind.css` para cambiar el estilo global.

### Colores del Sistema

Los colores están definidos en `tailwind.config.js` y sincronizados con `variables.css`:

```js
colors: {
  primary: '#FF1493',      // Rosa LOBBA
  success: '#10B981',      // Verde
  warning: '#F59E0B',      // Amarillo
  danger/error: '#EF4444', // Rojo
  info: '#3B82F6',         // Azul
}
```

---

## 🌙 Modo Oscuro

Todos los componentes soportan modo oscuro automáticamente usando:

```jsx
dark:bg-gray-800 dark:text-white
```

El cambio de tema se gestiona con:

```jsx
// En cualquier componente
import { useTheme } from '@/contexts/ThemeContext'

const { theme, toggleTheme, isDark } = useTheme()
```

---

## 📋 Componente de Demostración

Para ver todos los componentes en acción:

```jsx
import ComponentShowcase from '@/components/common/ComponentShowcase'

// En tu router o página
;<ComponentShowcase />
```

---

## 🔧 Mejores Prácticas

1. **Usar fullWidth para formularios**: Mejora la consistencia visual

   ```jsx
   <Input fullWidth />
   <Select fullWidth />
   <Textarea fullWidth />
   ```

2. **Validación consistente**: Usar la prop `error` para mensajes

   ```jsx
   <Input error={errors.email} />
   ```

3. **Accesibilidad**: Los componentes incluyen ARIA labels y roles

   ```jsx
   <Button disabled>Texto descriptivo</Button>
   ```

4. **Estados de carga**: Usar `loading` en botones durante operaciones async
   ```jsx
   <Button loading={isSubmitting} type="submit">
     Guardar
   </Button>
   ```

---

## 📝 Notas

- Todos los componentes son **controlados** (requieren `value` y `onChange`)
- Soporte completo para **temas claro/oscuro**
- **Accesibilidad** incluida (ARIA labels, keyboard navigation)
- **TypeScript**: Los PropTypes están definidos para validación en desarrollo
- Los archivos CSS antiguos (`.css`) pueden eliminarse una vez migres completamente a Tailwind

---

## 🚀 Migración desde CSS a Tailwind

Para migrar componentes existentes:

1. Reemplaza imports de CSS por clases Tailwind
2. Usa las clases base definidas (`btn-base`, `form-input-base`, etc.)
3. Añade clases de dark mode cuando sea necesario
4. Elimina archivos `.css` antiguos

Ejemplo:

```jsx
// Antes
import './Button.css'
<button className="btn btn-primary">Click</button>

// Después
<Button variant="primary">Click</Button>
```
