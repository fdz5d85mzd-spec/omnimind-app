import type { Metadata } from "next";
import TopNav from "@/components/TopNav";
import OrpheusApp from "@/components/orpheus/OrpheusApp";

export const metadata: Metadata = {
  title: "Atlas — Private file transfer by OmniMind",
  description: "Send large files privately with Atlas by OmniMind.",
};

export default function AtlasPage() {
  return (
    <div className="min-h-screen bg-[#f1eee6] pb-24 sm:pb-0">
      <TopNav />
      <OrpheusApp />
    </div>
  );
}
