import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const zip = z.string().regex(/^\d{5}$/, 'Invalid ZIP code')

const patchSchema = z.object({
  company_name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  niche: z.string().optional(),
  return_address: z.string().optional(),
  return_city: z.string().optional(),
  return_state: z.string().length(2).optional(),
  return_zip: zip.optional(),
  service_area_zips: z.array(zip).optional(),
  onboarded_at: z.string().datetime().nullable().optional(),
})

export async function PATCH(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function GET() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
