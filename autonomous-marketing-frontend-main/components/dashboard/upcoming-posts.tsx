import { CalendarDays, Clock3 } from "lucide-react";

type ScheduledPost = { platform: string; title: string; date: string; time: string };

export function UpcomingPosts({posts = []}: {posts?: ScheduledPost[]}) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border p-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          <h2 className="font-semibold">Upcoming posts</h2>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Content scheduled by maeaco
        </p>
      </div>

      <div className="divide-y divide-border">
        {posts.length === 0 && <p className="p-5 text-sm text-muted-foreground">No scheduled post data available.</p>}
        {posts.map((post) => (
          <div key={post.title} className="p-5">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-semibold">
                {post.platform.slice(0, 2)}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium">{post.title}</p>

                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{post.platform}</span>

                  <span className="flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {post.date} Â· {post.time}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
