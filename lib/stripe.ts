import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  _stripe = new Stripe(key, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  })
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return Reflect.get(getStripe(), prop, getStripe())
  },
})

export type CreditPack = {
  id: 'starter' | 'growth' | 'scale'
  name: string
  credits: number
  priceUsd: number
  perPostcard: string
  priceId: string
  popular: boolean
}

export const CREDIT_PACKS: readonly CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    priceUsd: 399,
    perPostcard: '3.99',
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? '',
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    credits: 500,
    priceUsd: 1749,
    perPostcard: '3.50',
    priceId: process.env.STRIPE_GROWTH_PRICE_ID ?? '',
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    credits: 1000,
    priceUsd: 2999,
    perPostcard: '3.00',
    priceId: process.env.STRIPE_SCALE_PRICE_ID ?? '',
    popular: false,
  },
] as const

export function getCreditPack(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id)
}
