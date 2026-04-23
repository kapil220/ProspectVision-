import { retry } from '@/lib/utils'

const KEY = (): string => process.env.GOOGLE_MAPS_API_KEY!

// URL builders — render these client-side or server-side as-is. Never fetch + cache the image.
// Google Maps ToS requires loading imagery from Google servers with attribution.
export const satelliteUrl = (lat: number, lng: number): string =>
  `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=600x400&maptype=satellite&key=${KEY()}`

export const streetviewUrl = (lat: number, lng: number): string =>
  `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&fov=80&pitch=5&key=${KEY()}`

// Daily quota guard (default Google Static Maps is 25K/day).
const DAILY_LIMIT = Number(process.env.GOOGLE_MAPS_DAILY_LIMIT ?? 24000)
let windowStart = Date.now()
let windowCount = 0
const DAY_MS = 24 * 60 * 60 * 1000

function checkQuota(): void {
  const now = Date.now()
  if (now - windowStart > DAY_MS) {
    windowStart = now
    windowCount = 0
  }
  if (windowCount >= DAILY_LIMIT) {
    throw new Error(`Google Maps daily quota reached (${DAILY_LIMIT}). Retry tomorrow or request a quota increase.`)
  }
  windowCount++
}

// Transient AI use ONLY. Fetch base64, pass to GPT-4o/DALL-E, discard.
// Never store or persist the raw imagery per Google Maps ToS.
export async function fetchBase64(url: string): Promise<string> {
  checkQuota()
  const res = await retry(() => fetch(url), 2, 1000)
  if (!res.ok) throw new Error(`Maps fetch ${res.status}`)
  return Buffer.from(await res.arrayBuffer()).toString('base64')
}
