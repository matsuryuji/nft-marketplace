import { AVATAR_MAX_BYTES, AVATAR_TYPES } from '@/shared/contracts/profile'

const AVATAR_SIZE = 256

export function validateAvatarFile(file: File) {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) return 'Envie uma imagem PNG, JPG ou WebP.'
  if (file.size > AVATAR_MAX_BYTES) return 'A imagem precisa ter no máximo 2 MB.'
  return null
}

export async function resizeAvatar(file: File) {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Não foi possível processar a imagem.')
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  )
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.85)
}
