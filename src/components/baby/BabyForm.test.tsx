// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BabyForm } from './BabyForm'

afterEach(cleanup)
it('announces invalid fields through the input descriptions before submitting', async () => {
  const submit = vi.fn()
  render(<BabyForm onSubmit={submit} submitLabel="Salvar e personalizar" />)
  fireEvent.click(screen.getByRole('button', { name: 'Salvar e personalizar' }))
  const name = screen.getByRole('textbox', { name: 'Nome do bebê' })
  await waitFor(() => expect(name.getAttribute('aria-invalid')).toBe('true'))
  expect(name.getAttribute('aria-describedby')).toBe('baby-name-error')
  expect(document.getElementById('baby-name-error')?.textContent).toBeTruthy()
  expect(screen.getByLabelText('Data de nascimento').getAttribute('aria-describedby')).toContain('birth-date-error')
  expect(submit).not.toHaveBeenCalled()
})
