import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "\"This has completely changed how we do marketing. It saves us hours every week and the results are amazing!\"",
    name: "Priya S.",
    role: "Boutique Owner",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  },
  {
    quote:
      "\"The content quality is better than what we could create ourselves. Highly recommend!\"",
    name: "Arjun M.",
    role: "E-commerce Brand",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
  },
  {
    quote:
      "\"Simple to set up and it just works. Our social media has never looked this good.\"",
    name: "Neha K.",
    role: "Home Decor Business",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-[#FAF8FF] py-24 text-zinc-900 border-t border-purple-100">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-purple-600">
            Loved By Business Owners
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl lg:text-5xl">
            Real businesses. Real results.
          </h2>
          <p className="mt-4 text-base text-zinc-600 sm:text-lg">
            See what our early users are achieving with their AI marketing team.
          </p>
        </div>

        {/* 3 Testimonial Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="flex flex-col justify-between rounded-2xl border border-purple-100 bg-white p-7 shadow-sm transition-all hover:shadow-md hover:border-purple-200"
            >
              {/* Quote */}
              <p className="text-sm leading-relaxed text-zinc-700 italic">
                {item.quote}
              </p>

              {/* Author Info + Rating */}
              <div className="mt-8 flex items-center justify-between border-t border-purple-50 pt-4">
                <div className="flex items-center gap-3">
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="h-10 w-10 rounded-full object-cover border border-purple-200"
                  />
                  <div>
                    <div className="text-sm font-bold text-zinc-900">{item.name}</div>
                    <div className="text-xs text-zinc-500">{item.role}</div>
                  </div>
                </div>

                {/* 5 Purple Stars */}
                <div className="flex items-center gap-0.5 text-purple-600">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
