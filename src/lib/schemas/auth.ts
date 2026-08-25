import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Digite seu e-mail.')
    .email('Digite um e-mail válido.'),
})

export type LoginFormData = z.infer<typeof loginSchema>
