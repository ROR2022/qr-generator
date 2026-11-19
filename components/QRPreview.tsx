'use client'
import { useEffect, useRef, useState } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { Share2 } from 'lucide-react'
import type { QRConfig } from '@/lib/qr-config'
import { buildPayload, getHttpUrl } from '@/lib/payload'
import { normalizeDownloadName } from '@/lib/download-name'
import { downloadQrPdf } from '@/lib/pdf-export'
import { getShareText, getWhatsAppShareUrl, shareQr } from '@/lib/share'

type QRPreviewProps = {
  config: QRConfig
  downloadName: string
  onDownloadNameChange: (name: string) => void
  onReady: (busy: boolean) => void
  showActions?: boolean
}

const actionClass = 'rounded-xl border border-zinc-200 bg-white px-2 py-3 text-xs font-semibold text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-indigo-950'

export default function QRPreview({ config, downloadName, onDownloadNameChange, onReady, showActions = true }: QRPreviewProps) {
  const host = useRef<HTMLDivElement>(null)
  const qr = useRef<QRCodeStyling | null>(null)
  const copyField = useRef<HTMLTextAreaElement>(null)
  const [ready, setReady] = useState(false)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [shareBusy, setShareBusy] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [manualOptionsOpen, setManualOptionsOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [showCopyField, setShowCopyField] = useState(false)

  const payload = buildPayload(config)
  const payloadReady = Boolean(payload?.trim())
  const normalizedDownloadName = normalizeDownloadName(downloadName)
  const httpUrl = getHttpUrl(config)
  const shareText = getShareText(config)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    setReady(false)
    onReady(true)
    setShareError(null)
    setShareStatus(null)
    setManualOptionsOpen(false)
    setCopyStatus(null)
    setShowCopyField(false)
    timer = setTimeout(() => {
      if (!host.current) return
      const instance = new QRCodeStyling({
        width: config.size,
        height: config.size,
        type: 'svg',
        data: payload || ' ',
        margin: config.margin,
        qrOptions: { errorCorrectionLevel: config.error },
        dotsOptions: {
          type: config.dot as 'square',
          color: config.color,
          ...(config.gradient ? {
            gradient: {
              type: 'linear',
              rotation: config.angle * Math.PI / 180,
              colorStops: [{ offset: 0, color: config.color }, { offset: 1, color: config.gradientEnd }],
            },
          } : {}),
        },
        cornersSquareOptions: { type: config.eye as 'square', color: config.eyeColor },
        cornersDotOptions: { type: config.innerEye as 'square', color: config.eyeColor },
        backgroundOptions: { color: config.transparent ? 'transparent' : config.background },
        image: config.logo || undefined,
        imageOptions: {
          hideBackgroundDots: config.hideDots,
          imageSize: config.logoSize / 100,
          margin: 4,
          crossOrigin: 'anonymous',
        },
      })
      qr.current = instance
      host.current.replaceChildren()
      instance.append(host.current)
      setReady(true)
      onReady(false)
    }, 200)

    return () => {
      clearTimeout(timer)
      host.current?.replaceChildren()
      qr.current = null
    }
  }, [config, onReady, payload])

  const download = (extension: 'png' | 'svg' | 'jpeg') => qr.current?.download({ name: normalizedDownloadName, extension })

  const downloadPdf = async () => {
    if (!qr.current || !ready || pdfBusy || shareBusy) return
    setPdfBusy(true)
    setPdfError(null)
    try {
      await downloadQrPdf(qr.current, config, normalizedDownloadName)
    } catch (error) {
      console.error('Unable to generate QR PDF', error)
      setPdfError('No se pudo generar el PDF. Inténtalo de nuevo.')
    } finally {
      setPdfBusy(false)
    }
  }

  const share = async () => {
    if (!qr.current || !ready || !payloadReady || shareBusy || pdfBusy) return
    setShareBusy(true)
    setShareError(null)
    setShareStatus(null)
    setCopyStatus(null)
    setShowCopyField(false)
    try {
      const result = await shareQr(qr.current, config, normalizedDownloadName)
      if (result === 'fallback') {
        setManualOptionsOpen(true)
        setShareStatus('Este navegador no puede compartir el archivo directamente. Usa las opciones manuales.')
      } else {
        setShareStatus('El flujo de compartir se cerró. El navegador no confirma que se haya enviado.')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setShareStatus('Se canceló el menú para compartir. Puedes usar las opciones manuales.')
      } else {
        console.error('Unable to share QR', error)
        setShareError('No se pudo preparar o compartir el QR. Puedes usar las opciones manuales.')
        setManualOptionsOpen(true)
      }
    } finally {
      setShareBusy(false)
    }
  }

  const copyLink = async () => {
    if (!httpUrl) return
    setCopyStatus(null)
    setShowCopyField(false)
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API is unavailable.')
      await navigator.clipboard.writeText(httpUrl)
      setCopyStatus('Enlace copiado.')
    } catch (error) {
      console.error('Unable to copy QR destination URL', error)
      setCopyStatus('No se pudo copiar automáticamente. Selecciona y copia el enlace:')
      setShowCopyField(true)
      setManualOptionsOpen(true)
      requestAnimationFrame(() => {
        copyField.current?.focus()
        copyField.current?.select()
      })
    }
  }

  return (
    <div className="w-full">
      <div
        className="checkerboard mx-auto flex aspect-square w-full max-w-[min(76vw,390px)] items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 p-4 shadow-sm dark:border-zinc-700"
        style={{ backgroundColor: config.transparent ? undefined : config.background }}
      >
        <div
          ref={host}
          className="qr-host flex items-center justify-center [&>svg]:h-full [&>svg]:w-full"
          style={{ width: '100%', height: '100%', maxWidth: config.size, maxHeight: config.size }}
        />
      </div>
      <p className="mt-4 text-center text-xs text-zinc-400">
        {ready ? 'Vista previa actualizada al instante' : 'Preparando tu código QR…'}
      </p>

      {showActions && (
        <>
          <div className="mt-5">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400">Nombre del archivo</span>
              <input
                type="text"
                maxLength={100}
                value={downloadName}
                onChange={event => onDownloadNameChange(event.target.value)}
                placeholder="qr-studio"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-950"
              />
            </label>
            <p className="mt-1 text-[11px] text-zinc-400">
              Ejemplo: <code>{normalizedDownloadName}.png</code>. La extensión se agrega según el formato; si lo dejas vacío, se usa qr-studio.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {(['png', 'svg', 'jpeg'] as const).map((format) => (
              <button
                key={format}
                type="button"
                disabled={!ready || shareBusy}
                onClick={() => download(format)}
                className={actionClass}
              >
                <span className="block text-[10px] font-normal normal-case text-zinc-400">Descargar</span>
                {format === 'jpeg' ? 'JPG' : format}
              </button>
            ))}
            <button
              type="button"
              aria-label="Descargar QR en PDF"
              disabled={!ready || pdfBusy || shareBusy}
              onClick={() => void downloadPdf()}
              className={actionClass}
            >
              <span className="block text-[10px] font-normal normal-case text-zinc-400">
                {pdfBusy ? 'Generando…' : 'Descargar'}
              </span>
              PDF
            </button>
          </div>

          {pdfError && <p role="alert" className="mt-2 text-center text-xs text-rose-600 dark:text-rose-400">{pdfError}</p>}

          <button
            type="button"
            disabled={!ready || !payloadReady || shareBusy || pdfBusy}
            aria-busy={shareBusy}
            onClick={() => void share()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-offset-zinc-950"
          >
            <Share2 size={17} aria-hidden="true" />
            {shareBusy ? 'Preparando…' : 'Compartir'}
          </button>
          <p className="mt-1 text-center text-xs text-zinc-400">Elige WhatsApp para enviar el QR y el texto.</p>

          {shareStatus && <p role="status" className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">{shareStatus}</p>}
          {shareError && <p role="alert" className="mt-2 text-center text-xs text-rose-600 dark:text-rose-400">{shareError}</p>}

          <div className="mt-3">
            <button
              type="button"
              aria-expanded={manualOptionsOpen}
              onClick={() => setManualOptionsOpen((open) => !open)}
              className="w-full rounded-lg px-3 py-2 text-sm font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-4 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              {manualOptionsOpen ? 'Ocultar opciones manuales' : 'Opciones para compartir manualmente'}
            </button>

            {manualOptionsOpen && (
              <div className="mt-2 space-y-3 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                <p>Descarga el PNG y adjúntalo en WhatsApp. El texto se prepara al abrir WhatsApp; el archivo debes adjuntarlo manualmente.</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!ready || shareBusy}
                    onClick={() => download('png')}
                    className="rounded-lg border border-zinc-200 px-3 py-2 font-medium hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-40 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Descargar PNG
                  </button>
                  {httpUrl && (
                    <button
                      type="button"
                      onClick={() => void copyLink()}
                      className="rounded-lg border border-zinc-200 px-3 py-2 font-medium hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Copiar enlace
                    </button>
                  )}
                  <a
                    href={getWhatsAppShareUrl(config)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
                  >
                    Abrir WhatsApp con el texto
                  </a>
                </div>
                {copyStatus && <p role={showCopyField ? 'alert' : 'status'}>{copyStatus}</p>}
                {showCopyField && httpUrl && (
                  <textarea
                    ref={copyField}
                    aria-label="Enlace del QR para copiar manualmente"
                    readOnly
                    value={httpUrl}
                    onFocus={(event) => event.currentTarget.select()}
                    className="w-full resize-y rounded-lg border border-zinc-300 bg-zinc-50 p-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
                    rows={2}
                  />
                )}
                <p className="break-all text-xs text-zinc-400">Texto sugerido: {shareText}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
