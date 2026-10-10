"use client";

import { useEffect, useState } from "react";
import { MarketingPageHero } from "@/components/marketing/marketing-page-hero";
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

  useEffect(() => { setConfirmationCode(new URLSearchParams(window.location.search).get("code") || ""); }, []);
  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationCode.trim()) return;

    setLoading(true);
    setStatusResult(null);

    try {
      const base = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
      const res = await fetch(`${base}/oauth/deletion-status?code=${encodeURIComponent(confirmationCode.trim())}`, { signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (!res.ok || data.success !== true) throw new Error(typeof data.detail === "string" ? data.detail : "Unable to verify deletion status.");
      setStatusResult(data);
    } catch (error) {
      setStatusResult({ success: false, status: "UNVERIFIED", message: error instanceof Error ? error.message : "Unable to verify status. Please try again or contact support." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketingLayout>
      <MarketingPageHero label="Connected Account Data" title="User Data Deletion Policy" description={<>Complete guide and tool to manage, revoke, or permanently delete your connected account data from <strong>maeaco</strong> (Aveda Technologies).</>} />
      <div className="marketing-public-content bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">


          {/* Policy & Instructions */}
          <div className="space-y-6 text-zinc-700 leading-relaxed text-sm lg:text-base">

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
                  aria-label="Data deletion confirmation code"
                  maxLength={100}
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
                <div role={statusResult.success ? "status" : "alert"} className={`mt-4 rounded-xl border p-4 text-xs sm:text-sm ${statusResult.status === "COMPLETED" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                  <div className="flex items-center gap-2 font-bold text-current">
                    <CheckCircle2 className="h-4 w-4 text-current" />
                    Status: {statusResult.status}
                  </div>
                  <p className="mt-1 text-current">{statusResult.message}</p>
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
                <li>Click <strong>Disconnect</strong>. This disconnects the channel from publishing. Contact support to confirm any additional account-data cleanup.</li>
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
                <li>Click <strong>Remove</strong>. Meta may notify maeaco about revoked access or a deletion request. The recorded request status is shown above; removing an integration is not a confirmation that all stored data has been purged.</li>
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
                <span>Contact support to confirm the scope and progress of your deletion request. A request remains processing until cleanup is verified; permanent deletion cannot be undone.</span>
              </div>
            </section>

          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
