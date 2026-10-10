const heights = [18, 30, 46, 26, 62, 84, 52, 34, 72, 100, 66, 40, 58, 88, 44, 24];

export function HeroSignalBackground() {
  return (
    <div aria-hidden="true" className="hero-signal-background">
      <svg className="hero-signal-wave" viewBox="0 0 1440 520" preserveAspectRatio="none" fill="none">
        <path d="M-80 290 C140 120 220 420 440 260 S730 100 930 260 S1220 430 1520 200" />
        <path d="M-80 330 C130 180 240 450 450 300 S760 150 950 300 S1250 450 1520 250" />
        <path d="M-80 370 C160 230 260 470 480 340 S750 200 970 340 S1250 470 1520 300" />
      </svg>
      {["left", "right"].map((side) => <div key={side} className={`hero-signal-bars hero-signal-bars-${side}`}>
        {heights.map((height, index) => <span key={index} style={{ height: `${height}%`, animationDelay: `${-index * 0.31}s` }} />)}
      </div>)}
      <span className="hero-signal-dot hero-signal-dot-one" />
      <span className="hero-signal-dot hero-signal-dot-two" />
      <span className="hero-signal-dot hero-signal-dot-three" />
    </div>
  );
}
