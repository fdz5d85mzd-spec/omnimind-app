import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniMind — Ask Anything",
  description: "The autonomous AI operating system. Type a request, watch the agent work, get a real answer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-white antialiased min-h-screen font-body">{children}</body>
    </html>
  );
}
