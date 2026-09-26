import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BabyForm } from '../../components/baby/BabyForm'
import { BrandMark } from '../../components/ui/BrandMark'
import { babyQueryKey } from '../../hooks/useBaby'
import type { BabyFormData } from '../../lib/schemas/baby'
import { analytics } from '../../services/analytics'
import { createBaby, uploadBabyPhoto } from '../../services/babies'
import { prepareBabyPhoto } from '../../lib/baby-photo'
import { splitList } from '../../utils/text'

export function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)

  useEffect(() => () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
  }, [photoPreviewUrl])

  function handlePhotoSelected(file: File | undefined) {
    setPhotoFile(file ?? null)
    setPhotoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return file ? URL.createObjectURL(file) : null
    })
  }

  async function handleCreate(data: BabyFormData) {
    const optimizedPhoto = photoFile ? await prepareBabyPhoto(photoFile) : null
    const baby = await createBaby({
      avoided_foods: splitList(data.avoided_foods),
      birth_date: data.birth_date,
      known_allergens: splitList(data.known_allergens),
      name: data.name,
      notes: data.notes.trim() || null,
      restrictions: splitList(data.restrictions),
    })
    if (optimizedPhoto) {
      try {
        await uploadBabyPhoto(baby, optimizedPhoto)
      } catch {
        // O cadastro continua disponível; a foto pode ser adicionada no Perfil.
      }
    }
    analytics.track('onboarding_completed', { has_photo: Boolean(optimizedPhoto) })
    await queryClient.invalidateQueries({ queryKey: babyQueryKey })
    navigate('/app', { replace: true })
  }

  return (
    <main className="min-h-screen bg-cream-50 px-5 py-7 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <section className="pp-panel mt-7 p-6 sm:p-9">
          <p className="pp-eyebrow">Um cadastro, uma rotina mais sua.</p>
          <h1 className="pp-page-title">
            Vamos conhecer seu bebê
          </h1>
          <p className="pp-page-description">
            Conte as preferências da sua família. Você pode revisar tudo no perfil depois,
            sem precisar preencher o que ainda não sabe.
          </p>
          <div className="mt-8">
            <BabyForm onPhotoSelected={handlePhotoSelected} onSubmit={handleCreate} photoPreviewUrl={photoPreviewUrl} submitLabel="Salvar e personalizar" />
          </div>
        </section>
        <p className="mt-6 text-center text-xs leading-5 text-ink-500">
          O Pratinho Pronto é uma ferramenta de organização alimentar e não
          substitui orientação individual de pediatra ou nutricionista.
        </p>
      </div>
    </main>
  )
}
