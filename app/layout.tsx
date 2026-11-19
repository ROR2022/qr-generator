import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QR Studio — Generador de códigos QR personalizados',
  description: 'Crea y personaliza códigos QR gratis. Exporta en PNG, SVG, JPG o PDF, sin registro y sin enviar tus datos a ningún servidor.',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}
export const viewport: Viewport = { colorScheme: 'light dark', themeColor: [{ media: '(prefers-color-scheme: light)', color: '#fafafa' }, { media: '(prefers-color-scheme: dark)', color: '#09090b' }] }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body className="antialiased">{children}</body></html> }
