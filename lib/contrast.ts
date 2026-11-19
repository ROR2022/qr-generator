export function contrastRatio(a: string, b: string) {
  const lum = (hex: string) => {
    const c = hex.replace('#', '').match(/.{2}/g)?.map(x => parseInt(x, 16) / 255) ?? [0, 0, 0]
    const [r, g, bl] = c.map(x => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl
  }
  const x = lum(a), y = lum(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
