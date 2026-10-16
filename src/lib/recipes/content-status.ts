/**
 * Distingue o conteúdo editorial do catálogo do material de demonstração.
 *
 * O campo `recipes.is_demo` marca registros que servem de fixture/prévia. No
 * ambiente de QA (`VITE_DEMO_MODE=true`) esses registros continuam
 * identificados com um selo. Na publicação real o selo não é repetido em cada
 * card, porque o catálogo é conteúdo editorial completo — e isso não afirma
 * que passou por revisão profissional.
 *
 * A possibilidade de identificar receitas não liberadas ou incompletas
 * permanece no modelo de dados (`is_active`, `is_demo` e
 * `content_review_status`), independente desta apresentação.
 */
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export function shouldShowDemoBadge(isDemo: boolean): boolean {
  return isDemo && isDemoMode
}
