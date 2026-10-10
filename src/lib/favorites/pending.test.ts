import { describe, expect, it } from 'vitest'
import {
  appliedPending,
  applyFavoritePending,
  clearPending,
  recordPending,
} from './pending'

describe('applyFavoritePending', () => {
  it('adiciona e remove itens conforme a fila', () => {
    expect(applyFavoritePending(['a', 'b'], { b: false, c: true }).sort()).toEqual(['a', 'c'])
  })

  it('uma remoção pendente esconde um item que ainda exista na base', () => {
    expect(applyFavoritePending(['a'], { a: false })).toEqual([])
  })

  it('sem pendências devolve a base', () => {
    expect(applyFavoritePending(['a', 'b'], {})).toEqual(['a', 'b'])
  })
})

describe('recordPending / clearPending', () => {
  it('a última intenção vence', () => {
    const pending = recordPending(recordPending({}, 'a', true), 'a', false)
    expect(pending).toEqual({ a: false })
  })

  it('clearPending remove só o item indicado', () => {
    expect(clearPending({ a: true, b: false }, 'a')).toEqual({ b: false })
  })
})

describe('appliedPending', () => {
  it('mantém apenas as operações aplicadas com sucesso', () => {
    const pending = { a: true, b: false, c: true }
    const remaining = { b: false }
    expect(appliedPending(pending, remaining)).toEqual({ a: true, c: true })
  })
})
