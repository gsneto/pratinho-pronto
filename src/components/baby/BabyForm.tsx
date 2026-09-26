import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Camera, Save } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { babyFormSchema, type BabyFormData } from '../../lib/schemas/baby'
import type { Baby } from '../../types/domain'

interface BabyFormProps {
  baby?: Baby | null
  onSubmit: (data: BabyFormData) => Promise<void>
  submitLabel: string
  onPhotoSelected?: (file: File | undefined) => void
  photoPreviewUrl?: string | null
}

const fieldClassName =
  'pp-field mt-2 min-h-13 px-4 py-3'

export function BabyForm({ baby, onSubmit, submitLabel, onPhotoSelected, photoPreviewUrl }: BabyFormProps) {
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

  const displayName = baby ? baby.name : 'seu bebê'

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
      {!baby && onPhotoSelected && (
        <div className="rounded-[22px] border border-sage-100 bg-sage-50/70 p-3 sm:flex sm:items-center sm:gap-3">
          {photoPreviewUrl && <img alt={`Prévia da foto de ${displayName}`} className="size-16 shrink-0 rounded-[22px] object-cover shadow-sm" src={photoPreviewUrl} />}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">Personalize o Pratinho Pronto</p>
            <p className="mt-1 text-xs leading-5 text-ink-500">A foto personaliza o app e aparece no perfil.</p>
            <label className="pp-photo-input mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-white px-3 text-sm font-semibold text-sage-700">
              <Camera aria-hidden="true" size={17} />
              {photoPreviewUrl ? 'Trocar foto' : 'Adicionar foto'}
              <input accept="image/*" capture="environment" className="sr-only" onChange={(event) => onPhotoSelected(event.target.files?.[0])} type="file" />
            </label>
            <p className="mt-1 text-[11px] text-ink-500">Opcional · disponível também no Perfil.</p>
          </div>
        </div>
      )}
      <div>
        <label className="text-sm font-semibold text-ink-700" htmlFor="baby-name">
          Nome do bebê
        </label>
        <input
          {...register('name')}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'baby-name-error' : undefined}
          className={fieldClassName}
          id="baby-name"
          placeholder="Como você chama seu bebê?"
        />
        {errors.name && <p className="mt-2 text-sm text-terracotta-500" id="baby-name-error">{errors.name.message}</p>}
      </div>

      <div>
        <label className="text-sm font-semibold text-ink-700" htmlFor="birth-date">
          Data de nascimento
        </label>
        <input
          {...register('birth_date')}
          aria-invalid={Boolean(errors.birth_date)}
          aria-describedby={errors.birth_date ? 'birth-date-help birth-date-error' : 'birth-date-help'}
          className={fieldClassName}
          id="birth-date"
          max={new Date().toISOString().slice(0, 10)}
          type="date"
        />
        <p className="mt-2 text-xs leading-5 text-ink-500" id="birth-date-help">
          A idade será calculada automaticamente e nunca ficará desatualizada.
        </p>
        {errors.birth_date && (
          <p className="mt-2 text-sm text-terracotta-500" id="birth-date-error">{errors.birth_date.message}</p>
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
        className="pp-btn pp-btn-primary pp-btn-lg w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Salvando…' : submitLabel}
        {baby ? <Save aria-hidden="true" size={19} /> : <ArrowRight aria-hidden="true" size={19} />}
      </button>
    </form>
  )
}
