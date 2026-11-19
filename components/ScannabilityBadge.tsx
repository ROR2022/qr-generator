import { contrastRatio } from '@/lib/contrast'
import { getTranslations, type Language } from '@/lib/i18n'
import type { QRConfig } from '@/lib/qr-config'

export default function ScannabilityBadge({ language, config }: { language: Language; config: QRConfig }) {
  const t = getTranslations(language)
  const lowContrast = !config.transparent && contrastRatio(config.color, config.background) < 3
  const riskyLogo = Boolean(config.logo) && (config.error !== 'H' || config.logoSize > 25)
  const highRisk = riskyLogo || config.margin < 4
  const state = highRisk
    ? {
        title: t.scan.highRisk,
        text: config.margin < 4 ? t.scan.highRiskMargin : t.scan.highRiskLogo,
        cls: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900',
        dot: 'bg-rose-500',
      }
    : lowContrast
      ? {
          title: t.scan.contrast,
          text: t.scan.contrastText,
          cls: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900',
          dot: 'bg-amber-500',
        }
      : {
          title: t.scan.scannable,
          text: t.scan.scannableText,
          cls: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900',
          dot: 'bg-emerald-500',
        }

  return <div className={`mb-4 rounded-xl px-4 py-3 ring-1 ${state.cls}`}><div className="flex items-center gap-2 text-sm font-semibold"><span className={`h-2 w-2 rounded-full ${state.dot}`} />{state.title}</div><p className="mt-1 pl-4 text-xs opacity-80">{state.text}</p></div>
}
