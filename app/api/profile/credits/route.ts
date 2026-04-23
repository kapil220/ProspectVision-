import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const FREE_ONBOARDING_CREDITS = 10
const FREE_MARKER = 'free_onboarding_credits'

const TEST_PACKS: Record<string, { credits: number; amount_cents: number }> = {
  starter: { credits: 100, amount_cents: 39900 },
  growth: { credits: 500, amount_cents: 174900 },
  scale: { credits: 1000, amount_cents: 299900 },
}

// Test-mode credit grant. Mimics a Stripe purchase without charging.
// Remove or gate once real payments ship.
export async function POST(req: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as { pack_id?: string }
  const pack = body.pack_id ? TEST_PACKS[body.pack_id] : undefined
  if (!pack) {
    return NextResponse.json({ error: 'Invalid pack_id' }, { status: 400 })
  }

  const service = createServiceClient()
  const marker = `cash_test_${Date.now()}`

  const { error: insertErr } = await service.from('credit_purchases').insert({
    profile_id: user.id,
    stripe_payment_intent: marker,
    credits_purchased: pack.credits,
    amount_cents: pack.amount_cents,
    status: 'completed',
  })
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  const { error: rpcErr } = await service.rpc('increment_credits', {
    user_id: user.id,
    amount: pack.credits,
  })
  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 })
  }

  return NextResponse.json({ data: { granted: pack.credits } })
}

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
