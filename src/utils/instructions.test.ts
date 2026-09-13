import { describe, expect, it } from 'vitest'
import { splitInstructions } from './instructions'

describe('splitInstructions', () => {
  it('divide um parágrafo em frases numeráveis', () => {
    expect(
      splitInstructions(
        'Cozinhe a aveia com água até ficar macia. Desligue e misture a banana amassada.',
      ),
    ).toEqual([
      'Cozinhe a aveia com água até ficar macia.',
      'Desligue e misture a banana amassada.',
    ])
  })

  it('respeita passos já quebrados por linha e remove marcadores', () => {
    expect(splitInstructions('1) Lave a maçã\n2) Cozinhe no vapor\n- Amasse')).toEqual([
      'Lave a maçã',
      'Cozinhe no vapor',
      'Amasse',
    ])
  })

  it('mantém uma instrução única como um só passo', () => {
    expect(splitInstructions('Amasse a banana')).toEqual(['Amasse a banana'])
  })

  it('devolve lista vazia quando não há instrução', () => {
    expect(splitInstructions('   ')).toEqual([])
  })

  it('não quebra quando o preparo está ausente no catálogo', () => {
    expect(splitInstructions(null)).toEqual([])
    expect(splitInstructions(undefined)).toEqual([])
  })
})
