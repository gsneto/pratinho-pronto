const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'] as const

export function appendAttribution(url: string) {
  if (!url || typeof window === 'undefined') return url
  const target = new URL(url, window.location.origin)
  const current = new URLSearchParams(window.location.search)
  UTM_KEYS.forEach((key) => {
    const value = current.get(key)
    if (value) target.searchParams.set(key, value)
  })
  return target.toString()
}
