"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  ChevronRight,
  Database,
  FileImage,
  Globe2,
  HeartPulse,
  Package,
  Settings2,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type DataModule = {
  title: string;
  description: string;
  count: string;
  label: string;
  href: string;
  icon: React.ReactNode;
};

const modules: DataModule[] = [
  {
    title: "Businesses",
    description:
      "Manage business profiles, workspaces and organization information.",
    count: "248",
    label: "Businesses",
    href: "/admin/businesses",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    title: "Products & Catalogues",
    description:
      "Manage products, services, catalogue items and product metadata.",
    count: "3,842",
    label: "Products",
    href: "/admin/products",
    icon: <Package className="h-5 w-5" />,
  },
  {
    title: "Audiences",
    description:
      "Review customer audiences, segments and targeting information.",
    count: "1,126",
    label: "Audiences",
    href: "/admin/audiences",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "Brand Data",
    description:
      "Manage brand identity, voice, positioning and brand guidelines.",
    count: "241",
    label: "Brand Profiles",
    href: "/admin/brand-data",
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: "Marketing Preferences",
    description:
      "Review marketing objectives, preferences and communication settings.",
    count: "236",
    label: "Profiles",
    href: "/admin/marketing-preferences",
    icon: <Settings2 className="h-5 w-5" />,
  },
  {
    title: "Connections",
    description:
      "Monitor connected social platforms and external integrations.",
    count: "692",
    label: "Connections",
    href: "/admin/connections",
    icon: <Globe2 className="h-5 w-5" />,
  },
  {
    title: "Assets",
    description:
      "Manage uploaded images, media files and campaign assets.",
    count: "18,426",
    label: "Assets",
    href: "/admin/assets",
    icon: <FileImage className="h-5 w-5" />,
  },
];

const healthItems = [
  {
    name: "Database",
    status: "Healthy",
    description: "All primary data services operational.",
  },
  {
    name: "Storage",
    status: "Healthy",
    description: "Media storage operating normally.",
  },
  {
    name: "Data Processing",
    status: "Healthy",
    description: "Background processing within normal limits.",
  },
  {
    name: "External Connections",
    status: "Healthy",
    description: "Connected platform services responding normally.",
  },
];

export default function AdminDataManagementPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href="/admin/dashboard"
              className="hover:text-foreground"
            >
              Admin
            </Link>

            <span>/</span>

            <span className="text-foreground">
              Data Management
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">
            Data Management
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Centralized administration of business, catalogue,
            audience, brand, connection and media data.
          </p>
        </div>

        <Button variant="outline">
          <Database className="mr-2 h-4 w-4" />
          Data Overview
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Businesses"
          value="248"
          description="Registered workspaces"
        />

        <StatCard
          icon={<Package className="h-5 w-5" />}
          label="Products"
          value="3,842"
          description="Catalogue records"
        />

        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Audience Profiles"
          value="1,126"
          description="Audience records"
        />

        <StatCard
          icon={<FileImage className="h-5 w-5" />}
          label="Media Assets"
          value="18,426"
          description="Stored assets"
        />
      </div>

      {/* Data Modules */}
      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Boxes className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Data Modules
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Select a data category to inspect and manage its
                records.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.title}
              href={module.href}
              className="group bg-card p-5 transition hover:bg-muted/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  {module.icon}
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </div>

              <h3 className="mt-4 font-medium">
                {module.title}
              </h3>

              <p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">
                {module.description}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-semibold">
                  {module.count}
                </span>

                <span className="text-xs text-muted-foreground">
                  {module.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Data Health */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border bg-card">
          <div className="border-b p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <HeartPulse className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Data Health
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Current status of core data services.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {healthItems.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-4 p-5"
              >
                <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {item.name}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Data Activity */}
        <section className="rounded-xl border bg-card">
          <div className="border-b p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <BarChart3 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold">
                  Data Activity
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Recent changes across application data.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <ActivityRow
              title="Business profile updated"
              description="Growth Labs"
              time="4 min ago"
            />

            <ActivityRow
              title="New catalogue imported"
              description="Bloom Studio"
              time="18 min ago"
            />

            <ActivityRow
              title="Audience segment created"
              description="Nova Retail"
              time="32 min ago"
            />

            <ActivityRow
              title="Brand profile updated"
              description="Social Craft"
              time="1 hr ago"
            />

            <ActivityRow
              title="12 media assets uploaded"
              description="Peak Digital"
              time="2 hrs ago"
            />
          </div>

          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-between"
            >
              View Data Activity
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>

      {/* Admin Warning */}
      <div className="rounded-xl border border-dashed p-5">
        <div className="flex gap-3">
          <Database className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />

          <div>
            <p className="text-sm font-medium">
              Data shown here is currently mock data
            </p>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              This stage establishes the administration interface.
              Real database queries, record editing, deletion,
              validation and tenant authorization will be connected
              during the Admin API Integration stage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        {icon}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function ActivityRow({
  title,
  description,
  time,
}: {
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/50" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {description}
        </p>
      </div>

      <span className="shrink-0 text-xs text-muted-foreground">
        {time}
      </span>
    </div>
  );
}
