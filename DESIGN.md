# Pratinho Pronto — Sistema visual

Este documento resume as decisões de design aplicadas ao produto e serve como
guia para novos componentes e telas. As decisões vivem em código como classes
utilitárias `pp-*` e variáveis de tema em `src/index.css`; **este arquivo é
descritivo, não normativo** — a fonte da verdade continua sendo o CSS.

## 1. Conceito

**"Cozinha acolhedora, organizada e contemporânea."**

O produto é para mães de bebês em introdução alimentar: usuária adulta, em
pouco tempo, que precisa ver rapidamente **o que preparar hoje**, **como
preparar**, **o que comprar** e **como está a semana**. A percepção-alvo é a
de um produto pago, editorial, próximo de uma revista de cozinha com camada
de organização — e não de um dashboard técnico.

Por isso o design entrega:

- **Uma decisão por tela**: existe sempre uma ação principal única.
- **Hierarquia por foto e tipografia**, não por caixas coloridas.
- **Densidade média** no celular; nada de "ar" que exija rolagem inútil,
  nada de tabelas espremidas.
- **Cor comedida**: paletas terrosas (sálvia, cream, terracota) com um único
  laranja abóbora para a ação principal.

## 2. Direção escolhida — Proposta C (Híbrida)

O padrão adotado nas telas reais é a **Proposta C**: o dia relevante (por
padrão, hoje) aparece em destaque com foto grande, badges de refeição e dia,
e um par de ações inequívoco (**Ver como preparar** primária, **Trocar**
secundária). Abaixo, o resto do dia em lista média; depois, a semana inteira
em uma lista compacta que serve de mapa e de navegação; ao final, as saídas
da semana (lista de compras e PDFs) e a área de configuração (montar/refazer
a semana).

Foi escolhida porque:

1. **Decisão imediata sem perder o mapa.** A mãe abre e já sabe o que fazer
   agora, mas continua vendo a semana inteira sem sair da tela.
2. **Escala bem no celular e no desktop** — a Editorial (A) alonga demais a
   página no mobile e a Planejadora (B) tira a foto de cena, que é parte
   central do valor percebido.
3. **É consistente com o resto do produto**: Início e Detalhe da receita já
   usam a mesma composição foto grande + par de ações.

## 3. Paleta e papel de cada cor

Todas as cores vivem como variáveis em `@theme` e são reencadeadas em
`[data-theme='dark']`, o que garante paridade dos dois modos.

| Cor           | Uso                                                                        |
|---------------|----------------------------------------------------------------------------|
| **Sálvia**    | Organização, seleção, estados "ok", ícones informativos, foco.             |
| **Terracota** | Marcadores editoriais (`pp-eyebrow`, badges de refeição), favorito ativo.  |
| **Vinho/beet**| Reservado ao acento do PDF e ao favorito preenchido.                       |
| **Cream**     | Fundo geral, superfícies "afundadas" (`pp-sunken`, `pp-panel-quiet`).      |
| **Abóbora**   | **Somente** a ação principal por tela (`pp-btn-primary`).                  |
| **Ink**       | Escala de texto — 500 (auxiliar), 700 (corpo), 900 (títulos).              |

Regra prática:

- Ação primária: 1 por tela, sempre abóbora.
- Ação secundária: contorno sálvia.
- Ação terciária ("quiet"): fundo sálvia claro.
- Nada de fundo colorido para agrupar conteúdo — usar borda hairline ou
  `pp-sunken`.

## 4. Tipografia

- **Serif — Fraunces (600)** em `h1`, `h2`, `h3` (variação `SOFT 50, WONK 0`).
  Peso 700 não é carregado; não pedir.
- **Sans — Karla** no corpo, botões, campos e labels.

Escala (mobile → desktop):

| Uso                    | Mobile         | Desktop         |
|------------------------|----------------|-----------------|
| H1 de página           | 26–28 px       | 32–38 px        |
| H1 de destaque hero    | 32 px          | 44–52 px        |
| H2 de seção            | 18–20 px       | 22–24 px        |
| H3 de cartão           | 16–18 px       | 18–20 px        |
| Corpo                  | 15–16 px       | 15–16 px        |
| Metadados / meta       | 12–13 px       | 12–13 px        |
| Eyebrow (`pp-eyebrow`) | 12 px caixa alta, letter-spacing 0.1em |

Regras:

- Títulos usam `letter-spacing: -0.02em` (H2/H3) e `-0.035em` (H1).
- Nomes longos: `break-words` + `text-wrap: pretty` para evitar viúva.
- `min-height` no botão define o "peso" do CTA, não o `font-size`.

## 5. Espaçamento

Escala baseada em múltiplos de 4: **4 / 8 / 12 / 16 / 24 / 32 / 40**.

- Padding padrão de cartão: **16–24 px** (`p-4` a `p-6`).
- Padding de painel destaque: **20–28 px**.
- Gap entre itens de lista: **8–12 px**.
- Gap entre seções: **24–40 px** (`mt-6` a `mt-10`).
- Toque mínimo: **44 × 44 px** — botões de ação: **48 px** (`pp-btn`), CTA
  principal: **52 px** (`pp-btn-lg`).

