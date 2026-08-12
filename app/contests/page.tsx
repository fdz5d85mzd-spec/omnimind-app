import type { Metadata } from "next";
import TopNav from "@/components/TopNav";
import ContestsClient from "./ContestsClient";

export const metadata: Metadata = { title: "Contests — OmniMind", description: "Weekly photo and reel challenges. Create, vote, rise and win OmniMind credits." };

export default function ContestsPage() {
  return <div className="min-h-screen pb-28 sm:pb-0"><TopNav /><ContestsClient /></div>;
}
