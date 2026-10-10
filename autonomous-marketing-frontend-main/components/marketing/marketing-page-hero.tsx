import type { ReactNode } from "react";

interface Props { label: string; title: ReactNode; description: ReactNode; children?: ReactNode; }
export function MarketingPageHero({ label, title, description, children }: Props) {
  return <section className="marketing-page-hero">
    <div aria-hidden="true" className="marketing-page-hero-grid" />
    <div className="marketing-page-hero-content">
      <p className="marketing-eyebrow">{label}</p>
      <h1>{title}</h1>
      <div className="marketing-page-description">{description}</div>
      {children && <div className="marketing-page-actions">{children}</div>}
    </div>
  </section>;
}
