import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { Baby, IngredientCategory, MealPlan, Recipe, ShoppingList } from '../../types/domain'
import { addDays, calculateAgeMonths, formatShortDate, parseIsoDate } from '../../utils/dates'
import { splitInstructions } from '../../utils/instructions'
import {
  compareIngredientCategories,
  ingredientCategoryLabels,
  mealTypeLabels,
  mealTypeOrder,
  weekDayLabels,
} from '../../utils/labels'

/**
 * Impressão econômica: papel branco, sem blocos chapados de cor, texto em
 * cinza-escuro (legível também em impressão preto e branco) e hierarquia
 * construída por tamanho, peso e filetes — não por fundo colorido.
 */
const colors = {
  hairline: '#D8D8D0',
  ink: '#22221C',
  muted: '#55544C',
  soft: '#6E6D64',
  accent: '#5A3243',
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    color: colors.ink,
    fontFamily: 'Helvetica',
    fontSize: 10,
    // Margem generosa: nada cai na dobra nem encosta na borda de impressão.
    paddingBottom: 46,
    paddingHorizontal: 42,
    paddingTop: 40,
  },
  eyebrow: {
    color: colors.accent,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 21,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 6,
  },
  rule: {
    backgroundColor: colors.ink,
    height: 1.4,
    marginBottom: 18,
    marginTop: 14,
  },
  sectionHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    letterSpacing: 0.9,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  sectionRule: {
    backgroundColor: colors.hairline,
    height: 1,
    marginBottom: 8,
  },
  footer: {
    bottom: 22,
    color: colors.soft,
    fontSize: 7.5,
    left: 42,
    position: 'absolute',
    right: 42,
    textAlign: 'center',
  },
  /* Cardápio da semana */
  dayRow: {
    borderBottomColor: colors.hairline,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: 10,
    paddingTop: 10,
  },
  dayLabel: {
    borderRightColor: colors.hairline,
    borderRightWidth: 1,
    marginRight: 12,
    paddingRight: 10,
    width: 62,
  },
  dayName: { fontFamily: 'Helvetica-Bold', fontSize: 11 },
  dayDate: { color: colors.muted, fontSize: 8, marginTop: 3 },
  mealsGrid: {
    flexDirection: 'row',
    flexGrow: 1,
    flexWrap: 'wrap',
  },
  mealCell: {
    paddingBottom: 6,
    paddingRight: 10,
    width: '50%',
  },
  mealLabel: {
    color: colors.soft,
    fontSize: 7,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  mealName: { fontSize: 9.5, lineHeight: 1.3, marginTop: 2 },
  mealNameEmpty: { color: colors.soft, fontSize: 9.5, marginTop: 2 },
  /* Lista de compras */
  category: { marginBottom: 16 },
  categoryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10.5,
    letterSpacing: 0.9,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  categoryRule: {
    backgroundColor: colors.ink,
    height: 1,
    marginBottom: 4,
  },
  shoppingRow: {
    alignItems: 'center',
    borderBottomColor: colors.hairline,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 8,
  },
  checkbox: {
    borderColor: colors.ink,
    borderRadius: 2,
    borderWidth: 1,
    height: 12,
    marginRight: 10,
    width: 12,
  },
  shoppingName: { flexGrow: 1, fontSize: 10 },
  quantity: { color: colors.muted, fontSize: 9 },
  /* Receitas da semana */
  recipeBlock: {
    borderTopColor: colors.ink,
    borderTopWidth: 1,
    marginBottom: 20,
    paddingTop: 12,
  },
  recipeTitle: { fontFamily: 'Helvetica-Bold', fontSize: 14, letterSpacing: -0.2 },
  recipeMeta: { color: colors.muted, fontSize: 8.5, marginTop: 4 },
  columns: { flexDirection: 'row', marginTop: 12 },
  ingredientsColumn: {
    borderRightColor: colors.hairline,
    borderRightWidth: 1,
    paddingRight: 14,
    width: '36%',
  },
  instructionsColumn: { paddingLeft: 14, width: '64%' },
  sectionLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    letterSpacing: 0.9,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  ingredientLine: { fontSize: 9, lineHeight: 1.4, marginBottom: 4 },
  stepRow: { flexDirection: 'row', marginBottom: 5 },
  stepNumber: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    width: 14,
  },
  stepText: { color: colors.muted, flexGrow: 1, fontSize: 9, lineHeight: 1.5 },
  note: {
    borderLeftColor: colors.hairline,
    borderLeftWidth: 2,
    color: colors.muted,
    fontSize: 8.5,
    lineHeight: 1.45,
    marginTop: 10,
    paddingLeft: 8,
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
        <View style={styles.rule} />

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
                {mealTypeOrder.map((mealType) => {
                  const item = items.find((candidate) => candidate.meal_type === mealType)
                  return (
                    <View key={mealType} style={styles.mealCell}>
                      <Text style={styles.mealLabel}>{mealTypeLabels[mealType]}</Text>
                      {item ? (
                        <Text style={styles.mealName}>{item.recipe.name}</Text>
                      ) : (
                        <Text style={styles.mealNameEmpty}>A combinar</Text>
                      )}
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
  weekStart,
}: {
  baby: Baby
  shoppingList: ShoppingList
  weekStart?: string
}) {
  const groups = shoppingList.shopping_list_items.reduce((result, item) => {
    const category = item.ingredient.category
    result.set(category, [...(result.get(category) ?? []), item])
    return result
  }, new Map<IngredientCategory, typeof shoppingList.shopping_list_items>())
  const orderedGroups = [...groups.entries()].sort(([a], [b]) =>
    compareIngredientCategories(a, b),
  )

  return (
    <Document title={`Lista de compras de ${baby.name}`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Pratinho Pronto • Lista de compras</Text>
        <Text style={styles.title}>Compras da semana de {baby.name}</Text>
        <Text style={styles.subtitle}>
          {weekStart
            ? `Semana de ${formatShortDate(weekStart)} a ${formatShortDate(addDays(weekStart, 6))} • marque os itens no mercado.`
            : 'Marque os itens à mão enquanto percorre o mercado.'}
        </Text>
        <View style={styles.rule} />

        {orderedGroups.map(([category, items]) => (
          <View key={category} minPresenceAhead={64} style={styles.category}>
            <Text style={styles.categoryTitle}>{ingredientCategoryLabels[category]}</Text>
            <View style={styles.categoryRule} />
            {items.map((item) => (
              <View key={item.id} style={styles.shoppingRow} wrap={false}>
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
        <View style={styles.rule} />

        {uniqueRecipes.map((recipe: Recipe) => (
          <View key={recipe.id} minPresenceAhead={150} style={styles.recipeBlock}>
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
                {splitInstructions(recipe.instructions).map((step, index) => (
                  <View key={`${recipe.id}-step-${index}`} style={styles.stepRow} wrap={false}>
                    <Text style={styles.stepNumber}>{index + 1}.</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
                {recipe.serving_notes && (
                  <Text style={styles.note}>Como servir: {recipe.serving_notes}</Text>
                )}
              </View>
            </View>
          </View>
        ))}
        <PdfFooter />
      </Page>
    </Document>
  )
}
