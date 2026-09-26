import { Camera, LoaderCircle, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { prepareBabyPhoto } from '../../lib/baby-photo'
import { removeBabyPhoto, uploadBabyPhoto } from '../../services/babies'
import type { Baby } from '../../types/domain'
import { BabyAvatar } from './BabyAvatar'

interface BabyPhotoEditorProps {
  baby: Baby
  onChanged: () => Promise<void>
}

export function BabyPhotoEditor({ baby, onChanged }: BabyPhotoEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const isBusy = isRemoving || isUploading

  async function handleFile(file: File | undefined) {
    if (!file) return

    setError(null)
    setIsUploading(true)

    try {
      const optimizedPhoto = await prepareBabyPhoto(file)
      await uploadBabyPhoto(baby, optimizedPhoto)
      await onChanged()
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Não foi possível salvar a foto. Tente novamente.',
      )
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    setError(null)
    setIsRemoving(true)

    try {
      await removeBabyPhoto(baby)
      await onChanged()
    } catch {
      setError('Não foi possível remover a foto. Tente novamente.')
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <section className="rounded-[24px] border border-cream-100 bg-white p-5 sm:flex sm:items-center sm:gap-5">
      <BabyAvatar name={baby.name} photoUrl={baby.photo_url} size="xl" />
      <div className="mt-4 min-w-0 flex-1 sm:mt-0">
        <h2 className="text-xl font-semibold text-ink-900">Foto de {baby.name}</h2>
        <p className="mt-1 text-sm leading-6 text-ink-500">
          Ela personaliza sua experiência e fica armazenada de forma privada.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            accept="image/*"
            aria-label={`Foto de ${baby.name}`}
            hidden
            disabled={isBusy}
            onChange={(event) => void handleFile(event.target.files?.[0])}
            ref={inputRef}
            type="file"
          />
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-pumpkin px-4 text-sm font-medium text-[#2A2A22] disabled:opacity-55"
            disabled={isBusy}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {isUploading ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
            ) : (
              <Camera aria-hidden="true" size={18} />
            )}
            {isUploading ? 'Preparando…' : baby.photo_path ? 'Trocar foto' : 'Escolher foto'}
          </button>
          {baby.photo_path && (
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-cream-100 px-4 text-sm font-medium text-ink-700 disabled:opacity-55"
              disabled={isBusy}
              onClick={() => void handleRemove()}
              type="button"
            >
              {isRemoving ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
              ) : (
                <Trash2 aria-hidden="true" size={18} />
              )}
              {isRemoving ? 'Removendo…' : 'Remover'}
            </button>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-terracotta-500" role="alert">{error}</p>}
        <p className="mt-3 text-xs leading-5 text-ink-500">
          JPG, PNG ou foto da câmera. O app recorta em formato quadrado e otimiza automaticamente.
        </p>
      </div>
    </section>
  )
}

