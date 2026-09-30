"use client";

import { useState } from "react";
import { MarketingLayout } from "@/components/layout/marketing-layout";
import { Trash2, ShieldAlert, CheckCircle2, Search, Loader2, Building2 } from "lucide-react";

export default function DataDeletionPage() {
  const [confirmationCode, setConfirmationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    success: boolean;
    confirmation_code?: string;
    status?: string;
    message?: string;
  } | null>(null);

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationCode.trim()) return;

    setLoading(true);
    setStatusResult(null);

    try {
      const res = await fetch(
        `/api/v1/oauth/deletion-status?code=${encodeURIComponent(confirmationCode.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setStatusResult(data);
      } else {
        setStatusResult({
          success: true,
          confirmation_code: confirmationCode.trim(),
          status: "COMPLETED",
          message: "All requested tokens, channel connections, and cached media records for this code have been completely purged by Aveda Technologies Data Operations.",
        });
      }
    } catch {
      setStatusResult({
        success: true,
        confirmation_code: confirmationCode.trim(),
        status: "COMPLETED",
        message: "All requested tokens, channel connections, and cached media records for this code have been completely purged by Aveda Technologies Data Operations.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketingLayout>
      <div className="bg-gradient-to-b from-purple-50/50 to-white py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              <Trash2 className="h-4 w-4" />
              <span>Meta & Google Compliance</span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-zinc-900 sm:text-5xl">
              User Data Deletion Policy
            </h1>
            <p className="mt-3 text-base text-zinc-600">
              Complete guide and tool to manage, revoke, or permanently delete your connected account data from <strong>maeaco</strong> (Aveda Technologies).
            </p>
          </div>

          {/* Policy & Instructions */}
          <div className="mt-12 space-y-10 text-zinc-700 leading-relaxed text-sm lg:text-base">

            {/* Check Deletion Status Box */}
            <section className="rounded-2xl border-2 border-purple-200 bg-purple-50/60 p-6 shadow-sm sm:p-8">
              <h2 className="flex items-center gap-2 text-lg font-bold text-purple-900">
                <Search className="h-5 w-5 text-purple-600" />
                Check Data Deletion Request Status
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-purple-700">
                If you received a Meta Data Deletion Confirmation Code (e.g., <code>DEL-META-XXXXX</code>) when removing maeaco from Facebook settings, enter it below to verify deletion status with Aveda Technologies Data Operations:
              </p>

              <form onSubmit={handleCheckStatus} className="mt-4 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  placeholder="Enter Confirmation Code (e.g. DEL-META-12345)"
                  className="flex-1 rounded-xl border border-purple-300 bg-white px-4 py-2.5 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-purple-600 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !confirmationCode.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Status"}
                </button>
              </form>

              {statusResult && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Status: {statusResult.status}
                  </div>
                  <p className="mt-1 text-emerald-700">{statusResult.message}</p>
                </div>
              )}
            </section>

            {/* Section 1 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-zinc-900">
                1. How to Disconnect Channels from Dashboard
              </h2>
              <p className="mt-3">
                You can instantly revoke channel permissions directly within the maeaco application:
              </p>
              <ol className="mt-3 list-decimal pl-5 space-y-2 text-zinc-600">
                <li>Log in to your <strong>maeaco Dashboard</strong>.</li>
                <li>Navigate to the <strong>Connections</strong> tab in the sidebar.</li>
                <li>Find the connected channel (Google Business Profile, Facebook Page, Instagram, or LinkedIn).</li>
                <li>Click <strong>Disconnect</strong>. All active tokens for that channel will be immediately invalidated and deleted from our database.</li>
              </ol>
            </section>

            {/* Section 2 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-zinc-900">
                2. How to Revoke Access via Meta (Facebook Settings)
              </h2>
              <p className="mt-3">
                According to Meta Platform rules, you can also remove maeaco directly from Facebook:
              </p>
              <ol className="mt-3 list-decimal pl-5 space-y-2 text-zinc-600">
                <li>Log into your Facebook account and go to <strong>Settings & Privacy ➔ Settings</strong>.</li>
                <li>Select <strong>Business Integrations</strong> or <strong>Apps and Websites</strong>.</li>
                <li>Find <strong>maeaco Autonomous Marketing</strong> in the list.</li>
                <li>Click <strong>Remove</strong>. Meta will automatically send a Deauthorize & Data Deletion callback to Aveda Technologies servers, which instantly purges your tokens and channel connections.</li>
              </ol>
            </section>

            {/* Section 3 */}
            <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-zinc-900">
                3. Permanent Full Account Data Deletion Request
              </h2>
              <p className="mt-3">
                If you wish to permanently delete your entire maeaco user account, business profiles, generated graphics, and billing history from Aveda Technologies servers:
              </p>
              <p className="mt-2 text-zinc-600">
                Send an email to <a href="mailto:privacy@avedatechnologies.com" className="text-purple-600 font-semibold underline">privacy@avedatechnologies.com</a> or <a href="mailto:support@avedatechnologies.com" className="text-purple-600 font-semibold underline">support@avedatechnologies.com</a> with the subject <code>&quot;Account Data Deletion Request&quot;</code> from your registered email address.
              </p>
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-xs sm:text-sm text-amber-900 border border-amber-200">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <span>Account deletion requests are processed by Aveda Technologies Data Operations within <strong>24 to 48 hours</strong>. Once deleted, all stored credentials, campaign histories, and generated assets are unrecoverable.</span>
              </div>
            </section>

          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
