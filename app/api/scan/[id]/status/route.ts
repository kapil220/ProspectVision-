import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: batch, error } = await supabase
    .from('scan_batches')
    .select('status,progress_pct,total_scanned,total_scored,total_approved,error_message')
    .eq('id', params.id)
    .eq('profile_id', user.id)
    .single()

  if (error || !batch) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(batch)
}
