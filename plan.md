# Plan de implementación: descarga del QR en PDF con enlace clicable

**Fecha**: 2026-11-18  
**Especificación**: solicitud del usuario en esta conversación  
**Estado**: implementado; type-check y build correctos

## Resumen

Agregar PDF a los formatos de descarga actuales. El documento incluirá el QR generado con la configuración activa. Cuando el tipo de contenido sea URL y el destino normalizado sea una URL HTTP(S) válida, el área del QR dentro del PDF tendrá un enlace clicable al mismo destino. Para los demás tipos de contenido, el PDF se podrá descargar, pero el QR no tendrá un enlace web asociado.

La generación seguirá ocurriendo en el navegador, sin backend. El PDF tendrá una sola página compacta, adaptada a las dimensiones del QR y con un margen blanco pequeño, en lugar de una hoja A4.

## Requisitos

- **REQ-001**: Permitir descargar el QR como archivo PDF, además de PNG, SVG y JPG.
- **REQ-002**: En PDF, hacer clic sobre el área visible del QR debe abrir el destino cuando el contenido sea una URL HTTP(S) válida.
- **REQ-003**: El enlace clicable debe coincidir con el destino codificado por el QR; otros tipos de contenido no deben recibir un enlace web artificial.
- **REQ-004**: Conservar la generación local, las opciones de personalización vigentes y el comportamiento de descarga de los formatos existentes.

## Contexto técnico

- **Lenguaje y plataforma**: TypeScript, React 19 y Next.js App Router; la interfaz principal y la vista previa son componentes cliente.
- **Generación QR**: `qr-code-styling`; el componente [components/QRPreview.tsx](./components/QRPreview.tsx) ya mantiene la instancia utilizada para la vista previa y las descargas actuales.
- **Configuración**: [lib/qr-config.ts](./lib/qr-config.ts); el contenido codificado se deriva en [lib/payload.ts](./lib/payload.ts).
- **Interfaz**: los botones de exportación están en `QRPreview`, junto a las descargas actuales.
- **Persistencia y servidor**: no se requieren; generación y descarga locales.
- **Dependencias**: `jsPDF` para crear el PDF y su anotación de enlace; el paquete se carga de forma dinámica al solicitar la descarga.
- **Representación**: se reutiliza el PNG exportado por la misma instancia de `qr-code-styling` que alimenta la vista previa, preservando la personalización sin reconstruir el QR.
- **Tamaño de página**: QR dimensionado a 96 dpi (72/96 puntos por píxel de configuración) más 8 puntos de margen alrededor; por ejemplo, 280 px genera una página de 226 × 226 puntos.
- **Build y validación**: `pnpm exec tsc --noEmit`, `pnpm build` y verificación del PDF y de sus anotaciones con una prueba de ejecución local. El repositorio no declara un runner automatizado.

## Decisiones y supuestos de alcance

1. **Tamaño y composición**: crear una página compacta, ajustada al tamaño del QR con un margen blanco reducido. No usar una página A4 ni estirar el QR para llenar un tamaño fijo.
2. **Criterio para enlace**: usar el payload que produce `buildPayload(config)` y validar que sea parseable y que su protocolo sea `http:` o `https:` antes de añadir la anotación. No usar texto arbitrario ni protocolos como `javascript:`, `file:` u otros.
3. **Tipos no URL**: WiFi, texto, vCard, email, SMS y teléfono se exportan como QR en PDF, pero sin enlace PDF clicable. El payload escaneable de esos códigos no se modifica.
4. **Calidad**: exportar el PNG desde la instancia actual para conservar logo, colores, degradado y fondo; el PDF ajusta el tamaño físico al tamaño de salida del QR y mantiene proporciones.
5. **Errores**: si la creación del PDF falla, informar el error en la interfaz y no simular una descarga exitosa.

## Verificación de principios

- **Procesamiento local y privacidad**: cumple; no se agrega envío de contenido ni configuración a un servidor.
- **Compatibilidad funcional**: cumple si PNG, SVG y JPG conservan sus acciones y resultados.
- **Seguridad del enlace**: cumple con validación explícita de URL HTTP(S) y enlace únicamente al payload ya normalizado.
- **Accesibilidad y experiencia**: el nuevo botón debe tener nombre accesible, estado deshabilitado mientras no esté listo y una indicación clara del formato.
- **Sin alcance adicional**: no se propone cambiar el contenido QR, añadir almacenamiento ni introducir API.

