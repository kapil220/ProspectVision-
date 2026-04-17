import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/scan',
  '/batches',
  '/crm',
  '/credits',
  '/settings',
  '/analytics',
]
const AUTH_PREFIXES = ['/login', '/signup']

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: '', ...options })
          res = NextResponse.next({ request: { headers: req.headers } })
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuth = AUTH_PREFIXES.some((p) => pathname.startsWith(p))

  if (!user && isProtected) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuth) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|p/).*)'],
}
