"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [detectedTimezone, setDetectedTimezone] = useState("UTC");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setDetectedTimezone(tz);
      }
    } catch {
      setDetectedTimezone("UTC");
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error as user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          timezone: detectedTimezone,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors({
          general: data.message || "Failed to create account. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      // On success, redirect to login page with registered flag
      router.push("/login?registered=true");
    } catch {
      setErrors({
        general: "An unexpected error occurred. Please check your connection.",
      });
      setIsLoading(false);
    }
  };

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

      {/* Main Signup Card */}
      <div className="relative z-10 w-full max-w-md bg-surface border border-surfaceBorder rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary">Create your account</h1>
          <p className="text-sm text-textSecondary mt-1">
            Start building forgiving streaks today
          </p>
        </div>

        {/* General Error Banner */}
        {errors.general && (
          <div className="mb-6 p-3.5 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-emberStart text-sm flex items-start gap-2.5">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Alex Morgan"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl bg-background border ${
                errors.name ? "border-emberStart" : "border-surfaceBorder"
              } text-textPrimary placeholder:text-textSecondary/50 text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors`}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-emberStart flex items-center gap-1">
                <span>•</span> {errors.name}
              </p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="alex@example.com"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl bg-background border ${
                errors.email ? "border-emberStart" : "border-surfaceBorder"
              } text-textPrimary placeholder:text-textSecondary/50 text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-emberStart flex items-center gap-1">
                <span>•</span> {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl bg-background border ${
                errors.password ? "border-emberStart" : "border-surfaceBorder"
              } text-textPrimary placeholder:text-textSecondary/50 text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors`}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-emberStart flex items-center gap-1">
                <span>•</span> {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl bg-background border ${
                errors.confirmPassword ? "border-emberStart" : "border-surfaceBorder"
              } text-textPrimary placeholder:text-textSecondary/50 text-sm focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet transition-colors`}
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-emberStart flex items-center gap-1">
                <span>•</span> {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Timezone Badge Info */}
          <div className="pt-1 flex items-center justify-between text-[11px] text-textSecondary">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-violet" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Timezone detected:
            </span>
            <span className="font-mono text-textPrimary bg-background px-2 py-0.5 rounded border border-surfaceBorder">
              {detectedTimezone}
            </span>
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
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-sm text-textSecondary border-t border-surfaceBorder/60 pt-5">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-violet hover:underline transition-all">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
