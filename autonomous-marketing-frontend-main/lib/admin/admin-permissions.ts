import { AdminPermission, AdminUser } from "@/types/admin";

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "users.read",
  "users.create",
  "users.update",
  "users.delete",
  "businesses.read",
  "businesses.update",
  "campaigns.read",
  "campaigns.update",
  "campaigns.delete",
  "content.read",
  "content.moderate",
  "reports.read",
  "settings.read",
  "settings.update",
  "billing.read",
  "billing.manage",
  "system.read",
  "system.manage",
];

export const mockSuperAdmin: AdminUser = {
  id: "admin_super_01",
  name: "Super Administrator",
  email: "admin@marketingsystem.com",
  role: "super_admin",
  avatarUrl: "",
  permissions: ALL_ADMIN_PERMISSIONS,
  lastLogin: "2026-09-10T00:45:00Z",
};

export function hasAdminPermission(
  user: AdminUser | null,
  permission?: AdminPermission
): boolean {
  if (!permission) return true;
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return user.permissions.includes(permission);
}
