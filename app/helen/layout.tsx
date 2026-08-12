import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/helen/auth/AuthProvider";
import { LanguageProvider } from "@/lib/helen/i18n/LanguageProvider";
import { ProfileProvider } from "@/lib/helen/ProfileProvider";
import ReferralCapture from "@/components/helen/ReferralCapture";

const fraunces = Fraunces({
  variable: "--font-helen-fraunces",
  subsets: ["latin"],
  weight: ["300", "500", "600"],
});

const inter = Inter({
  variable: "--font-helen-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-helen-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Helen — OmniMind",
  description: "One world. Built together, one person at a time.",
};

// Without this, mobile browsers fall back to their desktop-width default
// (~980px) and scale the whole page down to fit — Helen's phone-frame UI
// renders "zoomed in" until the visitor manually pinch-zooms out.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function HelenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`helen-scope ${fraunces.variable} ${inter.variable} ${spaceMono.variable} min-h-screen font-helen-body antialiased`}
    >
      <LanguageProvider>
        <AuthProvider>
          <ProfileProvider>
            <ReferralCapture />
            {children}
          </ProfileProvider>
        </AuthProvider>
      </LanguageProvider>
    </div>
  );
}
