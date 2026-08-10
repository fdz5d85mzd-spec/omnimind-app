"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { HomeNavIcons } from "@/components/helen/HomeNavIcons";
import { useProfile } from "@/lib/helen/ProfileProvider";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const { profile, ready } = useProfile();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile) router.replace("/helen");
  }, [ready, profile, router]);

  if (!profile) return null;

  // The home root renders its own floating copy of the nav icons directly
  // over its fullscreen scene — rendering it here too would duplicate it.
  const isHomeRoot = pathname === "/home";

  return (
    <>
      {!isHomeRoot && <HomeNavIcons className="mb-2.5" />}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </>
  );
}
