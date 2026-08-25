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
contém 24 receitas e 33 ingredientes explicitamente demonstrativos.

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
