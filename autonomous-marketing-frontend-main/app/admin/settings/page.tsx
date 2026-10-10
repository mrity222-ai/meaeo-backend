"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Settings } from "lucide-react";
import { ApiSettingsSection, SettingsSection } from "@/components/admin/api-settings-section";
import { apiRequest } from "@/lib/api/client";

export default function AdminSettingsPage() {
  const [sections, setSections] = useState<Record<string, SettingsSection>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const load = useCallback(async () => {
    const response = await apiRequest<{ sections: Record<string, SettingsSection> }>("/admin/settings/sections");
    setSections(response.sections);
  }, []);
  async function refresh() {
    setLoading(true); setError(null);
    try { await load(); setGeneration((old) => old + 1); }
    catch (failure: any) { setError(failure?.message || "Settings could not be loaded."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    load().catch((failure) => setError(failure?.message || "Settings could not be loaded."))
      .finally(() => setLoading(false));
  }, [load]);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold text-foreground"><Settings size={26} /> API & System Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage each integration by its purpose. Text and image providers have independent keys.</p></div>
      <button type="button" onClick={refresh} disabled={loading} className="ui-button-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm">
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh settings</button>
    </div>
    <div className="ui-card space-y-2 p-4 text-sm text-muted-foreground">
      <p>Saved settings apply to new API requests and worker tasks. Current operations keep their configuration snapshot.</p>
      <p>Database, storage, encryption keys and frontend API URLs remain deployment settings. They require a restart or rebuild.</p>
      <p>Connection tests may use provider credits. Image tests check credentials/model access; full generation and publishing need live verification.</p>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-300 p-4 text-red-600">{error}</p>}
    {loading ? <div role="status" className="flex items-center gap-2 p-6"><Loader2 className="animate-spin" size={20} /> Loading settings…</div> : <>
      <nav aria-label="Settings sections" className="flex flex-wrap gap-2">
        {Object.entries(sections).map(([id, section]) => <a key={id} href={`#settings-${id}`} className="ui-button-secondary px-3 py-2 text-xs">{section.title}</a>)}
      </nav>
      {Object.entries(sections).map(([id, section]) => <ApiSettingsSection key={`${generation}-${id}`} id={id} section={section} onSaved={load} />)}
    </>}
  </div>;
}
