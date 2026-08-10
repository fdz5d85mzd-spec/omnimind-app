import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { API_BASE } from "@/lib/api";

export type AdminSessionCheck =
  | { ok: true; isMaster: boolean }
  | { ok: false; status: number; error: string };

// Master can trigger backend actions; Admin can view the dashboard but
// every mutation route calls this and rejects non-master callers, so a
// read-only admin can never reach the parts of the API that actually
// change state, no matter what the client sends.
export async function requireMaster(): Promise<AdminSessionCheck> {
  const session = await getServerSession(authOptions);
  const isMaster = session?.user?.isMaster ?? false;
  const isAdmin = session?.user?.isAdmin ?? false;
  if (!session?.user) return { ok: false, status: 401, error: "Not signed in" };
  if (!isMaster && !isAdmin) return { ok: false, status: 403, error: "Not authorized" };
  if (!isMaster) return { ok: false, status: 403, error: "Admin view is read-only — master required" };
  return { ok: true, isMaster: true };
}

// View-only check: both master and admin pass, guests/regular users don't.
// Use this for GET routes; mutation routes still call requireMaster().
export async function requireAdminOrMaster(): Promise<AdminSessionCheck> {
  const session = await getServerSession(authOptions);
  const isMaster = session?.user?.isMaster ?? false;
  const isAdmin = session?.user?.isAdmin ?? false;
  if (!session?.user) return { ok: false, status: 401, error: "Not signed in" };
  if (!isMaster && !isAdmin) return { ok: false, status: 403, error: "Not authorized" };
  return { ok: true, isMaster };
}

export async function callBackendAdmin(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (process.env.ADMIN_API_KEY) headers.set("X-Admin-Key", process.env.ADMIN_API_KEY);
  return fetch(`${API_BASE}${path}`, { ...init, headers, cache: "no-store" });
}
