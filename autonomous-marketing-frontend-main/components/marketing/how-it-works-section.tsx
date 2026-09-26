import { Search, Sparkles, Send, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  {
    step: "1",
    icon: Search,
    title: "Understand",
    description:
      "We learn about your business, products, audience and goals.",
  },
  {
    step: "2",
    icon: Sparkles,
    title: "Create",
    description:
      "AI generates a complete campaign with on-brand content, captions and visuals.",
  },
  {
    step: "3",
    icon: Send,
    title: "Publish",
    description:
      "We schedule and publish across your connected social platforms automatically.",
  },
  {
    step: "4",
    icon: BarChart3,
    title: "Learn",
    description:
      "We analyze performance and continuously improve your content and strategy.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[#FAF8FF] py-24 text-zinc-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-600">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
            From{" "}
            <span className="text-purple-600">strategy</span> to real results.
          </h2>
          <p className="mt-4 text-base text-zinc-600 sm:text-lg">
            Our AI handles the entire marketing workflow, so you can focus on what you do best — running your business.
          </p>
        </div>

        {/* 4 Process Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item, index) => {
            const Icon = item.icon;

            return (
              <div key={item.step} className="relative flex flex-col">
                
                {/* Step Circle Badge */}
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700">
                  {item.step}
                </div>

                {/* Card */}
                <div className="flex-1 rounded-2xl border border-purple-100 bg-white p-7 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-6">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-lg font-bold text-zinc-900">{item.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-zinc-600">
                    {item.description}
                  </p>
                </div>

                {/* Arrow indicator between steps (for desktop layout) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-purple-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
