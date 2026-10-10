"use client";

import { getBusinessAccountId, getTenantId } from "@/lib/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Eye,
  FileText,
  Heart,
  Instagram,
  Linkedin,
  Loader2,
  Menu,
  MessageCircle,
  MousePointerClick,
  Play,
  RefreshCw,
  Rocket,
  Share2,
  Sparkles,
  Store,
  TrendingUp,
  Users,
} from "lucide-react";

import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { DashboardTopHeader } from "@/components/navigation/dashboard-top-header";
import { SocialLogo } from "@/components/ui/social-logo";
import { getBusinessChannels, type BusinessChannel } from "@/lib/api/connections";
import {
  getCampaigns,
  postDisplayStatus,
  getCampaignPosts,
  type CampaignResponse,
  type CampaignPostResponse,
} from "@/lib/api/campaigns";
import {
  aggregateCampaignMetrics,
  publishedPlatformCounts,
  getCampaignAnalytics,
  getGooglePerformance,
  type GooglePerformance,
  type CampaignAnalytics,
} from "@/lib/api/analytics";

type CampaignWithData = {
  campaign: CampaignResponse;
  posts: CampaignPostResponse[];
  analytics: CampaignAnalytics | null;
};

function formatNumber(value: number | null): string {
  if (value == null) return "Not available";
  if (!Number.isFinite(value)) return "Not available";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignWithData[]>([]);
  const [googlePerformance, setGooglePerformance] = useState<GooglePerformance | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const googleRequest = useRef(0);
  const [googleLocations, setGoogleLocations] = useState<BusinessChannel[]>([]);
  const [googleLocation, setGoogleLocation] = useState("");
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date(); end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end); start.setUTCDate(start.getUTCDate() - 29);
    return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
  });

  const loadGooglePerformance = async () => {
    const request = ++googleRequest.current;
    const business = getBusinessAccountId(); const tenant = getTenantId();
    setGooglePerformance(null); setGoogleError(null);
    try {
      const channels = await getBusinessChannels();
      if (request !== googleRequest.current || getBusinessAccountId() !== business || getTenantId() !== tenant) return;
      const locations = channels.channels.filter(channel => channel.platform === "google_business" && channel.status === "active" && channel.is_enabled);
      setGoogleLocations(locations);
      const selected = locations.find(channel => channel.external_account_id === googleLocation)?.external_account_id || (locations.length === 1 ? locations[0].external_account_id : "");
      if (locations.length > 1 && !selected) { setGoogleError("Select a connected Google location."); return; }
      const result = await getGooglePerformance(dateRange.start, dateRange.end, selected || undefined);
      if (request === googleRequest.current && getBusinessAccountId() === business && getTenantId() === tenant) setGooglePerformance(result);
    } catch (err) {
      if (request === googleRequest.current && getBusinessAccountId() === business && getTenantId() === tenant) setGoogleError(err instanceof Error ? err.message : "Google performance unavailable.");
    }
  };

  const loadAnalyticsData = async (isRefresh = false) => {
    void loadGooglePerformance();
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const selectedBusiness = getBusinessAccountId();
    const selectedTenant = getTenantId();
    setError(null);
    try {
      if (!selectedBusiness || !selectedTenant) throw new Error("Select a business to view analytics.");
      const list = await getCampaigns();
      const detailed = await Promise.all(
        list.map(async (campaign) => {
          const [postsResult, analyticsResult] = await Promise.all([
            getCampaignPosts(campaign.id),
            getCampaignAnalytics(campaign.id).catch(() => null),
          ]);
          return {
            campaign,
            posts: postsResult,
            analytics: analyticsResult,
          };
        })
      );
      if (getBusinessAccountId() !== selectedBusiness || getTenantId() !== selectedTenant) return;
      setCampaigns(detailed);
    } catch (err) {
      if (getBusinessAccountId() !== selectedBusiness || getTenantId() !== selectedTenant) return;
      setError(err instanceof Error ? err.message : "Analytics unavailable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAnalyticsRef = useRef(loadAnalyticsData);
  loadAnalyticsRef.current = loadAnalyticsData;
  useEffect(() => {
    void loadAnalyticsRef.current();
    const reload = () => { setCampaigns([]); setGoogleLocations([]); setGoogleLocation(""); void loadAnalyticsRef.current(); };
    window.addEventListener("business-context-changed", reload);
    window.addEventListener("storage", reload);
    return () => { window.removeEventListener("business-context-changed", reload); window.removeEventListener("storage", reload); };
  }, []);

  useEffect(() => {
    void loadGooglePerformance();
  }, [dateRange.start, dateRange.end, googleLocation]);

  // Aggregated Real Stats
  const stats = useMemo(() => ({
    ...aggregateCampaignMetrics(campaigns.map(item => item.analytics)),
    publishedPosts: campaigns.reduce((sum, item) => sum + item.posts.filter(post => post.publish_status === "published").length, 0),
    runningCampaigns: campaigns.filter(item => item.campaign.status === "running").length,
    totalCampaigns: campaigns.length,
  }), [campaigns]);

  // Real Top / Recent Posts
  const recentPosts = useMemo(() => {
    return campaigns
      .flatMap((c) =>
        c.posts.map((p) => ({
          ...p,
          campaignName: c.campaign.campaign_name,
          executionMode: c.campaign.execution_mode,
        }))
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [campaigns]);

  // Dynamic Platform Breakdown
  const platformBreakdown = useMemo(() => {
    const rawCounts = publishedPlatformCounts(campaigns.flatMap(item => item.posts));
    const labels: Record<string, string> = { instagram: "Instagram", linkedin: "LinkedIn", facebook: "Facebook", google_business: "Google Business" };
    const counts = Object.fromEntries(Object.entries(rawCounts).map(([key, count]) => [labels[key] || key, count]));
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    if (total === 0) {
      return [
        { platform: "Instagram", percentage: 0, count: 0, color: "bg-pink-500" },
        { platform: "LinkedIn", percentage: 0, count: 0, color: "bg-blue-600" },
        { platform: "Facebook", percentage: 0, count: 0, color: "bg-blue-500" },
        { platform: "Google Business", percentage: 0, count: 0, color: "bg-emerald-600" },
      ];
    }

    return Object.entries(counts).map(([platform, count]) => {
      const percentage = Math.round((count / total) * 100);
      const color =
        platform === "LinkedIn"
          ? "bg-blue-600"
          : platform === "Instagram"
          ? "bg-pink-500"
          : platform === "Facebook"
          ? "bg-blue-500"
          : "bg-emerald-600";
      return { platform, percentage, count, color };
    });
  }, [campaigns]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-[230px]">
        <DashboardTopHeader title="Analytics" subtitle="Performance and channel insights"
          onMenuClick={() => setSidebarOpen(true)} actions={
            <button type="button" onClick={() => void loadAnalyticsData(true)} disabled={refreshing}
              aria-label="Refresh analytics" className="ui-button-secondary inline-flex min-h-11 items-center gap-2 border border-border px-3 text-sm disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          } />

        <div className="mx-auto max-w-7xl px-4 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 sm:px-6 lg:px-8">
          <section className="mb-6 rounded-xl border p-4 space-y-3">
            <h2 className="font-semibold">Google Business Profile performance</h2>
            <p className="text-xs text-muted-foreground">Whole location performance; not attributed to individual campaigns. Call clicks are not answered calls; website clicks are not website sessions.</p>
            <div className="flex flex-wrap gap-3">
              {googleLocations.length > 1 && <label className="text-xs">Location <select value={googleLocation} onChange={e => setGoogleLocation(e.target.value)} className="border rounded p-1"><option value="">Select location</option>{googleLocations.map(channel => <option key={channel.id} value={channel.external_account_id}>{channel.account_name}</option>)}</select></label>}
              <label className="text-xs">From <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="border rounded p-1" /></label>
              <label className="text-xs">To <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="border rounded p-1" /></label>
            </div>
            {googleError && <p className="text-xs text-red-600">{googleError}</p>}
            {googlePerformance && <>
              <p className="text-xs text-muted-foreground">{googlePerformance.location_name || "No connected location"} · {googlePerformance.availability} · {googlePerformance.last_updated ? `Fetched: ${new Date(googlePerformance.last_updated).toLocaleString()}` : "No verified data"}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {Object.entries({ CALL_CLICKS: "Call button clicks", WEBSITE_CLICKS: "Website clicks", BUSINESS_DIRECTION_REQUESTS: "Direction requests", BUSINESS_IMPRESSIONS_DESKTOP_MAPS: "Maps impressions (desktop)", BUSINESS_IMPRESSIONS_MOBILE_MAPS: "Maps impressions (mobile)", BUSINESS_IMPRESSIONS_DESKTOP_SEARCH: "Search impressions (desktop)", BUSINESS_IMPRESSIONS_MOBILE_SEARCH: "Search impressions (mobile)" }).map(([metric, label]) => <div key={metric} className="rounded border p-2"><p className="text-xs text-muted-foreground">{label}</p><p>{formatNumber(googlePerformance.metrics[metric] ?? null)}</p></div>)}
              </div>
              {googlePerformance.unavailable_reason && <p className="text-xs text-muted-foreground">{googlePerformance.unavailable_reason}</p>}
            </>}
          </section>
          {/* Header Title */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Live Performance Metrics
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Analytics Overview
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Available platform metrics and actual publishing status.
              </p>
            </div>
            <Link
              href="/campaigns"
              className="ui-button-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition"
            >
              <Rocket className="h-4 w-4" />
              Manage Campaigns
            </Link>
          </div>

          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center shadow-xs">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="mt-3 text-sm font-semibold text-foreground">Fetching Live Campaign Analytics...</p>
              <p className="text-xs text-muted-foreground">Unsupported or unavailable metrics are shown as unavailable</p>
            </div>
          ) : (
            <>
              {/* 4 REAL KPI CARDS */}
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Reach */}
                <div className="ui-card ui-card-hover p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Post Reach (sum)
                    </p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-black text-foreground">
                    {formatNumber(stats.totalReach)}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {stats.lastUpdated ? `Last updated: ${new Date(stats.lastUpdated).toLocaleString()}` : "Data unavailable"}
                  </p>
                </div>

                {/* Total Link Clicks */}
                <div className="ui-card ui-card-hover p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tracked Clicks
                    </p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/80 text-blue-700">
                      <MousePointerClick className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-black text-foreground">
                    {formatNumber(stats.totalClicks)}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Average campaign engagement rate: {stats.engagementRate}
                  </p>
                </div>

                {/* Posts Published */}
                <div className="ui-card ui-card-hover p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Published Posts
                    </p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-black text-foreground">
                    {stats.publishedPosts}
                  </p>
                  <p className="mt-1.5 text-xs text-emerald-700 font-semibold">
                    Live on connected channels
                  </p>
                </div>

                {/* Active Campaigns */}
                <div className="ui-card ui-card-hover p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Running Campaigns
                    </p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700">
                      <Rocket className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-black text-foreground">
                    {stats.runningCampaigns}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Out of {stats.totalCampaigns} total campaigns
                  </p>
                </div>
              </div>

              {/* RECENT POSTS & PLATFORM BREAKDOWN */}
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Content Activity (2 Cols) */}
                <div className="ui-card p-6 lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-foreground">Recent Published Content</h2>
                      <p className="text-xs text-muted-foreground">Content created and published across channels</p>
                    </div>
                    <Link
                      href="/campaigns"
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700"
                    >
                      View all →
                    </Link>
                  </div>

                  {recentPosts.length === 0 ? (
                    <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-purple-200 bg-purple-50/20 p-6 text-center">
                      <FileText className="h-8 w-8 text-purple-400 mb-2" />
                      <p className="text-sm font-bold text-foreground">No Campaign Content Yet</p>
                      <p className="text-xs text-muted-foreground max-w-sm mt-1">
                        When you launch an autonomous marketing campaign, your generated posts and analytics will populate here automatically.
                      </p>
                      <Link
                        href="/campaigns"
                        className="ui-button-primary mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition"
                      >
                        Create Your First Campaign
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentPosts.map((post) => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between rounded-xl border border-border bg-card/80 p-3.5 transition hover:border-purple-300 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <SocialLogo
                              platform={post.platforms && post.platforms[0] ? post.platforms[0] : "Instagram"}
                              className="h-9 w-9"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-foreground">
                                {post.caption || post.title || post.campaignName || "Marketing Post"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                <span className="font-semibold text-purple-600">
                                  {post.platforms && post.platforms.length > 0 ? post.platforms.join(", ") : "Multi-Platform"}
                                </span>
                                <span>•</span>
                                <span>{formatDate(post.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                post.publish_status === "published"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {postDisplayStatus(post, post.executionMode)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Platform Distribution (1 Col) */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                  <h2 className="text-base font-bold text-foreground">Channel Distribution</h2>
                  <p className="text-xs text-muted-foreground mb-6">Confirmed publications across social platforms</p>

                  <div className="space-y-5">
                    {platformBreakdown.map((item) => (
                      <div key={item.platform}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-semibold text-foreground flex items-center gap-1.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`}></span>
                            {item.platform}
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {item.count} posts ({item.percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.color} transition-all duration-500`}
                            style={{ width: `${Math.max(item.percentage, 0)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3 text-xs">
                    {campaigns.flatMap(item => item.analytics?.posts || []).map((post, index) => (
                      <div key={`${post.platform}-${post.external_post_id}-${index}`} className="rounded-lg border p-3">
                        <p className="font-semibold">{post.platform} · {post.data_source === "platform_api" ? "Platform API" : "Data unavailable"}</p>
                        <p>Reach: {formatNumber(post.reach)} · Likes: {formatNumber(post.likes)} · Comments: {formatNumber(post.comments)}</p>
                        <p>Impressions: {formatNumber(post.impressions)} · Clicks: {formatNumber(post.clicks)} · Shares: {formatNumber(post.shares)} · Engagement: {post.engagement_rate == null ? "Data unavailable" : `${(post.engagement_rate * 100).toFixed(1)}%`}</p>
                        <p className="text-muted-foreground">{post.last_updated ? `Fetched: ${new Date(post.last_updated).toLocaleString()}` : "No metrics fetched"}</p>
                        {post.unavailable_reason && <p className="text-muted-foreground">{post.unavailable_reason}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                    <p className="font-bold text-foreground flex items-center gap-1.5 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      Available performance data
                    </p>
                    Instagram and Facebook metrics are shown when available. LinkedIn Company Page organic post statistics require approved analytics access and remain lifetime post totals. Google profile metrics use the date range above. Missing permissions or unavailable metrics are reported explicitly.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
