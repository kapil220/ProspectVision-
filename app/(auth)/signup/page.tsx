"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2, "Need at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Must be at least 8 characters"),
  agreed_to_terms: z.literal(true, {
    errorMap: () => ({ message: "Required" }),
  }),
});
type FormValues = z.infer<typeof schema>;

type Strength = { level: 0 | 1 | 2 | 3 | 4; label: string; color: string };

function scorePassword(pw: string): Strength {
  if (pw.length === 0) return { level: 0, label: "", color: "bg-line" };
  if (pw.length < 6) return { level: 1, label: "Weak", color: "bg-crimson" };
  if (pw.length < 8) return { level: 2, label: "Fair", color: "bg-ochre" };
  const hasNumber = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  if (hasNumber && hasSpecial) return { level: 4, label: "Strong", color: "bg-emerald" };
  return { level: 3, label: "Good", color: "bg-emerald-soft" };
}

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", password: "", agreed_to_terms: false as unknown as true },
  });

  const pw = watch("password") || "";
  const agreed = watch("agreed_to_terms");
  const strength = scorePassword(pw);

  const onSubmit = async ({ email, password, full_name }: FormValues) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name }, emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) {
      setError("root", { message: error.message });
      return;
    }
    if (!data.session) {
      setError("root", {
        message: `We sent a confirmation link to ${email}. Click it to finish signing up.`,
      });
      return;
    }
    router.push("/onboarding");
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
      setError("root", { message: "Google sign-up failed. Try again." });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.21, 0.61, 0.35, 1] }}
    >
      <p className="num text-xs uppercase tracking-[0.22em] text-ink-muted">Create your account</p>
      <h1 className="mt-3 display text-4xl font-medium leading-[1.05] tracking-tight">
        Start finding leads <span className="display-italic text-emerald">today.</span>
      </h1>
      <p className="mt-3 text-sm text-ink-soft">
        Already a member?{" "}
        <Link href="/login" className="link-underline font-medium text-ink">
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-9 space-y-5" noValidate>
        <Field label="Full name" error={errors.full_name?.message}>
          <input
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            className={cn("input", errors.full_name && "border-crimson")}
            {...register("full_name")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className={cn("input", errors.email && "border-crimson")}
            {...register("email")}
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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
          {pw.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      strength.level >= seg ? strength.color : "bg-line",
                    )}
                  />
                ))}
              </div>
              <span className="num min-w-[42px] text-right text-[10px] uppercase tracking-[0.16em] text-ink-soft">
                {strength.label}
              </span>
            </div>
          )}
        </Field>

        <label className="flex items-start gap-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-line text-emerald focus:ring-emerald/30"
            {...register("agreed_to_terms")}
          />
          <span>
            I agree to the{" "}
            <Link href="/tos" target="_blank" className="link-underline font-medium text-ink">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="link-underline font-medium text-ink">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.agreed_to_terms && (
          <p className="-mt-2 text-xs text-crimson">{errors.agreed_to_terms.message}</p>
        )}

        {errors.root && <p className="text-xs text-crimson">{errors.root.message}</p>}

        <motion.button
          type="submit"
          disabled={isSubmitting || !agreed}
          whileTap={{ scale: 0.98 }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-ivory transition-colors hover:bg-emerald disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
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
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-ink-soft">{label}</span>
      </span>
      {children}
      {error && <p className="mt-1.5 text-xs text-crimson">{error}</p>}
    </label>
  );
}
