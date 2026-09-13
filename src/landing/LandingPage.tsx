import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown, ArrowRight, CalendarDays, Check, ChevronDown, Clock3, FileDown, Heart,
  Gift, ListChecks, Refrigerator, Search, ShieldCheck, ShoppingBasket, Sparkles, Star,
  WandSparkles, Play,
} from 'lucide-react'
import { bonuses } from './config/bonuses'
import { offerConfig } from './config/offer'
import { mainVideo } from './config/video'
import { testimonials } from './config/testimonials'
import { initializeAnalytics, track, trackOnce } from './analytics'
import { goToCheckout } from './utils/checkout'
import './landing.css'

const weeklyMeals = [
  { day: 'SEG', name: 'Mamão com aveia macia', image: '/images/recipes/mamao-com-aveia-macia.webp' },
  { day: 'TER', name: 'Frango com arroz e brócolis', image: '/images/recipes/frango-com-arroz-e-brocolis.webp' },
  { day: 'QUA', name: 'Abacate com manga', image: '/images/recipes/abacate-com-manga.webp' },
  { day: 'QUI', name: 'Peixe com abóbora e quinoa', image: '/images/recipes/peixe-com-abobora-e-quinoa.webp' },
  { day: 'SEX', name: 'Creme de abóbora com aveia', image: '/images/recipes/creme-de-abobora-com-aveia.webp' },
]

const videoBonusImages = [
  '/assets/video-bonus/recipe-03.webp?v=1',
  '/assets/video-bonus/recipe-01.webp?v=1',
  '/assets/video-bonus/recipe-02.webp?v=1',
]

const customerProofImages = [
  {
    src: '/assets/testimonials/cliente-guia.jpeg',
    alt: 'Conversa no WhatsApp em que uma cliente relata que está usando os guias e que a filha adorou as receitinhas.',
  },
  {
    src: '/assets/testimonials/mensagens-01.jpeg',
    alt: 'Lista de conversas no WhatsApp com mensagens de agradecimento após o acesso.',
  },
  {
    src: '/assets/testimonials/mensagens-02.jpeg',
    alt: 'Lista de conversas no WhatsApp com mensagens de agradecimento após o acesso.',
  },
  {
    src: '/assets/testimonials/mensagens-03.jpeg',
    alt: 'Lista de conversas no WhatsApp com mensagens de agradecimento após o acesso.',
  },
  {
    src: '/assets/testimonials/mensagens-04.jpeg',
    alt: 'Lista de conversas no WhatsApp com mensagens de agradecimento após o acesso.',
  },
]

// v=3 forces browsers/PWA caches to load the refreshed Step 1 artwork.
const howLightImages = Array.from({ length: 5 }, (_, index) => `/assets/how/light-0${index + 1}.webp?v=3`)
const howDarkImages = Array.from({ length: 5 }, (_, index) => `/assets/how/dark-0${index + 1}.webp?v=3`)
const howImageDescriptions = [
  'Passo 1: Informe a fase. Cadastre as informações necessárias para organizar as opções disponíveis.',
  'Passo 2: Monte sua semana. O Pratinho Pronto organiza as refeições em um cardápio semanal.',
  'Passo 3: Ajuste o que quiser. Não gostou de uma refeição? Troque só aquela opção.',
  'Passo 4: Organize a compra. Transforme o cardápio em uma lista de ingredientes.',
  'Passo 5: Imprima. Gere o PDF e deixe a semana acessível na cozinha.',
]

const faqItems = [
  ['Preciso instalar alguma coisa?', 'Não. O Pratinho Pronto funciona pelo navegador, direto no celular ou computador.'],
  ['Funciona no celular?', 'Sim. A experiência é pensada principalmente para celular, para acompanhar sua rotina onde ela acontece.'],
  ['Posso trocar uma refeição?', 'Sim. Você pode substituir uma refeição individual sem refazer toda a semana.'],
  ['Consigo imprimir?', 'Sim. O sistema permite gerar o cardápio e a lista de compras em PDF.'],
  ['É uma assinatura?', 'Não. Nesta oferta, o pagamento é único: R$47.'],
  ['Isso substitui pediatra ou nutricionista?', 'Não. O Pratinho Pronto é uma ferramenta educativa e de organização, não substitui orientação individual.'],
] as const

