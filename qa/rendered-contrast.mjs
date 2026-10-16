/** @typedef {{red: number, green: number, blue: number, alpha: number}} RgbaColor */

/**
 * Synchronous, read-only supplement for ordinary DOM text on solid sRGB layers.
 * Pass to Playwright Locator.evaluate(); the root must belong to this document.
 * Returns one record per rendered text node, including unrounded WCAG ratio,
 * nine hit-test samples per text rect, and an explicit status/reasons list.
 * Walks each text node's ancestors; hit-test cost depends on the browser DOM.
 * Native widget values, generated content and pixel-level painting are outside
 * this measurement. It never changes or supersedes the original axe result.
 * @param {Element} root
 */
export function measureRenderedContrast(root) {
  /** @param {string} value @returns {RgbaColor | null} */
  const parseColor = (value) => {
    const match = value.match(/^rgba?\(([^)]+)\)$/)
    if (!match) return null
    const channels = match[1].split(',').map(Number)
    return { red: channels[0], green: channels[1], blue: channels[2], alpha: channels[3] ?? 1 }
  }
  /** @param {RgbaColor} front @param {RgbaColor} back @returns {RgbaColor} */
  const composite = (front, back) => {
    const alpha = front.alpha + back.alpha * (1 - front.alpha)
    if (!alpha) return { red: 0, green: 0, blue: 0, alpha: 0 }
    /** @param {'red' | 'green' | 'blue'} name */
    const channel = (name) => (front[name] * front.alpha + back[name] * back.alpha * (1 - front.alpha)) / alpha
    return { red: channel('red'), green: channel('green'), blue: channel('blue'), alpha }
  }
  /** @param {RgbaColor} color */
  const luminance = (color) => {
    const linear = [color.red, color.green, color.blue].map((channel) => {
      const value = channel / 255
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
  }
  /** @param {Node} node */
  const nodeKeyFor = (node) => {
    const segments = []
    for (let element = node.parentElement; element; element = element.parentElement) {
      const siblings = element.parentElement ? [...element.parentElement.children].filter((sibling) => sibling.tagName === element.tagName) : [element]
      segments.unshift(`${element.tagName.toLowerCase()}:nth-of-type(${siblings.indexOf(element) + 1})`)
    }
    const siblings = node.parentNode ? [...node.parentNode.childNodes] : []
    return `${segments.join(' > ')}::text(${siblings.findIndex((sibling) => sibling === node)})`
  }
  const rows = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent?.trim() ?? ''
    const element = node.parentElement
    if (!text || !element) continue
    const style = getComputedStyle(element)
    const range = document.createRange()
    range.selectNodeContents(node)
    const rects = [...range.getClientRects()].filter((rect) => rect.width && rect.height)
    if (!rects.length || style.visibility !== 'visible') continue
    const reasons = []
    const samples = rects.flatMap((rect) => [0.2, 0.5, 0.8].flatMap((horizontal) => [0.25, 0.5, 0.75].map((vertical) => {
      const point = { x: rect.left + rect.width * horizontal, y: rect.top + rect.height * vertical }
      const hit = document.elementFromPoint(point.x, point.y)
      const visible = hit === element
      return { ...point, visible, hit: hit ? { tag: hit.tagName, className: hit.getAttribute('class') } : null }
    })))
    if (samples.some((sample) => !sample.visible)) reasons.push('occluded-text')
    for (let ancestor = /** @type {Element | null} */ (element); ancestor; ancestor = ancestor.parentElement) {
      const paint = getComputedStyle(ancestor)
      if (Number(paint.opacity) !== 1 || paint.filter !== 'none' || paint.mixBlendMode !== 'normal'
        || (paint.maskImage && paint.maskImage !== 'none') || paint.clipPath !== 'none') {
        reasons.push('unsupported-paint-effect')
        break
      }
    }
    let foreground = parseColor(style.color)
    /** @type {RgbaColor | null} */
    let background = { red: 0, green: 0, blue: 0, alpha: 0 }
    for (let ancestor = /** @type {Element | null} */ (element); ancestor; ancestor = ancestor.parentElement) {
      const paint = getComputedStyle(ancestor)
      if (paint.backgroundImage !== 'none') reasons.push('non-solid-background')
      const color = parseColor(paint.backgroundColor)
      if (!color) { background = null; break }
      background = composite(background, color)
      if (background.alpha === 1) break
    }
    if (background?.alpha !== 1) background = null
    if (!background) reasons.push('unresolved-background')
    if (!foreground) reasons.push('unsupported-foreground-color')
    if (foreground && background) foreground = composite(foreground, background)
    const fontSize = Number.parseFloat(style.fontSize)
    const fontWeight = Number.parseInt(style.fontWeight, 10)
    const requiredRatio = fontSize >= 24 || (fontSize >= 18.666666666666668 && fontWeight >= 700) ? 3 : 4.5
    let ratio = null
    if (foreground && background) {
      const foregroundLuminance = luminance(foreground)
      const backgroundLuminance = luminance(background)
      ratio = (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
    }
    rows.push({
      nodeKey: nodeKeyFor(node), text, fontSize, fontWeight,
      foregroundCss: style.color, foreground, background, ratio, requiredRatio,
      reasons: [...new Set(reasons)], rects: rects.map((rect) => rect.toJSON()), samples,
      status: ratio === null || reasons.length ? 'incomplete' : ratio >= requiredRatio ? 'passed' : 'failed',
    })
  }
  return rows
}
