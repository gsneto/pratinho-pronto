import { z } from './zod'

export const babyFormSchema = z.object({
  name: z.string().trim().min(2, 'Digite o nome do bebê.').max(80),
  birth_date: z
    .string()
    .min(1, 'Informe a data de nascimento.')
    .refine((value) => !Number.isNaN(new Date(`${value}T12:00:00`).getTime()), {
      message: 'Informe uma data válida.',
    })
    .refine((value) => value <= new Date().toISOString().slice(0, 10), {
      message: 'A data não pode estar no futuro.',
    }),
  restrictions: z.string().max(500),
  known_allergens: z.string().max(500),
  avoided_foods: z.string().max(500),
  notes: z.string().max(1000),
})

export type BabyFormData = z.infer<typeof babyFormSchema>
