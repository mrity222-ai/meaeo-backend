import { Store, ShoppingBag, BriefcaseBusiness } from "lucide-react";
const useCases = [
  { icon: Store, title: "Local shops & cafes", detail: "Turn catalogue photos and local offers into branded posts, and keep your connected Google Business Profile active." },
  { icon: ShoppingBag, title: "Product businesses", detail: "Use your own product photos, logo and contact details in campaign content. Review the result before scheduling." },
  { icon: BriefcaseBusiness, title: "Professional services", detail: "Plan educational content, schedule company-page posts and review available channel performance in one workspace." },
];
export function TestimonialsSection() {
 return <section className="border-t border-purple-100 bg-white py-20 text-zinc-900"><div className="marketing-section-intro">
          <p className="marketing-eyebrow">Built for your business</p>
  <h2 className="marketing-section-title">Built around your business</h2>
  <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600">Explore practical workflows. Results depend on your content, audience and connected platforms.</p>
  <div className="mt-10 grid gap-6 md:grid-cols-3">{useCases.map(({ icon: Icon, title, detail }) => <article key={title} className="marketing-card rounded-2xl border border-purple-100 p-6"><Icon className="h-7 w-7 text-purple-600" /><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-3 text-sm text-zinc-600">{detail}</p></article>)}</div>
 </div></section>;
}
