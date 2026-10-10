"use client";
import { normalizePhone } from "@/lib/phone";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Globe,
  ImageIcon,
  Loader2,
  Lock,
  MapPin,
  Mic,
  MicOff,
  Palette,
  Phone,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  UploadCloud,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { OnboardingData } from "@/types/onboarding";
import { checkoutSubscription, saveOnboarding } from "@/lib/api/onboarding";
import { apiRequest } from "@/lib/api/client";
// =========================================================================
// 5-STEP DEFINITIONS
// =========================================================================
const steps = [
  {
    number: 1,
    title: "Your business",
    description: "Tell us about your business, contact & location.",
    icon: Globe,
  },
  {
    number: 2,
    title: "Your audience",
    description: "Who are you trying to reach? Age, gender & locations.",
    icon: Users,
  },
  {
    number: 3,
    title: "Your goals",
    description: "What do you want your marketing to achieve?",
    icon: Target,
  },
  {
    number: 4,
    title: "Your Brand Details",
    description: "Upload your brand logo and configure your brand identity.",
    icon: Zap,
  },
  {
    number: 5,
    title: "Choose Your Plan",
    description: "Select a subscription plan that fits your business needs.",
    icon: ShieldCheck,
  },
];

const goalOptions = [
  "Increase sales",
  "Generate leads",
  "Build brand awareness",
  "Grow social media",
  "Drive website traffic",
  "Launch a new product",
];

const ageGroupOptions = ["18-24", "25-34", "35-44", "45-54", "55+", "All Ages"];
const genderOptions = ["All", "Men", "Women"];

const brandToneOptions = [
  { id: "professional", label: "Professional & Corporate", desc: "Formal, credible, authoritative", icon: "💼" },
  { id: "friendly", label: "Friendly & Approachable", desc: "Warm, welcoming, polite", icon: "😊" },
  { id: "bold", label: "Bold & Energetic", desc: "Punchy, dynamic, attention-grabbing", icon: "⚡" },
  { id: "luxury", label: "Luxury & Elegant", desc: "Sophisticated, exclusive, high-end", icon: "👑" },
  { id: "casual", label: "Casual & Relatable", desc: "Relaxed, conversational, everyday", icon: "☕" },
  { id: "empathetic", label: "Empathetic & Caring", desc: "Supportive, compassionate, helpful", icon: "❤️" },
  { id: "witty", label: "Witty & Humorous", desc: "Clever, entertaining, playful", icon: "🎯" },
];

interface SubscriptionPlan {
  id: number;
  plan_code: string;
  name: string;
  description: string | null;
  price: number;
  price_usd?: number | null;
  currency: string;
  billing_interval: string;
  max_brands: number;
  max_campaigns_per_month: number;
  features: { bullets?: string[]; [key: string]: any } | null;
  is_popular?: boolean;
  badge_text?: string | null;
  is_active: boolean;
}

const emptyData: OnboardingData = {
  businessName: "",
  industry: "",
  website: "",
  description: "",
  country: "India",
  city: "",
  phone: "",
  pincode: "",
  targetAudience: "",
  targetLocation: "",
  targetLocations: [],
  ageGroups: ["18-24", "25-34", "35-44"],
  genders: ["All"],
  goals: [],
  platforms: [],
  brandTone: "Professional & Corporate",
  brandColors: {
    primary: "#7C3AED",
    secondary: "#2563EB",
    accent: "#F59E0B",
  },
  logoFile: null,
  selectedPlan: "premium",
  catalogueFiles: [],
};

