import { describe, expect, it } from 'vitest'
import { consolidateQuantities } from './consolidate'

describe('consolidateQuantities', () => {
  it('devolve lista vazia para entrada vazia', () => {
    expect(consolidateQuantities([])).toEqual([])
  })

  it('resolve aliases da mesma unidade para a forma canônica (un ≡ unidades → unidade)', () => {
    expect(
      consolidateQuantities([
        { quantity: 1, unit: 'un' },
        { quantity: 2, unit: 'unidades' },
      ]),
    ).toEqual([{ quantity: 3, unit: 'unidade' }])
  })

  it('soma unidades convertíveis preservando a unidade da primeira ocorrência', () => {
    expect(
      consolidateQuantities([
        { quantity: 1, unit: 'l' },
        { quantity: 500, unit: 'ml' },
      ]),
    ).toEqual([{ quantity: 1.5, unit: 'l' }])
  })

  it('converte na direção inversa quando a primeira é menor', () => {
    expect(
      consolidateQuantities([
        { quantity: 500, unit: 'ml' },
        { quantity: 1, unit: 'l' },
      ]),
    ).toEqual([{ quantity: 1500, unit: 'ml' }])
  })

  it('soma medidas de cozinha convertíveis (xícara + colher de sopa)', () => {
    expect(
      consolidateQuantities([
        { quantity: 1, unit: 'xícara' },
        { quantity: 1, unit: 'colher de sopa' },
      ]),
    ).toEqual([{ quantity: 1.06, unit: 'xícara' }])
  })

  it('mantém peso e volume em linhas separadas (categorias diferentes)', () => {
    expect(
      consolidateQuantities([
        { quantity: 1, unit: 'unidade' },
        { quantity: 100, unit: 'g' },
      ]),
    ).toHaveLength(2)
  })

  it('não funde unidades de contagem distintas (1 fatia ≠ 1 unidade)', () => {
    expect(
      consolidateQuantities([
        { quantity: 1, unit: 'unidade' },
        { quantity: 1, unit: 'fatia' },
      ]),
    ).toHaveLength(2)
  })

  it('agrupa unidade desconhecida apenas por igualdade exata', () => {
    const result = consolidateQuantities([
      { quantity: 1, unit: 'pacote grande' },
      { quantity: 2, unit: 'Pacote Grande' },
      { quantity: 1, unit: 'pacote pequeno' },
    ])
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ quantity: 3, unit: 'pacote grande' })
  })

  it('ignora quantidades não numéricas', () => {
    expect(
      consolidateQuantities([
        { quantity: Number.NaN, unit: 'unidade' },
        { quantity: 2, unit: 'unidade' },
      ]),
    ).toEqual([{ quantity: 2, unit: 'unidade' }])
  })

  it('preserva a string da unidade quando preserveDisplayUnit = true', () => {
    const result = consolidateQuantities(
      [
        { quantity: 1, unit: 'Unidade' },
        { quantity: 2, unit: 'un' },
      ],
      { preserveDisplayUnit: true },
    )
    expect(result).toEqual([{ quantity: 3, unit: 'Unidade' }])
  })

  it('preserva a ordem de primeira ocorrência dos grupos', () => {
    const result = consolidateQuantities([
      { quantity: 100, unit: 'g' },
      { quantity: 1, unit: 'unidade' },
      { quantity: 50, unit: 'g' },
    ])
    expect(result.map((item) => item.unit)).toEqual(['g', 'unidade'])
    expect(result[0]).toEqual({ quantity: 150, unit: 'g' })
  })
})
