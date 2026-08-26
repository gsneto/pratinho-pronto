import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Save } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { babyFormSchema, type BabyFormData } from '../../lib/schemas/baby'
import type { Baby } from '../../types/domain'

interface BabyFormProps {
  baby?: Baby | null
  onSubmit: (data: BabyFormData) => Promise<void>
  submitLabel: string
}

const fieldClassName =
  'mt-2 min-h-13 w-full rounded-2xl border border-cream-100 bg-cream-50 px-4 py-3 text-base text-ink-900 placeholder:text-ink-500/60 focus:border-sage-500 focus:bg-white focus:outline-none'

export function BabyForm({ baby, onSubmit, submitLabel }: BabyFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<BabyFormData>({
    defaultValues: {
      avoided_foods: baby?.avoided_foods.join(', ') ?? '',
      birth_date: baby?.birth_date ?? '',
      known_allergens: baby?.known_allergens.join(', ') ?? '',
      name: baby?.name ?? '',
      notes: baby?.notes ?? '',
      restrictions: baby?.restrictions.join(', ') ?? '',
    },
    resolver: zodResolver(babyFormSchema),
  })

  async function submit(data: BabyFormData) {
    setServerError(null)
    try {
      await onSubmit(data)
    } catch {
      setServerError('Não foi possível salvar o cadastro. Tente novamente.')
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
      <div>
        <label className="text-sm font-semibold text-ink-700" htmlFor="baby-name">
          Nome do bebê
        </label>
        <input
          {...register('name')}
          aria-invalid={Boolean(errors.name)}
          className={fieldClassName}
          id="baby-name"
          placeholder="Como você chama seu bebê?"
        />
        {errors.name && <p className="mt-2 text-sm text-terracotta-500">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-ink-700" htmlFor="birth-date">
          Data de nascimento
        </label>
        <input
          {...register('birth_date')}
          aria-invalid={Boolean(errors.birth_date)}
          className={fieldClassName}
          id="birth-date"
          max={new Date().toISOString().slice(0, 10)}
          type="date"
        />
        <p className="mt-2 text-xs leading-5 text-ink-500">
          A idade será calculada automaticamente e nunca ficará desatualizada.
        </p>
        {errors.birth_date && (
          <p className="mt-2 text-sm text-terracotta-500">{errors.birth_date.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-semibold text-ink-700" htmlFor="restrictions">
          Restrições alimentares
        </label>
        <textarea
          {...register('restrictions')}
          className={`${fieldClassName} min-h-24 resize-y`}
          id="restrictions"
          placeholder="Separe por vírgulas. Ex.: sem leite, vegetariano"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-ink-700" htmlFor="allergens">
          Alergênicos conhecidos
        </label>
        <textarea
          {...register('known_allergens')}
          className={`${fieldClassName} min-h-24 resize-y`}
          id="allergens"
          placeholder="Ex.: ovo, leite, peixe"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-ink-700" htmlFor="avoided-foods">
          Alimentos que prefere evitar
        </label>
        <textarea
          {...register('avoided_foods')}
          className={`${fieldClassName} min-h-24 resize-y`}
          id="avoided-foods"
          placeholder="Ex.: banana, frango"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-ink-700" htmlFor="baby-notes">
          Observações <span className="font-normal text-ink-500">(opcional)</span>
        </label>
        <textarea
          {...register('notes')}
          className={`${fieldClassName} min-h-24 resize-y`}
          id="baby-notes"
          placeholder="Algo importante para lembrar ao planejar?"
        />
      </div>

      {serverError && (
        <p className="text-sm text-terracotta-500" role="alert">
          {serverError}
        </p>
      )}

      <button
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-pumpkin px-5 text-base font-medium text-[#2A2A22] enabled:hover:bg-pumpkin/90 disabled:cursor-not-allowed disabled:opacity-55"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Salvando…' : submitLabel}
        {baby ? <Save aria-hidden="true" size={19} /> : <ArrowRight aria-hidden="true" size={19} />}
      </button>
    </form>
  )
}
