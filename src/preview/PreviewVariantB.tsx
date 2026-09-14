import { Clock3, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { RecipeVisual } from '../components/recipes/RecipeVisual'
import { PreviewExports, PreviewReplaceDialog, PreviewWeekNav } from './PreviewChrome'
import {
  previewBabyName,
  previewDays,
  previewMealTypeLabels,
  previewMealTypeOrder,
  previewWeek,
} from './fixtures'
import { usePreviewWeekState } from './usePreviewWeekState'

/**
 * Proposta B — Planejador prático.
 * Semana inteira em uma grade densa, com miniaturas quadradas de 44px.
 * No celular vira lista de dias com seletor horizontal; no desktop, uma tabela
 * dia × refeição para leitura rápida e comparação da semana.
 */
export function PreviewVariantB() {
  const week = usePreviewWeekState()
  const [openDate, setOpenDate] = useState(previewWeek.todayDate)
  const openDay = previewDays.find((day) => day.date === openDate) ?? previewDays[0]

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <header className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="pp-eyebrow">Planejamento de {previewBabyName}</p>
          <h1 className="mt-2 text-[26px] leading-tight text-ink-900 sm:text-[32px]">
            Sua semana em uma tela
          </h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            28 refeições organizadas. Toque em qualquer uma para ver o preparo.
          </p>
        </div>
        <div className="pp-card w-full p-3 sm:w-auto sm:min-w-72">
          <PreviewWeekNav
            isCurrentWeek={week.isCurrentWeek}
            layout="compact"
            onBackToCurrent={week.onBackToCurrent}
            onNavigate={week.onNavigate}
            weekLabel={week.weekLabel}
          />
        </div>
      </header>

      {/* Celular: seletor de dias + lista compacta do dia escolhido. */}
      <section aria-label="Dias da semana" className="mt-6 lg:hidden">
        <div className="pp-scroller -mx-4 flex gap-2 px-4 pb-1">
          {previewDays.map((day) => {
            const isToday = day.date === previewWeek.todayDate
            const isOpen = day.date === openDate
            return (
              <button
                aria-current={isOpen ? 'true' : undefined}
                className="pp-selectable min-w-20 shrink-0 flex-col items-start justify-center gap-0 px-3 py-2"
                key={day.date}
                onClick={() => setOpenDate(day.date)}
                type="button"
              >
                <span className="text-xs font-semibold">
                  {day.dayLabel.slice(0, 3).toUpperCase()}
                </span>
                <span className="mt-0.5 text-[11px] text-ink-500">{day.shortDate}</span>
                {isToday && (
                  <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-sage-700">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-sage-700" />
                    HOJE
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="pp-panel mt-4 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-cream-100 px-4 py-3">
            <h2 className="text-lg text-ink-900">
              {openDay.dayLabel} · <span className="text-sm font-normal text-ink-500">{openDay.shortDate}</span>
            </h2>
            {openDay.date === previewWeek.todayDate && (
              <span className="pp-badge pp-badge-today">Hoje</span>
            )}
          </div>
          <ul className="divide-y divide-cream-100">
            {openDay.meals.map((meal) => (
              <li className="flex items-center gap-3 p-3" key={meal.id}>
                <RecipeVisual imageUrl={null} name={meal.recipeName} size="thumb-sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold tracking-[0.06em] text-terracotta-500 uppercase">
                    {previewMealTypeLabels[meal.mealType]}
                  </p>
                  <button className="pp-link mt-0.5 block w-full text-left text-sm break-words" type="button">
                    {meal.recipeName}
                  </button>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-500">
                    <Clock3 aria-hidden="true" size={12} />
                    {meal.prepTimeMinutes} min · {meal.texture}
                  </p>
                </div>
                <button
                  aria-label={`Trocar ${meal.recipeName}`}
                  className="pp-icon-btn size-11"
                  onClick={() => week.setReplacingMeal(meal)}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Desktop: grade dia × refeição, a semana toda visível de uma vez. */}
      <section aria-label="Semana completa" className="pp-panel mt-6 hidden overflow-hidden lg:block">
        <div className="grid grid-cols-[92px_repeat(4,1fr)] border-b border-cream-100 bg-sage-50">
          <span className="px-3 py-2.5 text-[11px] font-bold tracking-[0.08em] text-sage-700 uppercase">
            Dia
          </span>
          {previewMealTypeOrder.map((mealType) => (
            <span
              className="px-3 py-2.5 text-[11px] font-bold tracking-[0.08em] text-sage-700 uppercase"
              key={mealType}
            >
              {previewMealTypeLabels[mealType]}
            </span>
          ))}
        </div>
        {previewDays.map((day) => {
          const isToday = day.date === previewWeek.todayDate
          return (
            <div
              className={`grid grid-cols-[92px_repeat(4,1fr)] border-b border-cream-100 last:border-b-0 ${
                isToday ? 'bg-sage-50/60' : ''
              }`}
              key={day.date}
            >
              <div className="px-3 py-3">
                <p className="text-sm font-semibold text-ink-900">
                  {day.dayLabel.slice(0, 3)}
                </p>
                <p className="text-[11px] text-ink-500">{day.shortDate}</p>
                {isToday && (
                  <p className="mt-1 text-[10px] font-bold tracking-[0.06em] text-sage-700">
                    HOJE
                  </p>
                )}
              </div>
              {day.meals.map((meal) => (
                <div className="border-l border-cream-100 p-2.5" key={meal.id}>
                  <div className="flex items-start gap-2">
                    <RecipeVisual imageUrl={null} name={meal.recipeName} size="thumb-sm" />
                    <div className="min-w-0 flex-1">
                      <button className="pp-link block w-full text-left text-[13px] leading-snug break-words" type="button">
                        {meal.recipeName}
                      </button>
                      <p className="mt-1 text-[11px] text-ink-500">{meal.prepTimeMinutes} min</p>
                    </div>
                  </div>
                  <button
                    aria-label={`Trocar ${meal.recipeName}`}
                    className="pp-btn pp-btn-quiet mt-2 min-h-9 w-full px-2 text-[11px]"
                    onClick={() => week.setReplacingMeal(meal)}
                    type="button"
                  >
                    <RefreshCw aria-hidden="true" size={12} />
                    Trocar
                  </button>
                </div>
              ))}
            </div>
          )
        })}
      </section>

      <div className="mt-6">
        <PreviewExports />
      </div>

      {week.replacingMeal && (
        <PreviewReplaceDialog
          meal={week.replacingMeal}
          onClose={() => week.setReplacingMeal(null)}
        />
      )}
    </div>
  )
}
