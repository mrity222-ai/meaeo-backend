"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MarketingPageHero } from "./marketing-page-hero";
import {
  Play,
  X,
  Sparkles,
  ArrowRight,
  Maximize2,
  Smartphone,
  Square,
  RectangleVertical,
  CheckCircle2,
} from "lucide-react";

type AspectRatio = "9:16" | "4:5" | "1:1";

interface ExampleItem {
  id: string;
  title: string;
  category: string;
  categoryTag: string;
  brandName: string;
  lang: string;
  image: string;
  caption: string;
  hashtags: string;
}

const CATEGORIES = [
  { id: "All", label: "All", count: 184 },
  { id: "Fashion", label: "Fashion", count: 7 },
  { id: "Food", label: "Food & Cafe", count: 8 },
  { id: "Real Estate", label: "Construction & Real Estate", count: 7 },
  { id: "Electronics", label: "Electronics & Mobile", count: 8 },
  { id: "Healthcare", label: "Healthcare & Medical", count: 6 },
  { id: "Beauty", label: "Beauty & Wellness", count: 6 },
  { id: "Manufacturing", label: "Manufacturing & Industrial", count: 7 },
  { id: "Decor", label: "Home, Furniture & Decor", count: 7 },
  { id: "Jewellery", label: "Jewellery & Gems", count: 8 },
  { id: "Education", label: "Education & Coaching", count: 8 },
  { id: "Travel", label: "Travel & Hospitality", count: 8 },
  { id: "Services", label: "Services", count: 8 },
  { id: "Automotive", label: "Automotive & Transport", count: 5 },
  { id: "Agriculture", label: "Agriculture & Farming", count: 8 },
  { id: "Fitness", label: "Fitness & Sport", count: 5 },
  { id: "Tech", label: "Technology & Software", count: 5 },
];

