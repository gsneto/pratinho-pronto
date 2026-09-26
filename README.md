# Pratinho Pronto

MVP mobile-first para transformar receitas de introdução alimentar em um
planejamento semanal prático.

## Estado atual

Fases 1 a 9 implementadas: fundação, autenticação por magic link, onboarding,
RLS, receitas demonstrativas, cardápio determinístico, troca unitária, pantry,
lista de compras persistida e três PDFs A4. O projeto Supabase real está em
São Paulo, com migration e seed aplicados, e o fluxo ponta a ponta foi validado
com dois usuários isolados por RLS.

Produção: https://pratinho-pronto.vercel.app

## Executar localmente

```bash
npm install
copy .env.example .env.local
npm run dev
```

Para autenticar e acessar a home protegida, preencha `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY`. Nunca exponha uma service role key no frontend.

Para o magic link funcionar, habilite o provedor de e-mail no Supabase e inclua
estas URLs na lista de redirecionamentos permitidos do projeto:

```text
http://localhost:5173/auth/callback
https://pratinho-pronto.vercel.app/auth/callback
```

Sem as variáveis públicas, `/login` continua disponível para inspeção, mas o
envio do link fica bloqueado com uma mensagem explícita.

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

A migration e o seed já estão aplicados no projeto de produção. As URLs local e
publicada terminadas em `/auth/callback` também estão permitidas no Supabase
Auth.

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
│   ├── shopping-list/
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
│   ├── Profile/
│   └── Subscription/
├── hooks/
├── services/            # auth e acesso ao Supabase separados por domínio
├── lib/
├── types/
├── utils/
└── routes/
```

Os acessos ao Supabase ficam nos serviços de domínio; componentes não executam
queries diretas.
