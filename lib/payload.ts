import type { QRConfig } from './qr-config'
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/:/g, '\\:')
export function buildPayload(config: QRConfig) {
  const v = config.values as Record<string, string>
  switch (config.contentType) {
    case 'URL': { const s = v.url?.trim() || ''; return s && !/^https?:\/\//i.test(s) ? `https://${s}` : s }
    case 'Texto': return v.text || ''
    case 'WiFi': return `WIFI:T:${v.encryption || 'WPA'};S:${esc(v.ssid || '')};${v.encryption === 'None' ? '' : `P:${esc(v.password || '')};`}H:${v.hidden === 'true' ? 'true' : 'false'};;`
    case 'vCard': return ['BEGIN:VCARD', 'VERSION:3.0', `N:${esc(v.last || '')};${esc(v.first || '')};;;`, `FN:${esc(`${v.first || ''} ${v.last || ''}`.trim())}`, v.phone && `TEL:${esc(v.phone)}`, v.email && `EMAIL:${esc(v.email)}`, v.org && `ORG:${esc(v.org)}`, v.website && `URL:${esc(v.website)}`, 'END:VCARD'].filter(Boolean).join('\n')
    case 'Email': return `mailto:${v.email || ''}?subject=${encodeURIComponent(v.subject || '')}&body=${encodeURIComponent(v.body || '')}`
    case 'SMS': return `SMSTO:${v.phone || ''}:${v.message || ''}`
    case 'Teléfono': return `tel:${v.phone || ''}`
  }
}

export function getHttpUrl(config: QRConfig) {
  if (config.contentType !== 'URL') return undefined

  try {
    const url = new URL(buildPayload(config) || '')
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}
