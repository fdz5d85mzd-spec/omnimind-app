import type { Metadata, Viewport } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/AuthSessionProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "OmniMind — Ask Anything",
  description: "The autonomous AI operating system. Type a request, watch the agent work, get a real answer.",
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

export const viewport: Viewport = {
  themeColor: "#06071a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-white antialiased min-h-screen font-body">
        <div className="bg-mesh" aria-hidden />
        <div className="bg-grid" aria-hidden />
        <ServiceWorkerRegistrar />
        <LanguageProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
