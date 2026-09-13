const MS_PER_DAY = 86_400_000

export function parseIsoDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(isoDate: string, amount: number): string {
  const date = parseIsoDate(isoDate)
  date.setDate(date.getDate() + amount)
  return toIsoDate(date)
}

export function calculateAgeMonths(
  birthDate: string,
  referenceDate = new Date(),
): number {
  const birth = parseIsoDate(birthDate)
  let months =
    (referenceDate.getFullYear() - birth.getFullYear()) * 12 +
    referenceDate.getMonth() -
    birth.getMonth()

  if (referenceDate.getDate() < birth.getDate()) {
    months -= 1
  }

  return Math.max(0, months)
}

export function getWeekStart(referenceDate = new Date()): string {
  const date = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  )
  const day = date.getDay()
  const distanceToMonday = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + distanceToMonday)
  return toIsoDate(date)
}

export function isIsoDate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = parseIsoDate(value)
  return !Number.isNaN(parsed.getTime()) && toIsoDate(parsed) === value
}

/**
 * Garante que uma semana vinda da URL seja sempre uma segunda-feira válida.
 * Valores inválidos caem na semana atual, evitando cardápio vazio inexplicável.
 */
export function normalizeWeekStart(value: string | null | undefined): string {
  if (!isIsoDate(value)) return getWeekStart()
  return getWeekStart(parseIsoDate(value))
}

export function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(parseIsoDate(isoDate))
}

export function formatLongDate(isoDate: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parseIsoDate(isoDate))
}

export function daysBetween(start: string, end: string): number {
  return Math.round((parseIsoDate(end).getTime() - parseIsoDate(start).getTime()) / MS_PER_DAY)
}
