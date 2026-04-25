"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom");
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email, password }: FormValues) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("root", { message: "Invalid email or password" });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarded_at")
      .eq("id", user.id)
      .maybeSingle();
    const target = profile?.onboarded_at ? redirectedFrom || "/dashboard" : "/onboarding";
    router.push(target);
    router.refresh();
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setGoogleLoading(false);
      setError("root", { message: "Google sign-in failed. Try again." });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.21, 0.61, 0.35, 1] }}
    >
      <p className="num text-xs uppercase tracking-[0.22em] text-ink-muted">Welcome back</p>
      <h1 className="mt-3 display text-4xl font-medium leading-[1.05] tracking-tight">
        Sign in to <span className="display-italic text-emerald">ProspectVision.</span>
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        New here?{" "}
        <Link href="/signup" className="link-underline font-medium text-ink">
          Create an account
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5" noValidate>
        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={cn("input", errors.email && "border-crimson")}
            {...register("email")}
          />
        </Field>

        <Field
          label="Password"
          error={errors.password?.message}
          rightSlot={
            <Link href="/forgot-password" className="text-[11px] font-medium text-emerald link-underline">
              Forgot password?
            </Link>
          }
        >
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              className={cn("input pr-10", errors.password && "border-crimson")}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        {errors.root && <p className="text-xs text-crimson">{errors.root.message}</p>}

        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.98 }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-ivory transition-colors hover:bg-emerald disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </motion.button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="num text-[10px] uppercase tracking-[0.22em] text-ink-muted">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-line bg-ivory-50 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
      >
        {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </button>
    </motion.div>
  );
}

function Field({
  label,
  error,
  rightSlot,
  children,
}: {
  label: string;
  error?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">{label}</span>
        {rightSlot}
      </span>
      {children}
      {error && <p className="mt-1.5 text-xs text-crimson">{error}</p>}
    </label>
  );
}
