import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

it('constructs and validates the forms without attempting dynamic code under CSP', async () => {
  vi.resetModules()
  const dynamicCode = vi.spyOn(globalThis, 'Function').mockImplementation(function () {
    throw new EvalError('Dynamic code is blocked by CSP')
  })

  const { loginSchema } = await import('./auth')
  const { babyFormSchema } = await import('./baby')
  expect(loginSchema.safeParse({}).success).toBe(false)
  expect(babyFormSchema.safeParse({}).success).toBe(false)
  expect(dynamicCode).not.toHaveBeenCalled()
})