function PrimaryButton({ children, source, kind = 'primary' }: { children: React.ReactNode; source: string; kind?: 'primary' | 'light' }) {
  return <button className={`lp-button lp-button-${kind}`} onClick={() => { track(source === 'hero' ? 'hero_cta_click' : source === 'offer' ? 'offer_cta_click' : 'final_cta_click'); if (source === 'hero') { const target = document.getElementById('offer-price') ?? document.querySelector('.lp-offer-price') ?? document.getElementById('offer'); if (target) window.scrollTo({ top: Math.max(0, Math.round(window.scrollY + target.getBoundingClientRect().top - 76)), behavior: 'auto' }) } else goToCheckout(source) }} type="button">{children}<ArrowRight aria-hidden="true" size={18} /></button>
}

function CheckLine({ children }: { children: React.ReactNode }) {
  return <li><span className="lp-check"><Check aria-hidden="true" size={14} strokeWidth={3} /></span><span>{children}</span></li>
}

export function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const offerRef = useRef<HTMLElement>(null)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [howSlide, setHowSlide] = useState(0)
  const [howImagesReady, setHowImagesReady] = useState(false)
  const howCarouselRef = useRef<HTMLDivElement>(null)
  const videoBonusCarouselRef = useRef<HTMLDivElement>(null)
  const heroVideoRef = useRef<HTMLVideoElement>(null)
  const videoMilestones = useRef(new Set<Parameters<typeof track>[0]>())
  const [heroVideoStarted, setHeroVideoStarted] = useState(false)

  useEffect(() => {
    initializeAnalytics()
    trackOnce('landing_view', 'landing_view')
    const hero = heroRef.current
    const offer = offerRef.current
    if (!hero || !offer) return
    const ctas = Array.from(document.querySelectorAll<HTMLElement>('.lp-button'))
    const updateStickyVisibility = () => {
      const heroRect = hero.getBoundingClientRect()
      const ctaVisible = ctas.some((cta) => {
        const rect = cta.getBoundingClientRect()
        return rect.bottom > 1 && rect.top < window.innerHeight - 1
      })
      const heroVisible = heroRect.bottom > 1 && heroRect.top < window.innerHeight - 1
      setStickyVisible(!heroVisible && !ctaVisible)
    }
    updateStickyVisibility()
    window.addEventListener('scroll', updateStickyVisibility, { passive: true })
    window.addEventListener('resize', updateStickyVisibility)
    return () => {
      window.removeEventListener('scroll', updateStickyVisibility)
      window.removeEventListener('resize', updateStickyVisibility)
    }
  }, [])

  useEffect(() => {
    const viewed = new Set<string>()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const event = entry.target.getAttribute('data-track') as Parameters<typeof track>[0] | null
        if (event && !viewed.has(event)) { viewed.add(event); track(event) }
      })
    }, { threshold: 0.25 })
    document.querySelectorAll('[data-track]').forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const sent = new Set<Parameters<typeof track>[0]>()
    const thresholds: [number, Parameters<typeof track>[0]][] = [[.25, 'scroll_25'], [.5, 'scroll_50'], [.75, 'scroll_75'], [.9, 'scroll_90']]
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (max <= 0) return
      const progress = window.scrollY / max
      thresholds.forEach(([point, event]) => { if (progress >= point && !sent.has(event)) { sent.add(event); track(event) } })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleVideoProgress = (current: number, duration: number) => {
    if (!duration) return
    const milestones: [number, Parameters<typeof track>[0]][] = [[.25, 'hero_video_25'], [.5, 'hero_video_50'], [.75, 'hero_video_75']]
    milestones.forEach(([point, event]) => { if (current / duration >= point && !videoMilestones.current.has(event)) { videoMilestones.current.add(event); track(event) } })
  }

  const playHeroVideo = () => {
    const video = heroVideoRef.current
    if (!video) return
    if (!video.src) {
      video.src = mainVideo.src
      video.load()
    }
    video.play().catch(() => undefined)
  }

  useEffect(() => {
    const carousel = document.querySelector<HTMLElement>('.lp-whatsapp-grid')
    if (!carousel) return
    const cards = Array.from(carousel.querySelectorAll<HTMLElement>('.lp-whatsapp-card'))
    if (cards.length < 2) return
    let index = 0
    const timer = window.setInterval(() => {
      index = (index + 1) % cards.length
      carousel.scrollTo({ left: Math.max(0, cards[index].offsetLeft - 4), behavior: 'smooth' })
    }, 4500)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const carousel = howCarouselRef.current
    if (!carousel) return
    const slides = Array.from(carousel.querySelectorAll<HTMLElement>('.lp-how-slide'))
    if (slides.length < 2) return
    let scrollEndTimer = 0
    const selectNearestSlide = () => {
      window.clearTimeout(scrollEndTimer)
      scrollEndTimer = window.setTimeout(() => {
        const firstOffset = slides[0].offsetLeft
        const index = slides.reduce((nearest, slide, slideIndex) => (
          Math.abs(slide.offsetLeft - firstOffset - carousel.scrollLeft) < Math.abs(slides[nearest].offsetLeft - firstOffset - carousel.scrollLeft)
            ? slideIndex
            : nearest
        ), 0)
        setHowSlide(index)
      }, 100)
    }
    carousel.addEventListener('scroll', selectNearestSlide, { passive: true })
    return () => {
      carousel.removeEventListener('scroll', selectNearestSlide)
      window.clearTimeout(scrollEndTimer)
    }
  }, [])

  // The five tutorial artworks are important for the story, but none belongs
  // to the first viewport. Load them shortly before the section enters view so
  // mobile users get the hero and CTA without paying for below-the-fold bytes.
  useEffect(() => {
    const carousel = howCarouselRef.current
    if (!carousel || typeof IntersectionObserver === 'undefined') {
      setHowImagesReady(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return
      setHowImagesReady(true)
      observer.disconnect()
    }, { rootMargin: '600px 0px' })
    observer.observe(carousel)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const carousel = videoBonusCarouselRef.current
    if (!carousel) return
    const slides = Array.from(carousel.querySelectorAll<HTMLElement>('.lp-video-bonus-slide'))
    if (slides.length < 2) return
    let index = 0
    let scrollEndTimer = 0
    const updateActive = () => {
      window.clearTimeout(scrollEndTimer)
      scrollEndTimer = window.setTimeout(() => {
        const firstOffset = slides[0].offsetLeft
        index = slides.reduce((nearest, slide, slideIndex) => (
          Math.abs(slide.offsetLeft - firstOffset - carousel.scrollLeft) < Math.abs(slides[nearest].offsetLeft - firstOffset - carousel.scrollLeft)
            ? slideIndex
            : nearest
        ), 0)
      }, 100)
    }
    const advance = () => {
      index = (index + 1) % slides.length
      carousel.scrollTo({ left: slides[index].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' })
    }
    carousel.addEventListener('scroll', updateActive, { passive: true })
    const timer = window.setInterval(advance, 5000)
    return () => {
      carousel.removeEventListener('scroll', updateActive)
      window.clearTimeout(scrollEndTimer)
      window.clearInterval(timer)
    }
  }, [])

  const enabledBonuses = bonuses.filter((bonus) => bonus.enabled)
  const guideBonuses = enabledBonuses.filter((bonus) => bonus.id !== 'videos-receitas' && bonus.id !== 'app-pratinho')
  const videoBonuses = enabledBonuses.filter((bonus) => bonus.id === 'videos-receitas')
  const guideDisplayNames: Record<string, string> = {
    introducao: 'Introdução Alimentar',
    sono: 'Rotina do Sono — 0 a 24 meses',
    organizar: 'Cortes & Texturas',
  }
  const automaticDarkMode = true
  const howImages = automaticDarkMode ? howDarkImages : howLightImages

  return <div className={automaticDarkMode ? 'landing-page lp-dark-mode' : 'landing-page'}>
    <TopOfferBar />
      <header className="lp-header">
      <a className="lp-brand" href="#hero" aria-label="Pratinho Pronto, início"><img className="lp-logo-image" src={automaticDarkMode ? '/assets/pratinho-pronto-logo-light-small.webp' : '/assets/pratinho-pronto-logo-cropped-small.webp'} srcSet={automaticDarkMode ? '/assets/pratinho-pronto-logo-light-small.webp 1x, /assets/pratinho-pronto-logo-light-mobile.webp 2x' : '/assets/pratinho-pronto-logo-cropped-small.webp 1x, /assets/pratinho-pronto-logo-cropped-mobile.webp 2x'} sizes="190px" alt="Pratinho Pronto" width="190" height="72" fetchPriority="high" /></a>
    </header>

    <main>
      <section className="lp-section lp-hero" id="hero" ref={heroRef}>
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow"><Sparkles aria-hidden="true" size={14} /> Introdução alimentar sem o planejamento todo na sua cabeça</p>
            <h1>Chega de decidir <em>o que preparar</em> para o seu bebê <em>todos os dias.</em></h1>
            <p className="lp-lead">O Pratinho Pronto organiza o cardápio da semana, reúne receitas e encontra opções para hoje com os ingredientes que você já tem em casa.</p>
            <PrimaryButton source="hero">Quero organizar minha semana</PrimaryButton>
            <div className="lp-price-note"><strong>R$47</strong><span>pagamento único · acesso imediato</span></div>
            <div className="lp-trust-row"><span><ShieldCheck aria-hidden="true" size={18} /> Garantia de 7 dias</span><span><Clock3 aria-hidden="true" size={18} /> Acesso imediato após o pagamento</span></div>
          </div>
          <div className="lp-video-wrap">
            <div className="lp-video-label"><span className="lp-live-dot" /> Veja como funciona por dentro</div>
            {mainVideo.enabled ? <div className="lp-video-player"><video ref={heroVideoRef} className="lp-video" poster={mainVideo.poster} controls={heroVideoStarted} playsInline preload="none" onPlay={() => { setHeroVideoStarted(true); track('hero_video_play') }} onEnded={() => track('hero_video_complete')} onTimeUpdate={(event) => handleVideoProgress(event.currentTarget.currentTime, event.currentTarget.duration)}>Seu navegador não suporta vídeo. Veja o produto no checkout.</video>{!heroVideoStarted && <button className="lp-video-play-overlay" type="button" aria-label="Reproduzir vídeo" onClick={playHeroVideo}><Play aria-hidden="true" size={30} fill="currentColor" /></button>}</div> : <img className="lp-video lp-poster" src={mainVideo.poster} alt="Prévia do Pratinho Pronto" width="900" height="620" />}
          </div>
          <p className="lp-vsl-bridge">Veja o que preparar hoje — e deixe o restante da semana organizado.</p>
        </div>
        <a className="lp-scroll-hint" href="#pain"><span>Entenda a diferença</span><ArrowDown aria-hidden="true" size={16} /></a>
      </section>

      <section className="lp-section lp-pain" id="pain" data-track="objection_view">
        <div className="lp-container lp-narrow"><p className="lp-kicker">A rotina que ninguém vê</p><h2>Todo dia a mesma pergunta volta.</h2><p className="lp-question">“O que eu vou preparar <em>hoje?</em>”</p>
          <div className="lp-chaos" aria-label="Exemplos de decisões do dia a dia"><span><span className="lp-chaos-icon"><Search size={16} /></span>Uma receita salva no Instagram.</span><span><span className="lp-chaos-icon"><Heart size={16} /></span>Outra perdida no WhatsApp.</span><span><span className="lp-chaos-icon"><ShoppingBasket size={16} /></span>Um ingrediente que falta na hora.</span></div>
          <p className="lp-pain-copy">E quando o dia termina, amanhã começa tudo novamente.</p><div className="lp-divider" /><p className="lp-punch">Não é falta de receita.<br /><strong>É o peso de ter que decidir tudo novamente.</strong></p><p className="lp-soft">Foi exatamente essa parte da rotina que o Pratinho Pronto foi criado para organizar.</p>
        </div>
      </section>

      <section className="lp-section lp-how" id="how" data-track="how_it_works_view">
        <div className="lp-container">
          <div className="lp-section-intro"><p className="lp-kicker">Como funciona</p><h2>Do “o que eu faço hoje?” para a <em>semana organizada.</em></h2><p>Em poucos passos, sem aprender uma ferramenta nova.</p></div>
          <div className="lp-how-swipe-cue"><span>Arraste para o lado</span><strong>Veja os 5 passos</strong><ArrowRight aria-hidden="true" size={18} /></div>
          <div className="lp-how-carousel" ref={howCarouselRef} aria-label="Como funciona em cinco passos">
            {howImages.map((src, index) => <figure className="lp-how-slide" key={src}><img src={howImagesReady ? src : undefined} alt={howImageDescriptions[index]} width="900" height="1124" loading="lazy" /></figure>)}
          </div>
          <div className="lp-how-dots" aria-label={`Passo ${howSlide + 1} de 5`}>
            {howImages.map((_, index) => <button className={index === howSlide ? 'is-active' : ''} key={index} type="button" aria-label={`Ver passo ${index + 1}`} aria-current={index === howSlide ? 'true' : undefined} onClick={() => { const carousel = howCarouselRef.current; const slides = carousel?.querySelectorAll<HTMLElement>('.lp-how-slide'); const slide = slides?.[index]; if (slide && slides && carousel) carousel.scrollTo({ left: slide.offsetLeft - slides[0].offsetLeft, behavior: 'smooth' }); setHowSlide(index) }} />)}
          </div>
          <PrimaryButton source="how">Quero minha semana organizada</PrimaryButton>
        </div>
      </section>

      <section className="lp-section lp-benefits" id="benefits" data-track="benefits_view"><div className="lp-container"><div className="lp-section-intro"><p className="lp-kicker">O que muda na prática</p><h2>Não é só um cardápio.</h2><p>É a parte da organização que você não precisa mais carregar sozinha na cabeça.</p></div><div className="lp-benefit-grid">{[[CalendarDays,'Semana organizada','Veja as refeições dos próximos dias em um só lugar.'],[WandSparkles,'Troque só o que não gostou','Uma refeição não funciona para você? Troque somente ela.'],[Refrigerator,'Use o que já tem','Informe ingredientes disponíveis e encontre opções compatíveis.'],[ListChecks,'Lista de compras pronta','O cardápio se transforma nos ingredientes necessários para sua semana.'],[Search,'Receitas reunidas','Pare de procurar novamente algo que você já tinha encontrado.'],[FileDown,'Imprima quando quiser','Gere um PDF pronto para consultar durante a semana.']].map(([Icon,title,copy]) => { const I = Icon as typeof CalendarDays; return <div className="lp-benefit" key={String(title)}><span className="lp-icon-box"><I aria-hidden="true" size={21} /></span><h3>{String(title)}</h3><p>{String(copy)}</p></div> })}</div></div></section>

      <section className="lp-section lp-pdf" id="pdf" data-track="pdf_view">
        <div className="lp-container lp-pdf-grid">
          <div><p className="lp-kicker">Um resultado que sai da tela</p><h2>Planeje no celular.<br /><em>Cole na geladeira.</em></h2><p className="lp-lead">Uma refeição diferente para cada dia, com a semana inteira organizada para consultar de uma só vez.</p><div className="lp-highlight"><CalendarDays aria-hidden="true" size={20} /><span>Mais variedade e menos decisões durante a semana.</span></div></div>
          <div className="lp-pdf-preview">
            <div className="lp-pdf-art" aria-label="Prévia do cardápio semanal"><div className="lp-paper lp-paper-front"><div className="lp-paper-top">CARDÁPIO DA SEMANA</div><div className="lp-mini-week">{weeklyMeals.map((meal) => <div key={meal.day}><b>{meal.day}</b><img src={meal.image} alt="" width="48" height="48" loading="lazy" /><span>{meal.name}</span></div>)}</div></div></div>
            <PrimaryButton source="pdf">Quero organizar minha semana</PrimaryButton>
          </div>
        </div>
      </section>

      <section className="lp-section lp-bonuses" id="bonuses" data-track="bonus_view"><div className="lp-container"><div className="lp-section-intro"><p className="lp-kicker">Para deixar a fase mais leve</p><h2>E seu acesso ainda acompanha <em>{enabledBonuses.length} materiais de apoio.</em></h2><p>Para facilitar outras partes dessa fase sem transformar tudo em mais uma pesquisa na internet.</p></div><div className="lp-bonus-grid">{enabledBonuses.map((bonus) => <article className={`lp-bonus lp-bonus-${bonus.id}`} key={bonus.id}>{bonus.id === 'videos-receitas' ? <div className="lp-video-bonus-media"><div className="lp-video-bonus-carousel" ref={videoBonusCarouselRef} aria-label="Prévia dos vídeos de receitas">{videoBonusImages.map((src, index) => <button className="lp-video-bonus-slide" key={src} type="button" aria-label={`Reproduzir prévia ${index + 1}. Avança para a próxima receita`} onClick={() => { const carousel = videoBonusCarouselRef.current; const slides = carousel?.querySelectorAll<HTMLElement>('.lp-video-bonus-slide'); const next = (index + 1) % videoBonusImages.length; if (carousel && slides) carousel.scrollTo({ left: slides[next].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' }) }}><img src={src} alt="" width="180" height="230" loading="lazy" /><span className="lp-video-play" aria-hidden="true"><Play size={25} fill="currentColor" /></span></button>)}</div></div> : <img className="lp-bonus-cover" src={bonus.cover} alt={`Capa: ${bonus.title}`} width="180" height="230" loading="lazy" />}<div><span className="lp-badge">{bonus.id === 'videos-receitas' ? 'Bônus premium' : 'Complemento incluído'}</span><h3>{bonus.title}</h3>{bonus.subtitle && <p className="lp-bonus-subtitle">{bonus.subtitle}</p>}<p>{bonus.description}</p>{bonus.valueLabel && <div className="lp-bonus-value"><span>Valor individual</span><s>{bonus.valueLabel}</s><strong>INCLUÍDO</strong></div>}</div></article>)}</div><p className="lp-bonus-total">Valor dos materiais: <s>R${offerConfig.totalValue}</s> <strong>já incluídos no seu acesso</strong></p></div></section>

      <section className="lp-section lp-objection" id="objection" data-track="objection_view"><div className="lp-container lp-objection-grid"><div><p className="lp-kicker">Uma dúvida justa</p><h2>“Mas receita tem de graça na internet.”</h2><p className="lp-objection-answer">Tem mesmo.</p><p className="lp-lead">E é justamente por isso que o Pratinho Pronto não foi criado para ser só mais uma pasta de receitas.</p><p className="lp-lead">O valor está no que acontece depois: organizar a semana, trocar opções, aproveitar ingredientes e montar sua lista de compras em poucos passos.</p><div className="lp-contrast"><strong>Menos procura.</strong><strong>Mais organização.</strong></div></div><div className="lp-proof"><div className="lp-proof-head"><ShieldCheck aria-hidden="true" size={23} /><h3>Veja exatamente o que você está comprando.</h3></div>{['Aplicativo real','Vídeo real do funcionamento','PDFs reais','Preço transparente','Sem mensalidade escondida'].map((item) => <div className="lp-proof-line" key={item}><Check aria-hidden="true" size={15} />{item}</div>)}<p>Você já viu o produto funcionando antes de chegar ao checkout.</p></div>{testimonials.length > 0 && <div className="lp-testimonials">{testimonials.slice(0,3).map((item) => <blockquote key={item.id}><Star aria-hidden="true" size={16} fill="currentColor" />“{item.quote}”<cite>— {item.name}{item.detail ? `, ${item.detail}` : ''}</cite></blockquote>)}</div>}</div></section>

      <section className="lp-section lp-offer" id="offer" data-track="offer_view" ref={offerRef}><div className="lp-container"><div className="lp-offer-card"><div className="lp-offer-main"><p className="lp-kicker">Um único passo para uma semana mais leve</p><h2>Comece a organizar a semana do seu bebê <em>hoje.</em></h2><div className="lp-offer-columns"><div className="lp-offer-primary"><h3>PRATINHO PRONTO — ACESSO VITALÍCIO</h3><ul>{['Cardápio semanal em poucos minutos','Troque qualquer refeição facilmente','Receitas organizadas','Receitas com ingredientes que você já tem','Lista de compras automática'].map((item) => <CheckLine key={item}>{item}</CheckLine>)}</ul></div><div className="lp-offer-bonus-groups"><h3>+ 3 GUIAS PRÁTICOS INCLUSOS</h3><ul>{guideBonuses.map((bonus) => <CheckLine key={bonus.id}><span className="lp-offer-bonus"><Gift className="lp-gift-icon" aria-hidden="true" size={16} /><span>{guideDisplayNames[bonus.id] ?? bonus.title}</span></span></CheckLine>)}</ul><h3>+ BÔNUS PREMIUM</h3><ul>{videoBonuses.map((bonus) => <CheckLine key={bonus.id}><span className="lp-offer-bonus"><Gift className="lp-gift-icon" aria-hidden="true" size={16} /><span>{bonus.title}</span></span></CheckLine>)}</ul></div></div></div><div className="lp-offer-price" id="offer-price"><span className="lp-offer-price-kicker">🚀 OFERTA DE LANÇAMENTO</span><span className="lp-access-label"><b>— acesso vitalício</b></span><span className="lp-value-anchor">Valor total dos itens separadamente: <s>R${offerConfig.totalValue}</s></span><span className="lp-today-label">HOJE POR</span><strong>R$47</strong><span className="lp-one-time">pagamento único</span><span className="lp-installment">ou 11x de R$5,24 no cartão</span><span className="lp-savings">Você economiza R${offerConfig.savings}</span>{offerConfig.urgency.enabled && offerConfig.urgency.endsAt && <Countdown endsAt={offerConfig.urgency.endsAt} message={offerConfig.urgency.message} />}<PrimaryButton source="offer">QUERO MEU ACESSO VITALÍCIO</PrimaryButton><small className="lp-guarantee-note">Garantia de 7 dias conforme o art. 49 do Código de Defesa do Consumidor.</small></div></div></div></section>

      <section className="lp-section lp-guarantee" id="guarantee" data-track="guarantee_view"><div className="lp-container lp-guarantee-grid"><div className="lp-guarantee-card"><span className="lp-shield"><ShieldCheck aria-hidden="true" size={27} /></span><div><h2>Você tem 7 dias para decidir com calma.</h2><p>Se dentro do prazo aplicável à compra online o Pratinho Pronto não fizer sentido para sua rotina, você poderá solicitar o cancelamento conforme as condições informadas.</p><a href="#footer">Ver política de cancelamento <ArrowRight aria-hidden="true" size={15} /></a></div></div><div className="lp-faq"><p className="lp-kicker">Perguntas frequentes</p>{faqItems.map(([question,answer], index) => <div className="lp-faq-item" key={question}><button aria-controls={`faq-answer-${index}`} aria-expanded={openFaq === index} onClick={() => { setOpenFaq(openFaq === index ? null : index); if (openFaq !== index) track('faq_open', { question }) }} type="button"><span>{question}</span><ChevronDown aria-hidden="true" size={19} /></button><div className={`lp-faq-answer ${openFaq === index ? 'is-open' : ''}`} id={`faq-answer-${index}`} role="region"><p>{answer}</p></div></div>)}</div></div></section>

      <section className="lp-section lp-final" id="final"><div className="lp-container lp-final-inner"><p className="lp-kicker">A próxima semana começa com uma decisão</p><h2>Amanhã você pode começar tudo do zero outra vez.</h2><div className="lp-final-pause" /><h3>Ou deixar a semana organizada hoje.</h3><p>Monte. Ajuste. Gere a lista. Imprima.</p><div className="lp-final-price"><strong>R$47</strong><span>pagamento único</span></div><PrimaryButton source="final">Quero organizar minha semana</PrimaryButton><div className="lp-final-trust"><span>✓ acesso imediato</span><span>✓ funciona no celular</span><span>✓ sem mensalidade</span></div></div><footer className="lp-footer" id="footer"><div className="lp-footer-brand"><img className="lp-logo-image lp-logo-footer" src="/assets/pratinho-pronto-logo-cropped-small.webp" srcSet="/assets/pratinho-pronto-logo-cropped-small.webp 1x, /assets/pratinho-pronto-logo-cropped-mobile.webp 2x" sizes="190px" alt="Pratinho Pronto" width="190" height="72" loading="lazy" /></div><p>Pratinho Pronto é uma ferramenta educativa e de organização. Não substitui avaliação ou orientação individual de pediatra ou nutricionista.</p><div className="lp-footer-details"><span>Pratinho Pronto · [Razão social]</span><span>CPF/CNPJ: [informar]</span><a href="mailto:contato@pratinhopronto.com">contato@pratinhopronto.com</a><a href="#footer">Termos</a><a href="#footer">Política de privacidade</a><a href="#footer">Política de cancelamento</a></div></footer></section>
      <section className="lp-section lp-testimonials-section" id="testimonials" data-track="testimonials_view">
        <div className="lp-container">
          <div className="lp-section-intro">
            <p className="lp-kicker">O que chega no WhatsApp</p>
            <h2>Quando a semana fica mais fácil, a mãe percebe.</h2>
            <p>Você não precisa acreditar em uma promessa bonita. Veja uma experiência real e outros registros compartilhados por clientes depois de receberem o acesso.</p>
          </div>

          <div className="lp-testimonial-feature">
            <div className="lp-testimonial-feature-copy">
              <div className="lp-testimonial-label"><Star aria-hidden="true" size={16} fill="currentColor" /> Experiência compartilhada por cliente</div>
              <blockquote>“Já estou usando faz umas duas semanas e gostei bastante. Minha filha adorou as receitinhas do guia.”</blockquote>
              <p>É esse o objetivo do Pratinho Pronto: tirar a decisão do improviso e deixar as opções da semana mais claras para você.</p>
              <div className="lp-testimonial-results"><span>✓ Receitas reunidas</span><span>✓ Semana mais organizada</span><span>✓ Menos pesquisa na hora da refeição</span></div>
            </div>
            <figure className="lp-whatsapp-card lp-whatsapp-card-feature"><img src={customerProofImages[0].src} alt={customerProofImages[0].alt} width="740" height="1600" loading="lazy" /></figure>
          </div>

          <div className="lp-testimonial-proof-heading"><strong>Mais mensagens reais de quem recebeu o acesso.</strong><span>Pequenos “obrigada” que mostram uma coisa importante: organização faz diferença na rotina.</span></div>
          <div className="lp-whatsapp-grid" aria-label="Registros reais compartilhados por clientes">
            {customerProofImages.slice(1).map((image) => <figure className="lp-whatsapp-card" key={image.src}><img src={image.src} alt={image.alt} width="740" height="1600" loading="lazy" /></figure>)}
          </div>
          <p className="lp-testimonial-disclaimer">Números de telefone foram ocultados para preservar a privacidade.</p>
        </div>
      </section>

    </main>
    {stickyVisible && <div className="lp-sticky"><div><strong>R$47</strong><span>pagamento único</span></div><button onClick={() => { track('hero_cta_click', { source: 'sticky' }); goToCheckout('sticky') }} type="button">Quero começar <ArrowRight aria-hidden="true" size={17} /></button></div>}
  </div>
}

function getEndOfToday() {
  const deadline = new Date()
  deadline.setHours(23, 59, 59, 999)
  return deadline
}

function formatOfferDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date)
}

function TopOfferBar() {
  const [deadline, setDeadline] = useState(getEndOfToday)

  useEffect(() => {
    const update = () => {
      setDeadline(getEndOfToday())
    }
    update()
    const id = window.setInterval(update, 60_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="lp-top-offer-bar" role="region" aria-label="Oferta de acesso vitalício">
      <span className="lp-top-offer-copy">⏳ <strong>ACESSO VITALÍCIO POR R$47 ATÉ {formatOfferDate(deadline)}</strong> ⏳</span>
    </div>
  )
}

function Countdown({ endsAt, message }: { endsAt: string; message: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()))
  useEffect(() => { const id = window.setInterval(() => setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now())), 1000); return () => window.clearInterval(id) }, [endsAt])
  if (remaining <= 0) return null
  const totalSeconds = Math.floor(remaining / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return <div className="lp-countdown"><span>{message}</span><strong>{days > 0 ? `${days}d ` : ''}{String(hours).padStart(2,'0')}:{String(minutes).padStart(2,'0')}:{String(seconds).padStart(2,'0')}</strong></div>
}
