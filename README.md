# OmniMind App

The public "ask anything" front end for [OmniMind](https://github.com/fdz5d85mzd-spec/omnimind) — a
multi-turn streaming chat, in the spirit of Claude / DeepSeek: the answer types itself in as it's
generated, not a spinner-then-dump.

Next.js 14 (App Router) + TypeScript + Tailwind. No backend of its own — it's a thin client over the
OmniMind control plane's `POST /agent/run/stream` (Server-Sent Events).

## How it works

1. Generates a random `session_id` on first load (stored in `localStorage`, stable across visits from the
   same browser).
2. On submit, opens `POST /agent/run/stream` with `{ prompt, session_id }` and reads the response body as
   an SSE stream via `fetch()` + a `ReadableStream` reader (not `EventSource`, which can't send a POST
   body).
3. Each `delta` event is appended to the in-progress assistant message as it arrives — real token-by-token
   rendering, not a fake typing animation over an already-complete answer.
4. A `done` event finalizes the message; a `failed`/`denied` event renders the real error in place (never
   a fabricated answer) — e.g. "no LLM key configured" if the backend has none set.

Behind that stream, the backend still runs the full pipeline (policy check → memory write → orchestrator
task → LLM) — this UI just doesn't surface those internal stages to the end user; that level of detail
lives in the OmniMind ops dashboard (`/dashboard` on the backend), not the consumer chat.

## Requirements on the backend

The OmniMind service needs `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` set for `/agent/run` to actually answer
anything. Without one, requests complete with a real, visible "no LLM key configured" error — see
`omni/agents/llm.py` in the OmniMind repo.

## Local development

```bash
npm install
npm run dev
```

Opens on http://localhost:3000, talking to `https://api.origox.xyz` by default. Copy `.env.example` to
`.env.local` and set `NEXT_PUBLIC_OMNIMIND_API` to point at a different backend (e.g. a local
`uvicorn omni.api.main:app` instance) if needed.

## Deploy

Any static/edge Next.js host works (Vercel, Netlify). No environment variables are required unless you're
pointing at a non-default backend.
