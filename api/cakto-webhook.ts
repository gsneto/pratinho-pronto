interface CaktoPayload {
  secret?: string
  event?: string
  data?: {
    id?: string
    refId?: string
    status?: string
    customer?: { email?: string }
    product?: { id?: string; name?: string }
    offer?: { id?: string; name?: string }
  }
}

declare const process: { env: Record<string, string | undefined> }

interface VercelRequest {
  method?: string
  body?: unknown
  headers: Record<string, string | string[] | undefined>
}

interface VercelResponse {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

const activeEvents = new Set(['purchase_approved', 'subscription_renewed', 'subscription_resumed'])
const revokedEvents = new Set(['refund', 'chargeback', 'subscription_canceled', 'subscription_paused'])

function readBody(body: unknown): CaktoPayload | null {
  if (typeof body === 'object' && body !== null) return body as CaktoPayload
  if (typeof body !== 'string') return null

  try {
    return JSON.parse(body) as CaktoPayload
  } catch {
    return null
  }
}

function env(name: string): string {
  return process.env[name]?.trim() ?? ''
}

async function upsertGrant(payload: CaktoPayload, status: 'active' | 'revoked'): Promise<void> {
  const supabaseUrl = env('SUPABASE_URL') || env('VITE_SUPABASE_URL')
  const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY')
  const email = payload.data?.customer?.email?.trim().toLowerCase()

  if (!supabaseUrl || !serviceRoleKey) throw new Error('Supabase server environment is not configured')
  if (!email || !email.includes('@')) throw new Error('Webhook payload has no valid customer e-mail')

  const row = {
    email,
    status,
    provider: 'cakto',
    external_order_id: payload.data?.id ?? payload.data?.refId ?? null,
    revoked_at: status === 'revoked' ? new Date().toISOString() : null,
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/access_grants?on_conflict=email`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(row),
  })

  if (!response.ok) {
    throw new Error(`Supabase grant update failed (${response.status})`)
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Cache-Control', 'no-store')

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'method_not_allowed' })
  }

  const payload = readBody(request.body)
  const expectedSecret = env('CAKTO_WEBHOOK_SECRET')
  if (!payload || !expectedSecret || payload.secret !== expectedSecret) {
    return response.status(401).json({ error: 'invalid_webhook_secret' })
  }

  const event = payload.event ?? ''
  if (!activeEvents.has(event) && !revokedEvents.has(event)) {
    return response.status(200).json({ ok: true, ignored: true, event })
  }

  try {
    await upsertGrant(payload, activeEvents.has(event) ? 'active' : 'revoked')
    return response.status(200).json({ ok: true })
  } catch (error) {
    console.error('[cakto-webhook]', error)
    return response.status(500).json({ error: 'grant_update_failed' })
  }
}