## 6. Largura de conteúdo

- Página **de fluxo linear** (semana, receita): `max-w-4xl` (~896 px).
- Página **densa** (grade de receitas, cozinha): `max-w-4xl`/`max-w-5xl`.
- Painel do PWA shell: `max-w-6xl`.
- Padding lateral do main: `px-5` no mobile, `px-8` no desktop.

## 7. Raios, bordas e sombras

Raios (variáveis `--radius-*`):

- Campo, botão: **14 px**.
- Cartão: **18 px**.
- Painel/modal: **24 px**.
- Pílula/badge: **999 px**.

Bordas:

- Todos os cartões carregam borda hairline (`--pp-border`), inclusive no
  tema escuro. Nunca "flutuam" só por sombra.

Sombras (três degraus, sempre discretas):

- `--pp-shadow-soft`: cartão em repouso.
- `--pp-shadow-lifted`: painel de destaque (hero, próxima refeição).
- `--pp-shadow-modal`: modais e diálogos.

## 8. Foto do prato

- Todos os arquivos de `public/images/recipes/` são **quadrados** (a
  normalização foi feita fisicamente nos 10 arquivos que estavam em 4:3 —
  ver §14).
- O CSS **define o enquadramento por contexto** com `aspect-ratio` fixo e
  `object-fit: cover`. Nunca alterar `object-fit` para `contain` ou
  distorcer com `width/height`.
- Enquadramentos padronizados (`.pp-photo-*`):

  | Contexto                     | Aspect ratio        | Componente          |
  |------------------------------|---------------------|---------------------|
  | Miniatura de lista (item)    | 1:1                 | `pp-photo-thumb`    |
  | Cartão da grade de receitas  | 4:3                 | `pp-photo-card`     |
  | Destaque do dia / próxima    | 1:1                 | `pp-photo-feature`  |
  | Hero da receita              | 4:3 mobile, 16:9 ≥sm| `pp-photo-hero`     |

- O placeholder é um ícone `Salad` dentro de um chip sálvia — mesma escala,
  mesma cor, mesma borda das fotos reais.
- Fotos-primeiras-da-tela recebem `priority` (`fetchpriority=high`,
  `loading=eager`).

## 9. Ícones

- Fonte única: **lucide-react**. Não misturar bibliotecas.
- Tamanhos por contexto:
  - Ícone dentro de botão: **17–19 px**.
  - Ícone auxiliar em meta (relógio, calendário): **13–15 px**.
  - Ícone em selo / chip circular de fundo: **19–22 px** dentro de um
    quadrado 40–44 px com fundo sálvia.
- Todos os ícones decorativos levam `aria-hidden="true"`.
- Nunca comunicar estado só por ícone: acompanhar com rótulo, borda ou
  negrito.

## 10. Botões

Quatro variantes principais, todas com `min-height` ≥ 44 px:

- `pp-btn-primary` (abóbora) — **uma por tela**.
- `pp-btn-secondary` (contorno sálvia) — continuar o fluxo.
- `pp-btn-quiet` (fundo sálvia claro) — ações locais dentro de um cartão.
- `pp-btn-outline` (contorno neutro) — ações periféricas.

Modificadores: `pp-btn-lg` (52 px, CTA principal), `pp-btn-sm` (44 px,
ações em cartão), `pp-icon-btn` (quadrado 44 px para navegação).

## 11. Campos

- Todos os campos usam `.pp-field`: fundo `--pp-surface-sunken`, borda
  hairline, `border-radius: 14px`, altura mínima 48 px, `font-size: 16px`
  para não disparar zoom automático no iOS.
- `.pp-field-label` para o rótulo (13 px, semibold, cor `--color-ink-500`).
- Busca: `input type="search"` com ícone de lupa absoluto e padding-left
  `pl-11`.

## 12. Estado selecionado (nunca só cor)

`.pp-selectable` responde a `[aria-pressed='true']`, `[data-selected='true']`
e `[aria-current='true']` com:

- fundo sálvia claro,
- borda sálvia,
- **`box-shadow: inset 0 0 0 1px`** (segundo traço para acessibilidade),
- peso da fonte **600**,
- cor `sage-700`.

Assim, o estado é percebido por quem não distingue cor.

## 13. Estados de tela

Todos usam `PageState` (`src/components/ui/PageState.tsx`), que muda **ícone,
título, descrição e ação**, não apenas cor:

- **loading**: `LoaderCircle` girando; título "…" e descrição.
- **error**: `TriangleAlert` sobre chip terracota; `role="alert"`; ação de
  recuperação obrigatória (recarregar, voltar).
- **empty**: `Inbox` (padrão) ou ícone contextual (`CalendarDays`,
  `ListChecks`, `Search`); ação sugerida quando existir.
- **success**: `CircleCheck` — usado com moderação, para confirmações
  autocontidas.

