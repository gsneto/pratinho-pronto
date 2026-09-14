import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PreviewVariantA } from './PreviewVariantA'
import { PreviewVariantB } from './PreviewVariantB'
import { PreviewVariantC } from './PreviewVariantC'

type VariantId = 'A' | 'B' | 'C'
type PreviewTheme = 'light' | 'dark'

const variants: { id: VariantId; label: string; description: string }[] = [
  { id: 'A', label: 'A · Editorial', description: 'Fotos grandes, composição espaçada' },
  { id: 'B', label: 'B · Planejador', description: 'Semana compacta, leitura rápida' },
  { id: 'C', label: 'C · Híbrida', description: 'Dia em destaque + semana compacta' },
]

/**
 * Área de comparação das três propostas da tela semanal.
 * Isolada: dados fictícios, nenhum acesso a Supabase, auth, rede ou analytics.
 * O alternador de tema escreve apenas no atributo data-theme do documento e
 * restaura o valor anterior ao sair, para não interferir na preferência salva.
 */
export function PreviewPage() {
  const [variant, setVariant] = useState<VariantId>('C')
  const [theme, setTheme] = useState<PreviewTheme>('light')

  useEffect(() => {
    const root = document.documentElement
    const previousTheme = root.dataset.theme
    const previousColorScheme = root.style.colorScheme
    root.dataset.theme = theme
    root.style.colorScheme = theme
    return () => {
      if (previousTheme) root.dataset.theme = previousTheme
      else delete root.dataset.theme
      root.style.colorScheme = previousColorScheme
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-cream-50 text-ink-900">
      <header className="sticky top-0 z-30 border-b border-cream-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="pp-eyebrow">Prévia de design · dados fictícios</p>
            <p className="mt-1 text-sm text-ink-500">
              Tela de cardápio semanal — três propostas com o mesmo conteúdo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              aria-label="Escolher proposta"
              className="flex flex-wrap gap-1.5"
              role="group"
            >
              {variants.map((option) => (
                <button
                  aria-pressed={variant === option.id}
                  className="pp-selectable min-h-11 px-3 text-sm"
                  key={option.id}
                  onClick={() => setVariant(option.id)}
                  title={option.description}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              aria-pressed={theme === 'dark'}
              className="pp-btn pp-btn-secondary min-h-11 px-3 text-sm"
              onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              type="button"
            >
              {theme === 'dark' ? (
                <Sun aria-hidden="true" size={17} />
              ) : (
                <Moon aria-hidden="true" size={17} />
              )}
              {theme === 'dark' ? 'Claro' : 'Escuro'}
            </button>
          </div>
        </div>
      </header>

      <main>
        {variant === 'A' && <PreviewVariantA />}
        {variant === 'B' && <PreviewVariantB />}
        {variant === 'C' && <PreviewVariantC />}
      </main>
    </div>
  )
}
