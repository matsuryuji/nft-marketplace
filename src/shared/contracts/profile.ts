import { z } from 'zod'
import { PASSWORD_MIN_LENGTH, USERNAME_PATTERN, userSchema } from './auth'
import { optionalEnsName } from './wallet'

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const ENS_SUFFIXES = ['.eth', '.kurio.eth'] as const

export const profileSchema = userSchema.extend({
  ensName: z.string().nullable(),
  walletNickname: z.string(),
})

export const updateProfileRequestSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe seu nome de exibição').max(48, 'Use no máximo 48 caracteres'),
  username: z
    .string()
    .trim()
    .min(3, 'Use pelo menos 3 caracteres')
    .max(20, 'Use no máximo 20 caracteres')
    .regex(USERNAME_PATTERN, 'Use apenas letras minúsculas, números, ponto ou _'),
  email: z.string().trim().min(1, 'Informe seu e-mail').email('Informe um e-mail válido'),
  ensName: optionalEnsName,
  walletNickname: z.string().trim().min(2, 'Informe um apelido para a carteira').max(32, 'Use no máximo 32 caracteres'),
})

export const changePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Informe sua senha atual'),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`)
    .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra')
    .regex(/\d/, 'Inclua pelo menos um número'),
})

export const avatarUploadRequestSchema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,/, 'Envie uma imagem PNG, JPG ou WebP')
    .max(Math.ceil((AVATAR_MAX_BYTES * 4) / 3) + 64, 'A imagem precisa ter no máximo 2 MB'),
})

export type Profile = z.infer<typeof profileSchema>
export type UpdateProfileInput = z.input<typeof updateProfileRequestSchema>
export type UpdateProfileRequest = z.output<typeof updateProfileRequestSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>
