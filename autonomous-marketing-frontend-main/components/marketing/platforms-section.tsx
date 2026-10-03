const platforms = [
  { name: "Instagram", logo: "/smi/instagram.jpg" },
  { name: "Facebook", logo: "/smi/facebook.jpg" },
  { name: "LinkedIn", logo: "/smi/linkedin.jpg" },
  { name: "Google Business", logo: "/smi/gmb.jpg" },
  { name: "Google Maps", logo: "/smi/maps.jpg" },
];

export function PlatformsSection() {
  // Duplicate array 4 times for a seamless infinite scroll loop
  const marqueePlatforms = [...platforms, ...platforms, ...platforms, ...platforms];

  return (
    <section id="about" className="relative border-y border-purple-100/80 bg-gradient-to-r from-[#FAF8FF] via-purple-50/40 to-[#FAF8FF] py-12 text-zinc-900 overflow-hidden">
      
      {/* Title */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-purple-600">
          Built For Modern Businesses
        </p>
      </div>

      {/* Infinite Scrolling Ticker Wrapper with Gradient Edges */}
      <div className="relative mx-auto max-w-7xl overflow-hidden">
        
        {/* Left Fade Mask */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-[#FAF8FF] to-transparent" />
        
        {/* Right Fade Mask */}
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-[#FAF8FF] to-transparent" />

        {/* Marquee Track */}
        <div className="animate-marquee flex items-center gap-10 sm:gap-14">
          {marqueePlatforms.map((platform, idx) => (
            <div
              key={`${platform.name}-${idx}`}
              className="group flex shrink-0 items-center justify-center transition-transform hover:scale-110"
            >
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-2 shadow-md transition-all group-hover:border-purple-400 group-hover:shadow-purple-500/20">
                <img
                  src={platform.logo}
                  alt={platform.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
