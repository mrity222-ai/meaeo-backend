import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  Cpu,
  CreditCard,
  Database,
  FileCheck,
  FileText,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  Megaphone,
  Receipt,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { NavGroup } from "@/types/admin";

export const adminNavigationGroups: NavGroup[] = [
  {
    title: "ADMIN",
    items: [
      {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        permission: "users.read",
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: Users,
        permission: "users.read",
      },
      {
        label: "Businesses",
        href: "/admin/businesses",
        icon: Building2,
        permission: "businesses.read",
      },
      {
        label: "Campaigns",
        href: "/admin/campaigns",
        icon: Megaphone,
        permission: "campaigns.read",
      },
      {
        label: "Content",
        href: "/admin/content",
        icon: FileCheck,
        permission: "content.read",
      },
    ],
  },
  {
    title: "ACCESS",
    items: [
      {
        label: "Roles & Permissions",
        href: "/admin/roles",
        icon: KeyRound,
        permission: "settings.update",
      },
    ],
  },
  {
    title: "DATA",
    items: [
      {
        label: "Connections",
        href: "/admin/connections",
        icon: Link2,
        permission: "system.read",
      },
    ],
  },
  {
    title: "REPORTING",
    items: [
      {
        label: "Reports",
        href: "/admin/reports",
        icon: FileText,
        permission: "reports.read",
      },
      {
        label: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
        permission: "reports.read",
      },
    ],
  },
  {
    title: "AI & AUTOMATION",
    items: [
      {
        label: "AI Activity",
        href: "/admin/ai",
        icon: Sparkles,
        permission: "system.read",
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "System Health & Jobs",
        href: "/admin/system",
        icon: Server,
        permission: "system.manage",
      },
    ],
  },
  {
    title: "BILLING",
    items: [
      {
        label: "Subscriptions",
        href: "/admin/subscriptions",
        icon: CreditCard,
        permission: "billing.read",
      },
      {
        label: "Payments",
        href: "/admin/payments",
        icon: Receipt,
        permission: "billing.read",
      },
    ],
  },
  {
    title: "SUPPORT",
    items: [
      {
        label: "Support Tickets",
        href: "/admin/support",
        icon: LifeBuoy,
        permission: "users.read",
      },
      {
        label: "Notifications",
        href: "/admin/notifications",
        icon: Bell,
        permission: "settings.read",
      },
    ],
  },
  {
    title: "SECURITY",
    items: [
      {
        label: "Audit Logs",
        href: "/admin/audit-logs",
        icon: ShieldAlert,
        permission: "system.read",
      },
    ],
  },
  {
    title: "SETTINGS",
    items: [
      {
        label: "Admin Settings",
        href: "/admin/settings",
        icon: Settings,
        permission: "settings.update",
      },
    ],
  },
];
