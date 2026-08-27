import { Salad } from 'lucide-react'
import { getRecipeImageUrl } from '../../lib/recipes/images'

interface RecipeVisualProps {
  imageUrl: string | null
  name: string
  size?: 'card' | 'hero' | 'thumb'
}

export function RecipeVisual({ imageUrl, name, size = 'card' }: RecipeVisualProps) {
  const sizeClass = size === 'hero'
    ? 'h-56 sm:h-72 w-full'
    : size === 'thumb'
      ? 'size-16 shrink-0 rounded-xl'
      : 'h-36 w-full'
  const resolvedImageUrl = getRecipeImageUrl(name, imageUrl)

  if (resolvedImageUrl) {
    return (
      <img
        alt={`Receita ${name}`}
        className={`${sizeClass} object-cover`}
        decoding="async"
        loading="lazy"
        width={size === 'thumb' ? 64 : 640}
        height={size === 'thumb' ? 64 : size === 'hero' ? 360 : 180}
        src={resolvedImageUrl}
      />
    )
  }

  return (
    <div
      aria-label={`Imagem ilustrativa indisponível para ${name}`}
      className={`${sizeClass} grid place-items-center bg-sage-50 text-sage-700`}
      role="img"
    >
      <span className={`grid place-items-center rounded-[20px] bg-white shadow-sm ${size === 'thumb' ? 'size-10 rounded-xl' : 'size-14'}`}>
        <Salad aria-hidden="true" size={size === 'thumb' ? 19 : 27} strokeWidth={1.6} />
      </span>
    </div>
  )
}
