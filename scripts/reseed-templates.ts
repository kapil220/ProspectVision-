// One-off: re-seed postcard_templates with the current pixel-based HTML in
// lib/postcards/templates/layouts.ts. Run with: npx tsx scripts/reseed-templates.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import {
  NICHE_TEMPLATE_COPY,
  buildBackTemplate,
  buildFrontTemplate,
} from '../lib/postcards/templates/layouts'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

async function main() {
  const niches = Object.keys(NICHE_TEMPLATE_COPY)
  let updated = 0
  let inserted = 0
  for (const niche of niches) {
    const copy = NICHE_TEMPLATE_COPY[niche]
    const payload = {
      niche,
      variant_name: 'default',
      front_html_template: buildFrontTemplate(copy.accent_color),
      back_html_template: buildBackTemplate(copy.accent_color),
      headline: copy.headline,
      subheadline: copy.subheadline,
      body_copy: copy.body_copy,
      cta_text: copy.cta_text,
      stats_line: copy.stats_line,
      is_active: true,
      updated_at: new Date().toISOString(),
    }
    const { data: existing } = await db
      .from('postcard_templates')
      .select('id')
      .eq('niche', niche)
      .eq('variant_name', 'default')
      .maybeSingle()

    if (existing) {
      const { error } = await db
        .from('postcard_templates')
        .update(payload)
        .eq('id', existing.id)
      if (error) {
        console.error(`update ${niche}:`, error.message)
      } else {
        updated++
        console.log(`✓ updated ${niche}`)
      }
    } else {
      const { error } = await db.from('postcard_templates').insert(payload)
      if (error) {
        console.error(`insert ${niche}:`, error.message)
      } else {
        inserted++
        console.log(`+ inserted ${niche}`)
      }
    }
  }
  console.log(`\nDone. inserted=${inserted} updated=${updated} total=${niches.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
