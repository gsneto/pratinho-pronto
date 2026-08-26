import { Download, MoreVertical, Share, Smartphone, X } from 'lucide-react'
import { useState } from 'react'
import { usePwaInstall } from '../../lib/pwa-install'

interface InstallAppCardProps {
  compact?: boolean
  onDismiss?: () => void
}

export function InstallAppCard({ compact = false, onDismiss }: InstallAppCardProps) {
  const { canInstall, install, isInstalled, isIos } = usePwaInstall()
  const [showInstructions, setShowInstructions] = useState(false)
  const [isPrompting, setIsPrompting] = useState(false)

  if (isInstalled) return null

  async function handleInstall() {
    if (!canInstall) {
      setShowInstructions(true)
      return
    }

    setIsPrompting(true)
    await install()
    setIsPrompting(false)
  }

  return (
    <section
      aria-labelledby="install-app-title"
      className={`relative overflow-hidden rounded-[24px] border border-cream-100 bg-white shadow-[0_12px_40px_rgba(65,65,60,0.04)] ${
        compact ? 'p-5 sm:p-6' : 'p-5 sm:p-7'
      }`}
    >
      {onDismiss && (
        <button
          aria-label="Fechar convite para instalar"
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-xl text-ink-500 hover:bg-cream-50 hover:text-ink-900"
          onClick={onDismiss}
          type="button"
        >
          <X aria-hidden="true" size={18} />
        </button>
      )}

      <div className="flex items-start gap-4 pr-9">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-terracotta-100 text-terracotta-500">
          <Smartphone aria-hidden="true" size={23} strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-terracotta-500">
            Acesso rápido
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-ink-900" id="install-app-title">
            Tenha o Pratinho Pronto na tela inicial
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Abra seu cardápio como um aplicativo, sem precisar procurar o link novamente.
          </p>
        </div>
      </div>

      <button
        className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-pumpkin px-5 text-sm font-semibold text-[#2A2A22] disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        disabled={isPrompting}
        onClick={handleInstall}
        type="button"
      >
        <Download aria-hidden="true" size={18} />
        {isPrompting ? 'Abrindo instalação…' : canInstall ? 'Instalar aplicativo' : 'Como adicionar'}
      </button>

      {showInstructions && (
        <div className="mt-5 rounded-2xl bg-cream-50 p-4 text-sm leading-6 text-ink-700" role="status">
          <p className="font-semibold text-ink-900">
            {isIos ? 'No iPhone ou iPad:' : 'No seu navegador:'}
          </p>
          {isIos ? (
            <ol className="mt-2 space-y-2">
              <li className="flex gap-2"><Share aria-hidden="true" className="mt-1 shrink-0 text-sage-700" size={16} />1. Abra esta página no Safari e toque em Compartilhar.</li>
              <li className="flex gap-2"><Smartphone aria-hidden="true" className="mt-1 shrink-0 text-sage-700" size={16} />2. Escolha “Adicionar à Tela de Início”.</li>
              <li className="flex gap-2"><Download aria-hidden="true" className="mt-1 shrink-0 text-sage-700" size={16} />3. Ative “Abrir como App Web” e toque em Adicionar.</li>
            </ol>
          ) : (
            <p className="mt-2 flex gap-2">
              <MoreVertical aria-hidden="true" className="mt-1 shrink-0 text-sage-700" size={16} />
              Abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
