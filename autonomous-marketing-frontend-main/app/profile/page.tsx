"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  CreditCard,
  Headphones,
  LogOut,
  Settings,
  Sparkles,
  User,
} from "lucide-react";

import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { DashboardTopHeader } from "@/components/navigation/dashboard-top-header";
import { ProfileInfoTab } from "@/components/profile/profile-info-tab";
import { ProfileSettingsTab } from "@/components/profile/profile-settings-tab";
import { ProfileSubscriptionTab } from "@/components/profile/profile-subscription-tab";
import { ProfileSupportTab } from "@/components/profile/profile-support-tab";
import { clearAuth, getUserMeta, getTenantId } from "@/lib/auth";

type TabKey = "profile" | "settings" | "subscription" | "support";

const tabs: { id: TabKey; label: string; icon: any; desc: string }[] = [
  {
    id: "profile",
    label: "My Profile",
    icon: User,
    desc: "Personal & Workspace Info",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    desc: "Brand & Preferences",
  },
  {
    id: "subscription",
    label: "Subscription",
    icon: CreditCard,
    desc: "Billing & Plans",
  },
  {
    id: "support",
    label: "Help & Support",
    icon: Headphones,
    desc: "Tickets & Assistance",
  },
];

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const rawTab = searchParams.get("tab") as TabKey | null;
  // On desktop, default to 'profile'. On mobile, if no tab param, show the options menu!
  const [activeTab, setActiveTab] = useState<TabKey | null>(rawTab);

  const [userMeta, setUserMeta] = useState<{ name: string; email: string }>({
    name: "",
    email: "",
  });
  const [tenantId, setTenantId] = useState("");

  useEffect(() => {
    setUserMeta(getUserMeta());
    setTenantId(getTenantId() || "Default Workspace");
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabKey | null;
    if (tabParam && ["profile", "settings", "subscription", "support"].includes(tabParam)) {
      setActiveTab(tabParam);
    } else {
      setActiveTab(null);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: TabKey) => {
    setActiveTab(tabId);
    router.push(`/profile?tab=${tabId}`);
  };

  const handleBackToMenu = () => {
    setActiveTab(null);
    router.push("/profile");
  };

  const handleLogout = () => {
    clearAuth();
    router.replace("/login");
  };

  const displayName = userMeta.name || "My Account";
  const displayEmail = userMeta.email || "user@marketingsystem.com";
  const initials = (userMeta.name ? userMeta.name.slice(0, 2) : "US").toUpperCase();

  // Desktop active tab defaults to 'profile' if none chosen
  const desktopActiveTab: TabKey = activeTab || "profile";

  return (
    <div className="min-h-screen bg-white text-neutral-950 pb-20 md:pb-8">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen md:pl-[230px]">
        {/* Top Header Bar */}
        <DashboardTopHeader
          title="Account Hub"
          subtitle="User Profile, Settings & Billing"
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* ========================================================= */}
          {/* 1. MOBILE VIEW (< md): App-Style Options Menu & Details  */}
          {/* ========================================================= */}
          <div className="md:hidden">
            {/* If NO tab is selected on mobile: Show the clean Options Menu */}
            {!activeTab ? (
              <div className="space-y-5 animate-in fade-in">
                {/* User Card */}
                <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-5 shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-base font-bold text-white shadow-xs">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-neutral-950">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-neutral-500">
                        {displayEmail}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600">
                    <span className="text-[11px] font-medium text-neutral-500">Active Workspace</span>
                    <span className="font-semibold text-neutral-900 truncate max-w-[160px]">
                      {tenantId}
                    </span>
                  </div>
                </div>

                {/* Account Sections List */}
                <div>
                  <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Account Options
                  </p>

                  <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handleTabChange(tab.id)}
                          className="flex w-full items-center justify-between p-4 text-left transition hover:bg-neutral-50 active:bg-neutral-100"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-neutral-950">
                                {tab.label}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {tab.desc}
                              </p>
                            </div>
                          </div>

                          <ChevronRight size={18} className="text-neutral-400 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sign Out Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 active:bg-red-200 transition"
                  >
                    <LogOut size={16} />
                    Sign Out from Account
                  </button>
                </div>
              </div>
            ) : (
              /* When a tab IS selected on mobile: Show Detail View with Back Button */
              <div className="space-y-4 animate-in fade-in">
                {/* Top Back Navigation Bar */}
                <button
                  type="button"
                  onClick={handleBackToMenu}
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2 text-xs font-bold text-neutral-800 shadow-xs hover:bg-neutral-100 active:scale-95 transition"
                >
                  <ArrowLeft size={15} />
                  <span>Back to Account Options</span>
                </button>

                {/* Section Details */}
                <div className="mt-2">
                  {activeTab === "profile" && <ProfileInfoTab />}
                  {activeTab === "settings" && <ProfileSettingsTab />}
                  {activeTab === "subscription" && <ProfileSubscriptionTab />}
                  {activeTab === "support" && <ProfileSupportTab />}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 2. DESKTOP VIEW (md:block): Full Multi-Tab Workspace      */}
          {/* ========================================================= */}
          <div className="hidden md:block">
            {/* Header Title */}
            <div>
              <p className="text-xs font-medium text-neutral-500">Central Account Hub</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-neutral-950">
                My Profile & Preferences
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-neutral-500">
                Manage personal details, workspace preferences, brand settings, active subscription plans, and support tickets in one place.
              </p>
            </div>

            {/* Navigation Hub Tabs */}
            <div className="mt-8 flex flex-wrap border-b border-neutral-200 pb-px gap-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = desktopActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center gap-2.5 rounded-t-xl px-4 py-3 text-xs font-semibold transition sm:text-sm ${
                      active
                        ? "border-b-2 border-neutral-950 bg-neutral-50/80 text-neutral-950 shadow-xs"
                        : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}
                  >
                    <Icon size={16} className={active ? "text-neutral-950" : "text-neutral-400"} />
                    <div className="text-left">
                      <p className="leading-tight">{tab.label}</p>
                      <p className="text-[10px] font-normal text-neutral-400 hidden sm:block">{tab.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Tab Panel */}
            <div className="mt-8">
              {desktopActiveTab === "profile" && <ProfileInfoTab />}
              {desktopActiveTab === "settings" && <ProfileSettingsTab />}
              {desktopActiveTab === "subscription" && <ProfileSubscriptionTab />}
              {desktopActiveTab === "support" && <ProfileSupportTab />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-950 border-t-transparent" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
