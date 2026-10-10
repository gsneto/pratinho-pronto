import type { Recipe } from '../../types/domain'
import { normalizeTerm } from '../../utils/text'

/**
 * Classificação dietética dos ingredientes para restrições suportadas.
 *
 * É uma classificação editorial explícita do catálogo atual (36 ingredientes),
 * chaveada pelo nome normalizado do ingrediente — não é uma lista de palavras
 * soltas nem uma alegação nutricional. Ingredientes fora do mapa são tratados
 * como `unknown` e, sob uma restrição ativa, considerados NÃO seguros
 * (comportamento conservador).
 *
 * Isto NÃO substitui avaliação profissional nem comprova ausência de alérgenos.
 */
export type IngredientDiet = 'animal_flesh' | 'animal_product' | 'plant' | 'unknown'

const DIET_BY_INGREDIENT: Record<string, IngredientDiet> = {
  // Chaves já normalizadas (sem acento, minúsculas), como em normalizeTerm.
  // Carnes e peixes (flesh)
  'carne bovina': 'animal_flesh',
  frango: 'animal_flesh',
  peixe: 'animal_flesh',
  peru: 'animal_flesh',
  // Ovos e laticínios (animal_product)
  ovo: 'animal_product',
  'iogurte natural': 'animal_product',
  // Frutas
  abacate: 'plant',
  banana: 'plant',
  maca: 'plant',
  mamao: 'plant',
  manga: 'plant',
  melao: 'plant',
  pera: 'plant',
  pessego: 'plant',
  // Legumes e verduras
  abobora: 'plant',
  abobrinha: 'plant',
  batata: 'plant',
  'batata-doce': 'plant',
  beterraba: 'plant',
  brocolis: 'plant',
  cenoura: 'plant',
  couve: 'plant',
  ervilha: 'plant',
  espinafre: 'plant',
  mandioca: 'plant',
  // Grãos e cereais
  arroz: 'plant',
  aveia: 'plant',
  chia: 'plant',
  'flocao de milho': 'plant',
  'pao integral': 'plant',
  polenta: 'plant',
  quinoa: 'plant',
  // Leguminosas (proteína vegetal)
  feijao: 'plant',
  'grao-de-bico': 'plant',
  lentilha: 'plant',
  // Outros
  agua: 'plant',
}

export function classifyIngredient(name: string): IngredientDiet {
  return DIET_BY_INGREDIENT[normalizeTerm(name)] ?? 'unknown'
}

export interface DietaryRule {
  /** Rótulos de origem excluídos (ex.: carne, ovo/laticínio). */
  excludes: Set<IngredientDiet>
  /** Termo reconhecido no perfil, para mensagens. */
  label: string
}

const VEGETARIAN_TOKENS = new Set(['vegetariano', 'vegetariana', 'vegetarian'])
const VEGAN_TOKENS = new Set(['vegano', 'vegana', 'vegan'])

/**
 * Reconhece restrições dietéticas suportadas a partir do texto livre do perfil.
 * Só tokens explícitos são reconhecidos; termos ambíguos (ex.: "sem carne") não
 * são interpretados para não presumir uma regra não solicitada.
 */
export function parseDietaryRestrictions(restrictions: string[]): DietaryRule | null {
  const tokens = restrictions.map(normalizeTerm)
  if (tokens.some((token) => VEGAN_TOKENS.has(token))) {
    return { excludes: new Set<IngredientDiet>(['animal_flesh', 'animal_product']), label: 'vegano' }
  }
  if (tokens.some((token) => VEGETARIAN_TOKENS.has(token))) {
    return { excludes: new Set<IngredientDiet>(['animal_flesh']), label: 'vegetariano' }
  }
  return null
}

/**
 * Uma receita viola a regra se algum ingrediente estiver na categoria excluída
 * ou não puder ser classificado (conservador).
 */
export function recipeViolatesDiet(recipe: Recipe, rule: DietaryRule): boolean {
  return recipe.recipe_ingredients.some((item) => {
    const diet = classifyIngredient(item.ingredient.name)
    if (diet === 'unknown') return true
    return rule.excludes.has(diet)
  })
}
