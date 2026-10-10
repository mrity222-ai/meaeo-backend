"use client";

import { useState } from "react";
import { Sparkles, CheckCircle2, Instagram, Heart, MessageCircle, Share2 } from "lucide-react";

const samples = [
  {
    id: "restaurant",
    niche: "Restaurant & Cafe",
    brandName: "XYZ Gourmet Bistro",
    caption:
      "🍕 Weekend Feast Special! Enjoy 30% OFF on our authentic Wood-Fired Artisanal Pizzas today. Made fresh with imported mozzarella & organic basil. Offer valid till 10 PM!",
    hashtags: "#WoodFiredPizza #FoodieDelhi #XYZBistro #WeekendDeals #GourmetFood",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    time: "Today, 6:30 PM (Peak Engagement)",
  },
  {
    id: "fashion",
    niche: "Fashion & Lifestyle",
    brandName: "Aura Luxury Apparel",
    caption:
      "✨ Upgrade your wardrobe with our all-new Autumn Silk Collection. Elegant, breathable & handcrafted for fashion enthusiasts. Free Express Shipping worldwide! 🛍️",
    hashtags: "#AuraFashion #AutumnCollection #SilkSarees #LuxuryApparel #OOTD",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
    time: "Today, 7:15 PM (Peak Engagement)",
  },
  {
    id: "fitness",
    niche: "Fitness & Wellness",
    brandName: "Iron Pulse Gym",
    caption:
      "💪 Transform your body this month! Join Iron Pulse Gym and get 2 Personal Training Sessions FREE with any 6-Month Membership. Claim your free pass today!",
    hashtags: "#IronPulse #GymMotivation #FitnessGoal #Transformation #PersonalTrainer",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    time: "Today, 8:00 AM (Peak Engagement)",
  },
  {
    id: "realestate",
    niche: "Real Estate & Homes",
    brandName: "Skyline Properties",
    caption:
      "🏡 Luxury 3BHK Smart Apartments starting at ₹85 Lakhs! Includes private balcony, clubhouse access & 24/7 security. Schedule a private site visit today.",
    hashtags: "#SkylineProperties #SmartHomes #RealEstateIndia #LuxuryLiving #DreamHome",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    time: "Today, 5:00 PM (Peak Engagement)",
  },
];

export function AIPreviewSection() {
  const [selectedId, setSelectedId] = useState("restaurant");
  const activeSample = samples.find((s) => s.id === selectedId) || samples[0];

  return (
    <section id="demo" className="bg-white py-20 lg:py-28 text-zinc-900 border-t border-purple-100/70">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="marketing-section-intro marketing-section-spaced">
          <div className="marketing-eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Interactive Sample Preview</span>
          </div>
          <h2 className="marketing-section-title">
            See how maeaco creates AI posts for your business
          </h2>
          <p className="mt-3 text-base text-zinc-500 font-normal">
            Explore illustrative captions, branding and schedules. These are static samples with stock images; no live generation or publishing occurs here.
          </p>
        </div>

        {/* Category Selector Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {samples.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={selectedId === s.id}
              onClick={() => setSelectedId(s.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                selectedId === s.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25 scale-105"
                  : "bg-purple-50 text-zinc-700 hover:bg-purple-100"
              }`}
            >
              {s.niche}
            </button>
          ))}
        </div>

        {/* Live Card Showcase Grid */}
        <div key={selectedId} className="marketing-crossfade mx-auto max-w-4xl overflow-hidden rounded-3xl border border-purple-100 bg-[#FAF9FF] p-6 sm:p-10 shadow-xl lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center">
          
          {/* Left Column: Instagram Preview Mockup */}
          <div className="lg:col-span-6 mb-8 lg:mb-0">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-md">
              {/* Header bar */}
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-xs font-bold text-white">
                    {activeSample.brandName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900 leading-none">
                      {activeSample.brandName}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Sample post • Stock image</p>
                  </div>
                </div>
                <Instagram className="h-4 w-4 text-zinc-400" />
              </div>

              {/* Image Container with Brand Overlay */}
              <div className="relative aspect-square w-full overflow-hidden bg-zinc-100">
                <img
                  loading="lazy"
                  decoding="async"
                  src={activeSample.image}
                  alt={activeSample.brandName}
                  className="h-full w-full object-cover"
                />

                {/* Top Corner Logo Overlay */}
                <div className="absolute top-3 left-3 rounded-lg bg-black/70 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold text-white border border-white/20 shadow-lg">
                  {activeSample.brandName}
                </div>

                {/* Bottom Footer Branding Strip */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 text-white">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Special Offer
                  </p>
                  <p className="text-[11px] font-medium text-zinc-200">
                    📞 Call & Order | 📍 Main Market Branch
                  </p>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2 text-zinc-700">
                <div className="flex items-center gap-4">
                  <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  <MessageCircle className="h-5 w-5" />
                  <Share2 className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-semibold text-purple-600">
                  Publishing preview
                </span>
              </div>

              {/* Caption */}
              <div className="px-4 pb-4">
                <p className="text-xs text-zinc-800 line-clamp-3 leading-relaxed">
                  <span className="font-bold mr-1">{activeSample.brandName}:</span>
                  {activeSample.caption}
                </p>
                <p className="mt-1 text-[11px] font-medium text-purple-600">
                  {activeSample.hashtags}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: AI Highlights & Features */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Illustrative content sample</span>
            </div>

            <h3 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              A preview of your branded content
            </h3>

            <div className="space-y-3.5 text-sm text-zinc-600">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                  1
                </div>
                <p>
                  <strong className="text-zinc-900">Brand Logo & Overlay:</strong> Automatically places your logo and phone/address in the bottom banner.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                  2
                </div>
                <p>
                  <strong className="text-zinc-900">High-Converting Caption:</strong> Written specifically for {activeSample.niche} with hashtags & call-to-action.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                  3
                </div>
                <p>
                  <strong className="text-zinc-900">Smart Peak Hour Time:</strong> Example schedule: <span className="font-bold text-purple-700">{activeSample.time}</span>.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
