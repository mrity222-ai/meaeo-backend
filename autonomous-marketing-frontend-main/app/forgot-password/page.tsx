"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

import {
  requestPasswordReset,
  verifyPasswordReset,
  completePasswordReset,
} from "@/lib/api/auth";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function handleRequestReset(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await requestPasswordReset({
        email: email.trim(),
      });

      setMessage(response.message);
      setStep("otp");
      setResendCooldown(60);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to process your password reset request.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    const normalizedCode = code.replace(/\D/g, "");

    if (normalizedCode.length !== 6) {
      setError(
        "Please enter the 6-digit verification code.",
      );
      return;
    }

    try {
      setLoading(true);

      const response = await verifyPasswordReset({
        email: email.trim(),
        code: normalizedCode,
      });

      setResetToken(response.reset_token);
      setStep("password");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid verification code.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteReset(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError(
        "Password must be at least 8 characters.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await completePasswordReset({
        email: email.trim(),
        reset_token: resetToken,
        new_password: newPassword,
      });

      router.replace("/login?reset=success");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to update your password.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0 || loading) {
      return;
    }

    setError("");
    setMessage("");

    try {
      setLoading(true);

      const response = await requestPasswordReset({
        email: email.trim(),
      });

      setMessage(response.message);
      setResendCooldown(60);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to resend the verification code.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left side */}
        <div className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(139,92,246,0.35),transparent_35%)]" />

          <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

          <div className="relative p-10">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-base font-bold text-white"
            >
              <img
                src="/logo/app logo.png"
                alt="maeaco logo"
                className="h-8 w-8 rounded-lg object-contain"
              />
              maeaco
            </Link>
          </div>

          <div className="relative max-w-xl p-10 pb-16">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300">
              Account security
            </p>

            <h1 className="mt-5 text-4xl font-semibold leading-tight text-white">
              Secure access to your marketing workspace.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-zinc-400">
              Verify your email address and create a new
              password securely.
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link
                href="/"
                className="flex items-center gap-2.5 text-base font-bold text-zinc-950"
              >
                <img
                  src="/logo/app logo.png"
                  alt="maeaco logo"
                  className="h-8 w-8 rounded-lg object-contain"
                />
                maeaco
              </Link>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-9">
              {step === "email" && (
                <>
                  <Link
                    href="/login"
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                  </Link>

                  <h2 className="text-2xl font-semibold tracking-tight">
                    Forgot your password?
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Enter your account email and we&apos;ll
                    send you a verification code.
                  </p>

                  {error && (
                    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form
                    onSubmit={handleRequestReset}
                    className="mt-8 space-y-5"
                  >
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-zinc-800"
                      >
                        Email
                      </label>

                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        disabled={loading}
                        required
                        className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending code...
                        </>
                      ) : (
                        <>
                          Send verification code
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {step === "otp" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setMessage("");
                      setStep("email");
                    }}
                    disabled={loading}
                    className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
                    <CheckCircle2 className="h-6 w-6 text-zinc-800" />
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                    Verify your email
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-medium text-zinc-800">
                      {email}
                    </span>
                    .
                  </p>

                  {error && (
                    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  {message && (
                    <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                      {message}
                    </div>
                  )}

                  <form
                    onSubmit={handleVerifyCode}
                    className="mt-8 space-y-5"
                  >
                    <div>
                      <label
                        htmlFor="code"
                        className="mb-2 block text-sm font-medium text-zinc-800"
                      >
                        Verification code
                      </label>

                      <input
                        id="code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="000000"
                        value={code}
                        onChange={(event) =>
                          setCode(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          )
                        }
                        disabled={loading}
                        required
                        autoFocus
                        className="h-14 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-center text-2xl font-semibold tracking-[0.45em] outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={
                        loading || code.length !== 6
                      }
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify code
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={
                        loading || resendCooldown > 0
                      }
                      className="text-sm font-semibold text-zinc-950 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline"
                    >
                      {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Resend verification code"}
                    </button>
                  </div>
                </>
              )}

              {step === "password" && (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
                    <CheckCircle2 className="h-6 w-6 text-zinc-800" />
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                    Create a new password
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    Choose a new password for your account.
                  </p>

                  {error && (
                    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <form
                    onSubmit={handleCompleteReset}
                    className="mt-8 space-y-5"
                  >
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="mb-2 block text-sm font-medium text-zinc-800"
                      >
                        New password
                      </label>

                      <input
                        id="newPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a new password"
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(event.target.value)
                        }
                        disabled={loading}
                        required
                        minLength={8}
                        className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                      />

                      <p className="mt-1.5 text-xs text-zinc-400">
                        Minimum 8 characters.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-2 block text-sm font-medium text-zinc-800"
                      >
                        Confirm password
                      </label>

                      <input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repeat your new password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(
                            event.target.value,
                          )
                        }
                        disabled={loading}
                        required
                        minLength={8}
                        className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Updating password...
                        </>
                      ) : (
                        <>
                          Update password
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-zinc-400">
              Your account security is protected by email
              verification.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}