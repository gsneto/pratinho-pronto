// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { testPlan, testRecipe } from '../../test/fixtures'
import { ReplaceMealDialog } from './ReplaceMealDialog'

afterEach(cleanup)
it('cycles focus through the alternatives and restores the trigger on Escape', async () => {
  const user = userEvent.setup()
  function Example() {
    const [open, setOpen] = useState(false)
    return <><button onClick={() => setOpen(true)}>Trocar refeição</button>{open && <ReplaceMealDialog alternatives={[testRecipe]} isSaving={false} item={testPlan.meal_plan_items[0]} onChoose={vi.fn()} onClose={() => setOpen(false)} />}</>
  }
  render(<Example />)
  const trigger = screen.getByRole('button', { name: 'Trocar refeição' })
  await user.click(trigger)
  const close = screen.getByRole('button', { name: 'Fechar alternativas' })
  expect(document.activeElement).toBe(close)
  await user.tab({ shift: true })
  expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
  await user.tab()
  expect(document.activeElement).toBe(close)
  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(document.activeElement).toBe(trigger)
})
