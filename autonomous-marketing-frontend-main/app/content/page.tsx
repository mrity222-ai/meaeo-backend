"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Edit3,
  Eye,
  Facebook,
  FileCheck,
  Filter,
  Instagram,
  Linkedin,
  Loader2,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Store,
  ThumbsDown,
  ThumbsUp,
  X,
  Zap,
} from "lucide-react";

import { DashboardTopHeader } from "@/components/navigation/dashboard-top-header";
import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { UserAccountMenu } from "@/components/navigation/user-account-menu";
import { SocialLogo } from "@/components/ui/social-logo";
import {
  approveCampaignPost,
  getCampaignPosts,
  getCampaigns,
  rejectCampaignPost,
  type CampaignPostResponse,
  type CampaignResponse,
} from "@/lib/api/campaigns";

export type ReviewPost = {
  id: string;
  numericId?: number;
  campaignId?: number;
  title: string;
  platform: string;
  campaign: string;
  scheduledTime: string;
  status: "Pending Review" | "Approved" | "Rejected" | "Scheduled";
  copy: string;
  hashtags: string[];
  objective: string;
  pillar: string;
  aiReasoning: string;
  suggestedSlot: string;
  imageUrl?: string | null;
  isLiveBackend?: boolean;
};

export default function ContentReviewPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadContentQueue = async () => {
    try {
      setRefreshing(true);
      const campaigns = await getCampaigns();

      if (!campaigns || campaigns.length === 0) {
        setPosts([]);
        return;
      }

      // Fetch posts for each campaign
      const nested = await Promise.all(
        campaigns.map(async (c) => {
          try {
            const cPosts = await getCampaignPosts(c.id);
            return { campaign: c, posts: cPosts };
          } catch {
            return { campaign: c, posts: [] as CampaignPostResponse[] };
          }
        })
      );

      const livePosts: ReviewPost[] = [];

      for (const { campaign, posts: cPosts } of nested) {
        for (const p of cPosts) {
          let platform = "Instagram";
          if (p.platforms && p.platforms.length > 0) {
            const rawP = p.platforms[0].toLowerCase();
            if (rawP.includes("insta")) platform = "Instagram";
            else if (rawP.includes("face")) platform = "Facebook";
            else if (rawP.includes("link")) platform = "LinkedIn";
            else if (rawP.includes("google") || rawP.includes("gmb"))
              platform = "Google Business (GMB)";
            else platform = p.platforms[0];
          }

          let uiStatus: ReviewPost["status"] = "Pending Review";
          const rawStatus = (p.review_status || "").toLowerCase();
          if (rawStatus === "approved") uiStatus = "Approved";
          else if (rawStatus === "rejected") uiStatus = "Rejected";
          else if (rawStatus === "scheduled") uiStatus = "Scheduled";

          livePosts.push({
            id: `backend-${p.id}`,
            numericId: p.id,
            campaignId: p.campaign_id,
            title: p.title || p.objective || `Day ${p.day || 1} Post`,
            platform,
            campaign: campaign.campaign_name,
            scheduledTime: p.day ? `Day ${p.day} Campaign Slot` : "Scheduled Slot",
            status: uiStatus,
            copy: p.caption || "",
            hashtags: p.hashtags || [],
            objective: p.objective || "Brand Growth",
            pillar: p.content_pillar || "Strategic Content",
            aiReasoning:
              p.image_prompt ||
              "AI generated optimized copy tailored for maximum audience reach & engagement.",
            suggestedSlot: `Day ${p.day || 1} Optimal Engagement Window`,
            imageUrl: p.image_url || p.image_path,
            isLiveBackend: true,
          });
        }
      }

      setPosts(livePosts);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadContentQueue();
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredPosts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPosts.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleUpdateStatus = async (post: ReviewPost, newStatus: ReviewPost["status"]) => {
    setActionLoadingId(post.id);
    setNotice(null);

    try {
      if (post.isLiveBackend && post.campaignId && post.numericId) {
        if (newStatus === "Approved") {
          await approveCampaignPost(post.campaignId, post.numericId);
        } else if (newStatus === "Rejected") {
          await rejectCampaignPost(
            post.campaignId,
            post.numericId,
            "Rejected from Content Review queue"
          );
        }
      }

      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: newStatus } : p))
      );
      setNotice(`Post "${post.title}" marked as ${newStatus}.`);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : `Failed to update status to ${newStatus}.`
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBulkStatus = async (newStatus: "Approved" | "Rejected") => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    setNotice(null);

    const selectedPosts = posts.filter((p) => selectedIds.includes(p.id));

    try {
      await Promise.all(
        selectedPosts.map(async (p) => {
          if (p.isLiveBackend && p.campaignId && p.numericId) {
            try {
              if (newStatus === "Approved") {
                await approveCampaignPost(p.campaignId, p.numericId);
              } else if (newStatus === "Rejected") {
                await rejectCampaignPost(
                  p.campaignId,
                  p.numericId,
                  "Bulk rejected from Content Review"
                );
              }
            } catch {
              // Ignore single failure in bulk
            }
          }
        })
      );

      setPosts((prev) =>
        prev.map((p) => (selectedIds.includes(p.id) ? { ...p, status: newStatus } : p))
      );
      setNotice(`${selectedIds.length} posts marked as ${newStatus}.`);
      setSelectedIds([]);
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : `Failed to complete bulk update.`
      );
    } finally {
      setBulkLoading(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === "Pending") return post.status === "Pending Review";
    if (activeFilter === "Approved") return post.status === "Approved";
    if (activeFilter === "Scheduled") return post.status === "Scheduled";
    return true;
  });

  const pendingCount = posts.filter((p) => p.status === "Pending Review").length;

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("insta")) return Instagram;
    if (p.includes("link")) return Linkedin;
    if (p.includes("face")) return Facebook;
    if (p.includes("google") || p.includes("gmb")) return Store;
    return Zap;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-[230px]">
        <DashboardTopHeader title="Content Review" subtitle="Review and approve your campaign posts"
          onMenuClick={() => setSidebarOpen(true)} actions={<>
            <span className="hidden lg:inline text-xs text-muted-foreground">{pendingCount} pending approvals</span>
            <button type="button" onClick={() => void loadContentQueue()} disabled={refreshing}
              aria-label="Refresh content review" className="ui-button-secondary inline-flex min-h-11 items-center gap-2 border border-border px-3 text-sm disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </>} />

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 sm:px-6 lg:px-8">
          {/* Header Title */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Autonomous Quality Gate
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Content & Post Review
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Review, edit, approve, or reject AI-generated posts before they are scheduled on your connected social channels.
              </p>
            </div>

            <Link
              href="/campaigns"
              className="ui-button-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition"
            >
              <Sparkles className="h-4 w-4" />
              Generate Campaign Posts
            </Link>
          </div>

          {/* Feedback alert notice */}
          {notice && (
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50 px-4 py-3 text-xs font-semibold text-purple-900 shadow-xs">
              <span>{notice}</span>
              <button
                onClick={() => setNotice(null)}
                className="text-purple-600 hover:text-purple-900 font-bold text-sm ml-2"
              >
                ×
              </button>
            </div>
          )}

          {/* Filter & Bulk Actions Bar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl ui-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground mr-1">Status:</span>
              {["All", "Pending", "Approved", "Scheduled"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                    activeFilter === filter
                      ? "ui-nav-active"
                      : "bg-purple-50/60 text-purple-700 hover:bg-purple-100/70"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">
                  {selectedIds.length} selected
                </span>
                <button
                  onClick={() => void handleBulkStatus("Approved")}
                  disabled={bulkLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50 shadow-sm"
                >
                  {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Approve Selected
                </button>
                <button
                  onClick={() => void handleBulkStatus("Rejected")}
                  disabled={bulkLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                >
                  {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  Reject Selected
                </button>
              </div>
            )}
          </div>

          {/* Queue Feed */}
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl ui-card p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="mt-3 text-sm font-semibold text-foreground">Loading Review Queue...</p>
              <p className="text-xs text-muted-foreground">Checking database for campaign posts</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-2xl ui-card p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                {posts.length === 0 ? "Review Queue is Clear" : `No posts match filter "${activeFilter}"`}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                {posts.length === 0
                  ? "No campaign posts are currently pending review. When you launch a campaign in review mode, generated posts will appear here for your one-click approval."
                  : "Try switching filters above to view other posts in your queue."}
              </p>
              {posts.length === 0 && (
                <Link
                  href="/campaigns"
                  className="ui-button-primary mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold transition"
                >
                  <Plus className="h-4 w-4" />
                  Create Autonomous Campaign
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const isSelected = selectedIds.includes(post.id);
                const isActionBusy = actionLoadingId === post.id;

                return (
                  <div
                    key={post.id}
                    className={`ui-card ui-card-hover p-6 ${
                      isSelected ? "ring-2 ring-purple-500 border-purple-300" : ""
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(post.id)}
                          className="mt-2 h-4 w-4 rounded border-slate-300 accent-purple-600"
                        />
                        <SocialLogo platform={post.platform} className="h-10 w-10" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-bold text-foreground">
                              {post.title}
                            </h2>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                post.status === "Approved"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : post.status === "Rejected"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : post.status === "Scheduled"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {post.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="font-semibold text-purple-600">{post.platform}</span>
                            <span>•</span>
                            <span>{post.campaign}</span>
                            <span>•</span>
                            <span>{post.scheduledTime}</span>
                          </div>
                        </div>
                      </div>

                      {/* Approval Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => void handleUpdateStatus(post, "Approved")}
                          disabled={isActionBusy || post.status === "Approved"}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition disabled:opacity-40"
                        >
                          {isActionBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          {post.status === "Approved" ? "Approved" : "Approve Post"}
                        </button>
                        <button
                          onClick={() => void handleUpdateStatus(post, "Rejected")}
                          disabled={isActionBusy || post.status === "Rejected"}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-40"
                        >
                          <X className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Post Image Media Preview */}
                    {post.imageUrl && (
                      <div
                        onClick={() => setPreviewImageUrl(post.imageUrl!)}
                        className="group relative mt-4 cursor-pointer overflow-hidden rounded-xl border border-border bg-black/5 shadow-xs transition hover:border-purple-300 hover:shadow-md"
                      >
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full max-h-96 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          onError={(e) => {
                            // Fallback image if local static server URL is unavailable
                            (e.target as HTMLImageElement).src =
                              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-lg opacity-0 transition-opacity backdrop-blur-xs group-hover:opacity-100">
                            <Eye size={13} /> Click to View Full Image
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Post Copy / Content Body */}
                    <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {post.copy}
                    </div>

                    {/* Hashtags */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {post.hashtags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-lg bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700 border border-border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
                className="flex h-9 items-center gap-1.5 px-4 rounded-full bg-card/20 hover:bg-card/30 text-white text-xs font-bold backdrop-blur-md transition shadow-md"
              >
                Download HD Image
              </a>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-card/20 hover:bg-card/30 text-white backdrop-blur-md transition shadow-md text-xs font-bold"
              >
                ✕
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
    </div>
  );
}
