import Link from "next/link";
import { ArrowRight, Pause, Play } from "lucide-react";

type SummaryCampaign = { name: string; status: string; progress: number; posts: string };

export function CampaignSummary({campaigns = []}: {campaigns?: SummaryCampaign[]}) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h2 className="font-semibold">Active campaigns</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Current campaign activity
          </p>
        </div>

        <Link
          href="/campaigns"
          className="flex items-center gap-1 text-sm font-medium hover:underline"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {campaigns.length === 0 && <p className="p-5 text-sm text-muted-foreground">No campaign data available.</p>}
        {campaigns.map((campaign) => (
          <div key={campaign.name} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">{campaign.name}</p>

                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {campaign.status === "Running" ? (
                    <Play className="h-3 w-3" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}

                  {campaign.status}
                  <span>â€¢</span>
                  {campaign.posts}
                </div>
              </div>

              <span className="text-sm font-semibold">
                {campaign.progress}%
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground"
                style={{ width: `${campaign.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
