"use client";
import { useEffect, useState } from "react";
import { getAuthToken } from "@/lib/auth";

interface Enquiry { reference: string; name: string; email: string; subject: string; message: string; created_at: string; }
export function PublicEnquiries() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError("");
    const token = localStorage.getItem("admin_token") || getAuthToken();
    const base = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    fetch(`${base}/public/submissions`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(15000) })
      .then(async (response) => { if (!response.ok) throw new Error("Enquiries unavailable"); return await response.json() as Enquiry[]; })
      .then((data) => { if (active) setItems(data); })
      .catch(() => { if (active) setError("Website enquiries could not be loaded."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return <section className="ui-card p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Website enquiries</h2><button type="button" disabled={loading} onClick={() => setAttempt((value) => value + 1)} className="ui-button-secondary">Refresh enquiries</button></div>
    <p className="mt-2 text-sm text-muted-foreground">Messages saved from the public Contact page. No email reply has been sent automatically.</p>
    {loading ? <p role="status" className="mt-4">Loading enquiries…</p> : error ? <p role="alert" className="mt-4 text-red-600">{error}</p> : !items.length ? <p className="mt-4 text-sm text-muted-foreground">No website enquiries yet.</p> : <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">{items.map((item) => <details key={item.reference} className="rounded-xl border border-border p-4"><summary className="cursor-pointer font-medium">{item.subject} — {item.name}<span className="ml-2 text-xs text-muted-foreground">{item.reference}</span></summary><p className="mt-3 text-xs text-muted-foreground">{item.email} · {new Date(item.created_at).toLocaleString()}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm">{item.message}</p></details>)}</div>}
  </section>;
}
