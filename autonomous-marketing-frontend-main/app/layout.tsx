import type { Metadata } from "next";
import "./globals.css";
import { AuthGuard } from "@/components/auth/auth-guard";

export const metadata: Metadata = {
  title: "meaeco - Autonomous AI Marketing Platform",
  description:
    "Autonomous AI-powered marketing for businesses that want to grow.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo/app logo.png", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}