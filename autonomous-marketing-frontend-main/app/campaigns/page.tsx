/* Below file is app/campaigns/page.tsx */


"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Ellipsis,
  Loader2,
  Menu,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { DashboardTopHeader } from "@/components/navigation/dashboard-top-header";
import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { UserAccountMenu } from "@/components/navigation/user-account-menu";
import { getBusinessAccountId } from "@/lib/auth";
import {
  cancelCampaign,
  completeCampaign,
  getCampaignPosts,
  getCampaigns,
  pauseCampaign,
  resumeCampaign,
  runCampaign,
  startCampaign,
  type CampaignPostResponse,
  type CampaignResponse,
} from "@/lib/api/campaigns";

import {
  aggregateCampaignMetrics,
  getCampaignAnalytics,
  type CampaignAnalytics,
} from "@/lib/api/analytics";

type CampaignItem = {
  campaign: CampaignResponse;
  posts: CampaignPostResponse[];
  analytics: CampaignAnalytics | null;
};

type Filter =
  | "all"
  | "running"
  | "paused"
  | "draft"
  | "completed"
  | "cancelled";

export default function CampaignsPage() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [campaigns, setCampaigns] =
    useState<CampaignItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [filter, setFilter] =
    useState<Filter>("all");

  const [search, setSearch] =
    useState("");

  const [actionCampaignId, setActionCampaignId] =
    useState<number | null>(null);

  const [createOpen, setCreateOpen] =
    useState(false);

  const [createLoading, setCreateLoading] =
    useState(false);

  const [createError, setCreateError] =
    useState<string | null>(null);

  async function loadCampaigns() {
    try {
      setLoading(true);
      setError(null);

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
                analytics: analyticsResult,
              };
            },
          ),
        );

      setCampaigns(campaignData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load campaigns.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCampaigns();
  }, []);

  const filteredCampaigns =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return campaigns.filter(
        ({ campaign }) => {
          const matchesFilter =
            filter === "all" ||
            campaign.status === filter;

          const matchesSearch =
            normalizedSearch.length === 0 ||
            campaign.campaign_name
              .toLowerCase()
              .includes(
                normalizedSearch,
              );

          return (
            matchesFilter &&
            matchesSearch
          );
        },
      );
    }, [
      campaigns,
      filter,
      search,
    ]);

  const stats = useMemo(() => {
    const activeCampaigns =
      campaigns.filter(
        ({ campaign }) =>
          campaign.status === "running",
      ).length;

    const campaignsWithAnalytics =
      campaigns.filter(
        ({ analytics }) =>
          analytics !== null,
      );

    const metrics = aggregateCampaignMetrics(campaigns.map(item => item.analytics));
    const totalReach = metrics.totalReach;
    const totalPublishedPosts = campaigns.reduce((sum, item) => sum + item.posts.filter(post => post.publish_status === "published").length, 0);
    const rates = campaigns.map(item => item.analytics?.engagement_rate);
    const averageEngagement = rates.length && rates.every(value => value != null)
      ? rates.reduce<number>((sum, value) => sum + (value ?? 0), 0) / rates.length : null;

    return {
      activeCampaigns,
      totalReach,
      totalPublishedPosts,
      averageEngagement,
    };
  }, [campaigns]);

  async function handleCreateCampaign(
    userInput: string,
    brandName: string,
  ) {
    try {
      setCreateLoading(true);
      setCreateError(null);
      setError(null);

      const businessAccountId = getBusinessAccountId();

      if (!businessAccountId) {
        throw new Error(
          "No business account is selected. Please complete onboarding first.",
        );
      }

      const result = await runCampaign({
        business_account_id: businessAccountId,
        user_input: userInput.trim(),
        brand_name: brandName.trim() || null,
      });

      if (
        result.status !== "completed" &&
        result.status !== "success" &&
        result.status !== "running"
      ) {
        const detail =
          result.errors.length > 0
            ? result.errors.join(" ")
            : "Campaign generation did not complete successfully.";
        throw new Error(detail);
      }

      setCreateOpen(false);
      await loadCampaigns();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Unable to create campaign.",
      );
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleLifecycleAction(
    campaign: CampaignResponse,
    action:
      | "start"
      | "pause"
      | "resume"
      | "complete"
      | "cancel",
  ) {
    try {
      setActionCampaignId(
        campaign.id,
      );
      setError(null);

      if (action === "start") {
        await startCampaign(
          campaign.id,
        );
      } else if (
        action === "pause"
      ) {
        await pauseCampaign(
          campaign.id,
        );
      } else if (
        action === "resume"
      ) {
        await resumeCampaign(
          campaign.id,
        );
      } else if (
        action === "complete"
      ) {
        await completeCampaign(
          campaign.id,
        );
      } else {
        await cancelCampaign(
          campaign.id,
        );
      }

      await loadCampaigns();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update campaign.",
      );
    } finally {
      setActionCampaignId(
        null,
      );
    }
  }

  return (
    <div className="min-h-screen bg-card text-[#09090b]">
      <DashboardSidebar
        open={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <main className="min-h-screen md:pl-[230px]">
        <DashboardTopHeader title="Campaigns" subtitle="Manage your marketing campaigns" onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content */}
        <div className="mx-auto max-w-[1450px] px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 sm:px-6 lg:px-7 lg:py-8">
          {/* Heading */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-[#71717a]">
                Workspace
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Campaigns
              </h1>

              <p className="mt-2 max-w-xl text-sm text-[#71717a]">
                Create, manage, and monitor your
                autonomous marketing campaigns.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setCreateOpen(true);
              }}
              className="ui-button-primary inline-flex h-10 items-center justify-center gap-2 px-5 text-sm font-semibold transition"
            >
              <Plus size={17} />
              Create campaign
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Something went wrong
                </p>

                <p className="mt-1 text-xs text-red-700">
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadCampaigns()
                }
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-200 bg-card px-3 py-2 text-xs font-medium text-red-800 hover:bg-red-100"
              >
                Try again
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard
              label="Active campaigns"
              value={String(
                stats.activeCampaigns,
              )}
              change={`${campaigns.length} total`}
            />

            <StatCard
              label="Total reach"
              value={formatNumber(
                stats.totalReach,
              )}
              change={
                stats.totalReach != null
                  ? "From available analytics"
                  : "No analytics yet"
              }
            />

            <StatCard
              label="Engagement"
              value={formatPercentage(stats.averageEngagement)}
              change={stats.averageEngagement != null ? "Average campaign rate" : "Data unavailable"}
            />

            <StatCard
              label="Posts published"
              value={String(
                stats.totalPublishedPosts,
              )}
              change={
                stats.totalPublishedPosts >
                0
                  ? "From publishing status"
                  : "No published posts yet"
              }
            />
          </div>

          {/* Filters */}
          <div className="mt-7 flex flex-col gap-3 border-b border-[#e4e4e7] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 overflow-x-auto">
              <FilterButton
                active={filter === "all"}
                label="All campaigns"
                onClick={() =>
                  setFilter("all")
                }
              />

              <FilterButton
                active={
                  filter === "running"
                }
                label="Running"
                onClick={() =>
                  setFilter("running")
                }
              />

              <FilterButton
                active={
                  filter === "paused"
                }
                label="Paused"
                onClick={() =>
                  setFilter("paused")
                }
              />

              <FilterButton
                active={
                  filter === "draft"
                }
                label="Drafts"
                onClick={() =>
                  setFilter("draft")
                }
              />

              <FilterButton
                active={
                  filter === "completed"
                }
                label="Completed"
                onClick={() =>
                  setFilter("completed")
                }
              />
            </div>

            <div className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#e4e4e7] px-3 text-sm text-[#52525b]">
              <Search size={15} />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search campaigns"
                aria-label="Search campaigns"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#a1a1aa] sm:w-48"
              />
            </div>
          </div>

          {/* Campaign List */}
          <div className="mt-5 space-y-4">
            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-[#e4e4e7]">
                <div className="flex items-center gap-2 text-sm text-[#71717a]">
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Loading campaigns...
                </div>
              </div>
            ) : filteredCampaigns.length ===
              0 ? (
              <EmptyCampaignState
                hasCampaigns={
                  campaigns.length > 0
                }
                search={search}
                onClear={() => {
                  setSearch("");
                  setFilter("all");
                }}
                onCreateCampaign={() => {
                  setCreateError(null);
                  setCreateOpen(true);
                }}
              />
            ) : (
              filteredCampaigns.map(
                (item) => (
                  <CampaignCard
                    key={
                      item.campaign.id
                    }
                    item={item}
                    actionCampaignId={
                      actionCampaignId
                    }
                    onLifecycleAction={
                      handleLifecycleAction
                    }
                  />
                ),
              )
            )}
          </div>

          {/* AI Banner */}
          <section className="mt-7 rounded-xl border border-[#e4e4e7] bg-[#fafafa] p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#09090b] text-white">
                  <Sparkles size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold">
                    Let AI build your next campaign
                  </h2>

                  <p className="mt-1 max-w-xl text-sm text-[#71717a]">
                    maeaco can create the strategy, content, schedule,
                    and optimization plan automatically.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCreateError(null);
                  setCreateOpen(true);
                }}
                className="ui-button-secondary inline-flex h-9 shrink-0 items-center justify-center gap-2 border border-[#d4d4d8] px-3 text-sm font-medium"
              >
                Create campaign
                <ArrowUpRight size={15} />
              </button>
            </div>
          </section>
        </div>
      </main>

      {createOpen && (
        <CreateCampaignModal
          loading={createLoading}
          error={createError}
          onClose={() => {
            if (!createLoading) {
              setCreateOpen(false);
              setCreateError(null);
            }
          }}
          onSubmit={handleCreateCampaign}
        />
      )}
    </div>
  );
}

