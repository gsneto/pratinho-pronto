/**
 * Estado de revisão do conteúdo editorial do catálogo.
 *
 * Distingue o que passou por revisão profissional (idade, textura, cortes,
 * alergênicos) do que ainda está pendente. NÃO é uma alegação de validação
 * clínica nem substitui a avaliação individual de pediatra ou nutricionista —
 * apenas registra se a revisão editorial aconteceu. Nunca marcamos algo como
 * revisado sem que o dado diga isso.
 */
export type RecipeReviewStatus = 'pending_professional_review' | 'reviewed'

export function normalizeReviewStatus(value: unknown): RecipeReviewStatus | null {
  return value === 'reviewed' || value === 'pending_professional_review' ? value : null
}

export function reviewStatusLabel(status: RecipeReviewStatus): string {
  return status === 'reviewed'
    ? 'Revisão profissional concluída'
    : 'Pendente de revisão profissional'
}

export function reviewStatusDetail(status: RecipeReviewStatus): string {
  return status === 'reviewed'
    ? 'Idade, textura, cortes e alergênicos foram revisados por profissional qualificado.'
    : 'Idade, textura, cortes e alergênicos ainda aguardam revisão de nutricionista ou pediatra.'
}
