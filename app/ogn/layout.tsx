import type { Metadata } from "next";
import "./ogn.css";
import TopNav from "@/components/TopNav";

export const metadata: Metadata = {
  title: "OGN — Only Good News — OmniMind",
  description: "AI-discovered, AI-verified positive news. Part of OmniMind.",
};

export default function OgnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ogn-scope min-h-screen font-body antialiased">
      <TopNav />
      {children}
    </div>
  );
}
