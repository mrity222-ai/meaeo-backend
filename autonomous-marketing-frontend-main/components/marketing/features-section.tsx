import {
  Target,
  Image as ImageIcon,
  Share2,
  Calendar,
  BarChart3,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "AI Strategy",
    description:
      "Get a tailored marketing plan based on your business and goals.",
  },
  {
    icon: ImageIcon,
    title: "Content Creation",
    description:
      "On-brand posts, captions and AI-generated visuals.",
  },
  {
    icon: Share2,
    title: "Multi-Platform Publishing",
    description:
      "Publish to Instagram, Facebook and more, automatically.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Optimal timing for maximum reach and engagement.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "See what's working and get actionable recommendations.",
  },
  {
    icon: Sparkles,
    title: "Continuous Optimization",
    description:
      "Your AI team learns and improves over time.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#FAF8FF] py-24 text-zinc-900 border-t border-purple-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-600">
            Everything You Need
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
            A complete marketing team in one platform.
          </h2>
          <p className="mt-4 text-base text-zinc-600 sm:text-lg">
            Powerful AI tools to help your business grow on autopilot.
          </p>
        </div>

        {/* 6 Feature Grid Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="flex items-start gap-4 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-200"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100/70 text-purple-600">
                  <Icon className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-zinc-900">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
