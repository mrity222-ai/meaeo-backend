"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Check,
  Facebook,
  FileText,
  Filter,
  Instagram,
  Linkedin,
  Loader2,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Sparkles,
  Store,
  X,
  Zap,
} from "lucide-react";

import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { UserAccountMenu } from "@/components/navigation/user-account-menu";
import {
  getCampaignPosts,
  getCampaigns,
  type CampaignPostResponse,
  type CampaignResponse,
} from "@/lib/api/campaigns";

type CalendarPost = CampaignPostResponse & {
  campaignName: string;
  targetDate: Date;
  timeSlot: string;
};

export default function CalendarPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0); // 0 = current week, +1 = next week, -1 = last week
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([]);
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  // Load real campaigns and posts from database
  const loadCalendarData = async () => {
    try {
      setRefreshing(true);
      const campList = await getCampaigns();
      setCampaigns(campList || []);

      if (!campList || campList.length === 0) {
        setPosts([]);
        return;
      }

      const nested = await Promise.all(
        campList.map(async (c) => {
          try {
            const cPosts = await getCampaignPosts(c.id);
            return { campaign: c, posts: cPosts };
          } catch {
            return { campaign: c, posts: [] as CampaignPostResponse[] };
          }
        })
      );

      const allCalendarPosts: CalendarPost[] = [];

      for (const { campaign, posts: cPosts } of nested) {
        // Base start date: started_at or created_at
        const baseDate = campaign.started_at
          ? new Date(campaign.started_at)
          : new Date(campaign.created_at || Date.now());

        for (const p of cPosts) {
          // Calculate day date: baseDate + (p.day - 1) days
          const postDate = new Date(baseDate);
          postDate.setDate(postDate.getDate() + ((p.day || 1) - 1));

          // Set optimal posting time slots (e.g., morning 10:00 AM or evening 6:30 PM)
          const isEvening = (p.day || 1) % 2 === 0;
          postDate.setHours(isEvening ? 18 : 10, 30, 0, 0);

          allCalendarPosts.push({
            ...p,
            campaignName: campaign.campaign_name,
            targetDate: postDate,
            timeSlot: isEvening ? "6:30 PM" : "10:00 AM",
          });
        }
      }

      setPosts(allCalendarPosts);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadCalendarData();
  }, []);

  // Compute 7 days of the active week based on currentWeekOffset
  const weekDays = useMemo(() => {
    const today = new Date();
    // Find Monday of current week
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday + currentWeekOffset * 7);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const dayName = d.toLocaleDateString("en-US", { weekday: "short" }); // Mon, Tue...
      const dayNum = String(d.getDate()).padStart(2, "0");
      const monthShort = d.toLocaleDateString("en-US", { month: "short" });
      const fullDateStr = d.toISOString().slice(0, 10);

      // Check if it's today
      const isToday = d.toDateString() === new Date().toDateString();

      // Find matching posts on this specific date
      const matchingPosts = posts.filter((p) => {
        const pDateStr = p.targetDate.toISOString().slice(0, 10);
        return pDateStr === fullDateStr;
      });

      days.push({
        dateObj: d,
        dayName,
        dayNum,
        monthShort,
        fullDateStr,
        isToday,
        posts: matchingPosts,
      });
    }

    return days;
  }, [currentWeekOffset, posts]);

  // Compute Week Range Header String
  const weekRangeTitle = useMemo(() => {
    if (weekDays.length === 0) return "This Week";
    const first = weekDays[0];
    const last = weekDays[6];
    return `${first.monthShort} ${first.dayNum} – ${last.monthShort} ${last.dayNum}, ${first.dateObj.getFullYear()}`;
  }, [weekDays]);

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("insta")) return Instagram;
    if (p.includes("link")) return Linkedin;
    if (p.includes("face")) return Facebook;
    if (p.includes("google") || p.includes("gmb")) return Store;
    return Zap;
  };

  const getPlatformColor = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("insta")) return "text-pink-600 bg-pink-50 border-pink-200";
    if (p.includes("link")) return "text-blue-600 bg-blue-50 border-blue-200";
    if (p.includes("face")) return "text-blue-700 bg-blue-50 border-blue-200";
    if (p.includes("google") || p.includes("gmb")) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    return "text-purple-600 bg-purple-50 border-purple-200";
  };

  const handleCopyCaption = (caption: string) => {
    navigator.clipboard.writeText(caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const totalWeekPosts = weekDays.reduce((acc, d) => acc + d.posts.length, 0);

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
            <CalendarDays className="h-5 w-5 text-purple-600" />
            <span className="font-semibold text-foreground">Content Calendar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void loadCalendarData()}
              className="rounded-lg p-2 hover:bg-muted"
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <UserAccountMenu />
          </div>
        </header>

        {/* Desktop Header Bar */}
        <div className="hidden h-16 items-center justify-between border-b px-8 lg:flex">
          <div>
            <p className="text-xs text-muted-foreground">Publishing Roadmap</p>
            <p className="text-sm font-semibold text-foreground">Content Schedule & Planner</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadCalendarData()}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Sync Calendar
            </button>
            <span className="rounded-xl border border-border bg-muted/60 px-3 py-1.5 text-xs font-bold text-foreground">
              {totalWeekPosts} Posts This Week
            </span>
            <UserAccountMenu />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Title */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Live Publishing Pipeline
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Content Calendar
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track and manage upcoming scheduled posts across your connected platforms.
              </p>
            </div>

            <Link
              href="/campaigns"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-200 hover:bg-purple-700 transition"
            >
              <Plus className="h-4 w-4" />
              Create Campaign
            </Link>
          </div>

          {/* Week Navigation Toolbar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentWeekOffset((prev) => prev - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted transition"
                title="Previous Week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="text-left sm:text-center">
                <p className="text-sm font-bold text-foreground">{weekRangeTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {currentWeekOffset === 0 ? "Current Week" : currentWeekOffset > 0 ? `+${currentWeekOffset} Weeks Ahead` : `${currentWeekOffset} Weeks Ago`}
                </p>
              </div>

              <button
                onClick={() => setCurrentWeekOffset((prev) => prev + 1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted transition"
                title="Next Week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {currentWeekOffset !== 0 && (
                <button
                  onClick={() => setCurrentWeekOffset(0)}
                  className="rounded-xl border border-border bg-muted/60 px-3.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition"
                >
                  Return to Today
                </button>
              )}
              <Link
                href="/content"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition"
              >
                <Filter className="h-3.5 w-3.5" />
                Review Queue
              </Link>
            </div>
          </div>

          {/* Calendar Grid (7 Columns for 7 Days) */}
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-border bg-card p-12 text-center shadow-xs">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="mt-3 text-sm font-semibold text-foreground">Syncing Content Calendar...</p>
              <p className="text-xs text-muted-foreground">Mapping campaign posts to scheduled calendar slots</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
              {weekDays.map((day) => (
                <div
                  key={day.fullDateStr}
                  className={`flex flex-col rounded-2xl border transition min-h-[220px] p-3 shadow-xs ${
                    day.isToday
                      ? "border-purple-600 bg-purple-50/20 ring-1 ring-purple-600"
                      : "border-border bg-card"
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-border">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        day.isToday ? "text-purple-600 font-extrabold" : "text-muted-foreground"
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        day.isToday
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-foreground bg-muted/50"
                      }`}
                    >
                      {day.dayNum}
                    </span>
                  </div>

                  {/* Day Posts List */}
                  <div className="flex-1 space-y-2">
                    {day.posts.length === 0 ? (
                      <div className="flex h-28 flex-col items-center justify-center text-center p-2 rounded-xl border border-dashed border-border/60 bg-muted/10">
                        <span className="text-[11px] text-muted-foreground">No posts</span>
                      </div>
                    ) : (
                      day.posts.map((post) => {
                        const plat = post.platforms && post.platforms[0] ? post.platforms[0] : "Instagram";
                        const Icon = getPlatformIcon(plat);
                        const colorClass = getPlatformColor(plat);

                        return (
                          <div
                            key={post.id}
                            onClick={() => setSelectedPost(post)}
                            className="cursor-pointer rounded-xl border border-border bg-background p-2.5 shadow-xs transition hover:border-purple-300 hover:shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${colorClass}`}
                              >
                                <Icon className="h-2.5 w-2.5" />
                                {plat}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock3 className="h-2.5 w-2.5" />
                                {post.timeSlot}
                              </span>
                            </div>

                            <p className="text-xs font-bold text-foreground line-clamp-2">
                              {post.title || post.caption || `Day ${post.day} Post`}
                            </p>

                            <div className="mt-2 flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground truncate max-w-[80px]">
                                {post.campaignName}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.2 font-semibold uppercase ${
                                  post.review_status === "approved"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {post.review_status || "draft"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state notice if no posts across the entire account */}
          {!loading && posts.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">No Campaign Content Scheduled Yet</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
                Your content calendar automatically populates when you generate campaigns. Every post is scheduled on peak engagement hours across Instagram, LinkedIn, Facebook, and Google Business.
              </p>
              <Link
                href="/campaigns"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-200 hover:bg-purple-700 transition"
              >
                <Sparkles className="h-4 w-4" />
                Launch First Campaign
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Post Details Modal Drawer */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
                  Day {selectedPost.day} Slot
                </span>
                <span className="text-xs text-muted-foreground">• {selectedPost.campaignName}</span>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground">
                {selectedPost.title || selectedPost.objective || "Scheduled Post"}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>Time: {selectedPost.timeSlot}</span>
                <span>•</span>
                <span>Status: <strong className="text-purple-600 uppercase">{selectedPost.review_status || "draft"}</strong></span>
              </div>
            </div>

            {/* Post Image Preview */}
            {(selectedPost.image_url || selectedPost.image_path) && (
              <div className="overflow-hidden rounded-xl border border-purple-100 bg-black/5">
                <img
                  src={selectedPost.image_url || selectedPost.image_path || ""}
                  alt={selectedPost.title}
                  className="w-full h-56 object-cover hover:scale-101 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";
                  }}
                />
              </div>
            )}

            {/* Target Channels */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                Target Channels
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(selectedPost.platforms && selectedPost.platforms.length > 0 ? selectedPost.platforms : ["Instagram"]).map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Full Caption */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Post Caption
                </label>
                <button
                  onClick={() => handleCopyCaption(selectedPost.caption)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-700"
                >
                  {copiedCaption ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copiedCaption ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="rounded-xl border border-border bg-muted/20 p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                {selectedPost.caption || "No caption available."}
              </div>
            </div>

            {/* Hashtags */}
            {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">
                  Hashtags
                </label>
                <div className="flex flex-wrap gap-1">
                  {selectedPost.hashtags.map((h, i) => (
                    <span key={i} className="text-xs font-semibold text-purple-600">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Link
                href="/content"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition"
              >
                Go to Review Queue
              </Link>
              <button
                onClick={() => setSelectedPost(null)}
                className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
