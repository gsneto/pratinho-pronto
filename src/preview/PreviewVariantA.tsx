import { Clock3, RefreshCw, Utensils } from 'lucide-react'
import { RecipeVisual } from '../components/recipes/RecipeVisual'
import {
  PreviewExports,
  PreviewReplaceDialog,
  PreviewWeekNav,
} from './PreviewChrome'
import {
  previewBabyName,
  previewDays,
  previewMealTypeLabels,
  previewWeek,
} from './fixtures'
import { usePreviewWeekState } from './usePreviewWeekState'

/**
 * Proposta A — Editorial acolhedora.
 * Fotos grandes (4:3 em cada refeição), composição espaçada, títulos
 * expressivos em Fraunces. Cada dia é uma seção com respiro; a semana é
 * percorrida por rolagem vertical, como uma revista de cozinha.
 */
export function PreviewVariantA() {
  const week = usePreviewWeekState()

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
      <header className="pt-8">
        <p className="pp-eyebrow">Cardápio de {previewBabyName}</p>
        <h1 className="mt-2 text-[30px] leading-[1.08] text-ink-900 sm:text-[38px]">
          A semana de {previewBabyName}, refeição por refeição
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-500">
          Cada dia com a foto do que vai no pratinho, o tempo de preparo e a
          textura sugerida.
        </p>
        <div className="pp-panel mt-6 p-4 sm:p-5">
          <PreviewWeekNav
            isCurrentWeek={week.isCurrentWeek}
            onBackToCurrent={week.onBackToCurrent}
            onNavigate={week.onNavigate}
            weekLabel={week.weekLabel}
          />
        </div>
      </header>

      <div className="mt-10 space-y-12">
        {previewDays.map((day, dayIndex) => {
          const isToday = day.date === previewWeek.todayDate
          return (
            <section aria-labelledby={`a-day-${day.date}`} key={day.date}>
              <div className="flex items-baseline justify-between gap-3 border-b border-cream-100 pb-3">
                <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-2xl text-ink-900" id={`a-day-${day.date}`}>
                  {day.dayLabel}
                  <span className="text-sm font-normal text-ink-500">{day.shortDate}</span>
                  {isToday && <span className="pp-badge pp-badge-today">Hoje</span>}
                </h2>
                <span className="shrink-0 text-xs font-semibold text-ink-500">
                  {day.meals.length} refeições
                </span>
              </div>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {day.meals.map((meal, mealIndex) => (
                  <article
                    className={`pp-card overflow-hidden ${
                      isToday ? 'border-sage-500' : ''
                    }`}
                    key={meal.id}
                  >
                    <RecipeVisual
                      imageUrl={null}
                      name={meal.recipeName}
                      priority={dayIndex === 0 && mealIndex < 2}
                      size="card"
                    />
                    <div className="p-5">
                      <p className="pp-eyebrow">{previewMealTypeLabels[meal.mealType]}</p>
                      <h3 className="mt-2 text-xl leading-snug break-words text-ink-900">
                        {meal.recipeName}
                      </h3>
                      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-500">
                        <span className="flex items-center gap-1.5">
                          <Clock3 aria-hidden="true" size={15} />
                          {meal.prepTimeMinutes} min
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Utensils aria-hidden="true" size={15} />
                          {meal.texture}
                        </span>
                      </p>
                      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                        <button className="pp-btn pp-btn-primary flex-1" type="button">
                          Ver como preparar
                        </button>
                        <button
                          aria-label={`Trocar ${meal.recipeName}`}
                          className="pp-btn pp-btn-outline sm:w-auto"
                          onClick={() => week.setReplacingMeal(meal)}
                          type="button"
                        >
                          <RefreshCw aria-hidden="true" size={16} />
                          Trocar
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-12">
        <PreviewExports layout="stack" />
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
