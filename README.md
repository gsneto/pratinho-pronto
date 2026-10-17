<div align="center">

<img src="public/brand/pratinho-pronto-logo.png" alt="Pratinho Pronto" width="340" />

**Planejamento alimentar semanal para introdução alimentar**

Do perfil do bebê ao cardápio da semana, da despensa à lista de compras — e tudo pronto para imprimir.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_+_Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![PWA](https://img.shields.io/badge/PWA-instal%C3%A1vel-5A0FC8?logo=pwa&logoColor=white)](#-funcionalidades)
![Node](https://img.shields.io/badge/Node-%E2%89%A522.12-339933?logo=nodedotjs&logoColor=white)
![Testes](https://img.shields.io/badge/testes-302-2EA043?logo=vitest&logoColor=white)

</div>

---

## 📖 Visão geral

O Pratinho Pronto organiza a semana alimentar de um bebê em poucos minutos. A
partir da idade e das restrições cadastradas, o app monta um cardápio semanal
determinístico, permite trocar refeições pontuais sem reembaralhar o resto da
semana, deriva a lista de compras e exporta tudo em PDF A4 para imprimir.

| | |
| :--- | :--- |
| 🎯 **Problema** | Planejar a semana de introdução alimentar exige conciliar idade, texturas, alergênicos e compras. |
| 💡 **Solução** | Um fluxo único: perfil do bebê → cardápio → despensa → lista de compras → PDF. |
| 📱 **Formato** | Web app mobile-first, instalável como PWA, com tema claro e escuro. |
| 🔒 **Dados** | Postgres com Row Level Security: cada conta enxerga apenas os próprios dados. |

## ✨ Funcionalidades

### 👶 Perfil e acesso

- 🔐 **Autenticação por e-mail e senha** (Supabase Auth). O primeiro acesso cria
  a senha usando o e-mail da compra aprovada.
- 🧾 **Onboarding do bebê** com validação de idade e restrições alimentares.
- 🚫 **Alergênicos e alimentos evitados** considerados na geração do cardápio.

### 🍽️ Cardápio

- 📚 **Catálogo editorial** com 72 receitas de introdução alimentar.
- 🔎 **Filtros** por fase, refeição, alergênicos e tempo de preparo.
- 🗓️ **Cardápio semanal determinístico** gerado a partir do perfil do bebê.
- 🔄 **Troca unitária de refeições** sem reembaralhar o restante da semana.
- ⬆️⬇️ **Reordenação** de refeições dentro do dia.
- 🕘 **Histórico de cardápios** para retomar semanas anteriores.

### 🛒 Compras e despensa

- 🥫 **Despensa persistida** com ranking de ingredientes.
- 📝 **Lista de compras derivada** do cardápio.
- ➕ **Itens manuais**: adicione o que não está no catálogo, com nome livre.
- ⚖️ **Consolidação por unidade**: variantes como `un`, `u` e `unidades` viram
  uma única linha, e unidades compatíveis são somadas (`1 l + 500 ml = 1,5 l`).
  Massa, volume e contagem **nunca** são somados entre si.
- ♻️ **Recálculo preserva itens manuais** — nada digitado pelo usuário é perdido.

### 🖨️ Impressão e instalação

- 📄 **PDFs A4**: cardápio da semana, lista de compras e guias de apoio.
- 📲 **PWA instalável** em desktop e mobile, com convite de instalação próprio.
- 🌗 **Tema claro/escuro** com direção visual botânica/editorial.

## 🧱 Stack

| Camada | Tecnologia |
| :--- | :--- |
| ⚛️ **UI** | React 19 · React Router 7 · TypeScript 6 |
| 🎨 **Estilo** | Tailwind CSS 4 · design system próprio ([`DESIGN.md`](DESIGN.md)) |
| ⚡ **Build** | Vite 8 (Rolldown) |
| 🗄️ **Backend** | Supabase: Postgres, Auth, Row Level Security, Storage |
| 📄 **PDF** | `@react-pdf/renderer` |
| 🧪 **Testes** | Vitest 4 · Testing Library · axe-core |
| 🧹 **Qualidade** | oxlint · `designmd lint` · harness de UI QA próprio ([`qa/`](qa/README.md)) |

## ⚡ Começando

### 📋 Pré-requisitos

- **Node.js** `^20.19` ou `>=22.12` (exigência do Vite 8; validado em Node 24).
- **npm** 10 ou superior.
- Opcional: **Docker** para os testes de banco (`npm run db:test`).

### 🛠️ Instalação

```bash
git clone https://github.com/gsneto/pratinho-pronto.git
cd pratinho-pronto

npm ci                 # instalação reprodutível a partir do lockfile
cp .env.example .env.local
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

> 💡 Use `npm ci` para respeitar o `package-lock.json`. `npm install` também
> funciona, mas pode atualizar dependências dentro das faixas declaradas.

### 🔑 Variáveis de ambiente

Somente variáveis **públicas** do Supabase podem ir para o frontend.

| Variável | Escopo | Obrigatória | Descrição |
| :--- | :--- | :---: | :--- |
| `VITE_SUPABASE_URL` | cliente | ✅ | URL do projeto Supabase. |
| `VITE_SUPABASE_ANON_KEY` | cliente | ✅ | Chave anônima/publishable. |
| `VITE_CHECKOUT_URL` | cliente | — | Destino do botão de compra. |
| `VITE_META_PIXEL_ID` | cliente | — | Analytics só carrega se configurado. |
| `VITE_GA_MEASUREMENT_ID` | cliente | — | Analytics só carrega se configurado. |
| `VITE_DEMO_MODE` | cliente | — | `true` exibe selos de conteúdo demonstrativo. |
| `SUPABASE_URL` | servidor | — | Usada pelas funções serverless. |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | — | **Nunca** exponha no frontend. |
| `CAKTO_WEBHOOK_SECRET` | servidor | — | Segredo do webhook de pagamento. |

> ⚠️ **Segurança:** `SUPABASE_SERVICE_ROLE_KEY` ignora RLS. Ela existe apenas
> para `api/cakto-webhook.ts`, no servidor. Nunca a coloque em `VITE_*`.

Sem as variáveis públicas, `/login` continua acessível para inspeção, mas o
acesso fica bloqueado com uma mensagem explícita.

### 🎟️ Acesso e onboarding

O cadastro é liberado pelo webhook de pagamento (tabela `access_grants`): só é
possível criar conta com o e-mail de uma compra aprovada.

Em desenvolvimento local, insira o e-mail em `access_grants` antes de testar o
primeiro acesso. Inclua também o callback local na lista de redirecionamentos
permitidos do projeto Supabase:

```text
http://localhost:5173/auth/callback
```

## 🗄️ Banco de dados

| Item | Caminho |
| :--- | :--- |
| Migration inicial | [`supabase/migrations/20260825200000_initial_schema.sql`](supabase/migrations/20260825200000_initial_schema.sql) |
| Seed demonstrativo | [`supabase/seed.sql`](supabase/seed.sql) |
| Configuração local | [`supabase/config.toml`](supabase/config.toml) |

A migration cria tabelas, índices, triggers e policies RLS. O seed contém
**72 receitas** e **36 ingredientes** explicitamente demonstrativos: 18 cafés da
manhã, 18 almoços, 18 lanches e 18 jantares.

A lista de compras é recalculada por uma RPC transacional
(`replace_shopping_list`), `SECURITY INVOKER`, que substitui apenas os itens
derivados do cardápio e **preserva os itens manuais**.

## 🧪 Testes e validação

```bash
npm test          # 302 testes (Vitest)
npm run lint      # oxlint
npm run build     # tsc -b + vite build
npm run design:lint
```

| Script | O que faz |
| :--- | :--- |
| `npm test` | Suíte unitária e de componentes (Vitest). |
| `npm run test:watch` | Vitest em modo watch. |
| `npm run lint` | Lint com oxlint. |
| `npm run build` | Type-check (`tsc -b`) e build de produção. |
| `npm run design:lint` | Valida o `DESIGN.md`. |
| `npm run pdf:sample` | Gera PDFs de exemplo em `output/`. |
| `npm run db:test` | Postgres 17 descartável (Docker) + testes SQL. Não toca produção. |
| `npm run db:e2e` | E2E contra o stack Supabase local (GoTrue, PostgREST, RLS). |

### 🖥️ Suítes de UI

| Script | O que faz |
| :--- | :--- |
| `npm run qa:build` / `qa:serve` | Prévia isolada com fixtures em memória. |
| `npm run qa:audit` | Matriz de rotas × perfis, com axe e capturas. |
| `npm run qa:flows` | Fluxos de negócio ponta a ponta. |
| `npm run qa:dialogs` | Diálogos, contraste e foco. |
| `npm run qa:pwa` | Convite de instalação PWA. |
| `npm run qa:regressions` | Regressões de layout e contraste. |

## 🖥️ Prévia isolada (sem Supabase)

Para experimentar as telas reais sem autenticar nem alterar o banco:

```bash
npm run qa:build
npm run qa:serve
```

Abra **http://127.0.0.1:4178/app**. O banner identifica dados fictícios e as
alterações ficam em memória. Essa prévia é distinta de `/preview` (protótipos
A/B/C) e **não** é uma publicação em produção.

O roteiro reproduzível, as restrições do ambiente e a cobertura estão em
[`qa/README.md`](qa/README.md).

## 🎨 Design system

A apresentação usa direção botânica/editorial, navegação lateral no desktop e
barra inferior no celular, com temas claro e escuro.

As camadas de estilo são aplicadas nesta ordem:

```text
src/index.css        → tokens (@theme + :root)
src/ui-refresh.css   → superfícies e componentes
src/v3-refresh.css   → refinamento final (elevação, movimento, hero)
```

Tokens, componentes e breakpoints estão documentados em [`DESIGN.md`](DESIGN.md).

## 📁 Estrutura do projeto

```text
src/
├── components/     auth · baby · layout · meal-plan · pdf · recipes · shopping-list · ui
├── hooks/          useAuth · useBaby · useFavorites · useMealPlan · useMealPlanHistory
│                   useRecipes · useShoppingList
├── landing/        analytics · config · utils
├── lib/            diet · favorites · meal-plan · navigation · pantry · recipes
│                   schemas · shopping-list · units
├── pages/          AuthCallback · Home · Login · MealPlan · NotFound · Onboarding
│                   Pantry · Profile · RecipeDetails · Recipes · ShoppingList
├── routes/         definição de rotas
├── services/       acesso ao Supabase, separado por domínio
├── types/          tipos de domínio
└── utils/          datas · instruções · rótulos · quantidades · texto
```

Os acessos ao Supabase ficam nos serviços de domínio; componentes não executam
queries diretas. Regras puras ficam em `src/lib/` e são testáveis sem React.

## 📚 Documentação

| Documento | Conteúdo |
| :--- | :--- |
| [`AGENTS.md`](AGENTS.md) | Instruções operacionais para agentes. |
| [`docs/DEVELOPMENT_WORKFLOW.md`](docs/DEVELOPMENT_WORKFLOW.md) | Fluxo de Git, branches, testes e limites de publicação. |
| [`DESIGN.md`](DESIGN.md) | Tokens, componentes e breakpoints. |
| [`qa/README.md`](qa/README.md) | Harness de QA: ambiente, cobertura e limites. |
| [`docs/OPEN_SOURCE_ATTRIBUTIONS.md`](docs/OPEN_SOURCE_ATTRIBUTIONS.md) | Procedência de código e licenças de terceiros. |
| [`docs/COMMERCIAL_DEPENDENCIES.md`](docs/COMMERCIAL_DEPENDENCIES.md) | Dependências comerciais. |
| [`docs/V2_CHANGELOG.md`](docs/V2_CHANGELOG.md) | Histórico de mudanças. |

## ⚠️ Limites e avisos

- 🩺 **Não é orientação médica.** O catálogo foi revisado tecnicamente contra o
  [Guia Alimentar para Crianças Brasileiras Menores de 2 Anos](https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/primeira-infancia/alimentacao-saudavel)
  e referências da [OMS](https://www.who.int/publications/i/item/9789240081864),
  mas **não substitui** prescrição individual nem avaliação de nutricionista ou
  pediatra.
- 🧪 **O harness de QA não é produção.** Ele usa fixtures em memória e não
  comprova persistência real, RLS, autenticação real, instalação nativa ou
  modo offline.
- 🍎 **O catálogo é demonstrativo.** As receitas priorizam alimentos in natura
  ou minimamente processados, sem açúcar ou mel adicionados, com texturas
  adaptáveis — mas a adequação ao caso concreto é sempre individual.

## 📄 Licença e atribuições

Este repositório **não declara uma licença de uso**. Sem um arquivo `LICENSE`,
vale o regime padrão de direitos autorais: o código é público para leitura e
referência, mas não há autorização implícita de uso, cópia ou redistribuição.

Projetos de terceiros estudados e sua situação de licença estão registrados em
[`docs/OPEN_SOURCE_ATTRIBUTIONS.md`](docs/OPEN_SOURCE_ATTRIBUTIONS.md).

<div align="center">

---

Feito com 🥕 para deixar a semana mais leve.

</div>
