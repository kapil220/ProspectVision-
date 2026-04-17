import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const patchSchema = z.object({
  amount: z.number().int().positive().max(10),
})

// One-time grant of onboarding free credits. Idempotent: only adds when credit_balance === 0.
export async function PATCH(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: profile, error: readErr } = await service
    .from('profiles')
    .select('credit_balance')
    .eq('id', user.id)
    .single()

  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 })

  if ((profile?.credit_balance ?? 0) > 0) {
    return NextResponse.json({ data: { credit_balance: profile.credit_balance, granted: 0 } })
  }

  const { error: rpcErr } = await service.rpc('increment_credits', {
    user_id: user.id,
    amount: parsed.data.amount,
  })
  if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 })

  return NextResponse.json({ data: { granted: parsed.data.amount } })
}
