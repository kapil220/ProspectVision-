import { retry } from '@/lib/utils'

const BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0'

const HEADERS = (): Record<string, string> => ({
  apikey: process.env.ATTOM_API_KEY!,
  accept: 'application/json',
})

export interface AttomAddressResult {
  address: { line1: string; locality: string; countrySubd: string; postal1: string }
  location: { latitude: string; longitude: string }
  summary?: { yearBuilt?: number; lotSizeAcres?: number; absenteeInd?: string }
}

export interface AttomOwnerResult {
  firstName: string | null
  lastName: string | null
  ownerOccupied: boolean
  estimatedValue: number | null
  buildYear: number | null
  lotSizeSqft: number | null
}

export async function searchByZip(zip: string): Promise<AttomAddressResult[]> {
  return retry(
    async () => {
      const params = new URLSearchParams({
        postalcode: zip,
        propertytype: 'SFR',
        pagesize: '50',
        page: '1',
      })
      const res = await fetch(`${BASE}/property/address?${params}`, {
        headers: HEADERS(),
        next: { revalidate: 0 },
      })
      if (res.status === 404) return []
      const json = (await res.json().catch(() => null)) as
        | { status?: { msg?: string }; property?: AttomAddressResult[] }
        | null
      // ATTOM signals "no results" with HTTP 400 + msg "SuccessWithoutResult".
      if (json?.status?.msg === 'SuccessWithoutResult') return []
      if (!res.ok) throw new Error(`ATTOM ${res.status}`)
      return json?.property ?? []
    },
    2,
    1000
  )
}

export async function getOwner(
  address1: string,
  address2: string
): Promise<AttomOwnerResult | null> {
  return retry(
    async () => {
      const params = new URLSearchParams({ address1, address2 })
      const res = await fetch(`${BASE}/property/detail?${params}`, { headers: HEADERS() })
      const json = (await res.json().catch(() => null)) as {
        status?: { msg?: string }
        property?: Array<{
          owner?: { owner1?: { firstNameAndMi?: string; lastName?: string } }
          summary?: { absenteeInd?: string; yearBuilt?: number; lotSizeAcres?: number }
          assessment?: { assessed?: { assdTtlValue?: number } }
        }>
      } | null
      if (json?.status?.msg === 'SuccessWithoutResult') return null
      if (!res.ok || !json) return null
      const p = json.property?.[0]
      if (!p) return null
      return {
        firstName: p.owner?.owner1?.firstNameAndMi ?? null,
        lastName: p.owner?.owner1?.lastName ?? null,
        ownerOccupied: p.summary?.absenteeInd === 'O',
        estimatedValue: p.assessment?.assessed?.assdTtlValue ?? null,
        buildYear: p.summary?.yearBuilt ?? null,
        lotSizeSqft: p.summary?.lotSizeAcres ? Math.round(p.summary.lotSizeAcres * 43560) : null,
      }
    },
    2,
    1000
  ).catch(() => null)
}
