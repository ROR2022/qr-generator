# Propuesta de implementación: compartir QR por WhatsApp

**Fecha**: 2026-11-19  
**Estado**: implementación de código completada; pendiente de validación manual en dispositivos
**Alcance**: compartir una imagen PNG del QR junto con texto que incluya el enlace cuando el QR represente una URL web.

## Resumen ejecutivo

Agregar una acción **Compartir** a la vista previa del QR. En navegadores compatibles, la acción preparará el PNG desde la instancia actual de `qr-code-styling` y abrirá el menú nativo del dispositivo mediante Web Share API, enviando el archivo y el texto en una sola intención de compartir. El usuario elegirá WhatsApp (u otro destino disponible), elegirá un chat y confirmará el envío.

Para un QR de tipo URL con destino HTTP(S) válido, el texto propuesto será:

> Escanea este QR o abre el enlace: https://ejemplo.com

Para otros tipos de QR, se compartirá la imagen con una indicación como:

> Escanea este código QR para ver el contenido.

La app no puede asegurar que WhatsApp reciba o muestre el archivo y el texto juntos en todos los dispositivos, navegadores o versiones. Si el navegador no admite compartir archivos, o el intento falla por una razón distinta a la cancelación del usuario, se mostrará una alternativa manual: descargar el PNG, copiar el enlace y abrir WhatsApp con el texto preparado. En ese flujo alternativo, el usuario adjunta la imagen manualmente.

**No se pretende hacer que la imagen sea clicable**: el enlace es texto en el mensaje y el QR sigue siendo escaneable.

## Contexto actual del proyecto

- [components/QRPreview.tsx](./components/QRPreview.tsx) contiene la vista previa y las acciones existentes de descarga PNG, SVG, JPG y PDF. Mantiene una instancia activa de `QRCodeStyling`.
- [lib/payload.ts](./lib/payload.ts) construye el payload real del QR. El tipo URL añade `https://` cuando el usuario escribe un dominio sin protocolo.
- [lib/pdf-export.ts](./lib/pdf-export.ts) valida actualmente un destino HTTP(S), de forma privada, antes de añadir la anotación clicable al PDF.
- [app/page.tsx](./app/page.tsx) monta la vista de escritorio, el modal de vista previa móvil y una miniatura QR en la barra inferior móvil. La miniatura no debe mostrar controles interactivos escalados.
- El proyecto usa componentes cliente de Next.js y ya permite obtener PNG de la instancia QR mediante `getRawData('png')`.
- No se declara actualmente un framework ni un script de pruebas automatizadas.

## Objetivos y fuera de alcance

### Objetivos

1. Compartir la misma imagen PNG que representa la configuración QR activa.
2. Incluir la URL HTTP(S) normalizada como texto cuando el contenido es de tipo URL.
3. Mantener el procesamiento local y proporcionar alternativas claras cuando Web Share no esté disponible.
4. Conservar todas las descargas existentes y el comportamiento del PDF.

### Fuera de alcance

- No hacer que la imagen se convierta en un enlace de toque dentro de WhatsApp.
- No enviar mensajes automáticamente, seleccionar contactos ni solicitar permisos para contactar destinatarios.
- No integrar WhatsApp Business Cloud API, backend, tokens, cuentas empresariales ni plantillas.
- No alojar imágenes remotamente ni añadir una API de carga.
- No garantizar que cada aplicación destino preserve todos los campos del objeto compartido.

## Requisitos

- **REQ-WA-001**: La vista previa debe ofrecer una acción para compartir la imagen PNG del QR actual usando la interfaz de compartir del navegador cuando esté disponible.
- **REQ-WA-002**: Para contenido `URL` con destino HTTP(S) válido, el texto compartido debe incluir exactamente el destino normalizado que codifica el QR.
- **REQ-WA-003**: Para los demás tipos de QR, el texto debe invitar a escanear el código y no añadir una URL web inventada.
- **REQ-WA-004**: Si Web Share API no existe, no acepta archivos o falla al iniciarse, la aplicación debe presentar un flujo manual comprensible para compartir el PNG y el texto.
- **REQ-WA-005**: Si el usuario cancela el menú nativo, la aplicación no debe reportar un error ni afirmar que el contenido fue enviado.
- **REQ-WA-006**: La acción debe estar deshabilitada mientras el QR no esté listo o no contenga un payload utilizable; debe prevenir activaciones concurrentes y comunicar fallos reales.
- **REQ-WA-007**: La función debe estar disponible en las vistas completas de escritorio y móvil sin agregar controles a la miniatura móvil; las descargas actuales deben conservarse.
- **REQ-WA-008**: La preparación del archivo y el texto debe ejecutarse localmente; no se debe cargar el QR a un servidor.

