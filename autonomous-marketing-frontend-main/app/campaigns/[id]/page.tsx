"use client";

import {
  use,
  useEffect,
  useMemo,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Eye,
  Facebook,
  Heart,
  Instagram,
  Linkedin,
  Loader2,
  Menu,
  MoreHorizontal,
  Pause,
  Play,
  RefreshCw,
  Sparkles,
  Store,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react";

import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";

import {
  approveCampaignPost,
  cancelCampaign,
  completeCampaign,
  executeCampaign,
  getCampaign,
  getCampaignPosts,
  pauseCampaign,
  rejectCampaignPost,
  resumeCampaign,
  scheduleCampaignPost,
  startCampaign,
  updateCampaignPost,
  type CampaignPostResponse,
  type CampaignResponse,
} from "@/lib/api/campaigns";

import {
  getCampaignAnalytics,
  type CampaignAnalytics,
} from "@/lib/api/analytics";

type CampaignDetailPageProps = {
  params: Promise<{ id: string }>;
};

type LoadState = {
  campaign: CampaignResponse | null;
  posts: CampaignPostResponse[];
  analytics: CampaignAnalytics | null;
};

const EMPTY_STATE: LoadState = {
  campaign: null,
  posts: [],
  analytics: null,
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function statusLabel(status: CampaignResponse["status"]): string {
  switch (status) {
    case "running":
      return "Running";
    case "paused":
      return "Paused";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    case "draft":
    default:
      return "Draft";
  }
}

function reviewStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "pending":
      return "Requires Review";
    default:
      return status;
  }
}

function reviewStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-emerald-100 text-emerald-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-neutral-100 text-neutral-600";
  }
}

function lifecycleStatus(
  campaign: CampaignResponse,
  posts: CampaignPostResponse[],
) {
  const hasPosts = posts.length > 0;
  const hasApprovedPosts = posts.some(
    (post) => post.review_status.toLowerCase() === "approved",
  );

  if (campaign.status === "completed") {
    return [
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
      "completed",
    ] as const;
  }

  if (campaign.status === "cancelled") {
    return [
      "completed",
      hasPosts ? "completed" : "pending",
      "pending",
      "pending",
      "pending",
      "pending",
    ] as const;
  }

  if (campaign.status === "running") {
    return [
      "completed",
      hasPosts ? "completed" : "active",
      hasApprovedPosts ? "completed" : "active",
      "active",
      "pending",
      "pending",
    ] as const;
  }

  if (campaign.status === "paused") {
    return [
      "completed",
      hasPosts ? "completed" : "active",
      hasApprovedPosts ? "completed" : "active",
      "active",
      "pending",
      "pending",
    ] as const;
  }

  return [
    "completed",
    hasPosts ? "completed" : "active",
    hasApprovedPosts ? "completed" : "pending",
    "pending",
    "pending",
    "pending",
  ] as const;
}

