import { apiRequest } from "@/lib/api/client";

import {
  getBusinessAccountId,
  getTenantId,
} from "@/lib/auth";

export type BusinessChannel = {
  id: number;
  platform: string;
  external_account_id: string;
  account_name: string;
  status: string;
  is_enabled: boolean;
  connected: boolean;
};

export type BusinessChannelsResponse = {
  business_account_id: number;
  channels: BusinessChannel[];
};

export type OAuthStartResponse = {
  success?: boolean;
  platform?: string;
  tenant_id?: string;
  business_account_id?: number;
  authorization_url?: string;
};

export type MetaOAuthAccount = {
  platform: "facebook" | "instagram" | string;
  external_account_id: string;
  account_name: string;
  page_id?: string | null;
  page_name?: string | null;
  instagram_account_id?: string | null;
};

export type MetaOAuthSelectionResponse = {
  success: boolean;
  status: string;
  transaction_id: string;
  tenant_id: string;
  business_account_id: number;
  platform: string;
  accounts: MetaOAuthAccount[];
};

export type MetaOAuthSelectRequest = {
  transaction_id: string;
  platform: string;
  external_account_id: string;
};

export type MetaOAuthSelectResponse = {
  success: boolean;
  status: string;
  transaction_id: string;
  tenant_id: string;
  business_account_id: number;
  business_channel_id: number;
  platform: string;
  external_account_id: string;
  account_name: string;
};

export type GoogleBusinessLocation = {
  name: string;
  title: string;
  storefront_address?: Record<string, unknown> | null;
  website_uri?: string | null;
  phone_numbers?: Record<string, unknown> | null;
  categories?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

export type GoogleBusinessSelectionResponse = {
  success?: boolean;
  status?: string;
  transaction_id: string;
  tenant_id?: string;
  business_account_id?: number;
  platform?: string;
  locations: GoogleBusinessLocation[];
};

export type GoogleBusinessSelectRequest = {
  transaction_id: string;
  platform: string;
  external_account_id: string;
};

export type GoogleBusinessSelectResponse = {
  success: boolean;
  status: string;
  transaction_id: string;
  tenant_id: string;
  business_account_id: number;
  business_channel_id: number;
  platform: string;
  external_account_id: string;
  account_name: string;
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
  const businessAccountId = getBusinessAccountId();

  if (!businessAccountId) {
    throw new Error(
      "Business account context is not available. Please complete onboarding first.",
    );
  }

  return businessAccountId;
}

function tenantHeaders(): HeadersInit {
  return {
    "X-Tenant-ID": requireTenantId(),
  };
}

export async function getBusinessChannels(
  businessAccountId = requireBusinessAccountId(),
): Promise<BusinessChannelsResponse> {
  return apiRequest<BusinessChannelsResponse>(
    `/business-accounts/${businessAccountId}/channels`,
    {
      method: "GET",
      headers: tenantHeaders(),
    },
  );
}

export async function startPlatformOAuth(
  platform: string,
  businessAccountId = requireBusinessAccountId(),
): Promise<OAuthStartResponse> {
  const normalizedPlatform = platform.trim().toLowerCase();

  let redirectUri: string | undefined;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

  if (normalizedPlatform === "meta") {
    redirectUri = process.env.NEXT_PUBLIC_META_REDIRECT_URI || `${apiBase}/oauth/meta/callback`;
  } else if (normalizedPlatform === "google_business") {
    redirectUri = process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_REDIRECT_URI || `${apiBase}/oauth/google-business/callback`;
  } else if (normalizedPlatform === "linkedin") {
    redirectUri = process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI || `${apiBase}/oauth/linkedin/callback`;
  }

  if (!redirectUri) {
    throw new Error(
      `OAuth redirect URI is not configured for platform: ${normalizedPlatform}`,
    );
  }

  const params = new URLSearchParams({
    redirect_uri: redirectUri,
  });

  return apiRequest<OAuthStartResponse>(
    `/business-accounts/${businessAccountId}/oauth/${normalizedPlatform}/start?${params.toString()}`,
    {
      method: "GET",
      headers: tenantHeaders(),
    },
  );
}

/**
 * Retrieve the Meta accounts returned by the OAuth callback.
 */
export async function getMetaOAuthSelection(
  transactionId: string,
): Promise<MetaOAuthSelectionResponse> {
  return apiRequest<MetaOAuthSelectionResponse>(
    `/oauth/meta/selection/${encodeURIComponent(transactionId)}`,
    {
      method: "GET",
      headers: tenantHeaders(),
    },
  );
}

/**
 * Select one Facebook/Instagram account from the Meta OAuth transaction.
 */
export async function selectMetaOAuthAccount(
  data: MetaOAuthSelectRequest,
): Promise<MetaOAuthSelectResponse> {
  return apiRequest<MetaOAuthSelectResponse>(
    "/oauth/meta/select",
    {
      method: "POST",
      headers: {
        ...tenantHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}

/**
 * Retrieve Google Business Profile locations returned
 * by the OAuth callback.
 */
export async function getGoogleBusinessSelection(
  transactionId: string,
): Promise<GoogleBusinessSelectionResponse> {
  return apiRequest<GoogleBusinessSelectionResponse>(
    `/oauth/google-business/selection/${encodeURIComponent(transactionId)}`,
    {
      method: "GET",
      headers: tenantHeaders(),
    },
  );
}

/**
 * Select one Google Business Profile location.
 */
export async function selectGoogleBusinessLocation(
  data: GoogleBusinessSelectRequest,
): Promise<GoogleBusinessSelectResponse> {
  return apiRequest<GoogleBusinessSelectResponse>(
    "/oauth/google-business/select",
    {
      method: "POST",
      headers: {
        ...tenantHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}

export type LinkedInAccount = {
  platform: string;
  type: "profile" | "organization" | string;
  external_account_id: string;
  account_name: string;
  email?: string | null;
  picture?: string | null;
};

export type LinkedInSelectionResponse = {
  success?: boolean;
  status?: string;
  transaction_id: string;
  tenant_id?: string;
  business_account_id?: number;
  platform?: string;
  accounts: LinkedInAccount[];
};

export type LinkedInSelectRequest = {
  transaction_id: string;
  platform: string;
  external_account_id: string;
};

export type LinkedInSelectResponse = {
  success: boolean;
  status: string;
  transaction_id: string;
  tenant_id: string;
  business_account_id: number;
  business_channel_id: number;
  platform: string;
  external_account_id: string;
  account_name: string;
};

/**
 * Retrieve LinkedIn accounts returned by the OAuth callback.
 */
export async function getLinkedInSelection(
  transactionId: string,
): Promise<LinkedInSelectionResponse> {
  return apiRequest<LinkedInSelectionResponse>(
    `/oauth/linkedin/selection/${encodeURIComponent(transactionId)}`,
    {
      method: "GET",
      headers: tenantHeaders(),
    },
  );
}

/**
 * Select one LinkedIn account or company page.
 */
export async function selectLinkedInAccount(
  data: LinkedInSelectRequest,
): Promise<LinkedInSelectResponse> {
  return apiRequest<LinkedInSelectResponse>(
    "/oauth/linkedin/select",
    {
      method: "POST",
      headers: {
        ...tenantHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );
}