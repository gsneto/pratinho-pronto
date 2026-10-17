import { fromBase, normalizeUnit, toBase, unitCategory } from '../units'

export interface UnitQuantity {
  quantity: number
  unit: string
}

interface Group {
  /** Unidade exibida do grupo (canônica ou a string da primeira ocorrência). */
  unit: string
  /** Total acumulado na unidade-base da categoria (ml, g ou 1). */
  base: number
}

export interface ConsolidateOptions {
  /**
   * Quando `false` (padrão), a unidade exibida é a forma canônica
   * ("un" -> "unidade"). Isso é o desejado ao gerar a lista, que é substituída
   * por inteiro (delete + insert) e fica limpa.
   *
   * Quando `true`, preserva a string da primeira ocorrência. Use onde o
   * resultado vai para um upsert que casa pela coluna `unit`: trocar a forma
   * canônica ali criaria uma linha órfã em vez de atualizar a existente.
   */
  preserveDisplayUnit?: boolean
}

/**
 * Consolida itens quantificados de um MESMO ingrediente em uma linha por
 * unidade compatível.
 *
 * - Resolve aliases: "un", "unidades" e "u" viram uma única linha.
 * - Soma unidades convertíveis (volume↔volume, peso↔peso) na unidade da
 *   primeira ocorrência: 1 l + 500 ml = 1,5 l.
 * - Mantém separadas unidades incompatíveis (volume × peso, contagem distinta,
 *   desconhecidas), porque somá-las exigiria uma conversão que não existe.
 * - Ignora quantidades não numéricas (NaN/Infinity) em vez de propagá-las.
 *
 * `aggregateShoppingList` e `mergeShoppingListItems` usam esta mesma função,
 * para que a lista derivada do cardápio e a soma feita ao adicionar itens
 * faltantes se comportem de forma idêntica.
 */
export function consolidateQuantities(
  entries: UnitQuantity[],
  options: ConsolidateOptions = {},
): UnitQuantity[] {
  const preserve = options.preserveDisplayUnit === true
  const groups = new Map<string, Group>()
  const order: string[] = []

  for (const entry of entries) {
    const quantity = Number(entry.quantity)
    if (!Number.isFinite(quantity)) continue

    const raw = (entry.unit ?? '').trim()
    const unit = normalizeUnit(raw)
    const category = unitCategory(unit)
    const convertible = category === 'volume' || category === 'weight'
    const key = convertible ? `category:${category}` : `unit:${unit}`
    const display = preserve ? raw || unit : unit

    const existing = groups.get(key)
    if (existing) {
      existing.base += toBase(quantity, unit)
    } else {
      groups.set(key, { unit: display, base: toBase(quantity, unit) })
      order.push(key)
    }
  }

  return order.map((key) => {
    const group = groups.get(key)!
    return { quantity: fromBase(group.base, group.unit), unit: group.unit }
  })
}
