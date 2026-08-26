const maxOriginalPhotoSize = 10 * 1024 * 1024
const outputSize = 720

export interface PhotoInputMetadata {
  size: number
  type: string
}

export function getBabyPhotoValidationError(file: PhotoInputMetadata): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Escolha um arquivo de imagem.'
  }

  if (file.size > maxOriginalPhotoSize) {
    return 'A foto original deve ter no máximo 10 MB.'
  }

  return null
}

export async function prepareBabyPhoto(file: File): Promise<Blob> {
  const validationError = getBabyPhotoValidationError(file)
  if (validationError) throw new Error(validationError)

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = new Image()
    image.src = objectUrl
    await image.decode()

    if (!image.naturalWidth || !image.naturalHeight) {
      throw new Error('Não foi possível ler essa imagem.')
    }

    const cropSize = Math.min(image.naturalWidth, image.naturalHeight)
    const sourceX = (image.naturalWidth - cropSize) / 2
    const sourceY = (image.naturalHeight - cropSize) / 2
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Não foi possível preparar essa imagem.')

    context.drawImage(
      image,
      sourceX,
      sourceY,
      cropSize,
      cropSize,
      0,
      0,
      outputSize,
      outputSize,
    )

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.82)
    })

    if (!blob) throw new Error('Não foi possível otimizar essa imagem.')
    return blob
  } catch (error) {
    if (error instanceof Error && error.message) throw error
    throw new Error('Formato de imagem não compatível. Tente usar JPG ou PNG.')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

