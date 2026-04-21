import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FREE_ONBOARDING_CREDITS = 10
const FREE_MARKER = 'free_onboarding_credits'

// One-time grant of 10 onboarding credits. Idempotent via credit_purchases marker.
export async function PATCH() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const { data: existing } = await service
    .from('credit_purchases')
    .select('id')
    .eq('profile_id', user.id)
    .eq('stripe_payment_intent', FREE_MARKER)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ data: { granted: 0, already_claimed: true } })
  }

  const { error: insertErr } = await service.from('credit_purchases').insert({
    profile_id: user.id,
    stripe_payment_intent: FREE_MARKER,
    credits_purchased: FREE_ONBOARDING_CREDITS,
    amount_cents: 0,
    status: 'completed',
  })
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  const { error: rpcErr } = await service.rpc('increment_credits', {
    user_id: user.id,
    amount: FREE_ONBOARDING_CREDITS,
  })
  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  }

  return NextResponse.json({ data: { granted: FREE_ONBOARDING_CREDITS } })
}
