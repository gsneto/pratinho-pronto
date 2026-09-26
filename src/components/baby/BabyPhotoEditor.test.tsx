// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { BabyPhotoEditor } from './BabyPhotoEditor'
import { testBaby } from '../../test/fixtures'

vi.mock('../../services/babies', () => ({ removeBabyPhoto: vi.fn(), uploadBabyPhoto: vi.fn() }))
afterEach(cleanup)
it('names the photo input and exposes one visible keyboard entry point', () => {
  render(<BabyPhotoEditor baby={testBaby} onChanged={vi.fn()} />)
  const input = screen.getByLabelText('Foto de Alice')
  expect(input.getAttribute('type')).toBe('file')
  expect(input.hasAttribute('hidden')).toBe(true)
  expect(screen.getByRole('button', { name: 'Escolher foto' })).toBeTruthy()
})