## Decisiones de diseño

| Tema | Decisión propuesta | Motivo / límite |
|---|---|---|
| Integración inicial | Web Share API (`navigator.share`) | Abre destinos del sistema; el usuario puede elegir WhatsApp sin una integración directa con la aplicación. |
| Archivo compartido | PNG generado por `qr.current.getRawData('png')` | Reutiliza el QR renderizado y conserva el estilo, gradiente, fondo, logo y opciones activas. |
| Texto URL | `Escanea este QR o abre el enlace: ${url}` | Deja el destino como texto aparte de la imagen; puede ser tocable si el cliente lo reconoce como URL. |
| Texto no URL | `Escanea este código QR para ver el contenido.` | El payload se interpreta al escanear; no se debe presentar como si hubiera un destino web. |
| Fuente de la URL | `buildPayload(config)` y una función común de validación HTTP(S) | Mantiene el texto compartido alineado con el payload y con el enlace del PDF. |
| Fallback | Descargar el QR existente, copiar la URL y ofrecer abrir WhatsApp con texto prellenado | El enlace `wa.me` puede rellenar texto, pero no adjuntar la imagen. El usuario adjuntará el PNG manualmente. |
| Confirmación | Mostrar “Se abrió el menú para compartir” solo cuando corresponda; nunca “Enviado” | El navegador no certifica que el destinatario haya recibido el mensaje. |
| Dependencias | No añadir nuevas | La API de compartir es del navegador y `qr-code-styling` ya produce el PNG. |
| Etiqueta principal | “Compartir” con ayuda “Elige WhatsApp para enviar el QR y el enlace” | No prometer que WhatsApp estará presente ni que siempre recibirá archivo y texto. |

### Validación del destino

Extraer a [lib/payload.ts](./lib/payload.ts) una función reutilizable, por ejemplo `getHttpUrl(config)`, que:

1. Devuelva un destino solo si `config.contentType === 'URL'`.
2. Obtenga el payload con `buildPayload(config)`.
3. Lo analice como URL absoluta.
4. Acepte solamente protocolos `http:` y `https:`.
5. Devuelva el valor normalizado (`URL.href`) o `undefined` para una entrada vacía, inválida o no HTTP(S).

La exportación de [lib/pdf-export.ts](./lib/pdf-export.ts) debe usar el mismo helper para evitar dos políticas distintas. No se debe cambiar la forma en que el payload del QR se codifica.

## Experiencia de usuario

### Flujo principal: URL válida

1. El usuario termina de editar el QR y espera a que la vista previa indique que está lista.
2. Pulsa **Compartir**.
3. La app obtiene el PNG, crea un `File` llamado `qr-studio.png` con tipo `image/png`, crea el texto y comprueba la capacidad de compartir archivos.
4. Si el navegador admite compartir, la app llama `navigator.share({ files: [file], title, text })` como consecuencia directa del clic.
5. El usuario elige WhatsApp en el selector del sistema, elige el chat y envía.
6. El mensaje debe incluir el PNG y el texto con el enlace. La presentación exacta (por ejemplo, si WhatsApp muestra además una vista previa) depende de la versión y se validará en dispositivos reales.

### Flujo principal: otros contenidos QR

Se comparte el mismo PNG y un texto general para escanear. No se añade el payload de WiFi, vCard, SMS, teléfono o texto como enlace. Si el usuario desea compartir el contenido detallado, puede seguir usando los canales propios de ese formato; esta propuesta no expone secretos o textos en un pie de foto automáticamente.

### Fallback manual

Si `navigator.share` o el soporte de archivos no está disponible, o la llamada falla por una causa distinta a cancelar, mostrar instrucciones y controles claros:

- **Descargar PNG**: reutilizar el botón de descarga existente.
- **Copiar enlace**: cuando hay URL HTTP(S) válida, copiar el destino exacto. Si no hay URL web, no mostrar esta acción.
- **Abrir WhatsApp con texto**: enlace a `https://wa.me/?text=${encodeURIComponent(text)}` en una navegación iniciada directamente por el usuario. WhatsApp abre su selector de chat con el texto prellenado; el usuario adjunta el archivo descargado.
- **Instrucción de envío**: “Adjunta el PNG descargado en WhatsApp y pega el texto copiado”.

