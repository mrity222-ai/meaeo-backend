"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Lock, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/api/client";
import { saveAuthToken } from "@/lib/auth";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [securityPin, setSecurityPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest<{
        status: string;
        access_token: string;
        user: { email: string; role: string; name: string };
      }>("/admin/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          password,
          security_pin: securityPin.trim(),
        }),
      });

      if (res.access_token) {
        localStorage.setItem("admin_token", res.access_token);
        localStorage.setItem("admin_user", JSON.stringify(res.user));
        try {
          saveAuthToken(res.access_token);
        } catch (_) {}
        window.location.href = "/admin/dashboard";
      }
    } catch (err: any) {
      setError(err?.detail || err?.message || "Invalid Super Admin credentials or security PIN.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-neutral-950 text-white">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-600/30">
            <ShieldCheck size={28} />
          </div>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Super Admin Portal
          </h1>
          <p className="mt-2 text-xs text-neutral-400">
            Authorized administrative & system control boundary.
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-8 shadow-2xl backdrop-blur">
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-neutral-300">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="mt-1.5 h-11 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 text-sm text-white focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 h-11 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 text-sm text-white focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300">Super Admin Security PIN (2FA)</label>
              <input
                type="text"
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                placeholder="6-digit security code"
                className="mt-1.5 h-11 w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 text-sm font-mono text-white tracking-widest focus:border-purple-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="ui-button-primary mt-4 flex h-11 w-full items-center justify-center gap-2 font-semibold text-sm transition disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating Super Admin...
                </>
              ) : (
                <>
                  Access Admin Console
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-neutral-800 pt-4 text-center">
            <Link href="/login" className="text-xs text-neutral-400 hover:text-purple-400">
              ← Switch to User Login Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
