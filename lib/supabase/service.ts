import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// SERVER-ONLY. Bypasses RLS. Never import from client components or route-level browser code.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