Si Clipboard API no está disponible o rechaza el copiado, presentar el texto en un campo seleccionable con una instrucción para copiarlo manualmente. No marcar un copiado como exitoso si falló.

Mantener también una acción secundaria **“Opciones para compartir manualmente”** disponible en la vista completa. Esto permite acceder al fallback si el sistema devuelve `AbortError` porque no hay destinos disponibles, aunque no sea posible distinguir esa situación de una cancelación intencional.

### Cancelación y errores

- Rechazo con `AbortError`: no mostrar una alerta ni afirmar que hubo un fallo. Esta excepción también puede significar que no hay destinos de compartir disponibles, por lo que la app no puede diferenciar ese caso de una cancelación del usuario. Mantener siempre accesible una acción secundaria “Compartir manualmente”; no abrir WhatsApp automáticamente.
- Falta de soporte o archivo no compartible: mostrar el fallback antes de llamar a `share`.
- Otros errores de creación del PNG, validación o Web Share: registrar el error según el patrón del proyecto y mostrar un mensaje en español con el fallback disponible.
- Deshabilitar el botón durante la preparación para evitar llamadas simultáneas; restaurar estado en `finally`.
- No decir “compartido” o “enviado” como confirmación de entrega; el sistema puede indicar solamente que el menú se abrió o que el flujo se canceló.

## Integración técnica detallada

### 1. Compartición segura de la URL

En [lib/payload.ts](./lib/payload.ts):

- Agregar un helper compartido de URL HTTP(S) y usarlo tanto al compartir como desde la exportación PDF.
- No tomar la URL directamente de `config.values.url` para el texto, ya que el QR agrega `https://` automáticamente cuando falta protocolo.
- No permitir `javascript:`, `file:`, `data:`, esquemas de correo/teléfono ni otros protocolos como destino web.

### 2. Preparación y envío del archivo

Crear [lib/share.ts](./lib/share.ts) si mantiene la lógica de interoperabilidad fuera del JSX. Como mínimo, debe:

- Obtener `Blob` PNG con `getRawData('png')`.
- Comprobar que la respuesta sea un `Blob` antes de construir el archivo.
- Crear `File([blob], 'qr-studio.png', { type: 'image/png' })`.
- Crear el texto a partir del tipo de contenido y del URL validado.
- Detectar `navigator.share` y `navigator.canShare`; no asumir que el navegador acepta compartir archivos.
- Usar `navigator.canShare({ files: [file] })` para comprobar el soporte del archivo. Después llamar `navigator.share` con `files`, `title` y `text`.
- Mantener la llamada a `navigator.share` en el flujo del clic del usuario y no programarla con un `setTimeout` ni desde un efecto; la Web Share API requiere activación del usuario y contexto seguro.
- Dejar que `AbortError` llegue a la capa de UI para distinguir cancelación de error real, o retornar un resultado tipado que represente claramente `shared`, `cancelled` y `fallback`.

Si el archivo tarda lo suficiente para que navegadores móviles rechacen la acción por perder la activación del usuario, evaluar una alternativa acotada: preparar el PNG anticipadamente solo en la vista previa completa y actualizarlo cada vez que cambia la configuración. No mantener archivos duplicados para la miniatura móvil.

### 3. Interfaz de vista previa

En [components/QRPreview.tsx](./components/QRPreview.tsx):

- Agregar un botón con icono de compartir (por ejemplo, `Share2` de Lucide), etiqueta accesible y texto visible.
- Mantener los cuatro formatos actuales en su fila y ubicar la acción **Compartir** en una fila separada o en un botón de ancho suficiente; no comprimir el texto en una fila de cinco botones pequeños.
- Añadir estados separados para preparación de compartir y error/fallback, sin reutilizar de forma ambigua el estado `pdfBusy`.
- Mantener una acción secundaria “Opciones para compartir manualmente” disponible sin depender de un error previo.
- Deshabilitar la acción si la vista previa no está lista, el payload está vacío o se está generando otro recurso compartible.
- Mostrar el fallback en un bloque accesible (`role="status"` para instrucciones informativas y `role="alert"` para errores reales).
- Mantener soporte de tema claro/oscuro y diseño responsive, con foco visible y teclado.

En [app/page.tsx](./app/page.tsx):

- Añadir un prop opcional a `QRPreview` (por ejemplo, `showActions`, con valor predeterminado `true`) o extraer la fila de acciones.
- Pasar `showActions={false}` a la instancia de `QRPreview` que se dibuja a escala reducida en la barra inferior móvil. Los controles deben estar solo en la vista completa de escritorio o en el modal móvil.
- No alterar el ciclo de actualización de configuración ni la vista previa reducida.