const EXAMPLES_DATA: ExampleItem[] = [
  {
    id: "ex-1",
    title: "Premium Embroidery Close-up",
    category: "Fashion",
    categoryTag: "FASHION",
    brandName: "BHATIA TEXTILES",
    lang: "HINGLISH",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80",
    caption: "✨ Fine craftsmanship at its best! Check out our hand-embroidered festive collection crafted with pure silk thread. Order online now.",
    hashtags: "#BhatiaTextiles #HandmadeEmbroidery #EthnicWear #FashionIndia",
  },
  {
    id: "ex-2",
    title: "Signature Tandoori Paneer Pizza 10x Cut",
    category: "Food",
    categoryTag: "FOOD",
    brandName: "SF COLD CAFE",
    lang: "HINDI",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    caption: "🍕 Tandoori Paneer Pizza melted with 100% Mozzarella cheese! Order today and get 20% cashback on your first app order.",
    hashtags: "#SFColdCafe #TandooriPizza #CheesePull #FoodieDelhi",
  },
  {
    id: "ex-3",
    title: "Satisfying Paint Pour Technique",
    category: "Decor",
    categoryTag: "HOME, FURNITURE & DECOR",
    brandName: "BHATIA PAINTS",
    lang: "HINDI",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
    caption: "🎨 Premium washable acrylic emulsion paints for vibrant home interiors. Weather-resistant & eco-friendly finish.",
    hashtags: "#BhatiaPaints #HomeDecor #WallPaint #InteriorDesign",
  },
  {
    id: "ex-4",
    title: "Vadodara's Oldest Herb Supplier",
    category: "Healthcare",
    categoryTag: "HEALTHCARE & MEDICAL",
    brandName: "G.V. PHARMA",
    lang: "ENGLISH",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    caption: "🌿 100% Organic Ayurvedic herbs and wellness supplements trusted by families across Gujarat for over 50 years.",
    hashtags: "#GVPharma #Ayurveda #NaturalHerbs #VadodaraAyurveda",
  },
  {
    id: "ex-5",
    title: "The Ultimate Sleep Reset Villa",
    category: "Travel",
    categoryTag: "TRAVEL & HOSPITALITY",
    brandName: "THE LUSH TREE VILLA",
    lang: "ENGLISH",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
    caption: "🏨 Escape city noise! Experience luxury bedroom suites surrounded by private infinity pools and lush greenery in Lonavala.",
    hashtags: "#LushTreeVilla #Staycation #LuxuryVilla #LonavalaResort",
  },
  {
    id: "ex-6",
    title: "The Ultimate Squad Stay Deck",
    category: "Travel",
    categoryTag: "TRAVEL & HOSPITALITY",
    brandName: "NATURE NEST DANDELI",
    lang: "ENGLISH",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    caption: "🌲 River rafting, campfire vibes, and group villas in Dandeli forest. Book your weekend squad trip now!",
    hashtags: "#DandeliResort #NatureNest #RiverRafting #SquadGoals",
  },
  {
    id: "ex-7",
    title: "One Stop School Uniform Shop",
    category: "Services",
    categoryTag: "SERVICES",
    brandName: "M.S. AMARNATH CHOTANI",
    lang: "HINDI",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    caption: "📚 Durable school uniforms, stationary & book sets for all major school boards at wholesale prices!",
    hashtags: "#SchoolUniforms #WholesaleStationary #AmarnathChotani",
  },
  {
    id: "ex-8",
    title: "The Kashmiri Welcome Suite",
    category: "Travel",
    categoryTag: "TRAVEL & HOSPITALITY",
    brandName: "HOTEL MIRAGE",
    lang: "ENGLISH",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    caption: "🏔️ Traditional Kashmiri hospitality with mountain-view balconies and authentic Wazwan dining in Srinagar.",
    hashtags: "#HotelMirage #SrinagarHotel #KashmirTourism #LuxuryStay",
  },
  {
    id: "ex-9",
    title: "The Winged Lion Reveal Painting",
    category: "Decor",
    categoryTag: "HOME, FURNITURE & DECOR",
    brandName: "INSPIRATIONAL KITCHENS",
    lang: "ENGLISH",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
    caption: "👑 Royal wall art & customized 3D murals designed to give your luxury villa a regal, majestic aura.",
    hashtags: "#RoyalArt #MuralDesign #InteriorDecor #LuxuryHome",
  },
  {
    id: "ex-10",
    title: "Bulk Supply Smart Locks Partner",
    category: "Real Estate",
    categoryTag: "CONSTRUCTION & REAL ESTATE",
    brandName: "GAYATRI HARDWARE",
    lang: "ENGLISH",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
    caption: "🔐 Fingerprint & Keypad Smart Locks for builder projects. Wholesale rates & 3-year replacement warranty!",
    hashtags: "#GayatriHardware #SmartLocks #BuilderSupply #HomeSecurity",
  },
  {
    id: "ex-11",
    title: "Complete Home Dishwash Cleaner Bundle",
    category: "Manufacturing",
    categoryTag: "MANUFACTURING & INDUSTRIAL",
    brandName: "MAX BIOTECH",
    lang: "ENGLISH",
    image: "https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=800&q=80",
    caption: "🧴 Antibacterial Dishwash Gel with natural lemon power. Removes tough grease effortlessly without drying hands!",
    hashtags: "#MaxBiotech #DishwashGel #HomeCleaning #HygieneProducts",
  },
  {
    id: "ex-12",
    title: "Grand Mahal Menswear Collection",
    category: "Fashion",
    categoryTag: "FASHION",
    brandName: "GRAND MAHAL",
    lang: "HINDI/ENG",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
    caption: "🤵 Premium Suits, Sherwanis & Blazers for grooms and groomsmen. Custom tailoring available!",
    hashtags: "#GrandMahal #MensWear #SherwaniCollection #WeddingOutfit",
  },
  {
    id: "ex-13",
    title: "Silver Bawarchi Late Night Craving",
    category: "Food",
    categoryTag: "FOOD",
    brandName: "SILVER BAWARCHI REST",
    lang: "GUJARATI",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    caption: "🍲 Authentic Dum Biryani & Butter Chicken delivered hot at your doorstep till 3 AM!",
    hashtags: "#SilverBawarchi #DumBiryani #LateNightFood #FoodDelivery",
  },
  {
    id: "ex-14",
    title: "Building A Legacy Residential Complex",
    category: "Real Estate",
    categoryTag: "CONSTRUCTION & REAL ESTATE",
    brandName: "RAJPUTESTA",
    lang: "HINDI/ENG",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    caption: "🏢 2 & 3 BHK Gated Community Apartments with rooftop swimming pool, gym, and 70% open green space.",
    hashtags: "#Rajputesta #RealEstateIndia #LuxuryApartments #DreamHome",
  },
  {
    id: "ex-15",
    title: "A Step Towards A Better You Planner",
    category: "Beauty",
    categoryTag: "BEAUTY & WELLNESS",
    brandName: "HDPF",
    lang: "HINGLISH",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    caption: "🧘 Self-care journals & daily habit trackers designed to boost mental wellness & daily productivity.",
    hashtags: "#SelfCareJournal #HDPF #MentalWellness #ProductivityPlanner",
  },
  {
    id: "ex-16",
    title: "Morning Coffee Routine Upgrade",
    category: "Food",
    categoryTag: "FOOD",
    brandName: "FLOWERS",
    lang: "HINDI/ENG",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    caption: "☕ Organic Arabica Coffee Beans infused with natural antioxidants for all-day clean energy!",
    hashtags: "#ArabicaCoffee #MorningRoutine #CleanEnergy #SpecialtyCoffee",
  },
  {
    id: "ex-17",
    title: "Three Ways To Use Aloe Gel",
    category: "Beauty",
    categoryTag: "BEAUTY & WELLNESS",
    brandName: "NEVEDA",
    lang: "HINDI",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    caption: "🌿 99% Pure Organic Aloe Vera Gel for glowing skin, soothing sunburns & deeply conditioning hair!",
    hashtags: "#NevedaSkincare #AloeVeraGel #GlowingSkin #OrganicBeauty",
  },
  {
    id: "ex-18",
    title: "Premium Look, Budget Price Serums",
    category: "Beauty",
    categoryTag: "BEAUTY & WELLNESS",
    brandName: "THE HARPER STUDIO",
    lang: "HINDI/ENG",
    image: "https://images.unsplash.com/photo-1608248597261-833258657640?auto=format&fit=crop&w=800&q=80",
    caption: "🌻 Cold-pressed Sunflower Seed Oil for natural hair nourishment & anti-aging skin hydration.",
    hashtags: "#HarperStudio #ColdPressedOil #NaturalSkincare #OrganicFarming",
  },
  {
    id: "ex-19",
    title: "The Puranpur Legacy Gold Collection",
    category: "Jewellery",
    categoryTag: "JEWELLERY & GEMS",
    brandName: "RAMESH DAS AJAY KUMAR SARRA...",
    lang: "HINDI/ENG",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80",
    caption: "💎 22K BIS Hallmarked Kundan & Polki Bridal Jewellery Sets handcrafted by traditional artisans.",
    hashtags: "#BridalJewellery #KundanSet #22KGold #IndianBride",
  },
  {
    id: "ex-20",
    title: "CNC Shop Manual Groove Machine",
    category: "Manufacturing",
    categoryTag: "MANUFACTURING & INDUSTRIAL",
    brandName: "MHK LASER TECHNOLOGY",
    lang: "ENGLISH",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    caption: "⚙️ High-precision Fiber Laser Cutting & CNC Machines for metal fabrication workshops.",
    hashtags: "#MHKLaser #CNCMachine #FiberLaser #IndustrialAutomation",
  },
];

