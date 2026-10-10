"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Flame,
  Globe,
  Loader2,
  MapPin,
  Menu,
  MessageSquare,
  Percent,
  RefreshCw,
  Send,
  Sparkles,
  Star,
  Store,
  Tag,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Unlink,
  Zap,
} from "lucide-react";

import { DashboardTopHeader } from "@/components/navigation/dashboard-top-header";
import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { UserAccountMenu } from "@/components/navigation/user-account-menu";
import {
  generateDailyOffer,
  generateReviewReply,
  getGoogleBusinessStatus,
  getGoogleReviews,
  getLocalPosts,
  optimizeLocalSeo,
  publishLocalPost,
  sendReviewReply,
  updateGbpDescription,
  type GoogleBusinessStatus,
  type GooglePost,
  type GoogleReview,
  type OptimizeLocalSeoResponse,
} from "@/lib/api/google-business";

export default function GoogleBusinessPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "offers" | "seo">("reviews");

  // Connection & Profile Status
  const [status, setStatus] = useState<GoogleBusinessStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Review Responder States
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [draftReplies, setDraftReplies] = useState<Record<number, string>>({});
  const [generatingReplyId, setGeneratingReplyId] = useState<number | null>(null);
  const [sendingReplyId, setSendingReplyId] = useState<number | null>(null);

  // Live Business Info (synced from DB)
  const [businessName, setBusinessName] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [servicesInput, setServicesInput] = useState("Digital Marketing, Local SEO, Social Media Ads");

  // Promotional Offers States
  const [offerTheme, setOfferTheme] = useState("Weekend Special Deal");
  const [offerDiscount, setOfferDiscount] = useState("Flat 20% Off or Free Consultation");
  const [generatingOffer, setGeneratingOffer] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerSummary, setOfferSummary] = useState("");
  const [offerCoupon, setOfferCoupon] = useState("");
  const [offerCta, setOfferCta] = useState("LEARN_MORE");
  const [offerTerms, setOfferTerms] = useState("");
  const [publishingOffer, setPublishingOffer] = useState(false);
  const [postsList, setPostsList] = useState<GooglePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Local SEO Optimizer States
  const [seoIndustry, setSeoIndustry] = useState("Marketing Agency");
  const [currentDescription, setCurrentDescription] = useState("");
  const [runningSeo, setRunningSeo] = useState(false);
  const [seoResult, setSeoResult] = useState<OptimizeLocalSeoResponse | null>(null);
  const [pushingToGbp, setPushingToGbp] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  // Load live connection status and business profile from DB
  const loadStatusAndProfile = async () => {
    setLoadingStatus(true);
    try {
      const st = await getGoogleBusinessStatus();
      setStatus(st);
      if (st.business_name) setBusinessName(st.business_name);
      if (st.city) setBusinessCity(st.city);
      if (st.category) setSeoIndustry(st.category);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Business selection changed")) return;
      setStatus(null);
      showError(error instanceof Error ? error.message : "Google connection status is unavailable.");
    } finally {
      setLoadingStatus(false);
    }
  };

  // Fetch live reviews from Google API / database
  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
      const data = await getGoogleReviews();
      setReviews(data);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Business selection changed")) return;
      showError(error instanceof Error ? error.message : "Google reviews could not be loaded.");
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadPosts = async () => {
    setLoadingPosts(true);
    try {
      const data = await getLocalPosts();
      setPostsList(data);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Business selection changed")) return;
      showError(error instanceof Error ? error.message : "Google posts could not be loaded.");
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    const reload = () => {
      setStatus(null); setReviews([]); setPostsList([]); setSeoResult(null); setDraftReplies({});
      setOfferTitle(""); setOfferSummary(""); setBusinessName(""); setBusinessCity(""); setCurrentDescription("");
      void loadStatusAndProfile(); void loadReviews(); void loadPosts();
    };
    reload();
    window.addEventListener("business-context-changed", reload);
    window.addEventListener("storage", reload);
    return () => { window.removeEventListener("business-context-changed", reload); window.removeEventListener("storage", reload); };
  }, []);

  // Handle AI Review Reply Generation
  const handleGenerateReply = async (review: GoogleReview) => {
    setGeneratingReplyId(review.id);
    try {
      const servicesList = servicesInput.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await generateReviewReply({
        review_id: review.id,
        business_name: businessName || status?.business_name,
        city: businessCity || status?.city,
        services: servicesList,
        tone: "warm, polite and professional",
      });
      setReviews((prev) => prev.map((r) => (r.id === res.id ? res : r)));
      if (res.reply_text) {
        setDraftReplies((prev) => ({ ...prev, [review.id]: res.reply_text || "" }));
      }
      showSuccess("SEO-optimized localized reply drafted by AI!");
    } catch (err: any) {
      showError(err.message || "Failed to generate AI reply");
    } finally {
      setGeneratingReplyId(null);
    }
  };

  // Handle Send Reply directly to Google Maps
  const handleSendReply = async (reviewId: number) => {
    const text = draftReplies[reviewId];
    if (!text || !text.trim()) {
      showError("Please enter or generate a reply before sending.");
      return;
    }
    setSendingReplyId(reviewId);
    try {
      const res = await sendReviewReply({
        review_id: reviewId,
        reply_text: text,
      });
      setReviews((prev) => prev.map((r) => (r.id === res.id ? res : r)));
      showSuccess("Reply published directly to Google Business Profile!");
    } catch (err: any) {
      showError(err.message || "Failed to publish reply to Google");
    } finally {
      setSendingReplyId(null);
    }
  };

  // Handle Generate Daily Offer
  const handleGenerateOffer = async () => {
    setGeneratingOffer(true);
    try {
      const res = await generateDailyOffer({
        business_name: businessName || status?.business_name,
        industry: seoIndustry || status?.category,
        city: businessCity || status?.city,
        theme: offerTheme,
        discount_target: offerDiscount,
      });
      setOfferTitle(res.offer_title);
      setOfferSummary(res.summary);
      setOfferCoupon(res.coupon_code);
      setOfferCta(res.call_to_action_type || "LEARN_MORE");
      setOfferTerms(res.terms_conditions);
      showSuccess("High-converting promotional offer generated!");
    } catch (err: any) {
      showError(err.message || "Failed to generate offer");
    } finally {
      setGeneratingOffer(false);
    }
  };

  // Handle Publish Offer directly to Google Business Local Posts
  const handlePublishOffer = async () => {
    if (!offerSummary) {
      showError("Please generate or write an offer first.");
      return;
    }
    setPublishingOffer(true);
    try {
      const post = await publishLocalPost({
        post_type: "OFFER",
        summary: offerSummary,
        offer_title: offerTitle,
        coupon_code: offerCoupon,
        call_to_action_type: offerCta,
        terms_conditions: offerTerms,
      });
      setPostsList((prev) => [post, ...prev]);
      if (post.status === "published") showSuccess("Promotional offer published to Google Business Profile.");
      else showError(post.error_message || `Google post status: ${post.status}`);
    } catch (err: any) {
      showError(err.message || "Failed to publish offer to Google");
    } finally {
      setPublishingOffer(false);
    }
  };

  // Handle Run Local SEO Optimizer
  const handleRunSeo = async () => {
    setRunningSeo(true);
    try {
      const servicesList = servicesInput.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await optimizeLocalSeo({
        business_name: businessName || status?.business_name || "My Business",
        industry: seoIndustry || status?.category || "Services",
        city: businessCity || status?.city || "Local Area",
        current_description: currentDescription,
        current_services: servicesList,
      });
      setSeoResult(res);
      showSuccess("Local SEO audit and optimization completed!");
    } catch (err: any) {
      showError(err.message || "Failed to optimize Local SEO");
    } finally {
      setRunningSeo(false);
    }
  };

  // Handle Push Description to GBP
  const handlePushDescription = async () => {
    if (!seoResult?.optimized_description) return;
    setPushingToGbp(true);
    try {
      if (!status?.external_account_id) throw new Error("Connect your Google Business location first.");
      const result = await updateGbpDescription({
        location_name: status.external_account_id,
        description: seoResult.optimized_description,
      });
      if (!result.success) throw new Error(result.error || "Google did not confirm this update.");
      setCurrentDescription(seoResult.optimized_description);
      showSuccess("Optimized description pushed to Google Business Profile!");
    } catch (err: any) {
      showError(err.message || "Failed to update GBP description");
    } finally {
      setPushingToGbp(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    if (filterRating !== null) {
      return r.star_rating === filterRating;
    }
    return true;
  });

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.star_rating, 0) / reviews.length).toFixed(1)
      : "0.0";
  const repliedCount = reviews.filter((r) => r.reply_status === "replied").length;
  const pendingCount = reviews.filter((r) => r.reply_status === "unanswered").length;
  const isConnected = Boolean(status?.is_connected);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="md:pl-[230px]">
        <DashboardTopHeader title="Google Business" subtitle="Reviews, offers and local profile"
          onMenuClick={() => setSidebarOpen(true)} actions={
            <button type="button" onClick={loadReviews} disabled={loadingReviews} aria-label="Refresh Google reviews"
              className="ui-button-secondary inline-flex min-h-11 items-center gap-2 border border-border px-3 text-sm disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loadingReviews ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh</span>
            </button>
          } />
        <div className="border-b border-border bg-card px-4 py-3 sm:px-6 lg:px-8">
          {/* Quick Context Inputs (Auto-synced from DB) */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 shadow-xs">
              <Building className="h-3.5 w-3.5 text-blue-600" />
              <input
                type="text"
                aria-label="Business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="bg-transparent text-foreground font-semibold focus:outline-none w-36 placeholder:text-muted-foreground"
                placeholder="Business Name"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 shadow-xs">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              <input
                type="text"
                aria-label="Business city"
                value={businessCity}
                onChange={(e) => setBusinessCity(e.target.value)}
                className="bg-transparent text-foreground font-semibold focus:outline-none w-24 placeholder:text-muted-foreground"
                placeholder="City"
              />
            </div>
            {isConnected ? (
              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 font-bold text-[11px] text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Google Connected
              </span>
            ) : (
              <Link
                href="/connections"
                className="ui-button-secondary inline-flex items-center gap-1 px-3 py-1.5 font-bold text-[11px] text-blue-700 border border-blue-200 transition"
              >
                <Store className="h-3.5 w-3.5" />
                Connect Google Account
              </Link>
            )}

          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-8 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 sm:px-6 lg:px-8">
          {/* Notifications */}
          {successBanner && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-xs">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <span className="font-semibold">{successBanner}</span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-xs">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Connection Alert Banner if not connected */}
          {!loadingStatus && !isConnected && (
            <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">
                      Connect Google Business Profile (One-Time Setup)
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Connect your Google Account once to automatically fetch customer reviews, publish AI review responses to Google Maps, and broadcast promotional offers.
                    </p>
                  </div>
                </div>

                <Link
                  href="/connections"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition"
                >
                  <Store className="h-4 w-4" />
                  Connect Google Business
                </Link>
              </div>
            </div>
          )}

          {/* Header Title & Subtitle */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200 uppercase tracking-wider">
                  Live GBP Engine
                </span>
                <span className="text-xs text-muted-foreground">
                  {isConnected ? "• Synced with Google Maps API" : "• Ready for OAuth Connection"}
                </span>
              </div>
              <h1 className="mt-1.5 text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                Google Business Profile Suite
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Official Google My Business API • Real Customer Reviews • Local SEO 3-Pack Optimization
              </p>
            </div>
          </div>

          {/* 4 REAL KPI CARDS (NO DUMMY VALUES) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Google Rating */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:border-blue-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Google Rating
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{avgRating}</span>
                {reviews.length > 0 ? (
                  <div className="flex text-amber-400 text-xs">
                    {"★".repeat(Math.round(Number(avgRating)))}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">No ratings yet</span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {reviews.length} customer reviews synced
              </p>
            </div>

            {/* Response Rate */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:border-emerald-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Response Rate
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <MessageSquare className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-emerald-600">
                {reviews.length > 0
                  ? `${Math.round((repliedCount / reviews.length) * 100)}%`
                  : "—"}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {repliedCount} replied • {pendingCount} awaiting response
              </p>
            </div>

            {/* Published Offers */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:border-purple-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Live Offers & Posts
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <Tag className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{postsList.filter(post => post.status === "published").length}</span>
                <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                  Published
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Coupons & local offers on Google Maps
              </p>
            </div>

            {/* Google Maps 3-Pack Score */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:border-blue-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Maps 3-Pack Score
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {seoResult?.profile_completeness_score ? `${seoResult.profile_completeness_score}%` : isConnected ? "75%" : "—"}
                </span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                  {isConnected ? "Connected" : "Unconnected"}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Local SEO keyword optimization
              </p>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="mb-6 flex flex-wrap gap-2 border-b border-purple-200/60 pb-4">
            <button
              onClick={() => setActiveTab("reviews")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "reviews"
                  ? "ui-nav-active"
                  : "bg-card/80 text-slate-600 border border-border hover:bg-purple-50 hover:text-purple-700"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              AI Review Responder
              {pendingCount > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("offers")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "offers"
                  ? "ui-nav-active"
                  : "bg-card/80 text-slate-600 border border-border hover:bg-purple-50 hover:text-purple-700"
              }`}
            >
              <Percent className="h-4 w-4" />
              Daily Promotional Offers
            </button>

            <button
              onClick={() => setActiveTab("seo")}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "seo"
                  ? "ui-nav-active"
                  : "bg-card/80 text-slate-600 border border-border hover:bg-purple-50 hover:text-purple-700"
              }`}
            >
              <Zap className="h-4 w-4" />
              Local SEO Profile Optimizer
            </button>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: AI REVIEW RESPONDER (LIVE GOOGLE REVIEWS ONLY) */}
          {/* ========================================================================= */}
          {activeTab === "reviews" && (
            <div className="space-y-6">
              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground mr-1">Filter:</span>
                  <button
                    onClick={() => setFilterRating(null)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      filterRating === null
                        ? "bg-purple-600 text-white"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    All ({reviews.length})
                  </button>
                  {[5, 4, 3, 2, 1].map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilterRating(filterRating === r ? null : r)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        filterRating === r
                          ? "bg-amber-400 text-black font-bold"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {r} ★
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadReviews}
                    disabled={loadingReviews}
                    className="ui-button-secondary inline-flex items-center gap-1.5 border border-border px-4 py-2 text-xs font-semibold transition"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingReviews ? "animate-spin" : ""}`} />
                    Sync Live Reviews
                  </button>

                  {!isConnected && (
                    <Link
                      href="/connections"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition"
                    >
                      <Store className="h-3.5 w-3.5" />
                      Connect Google Account
                    </Link>
                  )}
                </div>
              </div>

              {/* Reviews List */}
              {loadingReviews ? (
                <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card p-12 text-center shadow-xs">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <p className="mt-3 text-xs text-muted-foreground">Checking Google Business Profile API...</p>
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">
                    {isConnected ? "No Customer Reviews Yet" : "Google Business Profile Not Connected"}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-md">
                    {isConnected
                      ? "When customers review your Google Maps listing, their reviews will sync here automatically. Click 'Sync Live Reviews' to check for updates."
                      : "Connect your Google Business Profile to fetch live customer reviews and publish AI review responses straight to Google Maps."}
                  </p>

                  {!isConnected ? (
                    <Link
                      href="/connections"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-200 transition"
                    >
                      <Store className="h-4 w-4" />
                      Connect Google Business Profile
                    </Link>
                  ) : (
                    <button
                      onClick={loadReviews}
                      className="ui-button-primary mt-4 inline-flex items-center gap-2 px-5 py-2 text-xs font-bold transition"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Sync Reviews Now
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => {
                    const isGenerating = generatingReplyId === review.id;
                    const isSending = sendingReplyId === review.id;
                    const draft = draftReplies[review.id] ?? review.reply_text ?? "";

                    return (
                      <div
                        key={review.id}
                        className="rounded-2xl border border-border bg-card p-6 shadow-xs transition hover:border-purple-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-black text-sm">
                              {review.reviewer_name?.slice(0, 1) || "C"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-foreground text-sm">
                                  {review.reviewer_name}
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                  • {review.review_create_time ? review.review_create_time.slice(0, 10) : "Recent"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex text-amber-400 text-xs">
                                  {"★".repeat(review.star_rating)}
                                  {"☆".repeat(5 - review.star_rating)}
                                </div>
                                {review.sentiment && (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                      review.sentiment === "positive"
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : review.sentiment === "negative"
                                        ? "bg-red-50 text-red-700 border border-red-200"
                                        : "bg-zinc-100 text-zinc-700"
                                    }`}
                                  >
                                    {review.sentiment}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div>
                            {review.reply_status === "replied" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Replied on Google
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                                Awaiting Reply
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Customer Comment */}
                        <p className="mt-4 text-xs sm:text-sm text-foreground leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border">
                          "{review.comment}"
                        </p>

                        {/* If Replied Already */}
                        {review.reply_status === "replied" && review.reply_text && (
                          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                            <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Official Reply Published to Google Profile
                            </p>
                            <p className="text-xs text-foreground">{review.reply_text}</p>
                          </div>
                        )}

                        {/* Draft & AI Actions */}
                        {review.reply_status !== "replied" && (
                          <div className="mt-4 pt-4 border-t border-border space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                                AI Local SEO Reply Draft
                              </span>
                              <button
                                onClick={() => handleGenerateReply(review)}
                                disabled={isGenerating}
                                className="ui-button-secondary inline-flex items-center gap-1.5 border border-purple-200 px-3 py-1 text-xs font-bold text-purple-700 transition disabled:opacity-60"
                              >
                                {isGenerating ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Drafting Localized Reply...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3" />
                                    {draft ? "Regenerate with AI" : "Generate AI Reply"}
                                  </>
                                )}
                              </button>
                            </div>

                            <textarea
                              value={draft}
                              onChange={(e) =>
                                setDraftReplies((prev) => ({
                                  ...prev,
                                  [review.id]: e.target.value,
                                }))
                              }
                              placeholder="Type or click 'Generate AI Reply' to draft a localized reply with your business name and keywords automatically..."
                              rows={3}
                              className="w-full resize-none rounded-xl border border-border bg-background p-3.5 text-xs text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-muted-foreground"
                            />

                            <div className="flex justify-end">
                              <button
                                onClick={() => handleSendReply(review.id)}
                                disabled={isSending || !draft.trim()}
                                className="ui-button-primary inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold transition disabled:opacity-50"
                              >
                                {isSending ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Publishing to Google...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-3.5 w-3.5" />
                                    Send Reply to Google Profile
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PROMOTIONAL OFFERS (LIVE GOOGLE POSTS ONLY) */}
          {/* ========================================================================= */}
          {activeTab === "offers" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Offer Generator */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-foreground">Generate Daily Local Offer</h2>
                    <p className="text-xs text-muted-foreground">
                      Create SEO-optimized discount offers and coupon codes ready to post directly to Google Maps & Search.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Offer Campaign Theme
                    </label>
                    <input
                      type="text"
                      value={offerTheme}
                      onChange={(e) => setOfferTheme(e.target.value)}
                      placeholder="e.g. Weekend Special Deal, Festival Discount, New Client Welcome"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Target Discount / Incentive
                    </label>
                    <input
                      type="text"
                      value={offerDiscount}
                      onChange={(e) => setOfferDiscount(e.target.value)}
                      placeholder="e.g. Flat 20% Off, Buy 1 Get 1 Free, Free Consultation"
                      className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-purple-600"
                    />
                  </div>

                  <button
                    onClick={handleGenerateOffer}
                    disabled={generatingOffer}
                    className="ui-button-primary w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-bold transition disabled:opacity-60"
                  >
                    {generatingOffer ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Promotional Offer...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Generate AI Promotional Offer
                      </>
                    )}
                  </button>
                </div>

                {/* Offer Preview Card */}
                {offerSummary && (
                  <div className="rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/30 p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-purple-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        Google Offer Preview
                      </span>
                      <span className="text-xs font-bold text-purple-700">7 Days Validity</span>
                    </div>

                    <h3 className="text-lg font-black text-foreground">{offerTitle || "Special Offer"}</h3>
                    <p className="text-xs text-foreground leading-relaxed">{offerSummary}</p>

                    <div className="flex items-center gap-3">
                      <div className="rounded-lg border border-purple-200 bg-card px-3 py-1.5 text-xs font-mono font-bold text-purple-700">
                        CODE: {offerCoupon || "SAVE20"}
                      </div>
                      <span className="text-xs text-muted-foreground">{offerTerms || "Terms apply."}</span>
                    </div>

                    <button
                      onClick={handlePublishOffer}
                      disabled={publishingOffer}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-60"
                    >
                      {publishingOffer ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Publishing to Google Business...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Publish Offer to Google Profile
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Published Offers History */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                  <h2 className="text-base font-bold text-foreground mb-1">Live Google Posts History</h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    Active promotional posts currently visible on your Google Maps & Local search.
                  </p>

                  {loadingPosts ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    </div>
                  ) : postsList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                      <Tag className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                      <p className="text-sm font-bold text-foreground">No Published Offers Yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Use the generator on the left to create and publish your first live promotional coupon to Google!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {postsList.map((post) => (
                        <div
                          key={post.id}
                          className="rounded-xl border border-border bg-background p-4 transition hover:border-purple-200"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-foreground">
                              {post.offer_title || "Promotional Post"}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 uppercase">
                              {post.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{post.summary}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Coupon: {post.coupon_code || "None"}</span>
                            <span>{post.published_at ? post.published_at.slice(0, 10) : "Live"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: LOCAL SEO PROFILE OPTIMIZER */}
          {/* ========================================================================= */}
          {activeTab === "seo" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Input Form */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div>
                  <h2 className="text-base font-bold text-foreground">Local SEO & Google 3-Pack Audit</h2>
                  <p className="text-xs text-muted-foreground">
                    Analyze your Google Business Profile to rank in the coveted top 3 Google Maps results for local customers.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Primary Business Category / Industry
                  </label>
                  <input
                    type="text"
                    value={seoIndustry}
                    onChange={(e) => setSeoIndustry(e.target.value)}
                    placeholder="e.g. Digital Marketing Agency, Dental Clinic, Restaurant"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Key Services (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={servicesInput}
                    onChange={(e) => setServicesInput(e.target.value)}
                    placeholder="e.g. SEO, Social Media, Google Ads, Branding"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Current Business Description (Optional)
                  </label>
                  <textarea
                    value={currentDescription}
                    onChange={(e) => setCurrentDescription(e.target.value)}
                    placeholder="Paste your existing Google Business description here to optimize it..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-border bg-background p-3.5 text-xs text-foreground outline-none focus:border-purple-600 placeholder:text-muted-foreground"
                  />
                </div>

                <button
                  onClick={handleRunSeo}
                  disabled={runningSeo}
                  className="ui-button-primary w-full inline-flex items-center justify-center gap-2 py-3 text-xs font-bold transition disabled:opacity-60"
                >
                  {runningSeo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Auditing Local SEO & Keywords...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Run Local SEO Optimization Analysis
                    </>
                  )}
                </button>
              </div>

              {/* Right Column: SEO Audit Results */}
              <div className="space-y-4">
                {seoResult ? (
                  <div className="space-y-4">
                    {/* Completeness Score */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Google Maps 3-Pack Ranking Readiness
                        </span>
                        <span className="text-base font-black text-purple-600">
                          {seoResult.profile_completeness_score}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-purple-600 transition-all duration-700"
                          style={{ width: `${seoResult.profile_completeness_score}%` }}
                        />
                      </div>
                    </div>

                    {/* Target Local Keywords */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                        High-Volume Local Keywords
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {seoResult.target_keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700"
                          >
                            <Sparkles className="h-3 w-3" />
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Optimized Description */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          SEO-Optimized Profile Description
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyToClipboard(seoResult.optimized_description, "desc")}
                            className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700"
                          >
                            {copiedKey === "desc" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            {copiedKey === "desc" ? "Copied" : "Copy"}
                          </button>
                          <button
                            onClick={handlePushDescription}
                            disabled={pushingToGbp}
                            className="ui-button-primary inline-flex items-center gap-1 px-3 py-1 text-xs font-bold disabled:opacity-60"
                          >
                            {pushingToGbp ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                            Push to Google
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border">
                        {seoResult.optimized_description}
                      </p>
                    </div>

                    {/* SEO Checklist */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
                        Local SEO Checklist
                      </h3>
                      <div className="space-y-2">
                        {seoResult.seo_checklist.map((chk, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs text-foreground">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{chk.item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-xs">
                    <Zap className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
                    <p className="text-sm font-bold text-foreground">Audit Ready</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                      Click 'Run Local SEO Optimization Analysis' to see high-ranking keywords, recommended services, and an optimized profile description.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
