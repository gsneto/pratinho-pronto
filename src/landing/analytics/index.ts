type LandingEvent =
  | 'landing_view' | 'hero_video_play' | 'hero_video_25' | 'hero_video_50' | 'hero_video_75' | 'hero_video_complete'
  | 'hero_cta_click' | 'how_it_works_view' | 'benefits_view' | 'pdf_view' | 'bonus_view' | 'objection_view'
  | 'offer_view' | 'offer_cta_click' | 'guarantee_view' | 'faq_open' | 'final_cta_click' | 'checkout_click'
  | 'scroll_25' | 'scroll_50' | 'scroll_75' | 'scroll_90'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
    fbq?: (...args: unknown[]) => void
    gtag?: (...args: unknown[]) => void
  }
}

export function track(event: LandingEvent, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer?.push({ event, ...params })
  window.gtag?.('event', event, params)
  window.fbq?.('trackCustom', event, params)
}

export function initializeAnalytics() {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer ?? []
  const pixelId = import.meta.env.VITE_META_PIXEL_ID
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID
  if (pixelId && !window.fbq) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://connect.facebook.net/en_US/fbevents.js`
    document.head.appendChild(script)
    window.fbq = (...args: unknown[]) => window.dataLayer?.push({ fbq: args })
    window.fbq('init', pixelId)
  } else if (pixelId) window.fbq?.('init', pixelId)
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
