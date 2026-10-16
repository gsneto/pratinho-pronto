import { describe, expect, it } from 'vitest'
import { recipeBackLinkLabel } from './back-link'

describe('recipeBackLinkLabel', () => {
  it('rotula cada origem com o destino real', () => {
    expect(recipeBackLinkLabel('/app/week?week=2026-09-14')).toBe('Voltar para minha semana')
    expect(recipeBackLinkLabel('/app/pantry')).toBe('Voltar para a despensa')
    expect(recipeBackLinkLabel('/app/recipes')).toBe('Voltar para receitas')
    expect(recipeBackLinkLabel('/app/recipes?favorites=true')).toBe('Voltar para receitas')
    expect(recipeBackLinkLabel('/app')).toBe('Voltar para o início')
  })

  it('usa o catálogo como padrão para destinos desconhecidos', () => {
    expect(recipeBackLinkLabel('/qualquer')).toBe('Voltar para receitas')
  })
})
