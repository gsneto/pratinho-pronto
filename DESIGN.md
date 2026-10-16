---
version: alpha
name: Pratinho Pronto
description: "Companheiro botânico para organizar a rotina alimentar, com temas claro e escuro."
colors:
  primary: "#2e5b4b"
  on-primary: "#ffffff"
  canvas: "#fff9f2"
  surface: "#ffffff"
  sunken: "#f6efe4"
  feature: "#e6efe7"
  ink: "#27342e"
  body: "#3e4a43"
  muted: "#5c6961"
  peach: "#f4b69d"
  on-peach: "#6b3b28"
  danger-surface: "#fbe9e3"
  danger: "#9d4a36"
  border: "#ece5d8"
  photo-action: "#f4b69d"
  dark-primary: "#c0e8d1"
  dark-on-primary: "#173631"
  dark-canvas: "#0f2a28"
  dark-surface: "#173631"
  dark-sunken: "#12302c"
  dark-feature: "#22483f"
  dark-ink: "#f2f7ef"
  dark-body: "#d9e8dd"
  dark-muted: "#b4c9bf"
  dark-peach: "#f0bd9f"
  dark-on-peach: "#4a3330"
  dark-danger-surface: "#4a3330"
  dark-danger: "#f0b8ac"
  dark-border: "#2c4c42"
  dark-photo-action: "#f0bd9f"
  on-photo-action: "#2a2a22"
typography:
  page-title:
    fontFamily: Fraunces
    fontSize: 38px
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  page-title-mobile:
    fontFamily: Fraunces
    fontSize: 27px
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  body:
    fontFamily: Karla
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  button:
    fontFamily: Karla
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
  meta:
    fontFamily: Karla
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  eyebrow:
    fontFamily: Karla
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.13em"
rounded:
  field: 16px
  card: 22px
  panel: 28px
  pill: 999px
spacing:
  control: 12px
  card: 18px
  panel: 24px
components:
  page-title:
    typography: "{typography.page-title}"
  page-title-mobile:
    typography: "{typography.page-title-mobile}"
  body:
    typography: "{typography.body}"
  eyebrow:
    typography: "{typography.eyebrow}"
  canvas:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    rounded: "{rounded.card}"
    padding: "{spacing.card}"
  sunken:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.body}"
  feature-panel:
    backgroundColor: "{colors.feature}"
    textColor: "{colors.body}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  muted-copy:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    typography: "{typography.meta}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.field}"
    padding: "{spacing.control}"
  meal-label:
    backgroundColor: "{colors.peach}"
    textColor: "{colors.on-peach}"
    rounded: "{rounded.pill}"
  error-feedback:
    backgroundColor: "{colors.danger-surface}"
    textColor: "{colors.danger}"
  divider:
    backgroundColor: "{colors.border}"
    height: "1px"
  photo-button:
    backgroundColor: "{colors.photo-action}"
    textColor: "{colors.on-photo-action}"
  dark-canvas:
    backgroundColor: "{colors.dark-canvas}"
    textColor: "{colors.dark-ink}"
  dark-card:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-body}"
    rounded: "{rounded.card}"
    padding: "{spacing.card}"
  dark-sunken:
    backgroundColor: "{colors.dark-sunken}"
    textColor: "{colors.dark-body}"
  dark-feature-panel:
    backgroundColor: "{colors.dark-feature}"
    textColor: "{colors.dark-body}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  dark-muted-copy:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-muted}"
    typography: "{typography.meta}"
  dark-button-primary:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.field}"
    padding: "{spacing.control}"
  dark-meal-label:
    backgroundColor: "{colors.dark-peach}"
    textColor: "{colors.dark-on-peach}"
    rounded: "{rounded.pill}"
  dark-error-feedback:
    backgroundColor: "{colors.dark-danger-surface}"
    textColor: "{colors.dark-danger}"
  dark-divider:
    backgroundColor: "{colors.dark-border}"
    height: "1px"
  dark-photo-button:
    backgroundColor: "{colors.dark-photo-action}"
    textColor: "{colors.on-photo-action}"
