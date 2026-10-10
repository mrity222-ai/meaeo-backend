"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
interface Plan { id: number; plan_code: string; name: string; price: number; currency: string; billing_interval: string; max_brands: number; max_campaigns_per_month: number; is_popular?: boolean; }
export function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 10000);
    setLoading(true); setError("");
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    fetch(`${base}/payments/plans?include_inactive=false`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Plans unavailable");
        const data = await response.json();
        if (!Array.isArray(data) || !data.length || data.some((plan) => !plan.plan_code || !Number.isFinite(Number(plan.price)) || Number(plan.price) < 0 || !/^[A-Z]{3}$/.test(plan.currency || ""))) throw new Error("Plans unavailable");
        if (active) setPlans(data);
      })
      .catch(() => { if (active) setError("Current plans could not be loaded. Please retry; checkout confirms the final price and limits."); })
      .finally(() => { clearTimeout(timeout); if (active) setLoading(false); });
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [attempt]);
  return (
    <section id="pricing" className="bg-[#FAF9FF] py-20 lg:py-28 text-zinc-900 border-t border-purple-100/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="marketing-section-intro">
          <p className="marketing-eyebrow">Plans & pricing</p>
          <h2 className="marketing-section-title">Simple plans for your business</h2>
          <p className="mt-4 text-zinc-600">Premium starts at ₹999/month. Current account limits and billing prices are shown below.</p>
          <p className="marketing-section-note text-zinc-500">No estimated currency conversions. Your checkout confirms the payable amount.</p>
        </div>
        {loading ? <p role="status" className="mt-10 flex justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Loading current plans…</p> : error ? (
          <div role="alert" className="mx-auto mt-10 max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
            <p>{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)} className="ui-button-secondary mt-4">Retry loading plans</button>
          </div>
        ) : <div className={`mt-12 grid gap-6 ${plans.length === 1 ? "mx-auto max-w-md" : "md:grid-cols-2 lg:grid-cols-3"}`}>
          {plans.map((plan) => (
            <article key={plan.id} className={`marketing-card flex flex-col rounded-3xl border p-7 ${plan.is_popular ? "border-purple-600 bg-purple-600 text-white shadow-lg" : "border-purple-100 bg-white"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-bold">{plan.name}</h3>{plan.is_popular && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-purple-700">Most popular</span>}</div>
              <p className="mt-6 text-4xl font-black">{Number(plan.price) === 0 ? "Free" : new Intl.NumberFormat("en-IN", { style: "currency", currency: plan.currency, maximumFractionDigits: 2 }).format(Number(plan.price))}</p>
              <p className="mt-2 text-sm">{Number(plan.price) === 0 ? "Within the current free plan limits" : `Billed ${plan.billing_interval}`}</p>
              <ul className="my-8 space-y-3 text-sm">
                {[`Up to ${plan.max_brands} business profiles`, `Up to ${plan.max_campaigns_per_month} campaigns per month`, "Branded image posts and captions", "Review, scheduling and connected-channel publishing", "Available platform analytics"].map((feature) => <li key={feature} className="flex gap-2"><Check className="h-4 w-4 shrink-0" /><span>{feature}</span></li>)}
              </ul>
              <Link href={`/signup?plan=${encodeURIComponent(plan.plan_code)}`} className="mt-auto flex items-center justify-center gap-2 rounded-full border border-current px-5 py-3 font-semibold">Get started<ArrowRight className="h-4 w-4" /></Link>
            </article>
          ))}
        </div>}
        <p className="mt-8 text-center text-xs text-zinc-500">Publishing requires eligible connected accounts and platform permissions. Available metrics vary by platform.</p>
      </div>
    </section>
  );
}
