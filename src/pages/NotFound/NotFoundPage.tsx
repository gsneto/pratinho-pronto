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
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-pumpkin px-5 font-medium text-[#2A2A22] hover:bg-pumpkin/90"
          to="/app"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          Voltar ao início
        </Link>
      </div>
    </main>
  )
}
