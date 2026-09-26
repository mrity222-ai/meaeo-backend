"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Star, Check, Loader2 } from "lucide-react";

interface SubscriptionPlan {
  id: number;
  plan_code: string;
  name: string;
  description: string | null;
  price: number;
  price_usd?: number | null;
  currency: string;
  billing_interval: string;
  max_brands: number;
  max_campaigns_per_month: number;
  features: { bullets?: string[]; [key: string]: any } | null;
  is_popular?: boolean;
  badge_text?: string | null;
  is_active: boolean;
}

// Fallback plans in case backend is initializing or offline
const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 1,
    plan_code: "basic",
    name: "Basic",
    description: "Ideal for exploring autonomous AI marketing for your brand.",
    price: 0,
    price_usd: 0,
    currency: "INR",
    billing_interval: "monthly",
    max_brands: 1,
    max_campaigns_per_month: 3,
    features: {
      bullets: [
        "15 AI generated posts per month",
        "Instagram & Facebook auto-publishing",
        "Basic marketing & reach tracking",
        "Community & email support",
      ],
    },
    is_popular: false,
    badge_text: null,
    is_active: true,
  },
  {
    id: 2,
    plan_code: "premium",
    name: "Premium",
    description: "Full AI power for growing businesses, creators, and brands.",
    price: 999,
    price_usd: 9.99,
    currency: "INR",
    billing_interval: "monthly",
    max_brands: 3,
    max_campaigns_per_month: 30,
    features: {
      bullets: [
        "150 AI posts / month (1 post daily)",
        "Instagram, Facebook, LinkedIn & Google Business",
        "AI Review Responder & Local SEO Engine",
        "Daily promotional offers & coupon codes",
        "Auto-scheduling on peak engagement hours",
        "Priority customer support",
      ],
    },
    is_popular: true,
    badge_text: "Most Popular",
    is_active: true,
  },
  {
    id: 3,
    plan_code: "enterprise",
    name: "Enterprise",
    description: "Unlimited scale and multi-location management for agencies.",
    price: 1999,
    price_usd: 19.99,
    currency: "INR",
    billing_interval: "monthly",
    max_brands: 15,
    max_campaigns_per_month: 150,
    features: {
      bullets: [
        "Unlimited AI posts & campaigns",
        "All 4 platforms + multi-location management",
        "Dedicated Google Maps 3-Pack optimization",
        "Custom brand voice & AI model tuning",
        "24/7 dedicated account manager",
      ],
    },
    is_popular: false,
    badge_text: "Best Value",
    is_active: true,
  },
];

