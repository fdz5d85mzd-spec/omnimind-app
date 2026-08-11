import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import Link from "next/link";
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

export default function HelenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`helen-scope ${fraunces.variable} ${inter.variable} ${spaceMono.variable} min-h-screen font-helen-body antialiased`}>
      <LanguageProvider>
        <AuthProvider>
          <ProfileProvider>
            <ReferralCapture />
            {children}
            {/* Bottom-left, not top: Helen's own screens already claim both
                top corners (sound/help + HELEN wordmark on the left,
                language toggle on the right) on several pages, and the
                bottom is generally clear of fixed overlays (ProgressDots
                and the home tab bar are laid out inline, not fixed).
                Icon-only and in Helen's own palette (not a black OmniMind
                pill) so it reads as part of this screen, not a foreign
                patch dropped on top of it. */}
            <Link
              href="/"
              aria-label="Back to OmniMind"
              title="Back to OmniMind"
              className="group fixed bottom-3 left-3 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-helen-ink/70 backdrop-blur-sm border border-helen-gold/25 text-helen-paper/90 shadow-[0_2px_10px_rgba(0,0,0,0.35)] transition hover:bg-helen-ink/90 hover:border-helen-gold/50"
              style={{ marginBottom: "env(safe-area-inset-bottom)" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
            </Link>
          </ProfileProvider>
        </AuthProvider>
      </LanguageProvider>
    </div>
  );
}
