const defaultDownloadName = 'qr-studio'
const knownExtension = /\.(?:png|svg|jpe?g|pdf)$/i
const invalidFileNameCharacters = /[<>:"/\\|?*\u0000-\u001f\u007f]/g
const reservedWindowsName = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i

export function normalizeDownloadName(name: string) {
  const normalized = name
    .normalize('NFC')
    .trim()
    .replace(knownExtension, '')
    .replace(invalidFileNameCharacters, '-')
    .replace(/-+/g, '-')
    .replace(/[. ]+$/g, '')
    .trim()

  if (!normalized) return defaultDownloadName
  return reservedWindowsName.test(normalized) ? `_${normalized}` : normalized
}

export function getDownloadFileName(name: string, extension: 'png' | 'svg' | 'jpeg' | 'pdf') {
  return `${normalizeDownloadName(name)}.${extension}`
}
