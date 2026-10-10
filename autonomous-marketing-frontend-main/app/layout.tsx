import type { Metadata } from "next";
import "./globals.css";
import { AuthGuard } from "@/components/auth/auth-guard";

export const metadata: Metadata = {
  title: "maeaco - Autonomous AI Marketing Platform",
  description:
    "Autonomous AI-powered marketing for businesses that want to grow.",
  icons: {
    icon: [
      { url: "/logo/favicon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/logo/favicon.png",
    apple: "/logo/favicon.png",
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