---

# Pratinho Pronto — Sistema visual

## Overview

**Cozinha acolhedora, organizada e contemporânea.** A interface atende quem
cuida de um bebê e precisa decidir o que preparar, consultar instruções,
organizar a semana e levar uma lista prática ao mercado.

A direção aplicada é **botânica e editorial**: verde profundo, superfícies
claras, fotografias de comida e títulos serifados. Conteúdo e tipografia
estabelecem a hierarquia; a navegação mantém as ações diárias ao alcance.

O front matter registra tokens extraídos da implementação. O runtime usa
`src/index.css` e, depois, `src/ui-refresh.css`, importado em `src/main.tsx`.
A segunda folha define a apresentação atual e substitui defaults antigos.
Novos componentes devem manter tokens e CSS sincronizados.

`tokens.json` (DTCG) e `tailwind.theme.json` são exportações de intercâmbio.
Não são importados pelo app nem substituem automaticamente o seu `@theme`.
Os tokens `dark-*` documentam o tema alternativo; o runtime troca variáveis
com `data-theme="dark"`, sem duplicar a árvore de componentes.

## Colors

| Papel | Claro | Escuro | Aplicação |
|---|---|---|---|
| Ação | `#2e5b4b` | `#c0e8d1` | Botão principal, filtros e dia selecionado |
| Texto sobre ação | `#ffffff` | `#173631` | Rótulos e ícones da ação |
| Página | `#fff9f2` | `#0f2a28` | Fundo geral (creme quente) |
| Superfície | `#ffffff` | `#173631` | Cartões, cabeçalho e campos |
| Superfície recuada | `#f6efe4` | `#12302c` | Agrupamentos discretos |
| Destaque botânico | `#e6efe7` | `#22483f` | Despensa, perfil e progresso |
| Títulos | `#27342e` | `#f2f7ef` | Ink 900 |
| Corpo | `#3e4a43` | `#d9e8dd` | Ink 700 |
| Auxiliar | `#5c6961` | `#b4c9bf` | Ink 500; escurecido na V3 para manter 4,5:1 sobre `sage-50` |
| Pêssego | `#f4b69d` | `#f0bd9f` | Identificação da refeição e acentos |
| Texto sobre pêssego | `#6b3b28` | `#4a3330` | Rótulos de refeição |
| Borda | `#ece5d8` | `#2c4c42` | Separação de superfícies |

- O **CTA principal é verde**, não laranja. `--pp-action` e
  `--pp-on-action` controlam o par nos dois temas.
- Terracota identifica erros e detalhes editoriais; nunca é o único sinal.
- O controle existente de foto mantém `pumpkin` (`#e7bb8b` / `#e9c097`)
  com texto `#2a2a22`. Não usar esse legado como cor do CTA global.
- No painel de perfil, a idade usa **ink 700**: ink 500 sobre `feature`
  produzia contraste de 4,38:1 no claro, abaixo da meta de 4,5:1.
- Texto normal deve atingir 4,5:1; títulos grandes, 3:1. Verificar a
  combinação renderizada, incluindo estados e opacidades.
- Foco usa `--pp-focus-ring` (`#377967` / `#bee7d0`).

## Typography

- **Fraunces 600** nos títulos editoriais, com `SOFT 50` e `WONK 0`.
  `font-synthesis: none` evita inventar pesos ausentes.
- **Karla 400/500/600** nos textos, controles e títulos compactos de cards.
- Fontes servidas localmente pelos pacotes `@fontsource`.

