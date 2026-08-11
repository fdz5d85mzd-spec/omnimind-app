import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { API_BASE } from "@/lib/api";

export type AdminSessionCheck =
  | { ok: true; isMaster: boolean }
  | { ok: false; status: number; error: string };

// Master (MASTER_EMAIL) and Admin (ADMIN_EMAIL) are equal 50/50 co-owners of
// the admin dashboard: same view, same mutation actions, no read-only tier.
// requireMaster() is the mutation gate every admin API route calls; the name
// is legacy, the check itself no longer favors one over the other.
export async function requireMaster(): Promise<AdminSessionCheck> {
  const session = await getServerSession(authOptions);
  const isMaster = session?.user?.isMaster ?? false;
  const isAdmin = session?.user?.isAdmin ?? false;
  if (!session?.user) return { ok: false, status: 401, error: "Not signed in" };
  if (!isMaster && !isAdmin) return { ok: false, status: 403, error: "Not authorized" };
  return { ok: true, isMaster };
}

// Same check, kept as a separate name for GET/view routes that never
// mutated in the first place.
export async function requireAdminOrMaster(): Promise<AdminSessionCheck> {
  return requireMaster();
}

// Same reasoning as lib/telemetry.ts's getJSON: the backend can be asleep
// (Render free tier, 50+s cold start) and without a timeout an admin action
// button would just hang until the platform kills the request.
export async function callBackendAdmin(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (process.env.ADMIN_API_KEY) headers.set("X-Admin-Key", process.env.ADMIN_API_KEY);
  return fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store", signal: AbortSignal.timeout(8000) });
}
