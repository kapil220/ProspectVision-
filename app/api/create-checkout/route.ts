import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, getCreditPack } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { pack_id?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const pack = body.pack_id ? getCreditPack(body.pack_id) : undefined
  if (!pack) return NextResponse.json({ error: 'Invalid pack' }, { status: 400 })

  if (!pack.priceId) {
    return NextResponse.json(
      { error: `Missing Stripe price ID for ${pack.id}` },
      { status: 500 },
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: pack.priceId, quantity: 1 }],
      success_url: `${appUrl}/credits?success=true&pack=${pack.id}`,
      cancel_url: `${appUrl}/credits?canceled=true`,
      customer_email: user.email ?? undefined,
      metadata: {
        profile_id: user.id,
        credits: String(pack.credits),
        pack_id: pack.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[create-checkout] stripe error', err)
    return NextResponse.json(
      { error: (err as Error).message ?? 'Stripe error' },
      { status: 500 },
    )
  }
}
