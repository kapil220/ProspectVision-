import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  NICHE_TEMPLATE_COPY,
  buildBackTemplate,
  buildFrontTemplate,
} from '@/lib/postcards/templates/layouts'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-seed-token')
  if (!process.env.DEMO_SEED_TOKEN || token !== process.env.DEMO_SEED_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const niches = Object.keys(NICHE_TEMPLATE_COPY)
  const inserted: string[] = []
  const updated: string[] = []
  const failures: Array<{ niche: string; error: string }> = []

  for (const niche of niches) {
    const copy = NICHE_TEMPLATE_COPY[niche]
    const frontHtml = buildFrontTemplate(copy.accent_color)
    const backHtml = buildBackTemplate(copy.accent_color)

    const payload = {
      niche,
      variant_name: 'default',
      front_html_template: frontHtml,
      back_html_template: backHtml,
      headline: copy.headline,
      subheadline: copy.subheadline,
      body_copy: copy.body_copy,
      cta_text: copy.cta_text,
      stats_line: copy.stats_line,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await service
      .from('postcard_templates')
      .select('id')
      .eq('niche', niche)
      .eq('variant_name', 'default')
      .maybeSingle()

    if (existing) {
      const { error } = await service
        .from('postcard_templates')
        .update(payload)
        .eq('id', existing.id)
      if (error) {
        failures.push({ niche, error: error.message })
      } else {
        updated.push(niche)
      }
    } else {
      const { error } = await service.from('postcard_templates').insert(payload)
      if (error) {
        failures.push({ niche, error: error.message })
      } else {
        inserted.push(niche)
      }
    }
  }

  return NextResponse.json({
    ok: failures.length === 0,
    inserted,
    updated,
    failures,
    total: niches.length,
  })
}
