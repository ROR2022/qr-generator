import { contrastRatio } from '@/lib/contrast'
import type { QRConfig } from '@/lib/qr-config'
export default function ScannabilityBadge({ config }: { config: QRConfig }) {
  const lowContrast = !config.transparent && contrastRatio(config.color, config.background) < 3
  const riskyLogo = Boolean(config.logo) && (config.error !== 'H' || config.logoSize > 25)
  const highRisk = riskyLogo || config.margin < 4
  const state = highRisk ? { title: 'Riesgo alto', text: config.margin < 4 ? 'Aumenta el margen a 4 px o más para facilitar el escaneo.' : 'Usa corrección H o reduce el tamaño del logo.' , cls: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900', dot: 'bg-rose-500' } : lowContrast ? { title: 'Revisa el contraste', text: 'Elige colores con más contraste para mejorar la lectura.', cls: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900', dot: 'bg-amber-500' } : { title: 'Escaneable', text: 'El contraste y el margen se ven bien. Esto no garantiza la lectura en todos los dispositivos.', cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900', dot: 'bg-emerald-500' }
  return <div className={`mb-4 rounded-xl px-4 py-3 ring-1 ${state.cls}`}><div className="flex items-center gap-2 text-sm font-semibold"><span className={`h-2 w-2 rounded-full ${state.dot}`} />{state.title}</div><p className="mt-1 pl-4 text-xs opacity-80">{state.text}</p></div>
}