`prefers-reduced-motion` desabilita giro do spinner via classe
`motion-reduce:animate-none`.

## 14. Fotos — o que foi feito com as duas proporções

Havia dois grupos de arquivos: 62 em 1254×1254 e 10 em 1200×900 (4:3). O
mistura quebrava o enquadramento porque o mesmo componente `.pp-photo-card`
mostrava um pedaço da foto quadrada e a foto 4:3 inteira, com resultados
visuais inconsistentes.

**Solução aplicada**:

1. As 10 fotos 4:3 foram **normalizadas em disco para quadrado 900×900** com
   **recorte centralizado** (nunca esticadas), usando Pillow. As dimensões
   ficaram: 62 arquivos em 1254² e 10 em 900² — todas quadradas.
2. O componente `RecipeVisual` continua definindo o enquadramento pelo
   contexto (`pp-photo-thumb`, `pp-photo-card`, `pp-photo-feature`,
   `pp-photo-hero`) via `aspect-ratio` + `object-cover`. Isso mantém o mesmo
   corte para todas as fotos independentemente da resolução física.
3. Nada foi feito no mapa de fotos (`src/lib/recipes/images.ts` é da
   fronteira de B).

## 15. Mobile

- **Barra fixa inferior** com cinco atalhos, dentro de uma pílula flutuante
  com sombra `pp-shadow-lifted` e `pb-[max(0.75rem,env(safe-area-inset-bottom))]`
  para respeitar a borda do iPhone.
- `pb-28` no body do shell para que a barra fixa **nunca cubra** ações da
  página.
- `.pp-scroller` para faixas horizontais (dias, semanas salvas, vídeos)
  sem barra visível e com `-webkit-overflow-scrolling: touch`.
- `overflow-x: hidden` no body para evitar scroll horizontal acidental
  causado por nomes longos.

## 16. Tema escuro

- Alternância por `data-theme="dark"` no `<html>`; toggle em
  `ThemeToggle`.
- Todas as variáveis `--color-*` e `--pp-*` são reescritas para o modo
  escuro; **nenhum componente precisa saber do tema**.
- Sombras ficam mais opacas (`rgba(0,0,0,…)`), fundos "quentes" perdem
  saturação (creme vira marrom-escuro), texto ganha claridade.
- `.bg-white` e variantes com opacidade caem para `--color-surface` no
  escuro (regra no fim do CSS) para evitar cartões brancos surgindo.
- Alvo de contraste: **≥ 4,5:1** para texto normal em ambos os temas.

## 17. Movimento

- Toda transição usa `160ms ease-out` em `border-color`, `background-color`,
  `color`, `box-shadow`. Nada de `transform` para hover.
- Skeletons pulsam a 1,6 s.
- `@media (prefers-reduced-motion: reduce)` reduz duração e desliga
  spinners; nenhuma UX depende de animação.

## 18. Acessibilidade

- Foco visível **sempre** (`outline: 3px solid var(--pp-focus-ring)` +
  `outline-offset: 3px`). Nunca `outline: none` sem substituto.
- Toque mínimo 44 px.
- Botões e ícones decorativos separados: rótulo obrigatório em
  `aria-label` para `pp-icon-btn`; ícones dentro de botões com texto usam
  `aria-hidden="true"`.
- Modais: foco no botão de fechar ao abrir, `Esc` fecha, clique no fundo
  fecha, retorno de foco ao gatilho.
- Live regions: `aria-live="polite"` para mensagens de sucesso;
  `role="alert"` para erros.
- Cores nunca são o único portador de significado: badges "Hoje" e itens
  selecionados também mudam texto/negrito/borda.

## 19. PDF (`components/pdf/documents.tsx`)

Impressão econômica e legível em preto e branco:

- Papel branco, fonte Helvetica (embutida no react-pdf), tinta cinza-escuro
  (`#22221C`).
- Hierarquia por **tamanho, peso e filetes** — não por fundos coloridos.
  Um único acento vinho é aceito na eyebrow.
- Filete grosso após o título; filetes hairline entre linhas e dentro de
  cartões de receita.
- Margens generosas (42/40 px) para não cortar na borda de impressão.
- Rodapé fixo em todas as páginas com o aviso profissional.
- `wrap={false}` em linhas curtas (dia, item de compras) para evitar quebras
  feias; `minPresenceAhead` em blocos grandes (receita completa) para não
  isolar o título no rodapé.

## 20. Preview isolada

`src/preview/` mostra as três propostas com dados fictícios idênticos
(`fixtures.ts`), incluindo o nome longo **"Grão-de-bico com cenoura e
quinoa"** para testar quebra de texto. A prévia:

- não fala com Supabase, auth, rede ou analytics;
- restaura o `data-theme` anterior ao sair, para não interferir na
  preferência do usuário;
- oferece alternador A / B / C e claro/escuro no cabeçalho.

Para expor a rota, adicionar em `src/routes/router.tsx` o import e o path
`/preview` — a rota **não foi adicionada aqui** para respeitar a fronteira
de A. O trecho está no relatório final da entrega.
