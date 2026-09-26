import Link from "next/link";
import { ArrowRight, Play, Check } from "lucide-react";

export function CTASection() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-[#0D071E] py-24 text-white">
      {/* Background Radial Purple Mesh Lights */}
      <div className="pointer-events-none absolute -bottom-32 left-1/2 -translate-x-1/2 h-[450px] w-[700px] rounded-full bg-purple-600/25 blur-[140px]" />
      <div className="pointer-events-none absolute -top-24 right-10 h-[300px] w-[300px] rounded-full bg-indigo-600/20 blur-[100px]" />

      <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
          Ready To Grow?
        </p>

        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Start your autonomous marketing today.
        </h2>

        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-300 sm:text-lg">
          Join businesses already growing with AI.
        </p>

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-purple-600/30 transition-all hover:opacity-95 hover:shadow-purple-600/50"
          >
            Start Free Trial
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#0D071E]">
              <Play className="h-3 w-3 fill-current ml-0.5" />
            </div>
            See How It Works
          </a>
        </div>

        {/* Bullet Checkmarks */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-purple-400" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-purple-400" />
            <span>Setup in minutes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-purple-400" />
            <span>Cancel anytime</span>
          </div>
        </div>

      </div>
    </section>
  );
}
