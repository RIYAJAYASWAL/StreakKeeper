"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.error || !result?.ok) {
        setError("Invalid email or password. Please try again.");
        setIsLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md bg-surface border border-surfaceBorder rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
      {/* Registration Success Toast */}
      {registered && (
        <div className="mb-6 p-3.5 rounded-xl bg-frozen/10 border border-frozen/30 text-frozen text-sm flex items-center gap-2.5 shadow-sm">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Account created successfully! Log in to continue.</span>
        </div>
      )}

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-textPrimary">Welcome back</h1>
        <p className="text-sm text-textSecondary mt-1">
          Log in to manage your daily habits & streaks
        </p>
      </div>

      {/* Login Error Banner */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-emberStart text-sm flex items-start gap-2.5">
          <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="alex@example.com"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-background border border-surfaceBorder text-textPrimary placeholder:text-textSecondary/50 text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors"
          />
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-textSecondary uppercase tracking-wider">
              Password
            </label>
            <Link href="#" className="text-xs text-violet hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl bg-background border border-surfaceBorder text-textPrimary placeholder:text-textSecondary/50 text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4 py-3.5 px-4 rounded-xl bg-ember-gradient text-background font-bold text-sm shadow-lg shadow-[#FF6B6B]/20 hover:shadow-xl hover:shadow-[#FF6B6B]/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100 transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4 text-background" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Logging in...</span>
            </>
          ) : (
            <span>Log In</span>
          )}
        </button>
      </form>

      {/* Signup Footer Link */}
      <div className="mt-6 text-center text-sm text-textSecondary border-t border-surfaceBorder/60 pt-5">
        Don't have an account?{" "}
        <Link href="/signup" className="font-semibold text-violet hover:underline transition-all">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col justify-center items-center px-4 py-12 relative selection:bg-violet/30 selection:text-textPrimary">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-[#8B5CF6]/10 via-[#FF6B6B]/5 to-transparent blur-[140px] rounded-full" />
      </div>

      {/* Header Logo Link */}
      <div className="relative z-10 mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-ember-gradient p-0.5 shadow-md shadow-[#FF6B6B]/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-surface rounded-[10px] flex items-center justify-center">
              <svg className="w-4 h-4 text-emberMid" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.001 2c-3.5 4.5-2.5 7.5-1 9.5-3-1-4-3.5-4-3.5-2.5 3.5-1 7.5 1 9.5 2 2 5.5 2.5 8 0 3-3 2.5-8.5-4-15.5zm.5 16.5c-1.5.5-3 0-3.5-1-.5-1 0-2.5 1-3.5 1 1.5 2.5 2 3.5 2.5.5 1 .5 1.5-1 2z" />
              </svg>
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-textPrimary">
            Streak<span className="text-transparent bg-clip-text bg-ember-gradient">Keeper</span>
          </span>
        </Link>
      </div>

      <Suspense fallback={<div className="text-textSecondary text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
