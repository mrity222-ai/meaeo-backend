"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile?tab=subscription");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-neutral-900">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
        <span className="text-sm font-medium text-neutral-600">Redirecting to Subscription in Profile Hub...</span>
      </div>
    </div>
  );
}
