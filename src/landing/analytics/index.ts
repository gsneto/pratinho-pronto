export type LandingEvent =
  | 'landing_view' | 'hero_video_play' | 'hero_video_25' | 'hero_video_50' | 'hero_video_75' | 'hero_video_complete'
  | 'hero_cta_click' | 'how_it_works_view' | 'benefits_view' | 'pdf_view' | 'bonus_view' | 'objection_view'
  | 'offer_view' | 'offer_cta_click' | 'guarantee_view' | 'faq_open' | 'final_cta_click' | 'checkout_click'
  | 'scroll_25' | 'scroll_50' | 'scroll_75' | 'scroll_90'
  | 'app_view' | 'login_started' | 'login_completed' | 'signup_started' | 'signup_completed'
  | 'baby_created' | 'onboarding_completed' | 'meal_plan_generated' | 'meal_replaced' | 'pantry_search'
  | 'shopping_list_generated' | 'pdf_generated' | 'subscription_page_viewed'

import { captureAttribution, getAttribution } from '../utils/utm'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
    fbq?: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void
      push?: (...args: unknown[]) => void
      queue?: unknown[][]
      loaded?: boolean
      version?: string
    }
    _fbq?: Window['fbq']
    gtag?: (...args: unknown[]) => void
    __pratinhoAnalyticsInitialized?: boolean
  }
}

const onceKeys = new Set<string>()

function createEventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function track(event: LandingEvent, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  const eventId = createEventId()
  const attribution = getAttribution()
  const enrichedParams = { ...params, ...attribution, event_id: eventId }
  window.dataLayer?.push({ event, ...enrichedParams })
  window.gtag?.('event', event, enrichedParams)
  if (event === 'landing_view') window.fbq?.('track', 'PageView', {}, { eventID: eventId })
  if (event === 'offer_view') window.fbq?.('track', 'ViewContent', enrichedParams, { eventID: eventId })
  if (event === 'checkout_click') window.fbq?.('track', 'InitiateCheckout', enrichedParams, { eventID: eventId })
  if (event === 'signup_completed') window.fbq?.('track', 'CompleteRegistration', enrichedParams, { eventID: eventId })
  window.fbq?.('trackCustom', event, enrichedParams, { eventID: eventId })
}

export function trackOnce(event: LandingEvent, key = event, params: Record<string, unknown> = {}) {
  if (onceKeys.has(key)) return
  onceKeys.add(key)
  track(event, params)
}

export function initializeAnalytics() {
  if (typeof window === 'undefined') return
  captureAttribution()
  window.dataLayer = window.dataLayer ?? []
  if (window.__pratinhoAnalyticsInitialized) return
  window.__pratinhoAnalyticsInitialized = true
  const pixelId = import.meta.env.VITE_META_PIXEL_ID
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (pixelId && !window.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args)
      else fbq.queue?.push(args)
    }) as NonNullable<Window['fbq']>
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []
    fbq.push = fbq
    window.fbq = fbq
    window._fbq = window._fbq ?? fbq
    window.fbq('init', pixelId)
    const script = document.createElement('script')
    script.async = true
    script.src = `https://connect.facebook.net/en_US/fbevents.js`
    document.head.appendChild(script)
  }
  if (gaId && !window.gtag) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`
    document.head.appendChild(script)
    window.gtag = (...args: unknown[]) => window.dataLayer?.push({ gtag: args })
    window.gtag('js', new Date())
    window.gtag('config', gaId)
  } else if (gaId) window.gtag?.('config', gaId)
}
