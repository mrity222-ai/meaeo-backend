import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[#FAF9FF] py-12 text-zinc-900">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-4xl items-center justify-center px-4 sm:px-6 lg:px-8">
        <OnboardingForm />
      </div>
    </main>
  );
}
