// Same concept as the master/admin split used elsewhere: Master
// (MASTER_EMAIL) has full control over the admin dashboard's actions;
// Admin (ADMIN_EMAIL) sees the same dashboard read-only. Both are resolved
// live from env vars against the signed-in session's email — there's no
// separate "make this user an admin" step; whoever signs up with a listed
// email gets the role on their very next session.
//
// MASTER_EMAIL falls back to a hardcoded default so the owner account
// keeps full control even before it's explicitly set in Vercel.

function resolveMasterEmail(): string {
  return process.env.MASTER_EMAIL || "aristidou.m@outlook.com";
}

function resolveAdminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL || undefined;
}

export function isMasterEmail(email?: string | null): boolean {
  return !!email && email.toLowerCase() === resolveMasterEmail().toLowerCase();
}

export function isAdminEmail(email?: string | null): boolean {
  const adminEmail = resolveAdminEmail();
  return !!email && !!adminEmail && email.toLowerCase() === adminEmail.toLowerCase();
}
