import { normalizePhone } from "@/lib/phone";
import { apiRequest } from "@/lib/api/client";
import { getBusinessAccountId, getTenantId, saveTenantContext } from "@/lib/auth";
import type { OnboardingData } from "@/types/onboarding";

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
  pincode?: string | null;
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
  age_groups: string[];
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
  accent_color?: string | null;
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
  source: "catalogue" | "logo" = "catalogue",
): Promise<AssetResponse> {
  const formData = new FormData();

  formData.append("file", file);

  return apiRequest<AssetResponse>(
    `/assets/upload?business_account_id=${businessAccountId}&source=${source}`,
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

type CheckoutResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open(): void; close(): void; on(name: string, handler: () => void): void };
type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance;
let checkoutScript: Promise<void> | null = null;

function loadCheckout(): Promise<void> {
  const browser = window as unknown as { Razorpay?: RazorpayConstructor };
  if (browser.Razorpay) return Promise.resolve();
  if (checkoutScript) return checkoutScript;
  checkoutScript = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    const timer = setTimeout(() => { script.remove(); reject(new Error("Payment checkout timed out. Please retry.")); }, 15000);
    script.onload = () => {
      clearTimeout(timer);
      if (browser.Razorpay) resolve();
      else reject(new Error("Payment checkout is unavailable. Please retry."));
    };
    script.onerror = () => { clearTimeout(timer); script.remove(); reject(new Error("Payment checkout failed to load. Please retry.")); };
    document.body.appendChild(script);
  }).catch(error => { checkoutScript = null; throw error; });
  return checkoutScript;
}

// Shared by onboarding and the subscription screen. Only backend verification confirms payment.
export async function checkoutSubscription(planCode: string): Promise<void> {
  const tenant = getTenantId();
  if (!tenant) throw new Error("Tenant context is missing. Please sign in again.");
  const headers = { "X-Tenant-ID": tenant };
  const receiptKey = `pending-payment:${tenant}:${planCode}`;
  const verify = async (receipt: CheckoutResponse) => {
    const result = await apiRequest<{ status: string }>("/payments/verify-payment", {
      method: "POST", headers, body: JSON.stringify({ order_id: receipt.razorpay_order_id,
        payment_id: receipt.razorpay_payment_id, signature: receipt.razorpay_signature, provider: "razorpay" }),
    });
    if (result.status !== "success") throw new Error("Payment has not been verified. Please retry verification.");
    sessionStorage.removeItem(receiptKey);
    if (getTenantId() !== tenant) throw new Error("Payment was verified for the previous tenant. Select that business to continue.");
  };
  const pending = sessionStorage.getItem(receiptKey);
  if (pending) { await verify(JSON.parse(pending) as CheckoutResponse); return; }
  const subscription = await apiRequest<{ status: string; plan?: { plan_code: string }; current_period_end?: string | null }>("/payments/my-subscription", { headers });
  if (subscription.status === "active" && subscription.plan?.plan_code === planCode &&
      subscription.current_period_end && new Date(subscription.current_period_end).getTime() > Date.now()) return;
  await loadCheckout();
  const order = await apiRequest<{ order_id: string; amount_minor: number; currency: string; checkout_key: string }>("/payments/create-order", {
    method: "POST", headers, body: JSON.stringify({ plan_code: planCode, provider: "razorpay" }),
  });
  if (!order.checkout_key || !order.order_id || !Number.isSafeInteger(order.amount_minor) || order.amount_minor <= 0 || !order.currency)
    throw new Error("Payment order is invalid. Please retry.");
  const Constructor = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
  await new Promise<void>((resolve, reject) => {
    let submitted = false;
    let settled = false;
    const fail = (error: Error) => { if (!settled) { settled = true; reject(error); } };
    const instance = new Constructor({ key: order.checkout_key, amount: order.amount_minor,
      currency: order.currency, order_id: order.order_id, name: "maeaco", description: "Marketing subscription",
      modal: { ondismiss: () => { if (!submitted) fail(new Error("Payment cancelled. Your paid plan was not activated.")); } },
      handler: async (receipt: CheckoutResponse) => {
        if (settled || submitted) return;
        submitted = true;
        try {
          if (receipt.razorpay_order_id !== order.order_id || !receipt.razorpay_payment_id || !receipt.razorpay_signature)
            throw new Error("Payment response is invalid.");
          sessionStorage.setItem(receiptKey, JSON.stringify(receipt));
          await verify(receipt);
          settled = true; resolve();
        } catch (error) { fail(error instanceof Error ? error : new Error("Payment verification failed. Retry to verify the same payment.")); }
      },
    });
    instance.on("payment.failed", () => { if (!submitted) { fail(new Error("Payment failed. Please retry.")); instance.close(); } });
    instance.open();
  });
}

