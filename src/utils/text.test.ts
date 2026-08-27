import { describe, expect, it } from 'vitest'
import { publicRecipeText } from './text'

describe('publicRecipeText', () => {
  it('remove linguagem de protótipo sem alterar a ideia da descrição', () => {
    expect(publicRecipeText('Lanche demonstrativo macio e simples.')).toBe('Lanche macio e simples.')
    expect(publicRecipeText('Combinação demonstrativa rápida')).toBe('Combinação rápida')
  })
})
