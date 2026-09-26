import { apiRequest } from "@/lib/api/client";
import {
  getBusinessAccountId,
  getTenantId,
} from "@/lib/auth";

export type AnalyticsMetric = {
  name: string;
  value: number;
  metric_type: string;
};

export type PostAnalytics = {
  campaign_name: string;
  platform: string;
  external_post_id: string;
  published_at: string | null;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  conversions: number;
  engagement_rate: number;
  metrics: AnalyticsMetric[];
};

export type CampaignAnalytics = {
  campaign_name: string;
  start_date: string | null;
  end_date: string | null;

  posts: PostAnalytics[];

  total_impressions: number;
  total_reach: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  total_clicks: number;
  total_conversions: number;

  engagement_rate: number;
  click_through_rate: number;
  conversion_rate: number;

  average_reach_per_post: number;
  average_impressions_per_post: number;
  average_engagements_per_post: number;

  metrics: AnalyticsMetric[];
};

export type AnalyticsHistoryResponse = {
  campaign_name: string;
  start_date: string | null;
  end_date: string | null;
  snapshots: CampaignAnalytics[];
};

function requireTenantId(): string {
  const tenantId = getTenantId();

  if (!tenantId) {
    throw new Error(
      "Tenant context is not available. Please log in again.",
    );
  }

  return tenantId;
}

function requireBusinessAccountId(): number {
  const businessAccountId =
    getBusinessAccountId();

  if (!businessAccountId) {
    throw new Error(
      "Business account context is not available. Please log in again.",
    );
  }

  return businessAccountId;
}

function tenantHeaders(): HeadersInit {
  return {
    "X-Tenant-ID": requireTenantId(),
  };
}

export async function getCampaignAnalytics(
  campaignId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignAnalytics> {
  return apiRequest<CampaignAnalytics>(
    `/campaigns/${campaignId}/analytics?business_account_id=${businessAccountId}`,
    {
      method: "GET",
      headers: tenantHeaders(),
    },
  );
}

export async function getCampaignAnalyticsHistory(
  campaignId: number,
  startDate?: string,
  endDate?: string,
  businessAccountId = requireBusinessAccountId(),
): Promise<AnalyticsHistoryResponse> {
  const params = new URLSearchParams();

  params.set(
    "business_account_id",
    String(businessAccountId),
  );

  if (startDate) {
    params.set("start_date", startDate);
  }

  if (endDate) {
    params.set("end_date", endDate);
  }

  return apiRequest<AnalyticsHistoryResponse>(
    `/campaigns/${campaignId}/analytics/history?${params.toString()}`,
    {
      method: "GET",
      headers: tenantHeaders(),
    },
  );
}