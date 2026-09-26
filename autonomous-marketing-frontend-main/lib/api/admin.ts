import { apiRequest } from "./client";

export interface AdminStats {
  total_tenants: number;
  total_users: number;
  total_campaigns: number;
  active_campaigns: number;
  total_posts: number;
  published_posts: number;
  total_channels: number;
  system_health: string;
}

export interface AdminUser {
  id: number;
  email: string;
  is_active: boolean;
  created_at: string | null;
  tenants: string[];
}

export interface AdminBusiness {
  id: number;
  tenant_id: string;
  name: string;
  status: string;
  created_at: string | null;
  channels: {
    id: number;
    platform: string;
    account_name: string;
    external_account_id: string;
    status: string;
  }[];
}

export interface AdminCampaign {
  id: number;
  tenant_id: string;
  business_account_id: number;
  campaign_name: string;
  execution_mode: string;
  status: string;
  created_at: string | null;
  started_at: string | null;
  posts_count: number;
}

export interface AdminAuditLog {
  id: number;
  tenant_id: string;
  campaign_post_id: number;
  platform: string;
  status: string;
  external_id: string | null;
  last_error: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
}

export async function fetchAdminStats(): Promise<{ status: string; stats: AdminStats }> {
  return apiRequest<{ status: string; stats: AdminStats }>("/admin/stats");
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  return apiRequest<AdminUser[]>("/admin/users");
}

export async function updateUserStatus(userId: number, isActive: boolean): Promise<{ status: string; user_id: number; is_active: boolean }> {
  return apiRequest<{ status: string; user_id: number; is_active: boolean }>(`/admin/users/${userId}/status?is_active=${isActive}`, {
    method: "PATCH",
  });
}

export async function fetchAdminBusinesses(): Promise<AdminBusiness[]> {
  return apiRequest<AdminBusiness[]>("/admin/businesses");
}

export async function fetchAdminCampaigns(): Promise<AdminCampaign[]> {
  return apiRequest<AdminCampaign[]>("/admin/campaigns");
}

export async function fetchAdminAuditLogs(limit: number = 50): Promise<AdminAuditLog[]> {
  return apiRequest<AdminAuditLog[]>(`/admin/audit-logs?limit=${limit}`);
}
