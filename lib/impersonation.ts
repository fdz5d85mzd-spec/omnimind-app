// Shared cookie name for the admin "view as user" feature (lib/auth.ts reads
// it in the session callback, app/api/admin/impersonate/route.ts writes it).
export const IMPERSONATE_COOKIE = "omnimind_impersonate_user_id";
