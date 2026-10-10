// Teste end-to-end REAL contra o stack Supabase local (GoTrue + PostgREST + RLS).
// Requer o stack local ativo: `npx supabase start` e `npx supabase db reset`.
// Nunca toca produção (usa apenas o Supabase local em 127.0.0.1:54321).
//
// A chave anon local é o valor padrão público do Supabase local (não é segredo).
// Pode ser sobrescrita por SUPABASE_ANON_KEY.
import { execFileSync } from 'node:child_process'

const API = 'http://127.0.0.1:54321'
const ANON = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const DB_CONTAINER = process.env.SUPABASE_DB_CONTAINER || 'supabase_db_pratinho-pronto'
const psql = (sql) => execFileSync('docker', ['exec', DB_CONTAINER, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-c', sql], { encoding: 'utf8' }).trim()

const results = []
const check = (label, ok, detail = '') => { results.push({ label, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ' — ' + detail : ''}`) }

async function signup(email, password) {
  const res = await fetch(`${API}/auth/v1/signup`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json()
  return { status: res.status, token: body.access_token ?? body.session?.access_token, userId: body.user?.id ?? body.id }
}

async function rpc(token, planId, items) {
  const headers = { apikey: ANON, 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API}/rest/v1/rpc/replace_shopping_list`, {
    method: 'POST', headers, body: JSON.stringify({ p_meal_plan_id: planId, p_items: items }),
  })
  return { status: res.status, text: await res.text() }
}

const emailA = `e2e-a-${Date.now()}@test.local`
const emailB = `e2e-b-${Date.now()}@test.local`
psql(`insert into public.access_grants (email, provider) values ('${emailA}','test'), ('${emailB}','test');`)

const a = await signup(emailA, 'testtest123')
const b = await signup(emailB, 'testtest123')
check('A: signup via GoTrue retorna JWT', Boolean(a.token) && a.status === 200, `status ${a.status}`)
check('B: signup via GoTrue retorna JWT', Boolean(b.token) && b.status === 200, `status ${b.status}`)

const babyA = psql(`with i as (insert into public.babies (user_id, name, birth_date) values ('${a.userId}','Ana','2025-12-01') returning id) select id from i;`)
const planA = psql(`with i as (insert into public.meal_plans (user_id, baby_id, week_start) values ('${a.userId}','${babyA}','2026-09-14') returning id) select id from i;`)
const babyB = psql(`with i as (insert into public.babies (user_id, name, birth_date) values ('${b.userId}','Bia','2025-12-01') returning id) select id from i;`)
psql(`with i as (insert into public.meal_plans (user_id, baby_id, week_start) values ('${b.userId}','${babyB}','2026-09-14') returning id) select id from i;`)
const ing1 = psql('select id from public.ingredients order by name limit 1;')
const ing2 = psql('select id from public.ingredients order by name offset 1 limit 1;')

const rpcA = await rpc(a.token, planA, [
  { ingredient_id: ing1, quantity: 2, unit: 'unidade' },
  { ingredient_id: ing2, quantity: 1.5, unit: 'colher de sopa' },
])
check('A: RPC via PostgREST com JWT real', rpcA.status === 200, `status ${rpcA.status}`)
check('A: itens persistidos', psql(`select count(*) from public.shopping_list_items i join public.shopping_lists l on l.id=i.shopping_list_id where l.meal_plan_id='${planA}';`) === '2')

const rpcBOnA = await rpc(b.token, planA, [{ ingredient_id: ing1, quantity: 1, unit: 'unidade' }])
check('B não substitui a lista de A (RLS)', rpcBOnA.status >= 400, `status ${rpcBOnA.status}`)
check('A: lista intacta após tentativa de B', psql(`select count(*) from public.shopping_list_items i join public.shopping_lists l on l.id=i.shopping_list_id where l.meal_plan_id='${planA}';`) === '2')

const rpcAnon = await rpc(null, planA, [{ ingredient_id: ing1, quantity: 1, unit: 'unidade' }])
check('anon não executa a RPC', rpcAnon.status >= 400, `status ${rpcAnon.status}`)

const failed = results.filter((r) => !r.ok)
console.log(failed.length ? `\n${failed.length} falha(s)` : '\nE2E_RPC_ALL_PASSED')
process.exit(failed.length ? 1 : 0)
