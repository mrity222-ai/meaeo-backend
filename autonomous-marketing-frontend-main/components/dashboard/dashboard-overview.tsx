import {
  BarChart3,
  Eye,
  Heart,
  MessageCircle,
  Users,
} from "lucide-react";

import { StatCard } from "./stat-card";
import { CampaignSummary } from "./campaign-summary";
import { UpcomingPosts } from "./upcoming-posts";
import { QuickActions } from "./quick-actions";

export function DashboardOverview() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Reach"
          value="24.8K"
          description="vs. last 30 days"
          change="+18.4%"
          positive
          icon={Eye}
        />

        <StatCard
          title="Engagement"
          value="8.6%"
          description="vs. last 30 days"
          change="+2.1%"
          positive
          icon={Heart}
        />

        <StatCard
          title="Followers"
          value="4,821"
          description="vs. last 30 days"
          change="+9.7%"
          positive
          icon={Users}
        />

        <StatCard
          title="Posts published"
          value="42"
          description="this month"
          change="+12"
          positive
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <CampaignSummary />
        <QuickActions />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <UpcomingPosts />

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h2 className="font-semibold">AI activity</h2>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            What meaeco has been doing.
          </p>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-medium">
                Campaign content generated
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                6 new posts created for September Growth Campaign.
              </p>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-medium">
                Best performing content detected
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Engagement increased 24% compared with the previous period.
              </p>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-sm font-medium">
                Next optimization scheduled
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your content strategy will be reviewed automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
