"use client";

import { useEffect, useRef } from "react";

/** Progressive enhancement: content stays visible without JS or when motion is reduced. */
export function MarketingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = root.current;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!host || !window.IntersectionObserver) return;
    const sections = Array.from(host.querySelectorAll<HTMLElement>("main section"));
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add("is-visible"); observer.unobserve(entry.target);
      }
    }, { threshold: 0.08 });
    const update = () => {
      observer.disconnect();
      sections.forEach((section) => {
        section.classList.remove("marketing-reveal", "is-visible");
        if (!preference.matches && section.getBoundingClientRect().top >= window.innerHeight) {
          section.classList.add("marketing-reveal"); observer.observe(section);
        }
      });
    };
    update(); preference.addEventListener("change", update);
    return () => { observer.disconnect(); preference.removeEventListener("change", update); sections.forEach((section) => section.classList.remove("marketing-reveal", "is-visible")); };
  }, []);
  return <div ref={root} className="marketing-site">{children}</div>;
}
