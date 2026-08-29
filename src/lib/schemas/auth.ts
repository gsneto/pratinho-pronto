import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Digite seu e-mail.')
    .email('Digite um e-mail válido.'),
  password: z
    .string()
    .min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
})

export type LoginFormData = z.infer<typeof loginSchema>
