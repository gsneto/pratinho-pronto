# Pratinho Pronto

App mobile-first para transformar receitas de introdução alimentar em um
planejamento semanal prático. React + TypeScript + Vite no frontend, Supabase
(Postgres + Auth + RLS) no backend, PWA instalável.

## Funcionalidades

- Autenticação por e-mail e senha (Supabase Auth). O primeiro acesso de um
  cliente cria a senha usando o e-mail da compra.
- Onboarding do bebê com validação de idade e restrições alimentares.
- Catálogo editorial de receitas de introdução alimentar com filtros por fase,
  refeição, alergênicos e tempo de preparo.
- Cardápio semanal determinístico gerado a partir do perfil do bebê, com troca
  unitária de refeições sem reembaralhar o restante da semana.
- Pantry (despensa) persistida e lista de compras derivada do cardápio.
- Geração de PDFs A4 (cardápio, lista de compras, guias) prontos para impressão.
- PWA instalável em desktop e mobile, com convite de instalação próprio.
- Tema claro/escuro com direção visual botânica/editorial.

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router.
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Storage).
- **Testes:** Vitest, Testing Library, axe-core.
- **Build/QA:** oxlint, matriz própria de UI QA (`qa/`).

## Executar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Para autenticar e acessar a home protegida, preencha `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY`. Nunca exponha uma service role key no frontend.

O cadastro de um novo acesso é liberado pelo webhook de pagamento (tabela
`access_grants`): só é possível criar a conta com o e-mail de uma compra
aprovada. Em desenvolvimento local, insira o e-mail em `access_grants` antes de
testar o primeiro acesso. Inclua o callback local na lista de redirecionamentos
permitidos do projeto Supabase:

```text
http://localhost:5173/auth/callback
```

Sem as variáveis públicas, `/login` continua disponível para inspeção, mas o
acesso fica bloqueado com uma mensagem explícita.

## Banco de dados

- Migration inicial: `supabase/migrations/20260825200000_initial_schema.sql`
- Seed demonstrativo: `supabase/seed.sql`
- Configuração local: `supabase/config.toml`

A migration cria todas as tabelas, índices, triggers e policies RLS. O seed
contém 72 receitas e 36 ingredientes explicitamente demonstrativos, distribuídos
em 18 cafés da manhã, 18 almoços, 18 lanches e 18 jantares.

O catálogo editorial prioriza alimentos in natura ou minimamente processados,
preparações sem açúcar ou mel adicionados e texturas adaptáveis. Ele foi revisado
tecnicamente contra o Guia Alimentar para Crianças Brasileiras Menores de 2 Anos,
mas não substitui prescrição individual nem revisão de nutricionista infantil.
Referências editoriais: [Ministério da Saúde](https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-da-crianca/primeira-infancia/alimentacao-saudavel)
e [OMS](https://www.who.int/publications/i/item/9789240081864).

## Validação

```bash
npm run lint
npm test
npm run build
npm run pdf:sample
```

## Redesign e demonstração isolada

A apresentação atual usa direção botânica/editorial, navegação lateral no
desktop e barra inferior no celular, com temas claro e escuro. Os tokens,
componentes e breakpoints estão em [`DESIGN.md`](DESIGN.md). A camada visual
compartilhada é `src/ui-refresh.css`, importada após `src/index.css`.

Para experimentar as telas reais sem autenticar ou alterar o Supabase:

```bash
npm run qa:build
npm run qa:serve
```

Abra **http://127.0.0.1:4178/app**. O banner identifica dados fictícios; as
alterações ficam em memória. Essa prévia é distinta de `/preview` (protótipos
A/B/C) e não é uma publicação em produção.

O roteiro reproduzível, as restrições do ambiente e a cobertura estão em
[`qa/README.md`](qa/README.md). A rodada v3 acrescenta medição complementar
CSS/DOM dos diálogos, preservando o axe bruto: `output/ui-qa/report-v3.md`.
As matrizes de rotas anteriores permanecem em `output/ui-qa/report-v2.md`;
JSONs, capturas e PDFs acompanham as execuções. A análise específica dos
três vídeos permanece dispensada.

O convite de instalação tem regressões próprias em `npm run qa:pwa`: falha
recuperável, evento de uso único, estado compartilhado e instruções acessíveis.
A suíte usa eventos sintéticos nos três engines; não instala o aplicativo nem
certifica modo offline ou Safari/iOS físico. Detalhes em `qa/README.md`.

## Estrutura planejada

```text
src/
├── components/
│   ├── auth/
│   ├── ui/
│   ├── layout/
│   ├── baby/
│   ├── recipes/
│   ├── meal-plan/
│   └── pdf/
├── pages/
│   ├── Login/
│   ├── Onboarding/
│   ├── Home/
│   ├── MealPlan/
│   ├── Recipes/
│   ├── RecipeDetails/
│   ├── Pantry/
│   ├── ShoppingList/
│   └── Profile/
├── hooks/
├── services/            # auth e acesso ao Supabase separados por domínio
├── lib/                 # regras puras (cardápio, despensa, dieta, favoritos)
├── types/
├── utils/
└── routes/
```

Os acessos ao Supabase ficam nos serviços de domínio; componentes não executam
queries diretas.

## Banco de dados, testes de integração e migrações

- `npm run db:test` — sobe um PostgreSQL 17 descartável (Docker), aplica o shim
  local de auth, as migrações e o seed, e roda os testes SQL de integração
  (`supabase/tests/`). Não toca produção.
- `npm run db:e2e` — teste end-to-end contra o stack Supabase local
  (`npx supabase start` + `npx supabase db reset`): signup via GoTrue, RPC via
  PostgREST e verificação de RLS/anon.

A migração de expansão do catálogo é autossuficiente (define os 36
ingredientes); a validação final do catálogo (≥72 receitas, sem duplicatas, sem
receita sem ingrediente) roda no fim do `seed.sql`, depois de todas as
migrações.
