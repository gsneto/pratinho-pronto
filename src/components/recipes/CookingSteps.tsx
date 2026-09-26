import { Check, RotateCcw } from 'lucide-react'
import { useState } from 'react'

interface CookingStepsProps { steps: string[] }

export function CookingSteps({ steps }: CookingStepsProps) {
  const [completed, setCompleted] = useState<Set<number>>(() => new Set())

  function toggle(index: number) {
    setCompleted((previous) => {
      const next = new Set(previous)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="pp-cooking-steps">
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-500" role="status">{completed.size} de {steps.length} etapas concluídas</p>
        {completed.size > 0 && <button className="pp-text-action" onClick={() => setCompleted(new Set())} type="button"><RotateCcw aria-hidden="true" size={15} />Recomeçar preparo</button>}
      </div>
      <ol className="mt-3 space-y-2">
        {steps.map((step, index) => (
          <li key={`${index}-${step}`}>
            <button aria-label={`Etapa ${index + 1}: ${step}`} aria-pressed={completed.has(index)} className="pp-cooking-step" onClick={() => toggle(index)} type="button">
              <span aria-hidden="true" className="pp-step-check">{completed.has(index) ? <Check size={17} /> : index + 1}</span>
              <span className="pp-step-text">{step}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
