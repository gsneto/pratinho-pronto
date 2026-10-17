import { describe, expect, it } from 'vitest'
import {
  convert,
  fromBase,
  normalizeUnit,
  toBase,
  unitCategory,
  unitsComparable,
} from './index'

describe('normalizeUnit', () => {
  it('resolve apelidos de contagem para "unidade"', () => {
    for (const raw of ['un', 'u', 'und', 'unid', 'UNIDADE', 'unidades', ' Unidade ']) {
      expect(normalizeUnit(raw)).toBe('unidade')
    }
  })

  it('resolve apelidos de peso e volume', () => {
    expect(normalizeUnit('gramas')).toBe('g')
    expect(normalizeUnit('gr')).toBe('g')
    expect(normalizeUnit('grama')).toBe('g')
    expect(normalizeUnit('quilos')).toBe('kg')
    expect(normalizeUnit('mililitros')).toBe('ml')
    expect(normalizeUnit('litros')).toBe('l')
    expect(normalizeUnit('lt')).toBe('l')
  })

  it('resolve o plural das colheres e da xícara', () => {
    expect(normalizeUnit('colheres de sopa')).toBe('colher de sopa')
    expect(normalizeUnit('Colher de Sopa')).toBe('colher de sopa')
    expect(normalizeUnit('colheres de chá')).toBe('colher de chá')
    expect(normalizeUnit('colher de cha')).toBe('colher de chá')
    expect(normalizeUnit('xícaras')).toBe('xícara')
    expect(normalizeUnit('xicara')).toBe('xícara')
  })

  it('remove acento e ponto final', () => {
    expect(normalizeUnit('un.')).toBe('unidade')
    expect(normalizeUnit('FILÉS')).toBe('filé')
    expect(normalizeUnit('porcoes')).toBe('porção')
  })

  it('mantém unidades desconhecidas apenas normalizadas (sem inventar)', () => {
    expect(normalizeUnit('pacote grande')).toBe('pacote grande')
    expect(normalizeUnit('  Pacote   Grande ')).toBe('pacote grande')
  })

  it('trata vazio e nulo', () => {
    expect(normalizeUnit('')).toBe('')
    expect(normalizeUnit('   ')).toBe('')
    expect(normalizeUnit(null)).toBe('')
    expect(normalizeUnit(undefined)).toBe('')
  })
})

describe('unitCategory', () => {
  it('classifica volume, peso, contagem e outros', () => {
    expect(unitCategory('ml')).toBe('volume')
    expect(unitCategory('colher de sopa')).toBe('volume')
    expect(unitCategory('g')).toBe('weight')
    expect(unitCategory('kg')).toBe('weight')
    expect(unitCategory('unidade')).toBe('count')
    expect(unitCategory('fatia')).toBe('count')
    expect(unitCategory('pacote grande')).toBe('other')
  })
})

describe('convert', () => {
  it('converte dentro de volume', () => {
    expect(convert(1, 'l', 'ml')).toBe(1000)
    expect(convert(15, 'ml', 'colher de sopa')).toBe(1)
    expect(convert(1, 'xícara', 'ml')).toBe(240)
  })

  it('converte dentro de peso', () => {
    expect(convert(1, 'kg', 'g')).toBe(1000)
    expect(convert(500, 'g', 'kg')).toBe(0.5)
  })

  it('não converte entre categorias diferentes', () => {
    expect(convert(1, 'g', 'ml')).toBeNull()
    expect(convert(1, 'unidade', 'g')).toBeNull()
  })

  it('não converte unidades de contagem distintas (1 fatia ≠ 1 unidade)', () => {
    expect(convert(1, 'unidade', 'fatia')).toBeNull()
  })

  it('mesma unidade devolve a quantidade', () => {
    expect(convert(3, 'unidade', 'unidades')).toBe(3)
    expect(convert(2, 'g', 'gramas')).toBe(2)
  })

  it('devolve null para unidade desconhecida', () => {
    expect(convert(1, 'pacote grande', 'g')).toBeNull()
  })
})

describe('unitsComparable', () => {
  it('é verdadeiro para a mesma unidade canônica', () => {
    expect(unitsComparable('un', 'unidades')).toBe(true)
  })

  it('é verdadeiro para unidades convertíveis', () => {
    expect(unitsComparable('l', 'ml')).toBe(true)
    expect(unitsComparable('kg', 'g')).toBe(true)
  })

  it('é falso entre categorias diferentes', () => {
    expect(unitsComparable('g', 'ml')).toBe(false)
    expect(unitsComparable('unidade', 'fatia')).toBe(false)
  })
})

describe('toBase / fromBase', () => {
  it('ida e volta preserva o valor', () => {
    expect(fromBase(toBase(1.5, 'l'), 'l')).toBe(1.5)
    expect(fromBase(toBase(250, 'ml'), 'ml')).toBe(250)
    expect(fromBase(toBase(2, 'colher de sopa'), 'colher de sopa')).toBe(2)
  })

  it('converte para a unidade-base correta', () => {
    expect(toBase(1, 'l')).toBe(1000)
    expect(toBase(1, 'kg')).toBe(1000)
    expect(toBase(1, 'unidade')).toBe(1)
    expect(toBase(1, 'pacote grande')).toBe(1)
  })
})
