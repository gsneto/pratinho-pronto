import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { BabyAvatar } from '../../components/baby/BabyAvatar'
import { BabyForm } from '../../components/baby/BabyForm'
import { BabyPhotoEditor } from '../../components/baby/BabyPhotoEditor'
import { InstallAppCard } from '../../components/ui/InstallAppCard'
import { PageState } from '../../components/ui/PageState'
import { babyQueryKey, useBaby } from '../../hooks/useBaby'
import type { BabyFormData } from '../../lib/schemas/baby'
import { updateBaby } from '../../services/babies'
import { calculateAgeMonths } from '../../utils/dates'
import { splitList } from '../../utils/text'

export function ProfilePage() {
  const { data: baby, error, isLoading } = useBaby()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)

  if (isLoading) {
    return <PageState description="Carregando o cadastro do bebê." title="Só um instante…" />
  }

  if (error || !baby) {
    return (
      <PageState
        description="Não foi possível carregar o cadastro para edição."
        title="Cadastro indisponível"
        variant="error"
      />
    )
  }

  const currentBaby = baby

  async function handleUpdate(data: BabyFormData) {
    await updateBaby(currentBaby.id, {
      avoided_foods: splitList(data.avoided_foods),
      birth_date: data.birth_date,
      known_allergens: splitList(data.known_allergens),
      name: data.name,
      notes: data.notes.trim() || null,
      restrictions: splitList(data.restrictions),
    })
    await queryClient.invalidateQueries({ queryKey: babyQueryKey })
    setSaved(true)
  }

  async function handlePhotoChanged() {
    await queryClient.invalidateQueries({ queryKey: babyQueryKey })
    setSaved(true)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-start gap-4">
        <BabyAvatar name={currentBaby.name} photoUrl={currentBaby.photo_url} size="lg" />
        <div>
          <p className="text-sm font-semibold text-terracotta-500">Perfil do bebê</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-ink-900">
            Informações de {currentBaby.name}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {calculateAgeMonths(currentBaby.birth_date)} meses hoje
          </p>
        </div>
      </div>

      {saved && (
        <div
          aria-live="polite"
          className="mt-6 flex items-center gap-2 rounded-2xl bg-sage-100 px-4 py-3 text-sm font-medium text-sage-700"
        >
          <CheckCircle2 aria-hidden="true" size={18} />
          Informações atualizadas.
        </div>
      )}

      <div className="mt-6">
        <InstallAppCard compact />
      </div>

      <div className="mt-6">
        <BabyPhotoEditor baby={currentBaby} onChanged={handlePhotoChanged} />
      </div>

      <section className="mt-6 rounded-[24px] border border-cream-100 bg-white p-5 shadow-[0_12px_40px_rgba(65,65,60,0.04)] sm:p-7">
        <BabyForm
          baby={currentBaby}
          onSubmit={handleUpdate}
          submitLabel="Salvar alterações"
        />
      </section>
    </div>
  )
}