### 4. Fallback de WhatsApp

- Construir el texto con `encodeURIComponent`; no interpolar texto sin codificación en la URL de `wa.me`.
- Abrir el enlace únicamente después de que el usuario pulse **Abrir WhatsApp con el texto**, no automáticamente al fallar Web Share (evita bloqueos de popups y hace clara la acción).
- El fallback no debe dar la impresión de que adjuntó el PNG.
- En URL válida, el mensaje prellenado debe incluir la URL normalizada. En otros tipos, solo incluir la instrucción de escaneo.
- Usar la descarga PNG ya presente para obtener la imagen. No crear un flujo de carga ni intentar enviar el QR a WhatsApp mediante un backend.

## Privacidad, seguridad y accesibilidad

- La imagen se genera localmente. Al elegir una aplicación del menú nativo, el usuario decide entregar el archivo y el texto a ese destino.
- El destino en el mensaje debe venir del payload que codifica el QR, con protocolo HTTP(S) validado.
- La URL de WhatsApp usa codificación de query string y es un enlace de navegación visible y accionado por el usuario.
- No comunicar éxito de envío como si estuviera confirmado por el navegador.
- El botón y los enlaces deben tener nombres accesibles; los estados deben ser anunciados por lector de pantalla.
- Evitar que el control aparezca en la miniatura inferior con escala `0.12`.
- No copiar automáticamente al portapapeles sin acción clara del usuario.

## Pasos de implementación

### Paso 1: Fuente común del destino web

- **Requisitos**: REQ-WA-002, REQ-WA-003, REQ-WA-008
- **Entradas de diseño**: `buildPayload(config)` y validación existente privada en `lib/pdf-export.ts`.
- **Descripción**:
  - Extraer a `lib/payload.ts` una función común que devuelva solo URL absoluta HTTP(S) válida de un QR tipo URL.
  - Actualizar `lib/pdf-export.ts` para usar la función compartida y conservar su conducta.
  - Determinar el texto compartible según tipo de contenido sin exponer payload sensible no URL.

### Paso 2: Servicio de compartición local

- **Requisitos**: REQ-WA-001, REQ-WA-002, REQ-WA-003, REQ-WA-004, REQ-WA-005, REQ-WA-008
- **Entradas de diseño**: `QRCodeStyling.getRawData('png')`, Web Share API, enlace `wa.me`.
- **Descripción**:
  - Añadir funciones en `lib/share.ts` para crear el PNG `File`, el texto del mensaje, detectar soporte y solicitar compartir.
  - Manejar salida tipada para éxito del menú, cancelación, falta de soporte y error recuperable.
  - Crear el URL de fallback `wa.me` con texto codificado; no adjuntar ni prometer adjuntar la imagen.
  - No añadir dependencias ni cambiar el payload QR.

### Paso 3: Acción y fallback en la interfaz

- **Requisitos**: REQ-WA-001, REQ-WA-004, REQ-WA-005, REQ-WA-006, REQ-WA-007
- **Entradas de diseño**: grupo de descargas y estado `ready` en `QRPreview`.
- **Descripción**:
  - Añadir acción “Compartir” y estados de preparación/fallback.
  - Ubicarla separada de la fila de cuatro descargas existentes.
  - Presentar controles manuales para PNG, copiar texto/enlace y abrir WhatsApp.
  - Excluir los controles de la miniatura móvil mediante prop o separación de acciones.
  - Mantener mensajes accesibles, idioma español y tema claro/oscuro.

### Paso 4: Regresión y verificación de plataforma

- **Requisitos**: REQ-WA-001, REQ-WA-002, REQ-WA-003, REQ-WA-004, REQ-WA-005, REQ-WA-006, REQ-WA-007, REQ-WA-008
- **Entradas de diseño**: criterios de aceptación y matriz de validación de esta propuesta.
- **Descripción**:
  - Ejecutar `pnpm exec tsc --noEmit` y `pnpm build`.
  - Verificar validación de URL y texto para todos los tipos de contenido.
  - Probar con APIs simuladas: compatibilidad, cancelación, fallo de Web Share y fallo del portapapeles.
  - Probar de forma manual en móvil real que WhatsApp recibe la imagen y el texto desde el menú nativo; probar fallback desktop.
  - Confirmar que PNG/SVG/JPG/PDF siguen disponibles y que el PDF mantiene su enlace clicable.

