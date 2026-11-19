import type QRCodeStyling from 'qr-code-styling'
import type { QRConfig } from './qr-config'
import { getDownloadFileName } from './download-name'
import { getHttpUrl } from './payload'

const margin = 8
const pointsPerPixel = 72 / 96

export async function downloadQrPdf(qr: QRCodeStyling, config: QRConfig, fileName: string) {
  const image = await qr.getRawData('png')
  if (!(image instanceof Blob)) {
    throw new Error('QR image could not be generated as a PNG blob.')
  }

  const imageData = new Uint8Array(await image.arrayBuffer())
  const qrSize = config.size * pointsPerPixel
  const pageSize = qrSize + margin * 2
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [pageSize, pageSize],
    compress: true,
  })

  pdf.addImage(imageData, 'PNG', margin, margin, qrSize, qrSize)

  const url = getHttpUrl(config)
  if (url) pdf.link(margin, margin, qrSize, qrSize, { url })

  pdf.save(getDownloadFileName(fileName, 'pdf'))
}
