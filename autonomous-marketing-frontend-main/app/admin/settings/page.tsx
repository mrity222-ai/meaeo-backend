"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Key,
  Globe,
  Shield,
  RefreshCw,
  CheckCircle2,
  Mail,
  CreditCard,
  Lock,
  Eye,
  EyeOff,
  Save,
  Send,
  AlertCircle,
  Loader2,
  Sparkles,
  Copy,
  Check,
  Wand2,
  HelpCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/api/client";

interface SystemSettingsResponse {
  status: string;
  env_settings: {
    email: Record<string, any>;
    ai_models: Record<string, any>;
    payments: Record<string, any>;
    meta: Record<string, any>;
    google: Record<string, any>;
    linkedin: Record<string, any>;
    research: Record<string, any>;
    security: Record<string, any>;
  };
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State flattened for easy binding
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1/payments/webhook`
    : "http://localhost:8000/api/v1/payments/webhook";

  const handleCopyText = (text: string, type: "url" | "secret") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "url") {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } else {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2500);
    }
  };

  const handleGenerateSecret = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
    let randomSecret = "whsec_";
    for (let i = 0; i < 32; i++) {
      randomSecret += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    handleChange("RAZORPAY_WEBHOOK_SECRET", randomSecret);
    setShowSecrets((prev) => ({ ...prev, RAZORPAY_WEBHOOK_SECRET: true }));
  };

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    "email" | "ai" | "payments" | "meta" | "google" | "linkedin" | "research" | "security"
  >("email");

  // Test Email State
  const [testEmail, setTestEmail] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  // Test AI Connection State
  const [testingAI, setTestingAI] = useState<string | null>(null);
  const [aiTestResults, setAiTestResults] = useState<Record<string, { success: boolean; message: string; latency_ms?: number }>>({});

  async function handleTestAI(provider: string, type: "text" | "image" = "text", model?: string) {
    setTestingAI(provider);
    try {
      const keyMap: Record<string, string> = {
        openai: formData.OPENAI_API_KEY,
        gemini: formData.GEMINI_API_KEY,
        anthropic: formData.ANTHROPIC_API_KEY,
        huggingface: formData.HF_TOKEN,
        stability: formData.STABILITY_API_KEY,
        tavily: formData.TAVILY_API_KEY,
        firecrawl: formData.FIRECRAWL_API_KEY,
      };
      const res = await apiRequest<{ success: boolean; message: string; latency_ms?: number }>("/admin/ai/test-connection", {
        method: "POST",
        body: JSON.stringify({
          provider,
          api_key: keyMap[provider] || "",
          type,
          model: model || (type === "image" ? formData.IMAGE_MODEL : formData.TEXT_MODEL_ALIAS),
        }),
      });
      setAiTestResults((prev) => ({ ...prev, [provider]: res }));
    } catch (err: any) {
      setAiTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: err?.message || err?.detail || "Connection test failed." },
      }));
    } finally {
      setTestingAI(null);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<SystemSettingsResponse>("/admin/settings");
      const flatData: Record<string, any> = {};
      const categories = res.env_settings;
      Object.keys(categories).forEach((cat) => {
        Object.assign(flatData, (categories as any)[cat]);
      });
      setFormData(flatData);
      if (flatData.SMTP_USER && !testEmail) {
        setTestEmail(flatData.SMTP_USER);
      }
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || "Failed to load system settings.");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
    if (successMsg) setSuccessMsg(null);
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await apiRequest<{ status: string; message: string }>("/admin/settings", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      setSuccessMsg(res.message || "Settings saved to .env and active in runtime!");
      await loadSettings();
    } catch (err: any) {
      setErrorMsg(err?.detail || err?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSendTestEmail() {
    if (!testEmail.trim()) {
      alert("Please enter a recipient email address.");
      return;
    }
    setSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const res = await apiRequest<{ status: string; message: string }>("/admin/test-email", {
        method: "POST",
        body: JSON.stringify({ recipient_email: testEmail.trim() }),
      });
      setTestEmailResult({ success: true, message: res.message });
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: err?.detail || err?.message || "Failed to send test email.",
      });
    } finally {
      setSendingTestEmail(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl flex items-center gap-2.5">
            <Settings className="text-purple-600 h-7 w-7" /> Admin System & API Settings
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Configure external API Keys, SMTP Email OTP, AI Models, and Super Admin credentials.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadSettings}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition shadow-md shadow-purple-200 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save All Settings
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 shadow-sm animate-in fade-in duration-300">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-800 shadow-sm">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-purple-200/60 pb-3">
        <button
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === "email"
              ? "active-purple-slider"
              : "bg-white/80 text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-100"
          }`}
        >
          <Mail size={15} /> 📧 SMTP & Email OTP
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === "ai"
              ? "active-purple-slider"
              : "bg-white/80 text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-100"
          }`}
        >
          <Sparkles size={15} /> 🤖 AI & Image Models
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === "payments"
              ? "active-purple-slider"
              : "bg-white/80 text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-100"
          }`}
        >
          <CreditCard size={15} /> 💳 Payments (Razorpay)
        </button>
        <button
          onClick={() => setActiveTab("meta")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === "meta"
              ? "active-purple-slider"
              : "bg-white/80 text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-100"
          }`}
        >
          <Globe size={15} /> 📘 Meta (FB/IG) API
        </button>
        <button
          onClick={() => setActiveTab("google")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === "google"
              ? "active-purple-slider"
              : "bg-white/80 text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-100"
          }`}
        >
          <Globe size={15} /> 🏬 Google & GMB
        </button>
        <button
          onClick={() => setActiveTab("linkedin")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === "linkedin"
              ? "active-purple-slider"
              : "bg-white/80 text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-100"
          }`}
        >
          <Key size={15} /> 💼 LinkedIn API
        </button>
        <button
          onClick={() => setActiveTab("research")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === "research"
              ? "active-purple-slider"
              : "bg-white/80 text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-100"
          }`}
        >
          <Globe size={15} /> 🔍 Research APIs
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition ${
            activeTab === "security"
              ? "active-purple-slider"
              : "bg-white/80 text-slate-600 hover:bg-purple-50 hover:text-purple-700 border border-purple-100"
          }`}
        >
          <Lock size={15} /> 🛡️ Super Admin Credentials
        </button>
      </div>

      {/* Main Settings Card */}
      <div className="card-3d p-6 sm:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-neutral-500">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mb-3" />
            <span>Loading system environment configuration...</span>
          </div>
        ) : (
          <div>
            {/* 1. EMAIL & SMTP TAB */}
            {activeTab === "email" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                      <Mail className="text-purple-600" size={20} /> SMTP Email Delivery & OTP Configuration
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Configure your outgoing SMTP server credentials to enable real 6-digit OTP delivery to users.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-500">Email Delivery Mode:</span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      formData.EMAIL_PROVIDER === "smtp"
                        ? "bg-emerald-100 text-emerald-800"
                        : formData.EMAIL_PROVIDER === "resend"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {formData.EMAIL_PROVIDER?.toUpperCase() || "CONSOLE"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      EMAIL_PROVIDER (Select Active Mode)
                    </label>
                    <select
                      value={formData.EMAIL_PROVIDER || "console"}
                      onChange={(e) => handleChange("EMAIL_PROVIDER", e.target.value)}
                      className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 font-medium focus:border-purple-600 focus:bg-white outline-none"
                    >
                      <option value="smtp">smtp (Standard Outgoing SMTP Server - Recommended)</option>
                      <option value="resend">resend (Resend.com API)</option>
                      <option value="console">console (Development Testing Console Log)</option>
                    </select>
                    <span className="text-[11px] text-neutral-500 mt-1 block">
                      Choose <b>smtp</b> for live OTP delivery via Gmail, Hostinger, SendGrid, etc.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      SMTP_HOST (Server Address)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. smtp.gmail.com or smtp.hostinger.com"
                      value={formData.SMTP_HOST || ""}
                      onChange={(e) => handleChange("SMTP_HOST", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      SMTP_PORT
                    </label>
                    <input
                      type="number"
                      placeholder="587"
                      value={formData.SMTP_PORT || 587}
                      onChange={(e) => handleChange("SMTP_PORT", parseInt(e.target.value) || 587)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                    <span className="text-[11px] text-neutral-500 mt-1 block">
                      Port <b>587</b> for TLS/STARTTLS, Port <b>465</b> for SSL.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      SMTP_USE_TLS (Encryption)
                    </label>
                    <select
                      value={formData.SMTP_USE_TLS ? "true" : "false"}
                      onChange={(e) => handleChange("SMTP_USE_TLS", e.target.value === "true")}
                      className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 font-medium focus:border-purple-600 focus:bg-white outline-none"
                    >
                      <option value="true">True (STARTTLS - Recommended for Port 587)</option>
                      <option value="false">False (Direct SSL - Recommended for Port 465)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      SMTP_USER (Username or Email)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. your-email@gmail.com"
                      value={formData.SMTP_USER || ""}
                      onChange={(e) => handleChange("SMTP_USER", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                      <span>SMTP_PASSWORD (or App Password)</span>
                      <button
                        type="button"
                        onClick={() => toggleShowSecret("SMTP_PASSWORD")}
                        className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                      >
                        {showSecrets.SMTP_PASSWORD ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showSecrets.SMTP_PASSWORD ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showSecrets.SMTP_PASSWORD ? "text" : "password"}
                      placeholder="Enter SMTP password or Gmail 16-character App Password"
                      value={formData.SMTP_PASSWORD || ""}
                      onChange={(e) => handleChange("SMTP_PASSWORD", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      EMAIL_FROM (Sender Address)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. no-reply@marketingsystem.com"
                      value={formData.EMAIL_FROM || ""}
                      onChange={(e) => handleChange("EMAIL_FROM", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      EMAIL_FROM_NAME (Display Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Autonomous Marketing System"
                      value={formData.EMAIL_FROM_NAME || ""}
                      onChange={(e) => handleChange("EMAIL_FROM_NAME", e.target.value)}
                      className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Test Email Section */}
                <div className="mt-8 rounded-2xl border border-purple-200 bg-purple-50/50 p-6">
                  <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <Send className="text-purple-600" size={16} /> Test Live Email Delivery (Send Sample OTP)
                  </h4>
                  <p className="text-xs text-neutral-600 mt-1">
                    Send a test email to verify your SMTP configuration before enabling OTP for all users.
                  </p>

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="recipient@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1 text-sm bg-white border border-neutral-300 rounded-xl px-4 py-2.5 text-neutral-900 focus:border-purple-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSendTestEmail}
                      disabled={sendingTestEmail}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition shadow-sm disabled:opacity-60"
                    >
                      {sendingTestEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      Send Test Email
                    </button>
                  </div>

                  {testEmailResult && (
                    <div className={`mt-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                      testEmailResult.success
                        ? "bg-emerald-100 border border-emerald-300 text-emerald-800"
                        : "bg-red-100 border border-red-300 text-red-800"
                    }`}>
                      {testEmailResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{testEmailResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. AI & IMAGE MODELS TAB */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Sparkles className="text-purple-600" size={20} /> Content Writing & Image Generating AI Models
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Configure API Secret Keys for text content generators (OpenAI, Gemini, Hugging Face, Claude) and image generation engines (Flux, Stability AI).
                  </p>
                </div>

                {/* Sub-section: Content Generating Models */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900">✍️ Content Generating Models (Copywriting & Text AI)</span>
                    <span className="text-[11px] font-semibold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Text & Captions</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OpenAI */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-neutral-700">OPENAI_API_KEY (OpenAI Secret)</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTestAI("openai", "text")}
                            disabled={testingAI === "openai"}
                            className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {testingAI === "openai" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                            Test Key
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleShowSecret("OPENAI_API_KEY")}
                            className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                          >
                            {showSecrets.OPENAI_API_KEY ? <EyeOff size={13} /> : <Eye size={13} />}
                            {showSecrets.OPENAI_API_KEY ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <input
                        type={showSecrets.OPENAI_API_KEY ? "text" : "password"}
                        placeholder="sk-proj-••••••••••••••••••••••••"
                        value={formData.OPENAI_API_KEY || ""}
                        onChange={(e) => handleChange("OPENAI_API_KEY", e.target.value)}
                        className="w-full text-sm font-mono bg-white border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 outline-none"
                      />
                      {aiTestResults.openai && (
                        <div className={`mt-1.5 text-xs p-2 rounded-lg flex items-center gap-1.5 ${aiTestResults.openai.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                          {aiTestResults.openai.success ? <CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> : <AlertCircle size={13} className="shrink-0 text-red-600" />}
                          <span className="truncate">{aiTestResults.openai.message}</span>
                        </div>
                      )}
                      <span className="text-[11px] text-neutral-500 mt-1 block">Powers GPT-4o, GPT-4o-mini & DALL-E 3 image generation.</span>
                    </div>

                    {/* HuggingFace */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-neutral-700">HF_TOKEN (HuggingFace Secret)</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTestAI("huggingface", "text")}
                            disabled={testingAI === "huggingface"}
                            className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {testingAI === "huggingface" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                            Test Key
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleShowSecret("HF_TOKEN")}
                            className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                          >
                            {showSecrets.HF_TOKEN ? <EyeOff size={13} /> : <Eye size={13} />}
                            {showSecrets.HF_TOKEN ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <input
                        type={showSecrets.HF_TOKEN ? "text" : "password"}
                        placeholder="hf_••••••••••••••••••••••••"
                        value={formData.HF_TOKEN || ""}
                        onChange={(e) => handleChange("HF_TOKEN", e.target.value)}
                        className="w-full text-sm font-mono bg-white border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 outline-none"
                      />
                      {aiTestResults.huggingface && (
                        <div className={`mt-1.5 text-xs p-2 rounded-lg flex items-center gap-1.5 ${aiTestResults.huggingface.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                          {aiTestResults.huggingface.success ? <CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> : <AlertCircle size={13} className="shrink-0 text-red-600" />}
                          <span className="truncate">{aiTestResults.huggingface.message}</span>
                        </div>
                      )}
                      <span className="text-[11px] text-neutral-500 mt-1 block">Used for Llama-3.1-8B-Instruct and FLUX.1-schnell diffusion.</span>
                    </div>

                    {/* Gemini */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-neutral-700">GEMINI_API_KEY (Google Gemini Key)</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTestAI("gemini", "text")}
                            disabled={testingAI === "gemini"}
                            className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {testingAI === "gemini" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                            Test Key
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleShowSecret("GEMINI_API_KEY")}
                            className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                          >
                            {showSecrets.GEMINI_API_KEY ? <EyeOff size={13} /> : <Eye size={13} />}
                            {showSecrets.GEMINI_API_KEY ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <input
                        type={showSecrets.GEMINI_API_KEY ? "text" : "password"}
                        placeholder="AIzaSy••••••••••••••••••••••••"
                        value={formData.GEMINI_API_KEY || ""}
                        onChange={(e) => handleChange("GEMINI_API_KEY", e.target.value)}
                        className="w-full text-sm font-mono bg-white border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 outline-none"
                      />
                      {aiTestResults.gemini && (
                        <div className={`mt-1.5 text-xs p-2 rounded-lg flex items-center gap-1.5 ${aiTestResults.gemini.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                          {aiTestResults.gemini.success ? <CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> : <AlertCircle size={13} className="shrink-0 text-red-600" />}
                          <span className="truncate">{aiTestResults.gemini.message}</span>
                        </div>
                      )}
                      <span className="text-[11px] text-neutral-500 mt-1 block">Powers Gemini 1.5 Flash/Pro and Imagen 3 photorealistic generation.</span>
                    </div>

                    {/* Anthropic Claude */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-neutral-700">ANTHROPIC_API_KEY (Claude Key)</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTestAI("anthropic", "text")}
                            disabled={testingAI === "anthropic"}
                            className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {testingAI === "anthropic" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                            Test Key
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleShowSecret("ANTHROPIC_API_KEY")}
                            className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                          >
                            {showSecrets.ANTHROPIC_API_KEY ? <EyeOff size={13} /> : <Eye size={13} />}
                            {showSecrets.ANTHROPIC_API_KEY ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <input
                        type={showSecrets.ANTHROPIC_API_KEY ? "text" : "password"}
                        placeholder="sk-ant-••••••••••••••••••••••••"
                        value={formData.ANTHROPIC_API_KEY || ""}
                        onChange={(e) => handleChange("ANTHROPIC_API_KEY", e.target.value)}
                        className="w-full text-sm font-mono bg-white border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 outline-none"
                      />
                      {aiTestResults.anthropic && (
                        <div className={`mt-1.5 text-xs p-2 rounded-lg flex items-center gap-1.5 ${aiTestResults.anthropic.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                          {aiTestResults.anthropic.success ? <CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> : <AlertCircle size={13} className="shrink-0 text-red-600" />}
                          <span className="truncate">{aiTestResults.anthropic.message}</span>
                        </div>
                      )}
                      <span className="text-[11px] text-neutral-500 mt-1 block">Used for Claude 3.5 Sonnet high-conversion copywriting.</span>
                    </div>

                    {/* Active Text Provider */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        TEXT_MODEL_PROVIDER (Active Copywriting Provider)
                      </label>
                      <select
                        value={formData.TEXT_MODEL_PROVIDER || "huggingface"}
                        onChange={(e) => handleChange("TEXT_MODEL_PROVIDER", e.target.value)}
                        className="w-full text-sm bg-white border border-neutral-200 rounded-xl p-3 text-neutral-900 font-medium focus:border-purple-600 outline-none"
                      >
                        <option value="huggingface">huggingface (Meta Llama 3.1 8B via HF API)</option>
                        <option value="openai">openai (OpenAI GPT-4o / GPT-4o-mini)</option>
                        <option value="gemini">gemini (Google Gemini 1.5 Flash / Pro, Gemini 2.0)</option>
                        <option value="anthropic">anthropic (Claude 3.5 Sonnet / Haiku)</option>
                        <option value="mock">mock (Deterministic Local Mock)</option>
                      </select>
                    </div>

                    {/* Active Text Model Alias */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        TEXT_MODEL_ALIAS (Target Model)
                      </label>
                      <input
                        type="text"
                        placeholder="default_chat (or gpt-4o, gemini-1.5-flash)"
                        value={formData.TEXT_MODEL_ALIAS || "default_chat"}
                        onChange={(e) => handleChange("TEXT_MODEL_ALIAS", e.target.value)}
                        className="w-full text-sm font-mono bg-white border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {["default_chat", "gpt-4o-mini", "gpt-4o", "gemini-1.5-flash", "claude-3-5-sonnet-20241022"].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleChange("TEXT_MODEL_ALIAS", preset)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                              formData.TEXT_MODEL_ALIAS === preset
                                ? "bg-purple-100 text-purple-800 border-purple-300 font-bold"
                                : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-section: Image Generating Models */}
                <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900">🎨 Image Generating Models (Visual & Graphic AI)</span>
                    <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Banner & Creatives</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Image Provider Selector */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                        IMAGE_MODEL_PROVIDER (Active Visual Engine)
                      </label>
                      <select
                        value={formData.IMAGE_MODEL_PROVIDER || "huggingface"}
                        onChange={(e) => handleChange("IMAGE_MODEL_PROVIDER", e.target.value)}
                        className="w-full text-sm bg-white border border-neutral-200 rounded-xl p-3 text-neutral-900 font-medium focus:border-purple-600 outline-none"
                      >
                        <option value="huggingface">huggingface (FLUX.1-schnell / SDXL)</option>
                        <option value="openai">openai (OpenAI DALL-E 3)</option>
                        <option value="gemini">gemini (Google Imagen 3 via Gemini API)</option>
                        <option value="stability">stability (Stability AI SD 3.5 / Core)</option>
                        <option value="mock">mock (Deterministic Local Mock)</option>
                      </select>
                      <span className="text-[11px] text-neutral-500 mt-1 block">Active engine used by Image Generator Agent during campaign creation.</span>
                    </div>

                    {/* Image Model Name */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-neutral-700">IMAGE_MODEL (Diffusion Model Name)</label>
                        <button
                          type="button"
                          onClick={() => handleTestAI(formData.IMAGE_MODEL_PROVIDER || "huggingface", "image", formData.IMAGE_MODEL)}
                          disabled={testingAI === (formData.IMAGE_MODEL_PROVIDER || "huggingface")}
                          className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition disabled:opacity-50 flex items-center gap-1"
                        >
                          {testingAI === (formData.IMAGE_MODEL_PROVIDER || "huggingface") ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                          Test Image Engine
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="black-forest-labs/FLUX.1-schnell"
                        value={formData.IMAGE_MODEL || ""}
                        onChange={(e) => handleChange("IMAGE_MODEL", e.target.value)}
                        className="w-full text-sm font-mono bg-white border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[
                          { label: "FLUX.1-schnell", val: "black-forest-labs/FLUX.1-schnell" },
                          { label: "DALL-E 3", val: "dall-e-3" },
                          { label: "Imagen 3", val: "imagen-3.0-generate-002" },
                          { label: "Stable Diffusion XL", val: "stabilityai/stable-diffusion-xl-base-1.0" },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => handleChange("IMAGE_MODEL", item.val)}
                            className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                              formData.IMAGE_MODEL === item.val
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                                : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Stability AI Secret Key */}
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-neutral-700">STABILITY_API_KEY (Stability AI Key)</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleTestAI("stability", "image")}
                            disabled={testingAI === "stability"}
                            className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition disabled:opacity-50 flex items-center gap-1"
                          >
                            {testingAI === "stability" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                            Test Key
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleShowSecret("STABILITY_API_KEY")}
                            className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                          >
                            {showSecrets.STABILITY_API_KEY ? <EyeOff size={13} /> : <Eye size={13} />}
                            {showSecrets.STABILITY_API_KEY ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <input
                        type={showSecrets.STABILITY_API_KEY ? "text" : "password"}
                        placeholder="sk-••••••••••••••••••••••••"
                        value={formData.STABILITY_API_KEY || ""}
                        onChange={(e) => handleChange("STABILITY_API_KEY", e.target.value)}
                        className="w-full text-sm font-mono bg-white border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 outline-none"
                      />
                      {aiTestResults.stability && (
                        <div className={`mt-1.5 text-xs p-2 rounded-lg flex items-center gap-1.5 ${aiTestResults.stability.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                          {aiTestResults.stability.success ? <CheckCircle2 size={13} className="shrink-0 text-emerald-600" /> : <AlertCircle size={13} className="shrink-0 text-red-600" />}
                          <span className="truncate">{aiTestResults.stability.message}</span>
                        </div>
                      )}
                      <span className="text-[11px] text-neutral-500 mt-1 block">Required when IMAGE_MODEL_PROVIDER is set to &apos;stability&apos;.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PAYMENTS & RAZORPAY TAB */}
            {activeTab === "payments" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <CreditCard className="text-purple-600" size={20} /> Razorpay Payment Gateway & Subscriptions
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Configure your live/test Razorpay API credentials and webhook integration.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      RAZORPAY_KEY_ID
                    </label>
                    <input
                      type="text"
                      placeholder="rzp_live_•••••••••••• or rzp_test_••••••••••••"
                      value={formData.RAZORPAY_KEY_ID || ""}
                      onChange={(e) => handleChange("RAZORPAY_KEY_ID", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                      <span>RAZORPAY_KEY_SECRET</span>
                      <button
                        type="button"
                        onClick={() => toggleShowSecret("RAZORPAY_KEY_SECRET")}
                        className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                      >
                        {showSecrets.RAZORPAY_KEY_SECRET ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showSecrets.RAZORPAY_KEY_SECRET ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showSecrets.RAZORPAY_KEY_SECRET ? "text" : "password"}
                      placeholder="••••••••••••••••••••••••"
                      value={formData.RAZORPAY_KEY_SECRET || ""}
                      onChange={(e) => handleChange("RAZORPAY_KEY_SECRET", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                {/* Webhook Configuration & One-Click Copy Box */}
                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5 space-y-5">
                  <div className="flex items-start justify-between gap-4 border-b border-purple-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                        <Sparkles size={16} className="text-purple-600" /> Razorpay Webhook Configuration & Copy Helper
                      </h4>
                      <p className="text-xs text-purple-700 mt-0.5">
                        Copy both Webhook URL and Webhook Secret below to configure on your Razorpay Dashboard (Settings &rarr; Webhooks).
                      </p>
                    </div>
                  </div>

                  {/* 1. Razorpay Webhook URL with Copy Button */}
                  <div>
                    <label className="block text-xs font-bold text-purple-950 mb-1.5 flex items-center justify-between">
                      <span>Razorpay Webhook Endpoint URL</span>
                      <span className="text-[11px] font-medium text-purple-700">Paste in Razorpay Dashboard</span>
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={webhookUrl}
                        className="w-full text-xs font-mono bg-white border border-purple-200 rounded-xl p-3 text-purple-950 outline-none select-all shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyText(webhookUrl, "url")}
                        className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold transition shadow-xs ${
                          copiedUrl
                            ? "bg-emerald-600 text-white"
                            : "bg-purple-600 text-white hover:bg-purple-700"
                        }`}
                      >
                        {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                        {copiedUrl ? "Copied URL!" : "Copy Webhook URL"}
                      </button>
                    </div>
                  </div>

                  {/* 2. RAZORPAY_WEBHOOK_SECRET with Copy & Generate Buttons */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-purple-950">
                        RAZORPAY_WEBHOOK_SECRET (Signature Verification Secret)
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleGenerateSecret}
                          className="text-purple-700 hover:text-purple-950 text-xs font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Wand2 size={13} /> Auto-Generate Secret
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleShowSecret("RAZORPAY_WEBHOOK_SECRET")}
                          className="text-purple-700 hover:text-purple-950 text-xs font-semibold flex items-center gap-1"
                        >
                          {showSecrets.RAZORPAY_WEBHOOK_SECRET ? <EyeOff size={13} /> : <Eye size={13} />}
                          {showSecrets.RAZORPAY_WEBHOOK_SECRET ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type={showSecrets.RAZORPAY_WEBHOOK_SECRET ? "text" : "password"}
                        placeholder="e.g. whsec_my_razorpay_secret_key_12345"
                        value={formData.RAZORPAY_WEBHOOK_SECRET || ""}
                        onChange={(e) => handleChange("RAZORPAY_WEBHOOK_SECRET", e.target.value)}
                        className="w-full text-xs font-mono bg-white border border-purple-200 rounded-xl p-3 text-purple-950 focus:border-purple-600 outline-none shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyText(formData.RAZORPAY_WEBHOOK_SECRET || "", "secret")}
                        disabled={!formData.RAZORPAY_WEBHOOK_SECRET}
                        className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-bold transition shadow-xs disabled:opacity-50 ${
                          copiedSecret
                            ? "bg-emerald-600 text-white"
                            : "bg-purple-950 text-white hover:bg-neutral-900"
                        }`}
                      >
                        {copiedSecret ? <Check size={14} /> : <Copy size={14} />}
                        {copiedSecret ? "Copied Secret!" : "Copy Secret"}
                      </button>
                    </div>
                  </div>

                  {/* 3. Step-by-Step Instructions & Required Events */}
                  <div className="rounded-xl bg-white border border-purple-100 p-4 space-y-3">
                    <h5 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-purple-600" /> Step-by-Step Setup Instructions for Razorpay Dashboard:
                    </h5>
                    <ol className="list-decimal list-inside text-xs text-neutral-600 space-y-2 leading-relaxed">
                      <li>Log in to your <strong>Razorpay Dashboard</strong> (<a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="text-purple-600 underline font-medium">dashboard.razorpay.com</a>).</li>
                      <li>Navigate to <strong>Account & Settings &rarr; Webhooks</strong> and click <strong>"Add New Webhook"</strong>.</li>
                      <li>Click the <strong>"Copy Webhook URL"</strong> button above and paste it into the <strong>Webhook URL</strong> field in Razorpay.</li>
                      <li>Click the <strong>"Copy Secret"</strong> button above (or click <em>Auto-Generate Secret</em> first) and paste it into the <strong>Secret</strong> field in Razorpay.</li>
                      <li>Check the following required active events:
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-purple-800">payment.captured</span>
                          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-purple-800">order.paid</span>
                          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-purple-800">subscription.charged</span>
                          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-purple-800">subscription.activated</span>
                          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-purple-800">subscription.halted</span>
                        </div>
                      </li>
                      <li>Click <strong>Create Webhook</strong> to complete setup.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {/* 4. META (FB / IG) TAB */}
            {activeTab === "meta" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Globe className="text-blue-600" size={20} /> Meta Facebook & Instagram OAuth API
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    OAuth app credentials for publishing posts to Instagram & Facebook Pages.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      META_APP_ID
                    </label>
                    <input
                      type="text"
                      placeholder="Facebook App ID"
                      value={formData.META_APP_ID || ""}
                      onChange={(e) => handleChange("META_APP_ID", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                      <span>META_APP_SECRET</span>
                      <button
                        type="button"
                        onClick={() => toggleShowSecret("META_APP_SECRET")}
                        className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                      >
                        {showSecrets.META_APP_SECRET ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showSecrets.META_APP_SECRET ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showSecrets.META_APP_SECRET ? "text" : "password"}
                      placeholder="••••••••••••••••"
                      value={formData.META_APP_SECRET || ""}
                      onChange={(e) => handleChange("META_APP_SECRET", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      META_REDIRECT_URI
                    </label>
                    <input
                      type="text"
                      placeholder="https://your-domain.com/oauth/meta/callback"
                      value={formData.META_REDIRECT_URI || ""}
                      onChange={(e) => handleChange("META_REDIRECT_URI", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. GOOGLE & GMB TAB */}
            {activeTab === "google" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Globe className="text-red-600" size={20} /> Google SSO & Google Business Profile (GMB) API
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Google OAuth client credentials for One-Tap login and Google My Business reviews/posts.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      GOOGLE_CLIENT_ID
                    </label>
                    <input
                      type="text"
                      placeholder="••••.apps.googleusercontent.com"
                      value={formData.GOOGLE_CLIENT_ID || ""}
                      onChange={(e) => handleChange("GOOGLE_CLIENT_ID", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                      <span>GOOGLE_CLIENT_SECRET</span>
                      <button
                        type="button"
                        onClick={() => toggleShowSecret("GOOGLE_CLIENT_SECRET")}
                        className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                      >
                        {showSecrets.GOOGLE_CLIENT_SECRET ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showSecrets.GOOGLE_CLIENT_SECRET ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showSecrets.GOOGLE_CLIENT_SECRET ? "text" : "password"}
                      placeholder="GOCSPX-••••••••••••••••"
                      value={formData.GOOGLE_CLIENT_SECRET || ""}
                      onChange={(e) => handleChange("GOOGLE_CLIENT_SECRET", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      GOOGLE_REDIRECT_URI (SSO)
                    </label>
                    <input
                      type="text"
                      placeholder="http://127.0.0.1:8000/auth/google/callback"
                      value={formData.GOOGLE_REDIRECT_URI || ""}
                      onChange={(e) => handleChange("GOOGLE_REDIRECT_URI", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      GOOGLE_BUSINESS_REDIRECT_URI (GMB OAuth)
                    </label>
                    <input
                      type="text"
                      placeholder="http://127.0.0.1:8000/oauth/google-business/callback"
                      value={formData.GOOGLE_BUSINESS_REDIRECT_URI || ""}
                      onChange={(e) => handleChange("GOOGLE_BUSINESS_REDIRECT_URI", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. LINKEDIN TAB */}
            {activeTab === "linkedin" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Key className="text-sky-700" size={20} /> LinkedIn Organization & Personal OAuth
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Credentials for automated publishing to LinkedIn company pages and profiles.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      LINKEDIN_CLIENT_ID
                    </label>
                    <input
                      type="text"
                      placeholder="LinkedIn Client ID"
                      value={formData.LINKEDIN_CLIENT_ID || ""}
                      onChange={(e) => handleChange("LINKEDIN_CLIENT_ID", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                      <span>LINKEDIN_CLIENT_SECRET</span>
                      <button
                        type="button"
                        onClick={() => toggleShowSecret("LINKEDIN_CLIENT_SECRET")}
                        className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                      >
                        {showSecrets.LINKEDIN_CLIENT_SECRET ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showSecrets.LINKEDIN_CLIENT_SECRET ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showSecrets.LINKEDIN_CLIENT_SECRET ? "text" : "password"}
                      placeholder="••••••••••••••••"
                      value={formData.LINKEDIN_CLIENT_SECRET || ""}
                      onChange={(e) => handleChange("LINKEDIN_CLIENT_SECRET", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      LINKEDIN_REDIRECT_URI
                    </label>
                    <input
                      type="text"
                      placeholder="http://127.0.0.1:8000/oauth/linkedin/callback"
                      value={formData.LINKEDIN_REDIRECT_URI || ""}
                      onChange={(e) => handleChange("LINKEDIN_REDIRECT_URI", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. RESEARCH APIS TAB */}
            {activeTab === "research" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Globe className="text-emerald-600" size={20} /> SEO Keyword Intelligence & Web Research APIs
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Configure API Secret Keys for SEO search volumes, competitor SERP ranking (DataForSEO), and live web research (Tavily, Firecrawl).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      DATAFORSEO_LOGIN (SEO Account Login)
                    </label>
                    <input
                      type="text"
                      placeholder="account@domain.com"
                      value={formData.DATAFORSEO_LOGIN || ""}
                      onChange={(e) => handleChange("DATAFORSEO_LOGIN", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                    <span className="text-[11px] text-neutral-500 mt-1 block">Your DataForSEO registered email/login ID.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                      <span>DATAFORSEO_PASSWORD (SEO API Secret Key)</span>
                      <button
                        type="button"
                        onClick={() => toggleShowSecret("DATAFORSEO_PASSWORD")}
                        className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                      >
                        {showSecrets.DATAFORSEO_PASSWORD ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showSecrets.DATAFORSEO_PASSWORD ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showSecrets.DATAFORSEO_PASSWORD ? "text" : "password"}
                      placeholder="••••••••••••••••••••••••"
                      value={formData.DATAFORSEO_PASSWORD || ""}
                      onChange={(e) => handleChange("DATAFORSEO_PASSWORD", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                    <span className="text-[11px] text-neutral-500 mt-1 block">DataForSEO API Secret Key / Password for SERP & keyword volume.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                      <span>TAVILY_API_KEY (Live Web Search AI Secret Key)</span>
                      <button
                        type="button"
                        onClick={() => toggleShowSecret("TAVILY_API_KEY")}
                        className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                      >
                        {showSecrets.TAVILY_API_KEY ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showSecrets.TAVILY_API_KEY ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showSecrets.TAVILY_API_KEY ? "text" : "password"}
                      placeholder="tvly-••••••••••••••••"
                      value={formData.TAVILY_API_KEY || ""}
                      onChange={(e) => handleChange("TAVILY_API_KEY", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                    <span className="text-[11px] text-neutral-500 mt-1 block">Real-time search engine AI key for trending market news.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                      <span>FIRECRAWL_API_KEY (Web Crawler Secret Key)</span>
                      <button
                        type="button"
                        onClick={() => toggleShowSecret("FIRECRAWL_API_KEY")}
                        className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                      >
                        {showSecrets.FIRECRAWL_API_KEY ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showSecrets.FIRECRAWL_API_KEY ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showSecrets.FIRECRAWL_API_KEY ? "text" : "password"}
                      placeholder="fc-••••••••••••••••"
                      value={formData.FIRECRAWL_API_KEY || ""}
                      onChange={(e) => handleChange("FIRECRAWL_API_KEY", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                    <span className="text-[11px] text-neutral-500 mt-1 block">Full-page website and competitor content scraper API key.</span>
                  </div>
                </div>
              </div>
            )}

            {/* 8. SUPER ADMIN CREDENTIALS TAB */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <Shield className="text-purple-600" size={20} /> Super Admin Credentials & Access Control
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Manage the master super administrator login email, password, and 6-digit security PIN.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      SUPER_ADMIN_EMAIL
                    </label>
                    <input
                      type="email"
                      placeholder="admin@marketingsystem.com"
                      value={formData.SUPER_ADMIN_EMAIL || ""}
                      onChange={(e) => handleChange("SUPER_ADMIN_EMAIL", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                      <span>SUPER_ADMIN_PASSWORD</span>
                      <button
                        type="button"
                        onClick={() => toggleShowSecret("SUPER_ADMIN_PASSWORD")}
                        className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                      >
                        {showSecrets.SUPER_ADMIN_PASSWORD ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showSecrets.SUPER_ADMIN_PASSWORD ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showSecrets.SUPER_ADMIN_PASSWORD ? "text" : "password"}
                      placeholder="Enter new admin password"
                      value={formData.SUPER_ADMIN_PASSWORD || ""}
                      onChange={(e) => handleChange("SUPER_ADMIN_PASSWORD", e.target.value)}
                      className="w-full text-sm font-mono bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5 flex items-center justify-between">
                      <span>SUPER_ADMIN_PIN (6-Digit 2FA Security PIN)</span>
                      <button
                        type="button"
                        onClick={() => toggleShowSecret("SUPER_ADMIN_PIN")}
                        className="text-purple-600 hover:text-purple-800 text-[11px] font-medium flex items-center gap-1"
                      >
                        {showSecrets.SUPER_ADMIN_PIN ? <EyeOff size={13} /> : <Eye size={13} />}
                        {showSecrets.SUPER_ADMIN_PIN ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showSecrets.SUPER_ADMIN_PIN ? "text" : "password"}
                      maxLength={6}
                      placeholder="984102"
                      value={formData.SUPER_ADMIN_PIN || ""}
                      onChange={(e) => handleChange("SUPER_ADMIN_PIN", e.target.value)}
                      className="w-full text-sm font-mono tracking-widest bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-neutral-900 focus:border-purple-600 focus:bg-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                      Security Portal URL
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value="/admin/login"
                        className="w-full text-sm font-mono bg-neutral-100 border border-neutral-200 rounded-xl p-3 text-neutral-600 select-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Save Bar */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-100 pt-6">
              <span className="text-xs text-neutral-500">
                All modifications are safely committed directly to the system environment file (<code className="font-mono text-purple-700">.env</code>) and applied live in runtime.
              </span>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-bold text-white bg-purple-600 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving Configuration...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save All Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
