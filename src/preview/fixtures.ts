/**
 * Dados fictícios da área de prévia.
 * Idênticos nas três propostas para que a comparação seja apenas de design.
 * Nenhum acesso a Supabase, autenticação, analytics ou rede.
 */

export type PreviewMealType = 'breakfast' | 'lunch' | 'snack' | 'dinner'

export interface PreviewMeal {
  id: string
  mealType: PreviewMealType
  /** Nome idêntico ao mapa de fotos, para a foto real aparecer na prévia. */
  recipeName: string
  prepTimeMinutes: number
  minAgeMonths: number
  texture: string
}

export interface PreviewDay {
  date: string
  dayLabel: string
  shortDate: string
  meals: PreviewMeal[]
}

export const previewMealTypeLabels: Record<PreviewMealType, string> = {
  breakfast: 'Café da manhã',
  dinner: 'Jantar',
  lunch: 'Almoço',
  snack: 'Lanche',
}

export const previewMealTypeOrder: PreviewMealType[] = [
  'breakfast',
  'lunch',
  'snack',
  'dinner',
]

export const previewBabyName = 'Alice'

export const previewWeek = {
  start: '2026-09-14',
  end: '2026-09-20',
  label: '14 de set a 20 de set',
  shortLabel: '14 set – 20 set',
  isCurrentWeek: true,
  /** Data tratada como “hoje” na prévia, para o destaque ser determinístico. */
  todayDate: '2026-09-16',
}

interface RawDay {
  date: string
  dayLabel: string
  shortDate: string
  meals: [string, string, string, string]
}

const rawDays: RawDay[] = [
  {
    date: '2026-09-14',
    dayLabel: 'Segunda',
    shortDate: '14 set',
    meals: [
      'Mingau de banana e aveia',
      'Frango com batata e cenoura',
      'Maçã cozida com chia',
      'Creme de abóbora com arroz',
    ],
  },
  {
    date: '2026-09-15',
    dayLabel: 'Terça',
    shortDate: '15 set',
    meals: [
      'Iogurte natural com banana e aveia',
      'Carne com batata e beterraba',
      'Pera com iogurte natural',
      'Sopa espessa de lentilha e batata',
    ],
  },
  {
    date: '2026-09-16',
    dayLabel: 'Quarta',
    shortDate: '16 set',
    meals: [
      'Aveia cremosa com manga',
      'Grão-de-bico com cenoura e quinoa',
      'Melão com banana amassada',
      'Peixe com abóbora e quinoa',
    ],
  },
  {
    date: '2026-09-17',
    dayLabel: 'Quinta',
    shortDate: '17 set',
    meals: [
      'Cuscuz macio com ovo',
      'Peru com arroz e beterraba',
      'Mamão com aveia macia',
      'Feijão com abóbora e arroz',
    ],
  },
  {
    date: '2026-09-18',
    dayLabel: 'Sexta',
    shortDate: '18 set',
    meals: [
      'Panquequinha de banana',
      'Frango com batata-doce e couve',
      'Manga com chia hidratada',
      'Quinoa com legumes macios',
    ],
  },
  {
    date: '2026-09-19',
    dayLabel: 'Sábado',
    shortDate: '19 set',
    meals: [
      'Creme de maçã com aveia',
      'Carne com polenta e espinafre',
      'Pera cozida com chia hidratada',
      'Lentilha com batata-doce e couve',
    ],
  },
  {
    date: '2026-09-20',
    dayLabel: 'Domingo',
    shortDate: '20 set',
    meals: [
      'Bolinho macio de banana e aveia',
      'Peixe com arroz e cenoura',
      'Pêssego cozido com aveia',
      'Sopa rústica de batata e ervilha',
    ],
  },
]

const prepTimeByRecipe: Record<string, number> = {
  'Aveia cremosa com manga': 10,
  'Bolinho macio de banana e aveia': 25,
  'Carne com batata e beterraba': 35,
  'Carne com polenta e espinafre': 30,
  'Creme de abóbora com arroz': 25,
  'Creme de maçã com aveia': 12,
  'Cuscuz macio com ovo': 15,
  'Feijão com abóbora e arroz': 30,
  'Frango com batata e cenoura': 30,
  'Frango com batata-doce e couve': 30,
  'Grão-de-bico com cenoura e quinoa': 28,
  'Iogurte natural com banana e aveia': 5,
  'Lentilha com batata-doce e couve': 30,
  'Maçã cozida com chia': 12,
  'Mamão com aveia macia': 8,
  'Manga com chia hidratada': 8,
  'Melão com banana amassada': 5,
  'Mingau de banana e aveia': 12,
  'Panquequinha de banana': 18,
  'Peixe com abóbora e quinoa': 25,
  'Peixe com arroz e cenoura': 25,
  'Pera com iogurte natural': 6,
  'Pera cozida com chia hidratada': 14,
  'Peru com arroz e beterraba': 32,
  'Pêssego cozido com aveia': 12,
  'Quinoa com legumes macios': 22,
  'Sopa espessa de lentilha e batata': 30,
  'Sopa rústica de batata e ervilha': 28,
}

const minAgeByRecipe: Record<string, number> = {
  'Bolinho macio de banana e aveia': 9,
  'Cuscuz macio com ovo': 8,
  'Grão-de-bico com cenoura e quinoa': 8,
  'Iogurte natural com banana e aveia': 9,
  'Panquequinha de banana': 9,
  'Pera com iogurte natural': 9,
  'Peixe com abóbora e quinoa': 8,
  'Peixe com arroz e cenoura': 8,
  'Peru com arroz e beterraba': 8,
  'Quinoa com legumes macios': 8,
}

function textureFor(minAgeMonths: number): string {
  if (minAgeMonths <= 6) return 'Amassada'
  if (minAgeMonths <= 8) return 'Macia'
  return 'Pedaços macios'
}

export const previewDays: PreviewDay[] = rawDays.map((day) => ({
  date: day.date,
  dayLabel: day.dayLabel,
  shortDate: day.shortDate,
  meals: day.meals.map((recipeName, index) => {
    const minAgeMonths = minAgeByRecipe[recipeName] ?? 6
    return {
      id: `${day.date}-${previewMealTypeOrder[index]}`,
      mealType: previewMealTypeOrder[index],
      recipeName,
      prepTimeMinutes: prepTimeByRecipe[recipeName] ?? 20,
      minAgeMonths,
      texture: textureFor(minAgeMonths),
    }
  }),
}))

export const previewToday: PreviewDay =
  previewDays.find((day) => day.date === previewWeek.todayDate) ?? previewDays[0]

/** Alternativas mostradas quando a prévia representa a ação “Trocar”. */
export const previewAlternatives: PreviewMeal[] = [
  {
    id: 'alt-1',
    mealType: 'lunch',
    recipeName: 'Arroz com lentilha e abóbora',
    prepTimeMinutes: 30,
    minAgeMonths: 6,
    texture: 'Amassada',
  },
  {
    id: 'alt-2',
    mealType: 'lunch',
    recipeName: 'Frango com quinoa e abobrinha',
    prepTimeMinutes: 28,
    minAgeMonths: 8,
    texture: 'Macia',
  },
  {
    id: 'alt-3',
    mealType: 'lunch',
    recipeName: 'Feijão com mandioca e brócolis',
    prepTimeMinutes: 32,
    minAgeMonths: 8,
    texture: 'Macia',
  },
]
