"use client";

import {
  Calendar,
  Camera,
  MapPin,
  Video,
  MessageSquare,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  Sparkles,
  Star,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { AIFlowDiagram } from "./ai-flow-diagram";

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#FAF8FF] py-20 lg:py-28 text-zinc-900 border-t border-purple-100/70 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* SECTION HEADER */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-100/80 px-4 py-1.5 text-xs font-bold text-purple-700 uppercase tracking-widest mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous AI Workforce</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
            Everything your business needs to grow online.
          </h2>
          <p className="mt-4 text-base text-zinc-600 sm:text-lg">
            Replaces expensive social media managers & SEO agencies. One autonomous AI team that creates, designs, posts, and boosts your local SEO 24/7.
          </p>
        </div>

        {/* CENTRAL AI MULTI-PLATFORM FLOW DIAGRAM */}
        <AIFlowDiagram />

        {/* BENTO GRID FEATURE SHOWCASE */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-12">
          
          {/* Bento Card 1: It posts. (Spans 7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between overflow-hidden rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700 font-bold">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-zinc-950">
                  It posts.
                </h3>
              </div>
              <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                A full month of posts pre-scheduled and published automatically across Instagram, Facebook, LinkedIn & Google—whether you opened the app or not.
              </p>
            </div>

            {/* Calendar Post Mockup Grid */}
            <div className="mt-6 grid grid-cols-4 gap-2 bg-[#FAF9FF] p-3 rounded-2xl border border-purple-100">
              <div className="aspect-square rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-2 text-white text-[10px] font-bold flex flex-col justify-between shadow-sm">
                <span>MON</span>
                <span>Day 01</span>
              </div>
              <div className="aspect-square rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 p-2 text-white text-[10px] font-bold flex flex-col justify-between shadow-sm">
                <span>TUE</span>
                <span>Day 02</span>
              </div>
              <div className="aspect-square rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-2 text-white text-[10px] font-bold flex flex-col justify-between shadow-sm">
                <span>WED</span>
                <span>Day 03</span>
              </div>
              <div className="aspect-square rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-2 text-white text-[10px] font-bold flex flex-col justify-between shadow-sm">
                <span>THU</span>
                <span>Day 04</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: It shoots. (Spans 5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between overflow-hidden rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-700 font-bold">
                  <Camera className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-zinc-950">
                  It shoots.
                </h3>
              </div>
              <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                Studio-grade photoshoots from a phone photo. No studio, no expensive shoot day—complete with your logo and contact details overlay.
              </p>
            </div>

            <div className="mt-6 relative aspect-video overflow-hidden rounded-2xl bg-zinc-900 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80"
                alt="AI Shoot"
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 left-2 rounded-lg bg-black/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-white/20">
                AI Studio Rendered
              </div>
            </div>
          </div>

          {/* Bento Card 3: It gets you found. (Spans 5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between overflow-hidden rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-bold">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-zinc-950">
                  It gets you found.
                </h3>
              </div>
              <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                Replaces manual SEO agencies. Keeps your Google Business Profile tuned, posts daily local offers, and ranks your business #1 on Google Search and Maps.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950">
                  Google Maps Ranking
                </span>
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  Rank #1 Local
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-emerald-800">
                ⭐ 4.9 (210+ Reviews) • Always Open • Auto-Updated Daily
              </p>
            </div>
          </div>

          {/* Bento Card 4: It makes Reels. (Spans 7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between overflow-hidden rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold">
                  <Video className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-zinc-950">
                  It makes Reels.
                </h3>
              </div>
              <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                Ultra-realistic 9:16 vertical video reels in Hindi, English, and regional Indian languages with AI voiceovers, trending captions & music.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-4 bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm font-bold text-xs">
                9:16
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950">
                  Auto-Generated Viral Video Reel
                </p>
                <p className="text-[11px] text-indigo-700 mt-0.5">
                  Voiceover, Captions & Subtitles Included
                </p>
              </div>
            </div>
          </div>

          {/* Bento Card 5: It answers & protects reputation. (Spans 12 cols) */}
          <div className="md:col-span-12 flex flex-col justify-between overflow-hidden rounded-3xl border border-purple-100 bg-white p-6 sm:p-8 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              <div className="md:col-span-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 font-bold">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-zinc-950">
                    It protects your reputation.
                  </h3>
                </div>
                <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                  Reviews monitored and replied to across Google, Instagram, and Facebook 24/7. Responds in seconds in your brand tone with accurate business prices.
                </p>
              </div>

              {/* Chat Reply Mockup */}
              <div className="md:col-span-6 rounded-2xl border border-amber-200 bg-[#FFFDF5] p-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-[10px]">
                    G
                  </div>
                  <span className="font-bold text-zinc-900">Google Reviewer</span>
                  <div className="flex text-amber-400">
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                    <Star className="h-3 w-3 fill-current" />
                  </div>
                </div>
                <p className="mt-2 text-zinc-600 font-medium">
                  "Amazing food and fast delivery! Highly recommended."
                </p>

                <div className="mt-3 border-t border-amber-200/80 pt-2 text-[11px] text-amber-900 font-semibold flex items-center justify-between">
                  <span>⚡ Responded in 2 seconds by maeaco AI:</span>
                  <span className="text-emerald-700 font-bold">Auto-Posted</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* COMPARISON BANNER: Traditional Agency vs. maeaco AI */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-purple-200 bg-gradient-to-r from-purple-900 via-indigo-950 to-zinc-950 p-8 text-white shadow-xl">
          <div className="mx-auto max-w-4xl text-center">
            <h3 className="text-2xl font-black sm:text-3xl text-white tracking-tight">
              Why pay ₹40,000/month to freelancers & agencies?
            </h3>
            <p className="mt-2 text-sm text-purple-200">
              maeaco AI does 10x more work at a fraction of the cost, 24 hours a day.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 text-left">
              {/* Traditional Agency */}
              <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <XCircle className="h-5 w-5 shrink-0" />
                  <span>Traditional Agency / Freelancer</span>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-zinc-300">
                  <li>• Costs ₹30,000 – ₹50,000 / month</li>
                  <li>• Slow turnaround (takes days to post)</li>
                  <li>• Missed post deadlines & manual errors</li>
                  <li>• No 24/7 Google Review Auto-Responder</li>
                </ul>
              </div>

              {/* maeaco AI Team */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span>maeaco Autonomous AI Team</span>
                </div>
                <ul className="mt-3 space-y-2 text-xs text-purple-200">
                  <li>• Starts at ₹499 / month</li>
                  <li>• Instant execution in 5 seconds</li>
                  <li>• 100% on-brand auto-scheduling & posting</li>
                  <li>• 24/7 Google Review & Local SEO Auto-Engine</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
              >
                <span>Replace My Marketing Agency Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