// Re-read saved records before each retry, including after a page reload.
export async function saveOnboarding(data: OnboardingData): Promise<void> {
  if (!data.businessName.trim() || !data.industry.trim() || !data.description.trim() || !data.country.trim() || !data.brandTone.trim())
    throw new Error("Business name, industry, description, country and brand tone are required.");
  const phone = normalizePhone(data.phone, data.country);
  let businessId = getBusinessAccountId();
  const initialTenant = getTenantId();
  const initialBusiness = businessId;
  const accounts = await getBusinessAccounts();
  if (getTenantId() !== initialTenant || getBusinessAccountId() !== initialBusiness)
    throw new Error("Business selection changed during setup. Please retry.");
  let account = accounts.find(item => item.id === businessId && item.status === "active");
  if (businessId && !account) throw new Error("Selected business is unavailable. Please select an active business.");
  if (!account) {
    const matches = accounts.filter(item => item.status === "active" && item.name.trim().toLowerCase() === data.businessName.trim().toLowerCase());
    if (matches.length > 1) throw new Error("Several matching businesses exist. Please select your business.");
    account = matches[0] || await createBusinessAccount({ name: data.businessName.trim() });
  }
  businessId = account.id;
  saveTenantContext(account.tenant_id, businessId);
  const query = `?business_account_id=${businessId}`;
  const ensureContext = () => {
    if (getTenantId() !== account.tenant_id || getBusinessAccountId() !== businessId)
      throw new Error("Business selection changed during setup. Please retry.");
  };
  const upsert = async <T,>(path: string, payload: Record<string, unknown>) => {
    ensureContext();
    const existing = await apiRequest<T | null>(`${path}${query}`);
    ensureContext();
    const { business_account_id, ...update } = payload;
    return apiRequest<T>(existing ? `${path}${query}` : path, { method: existing ? "PUT" : "POST", body: JSON.stringify(existing ? update : payload) });
  };
  await upsert<BusinessProfileResponse>("/business", { business_account_id: businessId,
    business_name: data.businessName.trim(), category: data.industry.trim(), description: data.description.trim(),
    pincode: data.pincode.trim() || null, website: data.website.trim() || null, country: data.country.trim(), city: data.city.trim() || null });
  ensureContext();
  const audienceName = `${data.businessName.trim()} Audience`;
  const audiences = await apiRequest<AudienceResponse[]>(`/audiences${query}`);
  const audience = audiences.find(item => item.name === audienceName);
  const locations = data.targetLocations.length ? data.targetLocations : [data.city, data.country].filter(Boolean);
  const description = data.targetAudience.trim();
  ensureContext();
  const ranges = data.ageGroups.filter(group => group !== "All Ages").map(group => group.endsWith("+") ? [Number(group.slice(0, -1)), 120] : group.split("-").map(Number));
  const allAges = data.ageGroups.includes("All Ages");
  const age_min = allAges ? 13 : ranges.length ? Math.min(...ranges.map(range => range[0])) : null;
  const age_max = allAges ? 120 : ranges.length ? Math.max(...ranges.map(range => range[1])) : null;
  const audiencePayload = { age_min, age_max, name: audienceName, description: description || "General Audience", locations, genders: data.genders, age_groups: data.ageGroups };
  await apiRequest(audience ? `/audiences/${audience.id}${query}` : "/audiences", {
    method: audience ? "PUT" : "POST", body: JSON.stringify(audience ? audiencePayload : { business_account_id: businessId, ...audiencePayload }),
  });
  ensureContext();
  const brand = await apiRequest<BrandResponse | null>(`/brand${query}`);
  let logoId = brand?.logo_asset_id ?? undefined;
  if (data.logoFile) {
    ensureContext();
    const uploaded = await uploadCatalogueAsset(businessId, account.tenant_id, data.logoFile, "logo");
    logoId = uploaded.id;
  }
  if (!logoId) throw new Error("Upload your brand logo before completing setup.");
  await upsert<BrandResponse>("/brand", { business_account_id: businessId, brand_name: data.businessName.trim(),
    brand_description: data.description.trim(), industry: data.industry.trim(), tone: data.brandTone.trim(),
    website: data.website.trim() || null, logo_asset_id: logoId, primary_color: data.brandColors?.primary,
    secondary_color: data.brandColors?.secondary, accent_color: data.brandColors?.accent, phone });
  for (const file of data.catalogueFiles) {
    ensureContext();
    await uploadCatalogueAsset(businessId, account.tenant_id, file);
  }
  await upsert<MarketingPreferencesResponse>("/marketing-preferences", { business_account_id: businessId,
    primary_goal: data.goals[0] || "Increase sales", secondary_goals: data.goals.slice(1), content_types: [],
    approval_mode: "autonomous", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    preferred_posting_time: "10:00", posting_frequency: "daily" });
  ensureContext();
}
