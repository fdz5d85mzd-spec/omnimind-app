import SocialClient from "@/components/admin/SocialClient";

export const metadata = { title: "Social — OmniMind Admin" };

export default async function SocialPage() {
  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="font-head text-2xl font-semibold text-white mb-1.5">Social</h1>
        <p className="text-sm text-mutedDark mb-3">
          Drafts 3 TikTok scripts a day (positive news, general knowledge, health &amp; beauty, gossip,
          jokes — rotating) for Omni, the mascot, to perform.
        </p>
        <p className="text-sm text-mutedDark mb-8">
          Posting itself is manual, on purpose: Higgsfield&apos;s TikTok connect/publish tools are only
          reachable from an interactive agent session, not as a REST endpoint this app&apos;s own backend
          can call on a schedule — recording and uploading is still on you, but the writing isn&apos;t.
        </p>
        <SocialClient />
      </main>
    </div>
  );
}
