import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import Link from "next/link";
import { AuthProvider } from "@/lib/helen/auth/AuthProvider";
import { LanguageProvider } from "@/lib/helen/i18n/LanguageProvider";
import { ProfileProvider } from "@/lib/helen/ProfileProvider";

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
            {children}
            {/* Bottom-left, not top: Helen's own screens already claim both
                top corners (sound/help + HELEN wordmark on the left,
                language toggle on the right) on several pages, and the
                bottom is generally clear of fixed overlays (ProgressDots
                and the home tab bar are laid out inline, not fixed). */}
            <Link
              href="/"
              aria-label="Back to OmniMind"
              className="fixed bottom-3 left-3 z-50 flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-sm px-3 py-1.5 text-[11px] font-semibold text-white/90 shadow-[0_2px_6px_rgba(0,0,0,0.3)] transition hover:bg-black/60"
              style={{ marginBottom: "env(safe-area-inset-bottom)" }}
            >
              ← OmniMind
            </Link>
          </ProfileProvider>
        </AuthProvider>
      </LanguageProvider>
    </div>
  );
}
