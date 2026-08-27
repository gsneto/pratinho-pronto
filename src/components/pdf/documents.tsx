import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { Baby, MealPlan, Recipe, ShoppingList } from '../../types/domain'
import { addDays, calculateAgeMonths, formatShortDate, parseIsoDate } from '../../utils/dates'
import {
  ingredientCategoryLabels,
  mealTypeLabels,
  weekDayLabels,
} from '../../utils/labels'

const colors = {
  cream: '#F3F5EE',
  ink: '#2A2A22',
  muted: '#726F63',
  sage: '#5F7052',
  sageLight: '#E8EDE3',
  terracotta: '#8C3A56',
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FDFCF9',
    color: colors.ink,
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingBottom: 34,
    paddingHorizontal: 36,
    paddingTop: 34,
  },
  eyebrow: {
    color: colors.terracotta,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.2,
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 6,
  },
  divider: {
    backgroundColor: colors.cream,
    height: 1,
    marginBottom: 16,
    marginTop: 16,
  },
  footer: {
    bottom: 16,
    color: colors.muted,
    fontSize: 7,
    left: 36,
    position: 'absolute',
    right: 36,
    textAlign: 'center',
  },
  dayRow: {
    borderBottomColor: colors.cream,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  dayLabel: {
    backgroundColor: colors.sageLight,
    borderRadius: 7,
    color: colors.sage,
    marginRight: 10,
    padding: 8,
    width: 58,
  },
  dayName: { fontSize: 10, fontWeight: 700 },
  dayDate: { color: colors.muted, fontSize: 7, marginTop: 3 },
  mealsGrid: {
    flexDirection: 'row',
    flexGrow: 1,
    flexWrap: 'wrap',
  },
  mealCell: {
    paddingBottom: 3,
    paddingHorizontal: 5,
    width: '50%',
  },
  mealLabel: {
    color: colors.terracotta,
    fontSize: 6.5,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  mealName: { fontSize: 8.5, marginTop: 2 },
  category: { marginBottom: 14 },
  categoryTitle: {
    backgroundColor: colors.sageLight,
    borderRadius: 6,
    color: colors.sage,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    textTransform: 'uppercase',
  },
  shoppingRow: {
    alignItems: 'center',
    borderBottomColor: colors.cream,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 5,
    paddingVertical: 7,
  },
  checkbox: {
    borderColor: colors.sage,
    borderRadius: 2,
    borderWidth: 1,
    height: 11,
    marginRight: 8,
    width: 11,
  },
  shoppingName: { flexGrow: 1, fontSize: 9 },
  quantity: { color: colors.muted, fontSize: 8 },
  recipeBlock: {
    borderBottomColor: colors.cream,
    borderBottomWidth: 1,
    marginBottom: 18,
    paddingBottom: 14,
  },
  recipeTitle: { fontSize: 15, fontWeight: 700 },
  recipeMeta: { color: colors.muted, fontSize: 8, marginTop: 4 },
  columns: { flexDirection: 'row', marginTop: 10 },
  ingredientsColumn: { paddingRight: 12, width: '38%' },
  instructionsColumn: { paddingLeft: 12, width: '62%' },
  sectionLabel: {
    color: colors.sage,
    fontSize: 8,
    fontWeight: 700,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  ingredientLine: { fontSize: 8, marginBottom: 3 },
  bodyText: { color: colors.muted, fontSize: 8.5, lineHeight: 1.45 },
  note: {
    backgroundColor: colors.sageLight,
    borderRadius: 6,
    color: colors.muted,
    fontSize: 7.5,
    marginTop: 8,
    padding: 7,
  },
})

function PdfFooter() {
  return (
    <Text fixed style={styles.footer}>
      Pratinho Pronto • Ferramenta de organização alimentar • Não substitui pediatra ou nutricionista
    </Text>
  )
}

export function WeekPlanDocument({ baby, plan }: { baby: Baby; plan: MealPlan }) {
  return (
    <Document title={`Cardápio da semana de ${baby.name}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Pratinho Pronto • Minha semana</Text>
        <Text style={styles.title}>Cardápio da semana de {baby.name}</Text>
        <Text style={styles.subtitle}>
          {calculateAgeMonths(baby.birth_date, parseIsoDate(plan.week_start))} meses •{' '}
          {formatShortDate(plan.week_start)} a {formatShortDate(addDays(plan.week_start, 6))}
        </Text>
        <View style={styles.divider} />

        {weekDayLabels.map((day, index) => {
          const date = addDays(plan.week_start, index)
          const items = plan.meal_plan_items.filter((item) => item.date === date)
          return (
            <View key={date} style={styles.dayRow} wrap={false}>
              <View style={styles.dayLabel}>
                <Text style={styles.dayName}>{day}</Text>
                <Text style={styles.dayDate}>{formatShortDate(date)}</Text>
              </View>
              <View style={styles.mealsGrid}>
                {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((mealType) => {
                  const item = items.find((candidate) => candidate.meal_type === mealType)
                  return (
                    <View key={mealType} style={styles.mealCell}>
                      <Text style={styles.mealLabel}>{mealTypeLabels[mealType]}</Text>
                      <Text style={styles.mealName}>{item?.recipe.name ?? '—'}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )
        })}
        <PdfFooter />
      </Page>
    </Document>
  )
}

export function ShoppingListDocument({
  baby,
  shoppingList,
}: {
  baby: Baby
  shoppingList: ShoppingList
}) {
  const groups = shoppingList.shopping_list_items.reduce((result, item) => {
    const category = item.ingredient.category
    result.set(category, [...(result.get(category) ?? []), item])
    return result
  }, new Map<string, typeof shoppingList.shopping_list_items>())

  return (
    <Document title={`Lista de compras de ${baby.name}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Pratinho Pronto • Lista de compras</Text>
        <Text style={styles.title}>Compras da semana de {baby.name}</Text>
        <Text style={styles.subtitle}>Marque os itens à mão enquanto percorre o mercado.</Text>
        <View style={styles.divider} />

        {[...groups.entries()].map(([category, items]) => (
          <View key={category} style={styles.category} wrap={false}>
            <Text style={styles.categoryTitle}>
              {ingredientCategoryLabels[category as keyof typeof ingredientCategoryLabels]}
            </Text>
            {items.map((item) => (
              <View key={item.id} style={styles.shoppingRow}>
                <View style={styles.checkbox} />
                <Text style={styles.shoppingName}>{item.ingredient.name}</Text>
                <Text style={styles.quantity}>
                  {Number(item.quantity).toLocaleString('pt-BR')} {item.unit}
                </Text>
              </View>
            ))}
          </View>
        ))}
        <PdfFooter />
      </Page>
    </Document>
  )
}

export function WeeklyRecipesDocument({
  baby,
  plan,
}: {
  baby: Baby
  plan: MealPlan
}) {
  const uniqueRecipes = [
    ...new Map(
      plan.meal_plan_items.map((item) => [item.recipe.id, item.recipe] as const),
    ).values(),
  ]

  return (
    <Document title={`Receitas da semana de ${baby.name}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Pratinho Pronto • Receitas da semana</Text>
        <Text style={styles.title}>Receitas da semana de {baby.name}</Text>
        <Text style={styles.subtitle}>{uniqueRecipes.length} receitas únicas do seu cardápio.</Text>
        <View style={styles.divider} />

        {uniqueRecipes.map((recipe: Recipe) => (
          <View key={recipe.id} style={styles.recipeBlock} wrap={false}>
            <Text style={styles.recipeTitle}>{recipe.name}</Text>
            <Text style={styles.recipeMeta}>
              {mealTypeLabels[recipe.meal_type]} • {recipe.prep_time_minutes} min • A partir de {recipe.min_age_months} meses
            </Text>
            <View style={styles.columns}>
              <View style={styles.ingredientsColumn}>
                <Text style={styles.sectionLabel}>Ingredientes</Text>
                {recipe.recipe_ingredients.map((item) => (
                  <Text key={item.id} style={styles.ingredientLine}>
                    {Number(item.quantity).toLocaleString('pt-BR')} {item.unit} de {item.ingredient.name}
                  </Text>
                ))}
              </View>
              <View style={styles.instructionsColumn}>
                <Text style={styles.sectionLabel}>Preparo</Text>
                <Text style={styles.bodyText}>{recipe.instructions}</Text>
                {recipe.serving_notes && <Text style={styles.note}>Como servir: {recipe.serving_notes}</Text>}
              </View>
            </View>
          </View>
        ))}
        <PdfFooter />
      </Page>
    </Document>
  )
}