## Guías aplicadas

No se detectó una guía de migración aplicable. Se reutilizan las responsabilidades existentes: renderizado y exportación en `QRPreview`, configuración en `QRConfig` y contenido codificado en `buildPayload`.

## Pasos de implementación

### Paso 1: Validación de contenido y salida del QR

- **Requisitos**: REQ-002, REQ-003, REQ-004
- **Entradas de diseño**: `QRConfig`, `buildPayload(config)`, instancia de `QRCodeStyling`.
- **Descripción**:
  - Definir el cálculo de las dimensiones de página a partir del QR y un margen blanco pequeño, manteniendo la proporción del código.
  - Reutilizar `getRawData('png')` de la instancia actual para conservar las opciones visuales del QR y evitar duplicar su configuración.
  - Definir la función que resuelve el destino clicable desde el payload y devuelve un destino solo cuando este es una URL absoluta HTTP(S) válida.
  - Evitar mantener una segunda implementación de la normalización del payload.

### Paso 2: Generación del documento PDF

- **Requisitos**: REQ-001, REQ-002, REQ-003, REQ-004
- **Entradas de diseño**: opciones actuales de `QRPreview`, salida de `qr-code-styling` y configuración activa.
- **Descripción**:
  - Añadir `jsPDF` y cargarlo dinámicamente al iniciar la descarga.
  - Crear un PDF de una página cuyas dimensiones sean el tamaño configurado del QR convertido de píxeles a puntos a 96 dpi, más 8 puntos de margen en cada lado.
  - Añadir un área de enlace sobre los límites visibles del QR solo si el destino cumple la validación del paso 1.
  - Conservar en el QR del PDF las opciones activas de estilo, color, degradado, fondo/transparencia y logo.
  - Usar un nombre de descarga coherente, inicialmente `qr-studio.pdf`.

### Paso 3: Integración de la descarga en la interfaz

- **Requisitos**: REQ-001, REQ-004
- **Entradas de diseño**: patrón de botones de descarga en `QRPreview`.
- **Descripción**:
  - Añadir una opción PDF al grupo existente de formatos.
  - Reutilizar el estado de disponibilidad de la vista previa; evitar descargar un PDF con QR todavía no generado.
  - Informar fallos de exportación con el patrón de errores de interfaz disponible, sin afectar las otras descargas.
  - Mantener la distribución responsive del grupo de formatos en escritorio y móvil.

### Paso 4: Validación de comportamiento y regresión

- **Requisitos**: REQ-001, REQ-002, REQ-003, REQ-004
- **Entradas de diseño**: matriz de aceptación descrita a continuación.
- **Descripción**:
  - Ejecutar el build de producción y corregir errores introducidos por la dependencia o la integración.
  - Probar manualmente la descarga y apertura en un lector de PDF; verificar que el clic sobre el QR abre exactamente el destino URL.
  - Cubrir URL válida, URL vacía o inválida, y contenido no URL; comprobar que únicamente la primera clase habilita el enlace clicable.
  - Comprobar QR con logo, degradado y fondo transparente, y asegurar que las descargas PNG/SVG/JPG continúan funcionando.

## Desglose de tareas

### Fase 1: Fundamentos

- [x] T001 [Plan:1.1] Definir e implementar el cálculo de dimensiones de página PDF ajustadas al QR, manteniendo su proporción y un margen blanco pequeño.
- [x] T002 [P] [Plan:1.2] Reutilizar la salida PNG de la instancia actual de `qr-code-styling` para preservar la configuración visual sin duplicar opciones del QR.
- [x] T003 [Plan:1.3] Implementar una función de validación del destino HTTP(S) derivado de `buildPayload(config)` sin duplicar la normalización en `lib/payload.ts`.

### Fase 2: Exportación PDF

