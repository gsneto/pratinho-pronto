import { describe, expect, it } from 'vitest'
import { getBabyPhotoValidationError } from './baby-photo'

describe('getBabyPhotoValidationError', () => {
  it('accepts an image within the size limit', () => {
    expect(getBabyPhotoValidationError({ size: 2_000_000, type: 'image/jpeg' })).toBeNull()
  })

  it('rejects a non-image file', () => {
    expect(getBabyPhotoValidationError({ size: 100, type: 'application/pdf' })).toBe(
      'Escolha um arquivo de imagem.',
    )
  })

  it('rejects an oversized original', () => {
    expect(getBabyPhotoValidationError({ size: 11 * 1024 * 1024, type: 'image/png' })).toBe(
      'A foto original deve ter no máximo 10 MB.',
    )
  })
})

