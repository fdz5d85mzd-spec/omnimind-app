import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SettingsClient, { SettingsSignInGate } from "./SettingsClient";

export const metadata = { title: "Settings — OmniMind" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) return <SettingsSignInGate />;

  return <SettingsClient name={session.user.name ?? null} email={session.user.email ?? null} />;
}
