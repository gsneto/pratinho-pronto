import { describe, expect, it } from 'vitest'
import { getRecipeImageUrl } from './images'

describe('getRecipeImageUrl', () => {
  it('returns the showcase image for a mapped recipe', () => {
    expect(getRecipeImageUrl('Panquequinha de banana', null)).toBe(
      '/images/recipes/panquequinha-de-banana.webp',
    )
  })

  it('keeps a catalog image when one is configured', () => {
    expect(getRecipeImageUrl('Panquequinha de banana', 'https://example.com/photo.webp')).toBe(
      'https://example.com/photo.webp',
    )
  })

  it('returns null for a recipe without an image', () => {
    expect(getRecipeImageUrl('Receita sem foto', null)).toBeNull()
  })
})

