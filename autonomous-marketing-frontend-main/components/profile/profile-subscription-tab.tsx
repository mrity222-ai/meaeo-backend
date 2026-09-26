"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  Layers,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { apiRequest } from "@/lib/api/client";

interface SubscriptionPlan {
  id: number;
  plan_code: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  billing_interval: string;
  max_brands: number;
  max_campaigns_per_month: number;
  features: { bullets?: string[]; [key: string]: any } | null;
  is_active?: boolean;
}

interface CurrentSubscription {
  id?: number;
  tenant_id: string;
  status: string;
  provider?: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  plan: {
    id?: number;
    plan_code: string;
    name: string;
    price?: number;
    currency?: string;
    max_brands?: number;
    max_campaigns_per_month?: number;
  } | null;
}

interface TransactionItem {
  id: number;
  order_id: string;
  payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  plan_code?: string;
  created_at: string | null;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function ProfileSubscriptionTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<CurrentSubscription | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);
    try {
      const [plansData, subData, txData] = await Promise.all([
        apiRequest<SubscriptionPlan[]>("/payments/plans").catch(() => []),
        apiRequest<CurrentSubscription>("/payments/my-subscription").catch(() => null),
        apiRequest<TransactionItem[]>("/payments/transactions").catch(() => []),
      ]);

      setPlans(Array.isArray(plansData) ? plansData : []);
      if (subData) setCurrentSub(subData);
      if (Array.isArray(txData)) setTransactions(txData);
    } catch (err: any) {
      setError(err?.message || "Failed to load subscription details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setCheckoutLoading(plan.plan_code);
    setError(null);
    setSuccessMsg(null);

    try {
      if (plan.price === 0) {
        setSuccessMsg(`You are currently on the ${plan.name}.`);
        setCheckoutLoading(null);
        return;
      }

      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your connection.");
      }

      const orderData = await apiRequest<{
        order_id: string;
        amount: number;
        currency: string;
        key_id: string;
      }>("/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ plan_code: plan.plan_code }),
      });

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Autonomous Marketing AI",
        description: `Upgrade to ${plan.name}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          try {
            await apiRequest("/payments/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_code: plan.plan_code,
              }),
            });
            setSuccessMsg(`Payment successful! Upgraded to ${plan.name}.`);
            loadData();
          } catch (verErr: any) {
            setError(verErr?.message || "Payment verification failed.");
          }
        },
        theme: { color: "#09090b" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err?.message || "Failed to initiate payment.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-neutral-400" size={28} />
      </div>
    );
  }

  const currentPlanCode = currentSub?.plan?.plan_code || "free";
  const activePlanName = currentSub?.plan?.name || "Free Tier";

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <Check size={16} />
          {successMsg}
        </div>
      )}

      {/* Current Active Plan Overview */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-neutral-950 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                Current Plan
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <CheckCircle2 size={12} />
                {currentSub?.status === "active" ? "Active" : "Active Subscription"}
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold text-neutral-950">{activePlanName}</h2>
            <p className="text-xs text-neutral-500">
              {currentSub?.current_period_end
                ? `Renews on ${new Date(currentSub.current_period_end).toLocaleDateString()}`
                : "Active marketing tier with monthly renewal"}
            </p>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 transition"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Sync Status
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
            <p className="text-xs text-neutral-500">Brand Profiles</p>
            <p className="mt-1 text-lg font-bold text-neutral-950">
              {currentSub?.plan?.max_brands || 1} Brands
            </p>
          </div>

          <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
            <p className="text-xs text-neutral-500">Campaigns Limit</p>
            <p className="mt-1 text-lg font-bold text-neutral-950">
              {currentSub?.plan?.max_campaigns_per_month || 10} / Month
            </p>
          </div>

          <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
            <p className="text-xs text-neutral-500">AI Autopilot Mode</p>
            <p className="mt-1 text-lg font-bold text-emerald-600 flex items-center gap-1.5">
              <Zap size={16} />
              Enabled
            </p>
          </div>
        </div>
      </section>

      {/* Available Plans */}
      <section>
        <div>
          <h2 className="text-lg font-bold text-neutral-950">Available Subscription Plans</h2>
          <p className="text-xs text-neutral-500">Choose the best plan to supercharge your marketing campaigns.</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
          {(plans.length > 0
            ? plans
            : [
                {
                  id: 1,
                  plan_code: "starter",
                  name: "Basic Plan",
                  price: 999,
                  currency: "INR",
                  billing_interval: "month",
                  max_brands: 1,
                  max_campaigns_per_month: 10,
                  features: {
                    bullets: [
                      "1 Brand Account",
                      "10 Autonomous Campaigns / Month",
                      "Multi-Channel Publishing",
                      "Standard Support",
                    ],
                  },
                },
                {
                  id: 2,
                  plan_code: "pro",
                  name: "Premium Pro",
                  price: 2499,
                  currency: "INR",
                  billing_interval: "month",
                  max_brands: 3,
                  max_campaigns_per_month: 50,
                  features: {
                    bullets: [
                      "Up to 3 Brands",
                      "50 Autonomous Campaigns / Month",
                      "Priority AI Image Generation",
                      "Google Business & Review Auto-Reply",
                      "Priority Support",
                    ],
                  },
                },
                {
                  id: 3,
                  plan_code: "enterprise",
                  name: "Enterprise",
                  price: 4999,
                  currency: "INR",
                  billing_interval: "month",
                  max_brands: 10,
                  max_campaigns_per_month: 200,
                  features: {
                    bullets: [
                      "Unlimited Brands",
                      "200+ Campaigns / Month",
                      "Dedicated AI Account Manager",
                      "Custom Integrations & Webhooks",
                      "24/7 Dedicated Support",
                    ],
                  },
                },
              ]
          ).map((plan) => {
            const isCurrent = currentPlanCode === plan.plan_code;
            const bullets = plan.features?.bullets || [
              `${plan.max_brands} Brands Included`,
              `${plan.max_campaigns_per_month} Campaigns Per Month`,
              "Autonomous AI Publishing",
            ];

            return (
              <div
                key={plan.plan_code}
                className={`flex flex-col justify-between rounded-2xl border p-6 transition ${
                  isCurrent
                    ? "border-neutral-950 bg-neutral-950 text-white shadow-md"
                    : "border-neutral-200 bg-white text-neutral-950 shadow-xs hover:border-neutral-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold">{plan.name}</h3>
                    {isCurrent && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        Current
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold tracking-tight">
                      {plan.currency === "INR" || plan.currency === "₹" ? "₹" : "$"}
                      {plan.price.toLocaleString()}
                    </span>
                    <span className={`text-xs ${isCurrent ? "text-neutral-400" : "text-neutral-500"}`}>
                      /{plan.billing_interval}
                    </span>
                  </div>

                  <hr className={`my-5 ${isCurrent ? "border-neutral-800" : "border-neutral-100"}`} />

                  <ul className="space-y-2.5 text-xs">
                    {bullets.map((b: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check size={14} className={isCurrent ? "text-emerald-400" : "text-emerald-600"} />
                        <span className={isCurrent ? "text-neutral-300" : "text-neutral-600"}>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4">
                  <button
                    disabled={isCurrent || checkoutLoading === plan.plan_code}
                    onClick={() => handleSubscribe(plan as SubscriptionPlan)}
                    className={`h-10 w-full rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                      isCurrent
                        ? "bg-neutral-800 text-neutral-400 cursor-default"
                        : "bg-neutral-950 text-white hover:bg-neutral-800"
                    }`}
                  >
                    {checkoutLoading === plan.plan_code ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : isCurrent ? (
                      "Active Plan"
                    ) : (
                      "Upgrade to " + plan.name
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Payment & Invoices History */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-semibold text-neutral-950">Billing & Payment History</h2>
        <p className="text-xs text-neutral-500">Past invoices and transaction records.</p>

        {transactions.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-neutral-200 p-8 text-center">
            <CreditCard className="mx-auto text-neutral-300" size={32} />
            <p className="mt-2 text-xs font-medium text-neutral-600">No past transactions found</p>
            <p className="text-[11px] text-neutral-400">When you upgrade or renew, your invoices will appear here.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="p-3 font-medium">Order ID</th>
                  <th className="p-3 font-medium">Amount</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50/50">
                    <td className="p-3 font-mono text-neutral-700">{tx.order_id}</td>
                    <td className="p-3 font-semibold text-neutral-900">
                      {tx.currency} {tx.amount}
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-500">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
