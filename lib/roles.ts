// Master (MASTER_EMAIL) and Admin (ADMIN_EMAIL) are equal 50/50 co-owners
// of the admin dashboard — same view, same actions, no read-only tier (see
// lib/adminApi.ts). "Master"/"Admin" are just the two env var names, not a
// hierarchy: Michail and Marina respectively. Both are resolved live from
// env vars against the signed-in session's email — there's no separate
// "make this user an admin" step; whoever signs up with a listed email
// gets the role on their very next session.
//
// Both fall back to hardcoded defaults so the two owner accounts keep
// access even before they're explicitly set in Vercel.

function resolveMasterEmail(): string {
  return process.env.MASTER_EMAIL || "aristidou.m@outlook.com";
}

function resolveAdminEmail(): string {
  return process.env.ADMIN_EMAIL || "director@axes-bp.com";
}

export function isMasterEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase() === resolveMasterEmail().toLowerCase();
}

export function isAdminEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase() === resolveAdminEmail().toLowerCase();
}

// For routing help-widget messages to a real inbox server-side -- never
// exposed to the client, unlike the booleans above which are safe to derive
// from a public session.
export function supportContactEmails(): string[] {
  return [resolveMasterEmail(), resolveAdminEmail()];
}
