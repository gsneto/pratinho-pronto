import { pdf } from '@react-pdf/renderer'
import type { Baby, MealPlan, ShoppingList } from '../../types/domain'
import {
  ShoppingListDocument,
  WeekPlanDocument,
  WeeklyRecipesDocument,
} from './documents'

export type PdfKind = 'recipes' | 'shopping' | 'week'

export interface CreatePdfInput {
  baby: Baby
  kind: PdfKind
  plan?: MealPlan
  shoppingList?: ShoppingList
  weekStart?: string
}

export async function createPdfBlob({
  baby,
  kind,
  plan,
  shoppingList,
  weekStart,
}: CreatePdfInput): Promise<Blob> {
  if (kind === 'shopping' && shoppingList) {
    return pdf(
      <ShoppingListDocument baby={baby} shoppingList={shoppingList} weekStart={weekStart} />,
    ).toBlob()
  }

  if (kind === 'week' && plan) {
    return pdf(<WeekPlanDocument baby={baby} plan={plan} />).toBlob()
  }

  if (kind === 'recipes' && plan) {
    return pdf(<WeeklyRecipesDocument baby={baby} plan={plan} />).toBlob()
  }

  throw new Error('Dados insuficientes para gerar o PDF.')
}