- [x] T004 [Plan:2.1] Añadir `jspdf` a `package.json` y actualizar `pnpm-lock.yaml`.
- [x] T005 [Plan:2.2,2.3] Generar desde `lib/pdf-export.ts` un PDF de una página con el PNG del QR actual, tamaño compacto y proporciones conservadas.
- [x] T006 [Plan:2.3] Añadir una anotación de enlace sobre el área del QR únicamente cuando el destino validado sea HTTP(S), y omitirla para contenido no URL.
- [x] T007 [Plan:2.4] Añadir el botón PDF al grupo de descargas en `components/QRPreview.tsx`, actualizar la metadata de exportación y documentar el nuevo formato.

### Fase 3: Validación

- [x] T008 [Plan:3.1] Ejecutar `pnpm exec tsc --noEmit` y `pnpm build`.
- [x] T009 [Plan:3.2] Verificar la estructura PDF, el enlace para una URL HTTP(S) válida y la ausencia de enlace para contenido no URL o una URL inválida.
- [x] T010 [Plan:3.2] Verificar en navegador los controles de exportación y comprobar que las opciones PNG, SVG y JPG permanecen disponibles.

## Estructura afectada

```text
components/
  QRPreview.tsx              # Acción PDF y estados de exportación
app/
  layout.tsx                 # Metadata actualizada para incluir PDF
README.md                    # Formatos de descarga y enlace PDF documentados
lib/
  payload.ts                 # Fuente de verdad del payload; cambios solo si hace falta exportar helper compartido
  pdf-export.ts              # Generación compacta y segura del PDF
package.json                 # Dependencia jsPDF
pnpm-lock.yaml               # Lockfile actualizado por pnpm
```

No crear `lib/pdf-export.ts` si la implementación resulta clara y pequeña dentro del componente; evitar abstracción sin necesidad. No se anticipan cambios a `QRConfig`.

## Estrategia de pruebas y criterios de aceptación

**Tipo de aplicación**: interfaz web cliente (Next.js App Router).

**Validación principal**: `pnpm exec tsc --noEmit`, `pnpm build`, y ejecución de `downloadQrPdf` con una imagen PNG de prueba; se inspeccionaron la firma, el tamaño de página y las anotaciones del PDF generado.

**Casos de aceptación**:

1. El botón PDF descarga un documento de una página compacta, ajustada al QR visible con un margen blanco pequeño y sin deformarlo.
2. Para contenido URL HTTP(S), hacer clic en el QR del PDF abre exactamente la URL codificada por `buildPayload`.
3. Para WiFi, texto, vCard, email, SMS, teléfono, URL vacía o URL no válida, el PDF no incorpora un destino web clicable no solicitado; el documento se descarga cuando la generación del QR es posible.
4. El QR mantiene proporción, contraste y capacidad de lectura; logo, degradado y transparencia se conservan según lo que soporte el formato elegido.
5. Las opciones PNG, SVG y JPG mantienen su comportamiento.
6. La exportación no empieza antes de que el QR esté listo y los errores se muestran explícitamente.

**Nota de validación**: el navegador de prueba permitió comprobar el estado de la interfaz y accionar la descarga, pero no expuso el archivo/evento de descarga para inspeccionarlo directamente. La generación, las dimensiones y la anotación se verificaron sobre el PDF producido por el helper en una prueba local.

**Sin infraestructura adicional**: no requiere Docker, base de datos, servicios externos ni datos de prueba persistentes.

## Seguimiento de requisitos

| REQ ID | Descripción | Pasos | Evidencia de implementación |
|---|---|---|---|
| REQ-001 | Descargar el QR en PDF además de los formatos existentes | 2.1, 2.2, 2.3 | Opción PDF y documento descargable en `components/QRPreview.tsx` |
| REQ-002 | Hacer clic sobre el QR del PDF para visitar una URL HTTP(S) válida | 1.2, 1.3, 2.2, 2.3 | Validación de destino y anotación PDF sobre el QR |
| REQ-003 | Enlazar solo el payload URL; no asignar destinos web a otros tipos | 1.3, 2.3 | Destino derivado de `buildPayload(config)` con validación de protocolo |
| REQ-004 | Mantener generación local, personalización y descargas existentes | 1.2, 2.2, 2.4, 3.1, 3.2 | Exportación cliente y validación de regresión |

## Decisiones acordadas

- La página del PDF debe ser **compacta y ajustada al tamaño del QR**, no A4.
- El enlace clicable aplica al QR con contenido URL HTTP(S) válido; los otros tipos de QR no llevan un enlace web adicional.
