export async function fileToCoinImage(file: File, maxSize = 320) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Não deu para ler a imagem.')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const webp = canvas.toDataURL('image/webp', 0.72)
  if (webp.startsWith('data:image/webp') && webp.length < 180_000) return webp
  return canvas.toDataURL('image/jpeg', 0.7)
}
