import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream-50 px-5 text-center">
      <div>
        <p className="text-sm font-semibold text-terracotta-500">Erro 404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink-900">
          Esta página ainda não está no cardápio.
        </h1>
        <Link
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-sage-600 px-5 font-semibold text-white"
          to="/app"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
