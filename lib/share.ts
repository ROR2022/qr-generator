import type QRCodeStyling from 'qr-code-styling'
import { getTranslations, type Language } from './i18n'
import type { QRConfig } from './qr-config'
import { getDownloadFileName } from './download-name'
import { getHttpUrl } from './payload'

const shareTitle = 'QR Studio'
export function getShareText(config: QRConfig, language: Language) {
  const t = getTranslations(language)
  const url = getHttpUrl(config)
  return url ? t.share.url(url) : t.share.generic
}

export function getWhatsAppShareUrl(config: QRConfig, language: Language) {
  return `https://wa.me/?text=${encodeURIComponent(getShareText(config, language))}`
}

async function createQrFile(qr: QRCodeStyling, fileName: string) {
  const image = await qr.getRawData('png')
  if (!(image instanceof Blob)) {
    throw new Error('QR image could not be generated as a PNG blob.')
  }

  return new File([image], getDownloadFileName(fileName, 'png'), { type: 'image/png' })
}

export async function shareQr(qr: QRCodeStyling, config: QRConfig, fileName: string, language: Language) {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return 'fallback' as const
  }

  const file = await createQrFile(qr, fileName)
  if (!navigator.canShare({ files: [file] })) return 'fallback' as const

  await navigator.share({
    files: [file],
    title: shareTitle,
    text: getShareText(config, language),
  })

  return 'shared' as const
}
