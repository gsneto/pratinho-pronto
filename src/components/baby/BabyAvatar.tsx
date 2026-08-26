import { UserRound } from 'lucide-react'
import { useState } from 'react'

interface BabyAvatarProps {
  className?: string
  name: string
  photoUrl: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'size-8 rounded-xl',
  md: 'size-11 rounded-2xl',
  lg: 'size-16 rounded-[22px]',
  xl: 'size-24 rounded-[28px]',
}

export function BabyAvatar({ className = '', name, photoUrl, size = 'md' }: BabyAvatarProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null)

  const sizeClass = sizeClasses[size]

  if (photoUrl && failedPhotoUrl !== photoUrl) {
    return (
      <img
        alt={`Foto de ${name}`}
        className={`${sizeClass} shrink-0 border-2 border-white object-cover shadow-sm ${className}`}
        decoding="async"
        onError={() => setFailedPhotoUrl(photoUrl)}
        src={photoUrl}
      />
    )
  }

  return (
    <span
      aria-label={`Foto de ${name} não adicionada`}
      className={`${sizeClass} grid shrink-0 place-items-center bg-sage-100 text-sage-700 ${className}`}
      role="img"
    >
      <UserRound aria-hidden="true" size={size === 'xl' ? 34 : size === 'lg' ? 26 : size === 'md' ? 20 : 16} />
    </span>
  )
}

interface BabyPhotoBackdropProps {
  name: string
  photoUrl: string | null
}

export function BabyPhotoBackdrop({ name, photoUrl }: BabyPhotoBackdropProps) {
  if (!photoUrl) return null

  return (
    <img
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full object-cover opacity-[0.08]"
      decoding="async"
      src={photoUrl}
      title={`Foto de ${name}`}
    />
  )
}