function CreateCampaignModal({
  loading,
  error,
  onClose,
  onSubmit,
}: {
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (
    userInput: string,
    brandName: string,
  ) => Promise<void>;
}) {
  const [brandName, setBrandName] =
    useState("");
  const [userInput, setUserInput] =
    useState("");

  const canSubmit =
    !loading && userInput.trim().length >= 10;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-campaign-title"
    >
      <div className="w-full max-w-xl rounded-2xl border border-[#e4e4e7] bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#e4e4e7] p-5 sm:p-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#71717a]">
              AI campaign builder
            </p>
            <h2
              id="create-campaign-title"
              className="mt-1 text-xl font-semibold tracking-tight"
            >
              Create a campaign
            </h2>
            <p className="mt-1 max-w-md text-sm text-[#71717a]">
              Describe the outcome you want. maeaco will build the campaign from your business onboarding context.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close create campaign dialog"
            className="rounded-lg p-2 text-[#71717a] hover:bg-[#f4f4f5] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) {
              void onSubmit(
                userInput,
                brandName,
              );
            }
          }}
          className="space-y-5 p-5 sm:p-6"
        >
          <div>
            <label
              htmlFor="campaign-brand-name"
              className="text-sm font-medium"
            >
              Brand name
              <span className="ml-1 text-[#a1a1aa]">
                (optional)
              </span>
            </label>

            <input
              id="campaign-brand-name"
              value={brandName}
              onChange={(event) =>
                setBrandName(event.target.value)
              }
              placeholder="e.g. Beyond Stories"
              disabled={loading}
              className="mt-2 h-11 w-full rounded-lg border border-[#d4d4d8] px-3 text-sm outline-none transition focus:border-[#71717a] focus:ring-2 focus:ring-[#e4e4e7] disabled:bg-[#fafafa]"
            />
          </div>

          <div>
            <label
              htmlFor="campaign-user-input"
              className="text-sm font-medium"
            >
              What should this campaign achieve?
            </label>

            <textarea
              id="campaign-user-input"
              value={userInput}
              onChange={(event) =>
                setUserInput(event.target.value)
              }
              placeholder="Example: Promote our new summer collection, increase Instagram engagement, and drive more visitors to our website."
              rows={6}
              disabled={loading}
              className="mt-2 w-full resize-none rounded-lg border border-[#d4d4d8] p-3 text-sm leading-6 outline-none transition focus:border-[#71717a] focus:ring-2 focus:ring-[#e4e4e7] disabled:bg-[#fafafa]"
            />

            <p className="mt-1.5 text-xs text-[#a1a1aa]">
              Give the AI a clear objective, audience, offer, product, or promotion if relevant.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-medium text-red-800">
                Campaign creation failed
              </p>
              <p className="mt-1 text-xs leading-5 text-red-700">
                {error}
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="ui-button-secondary inline-flex h-10 items-center justify-center border border-[#d4d4d8] px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#09090b] px-4 text-sm font-medium text-white hover:bg-[#27272a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}
              {loading
                ? "Building campaign..."
                : "Generate campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="ui-card ui-card-hover p-4 sm:p-5">
      <p className="text-xs font-semibold text-muted-foreground sm:text-sm">
        {label}
      </p>

      <p className="mt-1 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
        {value}
      </p>

      <div className="mt-2 flex items-center gap-1 text-xs text-purple-600 font-medium">
        <TrendingUp size={13} />
        {change}
      </div>
    </div>
  );
}

