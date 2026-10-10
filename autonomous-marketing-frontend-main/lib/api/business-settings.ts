import { apiRequest } from "./client";
import { getBusinessAccountId, getTenantId } from "@/lib/auth";
import type { BusinessProfileResponse, BrandResponse, AudienceResponse, MarketingPreferencesResponse } from "./onboarding";
export type BusinessSettings = { business: BusinessProfileResponse | null; brand: BrandResponse | null; audiences: AudienceResponse[]; preferences: MarketingPreferencesResponse | null; logo_url: string | null };
export type BusinessSettingsInput = { business: Omit<BusinessProfileResponse, "id" | "tenant_id" | "business_account_id">; brand: Omit<BrandResponse, "id" | "tenant_id" | "business_account_id">; audience_id: number | null; audience: AudienceResponse | null; preferences: MarketingPreferencesResponse | null };
export async function getBusinessSettings(id: number, tenant: string) {
 return apiRequest<BusinessSettings>(`/business/settings?business_account_id=${id}`, {headers: {"X-Tenant-ID": tenant}});
}
export async function saveBusinessSettings(id: number, tenant: string, input: BusinessSettingsInput) {
 if (getBusinessAccountId() !== id || getTenantId() !== tenant) throw new Error("Business selection changed. Reload the form.");
 const result = await apiRequest<BusinessSettings>(`/business/settings?business_account_id=${id}`, {method:"PUT",headers:{"X-Tenant-ID":tenant},body:JSON.stringify(input)});
 if (getBusinessAccountId() !== id || getTenantId() !== tenant) throw new Error("Saved for the previous business. Reload the selected business.");
 window.dispatchEvent(new Event("business-profile-updated"));
 return result;
}
export function assetImageUrl(url: string) {
 if (/^https?:\/\//i.test(url)) return url;
 return `${(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}
