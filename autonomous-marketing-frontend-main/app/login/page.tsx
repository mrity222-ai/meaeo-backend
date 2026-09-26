"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";

import { getBusinessAccounts } from "@/lib/api/onboarding";
import { loginUser, loginWithGoogle } from "@/lib/api/auth";
import {
  clearAuth,
  saveAuthToken,
  saveTenantContext,
  saveUserMeta,
} from "@/lib/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const finishAuthentication = useCallback(
    async (accessToken: string, tokenType: string) => {
      saveAuthToken(accessToken, tokenType);

      const businessAccounts = await getBusinessAccounts();

      if (businessAccounts.length === 0) {
        router.replace("/onboarding");
        return;
      }

      const businessAccount = businessAccounts[0];

      saveTenantContext(businessAccount.tenant_id, businessAccount.id);

      router.replace("/dashboard");
    },
    [router],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      clearAuth();

      const response = await loginUser({
        email: email.trim(),
        password,
      });

      saveUserMeta("", email.trim());

      await finishAuthentication(response.access_token, response.token_type);
    } catch (err) {
      clearAuth();

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to sign in.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleCredential(credential: string) {
    setError("");

    try {
      setGoogleLoading(true);
      clearAuth();

      const response = await loginWithGoogle({
        credential,
      });

      await finishAuthentication(response.access_token, response.token_type);
    } catch (err) {
      clearAuth();

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to sign in with Google.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  const authenticationLoading = loading || googleLoading;

  return (
    <main className="min-h-screen bg-[#F9FAFC] font-sans antialiased text-zinc-900">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: VIBRANT PURPLE BRAND SHOWCASE WITH SOCIAL TILES & WAVES */}
        {/* ========================================================================= */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#6929E8] via-[#7B2CBF] to-[#511696] text-white lg:flex lg:flex-col lg:justify-between p-10 xl:p-14 select-none">
          {/* Top Bar: Back Button, Logo, Social Icons */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-md transition-all hover:bg-white/25 hover:scale-105"
                title="Back to home"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>

              <Link href="/" className="flex items-center gap-3">
                <img
                  src="/logo/app logo.png"
                  alt="maeaco logo"
                  className="h-10 w-10 object-contain rounded-xl"
                />
                <span className="text-2xl font-black tracking-tight text-white">
                  maeaco
                </span>
              </Link>
            </div>

            {/* 4 Social Media Tiles */}
            <div className="flex items-center gap-2.5">
              {/* Instagram */}
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white shadow-md transition-transform hover:scale-105">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>

              {/* Facebook */}
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-md transition-transform hover:scale-105">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>

              {/* LinkedIn */}
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A66C2] text-white shadow-md transition-transform hover:scale-105">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </div>

              {/* Google */}
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-md transition-transform hover:scale-105">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Center Message */}
          <div className="relative my-auto max-w-xl z-10">
            <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.15]">
              maeaco is ready when you are.
            </h1>
            <p className="mt-6 text-base xl:text-lg leading-relaxed text-purple-100/90 font-normal">
              Create campaigns, publish content, connect your platforms, and learn from your marketing performance — all from one workspace.
            </p>
          </div>

          {/* Bottom Wave Graphics */}
          <div className="absolute -bottom-1 -left-1 -right-1 pointer-events-none opacity-35 select-none">
            <svg viewBox="0 0 1440 320" className="w-full h-44" preserveAspectRatio="none">
              <path fill="rgba(255, 255, 255, 0.15)" d="M0,192L48,197.3C96,203,192,213,288,192C384,171,480,117,576,122.7C672,128,768,192,864,197.3C960,203,1056,149,1152,128C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              <path fill="rgba(255, 255, 255, 0.25)" d="M0,256L48,245.3C96,235,192,213,288,218.7C384,224,480,256,576,250.7C672,245,768,203,864,181.3C960,160,1056,160,1152,176C1248,192,1344,224,1392,240L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: CLEAN CANVAS WITH FLOATING WHITE CARD */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-center bg-[#F9FAFC] px-4 py-12 sm:px-8">
          <div className="w-full max-w-[440px]">
            {/* Mobile Header (Back + Logo) */}
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link
                href="/"
                className="flex items-center gap-2"
              >
                <img
                  src="/logo/app logo.png"
                  alt="maeaco logo"
                  className="h-8 w-8 object-contain"
                />
                <span className="text-xl font-black text-zinc-950">maeaco</span>
              </Link>

              <Link
                href="/"
                className="text-xs font-semibold text-purple-600 hover:underline"
              >
                ← Back to home
              </Link>
            </div>

            {/* Floating Card Container */}
            <div className="rounded-[28px] border border-zinc-200/80 bg-white p-7 sm:p-9 shadow-xl shadow-purple-950/5">
              {/* Card Title & Subtitle */}
              <div>
                <h2 className="text-2xl sm:text-[26px] font-black tracking-tight text-zinc-950">
                  Welcome back
                </h2>
                <p className="mt-1 text-sm text-zinc-500 font-normal">
                  Sign in to continue to your marketing workspace.
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      disabled={authenticationLoading}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-zinc-800">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={authenticationLoading}
                      className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign In Primary Button */}
                <button
                  type="submit"
                  disabled={authenticationLoading}
                  className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5B3DF5] hover:bg-[#4E2DE6] text-sm font-bold text-white shadow-md shadow-purple-600/25 transition-all hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* OR Divider */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="w-full border-t border-zinc-200/80" />
                <span className="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  OR
                </span>
              </div>

              {/* Continue with Google */}
              <div className="flex justify-center">
                <GoogleSignInButton
                  onSuccess={handleGoogleCredential}
                  disabled={authenticationLoading}
                />
              </div>

              {/* Sign up link */}
              <div className="mt-5 text-center text-xs text-zinc-600">
                <span>Do not have an account? </span>
                <Link
                  href="/signup"
                  className="font-bold text-purple-600 hover:text-purple-700 hover:underline"
                >
                  Create one
                </Link>
              </div>

              {/* Super Admin Portal Login Button */}
              <div className="mt-5">
                <Link
                  href="/admin/login"
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-purple-50/80 hover:bg-purple-100/90 border border-purple-200/70 text-xs font-bold text-purple-700 transition shadow-xs"
                >
                  <Lock className="h-3.5 w-3.5 text-purple-600" />
                  <span>Super Admin Portal Login</span>
                </Link>
              </div>
            </div>

            {/* Bottom Disclaimer */}
            <p className="mt-5 text-center text-[11px] text-zinc-400">
              By continuing, you agree to our{" "}
              <a href="#terms" className="underline hover:text-zinc-600">
                Terms
              </a>{" "}
              and{" "}
              <a href="#privacy" className="underline hover:text-zinc-600">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}