| Elemento | Regra em uso |
|---|---|
| Título de página | `clamp(27px, 4vw, 38px)`, linha 1,12 |
| Título da home no mobile | 32 px |
| Título de seção | 23 px; 22 px até 600 px |
| Título do card de receita | Karla 18 px; 15 px até 600 px |
| Card em tela menor que 360 px | Uma coluna; título 19 px |
| Corpo e campos | Base 16 px; descrições de página 15 px |
| Botão | 15 px; variantes compactas 13 px |
| Metadados | 12–13 px, com exceções compactas no CSS |
| Eyebrow | 11 px, peso 600, caixa alta, tracking 0,13 em |

Títulos longos devem quebrar dentro da coluna. Usar `min-width: 0`,
`overflow-wrap` e `text-wrap: pretty` nos contextos existentes. Não truncar
texto necessário ao preparo para esconder um problema de layout.

## Layout

### Estrutura de navegação

- Workspace máximo de **1440 px**, sidebar de **210 px** e conteúdo flexível.
- Cabeçalho desktop sticky com **80 px**: marca, tema, perfil e saída.
- Acima de 900 px: navegação lateral com Início, Semana, Receitas, Despensa,
  Compras e Perfil do bebê.
- Até 900 px: sidebar oculta; barra inferior fixa com os cinco destinos
  principais. Perfil e saída continuam no cabeçalho.
- Cabeçalho de 72 px até 900 px e 68 px até 600 px.
- O main reserva padding inferior para a barra e
  `env(safe-area-inset-bottom)`; nenhum CTA final pode ficar atrás dela.
- Em 320 px, a marca reduz para 105 px para preservar os três controles.

## Organização por tela

### V3.1 — "Editorial Living UI": a composição da Home mudou

A Home deixou de ser uma pilha de nove blocos de largura total (título grande →
busca → três cartões de números → dois painéis grandes). A decisão tomada:

1. **Capa assimétrica.** Um único `pp-hero` em duas colunas: à esquerda o
   contexto (semana, título, refeição de hoje com CTA); à direita a fotografia
   da refeição ocupando a coluna inteira. Antes a foto era uma miniatura de
   250×312 dentro de um painel; agora ocupa ~421×337 numa coluna própria. A
   comida passa a ser o primeiro foco visual.
2. **Resumo integrado.** Os três cartões idênticos viraram **uma barra
   segmentada** (`pp-stat-strip`), com divisores, dentro do fluxo da capa.
3. **Ritmo da semana.** Nova faixa de sete dias (`pp-rhythm`) que mostra, sem
   virar grade de caixas, quais dias têm refeição e qual é hoje.
4. **Apoio compacto.** O painel grande de despensa e os atalhos empilhados
   viraram três cartões baixos (`pp-support`, 96 px) que não disputam o foco.

No catálogo, a grade deixou de ser um muro de cards idênticos: **o primeiro
resultado abre a página como matéria** (`grid-column: 1/-1`, imagem 21:9, título
maior) e os demais formam a grade. O hero do detalhe da receita cresceu para
~503 px de altura com título de 44 px.

Na Semana, a refeição em destaque ganhou foto maior e as linhas do "resto do
dia" miniaturas de 4,5 rem. Nas Compras, o cabeçalho de categoria fica fixo ao
rolar e a linha marcada recebe leve tom — o progresso deixa de depender só do
texto riscado.

Tudo isso é composição e CSS: nenhuma rota, contrato, consulta ou regra de
negócio foi alterada. Evidências antes/depois em
`entregaveis/capturas/v3.1/` (pasta ignorada pelo Git).

### Organização geral

| Tela | Ordem e comportamento |
|---|---|
| Início | Saudação, busca, próxima refeição, despensa/compras/favoritos, próximas refeições, materiais e vídeos |
| Receitas | Busca, chips de refeição/favoritas, filtros de idade e tempo, contagem, grade |
| Semana | Dias, refeição em destaque e troca, restante do dia, mapa semanal, PDFs e geração recolhível |
| Receita | Foto, identificação, ingredientes, etapas marcáveis, modo de servir e planejamento |
| Despensa | Busca sem dependência de acento, seleção preservada, resultados e faltantes |
| Compras | Semana selecionada, progresso semântico, grupos de itens e impressão |
| Perfil | Resumo do bebê, foto, preferências editáveis e retorno de sucesso/erro |
| Login/onboarding | Formulário curto, labels explícitos e erros associados aos campos |