export default function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const resolvedParams = use(params);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [state, setState] =
    useState<LoadState>(EMPTY_STATE);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] =
    useState(false);
  const [executingAi, setExecutingAi] =
    useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );

  const campaignId = Number(resolvedParams.id);

  const [editingPost, setEditingPost] =
    useState<CampaignPostResponse | null>(null);

  const [previewImageUrl, setPreviewImageUrl] =
    useState<string | null>(null);

  const [rejectingPost, setRejectingPost] =
    useState<CampaignPostResponse | null>(null);

  const [schedulingPost, setSchedulingPost] =
    useState<CampaignPostResponse | null>(null);

  const [postActionLoading, setPostActionLoading] =
    useState<number | null>(null);

  const [rejectReason, setRejectReason] =
    useState("");

  const [scheduleType, setScheduleType] =
    useState<"delay" | "specific_time">("delay");

  const [delayMinutes, setDelayMinutes] =
    useState("60");

  const [scheduledFor, setScheduledFor] =
    useState("");

  const [postError, setPostError] =
    useState<string | null>(null);


  const loadCampaign = async () => {
    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      setError("Invalid campaign ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [campaign, posts] = await Promise.all([
        getCampaign(campaignId),
        getCampaignPosts(campaignId),
      ]);

      let analytics: CampaignAnalytics | null = null;

      try {
        analytics =
          await getCampaignAnalytics(campaignId);
      } catch {
        /*
         * Analytics may legitimately not exist yet,
         * especially for a newly created campaign.
         */
        analytics = null;
      }

      setState({
        campaign,
        posts,
        analytics,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load this campaign.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCampaign();
    // campaignId is derived from the route and should
    // only trigger loading when the route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const runLifecycleAction = async (
    action: () => Promise<CampaignResponse>,
  ) => {
    try {
      setActionLoading(true);
      setError(null);

      const updatedCampaign = await action();

      setState((current) => ({
        ...current,
        campaign: updatedCampaign,
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update the campaign.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteAi = async () => {
    try {
      setExecutingAi(true);
      setError(null);
      await executeCampaign(campaignId);
      await loadCampaign();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to run AI marketing agents.",
      );
    } finally {
      setExecutingAi(false);
    }
  };

  const handleApprovePost = async (
    post: CampaignPostResponse,
  ) => {
    setPostError(null);
    setPostActionLoading(post.id);

    try {
      await approveCampaignPost(
        post.campaign_id,
        post.id,
      );
      await loadCampaign();
    } catch (err) {
      setPostError(
        err instanceof Error
          ? err.message
          : "Failed to approve post.",
      );
    } finally {
      setPostActionLoading(null);
    }
  };

  const handleRejectPost = async () => {
    if (!rejectingPost) {
      return;
    }

    setPostError(null);
    setPostActionLoading(rejectingPost.id);

    try {
      await rejectCampaignPost(
        rejectingPost.campaign_id,
        rejectingPost.id,
        rejectReason,
      );

      setRejectingPost(null);
      setRejectReason("");
      await loadCampaign();
    } catch (err) {
      setPostError(
        err instanceof Error
          ? err.message
          : "Failed to reject post.",
      );
    } finally {
      setPostActionLoading(null);
    }
  };

  const handleSavePost = async (
    data: Parameters<typeof updateCampaignPost>[2],
  ) => {
    if (!editingPost) {
      return;
    }

    setPostError(null);
    setPostActionLoading(editingPost.id);

    try {
      await updateCampaignPost(
        editingPost.campaign_id,
        editingPost.id,
        data,
      );

      setEditingPost(null);
      await loadCampaign();
    } catch (err) {
      setPostError(
        err instanceof Error
          ? err.message
          : "Failed to update post.",
      );
    } finally {
      setPostActionLoading(null);
    }
  };

  const handleSchedulePost = async () => {
    if (!schedulingPost) {
      return;
    }

    setPostError(null);
    setPostActionLoading(schedulingPost.id);

    try {
      if (scheduleType === "delay") {
        const minutes = Number(delayMinutes);

        if (!Number.isInteger(minutes) || minutes < 1) {
          throw new Error(
            "Delay must be at least 1 minute.",
          );
        }

        await scheduleCampaignPost(
          schedulingPost.campaign_id,
          schedulingPost.id,
          {
            schedule_type: "delay",
            delay_minutes: minutes,
          },
        );
      } else {
        if (!scheduledFor) {
          throw new Error(
            "Please select a date and time.",
          );
        }

        await scheduleCampaignPost(
          schedulingPost.campaign_id,
          schedulingPost.id,
          {
            schedule_type: "specific_time",
            scheduled_for: new Date(
              scheduledFor,
            ).toISOString(),
          },
        );
      }

      setSchedulingPost(null);
      setScheduleType("delay");
      setDelayMinutes("60");
      setScheduledFor("");
      await loadCampaign();
    } catch (err) {
      setPostError(
        err instanceof Error
          ? err.message
          : "Failed to schedule post.",
      );
    } finally {
      setPostActionLoading(null);
    }
  };

  const campaign = state.campaign;
  const posts = state.posts;
  const analytics = state.analytics;

  const lifecycle = useMemo(() => {
    if (!campaign) {
      return [];
    }

    const statuses = lifecycleStatus(
      campaign,
      posts,
    );

    const names = [
      "Strategy",
      "Content Gen",
      "Review",
      "Scheduled",
      "Publishing",
      "Optimization",
    ];

    return names.map((name, index) => ({
      name,
      status: statuses[index],
    }));
  }, [campaign, posts]);

  const platforms = useMemo(() => {
    const uniquePlatforms = new Set<string>();

    for (const post of posts) {
      for (const platform of post.platforms) {
        uniquePlatforms.add(platform);
      }
    }

    return Array.from(uniquePlatforms);
  }, [posts]);

  const approvedPosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.review_status.toLowerCase() ===
          "approved",
      ).length,
    [posts],
  );

  const pendingPosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.review_status.toLowerCase() ===
          "pending",
      ).length,
    [posts],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-950">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-h-screen md:pl-[230px]">
          <MobileHeader
            onOpenMenu={() => setSidebarOpen(true)}
          />

          <div className="flex min-h-[70vh] items-center justify-center px-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2
                size={28}
                className="animate-spin text-neutral-700"
              />
              <p className="text-sm font-medium text-neutral-700">
                Loading campaign...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-white text-neutral-950">
        <DashboardSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="min-h-screen md:pl-[230px]">
          <MobileHeader
            onOpenMenu={() => setSidebarOpen(true)}
          />

          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <XCircle
              size={40}
              className="mx-auto text-red-500"
            />

            <h1 className="mt-4 text-xl font-bold">
              Campaign unavailable
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              {error ||
                "The requested campaign could not be found."}
            </p>

            <Link
              href="/campaigns"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              <ArrowLeft size={15} />
              Back to Campaigns
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const campaignStatus = statusLabel(
    campaign.status,
  );

  const canStart =
    campaign.status === "draft";

  const canPause =
    campaign.status === "running";

  const canResume =
    campaign.status === "paused";

  const canComplete =
    campaign.status === "running" ||
    campaign.status === "paused";

  const canCancel =
    campaign.status !== "completed" &&
    campaign.status !== "cancelled";

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="min-h-screen md:pl-[230px]">
        <MobileHeader
          onOpenMenu={() => setSidebarOpen(true)}
        />

        {/* Desktop Header */}
        <div className="hidden h-16 items-center justify-between border-b border-neutral-200 px-7 md:flex">
          <div className="flex items-center gap-3">
            <Link
              href="/campaigns"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50"
              aria-label="Back to campaigns"
            >
              <ArrowLeft size={16} />
            </Link>

            <div>
              <p className="text-xs text-neutral-500">
                Campaigns / Detail
              </p>

              <p className="text-sm font-medium">
                {campaign.campaign_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={executingAi || actionLoading}
              onClick={() => void handleExecuteAi()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3.5 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 shadow-sm"
            >
              {executingAi ? (
                <Loader2 size={14} className="animate-spin text-neutral-600" />
              ) : (
                <RefreshCw size={14} />
              )}
              {executingAi ? "Running AI Agents..." : "Regenerate Content"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-[1450px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Mobile Back */}
          <div className="mb-4 md:hidden">
            <Link
              href="/campaigns"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600"
            >
              <ArrowLeft size={14} />
              Back to Campaigns
            </Link>
          </div>

          {error && (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-red-800">
                  Campaign action failed
                </p>

                <p className="mt-1 text-xs text-red-700">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}

          {postError && (
            <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div>
                <p className="text-xs font-semibold text-red-800">
                  Post action failed
                </p>
                <p className="mt-1 text-xs text-red-700">
                  {postError}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPostError(null)}
                className="text-red-500 hover:text-red-700"
                aria-label="Dismiss post error"
              >
                ×
              </button>
            </div>
          )}

          {/* Campaign Header */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                    {campaign.campaign_name}
                  </h1>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      campaign.status === "running"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : campaign.status === "paused"
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : campaign.status ===
                              "completed"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : campaign.status ===
                                "cancelled"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-neutral-200 bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {campaignStatus}
                  </span>
                </div>

                <p className="mt-2 max-w-3xl text-sm text-neutral-500">
                  {campaign.execution_mode ===
                  "autonomous"
                    ? "Autonomous campaign execution"
                    : "Human intervention campaign execution"}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                  <span>
                    Created{" "}
                    {formatDate(campaign.created_at)}
                  </span>

                  <span>·</span>

                  <span>
                    Updated{" "}
                    {formatDate(campaign.updated_at)}
                  </span>

                  {campaign.started_at && (
                    <>
                      <span>·</span>
                      <span>
                        Started{" "}
                        {formatDate(
                          campaign.started_at,
                        )}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-4 lg:border-t-0 lg:pt-0">
                {campaign.status !== "cancelled" && campaign.status !== "completed" && (
                  <button
                    type="button"
                    disabled={executingAi || actionLoading}
                    onClick={() => void handleExecuteAi()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 transition"
                  >
                    {executingAi ? (
                      <Loader2 size={16} className="animate-spin text-amber-300" />
                    ) : (
                      <Sparkles size={16} className="text-amber-300" />
                    )}
                    {executingAi ? "Generating Content..." : "⚡ Run AI Agents"}
                  </button>
                )}
                {canStart && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      void runLifecycleAction(
                        () =>
                          startCampaign(
                            campaign.id,
                          ),
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Play size={16} />
                    )}
                    Start Campaign
                  </button>
                )}

                {canPause && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      void runLifecycleAction(
                        () =>
                          pauseCampaign(
                            campaign.id,
                          ),
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Pause size={16} />
                    )}
                    Pause Campaign
                  </button>
                )}

                {canResume && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      void runLifecycleAction(
                        () =>
                          resumeCampaign(
                            campaign.id,
                          ),
                      )
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Play size={16} />
                    )}
                    Resume Campaign
                  </button>
                )}

                {canComplete && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Mark this campaign as completed?",
                        )
                      ) {
                        return;
                      }

                      void runLifecycleAction(
                        () =>
                          completeCampaign(
                            campaign.id,
                          ),
                      );
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    Complete
                  </button>
                )}

                {canCancel && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Cancel this campaign? This action cannot be undone.",
                        )
                      ) {
                        return;
                      }

                      void runLifecycleAction(
                        () =>
                          cancelCampaign(
                            campaign.id,
                          ),
                      );
                    }}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* Lifecycle */}
            <div className="mt-8 border-t border-neutral-100 pt-6">
              <p className="mb-3 text-xs font-medium text-neutral-500">
                Campaign Execution Pipeline
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {lifecycle.map((step, index) => (
                  <div
                    key={step.name}
                    className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-medium ${
                      step.status === "completed"
                        ? "border-emerald-200 bg-emerald-50/50 text-emerald-800"
                        : step.status === "active"
                          ? "border-neutral-950 bg-neutral-950 font-semibold text-white"
                          : "border-neutral-200 bg-neutral-50 text-neutral-400"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle2
                        size={15}
                        className="shrink-0 text-emerald-600"
                      />
                    ) : (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px]">
                        {index + 1}
                      </span>
                    )}

                    <span className="truncate">
                      {step.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Performance Cards */}
          <section className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard
              label="Total Reach"
              value={
                analytics
                  ? formatNumber(
                      analytics.total_reach,
                    )
                  : "—"
              }
              icon={Eye}
            />

            <StatCard
              label="Engagement"
              value={
                analytics
                  ? formatPercentage(
                      analytics.engagement_rate,
                    )
                  : "—"
              }
              icon={Heart}
            />

            <StatCard
              label="Posts"
              value={String(posts.length)}
              icon={CalendarDays}
            />

            <StatCard
              label="Link Clicks"
              value={
                analytics
                  ? formatNumber(
                      analytics.total_clicks,
                    )
                  : "—"
              }
              icon={TrendingUp}
            />

            <StatCard
              label="Conversions"
              value={
                analytics
                  ? formatNumber(
                      analytics.total_conversions,
                    )
                  : "—"
              }
              icon={Zap}
            />
          </section>

          {/* Secondary Analytics */}
          {analytics && (
            <section className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MetricCard
                label="Impressions"
                value={formatNumber(
                  analytics.total_impressions,
                )}
              />

              <MetricCard
                label="Likes"
                value={formatNumber(
                  analytics.total_likes,
                )}
              />

              <MetricCard
                label="Comments"
                value={formatNumber(
                  analytics.total_comments,
                )}
              />

              <MetricCard
                label="CTR"
                value={formatPercentage(
                  analytics.click_through_rate,
                )}
              />
            </section>
          )}

          {/* Main Content */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Posts */}
            <div className="space-y-6 lg:col-span-2">
              <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-neutral-950">
                      Campaign Posts & Content
                    </h2>

                    <p className="text-xs text-neutral-500">
                      Content generated for this campaign
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold text-neutral-600">
                      {posts.length} total
                    </span>

                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                      {approvedPosts} approved
                    </span>

                    {pendingPosts > 0 && (
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                        {pendingPosts} review
                      </span>
                    )}
                  </div>
                </div>

                {posts.length === 0 ? (
                  <div className="mt-6 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
                    <Sparkles
                      size={24}
                      className="mx-auto text-neutral-400"
                    />

                    <p className="mt-3 text-sm font-semibold text-neutral-700">
                      No campaign posts yet
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      Posts will appear here once content
                      has been generated for this campaign.
                    </p>

                    <div className="mt-5">
                      <button
                        type="button"
                        disabled={executingAi || actionLoading}
                        onClick={() => void handleExecuteAi()}
                        className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 transition"
                      >
                        {executingAi ? (
                          <Loader2 size={15} className="animate-spin text-amber-300" />
                        ) : (
                          <Zap size={15} className="text-amber-300" />
                        )}
                        {executingAi ? "Running AI Agents..." : "Run AI Agents & Generate Posts"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {posts.map((post) => (
                      <CampaignPostCard
                        key={post.id}
                        post={post}
                        onEdit={setEditingPost}
                        onPreviewImage={setPreviewImageUrl}
                        onApprove={(selectedPost) => {
                          void handleApprovePost(selectedPost);
                        }}
                        onReject={(selectedPost) => {
                          setRejectingPost(selectedPost);
                          setRejectReason("");
                          setPostError(null);
                        }}
                        onSchedule={(selectedPost) => {
                          setSchedulingPost(selectedPost);
                          setScheduleType("delay");
                          setDelayMinutes("60");
                          setScheduledFor("");
                          setPostError(null);
                        }}
                        actionLoading={
                          postActionLoading === post.id
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Analytics Summary */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp
                    size={18}
                    className="text-neutral-950"
                  />

                  <h2 className="text-base font-semibold text-neutral-950">
                    Performance
                  </h2>
                </div>

                <p className="mt-1 text-xs text-neutral-500">
                  Campaign analytics from connected platforms
                </p>

                {analytics ? (
                  <div className="mt-5 space-y-4">
                    <ProgressMetric
                      label="Average Reach / Post"
                      value={formatNumber(
                        analytics.average_reach_per_post,
                      )}
                    />

                    <ProgressMetric
                      label="Average Impressions / Post"
                      value={formatNumber(
                        analytics.average_impressions_per_post,
                      )}
                    />

                    <ProgressMetric
                      label="Average Engagements / Post"
                      value={formatNumber(
                        analytics.average_engagements_per_post,
                      )}
                    />

                    <ProgressMetric
                      label="Conversion Rate"
                      value={formatPercentage(
                        analytics.conversion_rate,
                      )}
                    />
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl bg-neutral-50 p-4">
                    <p className="text-xs font-medium text-neutral-600">
                      Analytics are not available yet.
                    </p>

                    <p className="mt-1 text-[11px] leading-4 text-neutral-500">
                      Metrics will appear after analytics data
                      is recorded for this campaign.
                    </p>
                  </div>
                )}
              </section>

              {/* Campaign Channels */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-950">
                  Campaign Channels
                </h2>

                <p className="text-xs text-neutral-500">
                  Platforms represented by campaign posts
                </p>

                {platforms.length === 0 ? (
                  <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-xs text-neutral-500">
                    No platforms available yet.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {platforms.map((platform) => (
                      <PlatformRow
                        key={platform}
                        platform={platform}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Campaign Dates */}
              <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={17}
                    className="text-neutral-800"
                  />

                  <h2 className="text-base font-semibold text-neutral-950">
                    Campaign Timeline
                  </h2>
                </div>

                <div className="mt-5 space-y-4">
                  <TimelineRow
                    label="Created"
                    value={formatDateTime(
                      campaign.created_at,
                    )}
                  />

                  <TimelineRow
                    label="Started"
                    value={formatDateTime(
                      campaign.started_at,
                    )}
                  />

                  <TimelineRow
                    label="Paused"
                    value={formatDateTime(
                      campaign.paused_at,
                    )}
                  />

                  <TimelineRow
                    label="Completed"
                    value={formatDateTime(
                      campaign.completed_at,
                    )}
                  />

                  <TimelineRow
                    label="Cancelled"
                    value={formatDateTime(
                      campaign.cancelled_at,
                    )}
                  />
                </div>
              </section>

              {/* End Campaign */}
              {canCancel && (
                <section className="rounded-2xl border border-red-200 bg-red-50/40 p-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-red-700">
                    End Campaign
                  </h3>

                  <p className="mt-1 text-xs text-red-600">
                    Cancel this campaign and stop its lifecycle.
                  </p>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => {
                      if (
                        !window.confirm(
                          "Cancel this campaign? This action cannot be undone.",
                        )
                      ) {
                        return;
                      }

                      void runLifecycleAction(
                        () =>
                          cancelCampaign(
                            campaign.id,
                          ),
                      );
                    }}
                    className="mt-4 h-9 w-full rounded-xl bg-red-600 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Cancelling..."
                      : "Cancel Campaign"}
                  </button>
                </section>
              )}
            </div>
          </div>
        </div>

        {editingPost && (
          <EditPostModal
            post={editingPost}
            loading={
              postActionLoading === editingPost.id
            }
            onClose={() => setEditingPost(null)}
            onSave={handleSavePost}
          />
        )}

        {rejectingPost && (
          <RejectPostModal
            post={rejectingPost}
            reason={rejectReason}
            loading={
              postActionLoading === rejectingPost.id
            }
            onReasonChange={setRejectReason}
            onClose={() => {
              setRejectingPost(null);
              setRejectReason("");
            }}
            onReject={handleRejectPost}
          />
        )}

        {schedulingPost && (
          <SchedulePostModal
            post={schedulingPost}
            scheduleType={scheduleType}
            delayMinutes={delayMinutes}
            scheduledFor={scheduledFor}
            loading={
              postActionLoading === schedulingPost.id
            }
            onScheduleTypeChange={setScheduleType}
            onDelayMinutesChange={setDelayMinutes}
            onScheduledForChange={setScheduledFor}
            onClose={() => {
              setSchedulingPost(null);
              setScheduleType("delay");
              setDelayMinutes("60");
              setScheduledFor("");
            }}
            onSchedule={handleSchedulePost}
          />
        {/* Lightbox Image Preview Modal */}
        {previewImageUrl && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
            onClick={() => setPreviewImageUrl(null)}
          >
            <div
              className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-neutral-950 border border-white/10 shadow-2xl p-2 flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <a
                  href={previewImageUrl}
                  download="ai_campaign_image.png"
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 items-center gap-1.5 px-4 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md transition shadow-md"
                >
                  Download HD Image
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImageUrl(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition shadow-md"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <img
                src={previewImageUrl}
                alt="AI Generated Campaign Visual"
                className="max-h-[82vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MobileHeader({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 md:hidden">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
        >
          <Menu size={19} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-white">
            <Sparkles size={14} />
          </div>

          <span className="text-sm font-semibold">
            Marketing System
          </span>
        </div>
      </div>
    </header>
  );
}

function CampaignPostCard({
  post,
  onEdit,
  onApprove,
  onReject,
  onSchedule,
  onPreviewImage,
  actionLoading,
}: {
  post: CampaignPostResponse;
  onEdit: (post: CampaignPostResponse) => void;
  onApprove: (post: CampaignPostResponse) => void;
  onReject: (post: CampaignPostResponse) => void;
  onSchedule: (post: CampaignPostResponse) => void;
  onPreviewImage?: (url: string) => void;
  actionLoading: boolean;
}) {
  const platforms =
    post.platforms.length > 0
      ? post.platforms.join(", ")
      : "Platform not specified";

  const isPending =
    post.review_status.toLowerCase() === "pending";

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-400">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-900">
              {platforms}
            </span>

            <span className="text-xs text-neutral-500">
              Day {post.day}
            </span>

            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${reviewStatusClass(
                post.review_status,
              )}`}
            >
              {reviewStatusLabel(
                post.review_status,
              )}
            </span>
          </div>

          <h3 className="mt-1 text-sm font-semibold text-neutral-950">
            {post.title}
          </h3>
        </div>

        <details className="relative shrink-0">
          <summary
            className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 [&::-webkit-details-marker]:hidden"
            aria-label={`Post actions for ${post.title}`}
          >
            <MoreHorizontal size={17} />
          </summary>

          <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
            <button
              type="button"
              onClick={() => onEdit(post)}
              disabled={actionLoading}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Edit post
            </button>

            {isPending && (
              <>
                <button
                  type="button"
                  onClick={() => onApprove(post)}
                  disabled={actionLoading}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Approve
                </button>

                <button
                  type="button"
                  onClick={() => onReject(post)}
                  disabled={actionLoading}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => onSchedule(post)}
              disabled={actionLoading}
              className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Schedule
            </button>
          </div>
        </details>
      </div>

      {post.image_url && (
        <div
          onClick={() => onPreviewImage?.(post.image_url!)}
          className="group relative mt-3 cursor-pointer overflow-hidden rounded-xl border border-neutral-200 bg-neutral-950/5 shadow-xs transition hover:border-purple-300 hover:shadow-md"
        >
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full max-h-80 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-lg opacity-0 transition-opacity backdrop-blur-xs group-hover:opacity-100">
              <Eye size={13} /> Click to View Full Image
            </span>
          </div>
        </div>
      )}

      <p className="mt-3 line-clamp-3 text-xs leading-5 text-neutral-600">
        {post.caption}
      </p>

      {post.hashtags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.hashtags.slice(0, 8).map((hashtag) => (
            <span
              key={hashtag}
              className="rounded-md bg-neutral-50 px-2 py-1 text-[10px] text-neutral-500"
            >
              {hashtag.startsWith("#")
                ? hashtag
                : `#${hashtag}`}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-neutral-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span>
            Objective: {post.objective}
          </span>

          <span>·</span>

          <span>
            Pillar: {post.content_pillar}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {actionLoading && (
            <Loader2
              size={14}
              className="animate-spin text-neutral-400"
            />
          )}

          {post.image_url && (
            <a
              href={post.image_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-950"
            >
              View asset
              <ArrowUpRight size={13} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}


function ModalShell({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-5 sm:p-6">
          <div>
            <h2 className="text-base font-bold text-neutral-950">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function EditPostModal({
  post,
  loading,
  onClose,
  onSave,
}: {
  post: CampaignPostResponse;
  loading: boolean;
  onClose: () => void;
  onSave: (
    data: Parameters<typeof updateCampaignPost>[2],
  ) => Promise<void>;
}) {
  const [title, setTitle] = useState(post.title);
  const [caption, setCaption] = useState(post.caption);
  const [hashtags, setHashtags] = useState(
    post.hashtags.join(", "),
  );
  const [callToAction, setCallToAction] = useState(
    post.call_to_action,
  );
  const [visualTheme, setVisualTheme] = useState(
    post.visual_theme,
  );

  return (
    <ModalShell
      title="Edit campaign post"
      description="Update the content fields without changing the campaign lifecycle."
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();

          const normalizedHashtags = hashtags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);

          void onSave({
            title: title.trim(),
            caption: caption.trim(),
            hashtags: normalizedHashtags,
            call_to_action: callToAction.trim(),
            visual_theme: visualTheme.trim(),
          });
        }}
        className="space-y-5 p-5 sm:p-6"
      >
        <div>
          <label
            htmlFor="post-title"
            className="text-xs font-semibold text-neutral-700"
          >
            Title
          </label>
          <input
            id="post-title"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
            required
          />
        </div>

        <div>
          <label
            htmlFor="post-caption"
            className="text-xs font-semibold text-neutral-700"
          >
            Caption
          </label>
          <textarea
            id="post-caption"
            value={caption}
            onChange={(event) =>
              setCaption(event.target.value)
            }
            rows={6}
            className="mt-2 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2.5 text-sm leading-5 outline-none focus:border-neutral-950"
            required
          />
        </div>

        <div>
          <label
            htmlFor="post-hashtags"
            className="text-xs font-semibold text-neutral-700"
          >
            Hashtags
          </label>
          <input
            id="post-hashtags"
            value={hashtags}
            onChange={(event) =>
              setHashtags(event.target.value)
            }
            placeholder="#marketing, #growth"
            className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
          />
          <p className="mt-1.5 text-[11px] text-neutral-400">
            Separate hashtags with commas.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="post-cta"
              className="text-xs font-semibold text-neutral-700"
            >
              Call to action
            </label>
            <input
              id="post-cta"
              value={callToAction}
              onChange={(event) =>
                setCallToAction(event.target.value)
              }
              className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
            />
          </div>

          <div>
            <label
              htmlFor="post-visual-theme"
              className="text-xs font-semibold text-neutral-700"
            >
              Visual theme
            </label>
            <input
              id="post-visual-theme"
              value={visualTheme}
              onChange={(event) =>
                setVisualTheme(event.target.value)
              }
              className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-xl border border-neutral-200 px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-xs font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <Loader2
                size={14}
                className="animate-spin"
              />
            )}
            {loading ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function RejectPostModal({
  post,
  reason,
  loading,
  onReasonChange,
  onClose,
  onReject,
}: {
  post: CampaignPostResponse;
  reason: string;
  loading: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onReject: () => Promise<void>;
}) {
  return (
    <ModalShell
      title="Reject campaign post"
      description={`Reject "${post.title}" and optionally provide feedback for the content workflow.`}
      onClose={onClose}
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div>
          <label
            htmlFor="reject-reason"
            className="text-xs font-semibold text-neutral-700"
          >
            Reason
          </label>

          <textarea
            id="reject-reason"
            value={reason}
            onChange={(event) =>
              onReasonChange(event.target.value)
            }
            rows={5}
            maxLength={5000}
            placeholder="Explain what should be changed..."
            className="mt-2 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2.5 text-sm leading-5 outline-none focus:border-neutral-950"
          />

          <p className="mt-1.5 text-right text-[11px] text-neutral-400">
            {reason.length}/5000
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-xl border border-neutral-200 px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Keep post
          </button>

          <button
            type="button"
            onClick={() => {
              void onReject();
            }}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <Loader2
                size={14}
                className="animate-spin"
              />
            )}
            {loading ? "Rejecting..." : "Reject post"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function SchedulePostModal({
  post,
  scheduleType,
  delayMinutes,
  scheduledFor,
  loading,
  onScheduleTypeChange,
  onDelayMinutesChange,
  onScheduledForChange,
  onClose,
  onSchedule,
}: {
  post: CampaignPostResponse;
  scheduleType: "delay" | "specific_time";
  delayMinutes: string;
  scheduledFor: string;
  loading: boolean;
  onScheduleTypeChange: (
    value: "delay" | "specific_time",
  ) => void;
  onDelayMinutesChange: (value: string) => void;
  onScheduledForChange: (value: string) => void;
  onClose: () => void;
  onSchedule: () => Promise<void>;
}) {
  return (
    <ModalShell
      title="Schedule campaign post"
      description={`Choose when "${post.title}" should be scheduled.`}
      onClose={onClose}
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              onScheduleTypeChange("delay")
            }
            className={`rounded-xl border p-4 text-left transition ${
              scheduleType === "delay"
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <p className="text-xs font-bold">
              After a delay
            </p>
            <p
              className={`mt-1 text-[11px] ${
                scheduleType === "delay"
                  ? "text-neutral-300"
                  : "text-neutral-500"
              }`}
            >
              Schedule relative to now.
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              onScheduleTypeChange("specific_time")
            }
            className={`rounded-xl border p-4 text-left transition ${
              scheduleType === "specific_time"
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
            }`}
          >
            <p className="text-xs font-bold">
              Specific date & time
            </p>
            <p
              className={`mt-1 text-[11px] ${
                scheduleType === "specific_time"
                  ? "text-neutral-300"
                  : "text-neutral-500"
              }`}
            >
              Select the exact scheduled time.
            </p>
          </button>
        </div>

        {scheduleType === "delay" ? (
          <div>
            <label
              htmlFor="delay-minutes"
              className="text-xs font-semibold text-neutral-700"
            >
              Delay in minutes
            </label>

            <input
              id="delay-minutes"
              type="number"
              min={1}
              max={525600}
              value={delayMinutes}
              onChange={(event) =>
                onDelayMinutesChange(
                  event.target.value,
                )
              }
              className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
            />

            <p className="mt-1.5 text-[11px] text-neutral-400">
              Maximum: 365 days.
            </p>
          </div>
        ) : (
          <div>
            <label
              htmlFor="scheduled-for"
              className="text-xs font-semibold text-neutral-700"
            >
              Scheduled date & time
            </label>

            <input
              id="scheduled-for"
              type="datetime-local"
              value={scheduledFor}
              onChange={(event) =>
                onScheduledForChange(
                  event.target.value,
                )
              }
              className="mt-2 h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
            />

            <p className="mt-1.5 text-[11px] text-neutral-400">
              The selected local time will be converted to UTC before sending.
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-10 rounded-xl border border-neutral-200 px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              void onSchedule();
            }}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-xs font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <Loader2
                size={14}
                className="animate-spin"
              />
            )}
            {loading ? "Scheduling..." : "Schedule post"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function PlatformRow({
  platform,
}: {
  platform: string;
}) {
  const normalized = platform.toLowerCase();

  let Icon: ElementType = Store;
  let iconClass = "text-neutral-700";

  if (normalized.includes("linkedin")) {
    Icon = Linkedin;
    iconClass = "text-blue-700";
  } else if (normalized.includes("instagram")) {
    Icon = Instagram;
    iconClass = "text-pink-600";
  } else if (normalized.includes("facebook")) {
    Icon = Facebook;
    iconClass = "text-blue-600";
  } else if (
    normalized.includes("google") ||
    normalized.includes("gmb")
  ) {
    Icon = Store;
    iconClass = "text-emerald-600";
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-100 p-3">
      <div className="flex items-center gap-2.5">
        <Icon
          size={18}
          className={iconClass}
        />

        <span className="text-xs font-semibold text-neutral-900">
          {platform}
        </span>
      </div>

      <span className="text-[10px] font-semibold text-neutral-500">
        Campaign
      </span>
    </div>
  );
}

function TimelineRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-neutral-500">
        {label}
      </span>

      <span className="text-right text-xs font-medium text-neutral-800">
        {value}
      </span>
    </div>
  );
}

function ProgressMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-neutral-500">
        {label}
      </span>

      <span className="text-xs font-bold text-neutral-900">
        {value}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] text-neutral-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-bold tracking-tight text-neutral-950">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ElementType;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">
          {label}
        </p>

        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-50 text-neutral-800">
          <Icon size={16} />
        </div>
      </div>

      <p className="mt-3 text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}