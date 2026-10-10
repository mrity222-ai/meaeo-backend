"use client";

import { Sparkles, Instagram, Facebook, Linkedin, MapPin, Search } from "lucide-react";

export function AIFlowDiagram() {
  return (
    <div className="relative mx-auto my-12 max-w-5xl overflow-hidden rounded-3xl border border-purple-100/80 bg-gradient-to-b from-[#110726] via-[#0D051E] to-[#14082D] p-6 sm:p-10 shadow-2xl text-white">
      
      {/* Background Ambient Glow Lights */}
      <div className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-purple-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-pink-600/25 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-10 -translate-x-1/2 h-40 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      {/* Header Badge */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-950/60 backdrop-blur-md px-4 py-1.5 text-xs font-bold text-purple-300 uppercase tracking-widest shadow-inner">
          <Sparkles className="h-3.5 w-3.5 text-purple-400 animate-pulse" />
          <span>Autonomous AI Multi-Platform Pipeline</span>
        </div>
      </div>

      {/* DIAGRAM CONTAINER */}
      <div className="relative mx-auto max-w-4xl py-6">
        
        {/* Desktop 3-Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* LEFT PLATFORMS (Instagram & Facebook) */}
          <div className="md:col-span-3 space-y-4">
            {/* Platform Card 1: Instagram & Facebook */}
            <div className="group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-purple-950/40 p-4 backdrop-blur-xl transition-all hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md">
                  <Instagram className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Instagram & FB</p>
                  <p className="text-[10px] text-purple-300">Images, Captions & Posts</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-400 border-t border-purple-900/50 pt-2">
                <span>Scheduled publishing</span>
                <span className="font-bold text-emerald-400">Connection required</span>
              </div>
            </div>

            {/* Platform Card 2: LinkedIn */}
            <div className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-blue-950/30 p-4 backdrop-blur-xl transition-all hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                  <Linkedin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">LinkedIn</p>
                  <p className="text-[10px] text-blue-300">B2B & Thought Leadership</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-400 border-t border-blue-900/50 pt-2">
                <span>Scheduled publishing</span>
                <span className="font-bold text-emerald-400">Connection required</span>
              </div>
            </div>
          </div>

          {/* CENTER AI CORE HUB */}
          <div className="md:col-span-6 text-center my-6 md:my-0">
            <div className="relative inline-flex flex-col items-center">
              
              {/* Outer Pulsing Aura Ring */}
              <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 opacity-40 blur-xl animate-pulse" />
              
              {/* Main Core Button */}
              <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full border-2 border-purple-300/40 bg-gradient-to-b from-[#3B07B4] via-[#6929E8] to-[#9D25D9] shadow-2xl shadow-purple-600/50 transition-transform duration-500 hover:scale-105">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                  <Sparkles className="h-7 w-7 text-yellow-300 animate-spin-slow" />
                </div>
                <span className="mt-2 text-sm font-black tracking-tight text-white leading-none">
                  maeaco AI
                </span>
                <span className="text-[9px] font-bold text-purple-200 uppercase tracking-widest mt-1">
                  Core Engine
                </span>
              </div>

              {/* Status Badge */}
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-purple-950/80 border border-purple-400/40 px-3 py-1 text-[11px] font-semibold text-purple-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>24/7 Plans, creates and schedules</span>
              </div>

            </div>
          </div>

          {/* RIGHT PLATFORMS (Google Business Profile & Google Search/Maps) */}
          <div className="md:col-span-3 space-y-4">
            {/* Platform Card 3: Google Business Profile */}
            <div className="group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 backdrop-blur-xl transition-all hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 text-white shadow-md">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Google Profile</p>
                  <p className="text-[10px] text-amber-300">Daily Offers & AI Reviews</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-400 border-t border-amber-900/50 pt-2">
                <span>Review management</span>
                <span className="font-bold text-emerald-400">Connection required</span>
              </div>
            </div>

            {/* Platform Card 4: Google Search & Maps */}
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 backdrop-blur-xl transition-all hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
                  <Search className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Google Search & Maps</p>
                  <p className="text-[10px] text-emerald-300">Local SEO & Keyword Ranking</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] text-zinc-400 border-t border-emerald-900/50 pt-2">
                <span>Local profile metrics</span>
                <span className="font-bold text-emerald-400">Connection required</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