A Semana mantém a composição híbrida de destaque + mapa. Os protótipos
A/B/C em `/preview` são uma comparação separada, não a demonstração
funcional usada para validar todas as telas.

### Espaçamento e responsividade

- Padding do main: `38px clamp(24px, 3.5vw, 56px) 28px` no desktop.
- Até 900 px: laterais de 24 px; até 600 px: 20 px; abaixo de 360 px: 16 px.
- Seções da home: gap de 32 px no desktop e 26 px no mobile.
- Grade de receitas: 3 colunas; 2 até 1200 px; 1 abaixo de 360 px.
- Faixas horizontais devem rolar **dentro** de `.pp-scroller`. O histórico
  de semanas não usa margem horizontal negativa: ela alargava o documento
  em 320 e 768 px.
- Não tratar `overflow-x: hidden` do body como correção para conteúdo
  cortado. Verificar `document.documentElement.scrollWidth` e os limites
  dos controles no navegador.

## Elevation & Depth

- **V3:** cartões e painéis principais usam borda **e** sombra quente discreta
  (`--pp-shadow-soft`), dando profundidade sem ruído. A camada anterior era
  "borda apenas".
- `--pp-shadow-lifted` é reservado a destaques e ao hover dos cards;
  `--pp-shadow-modal` separa diálogos do backdrop.
- Fundos escuros são verde-petróleo; sombra não substitui borda.

## Shapes

- Campo e botão: **16 px**.
- Card: **22 px**; card da grade mobile: **20 px**.
- Painel e diálogo: **28 px**; card principal da home desktop: **30 px**.
- Ícones de ação: botões circulares; badges e chips usam formas próprias.
- Botão padrão: altura mínima 48 px; grande: 52 px; compacto: 44 px.
- Alvos de ícone e navegação devem manter pelo menos 44 × 44 px.

## Components

### Fotografias e ícones

`RecipeVisual` usa `object-fit: cover`: recortar, nunca esticar. O
enquadramento base é ajustado pelo contexto na camada de refresh.

| Contexto atual | Proporção |
|---|---|
| Miniatura | 1:1 |
| Grade | 5:4 desktop; 1:1 até 600 px; 4:3 abaixo de 360 px |
| Próxima refeição na home | 4:5; 16:9 entre 601 e 1200 px; 3:4 até 600 px |
| Destaque da semana | 5:4; 16:9 até 600 px |
| Hero do detalhe | 16:9 com limite de 440 px; 5:4 até 600 px |

Fotos indisponíveis mantêm placeholder contextual. A biblioteca de ícones
é `lucide-react`; elementos decorativos carregam `aria-hidden="true"`.
A marca usa `object-contain` com largura e altura limitadas ao contêiner;
não deixar a caixa da imagem sobrepor o texto adjacente no login.

### Botões, campos e feedback

- `pp-btn-primary`: par verde/on-action. Secundários usam contorno;
  terciários, superfície discreta. Preservar a hierarquia da tarefa.
- `.pp-field` usa superfície do tema, borda forte e label associado.
  O placeholder complementa, nunca substitui, o label.
- Campos base têm 16 px. Selects compactos de filtros usam 14 px no mobile;
  o comportamento em Safari/iOS exige validação em aparelho real.
- Erros de formulário usam `aria-invalid` e `aria-describedby`; erros de
  operação usam `role="alert"`; confirmações usam região de status.
- O input nativo de foto é `hidden` e tem `aria-label` descritivo. O botão
  visível abre o seletor; não criar parada de teclado invisível e sem nome.