## Desglose de tareas

### Fase 1: Fundamentos

- [x] T001 [Plan:1.1] Extraer en `lib/payload.ts` una función compartida para obtener una URL HTTP(S) válida del payload y actualizar `lib/pdf-export.ts` para reutilizarla sin cambiar el comportamiento PDF.

### Fase 2: Compartición

- [x] T002 [Plan:2.1] Definir en `lib/share.ts` los textos de compartir para contenido URL válido, otros tipos y payload vacío, sin incluir payload no URL en mensajes.
- [x] T003 [Plan:2.1] Crear `lib/share.ts` para obtener un PNG Blob de `QRCodeStyling`, validar su tipo, construir `qr-studio.png` y preparar el texto según `QRConfig`.
- [x] T004 [Plan:2.1] Implementar detección de `navigator.share`/`navigator.canShare`, compartir `File` + texto, y distinguir resultados de completado, cancelación y fallback.
- [x] T005 [Plan:2.1] Construir una URL de WhatsApp `https://wa.me/?text=...` con el texto codificado y documentar que no adjunta la imagen.

### Fase 3: Integración de interfaz

- [x] T006 [Plan:3.1] Añadir en `components/QRPreview.tsx` el botón accesible “Compartir”, estado de preparación, bloqueo de doble activación y manejo explícito de errores.
- [x] T007 [Plan:3.2] Añadir opciones manuales siempre accesibles con descarga PNG, copiar enlace solo para URLs válidas y enlace explícito para abrir WhatsApp con texto prellenado.
- [x] T008 [Plan:3.3] Añadir prop de visibilidad de acciones en `components/QRPreview.tsx` y desactivar acciones en la miniatura de `app/page.tsx`.
- [x] T009 [Plan:3.3] Ajustar layout de acciones para que los cuatro botones de descarga permanezcan legibles y “Compartir” sea visible en escritorio, modal móvil, modo oscuro y teclado.

### Fase 4: Validación

- [x] T010 [Plan:4.1] Ejecutar `pnpm exec tsc --noEmit` y `pnpm build`; corregir solo regresiones asociadas a esta función.
- [x] T011 [Plan:4.1] Probar URL válida con protocolo y sin protocolo, URL inválida/vacía, y todos los tipos no URL; verificar el texto y destino generados.
- [ ] T012 [Plan:4.1] Simular soporte de archivo, API ausente, cancelación `AbortError`, rechazo de compartir y fallo de portapapeles; comprobar mensajes y fallback.
- [ ] T013 [Plan:4.1] Probar manualmente compartir a WhatsApp en Android y iOS y validar el flujo manual en desktop; comprobar regresión de PNG, SVG, JPG y PDF.

## Estructura propuesta

```text
lib/
  payload.ts              # Fuente común de payload y helper getHttpUrl(config)
  pdf-export.ts           # Reutiliza helper HTTP(S) existente
  share.ts                # Preparación de archivo/texto, Web Share API y URL wa.me
components/
  QRPreview.tsx            # Acción de compartir, estados y fallback accesible
app/
  page.tsx                 # Oculta acciones en la miniatura móvil
```

No añadir `lib/share.ts` si la lógica final cabe claramente en `QRPreview`, pero mantener la validación compartida del URL en `lib/payload.ts` para que PDF y compartir no diverjan.

## Estrategia de pruebas y criterios de aceptación

**Tipo de aplicación**: interfaz web cliente con menú nativo de compartición.  
**Dependencias de entorno**: producción o localhost seguro para Web Share API; Android e iOS con WhatsApp instalado para integración real; navegador desktop para fallback.  
**Automatización existente**: no hay runner de tests declarado; no se propone instalar uno solo para esta función.

### Criterios de aceptación

1. En configuración URL, el archivo compartido es un PNG del QR visible y el texto contiene el destino HTTP(S) normalizado idéntico al payload del QR.
2. Para contenido URL sin esquema, el texto y QR usan el `https://` añadido por `buildPayload`, sin divergencia.
3. Para texto, WiFi, vCard, email, SMS y teléfono, no se presenta el payload como enlace web; se comparte la imagen con instrucción de escaneo.
4. El menú nativo se invoca solo tras una interacción del usuario, con archivo MIME `image/png`; no se agrega backend ni carga externa.
5. Si el soporte de compartir archivos falta o falla, el usuario recibe una explicación y las acciones disponibles para descargar, copiar y abrir WhatsApp manualmente.
6. Cancelar el menú no muestra error ni falso mensaje de éxito.
7. El botón permanece bloqueado mientras el QR no esté listo o haya una acción de compartir activa, y errores reales son visibles.
8. La acción existe en la vista de escritorio y el modal móvil, y no aparece en la miniatura inferior móvil.
9. PNG, SVG, JPG y PDF mantienen sus descargas; el PDF conserva su anotación URL.
10. En WhatsApp, el destinatario puede tocar la URL textual o escanear el QR; no se describe la imagen como clicable.

