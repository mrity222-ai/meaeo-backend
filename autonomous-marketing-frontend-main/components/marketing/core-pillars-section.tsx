"use client";

import {
  Swords,
  Search,
  Palette,
  Star,
  TrendingUp,
  Sparkles,
  Share2,
  BarChart3,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const pillars = [
  {
    icon: Swords,
    badge: "AI Competitor Intelligence",
    title: "Research Your Market and Competitors",
    description:
      "Use available research providers and your business context to inform campaign topics and captions.",
    gradient: "from-amber-500 to-red-500",
    bgLight: "bg-amber-50/70 border-amber-200/80 text-amber-900",
    badgeColor: "bg-amber-100 text-amber-800",
  },
  {
    icon: Search,
    badge: "Local SEO & GMB Optimization",
    title: "Keep Your Google Business Profile Active",
    description:
      "Keeps your Google Business Profile updated daily with local offers, targets high-intent keywords, and drives organic foot traffic and calls from nearby customers.",
    gradient: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50/70 border-emerald-200/80 text-emerald-900",
    badgeColor: "bg-emerald-100 text-emerald-800",
  },
  {
    icon: Palette,
    badge: "Daily Branded Post Design",
    title: "Automated Daily Graphics with Your Logo",
    description:
      "Every single day, AI designs fresh, studio-quality promotional graphics complete with your logo, brand colors, phone number, and address banner.",
    gradient: "from-purple-600 to-pink-500",
    bgLight: "bg-purple-50/70 border-purple-200/80 text-purple-900",
    badgeColor: "bg-purple-100 text-purple-800",
  },
  {
    icon: Star,
    badge: "24/7 GMB Review Auto-Responder",
    title: "Instant Smart Replies to Google Reviews",
    description:
      "Monitors customer reviews on Google Maps and Search 24/7, preparing professional replies using your brand voice and configured review settings.",
    gradient: "from-blue-600 to-indigo-600",
    bgLight: "bg-blue-50/70 border-blue-200/80 text-blue-900",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  {
    icon: BarChart3,
    badge: "Analytics-Driven Post Evolution",
    title: "Review Performance for Your Next Campaign",
    description:
      "Review available likes, clicks, reach and profile metrics after analytics sync. Use this information to inform your next campaign.",
    gradient: "from-indigo-600 to-purple-600",
    bgLight: "bg-indigo-50/70 border-indigo-200/80 text-indigo-900",
    badgeColor: "bg-indigo-100 text-indigo-800",
  },
  {
    icon: TrendingUp,
    badge: "Organic Local Reach Booster",
    title: "Support Your Organic Presence",
    description:
      "Build a consistent presence with useful posts and local offers across your connected channels. Reach depends on your audience and content.",
    gradient: "from-teal-600 to-emerald-600",
    bgLight: "bg-teal-50/70 border-teal-200/80 text-teal-900",
    badgeColor: "bg-teal-100 text-teal-800",
  },
  {
    icon: Share2,
    badge: "360° Multi-Channel Branding",
    title: "Consistent Presence Across All Platforms",
    description:
      "Maintains one unified brand identity across Instagram, Facebook, LinkedIn, and Google Profile with synchronized daily publishing.",
    gradient: "from-pink-600 to-purple-600",
    bgLight: "bg-pink-50/70 border-pink-200/80 text-pink-900",
    badgeColor: "bg-pink-100 text-pink-800",
  },
];

export function CorePillarsSection() {
  return (
    <section className="bg-white py-20 lg:py-28 text-zinc-900 border-t border-purple-100/70 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className="marketing-section-intro marketing-section-spaced">
          <div className="marketing-eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            <span>The Core Engines of maeaco AI</span>
          </div>
          <h2 className="marketing-section-title">
            The 7 Core Pillars of Autonomous Growth
          </h2>
          <p className="mt-4 text-base text-zinc-600 sm:text-lg">
            Built to boost your organic local SEO, analyze competitors, design daily branded graphics, and auto-respond to reviews 24/7.
          </p>
        </div>

        {/* 7 PILLARS GRID */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.badge}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${pillar.bgLight}`}
              >
                <div>
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${pillar.badgeColor}`}
                    >
                      {pillar.badge}
                    </span>
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr ${pillar.gradient} text-white shadow-md transition-transform group-hover:scale-110`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold tracking-tight text-zinc-950 leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm text-zinc-600 leading-relaxed font-normal">
                    {pillar.description}
                  </p>
                </div>

                {/* Footer Checkmark */}
                <div className="mt-6 flex items-center gap-2 border-t border-zinc-200/60 pt-4 text-xs font-bold text-zinc-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>AI-assisted workflow</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTTOM CTA BANNER */}
        <div className="mt-16 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#6929E8] via-[#8527D6] to-[#D925A3] px-9 py-4 text-base font-bold text-white shadow-xl shadow-purple-600/30 transition-all hover:scale-105 hover:shadow-purple-600/50"
          >
            <span>Start Boosting My Business Today</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

      </div>
    </section>
  );
}
