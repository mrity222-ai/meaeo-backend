"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  Check,
  Facebook,
  Instagram,
  Linkedin,
  Loader2,
  Lock,
  Palette,
  Save,
  Share2,
  ShieldAlert,
  Sliders,
  Store,
  ExternalLink,
} from "lucide-react";
import { getBusinessChannels, type BusinessChannel } from "@/lib/api/connections";

const subtabs = [
  { id: "general", label: "General", icon: Building2 },
  { id: "brand", label: "Brand Identity", icon: Palette },
  { id: "channels", label: "Connected Channels", icon: Share2 },
  { id: "preferences", label: "Marketing Preferences", icon: Sliders },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
];

const platformList = [
  {
    key: "facebook",
    name: "Facebook Pages",
    icon: Facebook,
    description: "Automate feed posts, announcements, and image posts.",
  },
  {
    key: "instagram",
    name: "Instagram Professional",
    icon: Instagram,
    description: "Publish photo posts, carousel media, and captions.",
  },
  {
    key: "linkedin",
    name: "LinkedIn Organization & Profile",
    icon: Linkedin,
    description: "Publish B2B industry articles, thought leadership, and company updates.",
  },
  {
    key: "google_business",
    name: "Google Business Profile",
    icon: Store,
    description: "Publish local updates, special offers, and store announcements.",
  },
];

