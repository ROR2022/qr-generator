# QR Studio

Generador de códigos QR personalizables con Next.js App Router, TypeScript, Tailwind CSS y [qr-code-styling](https://github.com/kozakdenys/qr-code-styling). El QR se genera localmente en el navegador; no requiere cuenta, API keys ni backend.

Descarga el QR en PNG, SVG, JPG o PDF y define el nombre base del archivo; la extensión se agrega según el formato. En los PDF, el QR de tipo URL también funciona como enlace clicable al destino. Comparte el PNG con el menú del dispositivo y un texto que incluya el enlace cuando el QR sea una URL; si no está disponible, puedes descargarlo, adjuntarlo manualmente en WhatsApp y abrir la conversación con el texto preparado. La interfaz está disponible en español e inglés, y guarda la preferencia del usuario en el navegador.

## Desarrollo

Instala dependencias con `pnpm install` (o `npm install`) y ejecuta `pnpm dev` (o `npm run dev`). Abre `http://localhost:3000`.

## Personalización

Los estilos de puntos, esquinas, colores, degradado y opciones de exportación se configuran en `components/ControlPanel.tsx` y `components/QRPreview.tsx`. Para añadir un estilo compatible, agrega su identificador a las opciones y pásalo a `dotsOptions.type`, `cornersSquareOptions.type` o `cornersDotOptions.type` de qr-code-styling. Añade tipos de contenido en `lib/qr-config.ts`, el selector de `ContentForm` y el constructor `buildPayload` en `lib/payload.ts`.
