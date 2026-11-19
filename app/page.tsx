'use client'

import { useCallback, useEffect, useState } from 'react'
import { Moon, QrCode, ScanLine, Sun, X } from 'lucide-react'
import ControlPanel from '@/components/ControlPanel'
import QRPreview from '@/components/QRPreview'
import ScannabilityBadge from '@/components/ScannabilityBadge'
import { getTranslations, isLanguage, type Language } from '@/lib/i18n'
import { defaults, type QRConfig } from '@/lib/qr-config'

const languageStorageKey = 'qr-studio-language'

export default function Page() {
  const [config, setConfig] = useState<QRConfig>(defaults)
  const [downloadName, setDownloadName] = useState('qr-studio')
  const [dark, setDark] = useState(false)
  const [language, setLanguage] = useState<Language>('es')
  const [mobileOpen, setMobileOpen] = useState(false)
  const t = getTranslations(language)

  useEffect(() => {
    const savedLanguage = localStorage.getItem(languageStorageKey)
    if (isLanguage(savedLanguage)) setLanguage(savedLanguage)
  }, [])

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    const saved = localStorage.getItem('qr-studio-theme')
    const enabled = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    setDark(enabled)
    document.documentElement.classList.toggle('dark', enabled)
  }, [])

  const toggleDark = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('qr-studio-theme', next ? 'dark' : 'light')
  }

  const update = useCallback((patch: Partial<QRConfig>) => {
    setConfig(current => ({ ...current, ...patch }))
  }, [])

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-30 flex h-[81px] items-center justify-between border-b border-zinc-200 bg-white/90 px-5 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none">
            <QrCode size={21} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">QR Studio</h1>
            <p className="hidden text-xs text-zinc-500 sm:block">{t.header.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label={t.header.languageLabel} className="flex rounded-xl border border-zinc-200 p-1 text-xs dark:border-zinc-700">
            {(['es', 'en'] as const).map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={language === option}
                onClick={() => setLanguage(option)}
                className={`rounded-lg px-2 py-1.5 font-semibold transition ${language === option ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            aria-label={dark ? t.header.enableLight : t.header.enableDark}
            onClick={toggleDark}
            className="rounded-xl border border-zinc-200 p-2.5 text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(380px,470px)_1fr]">
        <ControlPanel language={language} config={config} update={update} reset={() => setConfig(defaults)} />
        <section className="hidden min-h-[calc(100vh-81px)] items-center justify-center px-8 py-12 lg:sticky lg:top-[81px] lg:flex lg:h-[calc(100vh-81px)]">
          <div className="w-full max-w-[420px]">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
                <ScanLine size={18} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t.header.previewTitle}</h2>
                <p className="text-xs text-zinc-400">{t.header.previewSubtitle}</p>
              </div>
            </div>
            <ScannabilityBadge language={language} config={config} />
            <QRPreview language={language} config={config} downloadName={downloadName} onDownloadNameChange={setDownloadName} onReady={() => {}} />
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-zinc-200 bg-white/95 p-3 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="checkerboard flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="scale-[.12] [&>svg]:max-w-none">
              <QRPreview language={language} config={{ ...config, size: 280 }} downloadName={downloadName} onDownloadNameChange={setDownloadName} onReady={() => {}} showActions={false} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">{t.header.previewTitle}</p>
            <p className="text-[11px] text-emerald-600">{t.header.previewReady}</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(true)} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm">
          {t.header.viewQr}
        </button>
      </div>

      {mobileOpen && (
        <div role="dialog" aria-modal="true" aria-label={t.header.previewTitle} className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-zinc-50 p-5 dark:bg-zinc-950">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold">{t.header.previewTitle}</h2>
            <button aria-label={t.header.closePreview} onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800">
              <X size={20} />
            </button>
          </div>
          <div className="m-auto w-full max-w-sm">
            <ScannabilityBadge language={language} config={config} />
            <QRPreview language={language} config={config} downloadName={downloadName} onDownloadNameChange={setDownloadName} onReady={() => {}} />
          </div>
        </div>
      )}

      <div className="h-20 lg:hidden" aria-hidden="true" />
    </main>
  )
}
