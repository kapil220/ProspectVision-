import { retry } from '@/lib/utils'
import { getNicheImageConfig, type SatelliteConfig, type StreetviewConfig } from '@/lib/imagery/niche-config'
import type { NicheId } from '@/types'

const KEY = (): string => process.env.GOOGLE_MAPS_API_KEY!

// URL builders — render these client-side or server-side as-is. Never fetch + cache the image.
// Google Maps ToS requires loading imagery from Google servers with attribution.
export function satelliteUrl(lat: number, lng: number, cfg?: SatelliteConfig): string {
  const c = cfg ?? { zoom: 19, size: '600x400', scale: 1, maptype: 'satellite' as const }
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${c.zoom}&size=${c.size}&scale=${c.scale}&maptype=${c.maptype}&key=${KEY()}`
}

export function streetviewUrl(
  lat: number,
  lng: number,
  cfg?: { fov?: number; pitch?: number; heading?: number; size?: string },
): string {
  const fov = cfg?.fov ?? 80
  const pitch = cfg?.pitch ?? 5
  const size = cfg?.size ?? '600x400'
  const headingParam = typeof cfg?.heading === 'number' ? `&heading=${cfg.heading}` : ''
  return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&fov=${fov}&pitch=${pitch}${headingParam}&key=${KEY()}`
}

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

// Compass bearing from (lat1,lng1) → (lat2,lng2) in degrees [0, 360).
function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const toDeg = (r: number) => (r * 180) / Math.PI
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δλ = toRad(lng2 - lng1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const θ = Math.atan2(y, x)
  return (toDeg(θ) + 360) % 360
}

// Look up nearest Street View panorama and return the bearing from it toward the property.
// Returns null on no-coverage, quota error, or transient failure — caller should fall back.
// Uses Google's free Street View Metadata endpoint (does not consume Static API quota,
// but we count it against our internal limit for safety).
export async function getOptimalHeading(lat: number, lng: number): Promise<number | null> {
  try {
    checkQuota()
  } catch {
    return null
  }
  try {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=50&key=${KEY()}`
    const res = await retry(() => fetch(url), 2, 500)
    if (!res.ok) return null
    const data = (await res.json()) as {
      status?: string
      location?: { lat: number; lng: number }
    }
    if (data.status !== 'OK' || !data.location) return null
    const h = bearing(data.location.lat, data.location.lng, lat, lng)
    return Math.round(h)
  } catch {
    return null
  }
}

export type NicheImageUrls = {
  satellite_url: string | null
  streetview_url: string | null
}

// Build the niche-appropriate set of image URLs for a property.
// Each camera may be skipped (returning null) when the niche doesn't benefit from it,
// reducing both stored noise and downstream Google API usage.
export async function buildImagesForNiche(
  niche: NicheId | null | undefined,
  lat: number,
  lng: number,
): Promise<NicheImageUrls> {
  const config = getNicheImageConfig(niche)

  const satellite_url = config.satellite ? satelliteUrl(lat, lng, config.satellite) : null

  let streetview_url: string | null = null
  if (config.streetview) {
    const sv = config.streetview as StreetviewConfig
    let heading: number | undefined
    if (sv.useOptimalHeading) {
      const h = await getOptimalHeading(lat, lng)
      if (h !== null) heading = h
    }
    streetview_url = streetviewUrl(lat, lng, { fov: sv.fov, pitch: sv.pitch, heading, size: '640x640' })
  }

  return { satellite_url, streetview_url }
}
