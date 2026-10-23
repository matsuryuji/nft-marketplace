import { z } from 'zod'

export const USERNAME_PATTERN = /^[a-z0-9_.]+$/
export const PASSWORD_MIN_LENGTH = 8

const email = z.string().trim().min(1, 'Informe seu e-mail').email('Informe um e-mail válido').max(120)

export const loginRequestSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha'),
})

export const registerRequestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Use pelo menos 3 caracteres')
    .max(20, 'Use no máximo 20 caracteres')
    .regex(USERNAME_PATTERN, 'Use apenas letras minúsculas, números, ponto ou _'),
  email,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `A senha precisa ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`)
    .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra')
    .regex(/\d/, 'Inclua pelo menos um número'),
})

export const registerFormSchema = registerRequestSchema
  .extend({ confirmPassword: z.string().min(1, 'Confirme sua senha') })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })

export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
})

export const sessionSchema = z.object({
  user: userSchema,
  expiresAt: z.string(),
})

export type LoginRequest = z.infer<typeof loginRequestSchema>
export type RegisterRequest = z.infer<typeof registerRequestSchema>
export type RegisterForm = z.infer<typeof registerFormSchema>
export type User = z.infer<typeof userSchema>
export type Session = z.infer<typeof sessionSchema>
