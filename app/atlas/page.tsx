import type { Metadata } from "next";
import TopNav from "@/components/TopNav";
import AtlasGame from "./AtlasGame";
export const metadata: Metadata = { title:"Atlas — OmniMind", description:"Navigate the living map of knowledge in an original OmniMind signal run." };
export default function AtlasPage(){ return <div className="min-h-screen pb-24 sm:pb-0"><TopNav/><AtlasGame/></div>; }
