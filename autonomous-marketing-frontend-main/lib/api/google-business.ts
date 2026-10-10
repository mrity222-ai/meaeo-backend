import { apiRequest } from "./client";
import { getBusinessAccountId, getTenantId } from "../auth";

function googleRequest<T>(path: string, options?: Parameters<typeof apiRequest>[1]): Promise<T> {
  const businessId = getBusinessAccountId();
  const tenantId = getTenantId();
  if (!businessId) return Promise.reject(new Error("Select a business first."));
  const separator = path.includes("?") ? "&" : "?";
  return apiRequest<T>(`${path}${separator}business_account_id=${businessId}`, options).then(result => {
    if (getBusinessAccountId() !== businessId || getTenantId() !== tenantId)
      throw new Error("Business selection changed. Reload this business view.");
    return result;
  });
}

export type GoogleReview = {
  id: number;
  location_name: string;
  review_id: string;
  reviewer_name: string;
  reviewer_photo_url?: string | null;
  star_rating: number;
  comment?: string | null;
  review_create_time?: string | null;
  reply_status: "unanswered" | "generated" | "replied" | "reconciliation_required";
  reply_text?: string | null;
  replied_at?: string | null;
  sentiment?: "positive" | "neutral" | "negative" | null;
  seo_keywords_used?: string[] | null;
  created_at: string;
};

export type GooglePost = {
  id: number;
  location_name: string;
  post_type: "OFFER" | "STANDARD" | "EVENT";
  summary: string;
  offer_title?: string | null;
  coupon_code?: string | null;
  redeem_url?: string | null;
  terms_conditions?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  call_to_action_type?: string | null;
  call_to_action_url?: string | null;
  media_url?: string | null;
  status: "draft" | "published" | "failed" | "processing" | "reconciliation_required";
  google_post_id?: string | null;
  error_message?: string | null;
  created_at: string;
  published_at?: string | null;
};

export type GeneratedOffer = {
  offer_title: string;
  summary: string;
  coupon_code: string;
  call_to_action_type: string;
  terms_conditions: string;
};

export type OptimizeLocalSeoResponse = {
  business_name: string;
  city: string;
  optimized_description: string;
  target_keywords: string[];
  recommended_services: { name: string; description: string }[];
  profile_completeness_score: number;
  seo_checklist: { item: string; importance: string }[];
};

export async function getGoogleReviews(locationName?: string): Promise<GoogleReview[]> {
  const query = locationName ? `?location_name=${encodeURIComponent(locationName)}` : "";
  return googleRequest<GoogleReview[]>(`/google-business/reviews${query}`);
}

export type GoogleBusinessStatus = {
  is_connected: boolean;
  channel_id?: number | null;
  external_account_id?: string | null;
  business_name: string;
  city: string;
  category: string;
};

export async function getGoogleBusinessStatus(): Promise<GoogleBusinessStatus> {
  return googleRequest<GoogleBusinessStatus>("/google-business/status");
}

export async function generateReviewReply(payload: {
  review_id: number;
  business_name?: string;
  city?: string;
  services?: string[];
  tone?: string;
}): Promise<GoogleReview> {
  return googleRequest<GoogleReview>("/google-business/reviews/generate-reply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendReviewReply(payload: {
  review_id: number;
  reply_text: string;
}): Promise<GoogleReview> {
  return googleRequest<GoogleReview>("/google-business/reviews/send-reply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function generateDailyOffer(payload: {
  business_name?: string;
  industry?: string;
  city?: string;
  theme?: string;
  discount_target?: string;
}): Promise<GeneratedOffer> {
  return googleRequest<GeneratedOffer>("/google-business/offers/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function publishLocalPost(payload: {
  location_name?: string;
  post_type: string;
  summary: string;
  offer_title?: string;
  coupon_code?: string;
  redeem_url?: string;
  terms_conditions?: string;
  call_to_action_type?: string;
  call_to_action_url?: string;
  media_url?: string;
}): Promise<GooglePost> {
  return googleRequest<GooglePost>("/google-business/offers/publish", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLocalPosts(): Promise<GooglePost[]> {
  return googleRequest<GooglePost[]>("/google-business/offers");
}

export async function optimizeLocalSeo(payload: {
  business_name: string;
  industry: string;
  city: string;
  current_description?: string;
  current_services?: string[];
}): Promise<OptimizeLocalSeoResponse> {
  return googleRequest<OptimizeLocalSeoResponse>("/google-business/seo/optimize", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGbpDescription(payload: {
  location_name: string;
  description: string;
}): Promise<{ success: boolean; location_name: string; description?: string; error?: string }> {
  return googleRequest<{ success: boolean; location_name: string; description?: string; error?: string }>(
    "/google-business/profile/update-description",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
