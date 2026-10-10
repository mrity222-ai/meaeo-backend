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
  data_source: string;
  last_updated: string | null;
  availability: string;
  unavailable_reason?: string | null;
  platform: string;
  external_post_id: string;
  published_at: string | null;
  impressions: number | null;
  reach: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  clicks: number | null;
  conversions: number | null;
  engagement_rate: number | null;
  metrics: AnalyticsMetric[];
};

export type CampaignAnalytics = {
  campaign_name: string;
  data_source: string;
  last_updated: string | null;
  availability: string;
  start_date: string | null;
  end_date: string | null;

  posts: PostAnalytics[];

  total_impressions: number | null;
  total_reach: number | null;
  total_likes: number | null;
  total_comments: number | null;
  total_shares: number | null;
  total_saves: number | null;
  total_clicks: number | null;
  total_conversions: number | null;

  engagement_rate: number | null;
  click_through_rate: number | null;
  conversion_rate: number | null;

  average_reach_per_post: number | null;
  average_impressions_per_post: number | null;
  average_engagements_per_post: number | null;

  metrics: AnalyticsMetric[];
};

export type AnalyticsHistoryResponse = {
  campaign_name: string;
  start_date: string | null;
  end_date: string | null;
  snapshots: CampaignAnalytics[];
};

export type GooglePerformance = {
  business_account_id: number;
  channel_id: number | null;
  location_name: string | null;
  start_date: string;
  end_date: string;
  scope: "business_profile";
  data_source: string;
  last_updated: string | null;
  availability: string;
  unavailable_reason: string | null;
  metrics: Record<string, number | null>;
  daily: { date: string; metrics: Record<string, number> }[];
};

export async function getGooglePerformance(startDate: string, endDate: string, locationName?: string): Promise<GooglePerformance> {
  const business = requireBusinessAccountId();
  const tenant = requireTenantId();
  const params = new URLSearchParams({ business_account_id: String(business), start_date: startDate, end_date: endDate });
  if (locationName) params.set("location_name", locationName);
  const result = await apiRequest<GooglePerformance>(`/google-business/performance?${params}`, {
    method: "GET", headers: { "X-Tenant-ID": tenant },
  });
  if (getBusinessAccountId() !== business || getTenantId() !== tenant) throw new Error("Business selection changed. Refresh analytics.");
  return result;
}

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
export function aggregateCampaignMetrics(items: (CampaignAnalytics | null)[]) {
  const sum = (key: "total_reach" | "total_clicks") => {
    const values = items.map(item => item?.[key]);
    return values.length && values.every(value => value != null && Number.isFinite(value)) ? values.reduce<number>((total, value) => total + (value ?? 0), 0) : null;
  };
  const rates = items.map(item => item?.engagement_rate);
  const updated = items.flatMap(item => item?.last_updated ? [item.last_updated] : []).sort();
  return { totalReach: sum("total_reach"), totalClicks: sum("total_clicks"),
    engagementRate: rates.length && rates.every(value => value != null && Number.isFinite(value)) ? (rates.reduce<number>((sum, value) => sum + (value ?? 0), 0) / rates.length * 100).toFixed(1) + "%" : "Data unavailable",
    lastUpdated: updated.at(-1) ?? null };
}


export function publishedPlatformCounts(posts: { publications?: { platform: string; status: string; external_id: string | null }[] }[]) {
  const counts: Record<string, number> = { instagram: 0, linkedin: 0, facebook: 0, google_business: 0 };
  for (const post of posts) {
    for (const publication of post.publications || []) {
      if (publication.status === "published" && publication.external_id) {
        const platform = publication.platform.toLowerCase();
        counts[platform] = (counts[platform] || 0) + 1;
      }
    }
  }
  return counts;
}
