import type { CampaignPostResponse, ExecutionMode } from "./api/campaigns";

export function campaignPublishingSummary(posts: CampaignPostResponse[], mode: ExecutionMode, now = Date.now()) {
  const published = posts.filter(post => post.publish_status === "published").length;
  const next = posts
    .filter(post => post.scheduled_for && post.publish_status === "pending" &&
      (mode === "autonomous" ? ["pending", "approved"].includes(post.review_status) : post.review_status === "approved") &&
      new Date(post.scheduled_for).getTime() > now)
    .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime())[0];
  return {
    published,
    progress: posts.length ? Math.round(published / posts.length * 100) : null,
    nextScheduledFor: next?.scheduled_for ?? null,
  };
}
