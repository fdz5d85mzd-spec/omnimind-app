import type { Metadata } from "next";
import TopNav from "@/components/TopNav";
import OrpheusApp from "@/components/orpheus/OrpheusApp";

export const metadata: Metadata = {
  title: "Orpheus — OmniMind",
  description: "Private, high-volume file transfers inside OmniMind.",
};

export default function OrpheusPage() {
  return (
    <div className="min-h-screen bg-[#f1eee6]">
      <TopNav />
      <OrpheusApp />
    </div>
  );
}
