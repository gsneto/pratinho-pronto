import { Salad } from 'lucide-react'
import { getRecipeImageUrl } from '../../lib/recipes/images'

interface RecipeVisualProps {
  imageUrl: string | null
  name: string
  size?: 'card' | 'hero'
}

export function RecipeVisual({ imageUrl, name, size = 'card' }: RecipeVisualProps) {
  const heightClass = size === 'hero' ? 'h-56 sm:h-72' : 'h-36'
  const resolvedImageUrl = getRecipeImageUrl(name, imageUrl)

  if (resolvedImageUrl) {
    return (
      <img
        alt={`Receita ${name}`}
        className={`${heightClass} w-full object-cover`}
        decoding="async"
        loading="lazy"
        src={resolvedImageUrl}
      />
    )
  }

  return (
    <div
      aria-label={`Imagem ilustrativa indisponível para ${name}`}
      className={`${heightClass} grid w-full place-items-center bg-sage-50 text-sage-700`}
      role="img"
    >
      <span className="grid size-14 place-items-center rounded-[20px] bg-white shadow-sm">
        <Salad aria-hidden="true" size={27} strokeWidth={1.6} />
      </span>
    </div>
  )
}