export function OnboardingForm() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(emptyData);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [colorStatus, setColorStatus] = useState<"idle" | "pending" | "ready" | "manual">("idle");
  const colorPreviewRef = useRef<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New location input state
  const [newLocationInput, setNewLocationInput] = useState("");

  // Plans from backend
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>("premium");

  // Microphone / Speech-to-Text States
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"hi-IN" | "en-IN">("hi-IN");
  const recognitionRef = useRef<any>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop state for brand tone
  const [draggedTone, setDraggedTone] = useState<string | null>(null);

  // Fetch live subscription plans
  useEffect(() => {
    let isMounted = true;
    const fetchPlans = async () => {
      try {
        const list = await apiRequest<SubscriptionPlan[]>("/payments/plans?include_inactive=false");
        if (!Array.isArray(list) || !list.length) throw new Error("No subscription plans are available.");
        if (isMounted) { setPlans(list); setSelectedPlanCode((list.find(p => p.is_popular) || list[0]).plan_code); }
      } catch {
        if (isMounted) setError("Subscription plans could not be loaded. Reload this page to retry.");
      }
    };

    fetchPlans();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync default location from Step 1 into Step 2 targetLocations
  useEffect(() => {
    if (currentStep === 2 && data.targetLocations.length === 0) {
      const defaultLoc = [data.city, data.country].filter(Boolean).join(", ");
      if (defaultLoc) {
        setData((prev) => ({
          ...prev,
          targetLocations: [defaultLoc],
        }));
      }
    }
  }, [currentStep, data.city, data.country, data.targetLocations.length]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Voice typing is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = speechLang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript + " ";
          }
        }
        if (transcript.trim()) {
          setData((previous) => ({
            ...previous,
            description: previous.description
              ? `${previous.description.trim()} ${transcript.trim()}`
              : transcript.trim(),
          }));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setError(
            "Microphone permission was blocked. Please allow microphone access in your browser address bar."
          );
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn("Speech recognition initialization error:", err);
      setIsListening(false);
      setError("Unable to start microphone. Please try again or type directly.");
    }
  };

  // Canvas-based dominant color extraction from uploaded logo
  const extractColorsFromImage = (imageSrc: string) => {
    if (typeof window === "undefined") return;
    colorPreviewRef.current = imageSrc;
    setColorStatus("pending");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (colorPreviewRef.current !== imageSrc) return;
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) { setColorStatus("manual"); return; }
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);
        const imageData = ctx.getImageData(0, 0, 100, 100).data;
        const colorCounts: { [hex: string]: number } = {};

        for (let i = 0; i < imageData.length; i += 16) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];
          if (a < 128) continue; // transparent
          if (r > 240 && g > 240 && b > 240) continue; // near white
          if (r < 20 && g < 20 && b < 20) continue; // near black

          // group colors by 16 step to find clusters
          const hex = `#${((1 << 24) + ((r & 0xf0) << 16) + ((g & 0xf0) << 8) + (b & 0xf0)).toString(16).slice(1)}`;
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        const sorted = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);
        const primary = sorted[0] || "#7C3AED";
        const secondary = sorted[1] || "#2563EB";
        const accent = sorted[2] || "#F59E0B";

        setData((prev) => ({
          ...prev,
          brandColors: { primary, secondary, accent },
        }));
        setColorStatus(sorted.length ? "ready" : "manual");
      } catch (e) {
        setColorStatus("manual");
        console.warn("Color extraction error:", e);
      }
    };
    img.onerror = () => { if (colorPreviewRef.current === imageSrc) setColorStatus("manual"); };
    img.src = imageSrc;
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Logo file size must be less than 5MB.");
      return;
    }

    setData((prev) => ({ ...prev, logoFile: file }));
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    extractColorsFromImage(previewUrl);
    setError(null);
  };

  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please drop a valid image file (PNG, JPG, SVG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Logo file size must be less than 5MB.");
      return;
    }

    setData((prev) => ({ ...prev, logoFile: file }));
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    extractColorsFromImage(previewUrl);
    setError(null);
  };

  const removeLogo = () => {
    colorPreviewRef.current = null;
    setColorStatus("idle");
    setData((prev) => ({ ...prev, logoFile: null }));
    setLogoPreview(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const updateField = <K extends keyof OnboardingData>(
    field: K,
    value: OnboardingData[K]
  ) => {
    setData((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError(null);
  };

  const toggleAgeGroup = (age: string) => {
    if (age === "All Ages") {
      const allSelected = ageGroupOptions.every((a) => data.ageGroups.includes(a));
      if (allSelected) {
        setData((prev) => ({ ...prev, ageGroups: [] }));
      } else {
        setData((prev) => ({ ...prev, ageGroups: [...ageGroupOptions] }));
      }
      return;
    }

    setData((prev) => {
      const exists = prev.ageGroups.includes(age);
      let updated = exists
        ? prev.ageGroups.filter((item) => item !== age && item !== "All Ages")
        : [...prev.ageGroups.filter((item) => item !== "All Ages"), age];

      // If all individual age brackets are picked, add "All Ages"
      const individualOptions = ageGroupOptions.filter((a) => a !== "All Ages");
      if (individualOptions.every((opt) => updated.includes(opt))) {
        updated.push("All Ages");
      }
      return { ...prev, ageGroups: updated };
    });
  };

  const toggleGender = (gender: string) => {
    if (gender === "All") {
      setData((prev) => ({ ...prev, genders: ["All"] }));
      return;
    }

    setData((prev) => {
      let updated = prev.genders.filter((g) => g !== "All");
      if (updated.includes(gender)) {
        updated = updated.filter((g) => g !== gender);
        if (updated.length === 0) updated = ["All"];
      } else {
        updated.push(gender);
        if (updated.includes("Men") && updated.includes("Women")) {
          updated = ["All"];
        }
      }
      return { ...prev, genders: updated };
    });
  };

  const addLocationTag = () => {
    const loc = newLocationInput.trim();
    if (!loc) return;
    if (!data.targetLocations.includes(loc)) {
      setData((prev) => ({
        ...prev,
        targetLocations: [...prev.targetLocations, loc],
      }));
    }
    setNewLocationInput("");
  };

  const removeLocationTag = (index: number) => {
    setData((prev) => ({
      ...prev,
      targetLocations: prev.targetLocations.filter((_, i) => i !== index),
    }));
  };

  const toggleArrayValue = (
    field: "goals" | "platforms",
    value: string
  ) => {
    setData((previous) => {
      const exists = previous[field].includes(value);
      const updated = exists
        ? previous[field].filter((item) => item !== value)
        : [...previous[field], value];

      return {
        ...previous,
        [field]: updated,
      };
    });
    setError(null);
  };

  const validateStep = () => {
    setError(null);

    if (currentStep === 1) {
      try { normalizePhone(data.phone, data.country); } catch (err) {
        setError(err instanceof Error ? err.message : "Mobile number is required.");
        return false;
      }
      if (!data.businessName.trim()) {
        setError("Please enter your business name.");
        return false;
      }

      if (!data.industry.trim()) {
        setError("Please enter your industry.");
        return false;
      }

      if (!data.country.trim()) {
        setError("Please enter your country.");
        return false;
      }

      if (!data.description.trim()) {
        setError("Please provide a short description about your business.");
        return false;
      }
    }

    if (currentStep === 2) {
      if (data.ageGroups.length === 0) {
        setError("Please select at least one target age group.");
        return false;
      }

      if (data.genders.length === 0) {
        setError("Please select a target gender.");
        return false;
      }

      if (data.targetLocations.length === 0 && !data.city && !data.country) {
        setError("Please add at least one target location.");
        return false;
      }
    }

    if (currentStep === 3) {
      if (data.goals.length === 0) {
        setError("Please select at least one marketing goal.");
        return false;
      }
    }

    if (currentStep === 4) {
      // LOGO IS MANDATORY
      if (!data.logoFile && !logoPreview) {
        setError("Please upload your Brand Logo. Logo upload is mandatory to proceed.");
        return false;
      }

      if (!data.brandTone.trim()) {
        setError("Please select your brand tone.");
        return false;
      }
    }

    return true;
  };

  const nextStep = () => {
    if (!validateStep()) {
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep((step) => step + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1 && !isSubmitting) {
      setCurrentStep((step) => step - 1);
      setError(null);
    }
  };

  // Save every required step before checkout; no partial setup is presented as complete.
  const handleCompleteWithPlan = async () => {
    if (isSubmitting) return;
    setError(null); setIsSubmitting(true);
    try {
      const plan = plans.find(item => item.plan_code === selectedPlanCode);
      if (!plan) throw new Error("Select an available subscription plan. Reload if plans failed to load.");
      await saveOnboarding(data);
      if (plan.price > 0) { await checkoutSubscription(plan.plan_code); }
      router.push("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Setup failed. Please retry.");
    } finally { setIsSubmitting(false); }
  };

  const resetForm = () => {
    colorPreviewRef.current = null;
    setColorStatus("idle");
    if (isSubmitting) {
      return;
    }
    setData({
      ...emptyData,
      catalogueFiles: [],
    });
    setLogoPreview(null);
    setCurrentStep(1);
    setError(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  };

  const activeSelectedPlan = plans.find((p) => p.plan_code === selectedPlanCode) || plans[0];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-bold text-foreground"
        >
          <img
            src="/logo/app logo.png"
            alt="maeaco logo"
            className="h-8 w-8 object-contain"
          />
          <span className="text-xl font-bold tracking-tight">maeaco</span>
        </Link>

        <button
          type="button"
          onClick={resetForm}
          disabled={isSubmitting}
          className="ui-button-secondary inline-flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-medium transition disabled:pointer-events-none disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* STEP PROGRESS BAR */}
      <div className="mb-10">
        <p className="mb-3 text-sm font-medium text-muted-foreground sm:hidden">Step {currentStep} of {steps.length} · {steps[currentStep - 1].title}</p>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const completed = currentStep > step.number;
            const active = currentStep === step.number;

            return (
              <div key={step.number} className="flex flex-1 items-center">
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    aria-label={`Step ${step.number}: ${step.title}`}
                    aria-current={active ? "step" : undefined}
                    onClick={() => {
                      if (step.number < currentStep) {
                        setCurrentStep(step.number);
                        setError(null);
                      }
                    }}
                    className={
                      completed
                        ? "flex h-11 w-11 items-center justify-center rounded-full border border-purple-600 bg-purple-600 text-white transition hover:scale-105 disabled:pointer-events-none"
                        : active
                        ? "flex h-11 w-11 items-center justify-center rounded-full border-2 border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-200 transition hover:scale-105"
                        : "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-zinc-400 transition"
                    }
                  >
                    {completed ? (
                      <Check className="h-5 w-5 stroke-[2.5]" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </button>

                  <span
                    className={
                      active || completed
                        ? "mt-2 hidden text-xs font-bold text-foreground sm:block"
                        : "mt-2 hidden text-xs font-medium text-zinc-400 sm:block"
                    }
                  >
                    {step.title}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div
                    className={
                      currentStep > step.number
                        ? "mx-3 h-0.5 flex-1 bg-purple-600"
                        : "mx-3 h-0.5 flex-1 bg-zinc-200"
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-8">
        <div className="mb-8 border-b border-zinc-100 pb-6">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-purple-600">
            Step {currentStep} of {steps.length}
          </p>

          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {steps[currentStep - 1].title}
          </h1>

          <p className="mt-1.5 text-sm text-muted-foreground">
            {steps[currentStep - 1].description}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: YOUR BUSINESS (WITH PHONE, PINCODE & MIC) */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Business name <span className="text-red-500">*</span>
              </label>
              <input
                aria-label="Business name"
                value={data.businessName}
                disabled={isSubmitting}
                onChange={(e) => updateField("businessName", e.target.value)}
                placeholder="e.g. Aveda Technologies"
                className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-zinc-400 disabled:bg-zinc-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Industry <span className="text-red-500">*</span>
              </label>
              <input
                aria-label="Industry"
                value={data.industry}
                disabled={isSubmitting}
                onChange={(e) => updateField("industry", e.target.value)}
                placeholder="e.g. Technology, Fashion, Restaurant, Healthcare, Retail..."
                className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-zinc-400 disabled:bg-zinc-50"
              />
            </div>

            {/* 2X2 GRID: COUNTRY, CITY, PHONE NUMBER, PIN CODE */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  aria-label="Country"
                value={data.country}
                  disabled={isSubmitting}
                  onChange={(e) => updateField("country", e.target.value)}
                  placeholder="e.g. India"
                  className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-zinc-400 disabled:bg-zinc-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  City
                </label>
                <input
                  aria-label="City"
                value={data.city}
                  disabled={isSubmitting}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="e.g. Lucknow, Delhi, Mumbai"
                  className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-zinc-400 disabled:bg-zinc-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-purple-600" />
                  Mobile Number <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  aria-label="Mobile number"
                  required
                  autoComplete="tel"
                value={data.phone}
                  disabled={isSubmitting}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-zinc-400 disabled:bg-zinc-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  PIN Code / Postal Code
                </label>
                <input
                  type="text"
                  aria-label="PIN code"
                value={data.pincode}
                  disabled={isSubmitting}
                  onChange={(e) => updateField("pincode", e.target.value)}
                  placeholder="e.g. 226001 / 110001"
                  maxLength={10}
                  className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-zinc-400 disabled:bg-zinc-50"
                />
              </div>
            </div>

            {/* WEBSITE - OPTIONAL */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Website
                </label>
                <span className="text-xs font-medium text-zinc-400">
                  (Optional - Not Mandatory)
                </span>
              </div>
              <input
                type="url"
                aria-label="Website"
                value={data.website}
                disabled={isSubmitting}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://example.com (optional)"
                className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-zinc-400 disabled:bg-zinc-50"
              />
            </div>

            {/* ABOUT YOUR BUSINESS - WITH VOICE TYPING */}
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-semibold text-foreground">
                  About Your Business <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg border border-border bg-zinc-50 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setSpeechLang("hi-IN")}
                      className={`rounded-md px-2 py-0.5 transition ${
                        speechLang === "hi-IN"
                          ? "bg-card font-semibold text-purple-600 shadow-sm"
                          : "text-muted-foreground hover:text-zinc-800"
                      }`}
                    >
                      हिंदी / Hinglish
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpeechLang("en-IN")}
                      className={`rounded-md px-2 py-0.5 transition ${
                        speechLang === "en-IN"
                          ? "bg-card font-semibold text-purple-600 shadow-sm"
                          : "text-muted-foreground hover:text-zinc-800"
                      }`}
                    >
                      English
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isSubmitting}
                    title="Click to speak (बोलकर लिखें)"
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      isListening
                        ? "border border-red-300 bg-red-50 text-red-600 shadow-sm ring-2 ring-red-200 animate-pulse"
                        : "border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                        </span>
                        <MicOff className="h-3.5 w-3.5 text-red-600" />
                        <span>Listening... (Click to stop)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-3.5 w-3.5 text-purple-600" />
                        <span>Speak (बोलकर लिखें)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <textarea
                aria-label="Business description"
                value={data.description}
                disabled={isSubmitting}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="What does your business do? What products or services do you offer? (Type or click 'Speak' to speak in Hindi/English)"
                rows={5}
                className="w-full resize-none rounded-xl border border-border bg-card p-4 text-sm text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-zinc-400 disabled:bg-zinc-50"
              />
              {isListening && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-red-500 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping"></span>
                  Microphone is active. Speak clearly into your mic...
                </p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: YOUR AUDIENCE (AGE CHIPS, GENDER CHIPS & DEFAULT LOCATION CHIPS) */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <div className="space-y-7">
            {/* TARGET AGE GROUPS CHIPS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Target Age Groups <span className="text-red-500">*</span>
              </label>
              <p className="mb-3 text-xs text-muted-foreground">
                Select the age groups most likely to buy your products or services.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {ageGroupOptions.map((age) => {
                  const isSelected = data.ageGroups.includes(age);
                  return (
                    <button
                      key={age}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => toggleAgeGroup(age)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        isSelected
                          ? "border-2 border-purple-600 bg-purple-600 text-white shadow-sm"
                          : "border border-border bg-card text-zinc-700 hover:border-purple-300 hover:bg-purple-50/50"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      {age}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TARGET GENDER CHIPS */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Target Gender <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {genderOptions.map((gender) => {
                  const isSelected = data.genders.includes(gender);
                  return (
                    <button
                      key={gender}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => toggleGender(gender)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-semibold transition ${
                        isSelected
                          ? "border-2 border-purple-600 bg-purple-600 text-white shadow-sm"
                          : "border border-border bg-card text-zinc-700 hover:border-purple-300 hover:bg-purple-50/50"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      {gender}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TARGET LOCATIONS (DEFAULT CHIPS + MULTI-ADD) */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Target Locations <span className="text-red-500">*</span>
              </label>
              <p className="mb-3 text-xs text-muted-foreground">
                Default location is pre-filled from Step 1. You can add more cities or regions.
              </p>

              {/* ACTIVE LOCATION TAGS */}
              <div className="mb-3 flex flex-wrap gap-2">
                {data.targetLocations.map((loc, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 shadow-xs"
                  >
                    <MapPin className="h-3 w-3 text-purple-500" />
                    {loc}
                    <button
                      type="button"
                      onClick={() => removeLocationTag(idx)}
                      className="ml-1 text-purple-400 hover:text-red-600 transition"
                      title="Remove location"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* ADD MORE LOCATION INPUT */}
              <div className="flex gap-2">
                <input
                  value={newLocationInput}
                  disabled={isSubmitting}
                  onChange={(e) => setNewLocationInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLocationTag();
                    }
                  }}
                  placeholder="Type another city, state, or area (e.g. Delhi NCR, Mumbai, Bangalore)"
                  className="h-11 flex-1 rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-zinc-400"
                />
                <button
                  type="button"
                  onClick={addLocationTag}
                  className="ui-button-secondary inline-flex items-center gap-1.5 border border-purple-200 px-4 text-xs font-bold text-purple-700 transition"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>

            {/* AUDIENCE DETAILS / NOTES (OPTIONAL) */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">
                Ideal Customer Persona (Optional)
              </label>
              <textarea
                aria-label="Target audience"
                value={data.targetAudience}
                disabled={isSubmitting}
                onChange={(e) => updateField("targetAudience", e.target.value)}
                placeholder="Describe specific customer habits, interests, or professions (e.g. College students, gym freaks, corporate employees, small business owners)"
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-card p-4 text-sm text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-zinc-400 disabled:bg-zinc-50"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: MARKETING GOALS */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                What are your marketing goals? <span className="text-red-500">*</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {goalOptions.map((goal) => {
                  const selected = data.goals.includes(goal);
                  return (
                    <button
                      type="button"
                      key={goal}
                      disabled={isSubmitting}
                      onClick={() => toggleArrayValue("goals", goal)}
                      className={
                        selected
                          ? "rounded-2xl border-2 border-purple-600 bg-purple-600 p-4 text-left text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
                          : "rounded-2xl border border-border bg-card p-4 text-left text-sm font-medium text-zinc-800 transition hover:border-purple-300 hover:bg-purple-50/50 disabled:opacity-60"
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span>{goal}</span>
                        {selected && <Check className="h-4 w-4 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: YOUR BRAND DETAILS (LOGO, EXTRACTED COLORS & BRAND TONE) */}
        {/* ========================================================================= */}
        {currentStep === 4 && (
          <div className="space-y-8">
            {/* MANDATORY BRAND LOGO */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-bold text-foreground">
                  Brand Logo <span className="text-red-600 font-extrabold">* (Mandatory)</span>
                </label>
                <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 uppercase tracking-wider">
                  Mandatory
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Upload your business logo, separate from product photos. We will try to read its colors; you can edit them below.
              </p>

              <input
                type="file"
                ref={logoInputRef}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleLogoFileChange}
                className="hidden"
              />

              {logoPreview ? (
                <div className="flex items-center justify-between rounded-2xl border-2 border-purple-200 bg-purple-50/40 p-4 shadow-sm">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-purple-200 bg-card p-1.5 shadow-sm overflow-hidden">
                      <img
                        src={logoPreview}
                        alt="Brand Logo"
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">
                        {data.logoFile?.name || "Brand Logo"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.logoFile
                          ? `${(data.logoFile.size / 1024).toFixed(1)} KB • Ready for AI branding`
                          : "Logo attached"}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <Check className="h-3 w-3" /> Logo selected
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="ui-button-secondary border border-purple-200 px-3 py-1.5 text-xs font-semibold text-purple-700 transition"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="rounded-lg border border-red-200 bg-card p-1.5 text-red-600 hover:bg-red-50 transition"
                      title="Remove logo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={isSubmitting ? -1 : 0}
                  aria-label="Upload business logo"
                  onKeyDown={(e) => { if (!isSubmitting && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); logoInputRef.current?.click(); } }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleLogoDrop}
                  onClick={() => logoInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/20 p-8 text-center transition hover:border-purple-500 hover:bg-purple-50/40 cursor-pointer"
                >
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    Click to upload your Brand Logo <span className="text-red-500">*</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    or drag and drop your logo file here
                  </p>
                  <p className="mt-2 text-[11px] font-semibold text-purple-700 bg-purple-100/70 px-3 py-0.5 rounded-full">
                    PNG, JPG, SVG or WEBP (Max 5MB) • Mandatory
                  </p>
                </div>
              )}
            </div>

            {/* EXTRACTED BRAND COLORS PALETTE */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Palette className="h-4 w-4 text-purple-600" />
                  Brand Color Palette
                </label>
                <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
                  {colorStatus === "ready" ? "Colors extracted" : colorStatus === "pending" ? "Reading logo colors…" : "Editable colors"}
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Choose the colors for your posters. If logo colors cannot be read, keep or edit the palette below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Primary Color */}
                <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                  <input
                    type="color"
                    value={data.brandColors.primary}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        brandColors: { ...prev.brandColors, primary: e.target.value },
                      }))
                    }
                    className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">Primary Color</span>
                    <span className="text-xs font-bold text-foreground uppercase">
                      {data.brandColors.primary}
                    </span>
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                  <input
                    type="color"
                    value={data.brandColors.secondary}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        brandColors: { ...prev.brandColors, secondary: e.target.value },
                      }))
                    }
                    className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">Secondary Color</span>
                    <span className="text-xs font-bold text-foreground uppercase">
                      {data.brandColors.secondary}
                    </span>
                  </div>
                </div>

                {/* Accent Color */}
                <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                  <input
                    type="color"
                    value={data.brandColors.accent}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        brandColors: { ...prev.brandColors, accent: e.target.value },
                      }))
                    }
                    className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                  />
                  <div>
                    <span className="text-[11px] font-medium text-muted-foreground block">Accent Color</span>
                    <span className="text-xs font-bold text-foreground uppercase">
                      {data.brandColors.accent}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BRAND TONE - DRAG AND DROP & CLICKABLE TILES */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  Brand Tone & Voice <span className="text-red-500">*</span>
                </label>
                <span className="text-xs text-zinc-400">
                  Select one tone
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Choose the personality your AI agent should use when writing captions, offers, and replies.
              </p>

              {/* ACTIVE TONE DROP ZONE */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedTone) {
                    updateField("brandTone", draggedTone);
                  }
                }}
                className="mb-4 flex items-center justify-between rounded-2xl border-2 border-dashed border-purple-300 bg-purple-50/30 p-4 transition"
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                    Selected Brand Tone:
                  </span>
                  <p className="text-base font-extrabold text-foreground">
                    {data.brandTone || "None selected (click or drop a tone below)"}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm">
                  <Check className="h-5 w-5 stroke-[2.5]" />
                </div>
              </div>

              {/* TONE OPTIONS GRID */}
              <div className="grid gap-3 sm:grid-cols-2">
                {brandToneOptions.map((tone) => {
                  const isSelected = data.brandTone.toLowerCase().includes(tone.label.toLowerCase()) || data.brandTone === tone.label;
                  return (
                    <div
                      key={tone.id}
                      role="button"
                      tabIndex={isSubmitting ? -1 : 0}
                      aria-pressed={isSelected}
                      onKeyDown={(e) => { if (!isSubmitting && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); updateField("brandTone", tone.label); } }}
                      draggable
                      onDragStart={() => setDraggedTone(tone.label)}
                      onClick={() => updateField("brandTone", tone.label)}
                      className={`cursor-pointer rounded-2xl border p-4 transition select-none ${
                        isSelected
                          ? "border-2 border-purple-600 bg-purple-50/80 shadow-md ring-2 ring-purple-200"
                          : "border-border bg-card hover:border-purple-300 hover:bg-zinc-50/80"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{tone.icon}</span>
                          <div>
                            <p className="text-sm font-bold text-foreground">{tone.label}</p>
                            <p className="text-xs text-muted-foreground">{tone.desc}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BRAND WEBSITE - OPTIONAL */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">
                  Website
                </label>
                <span className="text-xs font-medium text-zinc-400">
                  (Optional - Not Mandatory)
                </span>
              </div>
              <input
                type="url"
                aria-label="Website"
                value={data.website}
                disabled={isSubmitting}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://example.com (optional)"
                className="h-12 w-full rounded-xl border border-border bg-card px-4 text-sm text-foreground outline-none transition focus:border-purple-600 focus:ring-2 focus:ring-purple-100 placeholder:text-zinc-400 disabled:bg-zinc-50"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: CHOOSE YOUR SUBSCRIPTION PLAN (ONLY ACTIVE SUBSCRIPTION PLANS) */}
        {/* ========================================================================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto mb-6">
              <h2 className="text-xl font-extrabold text-foreground sm:text-2xl">
                Select Your Subscription Plan
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Choose the best plan for your marketing needs. Upgrade or cancel anytime.
              </p>
            </div>

            {/* SUBSCRIPTION PLANS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isSelected = selectedPlanCode === plan.plan_code;
                const isFree = plan.price === 0;

                return (
                  <div
                    key={plan.id}
                    role="button"
                    tabIndex={isSubmitting ? -1 : 0}
                    aria-pressed={isSelected}
                    aria-label={`${plan.name}: ${plan.price} ${plan.currency}, ${plan.billing_interval}`}
                    onKeyDown={(e) => { if (!isSubmitting && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setSelectedPlanCode(plan.plan_code); } }}
                    onClick={() => setSelectedPlanCode(plan.plan_code)}
                    className={`relative cursor-pointer rounded-2xl border-2 p-5 transition flex flex-col justify-between ${
                      isSelected
                        ? "border-purple-600 bg-purple-50/40 shadow-lg shadow-purple-500/10 ring-2 ring-purple-200"
                        : "border-border bg-card hover:border-purple-300 hover:bg-zinc-50/50"
                    }`}
                  >
                    {/* BADGE */}
                    {plan.badge_text && (
                      <span className="absolute -top-3 right-4 rounded-full bg-purple-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm uppercase tracking-wide">
                        {plan.badge_text}
                      </span>
                    )}

                    <div>
                      {/* HEADER */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-purple-600 bg-purple-600 text-white"
                              : "border-zinc-300 bg-card"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground mb-4 min-h-[32px]">
                        {plan.description || "Marketing plan"}
                      </p>

                      {/* PRICE */}
                      <div className="mb-4 pb-4 border-b border-zinc-100">
                        <span className="text-2xl font-black text-zinc-950">
                          {isFree ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`}
                        </span>
                        {!isFree && (
                          <span className="text-xs font-medium text-muted-foreground ml-1">
                            / {plan.billing_interval || "month"}
                          </span>
                        )}
                      </div>

                      {/* BULLETS */}
                      <ul className="space-y-2 mb-4">
                        {(plan.features?.bullets || [
                          `${plan.max_campaigns_per_month} AI campaigns/month`,
                          `${plan.max_brands} Brand profiles`,
                          "Auto-scheduling on peak hours",
                        ]).slice(0, 4).map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-zinc-700">
                            <Check className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2">
                      <div
                        className={`w-full py-2 rounded-xl text-xs font-bold text-center transition ${
                          isSelected
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-zinc-100 text-zinc-700"
                        }`}
                      >
                        {isSelected ? "Selected" : "Select Plan"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-zinc-400" />
              <span>Your subscription activates after payment verification.</span>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BUTTONS */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <button
            type="button"
            onClick={previousStep}
            disabled={currentStep === 1 || isSubmitting}
            className="ui-button-secondary inline-flex h-11 items-center gap-2 border border-border px-5 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={isSubmitting}
              className="ui-button-primary inline-flex h-11 items-center gap-2 px-6 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-60"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteWithPlan}
              disabled={isSubmitting}
              className="ui-button-primary inline-flex h-12 items-center gap-2 px-8 text-sm font-bold transition disabled:pointer-events-none disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Activating Setup...
                </>
              ) : activeSelectedPlan?.price === 0 ? (
                <>
                  Complete Setup & Go to Dashboard
                  <Check className="h-5 w-5 stroke-[3]" />
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Activate {activeSelectedPlan?.name} (₹{activeSelectedPlan?.price}) & Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}