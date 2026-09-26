"use client";

import Link from "next/link";
import {
  ArrowRight,
  Play,
  Pencil,
  BarChart3,
  Calendar as CalendarIcon,
  ChevronDown,
  Search,
  Bell,
  Heart,
  TrendingUp,
  ShoppingBag,
  LayoutDashboard,
  Megaphone,
  FileText,
  Share2,
  Bookmark,
  Settings,
  ChevronLeft,
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-10 pb-20 lg:pt-14 lg:pb-28">
      {/* Ambient Fluid Purple / Lavender Glow Blobs */}
      <div className="pointer-events-none absolute -left-32 top-10 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-purple-200/50 via-pink-100/35 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-12 h-[550px] w-[550px] rounded-full bg-gradient-to-bl from-purple-300/40 via-indigo-100/30 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 bottom-0 h-[480px] w-[950px] -translate-x-1/2 rounded-full bg-gradient-to-t from-purple-200/40 via-fuchsia-100/25 to-transparent blur-3xl" />

      {/* Floating Sparkle Stars */}
      <div className="pointer-events-none absolute left-[12%] top-24 select-none text-purple-400/80 text-xl font-bold">
        ✦
      </div>
      <div className="pointer-events-none absolute left-[7%] top-[52%] select-none text-purple-400/80 text-lg font-bold">
        ✦
      </div>
      <div className="pointer-events-none absolute right-[15%] top-28 select-none text-purple-400/80 text-lg font-bold">
        ✦
      </div>
      <div className="pointer-events-none absolute right-[11%] top-[56%] select-none text-purple-400/80 text-2xl font-bold">
        ✦
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* HERO HEADER: Headline, Subtitle, Buttons, App Store Badges */}
        {/* ========================================================================= */}
        <div className="mx-auto max-w-4xl text-center">
          
          {/* Main Headline (Strictly 2 lines) */}
          <h1 className="tracking-tight text-center">
            <span className="block text-[26px] min-[420px]:text-3xl sm:text-5xl md:text-6xl lg:text-[70px] font-black text-zinc-950 leading-tight sm:leading-[1.1] whitespace-nowrap">
              Manage Your Marketing
            </span>
            <span className="mt-1 sm:mt-2 block text-[26px] min-[420px]:text-3xl sm:text-5xl md:text-6xl lg:text-[70px] font-black leading-tight sm:leading-[1.1] bg-gradient-to-r from-[#3B07B4] via-[#7B2CBF] to-[#D925A3] bg-clip-text text-transparent whitespace-nowrap">
              Anywhere, Automatically.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg font-normal text-zinc-600 leading-relaxed">
            Create branded posts, schedule campaigns, publish across social platforms,
            and track growth from one web and mobile app.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#6929E8] via-[#8527D6] to-[#D925A3] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:opacity-95 hover:shadow-purple-600/45 hover:scale-[1.02]"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href="#demo"
              className="inline-flex items-center gap-2.5 rounded-full border border-zinc-200/90 bg-white px-7 py-3.5 text-base font-semibold text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6929E8] text-white shadow-sm">
                <Play className="h-3 w-3 fill-current ml-0.5" />
              </div>
              <span>Watch Demo</span>
            </a>
          </div>

          {/* App Store Badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
            {/* Apple App Store */}
            <a
              href="#app-store"
              className="inline-flex items-center gap-2.5 rounded-xl bg-black px-4 py-2 text-white shadow-md transition-all hover:opacity-90 hover:scale-[1.02]"
            >
              {/* Apple SVG */}
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.62-.76 1.05-1.82.93-2.88-.93.04-2.06.62-2.71 1.38-.57.65-.99 1.73-.85 2.76 1.04.08 2-.6 2.63-1.26z" />
              </svg>
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider text-zinc-300 font-medium leading-none">
                  Download on the
                </div>
                <div className="text-sm font-bold leading-tight text-white font-sans">
                  App Store
                </div>
              </div>
            </a>

            {/* Google Play Store */}
            <a
              href="#google-play"
              className="inline-flex items-center gap-2.5 rounded-xl bg-black px-4 py-2 text-white shadow-md transition-all hover:opacity-90 hover:scale-[1.02]"
            >
              {/* Google Play SVG */}
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M3.6 1.8L13.8 12 3.6 22.2c-.4-.4-.6-1-.6-1.7V3.5c0-.7.2-1.3.6-1.7z"
                />
                <path
                  fill="#FBBC04"
                  d="M17.2 8.6L13.8 12l3.4 3.4 3.8-2.2c1.1-.6 1.1-1.7 0-2.4l-3.8-2.2z"
                />
                <path
                  fill="#34A853"
                  d="M3.6 22.2l10.2-10.2 3.4 3.4-11.4 6.5c-.8.5-1.7.5-2.2.3z"
                />
                <path
                  fill="#4285F4"
                  d="M3.6 1.8c.5-.3 1.4-.2 2.2.3l11.4 6.5-3.4 3.4L3.6 1.8z"
                />
              </svg>
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-wider text-zinc-300 font-medium leading-none">
                  GET IT ON
                </div>
                <div className="text-sm font-bold leading-tight text-white font-sans">
                  Google Play
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTERPIECE: LAPTOP + SMARTPHONE + FLOATING CARDS & ARROWS */}
        {/* ========================================================================= */}
        <div className="relative mt-12 sm:mt-16 pb-6">

          {/* ------------------------------------------------------------- */}
          {/* FLOATING CARD 1: TOP-LEFT ("Create branded content") */}
          {/* ------------------------------------------------------------- */}
          <div className="absolute -left-2 top-8 z-30 hidden md:flex flex-col items-end">
            <div className="flex items-center gap-3 rounded-2xl border border-purple-100/90 bg-white/95 px-4 py-3 shadow-xl shadow-purple-500/10 backdrop-blur-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <Pencil className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-zinc-950 leading-tight">Create</p>
                <p className="text-xs font-medium text-zinc-600 leading-tight">branded content</p>
              </div>
            </div>

            {/* Curved Directional Arrow to Laptop */}
            <svg
              className="mt-1 mr-6 h-12 w-16 text-purple-600"
              viewBox="0 0 60 45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 5 C 10 25, 45 15, 48 36" />
              <path d="M40 34 L 49 37 L 50 27" fill="currentColor" stroke="none" />
            </svg>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* FLOATING CARD 2: BOTTOM-LEFT ("Track growth") */}
          {/* ------------------------------------------------------------- */}
          <div className="absolute -left-4 bottom-14 z-30 hidden md:flex items-center gap-3 rounded-2xl border border-purple-100/90 bg-white/95 px-4 py-3 shadow-xl shadow-purple-500/10 backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-zinc-950 leading-tight">Track</p>
              <p className="text-xs font-medium text-zinc-600 leading-tight">growth</p>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* FLOATING CARD 3: TOP-RIGHT ("Schedule across platforms") */}
          {/* ------------------------------------------------------------- */}
          <div className="absolute right-6 top-8 z-30 hidden lg:flex flex-col items-start">
            <div className="flex items-center gap-3 rounded-2xl border border-purple-100/90 bg-white/95 px-4 py-3 shadow-xl shadow-purple-500/10 backdrop-blur-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-zinc-950 leading-tight">Schedule</p>
                <p className="text-xs font-medium text-zinc-600 leading-tight">across platforms</p>
              </div>
            </div>

            {/* Curved Directional Arrow pointing down to Phone */}
            <svg
              className="mt-1 ml-4 h-12 w-16 text-purple-600"
              viewBox="0 0 60 45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M45 5 C 45 25, 20 20, 16 38" />
              <path d="M22 36 L 15 39 L 12 30" fill="currentColor" stroke="none" />
            </svg>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* FLOATING CARD 4: FAR-RIGHT SOCIAL MEDIA ICONS STACK */}
          {/* ------------------------------------------------------------- */}
          <div className="absolute -right-2 top-48 z-30 hidden lg:flex flex-col items-center gap-2.5">
            {/* Instagram */}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white shadow-lg transition-transform hover:scale-110">
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>

            {/* Facebook */}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1877F2] text-white shadow-lg transition-transform hover:scale-110">
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>

            {/* LinkedIn */}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A66C2] text-white shadow-lg transition-transform hover:scale-110">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </div>

            {/* Google */}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-zinc-200/90 text-white shadow-lg transition-transform hover:scale-110">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>

            {/* Curved Directional Arrow pointing down to phone */}
            <svg
              className="mt-2 -ml-6 h-12 w-14 text-purple-600"
              viewBox="0 0 60 45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M50 5 C 50 25, 20 25, 14 36" />
              <path d="M22 34 L 13 37 L 11 27" fill="currentColor" stroke="none" />
            </svg>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* THE DUAL DEVICES WRAPPER: LAPTOP (LEFT) + PHONE (RIGHT) */}
          {/* ------------------------------------------------------------- */}
          <div className="relative mx-auto flex max-w-6xl items-end justify-center">

            {/* ========================================================= */}
            {/* LAPTOP MOCKUP */}
            {/* ========================================================= */}
            <div className="relative w-full max-w-[850px] shrink-0">
              
              {/* Laptop Screen Bezel */}
              <div className="relative rounded-[22px] border-[10px] border-zinc-900 bg-zinc-900 p-1 shadow-2xl shadow-purple-950/20 ring-1 ring-zinc-700/50">
                
                {/* Laptop Camera Dot */}
                <div className="absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />

                {/* Screen Content: maeaco Dashboard */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[14px] bg-[#F8F9FD] text-zinc-900 select-none">
                  
                  <div className="flex h-full w-full">
                    {/* Sidebar */}
                    <div className="hidden sm:flex w-44 shrink-0 flex-col justify-between border-r border-zinc-200/80 bg-white p-3">
                      <div>
                        {/* Logo */}
                        <div className="flex items-center gap-2 px-1 mb-4">
                          <img
                            src="/logo/app logo.png"
                            alt="Logo"
                            className="h-6 w-6 object-contain"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-black tracking-tight leading-none text-zinc-950">
                              maeaco
                            </span>
                            <span className="text-[9px] font-medium text-zinc-400">
                              AI Platform
                            </span>
                          </div>
                        </div>

                        {/* Nav Items */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#6929E8] to-[#8E2DE2] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-purple-500/20">
                            <LayoutDashboard className="h-3.5 w-3.5" />
                            <span>Dashboard</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                            <Megaphone className="h-3.5 w-3.5" />
                            <span>Campaigns</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                            <FileText className="h-3.5 w-3.5" />
                            <span>Content</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            <span>Calendar</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span>Analytics</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                            <Share2 className="h-3.5 w-3.5" />
                            <span>Connections</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                            <Bookmark className="h-3.5 w-3.5" />
                            <span>Brand</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900">
                            <Settings className="h-3.5 w-3.5" />
                            <span>Settings</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Main Workspace Area */}
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8F9FD]">
                      
                      {/* Top Search & Profile Bar */}
                      <div className="flex items-center justify-between border-b border-zinc-200/80 bg-white px-3 sm:px-4 py-2">
                        <div className="relative w-48 sm:w-64">
                          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
                          <input
                            type="text"
                            readOnly
                            placeholder="Search campaigns, posts, or insights..."
                            className="h-7 w-full rounded-lg bg-zinc-50 pl-8 pr-2 text-[10px] text-zinc-700 outline-none border border-zinc-200/60"
                          />
                        </div>

                        <div className="flex items-center gap-2.5">
                          <div className="relative flex h-6 w-6 items-center justify-center text-zinc-500 hover:text-zinc-800">
                            <Bell className="h-3.5 w-3.5" />
                            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500 ring-1 ring-white" />
                          </div>

                          <div className="h-6 w-6 rounded-full overflow-hidden bg-purple-200 border border-purple-300">
                            <img
                              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                              alt="Avatar"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dashboard Content */}
                      <div className="flex-1 p-3 sm:p-4 overflow-hidden flex flex-col justify-between">
                        
                        {/* Welcome Greeting Row */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-xs sm:text-sm font-bold text-zinc-950 flex items-center gap-1.5">
                              Good morning! 👋
                            </h2>
                            <p className="text-[10px] text-zinc-500 font-normal">
                              Your marketing team is on track. Here's your overview.
                            </p>
                          </div>

                          <button
                            type="button"
                            className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10px] font-medium text-zinc-700 shadow-sm"
                          >
                            <span>Last 30 days</span>
                            <ChevronDown className="h-3 w-3 text-zinc-500" />
                          </button>
                        </div>

                        {/* 4 Metric Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2">
                          {/* Card 1 */}
                          <div className="rounded-xl border border-zinc-200/70 bg-white p-2 sm:p-2.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-medium text-zinc-500">Total Posts</span>
                              <CalendarIcon className="h-3 w-3 text-purple-600" />
                            </div>
                            <div className="mt-1 flex items-baseline justify-between">
                              <span className="text-sm sm:text-base font-extrabold text-zinc-950">48</span>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                                ↗ +23%
                              </span>
                            </div>
                          </div>

                          {/* Card 2 */}
                          <div className="rounded-xl border border-zinc-200/70 bg-white p-2 sm:p-2.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-medium text-zinc-500">Engagement</span>
                              <Heart className="h-3 w-3 text-purple-600" />
                            </div>
                            <div className="mt-1 flex items-baseline justify-between">
                              <span className="text-sm sm:text-base font-extrabold text-zinc-950">12.4K</span>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                                ↗ +82%
                              </span>
                            </div>
                          </div>

                          {/* Card 3 */}
                          <div className="rounded-xl border border-zinc-200/70 bg-white p-2 sm:p-2.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-medium text-zinc-500">Reach</span>
                              <TrendingUp className="h-3 w-3 text-purple-600" />
                            </div>
                            <div className="mt-1 flex items-baseline justify-between">
                              <span className="text-sm sm:text-base font-extrabold text-zinc-950">284K</span>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                                ↗ +41%
                              </span>
                            </div>
                          </div>

                          {/* Card 4 */}
                          <div className="rounded-xl border border-zinc-200/70 bg-white p-2 sm:p-2.5 shadow-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-medium text-zinc-500">Conversions</span>
                              <ShoppingBag className="h-3 w-3 text-purple-600" />
                            </div>
                            <div className="mt-1 flex items-baseline justify-between">
                              <span className="text-sm sm:text-base font-extrabold text-zinc-950">1.2K</span>
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                                ↗ +67%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Lower Split: Upcoming Posts & Calendar / Performance */}
                        <div className="grid grid-cols-12 gap-2 sm:gap-3">
                          
                          {/* Left Column: Upcoming Posts */}
                          <div className="col-span-12 sm:col-span-7 rounded-xl border border-zinc-200/70 bg-white p-2 sm:p-2.5 shadow-sm">
                            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100">
                              <span className="text-[11px] font-bold text-zinc-950">Upcoming Posts</span>
                              <span className="text-[9px] font-semibold text-purple-600 flex items-center">
                                View Calendar ↗
                              </span>
                            </div>

                            <div className="mt-1.5 space-y-1.5">
                              {/* Post Item 1 */}
                              <div className="flex items-center justify-between rounded-lg bg-zinc-50/80 p-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-6 w-6 shrink-0 rounded bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white">
                                    <span className="text-[8px] font-black">IG</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[10px] font-semibold text-zinc-900 leading-tight">
                                      How to choose the perfect workspace setup
                                    </p>
                                    <p className="text-[8px] text-zinc-500 leading-tight">
                                      Instagram • Tomorrow 10:00 AM
                                    </p>
                                  </div>
                                </div>
                                <span className="shrink-0 rounded bg-purple-100 px-1.5 py-0.5 text-[8px] font-semibold text-purple-700">
                                  Scheduled
                                </span>
                              </div>

                              {/* Post Item 2 */}
                              <div className="flex items-center justify-between rounded-lg bg-zinc-50/80 p-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-6 w-6 shrink-0 rounded bg-[#1877F2] flex items-center justify-center text-white">
                                    <span className="text-[8px] font-black">FB</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[10px] font-semibold text-zinc-900 leading-tight">
                                      5 tips for better home office productivity
                                    </p>
                                    <p className="text-[8px] text-zinc-500 leading-tight">
                                      Facebook • Tomorrow 2:30 PM
                                    </p>
                                  </div>
                                </div>
                                <span className="shrink-0 rounded bg-purple-100 px-1.5 py-0.5 text-[8px] font-semibold text-purple-700">
                                  Scheduled
                                </span>
                              </div>

                              {/* Post Item 3 */}
                              <div className="flex items-center justify-between rounded-lg bg-zinc-50/80 p-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="h-6 w-6 shrink-0 rounded bg-[#0A66C2] flex items-center justify-center text-white">
                                    <span className="text-[8px] font-black">IN</span>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-[10px] font-semibold text-zinc-900 leading-tight">
                                      Behind the scenes at our team
                                    </p>
                                    <p className="text-[8px] text-zinc-500 leading-tight">
                                      LinkedIn • Oct 12, 11:00 AM
                                    </p>
                                  </div>
                                </div>
                                <span className="shrink-0 rounded bg-purple-100 px-1.5 py-0.5 text-[8px] font-semibold text-purple-700">
                                  Scheduled
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Calendar & Platform Performance */}
                          <div className="hidden sm:flex col-span-5 flex-col gap-2">
                            {/* Content Calendar Widget */}
                            <div className="rounded-xl border border-zinc-200/70 bg-white p-2 shadow-sm">
                              <div className="flex items-center justify-between pb-1 border-b border-zinc-100 text-[10px] font-bold text-zinc-950">
                                <span>Content Calendar</span>
                                <span className="text-zinc-500 font-normal">October 2024</span>
                              </div>
                              <div className="mt-1 grid grid-cols-7 gap-0.5 text-center text-[8px] font-medium text-zinc-400">
                                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                                <span className="py-0.5">1</span><span className="py-0.5">2</span><span className="py-0.5">3</span><span className="py-0.5">4</span><span className="py-0.5">5</span><span className="py-0.5">6</span><span className="py-0.5">7</span>
                                <span className="py-0.5">8</span><span className="py-0.5">9</span><span className="py-0.5">10</span><span className="py-0.5">11</span>
                                <span className="py-0.5 bg-purple-600 text-white font-bold rounded-full">12</span>
                                <span className="py-0.5">13</span><span className="py-0.5">14</span>
                              </div>
                            </div>

                            {/* Platform Performance Widget */}
                            <div className="rounded-xl border border-zinc-200/70 bg-white p-2 shadow-sm flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-zinc-950">Platform Performance</p>
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className="h-4 w-4 rounded-full bg-gradient-to-tr from-[#F58529] to-[#8134AF] flex items-center justify-center text-[7px] text-white font-bold">IG</span>
                                  <span className="h-4 w-4 rounded-full bg-[#1877F2] flex items-center justify-center text-[7px] text-white font-bold">FB</span>
                                  <span className="h-4 w-4 rounded-full bg-[#0A66C2] flex items-center justify-center text-[7px] text-white font-bold">IN</span>
                                </div>
                              </div>
                              {/* Mini Bar Chart */}
                              <div className="flex items-end gap-1 h-6">
                                <div className="w-1.5 bg-purple-300 rounded-t h-3" />
                                <div className="w-1.5 bg-purple-400 rounded-t h-4" />
                                <div className="w-1.5 bg-purple-600 rounded-t h-6" />
                                <div className="w-1.5 bg-purple-500 rounded-t h-5" />
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Laptop Aluminum Bottom Lip / Notch */}
              <div className="relative mx-auto -mt-0.5 h-3 w-[92%] rounded-b-xl bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-500 shadow-md">
                <div className="absolute left-1/2 top-0 h-1 w-14 -translate-x-1/2 rounded-b-md bg-zinc-600" />
              </div>

            </div>

            {/* ========================================================= */}
            {/* SMARTPHONE (iPhone) MOCKUP - OVERLAPPING ON RIGHT */}
            {/* ========================================================= */}
            <div className="relative -ml-20 lg:-ml-28 z-20 w-[240px] sm:w-[270px] lg:w-[290px] shrink-0 transform translate-y-3 sm:translate-y-4">
              
              {/* Phone Frame */}
              <div className="relative rounded-[40px] border-[8px] border-zinc-900 bg-zinc-900 p-1 shadow-2xl shadow-purple-950/30 ring-1 ring-zinc-700/60">
                
                {/* Screen Container */}
                <div className="relative aspect-[9/18.5] w-full overflow-hidden rounded-[32px] bg-[#F8F9FD] p-3 text-zinc-900 select-none flex flex-col justify-between">
                  
                  {/* Dynamic Island Pill & Status Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-900 px-2 pt-0.5">
                      <span>9:41</span>
                      
                      {/* Dynamic Island */}
                      <div className="h-4 w-20 rounded-full bg-zinc-950 flex items-center justify-end pr-2">
                        <div className="h-2 w-2 rounded-full bg-zinc-800" />
                      </div>

                      <div className="flex items-center gap-1 text-[10px]">
                        <span>5G</span>
                        <div className="h-2.5 w-4 rounded-sm border border-zinc-800 p-0.5">
                          <div className="h-full w-full bg-zinc-900 rounded-2xs" />
                        </div>
                      </div>
                    </div>

                    {/* App Header: < Analytics / Last 30 days */}
                    <div className="mt-2.5 flex items-center justify-between px-1">
                      <div className="flex items-center gap-1">
                        <ChevronLeft className="h-4 w-4 text-zinc-800" />
                        <span className="text-xs font-bold text-zinc-950">Analytics</span>
                      </div>
                      <button
                        type="button"
                        className="flex items-center gap-0.5 rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-zinc-700"
                      >
                        <span>Last 30 days</span>
                        <ChevronDown className="h-2.5 w-2.5 text-zinc-500" />
                      </button>
                    </div>

                    {/* Subnav Tabs: Overview / Content / Audience / Posts */}
                    <div className="mt-2.5 flex items-center gap-1 rounded-xl bg-zinc-200/60 p-0.5 text-[10px] font-medium">
                      <span className="flex-1 rounded-lg bg-gradient-to-r from-[#6929E8] to-[#8E2DE2] py-1 text-center font-bold text-white shadow-sm">
                        Overview
                      </span>
                      <span className="flex-1 py-1 text-center text-zinc-600">
                        Content
                      </span>
                      <span className="flex-1 py-1 text-center text-zinc-600">
                        Audience
                      </span>
                      <span className="flex-1 py-1 text-center text-zinc-600">
                        Posts
                      </span>
                    </div>

                    {/* 4 Mini Square Metric Cards in 2x2 Grid */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {/* Metric 1 */}
                      <div className="rounded-xl border border-zinc-200/70 bg-white p-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-zinc-500 font-medium">Reach</span>
                          <TrendingUp className="h-3 w-3 text-purple-600" />
                        </div>
                        <div className="mt-1">
                          <p className="text-xs font-black text-zinc-950">284K</p>
                          <p className="text-[8px] font-bold text-emerald-600">↗ +41%</p>
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div className="rounded-xl border border-zinc-200/70 bg-white p-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-zinc-500 font-medium">Engagement</span>
                          <Heart className="h-3 w-3 text-purple-600" />
                        </div>
                        <div className="mt-1">
                          <p className="text-xs font-black text-zinc-950">12.4K</p>
                          <p className="text-[8px] font-bold text-emerald-600">↗ +82%</p>
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className="rounded-xl border border-zinc-200/70 bg-white p-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-zinc-500 font-medium">Total Posts</span>
                          <FileText className="h-3 w-3 text-purple-600" />
                        </div>
                        <div className="mt-1">
                          <p className="text-xs font-black text-zinc-950">48</p>
                          <p className="text-[8px] font-bold text-emerald-600">↗ +23%</p>
                        </div>
                      </div>

                      {/* Metric 4 */}
                      <div className="rounded-xl border border-zinc-200/70 bg-white p-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-zinc-500 font-medium">Conversions</span>
                          <ShoppingBag className="h-3 w-3 text-purple-600" />
                        </div>
                        <div className="mt-1">
                          <p className="text-xs font-black text-zinc-950">1.2K</p>
                          <p className="text-[8px] font-bold text-emerald-600">↗ +67%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Growth Trend Curved Chart Card */}
                  <div className="mt-2 rounded-2xl border border-zinc-200/70 bg-white p-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-zinc-950">Growth Trend</span>
                    </div>

                    {/* Chart Graphic */}
                    <div className="relative mt-2 h-24 w-full">
                      {/* Floating Tooltip Pill */}
                      <div className="absolute right-6 top-0 z-10 flex items-center gap-1 rounded-full bg-purple-50 border border-purple-200 px-2 py-0.5 text-[8px] font-bold text-purple-700 shadow-sm">
                        <Pencil className="h-2 w-2" />
                        <span>124K</span>
                        <span className="text-emerald-600 font-black">+82%</span>
                      </div>

                      {/* Y-axis Labels */}
                      <div className="absolute left-0 top-0 flex h-full flex-col justify-between text-[7px] font-medium text-zinc-400">
                        <span>150K</span>
                        <span>100K</span>
                        <span>50K</span>
                        <span>0</span>
                      </div>

                      {/* Spline Path SVG */}
                      <svg className="ml-5 h-full w-[calc(100%-20px)] overflow-visible" viewBox="0 0 160 80">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Gradient Fill under Curve */}
                        <path
                          d="M 5 65 Q 40 60, 65 45 T 115 30 T 155 12 L 155 80 L 5 80 Z"
                          fill="url(#chartGrad)"
                        />

                        {/* Spline Stroke Line */}
                        <path
                          d="M 5 65 Q 40 60, 65 45 T 115 30 T 155 12"
                          fill="none"
                          stroke="#7C3AED"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Active Peak Dot */}
                        <circle cx="155" cy="12" r="3.5" fill="#7C3AED" stroke="#FFFFFF" strokeWidth="2" />
                      </svg>
                    </div>

                    {/* X-axis Month Labels */}
                    <div className="ml-5 flex justify-between text-[8px] font-medium text-zinc-400 mt-1">
                      <span>Sep</span>
                      <span>Oct</span>
                      <span>Nov</span>
                      <span>Dec</span>
                    </div>
                  </div>

                  {/* iPhone Home Indicator Line */}
                  <div className="mx-auto mt-2 h-1 w-20 rounded-full bg-zinc-300" />

                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
