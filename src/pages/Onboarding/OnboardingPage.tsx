import { useQueryClient } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BabyForm } from '../../components/baby/BabyForm'
import { BrandMark } from '../../components/ui/BrandMark'
import { babyQueryKey } from '../../hooks/useBaby'
import type { BabyFormData } from '../../lib/schemas/baby'
import { analytics } from '../../services/analytics'
import { createBaby } from '../../services/babies'
import { splitList } from '../../utils/text'

export function OnboardingPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  async function handleCreate(data: BabyFormData) {
    await createBaby({
      avoided_foods: splitList(data.avoided_foods),
      birth_date: data.birth_date,
      known_allergens: splitList(data.known_allergens),
      name: data.name,
      notes: data.notes.trim() || null,
      restrictions: splitList(data.restrictions),
    })
    analytics.track('baby_created')
    await queryClient.invalidateQueries({ queryKey: babyQueryKey })
    navigate('/app', { replace: true })
  }

  return (
    <main className="min-h-screen bg-cream-50 px-5 py-7 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-2xl">
        <BrandMark />
        <section className="mt-9 rounded-[28px] border border-cream-100 bg-white p-6 shadow-[0_20px_60px_rgba(65,65,60,0.06)] sm:p-9">
          <span className="grid size-12 place-items-center rounded-2xl bg-terracotta-100 text-terracotta-500">
            <Heart aria-hidden="true" size={22} strokeWidth={1.8} />
          </span>
          <p className="mt-6 text-sm font-semibold text-terracotta-500">Primeiro passo</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink-900 sm:text-4xl">
            Vamos conhecer seu bebê
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            Essas informações ajudam a filtrar as receitas compatíveis e a
            montar uma semana compatível com as escolhas da sua família.
          </p>
          <div className="mt-8">
            <BabyForm onSubmit={handleCreate} submitLabel="Salvar e continuar" />
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
