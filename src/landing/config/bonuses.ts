export interface BonusConfig {
  id: string
  enabled: boolean
  title: string
  subtitle?: string
  cover: string
  description: string
  valueLabel?: string
}

export const bonuses: BonusConfig[] = [
  {
    id: 'app-pratinho',
    enabled: true,
    title: 'Pratinho Pronto',
    subtitle: 'Acesso vitalício ao app',
    cover: '/assets/pratinho-pronto-cover-light-new.webp',
    valueLabel: 'R$ 147',
    description: 'Aplicativo para montar o cardápio da semana, trocar refeições, usar o que você já tem e gerar sua lista de compras.',
  },
  {
    id: 'introducao',
    enabled: true,
    title: 'Guia de Introdução Alimentar',
    cover: '/assets/bonus-introducao-cover.webp',
    valueLabel: 'R$ 17',
    description: 'Um material visual e organizado para consultar durante os primeiros passos dessa fase.',
  },
  {
    id: 'sono',
    enabled: true,
    title: 'Guia da Rotina do Sono',
    subtitle: '0 a 24 meses',
    cover: '/assets/bonus-sono-cover.webp',
    valueLabel: 'R$ 17',
    description: 'Um guia visual sobre organização da rotina de sono conforme o bebê cresce.',
  },
  {
    id: 'organizar',
    enabled: true,
    title: 'Guia Visual de Cortes & Texturas',
    cover: '/assets/bonus-cortes-texturas-cover.webp',
    valueLabel: 'R$ 17',
    description: 'Um guia visual sobre cortes e texturas adequados para cada fase do bebê.',
  },
  {
    id: 'videos-receitas',
    enabled: true,
    title: 'Biblioteca de vídeos de receitas passo a passo',
    cover: '/assets/bonus-videos.svg',
    valueLabel: 'R$ 39',
    description: 'Receitas em vídeo para acompanhar o preparo e colocar as ideias em prática com mais facilidade.',
  },
]

export const bonusTotalValue = bonuses.reduce((total, bonus) => total + Number(bonus.valueLabel?.replace(/\D/g, '') ?? 0), 0)
