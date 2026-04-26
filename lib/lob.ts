import { Configuration, PostcardsApi, type PostcardEditable } from '@lob/lob-typescript-sdk'
import { retry } from './utils'

// Estimated postage + print cost per 6x9 USPS first class postcard. Used for
// preview UI only; the actual cost is reconciled via Lob's API on each postcard.
export const LOB_ESTIMATED_COST_USD = 0.65

export interface SendPostcardInput {
  toName: string
  toAddress: string
  toCity: string
  toState: string
  toZip: string
  fromCompany: string
  fromAddress: string
  fromCity: string
  fromState: string
  fromZip: string
  htmlFront: string
  htmlBack: string
  idempotencyKey?: string
}

function getClient(): PostcardsApi {
  const key = process.env.LOB_API_KEY
  if (!key) throw new Error('LOB_API_KEY missing from environment')
  return new PostcardsApi(new Configuration({ username: key }))
}

export async function sendPostcard(input: SendPostcardInput): Promise<{
  id: string
  expectedDeliveryDate: string | null
}> {
  const client = getClient()
  const payload: PostcardEditable = {
    to: {
      name: input.toName,
      address_line1: input.toAddress,
      address_city: input.toCity,
      address_state: input.toState,
      address_zip: input.toZip,
      address_country: 'US',
    },
    from: {
      company: input.fromCompany,
      address_line1: input.fromAddress,
      address_city: input.fromCity,
      address_state: input.fromState,
      address_zip: input.fromZip,
      address_country: 'US',
    },
    front: input.htmlFront,
    back: input.htmlBack,
    size: '6x9',
    use_type: 'marketing',
  } as unknown as PostcardEditable

  return retry(async () => {
    const r = await client.create(payload, input.idempotencyKey)
    return {
      id: r.id as string,
      expectedDeliveryDate: (r as { expected_delivery_date?: string }).expected_delivery_date ?? null,
    }
  }, 2, 2000)
}
