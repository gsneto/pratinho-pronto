/**
 * Normalização e conversão de unidades de medida (pt-BR).
 *
 * O catálogo do Pratinho Pronto grava a unidade como texto livre
 * (`recipe_ingredients.unit`, `shopping_list_items.unit`). Isso faz variantes
 * do MESMO conceito conviverem - "unidade", "unidades", "un" e "u" são quatro
 * strings diferentes para a mesma coisa, e a lista de compras as mostrava em
 * linhas separadas.
 *
 * Este módulo resolve o alias para uma forma canônica e expõe a conversão entre
 * unidades da mesma natureza (volume↔volume, peso↔peso). Contagem e unidades
 * desconhecidas NUNCA são convertidas entre si - "1 fatia" não é "1 unidade".
 *
 * Abordagem inspirada em dois projetos MIT (ver docs/OPEN_SOURCE_ATTRIBUTIONS.md):
 * `craigcossairt/hestia` (lib/grocery/units.ts) e `jpdevries/pantry-host`
 * (packages/shared/src/units.ts). A implementação é própria, com o vocabulário
 * de cozinha em português usado pelo produto.
 */

export type UnitCategory = 'volume' | 'weight' | 'count' | 'other'

interface UnitDef {
  category: UnitCategory
  /** Quantos "base units" (ml, g ou 1) há em 1 desta unidade. */
  factor: number
}

const UNITS: Record<string, UnitDef> = {
  // Volume - base = ml.
  ml: { category: 'volume', factor: 1 },
  l: { category: 'volume', factor: 1000 },
  'colher de sopa': { category: 'volume', factor: 15 },
  'colher de chá': { category: 'volume', factor: 5 },
  'colher de café': { category: 'volume', factor: 2.5 },
  xícara: { category: 'volume', factor: 240 },
  // Peso - base = g.
  g: { category: 'weight', factor: 1 },
  kg: { category: 'weight', factor: 1000 },
  mg: { category: 'weight', factor: 0.001 },
  // Contagem - unidades distintas entre si; só se agrupam quando o nome
  // canônico coincide (via alias). Nunca convertidas uma na outra.
  unidade: { category: 'count', factor: 1 },
  fatia: { category: 'count', factor: 1 },
  dente: { category: 'count', factor: 1 },
  folha: { category: 'count', factor: 1 },
  pote: { category: 'count', factor: 1 },
  filé: { category: 'count', factor: 1 },
  pitada: { category: 'count', factor: 1 },
  porção: { category: 'count', factor: 1 },
}

/** Variantes de digitação -> unidade canônica. Comparadas sem acento e sem caixa. */
const ALIASES: Record<string, string> = {
  un: 'unidade',
  u: 'unidade',
  und: 'unidade',
  unid: 'unidade',
  uni: 'unidade',
  unidades: 'unidade',
  grama: 'g',
  gramas: 'g',
  gr: 'g',
  quilo: 'kg',
  quilos: 'kg',
  quilograma: 'kg',
  quilogramas: 'kg',
  miligrama: 'mg',
  miligramas: 'mg',
  mililitro: 'ml',
  mililitros: 'ml',
  mls: 'ml',
  litro: 'l',
  litros: 'l',
  lt: 'l',
  'colheres de sopa': 'colher de sopa',
  'c. sopa': 'colher de sopa',
  'c sopa': 'colher de sopa',
  'col sopa': 'colher de sopa',
  cs: 'colher de sopa',
  'colheres de chá': 'colher de chá',
  'c. chá': 'colher de chá',
  'c chá': 'colher de chá',
  'col cha': 'colher de chá',
  cc: 'colher de chá',
  'colheres de café': 'colher de café',
  'c. café': 'colher de café',
  xícaras: 'xícara',
  xicara: 'xícara',
  xicaras: 'xícara',
  fatias: 'fatia',
  dentes: 'dente',
  folhas: 'folha',
  potes: 'pote',
  filés: 'filé',
  file: 'filé',
  files: 'filé',
  pitadas: 'pitada',
  porções: 'porção',
  porcao: 'porção',
  porcoes: 'porção',
}

function clean(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\.+$/, '')
}

function deaccent(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const LOOKUP: Record<string, string> = (() => {
  const table: Record<string, string> = {}
  for (const canonical of Object.keys(UNITS)) table[deaccent(canonical)] = canonical
  for (const [alias, canonical] of Object.entries(ALIASES)) table[deaccent(clean(alias))] = canonical
  return table
})()

/**
 * Resolve uma unidade para a forma canônica do produto.
 *
 * - "un", "u", "unidades" -> "unidade"
 * - "gramas", "gr"        -> "g"
 * - "colheres de sopa"    -> "colher de sopa"
 * - "xicara"              -> "xícara"
 *
 * Unidade desconhecida é devolvida apenas normalizada (minúscula, sem espaços
 * extras, sem ponto final) - nunca inventamos uma equivalência.
 */
export function normalizeUnit(unit: string | null | undefined): string {
  if (!unit) return ''
  const cleaned = clean(unit)
  if (!cleaned) return ''
  return LOOKUP[deaccent(cleaned)] ?? cleaned
}

/** Categoria da unidade. Desconhecida -> 'other'. */
export function unitCategory(unit: string | null | undefined): UnitCategory {
  const canonical = normalizeUnit(unit)
  return UNITS[canonical]?.category ?? 'other'
}

/** Fator para a unidade-base da categoria (ml, g ou 1). Desconhecida -> 1. */
export function toBase(quantity: number, unit: string | null | undefined): number {
  const def = UNITS[normalizeUnit(unit)]
  return quantity * (def?.factor ?? 1)
}

/** Converte da unidade-base de volta para `unit`, arredondando ruído de ponto flutuante. */
export function fromBase(base: number, unit: string | null | undefined): number {
  const def = UNITS[normalizeUnit(unit)]
  return round(base / (def?.factor ?? 1))
}

/**
 * Converte `quantity` de `fromUnit` para `toUnit`.
 *
 * Devolve `null` quando a conversão não é válida: unidade ausente/desconhecida,
 * categorias diferentes (volume vs peso) ou contagem (1 fatia ≠ 1 unidade).
 * Mesma unidade canônica devolve a quantidade inalterada.
 */
export function convert(
  quantity: number,
  fromUnit: string | null | undefined,
  toUnit: string | null | undefined,
): number | null {
  const from = normalizeUnit(fromUnit)
  const to = normalizeUnit(toUnit)
  if (!from || !to) return null
  if (from === to) return quantity

  const fromDef = UNITS[from]
  const toDef = UNITS[to]
  if (!fromDef || !toDef) return null
  if (fromDef.category !== toDef.category) return null
  if (fromDef.category !== 'volume' && fromDef.category !== 'weight') return null

  return (quantity * fromDef.factor) / toDef.factor
}

/** Duas unidades podem ser somadas? (mesma canônica ou conversão válida) */
export function unitsComparable(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const an = normalizeUnit(a)
  const bn = normalizeUnit(b)
  if (!an && !bn) return true
  if (!an || !bn) return false
  if (an === bn) return true
  return convert(1, an, bn) !== null
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
