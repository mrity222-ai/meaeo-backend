export interface OnboardingData {
  businessName: string;
  industry: string;
  website: string;
  description: string;

  country: string;
  city: string;
  phone: string;
  pincode: string;

  targetAudience: string;
  targetLocation: string;
  targetLocations: string[];
  ageGroups: string[];
  genders: string[];

  goals: string[];
  platforms: string[];

  brandTone: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  logoFile: File | null;
  logoUrl?: string;

  selectedPlan: string;

  catalogueFiles: File[];
}