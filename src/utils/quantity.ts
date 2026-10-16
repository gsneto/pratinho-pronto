/**
 * Apresentação de quantidades em português natural.
 *
 * A lista de compras soma quantidades por ingrediente e unidade sem convertê-las
 * (ver `src/lib/shopping-list/aggregate.ts`). Aqui apenas ajustamos o texto:
 * o número em pt-BR e a unidade no singular/plural correto. Nenhuma conversão
 * de unidade é feita.
 */
const UNIT_FORMS: Record<string, readonly [singular: string, plural: string]> = {
  unidade: ['unidade', 'unidades'],
  fatia: ['fatia', 'fatias'],
  'colher de sopa': ['colher de sopa', 'colheres de sopa'],
  'colher de chá': ['colher de chá', 'colheres de chá'],
  'colher de café': ['colher de café', 'colheres de café'],
  xícara: ['xícara', 'xícaras'],
  porção: ['porção', 'porções'],
  dente: ['dente', 'dentes'],
  folha: ['folha', 'folhas'],
  pote: ['pote', 'potes'],
  filé: ['filé', 'filés'],
  pitada: ['pitada', 'pitadas'],
}

export function formatQuantity(quantity: number): string {
  return Number(quantity).toLocaleString('pt-BR')
}

/**
 * Unidades invariáveis (g, ml, kg, l…) permanecem como cadastradas; apenas as
 * unidades contáveis listadas em `UNIT_FORMS` recebem plural.
 */
export function formatQuantityWithUnit(quantity: number, unit: string): string {
  const numeric = Number(quantity)
  const trimmed = unit.trim()
  const forms = UNIT_FORMS[trimmed.toLocaleLowerCase('pt-BR')]
  const label = forms ? (numeric > 1 ? forms[1] : forms[0]) : trimmed
  return `${formatQuantity(numeric)} ${label}`
}
