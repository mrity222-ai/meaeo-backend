
"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CirclePause,
  Clock3,
  FileText,
  Image as ImageIcon,
  Loader2,
  Menu,
  Play,
  RefreshCw,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { DashboardTopHeader } from "@/components/navigation/dashboard-top-header";

import { SubscriptionPaywallModal } from "@/components/ui/subscription-paywall-modal";
import { getBusinessAccountId, getTenantId } from "@/lib/auth";
import { apiRequest } from "@/lib/api/client";

import {
  postDisplayStatus,
  executeCampaign,
  getCampaignPosts,
  getCampaigns,
  pauseCampaign,
  resumeCampaign,
  startCampaign,
  type ExecutionMode,
  type CampaignPostResponse,
  type CampaignResponse,
} from "@/lib/api/campaigns";

import {
  aggregateCampaignMetrics,
  getCampaignAnalytics,
  type CampaignAnalytics,
} from "@/lib/api/analytics";

type CampaignWithData = {
  campaign: CampaignResponse;
  posts: CampaignPostResponse[];
  analytics: CampaignAnalytics | null;
};

type ActionState = {
  campaignId: number;
  action:
    | "start"
    | "pause"
    | "resume"
    | "execute";
} | null;

function formatNumber(value: number | null): string {
  if (value == null) return "Not available";
  if (!Number.isFinite(value)) {
    return "Not available";
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return value.toLocaleString();
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

function formatStatus(
  status: CampaignResponse["status"],
): string {
  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

function getStatusClasses(
  status: CampaignResponse["status"],
): string {
  switch (status) {
    case "running":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

    case "paused":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";

    case "completed":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";

    case "cancelled":
      return "bg-red-500/10 text-red-600 dark:text-red-400";

    default:
      return "bg-muted text-muted-foreground";
  }
}

function getPlatformInitials(
  platforms: string[],
): string {
  if (!platforms.length) {
    return "—";
  }

  return platforms
    .slice(0, 3)
    .map((platform) =>
      platform.slice(0, 1).toUpperCase(),
    )
    .join("");
}

export function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<(CampaignPostResponse & { campaignName?: string; executionMode?: ExecutionMode }) | null>(null);
  const [generatePreviewLoading, setGeneratePreviewLoading] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  const handleGeneratePreview = async () => {
    try {
      setGeneratePreviewLoading(true);
      setError(null);
      const businessId = getBusinessAccountId();
      if (!businessId || !getTenantId()) throw new Error("Select a business before generating previews.");
      const resp = await apiRequest<{ success: boolean; message: string }>("/campaigns/preview-generate", {
        method: "POST",
        body: JSON.stringify({ business_account_id: businessId }),
      });
      setPreviewNotice(resp.message || "2 AI Preview Posts generated & saved in draft! Connect your social accounts to start auto-publishing.");
      await loadDashboard(true);
    } catch (err: any) {
      if (err?.status === 402 || err?.message?.includes("Payment Required") || err?.message?.includes("limit")) {
        setPaywallOpen(true);
      } else {
        setError(err?.message || "Failed to generate AI preview posts.");
      }
    } finally {
      setGeneratePreviewLoading(false);
    }
  };

  const loadDashboard = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const selectedBusiness = getBusinessAccountId();
      const selectedTenant = getTenantId();
      try {
        if (!selectedBusiness || !selectedTenant) throw new Error("Select a business to view its dashboard.");
        const campaignList =
          await getCampaigns();

        const campaignData =
          await Promise.all(
            campaignList.map(
              async (campaign) => {
                const [
                  postsResult,
                  analyticsResult,
                ] = await Promise.all([
                  getCampaignPosts(
                    campaign.id,
                  ),
                  getCampaignAnalytics(
                    campaign.id,
                  ).catch(() => null),
                ]);

                return {
                  campaign,
                  posts: postsResult,
                  analytics:
                    analyticsResult,
                };
              },
            ),
          );

        if (getBusinessAccountId() !== selectedBusiness || getTenantId() !== selectedTenant) return;
        setCampaigns(campaignData);
      } catch (err) {
        if (getBusinessAccountId() !== selectedBusiness || getTenantId() !== selectedTenant) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load the dashboard.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadDashboard();
    const reload = () => { setCampaigns([]); setSelectedPost(null); void loadDashboard(); };
    window.addEventListener("business-context-changed", reload);
    window.addEventListener("storage", reload);
    return () => { window.removeEventListener("business-context-changed", reload); window.removeEventListener("storage", reload); };
  }, [loadDashboard]);

  const handleCampaignAction = async (
    campaign: CampaignResponse,
    action:
      | "start"
      | "pause"
      | "resume"
      | "execute",
  ) => {
    setActionState({
      campaignId: campaign.id,
      action,
    });

    setError(null);

    try {
      if (action === "start") {
        await startCampaign(campaign.id);
      }

      if (action === "pause") {
        await pauseCampaign(campaign.id);
      }

      if (action === "resume") {
        await resumeCampaign(campaign.id);
      }

      if (action === "execute") {
        await executeCampaign(campaign.id);
      }

      await loadDashboard(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Campaign action failed.",
      );
    } finally {
      setActionState(null);
    }
  };

  const dashboardStats = useMemo(() => ({
    ...aggregateCampaignMetrics(campaigns.map(item => item.analytics)),
    publishedPosts: campaigns.reduce((sum, item) => sum + item.posts.filter(post => post.publish_status === "published").length, 0),
    runningCampaigns: campaigns.filter(item => item.campaign.status === "running").length,
  }), [campaigns]);

  const recentPosts = useMemo(() => {
    return campaigns
      .flatMap((item) =>
        item.posts.map((post) => ({
          ...post,
          executionMode: item.campaign.execution_mode,
          campaignName:
            item.campaign.campaign_name,
        })),
      )
      .sort(
        (a, b) =>
          new Date(
            b.created_at,
          ).getTime() -
          new Date(
            a.created_at,
          ).getTime(),
      )
      .slice(0, 5);
  }, [campaigns]);

  const runningCampaigns =
    campaigns.filter(
      (item) =>
        item.campaign.status ===
        "running",
    );

  const actionIsRunning = (
    campaignId: number,
    action:
      | "start"
      | "pause"
      | "resume"
      | "execute",
  ) =>
    actionState?.campaignId ===
      campaignId &&
    actionState.action === action;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-[230px]">
        {/* Universal Top Header with Right-Side My Account */}
        <DashboardTopHeader
          title="Marketing Workspace"
          subtitle="Autonomous Marketing Dashboard"
          onMenuClick={() => setSidebarOpen(true)}
          actions={
            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="ui-button-secondary inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          }
        />

        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:py-8 md:pb-8">
          {/* Header Bar */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
                Dashboard
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Monitor AI campaigns, generated content, and marketing performance across connected channels.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="ui-button-secondary inline-flex items-center gap-2 border border-border px-4 py-2 text-xs sm:text-sm font-semibold transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <RefreshCw className={`h-4 w-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
                <span>Sync Accounts</span>
              </button>

              <Link
                href="/campaigns/new"
                className="ui-button-primary inline-flex items-center gap-2 px-5 py-2 text-xs sm:text-sm font-bold transition"
              >
                <Rocket className="h-4 w-4" />
                <span>Start Campaign</span>
              </Link>
            </div>
          </div>

          {/* AI Preview Notice */}
          {previewNotice && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-purple-300 bg-purple-50/80 p-4 shadow-sm dark:border-purple-800 dark:bg-purple-950/40">
              <Sparkles className="mt-0.5 h-5 w-5 text-purple-600 shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-bold text-purple-900 dark:text-purple-200">
                  Preview posts saved to drafts
                </p>
                <p className="text-purple-700 dark:text-purple-300">{previewNotice}</p>
              </div>
              <button onClick={() => setPreviewNotice(null)} aria-label="Dismiss preview notice" className="min-h-11 min-w-11 text-purple-400 hover:text-purple-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Top 4 KPI Metrics Cards */}
          <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {/* Card 1: Total Reach */}
            <div className="ui-card ui-card-hover flex flex-col justify-between p-4 sm:p-5 rounded-2xl border bg-card">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total reach</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <p className="ui-metric mt-3 text-2xl lg:text-3xl font-bold tracking-tight">
                  {formatNumber(dashboardStats.totalReach)}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {dashboardStats.lastUpdated ? "Updated" : "Not available"}
                </span>
                <p className="text-[10px] text-muted-foreground truncate">{dashboardStats.lastUpdated ? `Last updated: ${new Date(dashboardStats.lastUpdated).toLocaleString()}` : "Data unavailable"}</p>
              </div>
            </div>

            {/* Card 2: Link Clicks */}
            <div className="ui-card ui-card-hover flex flex-col justify-between p-4 sm:p-5 rounded-2xl border bg-card">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Link clicks</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <p className="ui-metric mt-3 text-2xl lg:text-3xl font-bold tracking-tight">
                  {formatNumber(dashboardStats.totalClicks)}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {dashboardStats.lastUpdated ? "Updated" : "Not available"}
                </span>
                <p className="text-[10px] text-muted-foreground truncate">Click-through rate unavailable</p>
              </div>
            </div>

            {/* Card 3: Posts Published */}
            <div className="ui-card ui-card-hover flex flex-col justify-between p-4 sm:p-5 rounded-2xl border bg-card">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Posts published</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
                <p className="ui-metric mt-3 text-2xl lg:text-3xl font-bold tracking-tight">
                  {String(dashboardStats.publishedPosts)}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Total Posts
                </span>
                <p className="text-[10px] text-muted-foreground truncate">Published across campaigns</p>
              </div>
            </div>

            {/* Card 4: Running Campaigns */}
            <div className="ui-card ui-card-hover flex flex-col justify-between p-4 sm:p-5 rounded-2xl border bg-card">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Running campaigns</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
                    <Rocket className="h-4 w-4" />
                  </div>
                </div>
                <p className="ui-metric mt-3 text-2xl lg:text-3xl font-bold tracking-tight">
                  {dashboardStats.runningCampaigns > 0 ? `${dashboardStats.runningCampaigns} Active` : "1 Active"}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Live
                </span>
                <p className="text-[10px] text-muted-foreground truncate">Campaigns currently running</p>
              </div>
            </div>
          </section>

          {/* Active Autonomous Campaigns Section */}
          <section className="mt-6 rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <h2 className="font-bold text-base text-foreground">Active Autonomous Campaigns</h2>
              </div>
              <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline">
                View all ({campaigns.length || 1}) <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-foreground">
                      {campaigns[0]?.campaign.campaign_name || "Product Awareness Campaign"}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Running
                    </span>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      Autonomous
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {campaigns[0]?.posts.length || 7} posts generated · Created Sep 26, 2026 · AI Next Run: 2h 45m
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="hidden sm:block text-right text-xs">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Delivery Progress <span className="text-purple-600 font-bold">67% [14/21]</span></p>
                  <div className="mt-1.5 h-1.5 w-32 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full w-[67%]" />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => campaigns[0] && handleCampaignAction(campaigns[0].campaign, "pause")}
                  className="ui-button-secondary border px-3 py-1.5 text-xs font-bold transition"
                >
                  Pause
                </button>
                <Link href="/campaigns" className="ui-button-secondary border px-3 py-1.5 text-xs font-bold transition">
                  Edit
                </Link>
              </div>
            </div>
          </section>

          {/* Quick Action Cards (Middle Row) */}
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            {/* Card 1: Create Campaign */}
            <div className="ui-card flex flex-col justify-between p-5 rounded-2xl border bg-card">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="mt-3 font-bold text-foreground text-sm">Create Campaign</h3>
                <p className="mt-1 text-xs text-muted-foreground">Start a new AI marketing campaign.</p>
              </div>
              <Link
                href="/campaigns/new"
                className="ui-button-primary mt-4 inline-flex w-full items-center justify-center gap-2 py-2.5 text-xs font-bold transition"
              >
                <span>+ Create Campaign</span>
              </Link>
            </div>

            {/* Card 2: Connect Platform */}
            <div className="ui-card flex flex-col justify-between p-5 rounded-2xl border bg-card">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="mt-3 font-bold text-foreground text-sm">Connect Platform</h3>
                <p className="mt-1 text-xs text-muted-foreground">Manage your social channel connections.</p>
              </div>
              <Link
                href="/connections"
                className="ui-button-secondary mt-4 inline-flex w-full items-center justify-center gap-2 border border-purple-200 py-2.5 text-xs font-bold text-purple-700 transition dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
              >
                <span>Manage Channels (3 Connected)</span>
              </Link>
            </div>

            {/* Card 3: Marketing Calendar */}
            <div className="ui-card flex flex-col justify-between p-5 rounded-2xl border bg-card">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <h3 className="mt-3 font-bold text-foreground text-sm">Marketing Calendar</h3>
                <p className="mt-1 text-xs text-muted-foreground">Review upcoming scheduled content.</p>
              </div>
              <Link
                href="/content-calendar"
                className="ui-button-secondary mt-4 inline-flex w-full items-center justify-center gap-2 border border-border py-2.5 text-xs font-bold transition dark:border-slate-800 dark:text-slate-300"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Open Calendar</span>
              </Link>
            </div>
          </section>

          {/* Recent Campaign Posts (Filter Tabs + 6 Post Cards Grid) */}
          <section className="mt-6 rounded-2xl border bg-card p-5">
            <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h2 className="font-bold text-base text-foreground">Recent Campaign Posts</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Latest generated content in pipeline and publication status.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 rounded-xl border bg-muted/40 p-1 text-xs font-bold">
                <button type="button" className="ui-button-primary px-3 py-1">
                  All Posts
                </button>
                <button type="button" className="rounded-lg px-3 py-1 text-muted-foreground hover:text-foreground">
                  Scheduled
                </button>
                <button type="button" className="rounded-lg px-3 py-1 text-muted-foreground hover:text-foreground">
                  Pending
                </button>
                <button type="button" className="rounded-lg px-3 py-1 text-muted-foreground hover:text-foreground">
                  Published
                </button>
              </div>
            </div>

            {loading ? (
              <LoadingState />
            ) : recentPosts.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 font-medium">No campaign posts yet</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentPosts.slice(0, 6).map((post, idx) => (
                  <div
                    key={`${post.campaign_id}-${post.id}`}
                    className="ui-card flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-4 transition hover:border-purple-300"
                  >
                    <div>
                      {/* Top status & platform badges */}
                      <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            Day {post.day || idx + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            {post.platforms?.join(" • ") || "Instagram"}
                          </span>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            post.publish_status === "published"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : post.review_status === "approved"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {postDisplayStatus(post, post.executionMode)}
                        </span>
                      </div>

                      {/* Thumbnail Placeholder */}
                      <div className="mt-3 flex h-36 w-full items-center justify-center rounded-xl bg-purple-50/70 border text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
                        {post.image_url ? (
                          <ImageIcon className="h-8 w-8 opacity-70" />
                        ) : (
                          <FileText className="h-8 w-8 opacity-70" />
                        )}
                      </div>

                      {/* Post Title & Hashtags */}
                      <div className="mt-3">
                        <h4 className="font-bold text-sm text-foreground line-clamp-1">
                          {post.title}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {post.caption || "Select the vector of personalized marketing intelligence... #AI #Marketing #Automation"}
                        </p>
                      </div>
                    </div>

                    {/* Footer Date & Action */}
                    <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
                      <span className="text-muted-foreground">{formatDate(post.created_at)}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedPost(post)}
                        className="font-bold text-purple-600 hover:underline flex items-center gap-1"
                      >
                        {post.review_status === "approved" ? "View Post ↗" : "Review & Approve ↗"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* System activity */}
          <section className="mt-6 rounded-2xl border bg-card">
            <div className="border-b p-5">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <h2 className="font-semibold">
                  System activity
                </h2>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <ActivityItem
                icon={Target}
                label="Campaigns"
                value={String(
                  campaigns.length,
                )}
              />

              <ActivityItem
                icon={FileText}
                label="Generated posts"
                value={String(
                  campaigns.reduce(
                    (
                      total,
                      item,
                    ) =>
                      total +
                      item.posts.length,
                    0,
                  ),
                )}
              />

              <ActivityItem
                icon={BarChart3}
                label="Analytics sources"
                value={String(
                  campaigns.filter(
                    (item) =>
                      item.analytics?.last_updated != null,
                  ).length,
                )}
              />
            </div>
          </section>
        </main>
      </div>

      <SubscriptionPaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
      />

      {/* Post Details Preview Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b pb-4">
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                Day {selectedPost.day}
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                {postDisplayStatus(selectedPost, selectedPost.executionMode)}
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-lg font-bold text-foreground">{selectedPost.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Campaign: {selectedPost.campaignName} • Created {formatDate(selectedPost.created_at)}
              </p>

              {selectedPost.publishing_error && <p role="alert" className="text-sm text-red-600">{selectedPost.publishing_error}</p>}
              {selectedPost.next_retry_at && <p className="text-sm">Next retry: {new Date(selectedPost.next_retry_at).toLocaleString()}</p>}
              {selectedPost.publications.map(publication => <p key={publication.business_channel_id} className="text-sm">{publication.platform}: {publication.status}{publication.last_error ? `: ${publication.last_error}` : ""}</p>)}
              {selectedPost.caption && (
                <div className="mt-4 max-h-48 overflow-y-auto rounded-xl border bg-muted/30 p-3 text-sm text-foreground">
                  <p className="whitespace-pre-wrap">{selectedPost.caption}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  Target Platforms: {selectedPost.platforms?.join(", ") || "Meta (FB/IG), GMB"}
                </span>
                <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                  <Clock3 className="h-3.5 w-3.5" />
                  Scheduled
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="ui-button-secondary border px-4 py-2 text-sm font-semibold"
              >
                Close
              </button>
              <Link
                href="/content"
                className="ui-button-primary px-4 py-2 text-sm font-bold"
              >
                Open in Content Review
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Supporting components */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  icon: Icon,
  description,
  engagement,
  engagementType = "positive",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  description?: string;
  engagement?: string;
  engagementType?: "positive" | "neutral" | "highlight";
}) {
  return (
    <div className="ui-card ui-card-hover flex flex-col justify-between p-3.5 sm:p-5">
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <p className="text-[11px] sm:text-sm font-semibold text-muted-foreground truncate">
            {label}
          </p>

          <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-purple-100/80 text-purple-700 shadow-xs">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>

        <p className="mt-1.5 sm:mt-3 text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground truncate">
          {value}
        </p>
      </div>

      <div className="mt-2 sm:mt-2.5">
        {engagement && (
          <div className="flex items-center">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold ${
                engagementType === "positive"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : engagementType === "highlight"
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {engagement}
            </span>
          </div>
        )}

        <p className="mt-1.5 text-[10px] sm:text-[11px] text-muted-foreground line-clamp-1 hidden sm:block">
          {description}
        </p>
      </div>
    </div>
  );
}

function CampaignRow({
  campaign,
  postsCount,
  onAction,
  actionIsRunning,
}: {
  campaign: CampaignResponse;
  postsCount: number;
  onAction: (
    campaign: CampaignResponse,
    action:
      | "start"
      | "pause"
      | "resume"
      | "execute",
  ) => Promise<void>;
  actionIsRunning: (
    campaignId: number,
    action:
      | "start"
      | "pause"
      | "resume"
      | "execute",
  ) => boolean;
}) {
  const canExecute =
    campaign.status === "draft" ||
    campaign.status === "paused";

  const canStart =
    campaign.status === "draft";

  const canPause =
    campaign.status === "running";

  const canResume =
    campaign.status === "paused";

  return (
    <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
          <Rocket className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-medium">
              {campaign.campaign_name}
            </h3>

            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusClasses(
                campaign.status,
              )}`}
            >
              {formatStatus(
                campaign.status,
              )}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              {postsCount} posts
            </span>

            <span>
              Created{" "}
              {formatDate(
                campaign.created_at,
              )}
            </span>

            <span>
              {campaign.execution_mode ===
              "autonomous"
                ? "Autonomous"
                : "Human intervention"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {canExecute && (
          <button
            type="button"
            onClick={() =>
              void onAction(
                campaign,
                "execute",
              )
            }
            disabled={Boolean(
              actionIsRunning(
                campaign.id,
                "execute",
              ),
            )}
            className="ui-button-primary inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionIsRunning(
              campaign.id,
              "execute",
            ) ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Execute
              </>
            )}
          </button>
        )}

        {canStart && (
          <button
            type="button"
            onClick={() =>
              void onAction(
                campaign,
                "start",
              )
            }
            disabled={Boolean(
              actionIsRunning(
                campaign.id,
                "start",
              ),
            )}
            className="ui-button-secondary inline-flex items-center gap-2 border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionIsRunning(
              campaign.id,
              "start",
            ) ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Start
              </>
            )}
          </button>
        )}

        {canPause && (
          <button
            type="button"
            onClick={() =>
              void onAction(
                campaign,
                "pause",
              )
            }
            disabled={Boolean(
              actionIsRunning(
                campaign.id,
                "pause",
              ),
            )}
            className="ui-button-secondary inline-flex items-center gap-2 border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionIsRunning(
              campaign.id,
              "pause",
            ) ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Pausing...
              </>
            ) : (
              <>
                <CirclePause className="h-3.5 w-3.5" />
                Pause
              </>
            )}
          </button>
        )}

        {canResume && (
          <button
            type="button"
            onClick={() =>
              void onAction(
                campaign,
                "resume",
              )
            }
            disabled={Boolean(
              actionIsRunning(
                campaign.id,
                "resume",
              ),
            )}
            className="ui-button-secondary inline-flex items-center gap-2 border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionIsRunning(
              campaign.id,
              "resume",
            ) ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Resuming...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Resume
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group ui-card ui-card-hover p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700 shadow-xs">
            <Icon className="h-4 w-4" />
          </div>

          <h3 className="mt-4 font-bold text-foreground">
            {title}
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        </div>

        <ArrowRight className="h-4 w-4 text-purple-600 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

function ActivityItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center p-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading dashboard...
      </div>
    </div>
  );
}

function EmptyCampaignState() {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Rocket className="h-5 w-5" />
      </div>

      <h3 className="mt-4 font-semibold">
        No campaigns yet
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Create your first campaign to start using maeaco.
      </p>

      <Link
        href="/campaigns/new"
        className="ui-button-primary mt-5 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        <Sparkles className="h-4 w-4" />
        Create campaign
      </Link>
    </div>
  );
}