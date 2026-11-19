export type ContentType = 'URL' | 'Texto' | 'WiFi' | 'vCard' | 'Email' | 'SMS' | 'Teléfono'
export type QRConfig = {
  contentType: ContentType; values: Record<string, string | boolean>; dot: string; eye: string; innerEye: string
  color: string; eyeColor: string; background: string; transparent: boolean; gradient: boolean; gradientEnd: string; angle: number
  logo: string; logoSize: number; hideDots: boolean; size: number; margin: number; error: 'L' | 'M' | 'Q' | 'H'
}
export const defaults: QRConfig = {
  contentType: 'URL', values: { url: 'https://vercel.com' }, dot: 'rounded', eye: 'square', innerEye: 'dot',
  color: '#171717', eyeColor: '#171717', background: '#ffffff', transparent: false, gradient: false, gradientEnd: '#4f46e5', angle: 45,
  logo: '', logoSize: 20, hideDots: true, size: 280, margin: 12, error: 'H',
}
