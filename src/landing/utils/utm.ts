const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'] as const

const ATTRIBUTION_STORAGE_KEY = 'pratinho-attribution-v1'

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number], string>>

interface StoredAttribution {
  first: Attribution
  last: Attribution
}

function readStoredAttribution(): StoredAttribution {
  if (typeof window === 'undefined') return { first: {}, last: {} }

  try {
    const value = window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)
    if (!value) return { first: {}, last: {} }
    const parsed = JSON.parse(value) as StoredAttribution | Attribution
    if ('first' in parsed && 'last' in parsed) return parsed
    return { first: parsed as Attribution, last: parsed as Attribution }
  } catch {
    return { first: {}, last: {} }
  }
}

/** Captures the first touch once and updates the latest campaign attribution. */
export function captureAttribution(): Attribution {
  if (typeof window === 'undefined') return {}

  const current = new URLSearchParams(window.location.search)
  const incoming: Attribution = {}
  UTM_KEYS.forEach((key) => {
    const value = current.get(key)?.trim()
    if (value) incoming[key] = value
  })

  const stored = readStoredAttribution()
  const next: StoredAttribution = {
    first: Object.keys(stored.first).length > 0 ? stored.first : incoming,
    last: { ...stored.last, ...incoming },
  }
  if (Object.keys(next.first).length > 0 || Object.keys(next.last).length > 0) {
    try {
      window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Storage can be unavailable in private browsing; current query params still work.
    }
  }

  return next.last
}

export function getAttribution(): Attribution {
  return captureAttribution()
}

export function appendAttribution(url: string) {
  if (!url || typeof window === 'undefined') return url
  const target = new URL(url, window.location.origin)
  const attribution = getAttribution()
  UTM_KEYS.forEach((key) => {
    const value = attribution[key]
    if (value) target.searchParams.set(key, value)
  })
  return target.toString()
}
