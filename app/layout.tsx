import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import InstallPrompt from "@/components/InstallPrompt";
import HelpWidget from "@/components/HelpWidget";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import MobileDock from "@/components/MobileDock";
import MascotPulse from "@/components/MascotPulse";
import { TransactionConfirmProvider } from "@/components/TransactionConfirmProvider";

export const metadata: Metadata = {
  title: "OmniMind — Ask Anything",
  description:
    "The autonomous AI operating system. Type a request, watch the agent work, get a real answer.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OmniMind",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

// Without width/initialScale, mobile browsers fall back to their desktop-
// width default (~980px) and scale the whole page down to fit -- exactly
// the "have to pinch-zoom out" bug reported on the live site. Same fix
// already applied to Helen's own layout (app/helen/layout.tsx).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#06071a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-white antialiased min-h-screen font-body">
        <div className="bg-mesh" aria-hidden />
        <div className="bg-grid" aria-hidden />
        <ServiceWorkerRegistrar />
        <LanguageProvider>
          <InstallPrompt />
          <HelpWidget />
          <AuthSessionProvider>
            <TransactionConfirmProvider>
              <ImpersonationBanner />
              {children}
              <MobileDock />
              <MascotPulse />
            </TransactionConfirmProvider>
          </AuthSessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
