'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const schema = z.object({
  full_name: z.string().min(2, 'Need at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
  agreed_to_terms: z.literal(true, {
    errorMap: () => ({ message: 'Required' }),
  }),
})
type FormValues = z.infer<typeof schema>

type Strength = { level: 0 | 1 | 2 | 3 | 4; label: string; colorClass: string; textClass: string }

function scorePassword(pw: string): Strength {
  if (pw.length === 0) return { level: 0, label: '', colorClass: 'bg-slate-200', textClass: 'text-slate-400' }
  if (pw.length < 6) return { level: 1, label: 'Weak', colorClass: 'bg-red-500', textClass: 'text-red-500' }
  if (pw.length < 8) return { level: 2, label: 'Fair', colorClass: 'bg-amber-500', textClass: 'text-amber-500' }
  const hasNumber = /\d/.test(pw)
  const hasSpecial = /[^A-Za-z0-9]/.test(pw)
  if (hasNumber && hasSpecial)
    return { level: 4, label: 'Strong', colorClass: 'bg-green-500', textClass: 'text-green-500' }
  return { level: 3, label: 'Good', colorClass: 'bg-blue-500', textClass: 'text-blue-500' }
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', password: '', agreed_to_terms: false as unknown as true },
  })

  const pw = watch('password') || ''
  const agreed = watch('agreed_to_terms')
  const strength = scorePassword(pw)

  const onSubmit = async ({ email, password, full_name }: FormValues) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name } },
    })
    if (error) {
      setError('root', { message: error.message })
      return
    }
    router.push('/onboarding')
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
      setError('root', { message: 'Google sign-up failed. Try again.' })
    }
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-[28px] font-semibold text-slate-900">
        Start finding leads today
      </h1>
      <p className="mt-1.5 text-sm text-slate-500">Set up your account in 2 minutes</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            className={inputClass(errors.full_name)}
            {...register('full_name')}
          />
          {errors.full_name && (
            <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
          )}
        </div>

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
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
          {pw.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors duration-200',
                      strength.level >= seg ? strength.colorClass : 'bg-slate-200'
                    )}
                  />
                ))}
              </div>
              <span className={cn('min-w-[42px] text-right text-xs font-medium', strength.textClass)}>
                {strength.label}
              </span>
            </div>
          )}
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        <label className="flex items-start gap-2.5 text-sm text-slate-600">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"
            {...register('agreed_to_terms')}
          />
          <span>
            I agree to the{' '}
            <Link href="/tos" target="_blank" className="font-medium text-brand hover:text-brand-dark">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy"
              target="_blank"
              className="font-medium text-brand hover:text-brand-dark"
            >
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.agreed_to_terms && (
          <p className="-mt-2 text-xs text-red-500">{errors.agreed_to_terms.message}</p>
        )}

        {errors.root && <p className="text-xs text-red-500">{errors.root.message}</p>}

        <button
          type="submit"
          disabled={isSubmitting || !agreed}
          className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-px hover:bg-brand-dark hover:shadow-hover disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating account...
            </>
          ) : (
            'Create Account'
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
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:text-brand-dark">
          Sign in
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
