"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";

import {
  loginWithGoogle,
  requestSignupVerification,
  verifySignupEmail,
} from "@/lib/api/auth";
import {
  saveAuthToken,
  saveTenantContext,
  saveUserMeta,
  clearAuth,
} from "@/lib/auth";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verificationCode, setVerificationCode] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const [resendCooldown, setResendCooldown] = useState(0);

  const authenticationLoading =
    loading || googleLoading || verificationLoading;

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [resendCooldown]);

  const handleGoogleCredential = useCallback(
    async (credential: string) => {
      setError("");

      try {
        setGoogleLoading(true);
        clearAuth();

        const response = await loginWithGoogle({
          credential,
        });

        saveAuthToken(response.access_token, response.token_type);
        router.replace("/onboarding");
      } catch (err) {
        clearAuth();

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unable to create your account with Google.");
        }
      } finally {
        setGoogleLoading(false);
      }
    },
    [router],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your confirm password.");
      return;
    }

    try {
      setLoading(true);

      await requestSignupVerification({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        business_name: `${name.trim()}'s Business`,
      });

      setVerificationStep(true);
      setResendCooldown(60);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to send verification code. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const code = verificationCode.replace(/\D/g, "");

    if (code.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setVerificationLoading(true);
      clearAuth();

      const response = await verifySignupEmail({
        email: email.trim().toLowerCase(),
        code,
      });

      saveAuthToken(response.access_token, response.token_type || "bearer");
      saveUserMeta(name.trim(), email.trim().toLowerCase());

      if (response.tenant_id && response.business_account_id) {
        saveTenantContext(response.tenant_id, response.business_account_id);
      }

      router.push("/onboarding");
      window.location.href = "/onboarding";
    } catch (err) {
      clearAuth();

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to verify your email address. Please check the code.");
      }
    } finally {
      setVerificationLoading(false);
    }
  }

  async function handleResendCode() {
    if (resendCooldown > 0 || authenticationLoading) {
      return;
    }

    setError("");

    try {
      setVerificationLoading(true);

      await requestSignupVerification({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        business_name: `${name.trim()}'s Business`,
      });

      setResendCooldown(60);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unable to resend verification code. Please try again.");
      }
    } finally {
      setVerificationLoading(false);
    }
  }

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
                  alt="meaeco logo"
                  className="h-10 w-10 object-contain rounded-xl"
                />
                <span className="text-2xl font-black tracking-tight text-white">
                  meaeco
                </span>
              </Link>
            </div>

            {/* 4 Social Media Tiles */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white shadow-md transition-transform hover:scale-105">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-md transition-transform hover:scale-105">
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0A66C2] text-white shadow-md transition-transform hover:scale-105">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </div>

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
              meaeco is ready when you are.
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
              <Link href="/" className="flex items-center gap-2">
                <img
                  src="/logo/app logo.png"
                  alt="meaeco logo"
                  className="h-8 w-8 object-contain"
                />
                <span className="text-xl font-black text-zinc-950">meaeco</span>
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
              {!verificationStep ? (
                /* Step 1: Signup Details */
                <div>
                  <div>
                    <h2 className="text-2xl sm:text-[26px] font-black tracking-tight text-zinc-950">
                      Create an account
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 font-normal">
                      Start your autonomous marketing journey today.
                    </p>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
                      {error}
                    </div>
                  )}

                  {/* Signup Form */}
                  <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
                    {/* Full Name Field */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                          disabled={authenticationLoading}
                          className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                        />
                      </div>
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                        Email Address
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
                      <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 8 characters"
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

                    {/* Confirm Password Field */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat your password"
                          disabled={authenticationLoading}
                          className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-10 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-600"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={authenticationLoading}
                      className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5B3DF5] hover:bg-[#4E2DE6] text-sm font-bold text-white shadow-md shadow-purple-600/25 transition-all hover:shadow-lg disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account</span>
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

                  {/* Login Link */}
                  <div className="mt-5 text-center text-xs text-zinc-600">
                    <span>Already have an account? </span>
                    <Link
                      href="/login"
                      className="font-bold text-purple-600 hover:text-purple-700 hover:underline"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              ) : (
                /* Step 2: Verification Code (OTP) */
                <div>
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h2 className="mt-4 text-2xl font-black tracking-tight text-zinc-950">
                      Verify your email
                    </h2>
                    <p className="mt-1.5 text-xs text-zinc-500 font-normal">
                      We sent a 6-digit code to{" "}
                      <span className="font-semibold text-zinc-800">{email}</span>.
                    </p>
                  </div>

                  {error && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-600">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleVerifyEmail} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 mb-1.5 text-center">
                        6-Digit Verification Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="123456"
                        disabled={authenticationLoading}
                        className="h-12 w-full text-center text-xl font-mono tracking-widest rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-300 outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authenticationLoading}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#5B3DF5] hover:bg-[#4E2DE6] text-sm font-bold text-white shadow-md shadow-purple-600/25 transition-all hover:shadow-lg disabled:opacity-50"
                    >
                      {verificationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Verifying code...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Complete Registration</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-2">
                      <button
                        type="button"
                        onClick={() => setVerificationStep(false)}
                        className="font-medium hover:text-zinc-800 underline"
                      >
                        Change email
                      </button>

                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={resendCooldown > 0 || authenticationLoading}
                        className="font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-50"
                      >
                        {resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : "Resend Code"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
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