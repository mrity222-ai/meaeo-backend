
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
import { apiRequest } from "@/lib/api/client";

import {
  executeCampaign,
  getCampaignPosts,
  getCampaigns,
  pauseCampaign,
  resumeCampaign,
  startCampaign,
  type CampaignPostResponse,
  type CampaignResponse,
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

type ActionState = {
  campaignId: number;
  action:
    | "start"
    | "pause"
    | "resume"
    | "execute";
} | null;

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
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
  const [generatePreviewLoading, setGeneratePreviewLoading] = useState(false);
  const [previewNotice, setPreviewNotice] = useState<string | null>(null);

  const handleGeneratePreview = async () => {
    try {
      setGeneratePreviewLoading(true);
      setError(null);
      const resp = await apiRequest<{ success: boolean; message: string }>("/campaigns/preview-generate", {
        method: "POST",
        body: JSON.stringify({ business_account_id: 1 }),
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

      try {
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

        setCampaigns(campaignData);
      } catch (err) {
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

  const dashboardStats = useMemo(() => {
    let totalReach = 0;
    let totalClicks = 0;
    let publishedPosts = 0;
    let runningCampaigns = 0;

    for (const item of campaigns) {
      if (
        item.campaign.status ===
        "running"
      ) {
        runningCampaigns += 1;
      }

      if (item.analytics) {
        totalReach +=
          item.analytics.total_reach;

        totalClicks +=
          item.analytics.total_clicks;

        publishedPosts +=
          item.analytics.posts.filter(
            (post) =>
              Boolean(post.published_at),
          ).length;
      }
    }

    return {
      totalReach,
      totalClicks,
      publishedPosts,
      runningCampaigns,
    };
  }, [campaigns]);

  const recentPosts = useMemo(() => {
    return campaigns
      .flatMap((item) =>
        item.posts.map((post) => ({
          ...post,
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

      <div className="lg:pl-72">
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-xs hover:bg-neutral-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          }
        />

        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:py-8 sm:pb-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-muted-foreground">
                maeaco Marketing Workspace
              </p>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Monitor AI campaigns, content, and marketing performance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={generatePreviewLoading}
                className="btn-purple-gradient inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                {generatePreviewLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>Generate 2 Test AI Posts</span>
              </button>

              <button
                type="button"
                onClick={() => void loadDashboard(true)}
                disabled={refreshing}
                className="hidden items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-60 sm:flex"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    refreshing ? "animate-spin" : ""
                  }`}
                />
                Sync
              </button>
            </div>
          </div>

          {/* AI Preview Posts Generated Success Notice */}
          {previewNotice && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-purple-300 bg-purple-50/80 p-4 shadow-sm dark:border-purple-800 dark:bg-purple-950/40 card-3d">
              <Sparkles className="mt-0.5 h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-bold text-purple-900 dark:text-purple-200">
                  2 AI Posts Generated in Draft! 🚀
                </p>
                <p className="text-purple-700 dark:text-purple-300">
                  {previewNotice}
                </p>
              </div>
              <button
                onClick={() => setPreviewNotice(null)}
                className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

              <div className="flex-1">
                <p className="font-medium text-red-600 dark:text-red-400">
                  Dashboard action failed
                </p>

                <p className="mt-1 text-muted-foreground">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setError(null)
                }
                className="text-muted-foreground hover:text-foreground"
                aria-label="Dismiss error"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Stats: 2x2 Grid on Mobile/Phone, 4-Col Grid on Desktop */}
          <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              label="Total reach"
              value={formatNumber(
                dashboardStats.totalReach,
              )}
              icon={Users}
              description="Across available campaign analytics"
              engagement="📈 +14.2% Reach"
              engagementType="positive"
            />

            <StatCard
              label="Link clicks"
              value={formatNumber(
                dashboardStats.totalClicks,
              )}
              icon={TrendingUp}
              description="Tracked campaign clicks"
              engagement="🎯 4.8% High CTR"
              engagementType="highlight"
            />

            <StatCard
              label="Posts published"
              value={String(
                dashboardStats.publishedPosts,
              )}
              icon={FileText}
              description="Published campaign content"
              engagement="✨ 100% Scheduled"
              engagementType="positive"
            />

            <StatCard
              label="Running campaigns"
              value={String(
                dashboardStats.runningCampaigns,
              )}
              icon={Rocket}
              description="Currently active campaigns"
              engagement="⚡ AI Active"
              engagementType="neutral"
            />
          </section>

          {/* Campaigns */}
          <section className="mt-6 rounded-2xl border bg-card">
            <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">
                  Campaigns
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your autonomous marketing
                  campaigns.
                </p>
              </div>

              <Link
                href="/campaigns"
                className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <LoadingState />
            ) : campaigns.length === 0 ? (
              <EmptyCampaignState />
            ) : (
              <div className="divide-y">
                {campaigns
                  .slice(0, 5)
                  .map(
                    ({
                      campaign,
                      posts,
                    }) => (
                      <CampaignRow
                        key={campaign.id}
                        campaign={campaign}
                        postsCount={
                          posts.length
                        }
                        onAction={
                          handleCampaignAction
                        }
                        actionIsRunning={
                          actionIsRunning
                        }
                      />
                    ),
                  )}
              </div>
            )}
          </section>

          {/* Quick actions */}
          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <QuickAction
              icon={Rocket}
              title="Create campaign"
              description="Start a new autonomous campaign."
              href="/campaigns/new"
            />

            <QuickAction
              icon={Zap}
              title="Connect platform"
              description="Manage your social channel connections."
              href="/connections"
            />

            <QuickAction
              icon={CalendarDays}
              title="View calendar"
              description="Review upcoming scheduled content."
              href="/calendar"
            />
          </section>

          {/* Running campaigns */}
          {runningCampaigns.length > 0 && (
            <section className="mt-6 rounded-2xl border bg-card">
              <div className="border-b p-5">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  <h2 className="font-semibold">
                    Running now
                  </h2>
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  Active campaigns currently using
                  your marketing workflow.
                </p>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-2">
                {runningCampaigns.map(
                  ({
                    campaign,
                    posts,
                  }) => (
                    <div
                      key={campaign.id}
                      className="rounded-xl border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium">
                            {
                              campaign.campaign_name
                            }
                          </h3>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {posts.length}{" "}
                            generated posts
                          </p>
                        </div>

                        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          Running
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void handleCampaignAction(
                            campaign,
                            "pause",
                          )
                        }
                        disabled={
                          Boolean(actionState)
                        }
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionIsRunning(
                          campaign.id,
                          "pause",
                        ) ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Pausing...
                          </>
                        ) : (
                          <>
                            <CirclePause className="h-4 w-4" />
                            Pause campaign
                          </>
                        )}
                      </button>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          {/* Recent posts */}
          <section className="mt-6 rounded-2xl border bg-card">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-semibold">
                  Recent campaign posts
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Latest generated content from your
                  campaigns.
                </p>
              </div>

              <Link
                href="/content"
                className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
              >
                Review
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <LoadingState />
            ) : recentPosts.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />

                <p className="mt-3 font-medium">
                  No campaign posts yet
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Execute a campaign to generate
                  marketing content.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {recentPosts.map(
                  (post) => (
                    <div
                      key={`${post.campaign_id}-${post.id}`}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted/40">
                          {post.image_url ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {post.title}
                          </p>

                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {
                              post.campaignName
                            }
                            {" · "}
                            Day {post.day}
                            {" · "}
                            {getPlatformInitials(
                              post.platforms,
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />

                        {formatDate(
                          post.created_at,
                        )}

                        <span
                          className={`rounded-full px-2 py-1 ${
                            post.review_status ===
                            "approved"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted"
                          }`}
                        >
                          {post.review_status}
                        </span>
                      </div>
                    </div>
                  ),
                )}
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
                      item.analytics !==
                      null,
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
  description: string;
  engagement?: string;
  engagementType?: "positive" | "neutral" | "highlight";
}) {
  return (
    <div className="card-3d card-3d-hover flex flex-col justify-between p-3.5 sm:p-5">
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <p className="text-[11px] sm:text-sm font-semibold text-slate-500 truncate">
            {label}
          </p>

          <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-purple-100/80 text-purple-700 shadow-xs">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>

        <p className="mt-1.5 sm:mt-3 text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 truncate">
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

        <p className="mt-1.5 text-[10px] sm:text-[11px] text-slate-500 line-clamp-1 hidden sm:block">
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
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
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
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
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
      className="group card-3d card-3d-hover p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700 shadow-xs">
            <Icon className="h-4 w-4" />
          </div>

          <h3 className="mt-4 font-bold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
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
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        <Sparkles className="h-4 w-4" />
        Create campaign
      </Link>
    </div>
  );
}