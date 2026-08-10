import { API_BASE, WS_BASE } from "@/lib/api";

export type OrchestratorReport = {
  agents_total: number;
  agents_running: number;
  agents_idle: number;
  tasks_total: number;
  tasks_queued: number;
  tasks_completed: number;
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

// Real reads against the live OmniMind control plane — no fabricated numbers.
// A failed fetch surfaces as `null`, rendered as an honest "unreachable"
// state by the caller, never silently swapped for a placeholder figure.
async function getJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const getOrchestratorReport = () => getJSON<OrchestratorReport>("/orchestrator/report");
export const getFleetStatus = () => getJSON<FleetStatus>("/fleet/status");
export const getTwinSubscribers = () => getJSON<{ connected: number }>("/twin/stream/subscribers");

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
