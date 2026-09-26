"use client";

import { useEffect, useMemo, useState } from "react";
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
import { UserAccountMenu } from "@/components/navigation/user-account-menu";
import { SocialLogo } from "@/components/ui/social-logo";
import {
  getCampaigns,
  getCampaignPosts,
  type CampaignResponse,
  type CampaignPostResponse,
} from "@/lib/api/campaigns";
import {
  getCampaignAnalytics,
  type CampaignAnalytics,
} from "@/lib/api/analytics";

type CampaignWithData = {
  campaign: CampaignResponse;
  posts: CampaignPostResponse[];
  analytics: CampaignAnalytics | null;
};

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
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
  const [timeRange, setTimeRange] = useState("All Time");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignWithData[]>([]);

  const loadAnalyticsData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const list = await getCampaigns();
      const detailed = await Promise.all(
        list.map(async (campaign) => {
          const [postsResult, analyticsResult] = await Promise.all([
            getCampaignPosts(campaign.id).catch(() => []),
            getCampaignAnalytics(campaign.id).catch(() => null),
          ]);
          return {
            campaign,
            posts: postsResult,
            analytics: analyticsResult,
          };
        })
      );
      setCampaigns(detailed);
    } catch {
      // Graceful error recovery
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Aggregated Real Stats
  const stats = useMemo(() => {
    let totalReach = 0;
    let totalClicks = 0;
    let publishedPosts = 0;
    let runningCampaigns = 0;

    for (const item of campaigns) {
      if (item.campaign.status === "running") {
        runningCampaigns += 1;
      }
      if (item.analytics) {
        totalReach += item.analytics.total_reach;
        totalClicks += item.analytics.total_clicks;
        publishedPosts += item.analytics.posts.filter((p) => Boolean(p.published_at)).length;
      } else {
        publishedPosts += item.posts.filter((p) => p.review_status === "approved" || p.review_status === "published").length;
      }
    }

    const engagementRate =
      totalReach > 0 ? ((totalClicks / totalReach) * 100).toFixed(1) + "%" : "0.0%";

    return {
      totalReach,
      totalClicks,
      publishedPosts,
      runningCampaigns,
      engagementRate,
      totalCampaigns: campaigns.length,
    };
  }, [campaigns]);

  // Real Top / Recent Posts
  const recentPosts = useMemo(() => {
    return campaigns
      .flatMap((c) =>
        c.posts.map((p) => ({
          ...p,
          campaignName: c.campaign.campaign_name,
        }))
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [campaigns]);

  // Dynamic Platform Breakdown
  const platformBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      Instagram: 0,
      LinkedIn: 0,
      Facebook: 0,
      "Google Business": 0,
    };
    let total = 0;

    for (const c of campaigns) {
      for (const p of c.posts) {
        const plats = p.platforms && p.platforms.length > 0 ? p.platforms : ["Instagram"];
        for (const plat of plats) {
          if (counts[plat] !== undefined) {
            counts[plat] += 1;
          } else {
            counts[plat] = 1;
          }
          total += 1;
        }
      }
    }

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

      <div className="lg:pl-72">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <img
              src="/logo/app logo.png"
              alt="meaeco logo"
              className="h-7 w-7 rounded-lg object-contain"
            />
            <span className="text-base font-bold tracking-tight text-neutral-950">meaeco</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void loadAnalyticsData(true)}
              className="rounded-lg p-2 hover:bg-muted"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <UserAccountMenu />
          </div>
        </header>

        {/* Desktop Header */}
        <div className="hidden h-16 items-center justify-between border-b px-8 lg:flex">
          <div>
            <p className="text-xs text-muted-foreground">Workspace Analytics</p>
            <p className="text-sm font-semibold text-foreground">Performance & Channel Insights</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadAnalyticsData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </button>
            <span className="rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              {timeRange}
            </span>
            <UserAccountMenu />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
                Real-time tracking of audience reach, campaign clicks, and published multi-channel content.
              </p>
            </div>
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-200 transition hover:bg-purple-700"
            >
              <Rocket className="h-4 w-4" />
              Manage Campaigns
            </Link>
          </div>

          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center shadow-xs">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="mt-3 text-sm font-semibold text-foreground">Fetching Live Campaign Analytics...</p>
              <p className="text-xs text-muted-foreground">Aggregating database impressions, reach & clicks</p>
            </div>
          ) : (
            <>
              {/* 4 REAL KPI CARDS */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Reach */}
                <div className="card-3d card-3d-hover p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total Reach
                    </p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {formatNumber(stats.totalReach)}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Across {stats.totalCampaigns} registered campaigns
                  </p>
                </div>

                {/* Total Link Clicks */}
                <div className="card-3d card-3d-hover p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tracked Clicks
                    </p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100/80 text-blue-700">
                      <MousePointerClick className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {formatNumber(stats.totalClicks)}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Engagement rate: {stats.engagementRate}
                  </p>
                </div>

                {/* Posts Published */}
                <div className="card-3d card-3d-hover p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Published Posts
                    </p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-700">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {stats.publishedPosts}
                  </p>
                  <p className="mt-1.5 text-xs text-emerald-700 font-semibold">
                    Live on connected channels
                  </p>
                </div>

                {/* Active Campaigns */}
                <div className="card-3d card-3d-hover p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Running Campaigns
                    </p>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/80 text-amber-700">
                      <Rocket className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-black text-slate-900">
                    {stats.runningCampaigns}
                  </p>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Out of {stats.totalCampaigns} total campaigns
                  </p>
                </div>
              </div>

              {/* RECENT POSTS & PLATFORM BREAKDOWN */}
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Recent Content Activity (2 Cols) */}
                <div className="card-3d p-6 lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Recent Published Content</h2>
                      <p className="text-xs text-slate-500">Content created and published across channels</p>
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
                      <p className="text-sm font-bold text-slate-900">No Campaign Content Yet</p>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        When you launch an autonomous marketing campaign, your generated posts and analytics will populate here automatically.
                      </p>
                      <Link
                        href="/campaigns"
                        className="mt-3 btn-purple-gradient inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition"
                      >
                        Create Your First Campaign
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentPosts.map((post) => (
                        <div
                          key={post.id}
                          className="flex items-center justify-between rounded-xl border border-purple-100/80 bg-white/80 p-3.5 transition hover:border-purple-300 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <SocialLogo
                              platform={post.platforms && post.platforms[0] ? post.platforms[0] : "Instagram"}
                              className="h-9 w-9"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-slate-900">
                                {post.caption || post.title || post.campaignName || "Marketing Post"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
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
                                post.review_status === "approved" || post.review_status === "published"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {post.review_status || "draft"}
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
                  <p className="text-xs text-muted-foreground mb-6">Content share across active social platforms</p>

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

                  <div className="mt-8 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
                    <p className="font-bold text-foreground flex items-center gap-1.5 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      Autonomous Channel Optimization
                    </p>
                    AI continuously analyzes peak engagement hours to auto-schedule posts across your connected platforms.
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
