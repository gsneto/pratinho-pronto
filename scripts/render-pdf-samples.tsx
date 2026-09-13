import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createPdfBlob } from '../src/components/pdf/createPdf'
import type {
  Baby,
  IngredientCategory,
  MealPlan,
  MealType,
  Recipe,
  ShoppingList,
} from '../src/types/domain'
import { addDays } from '../src/utils/dates'

const baby = {
  id: 'baby-sample',
  name: 'Aurora',
  birth_date: '2025-12-20',
} as Baby

const recipeDefinitions: Array<[
  string,
  MealType,
  string,
  IngredientCategory,
]> = [
  ['Mingau de banana e aveia', 'breakfast', 'Banana', 'fruit'],
  ['Creme de maçã com aveia', 'breakfast', 'Maçã', 'fruit'],
  ['Frango com batata e cenoura', 'lunch', 'Frango', 'protein'],
  ['Arroz com lentilha e abóbora', 'lunch', 'Lentilha', 'protein'],
  ['Banana com abacate', 'snack', 'Abacate', 'fruit'],
  ['Mamão com iogurte natural', 'snack', 'Iogurte natural', 'dairy'],
  ['Creme de abóbora com arroz', 'dinner', 'Abóbora', 'vegetable'],
  ['Feijão com cenoura e arroz', 'dinner', 'Feijão', 'protein'],
]

const recipes: Recipe[] = recipeDefinitions.map(
  ([name, mealType, ingredientName, category], index) =>
    ({
      id: `recipe-${index}`,
      instructions:
        'Cozinhe os ingredientes até ficarem macios. Ajuste a textura à fase do bebê e espere amornar antes de servir.',
      meal_type: mealType,
      min_age_months: 6,
      name,
      prep_time_minutes: 15 + index,
      recipe_allergens: [],
      recipe_ingredients: [
        {
          id: `ri-${index}-1`,
          ingredient_id: `ingredient-${index}`,
          is_optional: false,
          quantity: 1,
          unit: index % 2 === 0 ? 'unidade' : 'colher de sopa',
          ingredient: {
            id: `ingredient-${index}`,
            name: ingredientName,
            category,
          },
        },
        {
          id: `ri-${index}-2`,
          ingredient_id: 'water',
          is_optional: false,
          quantity: 100,
          unit: 'ml',
          ingredient: { id: 'water', name: 'Água', category: 'other' },
        },
      ],
      serving_notes: 'Sirva em formato e textura adequados para a fase atual.',
    }) as Recipe,
)

const planItems = Array.from({ length: 7 }).flatMap((_, dayIndex) =>
  (['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map(
    (mealType, mealIndex) => {
      const compatibleRecipes = recipes.filter(
        (recipe) => recipe.meal_type === mealType,
      )
      const recipe = compatibleRecipes[dayIndex % compatibleRecipes.length]
      return {
        date: addDays('2026-08-24', dayIndex),
        id: `item-${dayIndex}-${mealIndex}`,
        meal_plan_id: 'plan-sample',
        meal_type: mealType,
        position: 0,
        recipe,
        recipe_id: recipe.id,
      }
    },
  ),
)

const plan = {
  id: 'plan-sample',
  baby_id: baby.id,
  week_start: '2026-08-24',
  meal_plan_items: planItems,
} as MealPlan

const uniqueIngredients = new Map(
  recipes.flatMap((recipe) =>
    recipe.recipe_ingredients.map((item) => [item.ingredient.id, item.ingredient] as const),
  ),
)

const shoppingList = {
  id: 'shopping-sample',
  meal_plan_id: plan.id,
  shopping_list_items: [...uniqueIngredients.values()].map((ingredient, index) => ({
    checked: false,
    id: `shopping-${index}`,
    ingredient,
    ingredient_id: ingredient.id,
    quantity: index === 8 ? 2800 : 2 + index,
    shopping_list_id: 'shopping-sample',
    unit: index === 8 ? 'ml' : 'unidade',
  })),
} as ShoppingList

const outputDirectory = resolve('output/pdf')
await mkdir(outputDirectory, { recursive: true })

const outputs = [
  {
    filename: 'cardapio-semana-exemplo.pdf',
    blob: await createPdfBlob({ baby, kind: 'week', plan, weekStart: plan.week_start }),
  },
  {
    filename: 'lista-compras-exemplo.pdf',
    blob: await createPdfBlob({
      baby,
      kind: 'shopping',
      shoppingList,
      weekStart: plan.week_start,
    }),
  },
  {
    filename: 'receitas-semana-exemplo.pdf',
    blob: await createPdfBlob({ baby, kind: 'recipes', plan, weekStart: plan.week_start }),
  },
]

for (const output of outputs) {
  const target = resolve(outputDirectory, output.filename)
  await writeFile(target, Buffer.from(await output.blob.arrayBuffer()))
  console.log(target)
}
