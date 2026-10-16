import { describe, expect, it } from 'vitest'
import { normalizeReviewStatus, reviewStatusDetail, reviewStatusLabel } from './review'

describe('normalizeReviewStatus', () => {
  it('aceita apenas os estados conhecidos', () => {
    expect(normalizeReviewStatus('reviewed')).toBe('reviewed')
    expect(normalizeReviewStatus('pending_professional_review')).toBe('pending_professional_review')
  })

  it('descarta valores desconhecidos, nulos ou ausentes', () => {
    expect(normalizeReviewStatus('approved')).toBeNull()
    expect(normalizeReviewStatus(null)).toBeNull()
    expect(normalizeReviewStatus(undefined)).toBeNull()
    expect(normalizeReviewStatus(42)).toBeNull()
  })
})

describe('rótulos de revisão', () => {
  it('distingue pendente de revisado', () => {
    expect(reviewStatusLabel('reviewed')).not.toBe(reviewStatusLabel('pending_professional_review'))
    expect(reviewStatusDetail('reviewed')).not.toBe(reviewStatusDetail('pending_professional_review'))
  })

  it('não afirma validação clínica', () => {
    for (const status of ['reviewed', 'pending_professional_review'] as const) {
      expect(reviewStatusDetail(status).toLowerCase()).not.toContain('validação clínica')
      expect(reviewStatusDetail(status).toLowerCase()).not.toContain('aprovado')
    }
  })
})
