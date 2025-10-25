# Documento Maestro de LOBBA - Guía de Uso

Este directorio contiene toda la información estructurada sobre LOBBA que Olivia (el chatbot) utiliza para responder preguntas de las usuarias.

## Estructura de Carpetas

```
master_docs/
├── marca/              # Información sobre la marca LOBBA
├── ecommerce/          # Catálogo de productos y políticas
├── servicios_ia/       # Servicios de IA (uñas, peinados, maquillaje)
├── equipos/            # Equipos físicos (kioscos, powerbanks, etc.)
├── membresias/         # Información de membresías Essential y Spirit
├── marketplace/        # Sistema de reservas en salones
└── faqs/               # Preguntas frecuentes
```

## Cómo Funciona

1. **Compilación Automática**: El servicio `masterDocsService.js` lee todos los archivos `.md` de estas carpetas y los compila en un documento único.

2. **Integración con Olivia**: Este documento compilado se incluye en el system prompt de Olivia, permitiéndole acceder a toda la información de LOBBA.

3. **Búsqueda Inteligente**: Olivia puede buscar información específica en el documento maestro según las preguntas de las usuarias.

## Cómo Completar la Información

Actualmente, muchos archivos contienen placeholders `[COMPLETAR: ...]`. Para completar la información:

1. **Abre el archivo markdown** correspondiente a la categoría que quieres completar
2. **Reemplaza los placeholders** con la información real
3. **Mantén el formato markdown** para facilitar la lectura
4. **Sé específico y preciso** - Olivia usará esta información literalmente

### Ejemplo de Placeholder

```markdown
## Precio
[COMPLETAR: Precio mensual de membresía Essential]
```

### Ejemplo Completado

```markdown
## Precio
€19.99/mes (facturación mensual)
€199.99/año (facturación anual - ahorra 2 meses)
```

## Reglas Importantes

### ✅ SÍ Incluir:
- Información precisa y verificada
- Precios actualizados
- Políticas oficiales de LOBBA
- Especificaciones técnicas reales
- Ubicaciones de salones/equipos

### ❌ NO Incluir:
- Información inventada o no verificada
- Datos sensibles (claves API, credenciales)
- Información de la competencia
- Opiniones personales
- Datos médicos sin respaldo profesional

## Categorías Detalladas

### 1. Marca (`marca/`)
- Visión, misión y valores
- Historia de LOBBA
- Eventos y novedades

### 2. E-commerce (`ecommerce/`)
- Catálogo completo de productos
- Precios y descuentos por membresía
- Políticas de envío y devoluciones

### 3. Servicios IA (`servicios_ia/`)
- Diseños de uñas con IA
- Prueba virtual de peinados
- Maquillaje con realidad aumentada
- Límites y créditos AR unificados

### 4. Equipos (`equipos/`)
- Kioscos de higiene
- Powerbanks (depósito €10)
- Impresoras de uñas
- Espejos inteligentes AR
- Silla EMS

### 5. Membresías (`membresias/`)
- Essential: beneficios y precio
- Spirit: beneficios y precio
- Comparativa entre ambas
- Sistema de membresía compartida

### 6. Marketplace (`marketplace/`)
- Cómo funciona el sistema de reservas
- Rol de Olivia como asistente (NO decide por la usuaria)
- Proceso de búsqueda y reserva
- Políticas de cancelación

### 7. FAQs (`faqs/`)
- Preguntas más frecuentes
- Respuestas claras y concisas
- Enlaces a información detallada

## Mantenimiento

### Actualizar Información
1. Edita el archivo `.md` correspondiente
2. Guarda los cambios
3. El sistema compilará automáticamente el nuevo documento
4. Olivia tendrá acceso inmediato a la información actualizada

### Agregar Nueva Información
1. Crea un nuevo archivo `.md` en la carpeta apropiada
2. Usa numeración secuencial (ej: `03_nuevo_tema.md`)
3. Sigue el formato markdown estándar
4. El sistema lo incluirá automáticamente

### Eliminar Información Obsoleta
1. Elimina el archivo `.md` obsoleto
2. O mueve a una carpeta `_archive/` si quieres mantener historial

## Integración Técnica

### Servicio de Compilación
```javascript
import { compileMasterDocument } from './services/masterDocsService.js'

const masterDoc = await compileMasterDocument()
// Retorna todo el contenido compilado en un string
```

### Búsqueda en Documento
```javascript
import { searchMasterDocument } from './services/masterDocsService.js'

const results = await searchMasterDocument('powerbank')
// Retorna secciones relevantes que contienen "powerbank"
```

### Obtener Categoría Específica
```javascript
import { getCategoryInfo } from './services/masterDocsService.js'

const equiposInfo = await getCategoryInfo('equipos')
// Retorna solo la información de equipos
```

## Mejores Prácticas

1. **Actualiza regularmente**: Mantén la información al día
2. **Sé específico**: Evita ambigüedades
3. **Usa ejemplos**: Ayuda a Olivia a dar mejores respuestas
4. **Mantén consistencia**: Usa los mismos términos en todos los documentos
5. **Revisa periódicamente**: Asegúrate de que la información sigue siendo correcta

## Soporte

Si tienes dudas sobre cómo completar alguna sección o necesitas agregar nueva información, consulta con el equipo técnico de LOBBA.
