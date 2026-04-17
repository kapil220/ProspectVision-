import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatCurrency = (n: number, compact = false) => {
  if (compact && n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

export const formatNumber = (n: number) => new Intl.NumberFormat('en-US').format(n)

export const formatDate = (d: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(d))

export function formatRelative(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export const normalizeAddress = (a: string) => a.toLowerCase().trim().replace(/\s+/g, ' ')

const _nano = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)
export const generateSlug = () => _nano()

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function retry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (retries === 0) throw e
    await sleep(delay)
    return retry(fn, retries - 1, delay * 2)
  }
}

export function chunkArray<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}
