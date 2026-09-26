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
      <div className="pp-profile-hero flex items-start gap-4">
        <BabyAvatar name={currentBaby.name} photoUrl={currentBaby.photo_url} size="lg" />
        <div>
          <p className="pp-eyebrow">Perfil do bebê</p>
          <h1 className="pp-page-title">
            Informações de {currentBaby.name}
          </h1>
          <p className="mt-2 text-sm text-ink-700">
            {calculateAgeMonths(currentBaby.birth_date)} meses hoje
          </p>
        </div>
      </div>

      {saved && (
        <div
          aria-live="polite"
          role="status"
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

      <section className="pp-panel mt-6 p-5 sm:p-7" aria-label="Editar informações do bebê">
        <BabyForm
          baby={currentBaby}
          onSubmit={handleUpdate}
          submitLabel="Salvar alterações"
        />
      </section>
    </div>
  )
}