### Matriz manual de plataforma

| Entorno | Caso principal | Resultado que se debe confirmar |
|---|---|---|
| Android + Chrome + WhatsApp | Compartir URL válida | Selector del sistema ofrece WhatsApp y WhatsApp recibe PNG y texto en la misma composición. |
| iOS + Safari + WhatsApp | Compartir URL válida | Selector del sistema ofrece WhatsApp y el destino recibe archivo y texto; registrar cualquier limitación del cliente. |
| Desktop con Web Share | Compartir si se soporta | El sistema permite elegir destino; no asumir que WhatsApp Web esté listado. |
| Desktop sin soporte de archivos | Fallback | Se descarga PNG, se puede copiar el enlace y abrir `wa.me` con texto prellenado. |
| Cualquier plataforma | Cancelar menú | No se muestra un error ni se inicia un fallback intrusivo. |

### Validación automatizada/técnica

- Type-check: `pnpm exec tsc --noEmit`.
- Build: `pnpm build`.
- Verificar en ejecución que `getHttpUrl` y el creador de texto dan el mismo URL que `buildPayload`.
- Simular `navigator.canShare`/`navigator.share` cuando se ejercite la interfaz; no afirmar cobertura de integración real con WhatsApp a partir de una simulación.
- Inspeccionar que el PDF sigue incluyendo su anotación HTTP(S) y que payloads no URL no la generan.

### Resultado de implementación

- Implementados los pasos 1–3 y verificados el type-check (`pnpm exec tsc --noEmit`) y el build (`pnpm build`).
- Probados los destinos URL con/sin protocolo, URL inválida/vacía, los seis tipos no URL, la codificación de WhatsApp, y los caminos de Web Share compatible, no compatible, API ausente y cancelación `AbortError`.
- Pendiente la validación visual de la interfaz y la prueba real en Android/iOS con WhatsApp; las simulaciones no confirman el comportamiento de aplicaciones destino.

### Fuentes técnicas

- [MDN: `Navigator.share()` — datos admitidos, HTTPS, activación de usuario, destinos dependientes de la plataforma y errores](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [MDN: `Navigator.canShare()` — detección de soporte para archivos](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare)
- [Ayuda oficial de WhatsApp: Clic para chatear — texto prellenado con `wa.me`](https://faq.whatsapp.com/5913398998672934/)
- [Meta: Image messages — imagen con caption opcional](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/image-messages)
- [Meta: Interactive CTA URL messages — botón URL separado, con encabezado de imagen, en Business API](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/interactive-cta-url-messages)

## Requirement Mapping

| REQ ID | Descripción | Plan Items | Implementation Evidence |
|---|---|---|---|
| REQ-WA-001 | Compartir PNG del QR con el menú nativo | 2.1, 3.1 | `lib/share.ts`, `components/QRPreview.tsx` |
| REQ-WA-002 | Incluir URL HTTP(S) normalizada del payload en el texto | 1.1, 2.1 | `lib/payload.ts`, `lib/share.ts` |
| REQ-WA-003 | No añadir URL web para tipos no URL | 1.1, 2.1 | `lib/payload.ts`, `lib/share.ts` |
| REQ-WA-004 | Fallback manual cuando compartir archivo no está disponible | 2.1, 2.2, 3.2 | `lib/share.ts`, `components/QRPreview.tsx` |
| REQ-WA-005 | Manejar cancelación sin falso error/éxito | 2.1, 3.1 | `lib/share.ts`, `components/QRPreview.tsx` |
| REQ-WA-006 | Limitar acción a QR listo y evitar dobles envíos | 3.1 | `components/QRPreview.tsx` |
| REQ-WA-007 | Mostrar acción en vistas completas y conservar descargas | 3.1, 3.3, 4.1 | `components/QRPreview.tsx`, `app/page.tsx` |
| REQ-WA-008 | Preparar datos localmente sin carga a backend | 2.1, 4.1 | `lib/share.ts`, validación de red en navegador |
