import { ChevronRight, Clock3, RefreshCw, Utensils } from 'lucide-react'
import { useState } from 'react'
import { RecipeVisual } from '../components/recipes/RecipeVisual'
import { PreviewExports, PreviewReplaceDialog, PreviewWeekNav } from './PreviewChrome'
import {
  previewBabyName,
  previewDays,
  previewMealTypeLabels,
  previewToday,
  previewWeek,
} from './fixtures'
import { usePreviewWeekState } from './usePreviewWeekState'

/**
 * Proposta C — Híbrida.
 * O dia selecionado (por padrão, hoje) aparece em destaque com foto grande na
 * refeição seguinte e as demais refeições do dia em lista média. O resto da
 * semana fica compacto embaixo, mantendo a organização visível sem competir
 * com a decisão do dia.
 */
export function PreviewVariantC() {
  const week = usePreviewWeekState()
  const [selectedDate, setSelectedDate] = useState(previewToday.date)
  const selectedDay = previewDays.find((day) => day.date === selectedDate) ?? previewToday
  const [featureMeal, ...restMeals] = selectedDay.meals

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
      <header className="flex flex-col gap-4 pt-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="pp-eyebrow">Cardápio de {previewBabyName}</p>
          <h1 className="mt-2 text-[28px] leading-tight text-ink-900 sm:text-[34px]">
            Minha semana
          </h1>
        </div>
        <div className="pp-card w-full p-3 sm:w-auto sm:min-w-72">
          <PreviewWeekNav
            isCurrentWeek={week.isCurrentWeek}
            onBackToCurrent={week.onBackToCurrent}
            onNavigate={week.onNavigate}
            weekLabel={week.weekLabel}
          />
        </div>
      </header>

      {/* Seletor de dias: onde a mãe está na semana. */}
      <nav aria-label="Dias da semana" className="mt-5">
        <ul className="pp-scroller -mx-4 flex gap-2 px-4 pb-1">
          {previewDays.map((day) => {
            const isToday = day.date === previewWeek.todayDate
            const isSelected = day.date === selectedDate
            return (
              <li key={day.date}>
                <button
                  aria-current={isSelected ? 'true' : undefined}
                  className="pp-selectable min-w-19 flex-col items-center justify-center gap-0 px-3 py-2"
                  onClick={() => setSelectedDate(day.date)}
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
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Destaque: a próxima refeição do dia selecionado. */}
      <section
        aria-labelledby="c-feature-title"
        className="pp-panel pp-lifted mt-5 overflow-hidden sm:grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
      >
        <RecipeVisual
          imageUrl={null}
          name={featureMeal.recipeName}
          priority
          size="square"
        />
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="pp-badge pp-badge-terracotta">
              {previewMealTypeLabels[featureMeal.mealType]}
            </span>
            {selectedDay.date === previewWeek.todayDate ? (
              <span className="pp-badge pp-badge-today">Hoje · {selectedDay.shortDate}</span>
            ) : (
              <span className="pp-badge pp-badge-sage">
                {selectedDay.dayLabel} · {selectedDay.shortDate}
              </span>
            )}
          </div>
          <h2
            className="mt-3 text-[26px] leading-[1.12] break-words text-ink-900 sm:text-[30px]"
            id="c-feature-title"
          >
            {featureMeal.recipeName}
          </h2>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-500">
            <span className="flex items-center gap-1.5">
              <Clock3 aria-hidden="true" size={15} />
              {featureMeal.prepTimeMinutes} min
            </span>
            <span className="flex items-center gap-1.5">
              <Utensils aria-hidden="true" size={15} />
              {featureMeal.texture}
            </span>
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button className="pp-btn pp-btn-primary pp-btn-lg flex-1" type="button">
              Ver como preparar
            </button>
            <button
              aria-label={`Trocar ${featureMeal.recipeName}`}
              className="pp-btn pp-btn-outline sm:w-auto"
              onClick={() => week.setReplacingMeal(featureMeal)}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={16} />
              Trocar
            </button>
          </div>
        </div>
      </section>

      {/* Restante das refeições do dia selecionado. */}
      <section aria-labelledby="c-rest-title" className="mt-6">
        <h2 className="text-lg text-ink-900" id="c-rest-title">
          Resto de {selectedDay.dayLabel.toLowerCase()}
        </h2>
        <ul className="mt-3 space-y-2">
          {restMeals.map((meal) => (
            <li className="pp-card pp-interactive flex items-center gap-3 p-3" key={meal.id}>
              <RecipeVisual imageUrl={null} name={meal.recipeName} size="thumb" />
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
                className="pp-btn pp-btn-quiet pp-btn-sm shrink-0"
                onClick={() => week.setReplacingMeal(meal)}
                type="button"
              >
                <RefreshCw aria-hidden="true" size={14} />
                Trocar
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Semana compacta: organização sem competir com o destaque. */}
      <section aria-labelledby="c-week-title" className="pp-panel mt-8 overflow-hidden">
        <div className="border-b border-cream-100 px-4 py-3 sm:px-5">
          <h2 className="text-base text-ink-900" id="c-week-title">
            Semana de {previewWeek.shortLabel}
          </h2>
        </div>
        <ul className="divide-y divide-cream-100">
          {previewDays.map((day) => {
            const isToday = day.date === previewWeek.todayDate
            const isSelected = day.date === selectedDate
            return (
              <li key={day.date}>
                <button
                  aria-current={isSelected ? 'true' : undefined}
                  className={`flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-cream-50 sm:px-5 ${
                    isSelected ? 'bg-sage-50' : ''
                  }`}
                  onClick={() => setSelectedDate(day.date)}
                  type="button"
                >
                  <span className="w-16 shrink-0">
                    <span className="block text-sm font-semibold text-ink-900">
                      {day.dayLabel.slice(0, 3)}
                    </span>
                    <span className="block text-[11px] text-ink-500">{day.shortDate}</span>
                  </span>
                  {isToday && (
                    <span className="pp-badge pp-badge-today shrink-0 px-2 py-1 text-[10px]">
                      Hoje
                    </span>
                  )}
                  <span className="min-w-0 flex-1 text-sm leading-snug text-ink-700">
                    {day.meals.map((meal) => meal.recipeName).join(' · ')}
                  </span>
                  <ChevronRight aria-hidden="true" className="shrink-0 text-ink-500" size={18} />
                </button>
              </li>
            )
          })}
        </ul>
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
