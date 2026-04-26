import OpenAI from 'openai'
import { retry } from '@/lib/utils'

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface ScoreResult {
  score: number
  reasons: string[]
}

export async function scoreProperty(
  satelliteUrl: string | null,
  streetviewUrl: string | null,
  scorePrompt: string
): Promise<ScoreResult> {
  if (!satelliteUrl && !streetviewUrl) {
    throw new Error('scoreProperty: at least one image URL required')
  }
  return retry(
    async () => {
      type ImagePart = { type: 'image_url'; image_url: { url: string; detail: 'high' } }
      const imageParts: ImagePart[] = []
      if (satelliteUrl) imageParts.push({ type: 'image_url', image_url: { url: satelliteUrl, detail: 'high' } })
      if (streetviewUrl) imageParts.push({ type: 'image_url', image_url: { url: streetviewUrl, detail: 'high' } })
      const res = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 250,
        messages: [
          {
            role: 'user',
            content: [{ type: 'text', text: scorePrompt }, ...imageParts],
          },
        ],
      })

      const raw = res.choices[0]?.message?.content ?? '{}'
      const clean = raw.replace(/```json?\n?/gi, '').replace(/```/g, '').trim()

      let parsed: { score?: unknown; reasons?: unknown }
      try {
        parsed = JSON.parse(clean) as { score?: unknown; reasons?: unknown }
      } catch {
        throw new Error('GPT-4o returned non-JSON response')
      }

      if (typeof parsed.score !== 'number') throw new Error('Bad score format')

      const score = Math.min(100, Math.max(0, Math.round(parsed.score)))
      const reasons = Array.isArray(parsed.reasons)
        ? parsed.reasons.filter((r): r is string => typeof r === 'string').slice(0, 3)
        : []

      return { score, reasons }
    },
    2,
    2000
  )
}

export async function generateRender(
  satelliteB64: string,
  renderPrompt: string,
  desc: string
): Promise<string> {
  void satelliteB64
  return retry(
    async () => {
      const res = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `${renderPrompt}\n\nProperty: ${desc}`,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json',
        n: 1,
      })
      const b64 = res.data?.[0]?.b64_json
      if (!b64) throw new Error('DALL-E no data')
      return b64
    },
    2,
    3000
  )
}
