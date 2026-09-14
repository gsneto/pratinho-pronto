import { Salad } from 'lucide-react'
import { getRecipeImageUrl } from '../../lib/recipes/images'

export type RecipeVisualSize = 'thumb-sm' | 'thumb' | 'card' | 'square' | 'hero'

interface RecipeVisualProps {
  className?: string
  imageUrl: string | null
  name: string
  /** Prioriza o carregamento quando a foto é o primeiro elemento visível. */
  priority?: boolean
  size?: RecipeVisualSize
}

/**
 * Enquadramento único das fotos do catálogo.
 * Todos os arquivos são quadrados; o recorte fica a cargo do CSS
 * (aspect-ratio + object-cover), nunca da deformação da imagem.
 */
const frameBySize: Record<RecipeVisualSize, string> = {
  'thumb-sm': 'pp-photo-frame pp-photo-thumb w-11 shrink-0',
  thumb: 'pp-photo-frame pp-photo-thumb w-16 shrink-0',
  card: 'pp-photo-frame pp-photo-card w-full',
  square: 'pp-photo-frame pp-photo-feature w-full',
  hero: 'pp-photo-frame pp-photo-hero w-full',
}

const fallbackIconSize: Record<RecipeVisualSize, number> = {
  'thumb-sm': 17,
  thumb: 20,
  card: 26,
  square: 28,
  hero: 30,
}

export function RecipeVisual({
  className = '',
  imageUrl,
  name,
  priority = false,
  size = 'card',
}: RecipeVisualProps) {
  const frameClass = `${frameBySize[size]} ${className}`.trim()
  const resolvedImageUrl = getRecipeImageUrl(name, imageUrl)

  if (!resolvedImageUrl) {
    return (
      <div
        aria-label={`Imagem indisponível para ${name}`}
        className={`${frameClass} grid place-items-center text-sage-700`}
        role="img"
      >
        <span className="grid size-2/5 min-h-9 min-w-9 place-items-center rounded-[14px] bg-white/80 shadow-sm">
          <Salad aria-hidden="true" size={fallbackIconSize[size]} strokeWidth={1.6} />
        </span>
      </div>
    )
  }

  return (
    <div className={frameClass}>
      <img
        alt={`Foto da receita ${name}`}
        className="pp-photo"
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
        src={resolvedImageUrl}
      />
    </div>
  )
}