export function ExamplesGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [activeItem, setActiveItem] = useState<ExampleItem | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!activeItem) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = modalRef.current;
    dialog?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setActiveItem(null); }
      if (event.key !== "Tab" || !dialog) return;
      const targets = Array.from(dialog.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex="0"]'));
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, [activeItem]);
  const categories = CATEGORIES.map((category) => ({ ...category, count: category.id === "All" ? EXAMPLES_DATA.length : EXAMPLES_DATA.filter((item) => item.category === category.id).length })).filter((category) => category.count > 0);
  const filteredData =
    selectedCategory === "All"
      ? EXAMPLES_DATA
      : EXAMPLES_DATA.filter((item) => item.category === selectedCategory);

  const getAspectClass = () => {
    switch (aspectRatio) {
      case "1:1":
        return "aspect-square";
      case "4:5":
        return "aspect-[4/5]";
      case "9:16":
      default:
        return "aspect-[9/16]";
    }
  };

  return (
    <div className="bg-[#FAF8FF] min-h-screen text-zinc-900">
      <MarketingPageHero label="Examples & Showcase" title="Explore sample posts for your business." description="Illustrative image layouts and captions using stock photos. These samples are not live generated posts, videos or verified customer campaigns.">
        <Link href="/signup" className="marketing-action-primary">Create your branded posts</Link>
        <Link href="/" className="marketing-action-secondary">Use on web</Link>
      </MarketingPageHero>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        
        {/* ASPECT RATIO FORMAT TOGGLE */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-purple-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700">
            <Sparkles className="h-4 w-4" />
            <span>Card Aspect Ratio Format:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-purple-50 p-1.5 rounded-xl border border-purple-100">
            <button
              type="button"
              aria-pressed={aspectRatio === "9:16"}
              onClick={() => setAspectRatio("9:16")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                aspectRatio === "9:16"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-zinc-600 hover:text-purple-600"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>9:16 Portrait layout</span>
            </button>

            <button
              type="button"
              aria-pressed={aspectRatio === "4:5"}
              onClick={() => setAspectRatio("4:5")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                aspectRatio === "4:5"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-zinc-600 hover:text-purple-600"
              }`}
            >
              <RectangleVertical className="h-3.5 w-3.5" />
              <span>4:5 Feed Portrait</span>
            </button>

            <button
              type="button"
              aria-pressed={aspectRatio === "1:1"}
              onClick={() => setAspectRatio("1:1")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                aspectRatio === "1:1"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-zinc-600 hover:text-purple-600"
              }`}
            >
              <Square className="h-3.5 w-3.5" />
              <span>1:1 Feed Square</span>
            </button>
          </div>
        </div>

        {/* CATEGORY PILLS BAR */}
        <div className="mb-10 flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-zinc-950 text-white font-bold shadow-md scale-105"
                    : "bg-white text-zinc-700 border border-zinc-200/80 hover:border-purple-300 hover:bg-purple-50/50"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-semibold ${
                    isActive ? "text-zinc-300" : "text-zinc-400"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* GRID GALLERY */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-5">
          {filteredData.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              aria-label={`View sample: ${item.title}`}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveItem(item); } }}
              onClick={() => setActiveItem(item)}
              className={`group relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-zinc-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer ${getAspectClass()}`}
            >
              {/* Background Image */}
              <img
                  loading="lazy"
                  decoding="async"
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Gradient Overlays */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />

              {/* Top Badge: Category */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                <span className="rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider border border-white/20">
                  {item.categoryTag}
                </span>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20">
                  <Maximize2 className="h-3 w-3" />
                </div>
              </div>

              {/* Bottom Info Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-3 text-white">
                <h3 className="text-xs font-bold leading-tight line-clamp-2 drop-shadow-sm">
                  {item.title}
                </h3>

                <div className="mt-2 flex items-center gap-2 border-t border-white/20 pt-2 text-[10px] text-zinc-300">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-purple-600 text-[8px] font-bold text-white">
                    {item.brandName.charAt(0)}
                  </div>
                  <span className="truncate font-semibold">{item.brandName}</span>
                  <span className="shrink-0 text-zinc-400">• {item.lang}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* INTERACTIVE MODAL */}
      {activeItem && (
        <div onClick={(event) => { if (event.target === event.currentTarget) setActiveItem(null); }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="example-dialog-title" className="relative w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl lg:grid lg:grid-cols-12 max-h-[90vh]">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              aria-label="Close sample preview"
              className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-all hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Left Media Container */}
            <div className="lg:col-span-6 relative bg-zinc-950 flex items-center justify-center overflow-hidden aspect-square lg:aspect-auto">
              <img
                  loading="lazy"
                  decoding="async"
                src={activeItem.image}
                alt={activeItem.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="rounded-full bg-purple-600 px-3 py-1 text-[10px] font-bold uppercase">
                  {activeItem.categoryTag}
                </span>
                <h4 className="mt-2 text-base font-bold">{activeItem.title}</h4>
                <p className="text-xs text-zinc-300">
                  {activeItem.brandName} • {activeItem.lang}
                </p>
              </div>
            </div>

            {/* Right Details Panel */}
            <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Sample layout · Stock image</span>
                </div>

                <h3 id="example-dialog-title" className="mt-4 text-xl font-bold text-zinc-950">
                  {activeItem.title}
                </h3>

                <p className="mt-4 text-sm text-zinc-700 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  {activeItem.caption}
                </p>

                <p className="mt-3 text-xs font-semibold text-purple-600">
                  {activeItem.hashtags}
                </p>
              </div>

              <div className="mt-8 border-t border-zinc-100 pt-6">
                <Link
                  href="/signup"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6929E8] via-[#8527D6] to-[#D925A3] py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:opacity-95"
                >
                  <span>Create your campaign</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
