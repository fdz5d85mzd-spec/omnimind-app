import type { Metadata } from "next";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import AtlasGame from "@/app/atlas/AtlasGame";

export const metadata: Metadata = {
  title: "Orpheus — OmniMind",
  description: "Navigate the living map of knowledge in Orpheus Signal Run.",
};

export default async function OrpheusPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; billing?: string }>;
}) {
  const query = await searchParams;
  if (query.t) redirect(`/atlas?t=${encodeURIComponent(query.t)}`);
  if (query.billing)
    redirect(`/atlas?billing=${encodeURIComponent(query.billing)}#pricing`);
  return (
    <div className="min-h-screen pb-24 sm:pb-0">
      <TopNav />
      <AtlasGame />
    </div>
  );
}
