import { API_BASE, WS_BASE } from "@/lib/api";

export type OrchestratorReport = {
  agents_total: number;
  agents_running: number;
  agents_idle: number;
  tasks_total: number;
  tasks_queued: number;
  tasks_completed: number;
  tasks_failed: number;
  avg_load: number;
  predicted_tasks_next_10m: number;
  bottlenecks: number;
  duplicate_groups: number;
};

export type FleetStatus = {
  node: string;
  registered: boolean;
  peers: string[];
  leader: string | null;
  is_leader: boolean;
};

export type TwinEvent = {
  type: string;
  subject?: string;
  data?: unknown;
  [key: string]: unknown;
};

export type PolicyRule = {
  id: string;
  action: string;
  effect: string;
  roles: string[];
  priority: number;
  require_approval: boolean;
  approve_roles: string[];
};

export type PolicyDecision = {
  decision_id: string;
  allowed: boolean;
  matched_rule: string | null;
  reason: string;
  principal_id: string;
  risk_level: string;
  require_approval: boolean;
  approval_status: string;
  evaluated_at: string;
};

// Real reads against the live OmniMind control plane — no fabricated numbers.
// A failed fetch surfaces as `null`, rendered as an honest "unreachable"
// state by the caller, never silently swapped for a placeholder figure.
//
// The backend runs on Render's free tier, which sleeps after inactivity and
// can take 50+ seconds to wake up. Without a timeout, that stalls the whole
// admin page's server render (including the sidebar/hamburger, which can't
// hydrate until the HTML arrives) until Vercel's own function timeout kills
// it. Failing fast here lets the page render its shell immediately and show
// an honest "unreachable" state instead of hanging.
async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type IntegrationsStatus = {
  llm_provider: "anthropic" | "openai" | null;
  admin_api_key_configured: boolean;
  nats_configured: boolean;
};

export const getOrchestratorReport = () => getJSON<OrchestratorReport>("/orchestrator/report");
export const getFleetStatus = () => getJSON<FleetStatus>("/fleet/status");
export const getTwinSubscribers = () => getJSON<{ connected: number }>("/twin/stream/subscribers");
export const getPolicyRules = () => getJSON<PolicyRule[]>("/policy/rules");
export const getPendingApprovals = () => getJSON<PolicyDecision[]>("/policy/pending");
export const getPolicyLog = (limit = 30) => getJSON<PolicyDecision[]>(`/policy/log?limit=${limit}`);
export const getIntegrationsStatus = () => getJSON<IntegrationsStatus>("/integrations/status");

export function connectTwinStream(
  onEvent: (event: TwinEvent) => void,
  onStatusChange?: (status: "connecting" | "open" | "closed") => void
): () => void {
  let ws: WebSocket | null = null;
  let closedByCaller = false;
  let retryDelay = 1500;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  function open() {
    if (closedByCaller) return;
    onStatusChange?.("connecting");
    ws = new WebSocket(`${WS_BASE}/twin/stream`);
    ws.onopen = () => {
      retryDelay = 1500;
      onStatusChange?.("open");
    };
    ws.onmessage = (msg) => {
      try {
        onEvent(JSON.parse(msg.data));
      } catch {
        // non-JSON frame — ignore
      }
    };
    ws.onclose = () => {
      onStatusChange?.("closed");
      if (!closedByCaller) {
        retryTimer = setTimeout(open, retryDelay);
        retryDelay = Math.min(retryDelay * 1.6, 15000);
      }
    };
    ws.onerror = () => {
      ws?.close();
    };
  }

  open();

  return () => {
    closedByCaller = true;
    if (retryTimer) clearTimeout(retryTimer);
    ws?.close();
  };
}
