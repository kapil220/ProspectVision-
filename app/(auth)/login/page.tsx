'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams.get('redirectedFrom')
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }: FormValues) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('root', { message: 'Invalid email or password' })
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', user.id)
      .maybeSingle()
    const target = profile?.onboarded_at ? redirectedFrom || '/dashboard' : '/onboarding'
    router.push(target)
    router.refresh()
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}/auth/callback` },
    })
    if (error) {
      setGoogleLoading(false)
      setError('root', { message: 'Google sign-in failed. Try again.' })
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-[28px] font-semibold text-slate-900">Welcome back</h1>
      <p className="mt-1.5 text-sm text-slate-500">Sign in to your account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={inputClass(errors.email)}
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand hover:text-brand-dark"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn(inputClass(errors.password), 'pr-10')}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {errors.root && <p className="text-xs text-red-500">{errors.root.message}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-px hover:bg-brand-dark hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">or continue with</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="flex h-[42px] w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to ProspectVision?{' '}
        <Link href="/signup" className="font-medium text-brand hover:text-brand-dark">
          Create account
        </Link>
      </p>
    </div>
  )
}

function inputClass(err: unknown) {
  return cn(
    'h-[42px] w-full rounded-lg border bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-brand/20',
    err
      ? 'border-red-300 focus:border-red-400'
      : 'border-slate-200 focus:border-brand'
  )
}