function FilterButton({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${
        active
          ? "ui-nav-active"
          : "bg-purple-50/60 text-purple-700 hover:bg-purple-100/70"
      }`}
    >
      {label}
    </button>
  );
}

function CampaignCard({
  item,
  actionCampaignId,
  onLifecycleAction,
}: {
  item: CampaignItem;
  actionCampaignId: number | null;
  onLifecycleAction: (
    campaign: CampaignResponse,
    action:
      | "start"
      | "pause"
      | "resume"
      | "complete"
      | "cancel",
  ) => Promise<void>;
}) {
  const {
    campaign,
    posts,
    analytics,
  } = item;

  const isRunning =
    campaign.status === "running";

  const isPaused =
    campaign.status === "paused";

  const isDraft =
    campaign.status === "draft";

  const isCompleted =
    campaign.status ===
    "completed";

  const isCancelled =
    campaign.status ===
    "cancelled";

  const isActing =
    actionCampaignId ===
    campaign.id;

  const reach =
    analytics?.total_reach ?? null;

  const engagementRate =
    analytics?.engagement_rate ?? null;

  return (
    <article className="rounded-xl border border-[#e4e4e7] bg-card p-4 transition hover:border-[#a1a1aa] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold sm:text-lg">
              {campaign.campaign_name}
            </h2>

            <span
              className={`rounded-full px-2 py-1 text-[11px] font-medium ${statusClasses(
                campaign.status,
              )}`}
            >
              {formatStatus(
                campaign.status,
              )}
            </span>
          </div>

          <p className="mt-1 text-sm text-[#71717a]">
            {formatExecutionMode(
              campaign.execution_mode,
            )}
          </p>
        </div>

        <button
          type="button"
          aria-label={`More options for ${campaign.campaign_name}`}
          className="self-end rounded-lg p-2 text-[#71717a] hover:bg-[#f4f4f5] sm:self-auto"
        >
          <Ellipsis size={19} />
        </button>
      </div>

      {/* Campaign content summary */}
      <div className="mt-5 rounded-lg bg-[#fafafa] p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[#71717a]">
            Campaign content
          </span>

          <span className="text-sm font-medium">
            {posts.length}{" "}
            {posts.length === 1
              ? "post"
              : "posts"}
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f4f4f5]">
          <div className="h-full w-full rounded-full bg-[#09090b]" />
        </div>

        <p className="mt-2 text-[11px] text-[#71717a]">
          Content currently stored for this
          campaign.
        </p>
      </div>

      {/* Details */}
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#f0f0f1] pt-4 sm:grid-cols-4">
        <Detail
          label="Reach"
          value={
            formatNumber(reach)
          }
        />

        <Detail
          label="Engagement"
          value={
            formatPercentage(engagementRate)
          }
        />

        <Detail
          label="Posts"
          value={String(
            posts.length,
          )}
        />

        <Detail
          label="Created"
          value={formatDate(
            campaign.created_at,
          )}
        />
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-2 border-t border-[#f0f0f1] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="ui-button-secondary inline-flex items-center justify-center gap-2 border border-[#e4e4e7] px-3 py-2 text-sm font-medium"
        >
          View campaign
          <ChevronRight size={15} />
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-1">
          {isRunning && (
            <LifecycleButton
              disabled={isActing}
              onClick={() =>
                void onLifecycleAction(
                  campaign,
                  "pause",
                )
              }
              icon={
                isActing ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <CirclePause size={15} />
                )
              }
            >
              Pause
            </LifecycleButton>
          )}

          {isPaused && (
            <LifecycleButton
              disabled={isActing}
              onClick={() =>
                void onLifecycleAction(
                  campaign,
                  "resume",
                )
              }
              icon={
                isActing ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <CirclePlay size={15} />
                )
              }
            >
              Resume
            </LifecycleButton>
          )}

          {isDraft && (
            <LifecycleButton
              disabled={isActing}
              onClick={() =>
                void onLifecycleAction(
                  campaign,
                  "start",
                )
              }
              icon={
                isActing ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <CirclePlay size={15} />
                )
              }
            >
              Start campaign
            </LifecycleButton>
          )}

          {isRunning || isPaused ? (
            <LifecycleButton
              disabled={isActing}
              onClick={() =>
                void onLifecycleAction(
                  campaign,
                  "complete",
                )
              }
              icon={
                isActing ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : undefined
              }
            >
              Complete
            </LifecycleButton>
          ) : null}

          {isCompleted && (
            <span className="px-3 py-2 text-xs text-[#71717a]">
              Completed
            </span>
          )}

          {isCancelled && (
            <span className="px-3 py-2 text-xs text-[#71717a]">
              Cancelled
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function LifecycleButton({
  children,
  onClick,
  disabled,
  icon,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[#52525b] hover:bg-[#f4f4f5] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
      {children}
    </button>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-[#a1a1aa]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

function EmptyCampaignState({
  hasCampaigns,
  search,
  onClear,
  onCreateCampaign,
}: {
  hasCampaigns: boolean;
  search: string;
  onClear: () => void;
  onCreateCampaign: () => void;
}) {
  if (hasCampaigns || search) {
    return (
      <div className="rounded-xl border border-[#e4e4e7] px-5 py-12 text-center">
        <p className="text-sm font-semibold">
          No campaigns match your filters
        </p>

        <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#71717a]">
          Try another search term or select a
          different campaign status.
        </p>

        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-lg bg-[#09090b] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#27272a]"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e4e4e7] px-5 py-12 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#09090b] text-white">
        <Sparkles size={18} />
      </div>

      <p className="mt-4 text-sm font-semibold">
        No campaigns yet
      </p>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#71717a]">
        Create your first campaign to start
        generating autonomous marketing content.
      </p>

      <button
        type="button"
        onClick={onCreateCampaign}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#09090b] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#27272a]"
      >
        <Plus size={13} />
        Create campaign
      </button>
    </div>
  );
}

function formatNumber(
  value: number | null,
): string {
  if (value == null) return "Data unavailable";
  if (!Number.isFinite(value)) {
    return "0";
  }

  if (value >= 1_000_000) {
    return `${(
      value / 1_000_000
    ).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(
      value / 1_000
    ).toFixed(1)}K`;
  }

  return new Intl.NumberFormat(
    "en-US",
  ).format(value);
}

function formatPercentage(
  value: number | null,
): string {
  if (value == null) return "Data unavailable";
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${value.toFixed(1)}%`;
}

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(date);
}

function formatStatus(
  value: string,
): string {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function formatExecutionMode(
  value: string,
): string {
  if (value === "autonomous") {
    return "Autonomous execution";
  }

  if (value === "human_intervention") {
    return "Human intervention";
  }

  return formatStatus(value);
}

function statusClasses(
  status: string,
): string {
  switch (status) {
    case "running":
      return "bg-[#f4f4f5] text-[#18181b]";

    case "paused":
      return "bg-[#fafafa] text-[#71717a]";

    case "completed":
      return "bg-[#f4f4f5] text-[#52525b]";

    case "cancelled":
      return "bg-[#fafafa] text-[#71717a]";

    case "draft":
    default:
      return "bg-[#fafafa] text-[#71717a]";
  }
}