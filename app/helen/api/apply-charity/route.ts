import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/helen/resend";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/helen/supabase/server";

interface CharityApplication {
  name?: string;
  category?: string;
  region?: string;
  contactEmail?: string;
  verificationDocsUrl?: string;
  description?: string;
}

/**
 * Public charity-partner application form (app/apply-charity/page.tsx).
 * Always lands with status "pending_review" — nothing here ever joins the
 * live voting queue automatically. A human must vet the submitted proof
 * link and flip the row to "queued" themselves (real Impact Fund money is
 * on the line, so an unreviewed submission must never be trusted).
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 501 });
  }

  const body = (await request.json().catch(() => ({}))) as CharityApplication;
  const name = body.name?.trim().slice(0, 200);
  const category = body.category?.trim().slice(0, 100);
  const region = body.region?.trim().slice(0, 100);
  const contactEmail = body.contactEmail?.trim().slice(0, 200);
  const verificationDocsUrl = body.verificationDocsUrl?.trim().slice(0, 500);
  const description = body.description?.trim().slice(0, 2000);

  if (!name || !category || !region || !contactEmail || !verificationDocsUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  // Cheap sanity checks only — real vetting is the human review step, not this route.
  if (!contactEmail.includes("@")) {
    return NextResponse.json({ error: "Invalid contact email" }, { status: 400 });
  }
  if (!/^https?:\/\//.test(verificationDocsUrl)) {
    return NextResponse.json({ error: "Verification link must be a URL" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("orgs").insert({
    name,
    category,
    region,
    status: "pending_review",
    verification_docs_url: verificationDocsUrl,
    contact_email: contactEmail,
    description: description ?? null,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Best-effort notification — never blocks the applicant's response.
  sendEmail(
    "helpdesk@origox.xyz",
    `New charity application: ${name}`,
    `<div style="font-family: sans-serif;">
      <p><strong>${name}</strong> (${category}, ${region})</p>
      <p>Contact: ${contactEmail}</p>
      <p>Verification: <a href="${verificationDocsUrl}">${verificationDocsUrl}</a></p>
      <p>${description ?? ""}</p>
    </div>`,
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
