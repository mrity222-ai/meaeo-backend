import { apiRequest } from "@/lib/api/client";

export type BusinessAccountResponse = {
  id: number;
  tenant_id: string;
  name: string;
  status: string;
};

export type BusinessProfileResponse = {
  id: number;
  tenant_id: string;
  business_account_id: number;
  business_name: string;
  category: string;
  description: string;
  website?: string | null;
  country: string;
  city?: string | null;
};

export type AudienceResponse = {
  id: number;
  tenant_id: string;
  business_account_id: number;
  name: string;
  description?: string | null;
  age_min?: number | null;
  age_max?: number | null;
  genders: string[];
  locations: string[];
  languages: string[];
  interests: string[];
  pain_points: string[];
  needs: string[];
};

export type BrandResponse = {
  id: number;
  tenant_id: string;
  business_account_id: number;
  brand_name: string;
  brand_description?: string | null;
  industry: string;
  tone: string;
  custom_voice?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  logo_asset_id?: string | null;
  website?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  logo_position: string;
  contact_position: string;
};

export type MarketingPreferencesResponse = {
  id: number;
  tenant_id: string;
  business_account_id: number;
  primary_goal: string;
  secondary_goals: string[];
  content_types: string[];
  creativity_level?: string | null;
  promotional_intensity?: string | null;
  approval_mode: "autonomous" | "human_intervention";
  timezone: string;
  preferred_posting_time: string;
  posting_frequency:
    | "daily"
    | "weekdays"
    | "three_times_per_week"
    | "custom";
  posting_frequency_config?: unknown;
};

export type CreateBusinessAccountRequest = {
  name: string;
};

export type CreateBusinessProfileRequest = {
  business_account_id: number;
  business_name: string;
  category: string;
  description: string;
  website?: string;
  country: string;
  city?: string;
};

export type CreateAudienceRequest = {
  business_account_id: number;
  name: string;
  description?: string;
  locations: string[];
  genders?: string[];
  age_min?: number;
  age_max?: number;
};

export type CreateBrandRequest = {
  business_account_id: number;
  brand_name: string;
  brand_description?: string;
  industry: string;
  tone: string;
  website?: string;
  logo_asset_id?: string;
  primary_color?: string;
  secondary_color?: string;
  phone?: string;
};

export type CreateMarketingPreferencesRequest = {
  business_account_id: number;
  primary_goal: string;
  secondary_goals: string[];
  content_types: string[];
  approval_mode: "autonomous" | "human_intervention";
  timezone: string;
  preferred_posting_time: string;
  posting_frequency:
    | "daily"
    | "weekdays"
    | "three_times_per_week"
    | "custom";
};

export type AssetResponse = {
  id: string;
  tenant_id: string;
  original_filename: string;
  mime_type: string;
  source: string;
  status: string;
  usage_count: number;
  image_url: string;
};

export async function uploadCatalogueAsset(
  businessAccountId: number,
  tenantId: string,
  file: File,
): Promise<AssetResponse> {
  const formData = new FormData();

  formData.append("file", file);

  return apiRequest<AssetResponse>(
    `/assets/upload?business_account_id=${businessAccountId}`,
    {
      method: "POST",
      body: formData,
      headers: {
        "X-Tenant-ID": tenantId,
      },
    },
  );
}

export async function createBusinessAccount(
  data: CreateBusinessAccountRequest,
): Promise<BusinessAccountResponse> {
  return apiRequest<BusinessAccountResponse>(
    "/business-accounts",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function getBusinessAccounts(): Promise<
  BusinessAccountResponse[]
> {
  return apiRequest<BusinessAccountResponse[]>(
    "/business-accounts",
    {
      method: "GET",
    },
  );
}

export async function createBusinessProfile(
  data: CreateBusinessProfileRequest,
): Promise<BusinessProfileResponse> {
  return apiRequest<BusinessProfileResponse>(
    "/business",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function createAudience(
  data: CreateAudienceRequest,
): Promise<AudienceResponse> {
  return apiRequest<AudienceResponse>(
    "/audiences",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function createBrand(
  data: CreateBrandRequest,
): Promise<BrandResponse> {
  return apiRequest<BrandResponse>(
    "/brand",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function createMarketingPreferences(
  data: CreateMarketingPreferencesRequest,
): Promise<MarketingPreferencesResponse> {
  return apiRequest<MarketingPreferencesResponse>(
    "/marketing-preferences",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}