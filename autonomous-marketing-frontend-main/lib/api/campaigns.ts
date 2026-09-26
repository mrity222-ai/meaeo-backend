import { apiRequest } from "@/lib/api/client";

import {
  getBusinessAccountId,
  getTenantId,
} from "@/lib/auth";

export type CampaignStatus =
  | "draft"
  | "running"
  | "paused"
  | "completed"
  | "cancelled";

export type ExecutionMode =
  | "autonomous"
  | "human_intervention";

export type CampaignResponse = {
  id: number;
  tenant_id: string;
  business_account_id: number;
  campaign_name: string;
  execution_mode: ExecutionMode;
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  paused_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
};

export type CampaignPostResponse = {
  id: number;
  campaign_id: number;
  tenant_id: string;

  day: number;
  platforms: string[];

  objective: string;
  content_pillar: string;

  title: string;
  caption: string;
  hashtags: string[];

  image_prompt: string;
  call_to_action: string;
  visual_theme: string;
  asset_tags: string[];

  image_path: string | null;
  image_url: string | null;

  review_status: string;
  rejection_reason: string | null;

  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
};

export type CampaignPostUpdateRequest = {
  title?: string;
  caption?: string;
  hashtags?: string[];
  call_to_action?: string;
  visual_theme?: string;
};

export type CampaignPostRejectRequest = {
  reason?: string | null;
};

export type CampaignScheduleRequest = {
  schedule_type:
    | "delay"
    | "specific_time";
  delay_minutes?: number | null;
  scheduled_for?: string | null;
};

export type CampaignScheduleResponse = {
  campaign_id: number;
  campaign_status: string;
  scheduled_posts: number;
  first_scheduled_for: string;
  last_scheduled_for: string;
};

export type CampaignCreateRequest = {
  business_account_id: number;
  campaign_name: string;
  execution_mode: ExecutionMode;
};

export type CampaignRunRequest = {
  business_account_id: number;
  user_input: string;
  brand_name?: string | null;
};

export type CampaignRunResponse = {
  status: string;
  tenant_id: string;
  business_account_id: number;
  campaign_name?: string | null;
  campaign_bundle?: Record<string, unknown> | null;
  errors: string[];
  warnings: string[];
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

function campaignQuery(
  businessAccountId: number,
): string {
  return `business_account_id=${businessAccountId}`;
}

function tenantHeaders(): HeadersInit {
  return {
    "X-Tenant-ID": requireTenantId(),
  };
}

/* -------------------------------------------------------------------------- */
/* Campaign lifecycle */
/* -------------------------------------------------------------------------- */

export async function getCampaigns(
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignResponse[]> {
  return apiRequest<CampaignResponse[]>(
    `/campaigns?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "GET",
      headers: tenantHeaders(),
    },
  );
}

export async function getCampaign(
  campaignId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignResponse> {
  return apiRequest<CampaignResponse>(
    `/campaigns/${campaignId}?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "GET",
      headers: tenantHeaders(),
    },
  );
}

export async function createCampaign(
  data: CampaignCreateRequest,
): Promise<CampaignResponse> {
  return apiRequest<CampaignResponse>(
    "/campaigns",
    {
      method: "POST",
      headers: tenantHeaders(),
      body: JSON.stringify(data),
    },
  );
}

export async function startCampaign(
  campaignId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignResponse> {
  return apiRequest<CampaignResponse>(
    `/campaigns/${campaignId}/start?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "POST",
      headers: tenantHeaders(),
    },
  );
}

export async function pauseCampaign(
  campaignId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignResponse> {
  return apiRequest<CampaignResponse>(
    `/campaigns/${campaignId}/pause?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "POST",
      headers: tenantHeaders(),
    },
  );
}

export async function resumeCampaign(
  campaignId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignResponse> {
  return apiRequest<CampaignResponse>(
    `/campaigns/${campaignId}/resume?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "POST",
      headers: tenantHeaders(),
    },
  );
}

export async function completeCampaign(
  campaignId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignResponse> {
  return apiRequest<CampaignResponse>(
    `/campaigns/${campaignId}/complete?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "POST",
      headers: tenantHeaders(),
    },
  );
}

export async function cancelCampaign(
  campaignId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignResponse> {
  return apiRequest<CampaignResponse>(
    `/campaigns/${campaignId}/cancel?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "POST",
      headers: tenantHeaders(),
    },
  );
}

export async function deleteCampaign(
  campaignId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<void> {
  await apiRequest<void>(
    `/campaigns/${campaignId}?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "DELETE",
      headers: tenantHeaders(),
    },
  );
}

/**
 * Execute the autonomous marketing graph for an existing
 * draft/paused campaign.
 *
 * Backend:
 * POST /campaigns/{campaign_id}/execute
 */
export async function executeCampaign(
  campaignId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignResponse> {
  return apiRequest<CampaignResponse>(
    `/campaigns/${campaignId}/execute?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "POST",
      headers: tenantHeaders(),
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Direct campaign runner */
/* -------------------------------------------------------------------------- */

export async function runCampaign(
  data: CampaignRunRequest,
): Promise<CampaignRunResponse> {
  return apiRequest<CampaignRunResponse>(
    "/campaigns/run",
    {
      method: "POST",
      headers: tenantHeaders(),
      body: JSON.stringify(data),
    },
  );
}

/* -------------------------------------------------------------------------- */
/* Campaign posts */
/* -------------------------------------------------------------------------- */

export async function getCampaignPosts(
  campaignId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignPostResponse[]> {
  return apiRequest<CampaignPostResponse[]>(
    `/campaigns/${campaignId}/posts?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "GET",
      headers: tenantHeaders(),
    },
  );
}

export async function getCampaignPost(
  campaignId: number,
  postId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignPostResponse> {
  return apiRequest<CampaignPostResponse>(
    `/campaigns/${campaignId}/posts/${postId}?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "GET",
      headers: tenantHeaders(),
    },
  );
}

export async function updateCampaignPost(
  campaignId: number,
  postId: number,
  data: CampaignPostUpdateRequest,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignPostResponse> {
  return apiRequest<CampaignPostResponse>(
    `/campaigns/${campaignId}/posts/${postId}?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "PUT",
      headers: tenantHeaders(),
      body: JSON.stringify(data),
    },
  );
}

export async function approveCampaignPost(
  campaignId: number,
  postId: number,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignPostResponse> {
  return apiRequest<CampaignPostResponse>(
    `/campaigns/${campaignId}/posts/${postId}/approve?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "POST",
      headers: tenantHeaders(),
    },
  );
}

export async function rejectCampaignPost(
  campaignId: number,
  postId: number,
  reason?: string,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignPostResponse> {
  const body: CampaignPostRejectRequest =
    reason?.trim()
      ? { reason: reason.trim() }
      : {};

  return apiRequest<CampaignPostResponse>(
    `/campaigns/${campaignId}/posts/${postId}/reject?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "POST",
      headers: tenantHeaders(),
      body: JSON.stringify(body),
    },
  );
}

export async function scheduleCampaignPost(
  campaignId: number,
  postId: number,
  data: CampaignScheduleRequest,
  businessAccountId = requireBusinessAccountId(),
): Promise<CampaignPostResponse> {
  return apiRequest<CampaignPostResponse>(
    `/campaigns/${campaignId}/posts/${postId}/schedule?${campaignQuery(
      businessAccountId,
    )}`,
    {
      method: "POST",
      headers: tenantHeaders(),
      body: JSON.stringify(data),
    },
  );
}