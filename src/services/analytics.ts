import { initializeAnalytics, track, type LandingEvent } from '../landing/analytics'

export type AnalyticsEvent =
  | 'baby_created'
  | 'meal_plan_generated'
  | 'meal_replaced'
  | 'pantry_search'
  | 'shopping_list_generated'
  | 'pdf_generated'
  | 'subscription_page_viewed'
  | 'app_view'
  | 'login_started'
  | 'login_completed'
  | 'signup_started'
  | 'signup_completed'
  | 'onboarding_completed'
  | 'material_opened'

type TrackableAnalyticsEvent = AnalyticsEvent & LandingEvent

export interface AnalyticsProperties {
  [key: string]: boolean | number | string | null | undefined
}

export const analytics = {
  track(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
    initializeAnalytics()
    track(event as TrackableAnalyticsEvent, properties)
    if (import.meta.env.DEV) console.info('[analytics]', event, properties)
  },
}
