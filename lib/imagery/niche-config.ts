import type { NicheId } from '@/types'

export type SatelliteConfig = {
  zoom: number
  size: string
  scale: 1 | 2
  maptype: 'satellite' | 'hybrid'
}

export type StreetviewConfig = {
  fov: number
  pitch: number
  useOptimalHeading: boolean
}

export type NicheImageConfig = {
  satellite: SatelliteConfig | null
  streetview: StreetviewConfig | null
}

const HD_SATELLITE: SatelliteConfig = { zoom: 20, size: '640x640', scale: 2, maptype: 'satellite' }
const DEFAULT_SATELLITE: SatelliteConfig = { zoom: 19, size: '600x400', scale: 1, maptype: 'satellite' }
const DEFAULT_STREETVIEW: StreetviewConfig = { fov: 80, pitch: 5, useOptimalHeading: false }

const FALLBACK: NicheImageConfig = {
  satellite: DEFAULT_SATELLITE,
  streetview: DEFAULT_STREETVIEW,
}

const NICHE_IMAGE_CONFIG: Record<NicheId, NicheImageConfig> = {
  // Roof-only niches: tight top-down at max zoom; street view irrelevant.
  roofing: {
    satellite: HD_SATELLITE,
    streetview: null,
  },
  solar: {
    satellite: HD_SATELLITE,
    streetview: null,
  },

  // Yard / outdoor niches that benefit from both perspectives.
  landscaping: {
    satellite: HD_SATELLITE,
    streetview: { fov: 90, pitch: -5, useOptimalHeading: true },
  },

  // Facade-focused: tight head-on street view, no satellite.
  exterior_painting: {
    satellite: null,
    streetview: { fov: 45, pitch: 8, useOptimalHeading: true },
  },

  // Backyard pools — only visible from above.
  pool_installation: {
    satellite: HD_SATELLITE,
    streetview: null,
  },

  // Property boundary niches: top-down for layout + street view for fence condition.
  fencing: {
    satellite: HD_SATELLITE,
    streetview: { fov: 80, pitch: 0, useOptimalHeading: true },
  },

  // Driveway: top-down for footprint + street view for surface condition.
  driveway_paving: {
    satellite: HD_SATELLITE,
    streetview: { fov: 70, pitch: -5, useOptimalHeading: true },
  },

  // Pressure washing — facade + driveway visible from street.
  pressure_washing: {
    satellite: null,
    streetview: { fov: 70, pitch: 0, useOptimalHeading: true },
  },

  // HVAC: outdoor condenser unit on the side of the house, ground level.
  hvac: {
    satellite: null,
    streetview: { fov: 70, pitch: 0, useOptimalHeading: true },
  },
}

export function getNicheImageConfig(niche: NicheId | null | undefined): NicheImageConfig {
  if (!niche) return FALLBACK
  return NICHE_IMAGE_CONFIG[niche] ?? FALLBACK
}
