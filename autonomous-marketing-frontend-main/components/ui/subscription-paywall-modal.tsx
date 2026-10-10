"use client";

import { Sparkles, Zap, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function SubscriptionPaywallModal({
  isOpen,
  onClose,
  title = "Upgrade Your maeaco Plan",
  description = "You've reached the free preview limit. Upgrade to a paid plan to unlock unlimited AI post generation, 3D brand assets, and automatic publishing on schedule.",
}: SubscriptionPaywallModalProps) {
  const router = RouterHook();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="ui-card relative w-full max-w-lg overflow-hidden p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-purple-100 hover:text-zinc-700 dark:hover:bg-purple-900/50 dark:hover:text-zinc-200 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30">
          <Sparkles className="h-7 w-7" />
        </div>

        {/* Text Details */}
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Plan Benefits List */}
        <div className="my-6 space-y-2.5 rounded-2xl border border-purple-200/60 bg-white/70 p-4 dark:border-purple-800/40 dark:bg-zinc-900/70">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Unlimited AI Post & Image Generation (Gemini AI)</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Auto-Publishing to Instagram, Facebook & Google Business</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Advanced Analytics & 3D Brand Logo Customizations</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              onClose();
              router.push("/profile?tab=subscription");
            }}
            className="ui-button-primary flex-1"
          >
            <Zap className="h-4 w-4" />
            Upgrade Plan Now
          </button>

          <button
            onClick={onClose}
            className="ui-button-secondary"
          >
            Continue Preview
          </button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
          <span>Cancel anytime. Secure Razorpay & Stripe Checkout.</span>
        </div>
      </div>
    </div>
  );
}

function RouterHook() {
  return useRouter();
}
