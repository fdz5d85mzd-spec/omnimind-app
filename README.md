# OmniMind App

The public "ask anything" front end for [OmniMind](https://github.com/fdz5d85mzd-spec/omnimind) — type a
request, watch a real agent work (policy check → memory → orchestrator → LLM), get an answer.

Next.js 14 (App Router) + TypeScript + Tailwind. No backend of its own — it's a thin client over the
OmniMind control plane's `POST /agent/run` and `GET /twin/stream` (WebSocket).

## How it works

1. On load, opens a WebSocket to `/twin/stream` on the OmniMind backend and generates a random
   `session_id` (stored in `localStorage`, stable across visits from the same browser).
2. On submit, calls `POST /agent/run` with `{ prompt, session_id }`.
3. While that request is in flight, the backend publishes live progress events
   (`agent.<run_id>.started` → `policy_evaluated` → `memory_stored` → `task_assigned` → `thinking` →
   `completed`/`failed`/`denied`) over the same WebSocket. Each event carries the `session_id` that
   triggered it, so this client only renders events matching its own — the stream is shared across every
   visitor, and this filter is what keeps sessions from seeing each other's prompts.
4. When the `POST` resolves, the final answer (or a real "not configured" / "denied" error — never a
   fabricated response) is rendered.

## Requirements on the backend

The OmniMind service needs `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` set for `/agent/run` to actually answer
anything. Without one, requests complete with a real, visible "no LLM key configured" error — see
`omni/agents/llm.py` in the OmniMind repo.

## Local development

```bash
npm install
npm run dev
```

Opens on http://localhost:3000, talking to `https://origox.xyz` by default. Copy `.env.example` to
`.env.local` and set `NEXT_PUBLIC_OMNIMIND_API` to point at a different backend (e.g. a local
`uvicorn omni.api.main:app` instance) if needed.

## Deploy

Any static/edge Next.js host works (Vercel, Netlify). No environment variables are required unless you're
pointing at a non-default backend.
