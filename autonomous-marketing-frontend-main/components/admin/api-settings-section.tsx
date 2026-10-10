"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Save, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/api/client";

export interface SettingsSection {
  title: string; description: string; keys: string[]; providers?: string[];
  values: Record<string, string | number | boolean>; configured: Record<string, boolean>;
  active_provider?: string; revision: string; warnings?: string[];
}
const names: Record<string, string> = {
  huggingface: "Hugging Face", openai: "OpenAI", gemini: "Google Gemini / Imagen",
  anthropic: "Anthropic Claude", stability: "Stability AI", ollama: "Ollama (local)",
  smtp: "SMTP", resend: "Resend", console: "Console (development only)",
};
const keyNames: Record<string, string> = { huggingface: "HF_TOKEN", openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY", anthropic: "ANTHROPIC_API_KEY", stability: "STABILITY_API_KEY" };
const labels: Record<string, string> = {
  TAVILY_ENABLED: "Enable Tavily research", FIRECRAWL_ENABLED: "Enable website research", SEO_ENABLED: "Enable SEO research",
  TEXT_MODEL_ALIAS: "Text model name or configured alias", IMAGE_MODEL: "Image model name",
  SMTP_HOST: "SMTP server", SMTP_PORT: "SMTP port", SMTP_USER: "SMTP username",
  SMTP_PASSWORD: "SMTP password", SMTP_USE_TLS: "Use TLS encryption", EMAIL_FROM: "Sender email",
  EMAIL_FROM_NAME: "Sender name", RESEND_API_KEY: "Resend API key", TAVILY_API_KEY: "Tavily API key",
  FIRECRAWL_API_KEY: "Firecrawl API key", DATAFORSEO_LOGIN: "DataForSEO login",
  DATAFORSEO_PASSWORD: "DataForSEO password", META_APP_ID: "Meta app ID", META_APP_SECRET: "Meta app secret",
  META_CONFIG_ID: "Meta configuration ID", META_REDIRECT_URI: "Meta callback URL", META_API_VERSION: "Meta API version",
  GOOGLE_CLIENT_ID: "Google client ID", GOOGLE_CLIENT_SECRET: "Google client secret",
  GOOGLE_REDIRECT_URI: "Google login callback URL", GOOGLE_BUSINESS_REDIRECT_URI: "Google Business callback URL",
  LINKEDIN_CLIENT_ID: "LinkedIn client ID", LINKEDIN_CLIENT_SECRET: "LinkedIn client secret",
  LINKEDIN_REDIRECT_URI: "LinkedIn callback URL", LINKEDIN_OAUTH_SCOPES: "LinkedIn permissions",
  LINKEDIN_ANALYTICS_API_VERSION: "LinkedIn analytics API version", RAZORPAY_KEY_ID: "Razorpay key ID",
  RAZORPAY_KEY_SECRET: "Razorpay key secret", RAZORPAY_WEBHOOK_SECRET: "Razorpay webhook secret",
  SUPER_ADMIN_EMAIL: "Admin email", SUPER_ADMIN_PASSWORD: "Admin password", SUPER_ADMIN_PIN: "Admin security PIN (6 digits)",
};
const secret = (key: string) => /API_KEY|TOKEN|SECRET|PASSWORD|PIN/.test(key);

export function ApiSettingsSection({ id, section, onSaved }: {
  id: string; section: SettingsSection; onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const ai = id === "text" || id === "image";
  const providerField = ai ? `${id.toUpperCase()}_MODEL_PROVIDER` : id === "email" ? "EMAIL_PROVIDER" : null;
  const provider = providerField ? String(draft[providerField] ?? section.values[providerField] ?? "") : "";
  const modelField = id === "text" ? "TEXT_MODEL_ALIAS" : "IMAGE_MODEL";
  const selectedKey = ai && keyNames[provider] ? `${id.toUpperCase()}_${keyNames[provider]}` : null;
  const choices = section.providers ?? (id === "email" ? ["smtp", "resend", "console"] : []);
  const canTest = ai || ["tavily", "firecrawl", "seo", "email", "payments"].includes(id);
  const activeChanged = ai && [providerField!, modelField, selectedKey].some(
    (key) => key && key in draft && draft[key] !== "" && draft[key] !== section.values[key],
  );
  const changed = Object.keys(draft).length > 0 || removed.length > 0;

  function change(key: string, value: string | boolean) {
    setDraft((old) => ({ ...old, [key]: value }));
    setRemoved((old) => old.filter((item) => item !== key));
    setProof(null); setMessage(null);
  }
  function remove(key: string) {
    setRemoved((old) => old.includes(key) ? old.filter((item) => item !== key) : [...old, key]);
    setDraft((old) => { const next = { ...old }; delete next[key]; return next; });
    setProof(null); setMessage(null);
  }
  function changes() {
    return Object.fromEntries(Object.entries(draft).filter(([, value]) => value !== ""));
  }
  async function test() {
    setBusy("test"); setMessage(null); setProof(null);
    try {
      const result = await apiRequest<{ success: boolean; message: string; verification_token?: string }>(
        `/admin/settings/sections/${id}/test`, { method: "POST", body: JSON.stringify({ changes: changes(), remove_keys: removed }) },
      );
      setMessage({ ok: result.success, text: result.message });
      if (result.success && result.verification_token) setProof(result.verification_token);
    } catch (error: any) { setMessage({ ok: false, text: error?.message || "Connection test failed." }); }
    finally { setBusy(null); }
  }
  async function save() {
    setBusy("save"); setMessage(null);
    try {
      const result = await apiRequest<{ message: string }>(`/admin/settings/sections/${id}`, {
        method: "POST", body: JSON.stringify({ changes: changes(), revision: section.revision,
          verification_token: proof, remove_keys: removed }),
      });
      setDraft({}); setRemoved([]); setProof(null); await onSaved();
      setMessage({ ok: true, text: result.message });
    } catch (error: any) { setMessage({ ok: false, text: error?.message || "Settings could not be saved." }); }
    finally { setBusy(null); }
  }
  function field(key: string) {
    const hidden = secret(key), saved = section.configured[key], deleting = removed.includes(key);
    const value = key in draft ? draft[key] : hidden ? "" : section.values[key] ?? "";
    return <div key={key} className="space-y-2">
      <label htmlFor={`${id}-${key}`} className="block text-sm font-medium text-foreground">
        {labels[key] || (hidden ? `${names[provider] || "Provider"} API key` : key)}
      </label>
      {typeof section.values[key] === "boolean" ? (
        <select id={`${id}-${key}`} value={String(value)} disabled={!!busy} className="w-full border border-input px-3 py-2.5"
          onChange={(event) => change(key, event.target.value === "true")}>
          <option value="true">Enabled</option><option value="false">Disabled</option>
        </select>
      ) : <div className="flex items-center gap-2">
        <input id={`${id}-${key}`} type={hidden && !visible[key] ? "password" : key === "SMTP_PORT" ? "number" : "text"}
          autoComplete={hidden ? "new-password" : "off"} value={String(value)} disabled={!!busy || deleting}
          placeholder={hidden ? saved ? "Saved key — leave blank to keep it" : "Enter new key" : key === "IMAGE_MODEL" && provider === "stability" ? "core" : "Enter value"}
          onChange={(event) => change(key, event.target.value)} className="w-full min-w-0 border border-input px-3 py-2.5 text-sm" />
        {hidden && <button type="button" className="ui-button-secondary p-2.5" aria-label={visible[key] ? "Hide new key" : "Show new key"}
          onClick={() => setVisible((old) => ({ ...old, [key]: !old[key] }))}>{visible[key] ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
      </div>}
      {hidden && <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className={deleting ? "text-red-600" : "text-muted-foreground"}>
          {deleting ? "Will be removed when saved" : saved ? "Configured; original value is hidden" : "No saved key"}
        </span>
        {saved && <button type="button" disabled={!!busy} onClick={() => remove(key)} className="text-red-600 underline">
          {deleting ? "Undo removal" : "Remove saved key"}</button>}
      </div>}
    </div>;
  }
  let fields = section.keys.filter((key) => key !== providerField);
  if (ai) fields = [modelField, ...(selectedKey ? [selectedKey] : [])];
  if (id === "email") fields = fields.filter((key) => provider === "smtp" ? key !== "RESEND_API_KEY"
    : provider === "resend" ? !key.startsWith("SMTP_") : !key.startsWith("SMTP_") && key !== "RESEND_API_KEY");
  const inactive = ai || id === "email" ? section.keys.filter((key) => secret(key) && !fields.includes(key) && section.configured[key]) : [];
  const missingModel = ai && modelField in draft && !draft[modelField];

  return <section id={`settings-${id}`} className="ui-card scroll-mt-6 space-y-5 p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{section.description}</p></div>
      {section.active_provider && <span className="ui-badge-neutral px-3 py-1">{["tavily", "firecrawl", "seo"].includes(id) ? "Status" : "Active"}: {names[section.active_provider] || section.active_provider}</span>}
    </div>
    {section.warnings?.map((warning) => <p key={warning} role="status" className="rounded-xl border border-amber-300 p-3 text-sm text-amber-700">{warning}</p>)}
    {providerField && <div className="max-w-lg space-y-2">
      <label htmlFor={`${id}-provider`} className="text-sm font-medium">Select provider</label>
      <select id={`${id}-provider`} value={provider} disabled={!!busy} className="w-full border border-input px-3 py-2.5"
        onChange={(event) => { change(providerField, event.target.value); if (ai) setDraft((old) => ({ ...old, [modelField]: "" })); }}>
        {!choices.includes(provider) && <option value={provider}>{provider || "Choose provider"} (existing configuration)</option>}
        {choices.map((choice) => <option key={choice} value={choice}>{names[choice] || choice}</option>)}
      </select>
      {ai && <p className="text-xs text-muted-foreground">Only the active provider runs. Enter its exact model, test, then activate. Inactive keys stay saved until explicitly removed.</p>}
    </div>}
    <div className="grid gap-5 md:grid-cols-2">{fields.map(field)}</div>
    {inactive.length > 0 && <details className="rounded-xl border border-border p-3">
      <summary className="cursor-pointer text-sm font-medium">Saved inactive provider keys ({inactive.length})</summary>
      <div className="mt-3 space-y-3">{inactive.map((key) => <div key={key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>{key.replace(`${id.toUpperCase()}_`, "")} — {removed.includes(key) ? "pending removal" : "saved, inactive"}</span>
        <button type="button" disabled={!!busy} onClick={() => remove(key)} className="text-red-600 underline">{removed.includes(key) ? "Undo removal" : "Remove saved key"}</button>
      </div>)}</div>
    </details>}
    {message && <div role={message.ok ? "status" : "alert"} className={`rounded-xl border p-3 text-sm ${message.ok ? "border-emerald-300 text-emerald-700" : "border-red-300 text-red-600"}`}>{message.text}</div>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">Saves this section only. Blank key fields preserve saved keys.</p>
      <div className="flex flex-wrap gap-2">
        {canTest && <button type="button" disabled={!!busy || missingModel} onClick={test} className="ui-button-secondary inline-flex items-center gap-2 px-4 py-2.5 text-sm">
          {busy === "test" ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Test connection</button>}
        <button type="button" disabled={!!busy || !changed || missingModel || (activeChanged && !proof)} onClick={save}
          className="ui-button-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm">
          {busy === "save" ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{ai && activeChanged ? "Activate provider" : "Save section"}
        </button>
      </div>
    </div>
  </section>;
}
