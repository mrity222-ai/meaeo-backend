import { LucideIcon } from "lucide-react";

export type AdminRole = "super_admin" | "admin" | "moderator" | "support_agent" | "read_only";

export type AdminPermission =
  | "users.read"
  | "users.create"
  | "users.update"
  | "users.delete"
  | "businesses.read"
  | "businesses.update"
  | "campaigns.read"
  | "campaigns.update"
  | "campaigns.delete"
  | "content.read"
  | "content.moderate"
  | "reports.read"
  | "settings.read"
  | "settings.update"
  | "billing.read"
  | "billing.manage"
  | "system.read"
  | "system.manage";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatarUrl?: string;
  permissions: AdminPermission[];
  lastLogin: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  permission?: AdminPermission;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type AdminStatCardProps = {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "increase" | "decrease" | "neutral";
  description?: string;
  icon: LucideIcon;
};