export function PricingSection() {
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");
  const [plans, setPlans] = useState<SubscriptionPlan[]>(FALLBACK_PLANS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    const fetchLivePlans = async () => {
      try {
        const res = await fetch(`${apiUrl}/payments/plans?include_inactive=false`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && isMounted) {
            setPlans(data);
          }
        }
      } catch {
        // Keep fallback plans on connection failure
      }
    };

    fetchLivePlans();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatPrice = (plan: SubscriptionPlan) => {
    if (currency === "USD") {
      const p = plan.price_usd !== undefined && plan.price_usd !== null ? plan.price_usd : (plan.price === 0 ? 0 : Number((plan.price / 85).toFixed(2)));
      if (p === 0) return { main: "Free", sub: "(Forever)" };
      return { main: `$${p}`, sub: "per month" };
    } else {
      if (plan.price === 0) return { main: "Free", sub: "(Forever)" };
      return { main: `₹${plan.price.toLocaleString("en-IN")}`, sub: "per month" };
    }
  };

  return (
    <section id="pricing" className="bg-[#FAF9FF] py-20 lg:py-28 text-zinc-900 font-sans border-t border-purple-100/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className="text-center mx-auto max-w-4xl">
          <h2 className="text-2xl min-[480px]:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 whitespace-nowrap">
            Flexible Plans for Every User
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-500 font-normal">
            Start free, upgrade anytime. No hidden fees, cancel whenever.
          </p>

          {/* Currency Toggle */}
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center rounded-full bg-zinc-200/80 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`rounded-full px-4 py-1 text-xs font-bold transition-all ${
                  currency === "USD"
                    ? "bg-[#7C3AED] text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                USD ($)
              </button>
              <button
                type="button"
                onClick={() => setCurrency("INR")}
                className={`rounded-full px-4 py-1 text-xs font-bold transition-all ${
                  currency === "INR"
                    ? "bg-[#7C3AED] text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950"
                }`}
              >
                INR (₹)
              </button>
            </div>
          </div>
        </div>

        {/* DYNAMIC PRICING CARDS GRID */}
        <div className={`mt-14 grid gap-6 sm:gap-8 items-stretch ${
          plans.length === 1
            ? "grid-cols-1 max-w-md mx-auto"
            : plans.length === 2
            ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}>
          {plans.map((plan) => {
            const isPopular = Boolean(plan.is_popular);
            const { main: priceDisplay, sub: subDisplay } = formatPrice(plan);

            // Extract bullet points
            let bullets: string[] = [];
            if (plan.features && Array.isArray(plan.features.bullets)) {
              bullets = plan.features.bullets;
            } else if (Array.isArray(plan.features)) {
              bullets = plan.features;
            } else if (plan.features && typeof plan.features === "object") {
              bullets = Object.entries(plan.features)
                .filter(([k]) => k !== "bullets")
                .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`);
            }

            if (bullets.length === 0) {
              bullets = [
                `${plan.max_campaigns_per_month} AI campaigns per month`,
                `Manage up to ${plan.max_brands} brand profiles`,
                "Multi-channel auto publishing",
                "Dedicated customer support",
              ];
            }

            if (isPopular) {
              // HIGHLIGHTED / POPULAR CARD
              return (
                <div
                  key={plan.id}
                  className="rounded-3xl bg-gradient-to-b from-[#8B5CF6] via-[#7C3AED] to-[#6724E3] p-7 sm:p-9 text-white shadow-xl shadow-purple-600/30 flex flex-col justify-between relative transform lg:-translate-y-2 transition-all hover:shadow-2xl"
                >
                  <div>
                    {/* Header: Star Icon Badge + Title + Popular Tag */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white shadow-xs backdrop-blur-xs">
                          <Star className="h-4 w-4 fill-current" />
                        </div>
                        <h3 className="text-xl font-black text-white">{plan.name}</h3>
                      </div>

                      <span className="rounded-full bg-white px-3.5 py-1 text-xs font-bold text-[#7C3AED] shadow-sm">
                        {plan.badge_text || "Most Popular"}
                      </span>
                    </div>

                    {plan.description && (
                      <p className="mt-2 text-xs text-purple-100/80 font-normal line-clamp-2">
                        {plan.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                        {priceDisplay}
                      </span>
                      <span className="text-sm font-medium text-purple-100/90">
                        {subDisplay}
                      </span>
                    </div>

                    {/* Features List */}
                    <ul className="mt-8 space-y-4 text-sm text-white/95 font-medium">
                      {bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-white font-bold text-xs">
                            ✓
                          </span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <div className="mt-9">
                    <Link
                      href={`/signup?plan=${encodeURIComponent(plan.plan_code)}`}
                      className="block w-full rounded-full bg-white py-3.5 text-center text-sm font-extrabold text-[#7C3AED] shadow-md transition-all hover:bg-zinc-50 hover:shadow-lg hover:scale-[1.01]"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              );
            }

            // STANDARD CARD
            return (
              <div
                key={plan.id}
                className="rounded-3xl border border-purple-100/80 bg-white p-7 sm:p-9 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header: Star Icon Badge + Title */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8B5CF6] text-white shadow-sm">
                        <Star className="h-4 w-4 fill-current" />
                      </div>
                      <h3 className="text-xl font-black text-zinc-900">{plan.name}</h3>
                    </div>

                    {plan.badge_text && (
                      <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-0.5 text-xs font-semibold text-[#7C3AED]">
                        {plan.badge_text}
                      </span>
                    )}
                  </div>

                  {plan.description && (
                    <p className="mt-2 text-xs text-zinc-500 font-normal line-clamp-2">
                      {plan.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-zinc-950 tracking-tight">
                      {priceDisplay}
                    </span>
                    <span className="text-sm font-medium text-zinc-400">
                      {subDisplay}
                    </span>
                  </div>

                  {/* Features List */}
                  <ul className="mt-8 space-y-4 text-sm text-zinc-600 font-medium">
                    {bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[#7C3AED] font-bold text-xs">
                          ✓
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="mt-9">
                  <Link
                    href={`/signup?plan=${encodeURIComponent(plan.plan_code)}`}
                    className="block w-full rounded-full border-2 border-purple-300/80 bg-white py-3.5 text-center text-sm font-bold text-[#7C3AED] transition-all hover:border-[#7C3AED] hover:bg-purple-50/50 shadow-xs"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM PILL BUTTON */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/subscription"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#7C3AED] to-[#9333EA] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/25 transition-all hover:opacity-95 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.02]"
          >
            <span>Compare All Plans</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
