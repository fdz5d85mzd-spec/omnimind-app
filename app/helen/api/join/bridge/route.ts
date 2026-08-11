import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/helen/supabase/server";

/**
 * Stripe's success_url for the card-payment join flow. Mints a fresh
 * Supabase session for the still-signed-in-to-OmniMind user (same
 * generateLink bridge as app/helen/api/join/route.ts) and redirects the
 * browser through it, so returning from Stripe lands them genuinely
 * signed into Helen too -- not just on a page that looks like it.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") || "/helen/home";
  const origin = new URL(request.url).origin;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(`${origin}/login`);
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: session.user.email,
    options: { redirectTo: `${origin}/helen/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error || !data?.properties?.action_link) {
    // Bridging failed -- still land them on the destination page rather
    // than stranding them on an error screen; they just won't have a
    // Helen session yet and can sign in normally from there.
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(data.properties.action_link);
}
