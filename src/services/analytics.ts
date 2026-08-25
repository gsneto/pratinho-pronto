export type AnalyticsEvent =
  | 'signup_completed'
  | 'baby_created'
  | 'meal_plan_generated'
  | 'meal_replaced'
  | 'pantry_search'
  | 'shopping_list_generated'
  | 'pdf_generated'
  | 'subscription_page_viewed'

export interface AnalyticsProperties {
  [key: string]: boolean | number | string | null | undefined
}

export const analytics = {
  track(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
    if (import.meta.env.DEV) {
      console.info('[analytics]', event, properties)
    }
  },
}
