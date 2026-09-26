import { apiRequest } from "./client";

export type GoogleReview = {
  id: number;
  location_name: string;
  review_id: string;
  reviewer_name: string;
  reviewer_photo_url?: string | null;
  star_rating: number;
  comment?: string | null;
  review_create_time?: string | null;
  reply_status: "unanswered" | "generated" | "replied";
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
  status: "draft" | "published" | "failed";
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
  return apiRequest<GoogleReview[]>(`/google-business/reviews${query}`);
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
  return apiRequest<GoogleBusinessStatus>("/google-business/status");
}

export async function generateReviewReply(payload: {
  review_id: number;
  business_name?: string;
  city?: string;
  services?: string[];
  tone?: string;
}): Promise<GoogleReview> {
  return apiRequest<GoogleReview>("/google-business/reviews/generate-reply", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendReviewReply(payload: {
  review_id: number;
  reply_text: string;
}): Promise<GoogleReview> {
  return apiRequest<GoogleReview>("/google-business/reviews/send-reply", {
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
  return apiRequest<GeneratedOffer>("/google-business/offers/generate", {
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
  return apiRequest<GooglePost>("/google-business/offers/publish", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getLocalPosts(): Promise<GooglePost[]> {
  return apiRequest<GooglePost[]>("/google-business/offers");
}

export async function optimizeLocalSeo(payload: {
  business_name: string;
  industry: string;
  city: string;
  current_description?: string;
  current_services?: string[];
}): Promise<OptimizeLocalSeoResponse> {
  return apiRequest<OptimizeLocalSeoResponse>("/google-business/seo/optimize", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGbpDescription(payload: {
  location_name: string;
  description: string;
}): Promise<{ success: boolean; location_name: string; description: string }> {
  return apiRequest<{ success: boolean; location_name: string; description: string }>(
    "/google-business/profile/update-description",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
