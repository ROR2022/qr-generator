import type QRCodeStyling from 'qr-code-styling'
import type { QRConfig } from './qr-config'
import { getDownloadFileName } from './download-name'
import { getHttpUrl } from './payload'

const shareTitle = 'QR Studio'
const genericShareText = 'Escanea este código QR para ver el contenido.'

export function getShareText(config: QRConfig) {
  const url = getHttpUrl(config)
  return url ? `Escanea este QR o abre el enlace: ${url}` : genericShareText
}

export function getWhatsAppShareUrl(config: QRConfig) {
  return `https://wa.me/?text=${encodeURIComponent(getShareText(config))}`
}

async function createQrFile(qr: QRCodeStyling, fileName: string) {
  const image = await qr.getRawData('png')
  if (!(image instanceof Blob)) {
    throw new Error('QR image could not be generated as a PNG blob.')
  }

  return new File([image], getDownloadFileName(fileName, 'png'), { type: 'image/png' })
}

export async function shareQr(qr: QRCodeStyling, config: QRConfig, fileName: string) {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') {
    return 'fallback' as const
  }

  const file = await createQrFile(qr, fileName)
  if (!navigator.canShare({ files: [file] })) return 'fallback' as const

  await navigator.share({
    files: [file],
    title: shareTitle,
    text: getShareText(config),
  })

  return 'shared' as const
}
