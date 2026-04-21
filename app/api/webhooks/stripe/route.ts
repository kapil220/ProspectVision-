import { NextResponse, type NextRequest } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const raw = await req.text()
  const sig = req.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret)
  } catch (err) {
    console.error('[stripe webhook] bad signature:', err)
    return NextResponse.json({ error: 'Bad signature' }, { status: 401 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const profileId = session.metadata?.profile_id
    const credits = parseInt(session.metadata?.credits ?? '0', 10)
    const pi =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id

    if (!profileId || !credits || !pi) {
      return NextResponse.json({ received: true })
    }

    const service = createServiceClient()

    // Idempotency — Stripe may retry the same event.
    const { data: existing } = await service
      .from('credit_purchases')
      .select('id')
      .eq('stripe_payment_intent', pi)
      .maybeSingle()
    if (existing) return NextResponse.json({ received: true })

    const { error: purchaseErr } = await service.from('credit_purchases').insert({
      profile_id: profileId,
      stripe_payment_intent: pi,
      credits_purchased: credits,
      amount_cents: session.amount_total ?? 0,
      status: 'completed',
    })
    if (purchaseErr) {
      console.error('[stripe webhook] insert failure', purchaseErr)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    const { error: rpcErr } = await service.rpc('increment_credits', {
      user_id: profileId,
      amount: credits,
    })
    if (rpcErr) {
      console.error('[stripe webhook] increment_credits failed', rpcErr)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
