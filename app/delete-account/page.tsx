import TopNav from "@/components/TopNav";
import DeleteAccountClient from "./DeleteAccountClient";

export const metadata = { title: "Delete Account — OmniMind" };

export default function DeleteAccountPage() {
  return (
    <>
      <TopNav />
      <div className="min-h-screen px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-head text-3xl font-semibold text-gradient mb-2">Delete your account</h1>
          <p className="text-xs text-mutedDark mb-10">OmniMind — account and data deletion</p>

          <div className="space-y-6 text-sm text-muted leading-relaxed">
            <div>
              <h2 className="text-white font-semibold text-base mb-1.5">How to delete your account</h2>
              <p>
                Sign in to OmniMind at{" "}
                <a href="https://omnimindai.app/login" className="text-cyan hover:underline">
                  omnimindai.app/login
                </a>
                , then come back to this page. You&apos;ll see a &quot;Delete my account&quot; button below —
                pressing it permanently deletes your account immediately, no waiting period.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-1.5">What gets deleted</h2>
              <p>
                Your name, email, password hash, any connected sign-in (e.g. GitHub), your credit balance
                and plan, saved API connections, usage history, and all VoxStudio projects — everything
                tied to your account is removed from our database immediately. Nothing is kept.
              </p>
            </div>

            <div>
              <h2 className="text-white font-semibold text-base mb-1.5">What is not affected</h2>
              <p>
                Payments already processed by Stripe are kept by Stripe under their own retention rules
                (needed for accounting and fraud prevention) — deleting your OmniMind account does not
                delete Stripe&apos;s own records of past charges.
              </p>
            </div>

            <DeleteAccountClient />
          </div>
        </div>
      </div>
    </>
  );
}