export function ProfileSettingsTab() {
  const [activeSubtab, setActiveSubtab] = useState("general");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Channels state
  const [connectedChannels, setConnectedChannels] = useState<BusinessChannel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadChannels() {
      try {
        setLoadingChannels(true);
        const res = await getBusinessChannels();
        if (isMounted && res && res.channels) {
          setConnectedChannels(res.channels);
        }
      } catch (e) {
        // silent fail for non-critical tab load
      } finally {
        if (isMounted) setLoadingChannels(false);
      }
    }
    loadChannels();
    return () => {
      isMounted = false;
    };
  }, []);

  // Form states
  const [generalForm, setGeneralForm] = useState({
    workspaceName: "My Business Workspace",
    website: "https://mybusiness.com",
    industry: "SaaS & Technology",
    timezone: "Asia/Kolkata (UTC+05:30)",
  });

  const [brandForm, setBrandForm] = useState({
    brandVoice: "Professional, confident, and innovative",
    primaryColor: "#09090b",
    secondaryColor: "#3b82f6",
    description: "Automate multi-channel marketing campaigns using autonomous AI.",
    targetAudience: "Small business owners, digital founders, and marketers.",
  });

  const [marketingForm, setMarketingForm] = useState({
    tone: "Informative & Authoritative",
    frequency: "Daily (7 posts / week)",
    autonomyLevel: "Semi-Autonomous (Requires approval before publishing)",
    objectives: ["Brand Awareness", "Lead Generation", "Store Visits"],
  });

  const [notificationsForm, setNotificationsForm] = useState({
    campaignAlerts: true,
    postPublishing: true,
    weeklyReport: true,
    aiSuggestions: true,
    emailDigest: false,
  });

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <Check size={16} />
          Settings saved successfully!
        </div>
      )}

      {/* Subtab Switcher */}
      <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-1 sm:gap-2">
        {subtabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeSubtab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubtab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                active
                  ? "bg-neutral-900 text-white font-semibold shadow-xs"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="max-w-4xl">
        {/* 1. GENERAL SETTINGS */}
        {activeSubtab === "general" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-neutral-950">General Information</h2>
              <p className="text-xs text-neutral-500">Workspace identity and localization settings.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700">Workspace Name</label>
                  <input
                    type="text"
                    value={generalForm.workspaceName}
                    onChange={(e) => setGeneralForm({ ...generalForm, workspaceName: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3.5 text-sm font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700">Company Website</label>
                  <input
                    type="url"
                    value={generalForm.website}
                    onChange={(e) => setGeneralForm({ ...generalForm, website: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3.5 text-sm font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700">Industry</label>
                    <select
                      value={generalForm.industry}
                      onChange={(e) => setGeneralForm({ ...generalForm, industry: e.target.value })}
                      className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
                    >
                      <option>SaaS & Technology</option>
                      <option>E-commerce & Retail</option>
                      <option>Digital Marketing Agency</option>
                      <option>Healthcare & Wellness</option>
                      <option>Local Services & Store</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700">Timezone</label>
                    <select
                      value={generalForm.timezone}
                      onChange={(e) => setGeneralForm({ ...generalForm, timezone: e.target.value })}
                      className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
                    >
                      <option>Asia/Kolkata (UTC+05:30)</option>
                      <option>America/New_York (UTC-05:00)</option>
                      <option>Europe/London (UTC+00:00)</option>
                      <option>America/Los_Angeles (UTC-08:00)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-xs font-medium text-white transition hover:bg-neutral-800"
              >
                <Save size={15} />
                Save General Settings
              </button>
            </div>
          </div>
        )}

        {/* 2. BRAND IDENTITY */}
        {activeSubtab === "brand" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-neutral-950">Brand & Voice</h2>
              <p className="text-xs text-neutral-500">Train the AI system to emulate your brand personality.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700">Brand Voice Guidelines</label>
                  <input
                    type="text"
                    value={brandForm.brandVoice}
                    onChange={(e) => setBrandForm({ ...brandForm, brandVoice: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3.5 text-sm font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700">Primary Color</label>
                    <div className="mt-1.5 flex items-center gap-3">
                      <input
                        type="color"
                        value={brandForm.primaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                        className="h-9 w-12 cursor-pointer rounded-lg border border-neutral-200 bg-transparent p-1"
                      />
                      <input
                        type="text"
                        value={brandForm.primaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, primaryColor: e.target.value })}
                        className="h-10 flex-1 rounded-xl border border-neutral-200 px-3 text-sm font-mono text-neutral-900 uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700">Secondary Color</label>
                    <div className="mt-1.5 flex items-center gap-3">
                      <input
                        type="color"
                        value={brandForm.secondaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, secondaryColor: e.target.value })}
                        className="h-9 w-12 cursor-pointer rounded-lg border border-neutral-200 bg-transparent p-1"
                      />
                      <input
                        type="text"
                        value={brandForm.secondaryColor}
                        onChange={(e) => setBrandForm({ ...brandForm, secondaryColor: e.target.value })}
                        className="h-10 flex-1 rounded-xl border border-neutral-200 px-3 text-sm font-mono text-neutral-900 uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700">Brand Description</label>
                  <textarea
                    rows={3}
                    value={brandForm.description}
                    onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 p-3 text-sm font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-xs font-medium text-white transition hover:bg-neutral-800"
              >
                <Save size={15} />
                Save Brand Settings
              </button>
            </div>
          </div>
        )}

        {/* 3. CONNECTED CHANNELS */}
        {activeSubtab === "channels" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-neutral-950">Connected Social Channels</h2>
                  <p className="text-xs text-neutral-500">Channels linked to your business for automated marketing.</p>
                </div>
                <Link
                  href="/connections"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-neutral-200 px-3.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 transition"
                >
                  <ExternalLink size={14} />
                  Manage Connections
                </Link>
              </div>

              {loadingChannels ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-neutral-400" size={24} />
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {platformList.map((platform) => {
                    const Icon = platform.icon;
                    const connected = connectedChannels.some((c) => c.platform === platform.key && c.status === "connected");

                    return (
                      <div key={platform.key} className="rounded-xl border border-neutral-200 p-4 transition hover:border-neutral-300">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-800">
                              <Icon size={18} />
                            </div>
                            <span className="text-sm font-semibold text-neutral-900">{platform.name}</span>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              connected ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {connected ? "Connected" : "Not Linked"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-neutral-500">{platform.description}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. MARKETING PREFERENCES */}
        {activeSubtab === "preferences" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-neutral-950">Marketing Automation Strategy</h2>
              <p className="text-xs text-neutral-500">Autonomous campaign behavior and AI post frequency.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700">Autonomous Mode</label>
                  <select
                    value={marketingForm.autonomyLevel}
                    onChange={(e) => setMarketingForm({ ...marketingForm, autonomyLevel: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  >
                    <option>Semi-Autonomous (Requires human review before publishing)</option>
                    <option>Full Autonomous (Direct scheduled publishing via AI)</option>
                    <option>Manual Review Only (Draft generation only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700">Publishing Frequency</label>
                  <select
                    value={marketingForm.frequency}
                    onChange={(e) => setMarketingForm({ ...marketingForm, frequency: e.target.value })}
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm font-medium text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  >
                    <option>Daily (7 posts / week)</option>
                    <option>3 Times a Week (Mon, Wed, Fri)</option>
                    <option>Twice Weekly (Tue, Thu)</option>
                    <option>Weekly (1 high-impact post)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-xs font-medium text-white transition hover:bg-neutral-800"
              >
                <Save size={15} />
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* 5. NOTIFICATIONS */}
        {activeSubtab === "notifications" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-neutral-950">Notification Channels</h2>
              <p className="text-xs text-neutral-500">Control when and how you receive alerts.</p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">Campaign Execution Alerts</p>
                    <p className="text-[11px] text-neutral-500">Alerts when AI creates or pauses a campaign.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsForm.campaignAlerts}
                    onChange={(e) => setNotificationsForm({ ...notificationsForm, campaignAlerts: e.target.checked })}
                    className="h-4 w-4 rounded accent-neutral-950"
                  />
                </div>

                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">Post Publishing Confirmation</p>
                    <p className="text-[11px] text-neutral-500">Get notified when posts go live on channels.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsForm.postPublishing}
                    onChange={(e) => setNotificationsForm({ ...notificationsForm, postPublishing: e.target.checked })}
                    className="h-4 w-4 rounded accent-neutral-950"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">Weekly Performance Report</p>
                    <p className="text-[11px] text-neutral-500">Summary email of clicks, views, and engagements.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsForm.weeklyReport}
                    onChange={(e) => setNotificationsForm({ ...notificationsForm, weeklyReport: e.target.checked })}
                    className="h-4 w-4 rounded accent-neutral-950"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-xs font-medium text-white transition hover:bg-neutral-800"
              >
                <Save size={15} />
                Save Notification Settings
              </button>
            </div>
          </div>
        )}

        {/* 6. SECURITY */}
        {activeSubtab === "security" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
              <h2 className="text-base font-semibold text-neutral-950">Security & Credentials</h2>
              <p className="text-xs text-neutral-500">Account login credentials and workspace protection.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3.5 text-sm text-neutral-900 focus:border-neutral-950 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3.5 text-sm text-neutral-900 focus:border-neutral-950 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Repeat new password"
                      className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 px-3.5 text-sm text-neutral-900 focus:border-neutral-950 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-xs font-medium text-white transition hover:bg-neutral-800"
              >
                <Save size={15} />
                Update Password
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
