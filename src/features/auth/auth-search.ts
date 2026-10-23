import { z } from 'zod'

export const authModes = ['login', 'register'] as const
export type AuthMode = (typeof authModes)[number]

export const authSearchSchema = z.object({
  auth: z.enum(authModes).optional().catch(undefined),
  redirect: z
    .string()
    .max(512)
    .refine((value) => value.startsWith('/') && !value.startsWith('//'))
    .optional()
    .catch(undefined),
})

export type AuthSearch = z.infer<typeof authSearchSchema>