- `PageState` distingue carregamento, vazio e erro com texto, ícone e ação.
  Uma consulta carregando não pode aparecer como semana inexistente.

### Seleção, preparo e modais

- Chips, dias e itens comprados expõem `aria-pressed` ou `aria-current`
  conforme sua função. Estado visível combina texto, peso, ícone ou borda.
- `CookingSteps` marca etapas sem reescrever instruções do catálogo;
  recomeçar limpa a marcação da sessão de preparo.
- `useDialogFocus` mantém Tab/Shift+Tab no diálogo, abre no controle
  inicial, fecha com Escape e devolve o foco ao gatilho ainda existente.
  Passar a referência explícita do gatilho: um clique no WebKit não
  necessariamente o torna `document.activeElement`.
- Diálogos bloqueiam a rolagem do body. Falhas ao salvar mantêm contexto
  e permitem tentar novamente.
- O skip link leva ao `main#app-main`, focalizável por programação. Usar
  `tabIndex={0}` explícito no link para a navegação por Tab no WebKit.

### Tema e movimento

A preferência usa `pratinho-pronto-theme` no armazenamento local e
`data-theme` no HTML. Alternar e recarregar deve conservar a escolha.

**V3 — movimento (`src/v3-refresh.css`).** A escala é curta e consistente:
`--pp-dur-fast` 120 ms, `--pp-dur` 180 ms, `--pp-dur-slow` 240 ms, com
`--pp-ease` e `--pp-ease-spring`. Interações com feedback: botões (afundam
1 px ao pressionar), cartões de receita (elevam 4 px e aproximam a foto no
hover), favoritar (coração pulsa), marcar item da lista (o visto entra com
mola), progresso (largura animada), diálogos (entrada por transform) e
esqueletos (brilho deslizante).

Regra de ouro: **nenhuma animação altera opacidade de texto**. O painel do
diálogo é filho do backdrop; animar opacidade deixaria o texto em contraste
parcial durante a transição — por isso a entrada do diálogo anima apenas
`transform`. `prefers-reduced-motion` reduz transições/animações a zero e o
esqueleto volta ao fundo sólido. Nenhuma ação depende de animação.

### PDFs

Cardápio, receitas e lista de compras são documentos A4 produzidos por
`@react-pdf/renderer`, com fundo branco, Helvetica, hierarquia por filetes
e peso, margens de impressão e aviso profissional no rodapé. O PDF é
carregado sob demanda; a verificação local cobre download pelo botão real.

## Do's and Don'ts

- Usar tokens semânticos dos dois temas; não copiar o antigo CTA abóbora.
- Conservar navegação, filtros, contexto da semana e tratamento de erro.
- Manter a ação de sair acessível também em 320 e 390 px.
- Não apresentar dados fictícios ou mocks como backend validado.
- Não alterar instruções alimentares, idades ou alegações clínicas para
  acomodar o layout. As fixtures reutilizam o catálogo SQL demonstrativo.
- Não declarar conformidade WCAG integral apenas porque axe não encontrou
  violações. Itens `incomplete` precisam de revisão própria.

## Verificação e preview local

A demonstração funcional das telas reais fica em
**http://127.0.0.1:4178/app**, iniciada por `npm run qa:serve` após
`npm run qa:build`. O banner identifica dados fictícios de Alice. Estado
vive em memória, com relógio de fixture fixo; nada autentica ou grava no
Supabase de produção.

O build isolado usa `tmp/ui-qa-dist`, não `dist`; desativa analytics e não
lê `.env.local`. O servidor aceita apenas loopback e mesma origem. As
suítes bloqueiam requisições externas. Não iniciar testes enquanto alguém
edita a demonstração: cada caso reinicia o estado compartilhado.

Comandos, cobertura, evidências e limitações estão em `qa/README.md` e
`output/ui-qa/report-v2.md`. A rota antiga `/preview` já está registrada no
router; não é necessário adicioná-la novamente.
