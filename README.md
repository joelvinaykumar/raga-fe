<div align="center">

# RAGA — Rag As A Service

**A polished RAG (Retrieval-Augmented Generation) chat interface with streaming answers, knowledge-base management, and Supabase authentication.**

![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React 18](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TanStack Router](https://img.shields.io/badge/TanStack_Router-FF4154?style=for-the-badge&logo=react-query&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</div>

---

## About

RAGA is a chat UI for asking questions over your documents. Ask a question, and the backend retrieves the most relevant context and streams a grounded LLM answer token-by-token over **Server-Sent Events (SSE)** — just like a native chat experience.

The frontend is a modern **Vite + React + TypeScript** SPA backed by a **FastAPI** service, with **Supabase** handling authentication.

## Features

- **Streaming chat** — answers stream in over SSE, rendered live as Markdown (tables, code blocks with syntax highlighting, math via KaTeX, emojis, and even basic Mermaid-style diagrams).
- **Session-based conversations** — every chat is a session; sessions are listed, resumed, and deleted from the sidebar.
- **Knowledge base** — attach documents (PDF / DOCX / HTML) to a session to ground the model's answers.
- **Model switching** — toggle between GPT-4o and GPT-4o-mini per session.
- **Secure auth** — Supabase email/password + Google OAuth, with route protection and `Authorization: Bearer` tokens injected automatically into API calls.
- **Dark/light theme**, polished shadcn/ui components, sonner toasts, and framer-motion micro-animations.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Build | Vite 5, @vitejs/plugin-react-swc, TypeScript |
| UI | React 18, Tailwind CSS, shadcn/ui (Radix primitives), framer-motion, lucide-react |
| Routing | TanStack Router (file-based, typed) + router vite plugin |
| Data fetching | TanStack Query, Axios (REST), native `fetch` (SSE) |
| Auth | Supabase (email/password + Google OAuth) |
| State | Zustand (persisted auth flags) |
| Backend | FastAPI — served over SSE for `/chat`, REST elsewhere |
| Hosting | Vercel (SPA with `vercel.json` rewrite) |

## Architecture

```mermaid
flowchart LR
    User[User] --> FE[React SPA / Vercel]
    FE -->|Supabase Auth + Bearer token| Supa[(Supabase)]
    FE -->|REST via Axios| API[FastAPI Backend]
    FE -->|SSE stream - POST /chat| API
    API --> Docs[(Document Store / RAG)]
    API --> LLM[LLM - GPT-4o / GPT-4o-mini]
    LLM -->|streamed chunks| API
    API -->|data: {content, done}| FE
    FE -->|renders Markdown| User
```

Key entry points:

- `src/main.tsx` — router + providers (auth, theme, query).
- `src/routes/**` — file-based routes; `_layout.tsx` is a pathless, authenticated layout.
- `src/routes/_layout/chat/$sessionId/index.tsx` — the chat session: history load, SSE stream, message state.
- `src/lib/stream.ts` — SSE client (raw `fetch`, parses `data: {content, done}` lines).
- `src/lib/axios.ts` — authenticated Axios instance for the FastAPI REST endpoints.

## Getting Started

### Prerequisites

- **bun** (the lockfile is `bun.lock`) — or `pnpm`/`npm` with the same scripts.
- A `.env` file (see below).

### Install & run

```bash
bun install
bun dev          # start the dev server
bun run build    # typecheck (tsc) + production bundle
bun run lint     # Biome lint (auto-fix with: bun run lint --write)
```

> Note: the husky pre-commit hook runs `pnpm lint-staged`, so committing requires `pnpm`.

### Environment variables

Create a `.env` in the project root (`.env` is gitignored):

```
VITE_BASE_URL=https://your-fastapi-backend.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

The app reads these through a Zod schema in `src/lib/env.ts` and **refuses to boot** if any are missing.

### Backend API

The frontend talks to these FastAPI endpoints (relative to `VITE_BASE_URL`):

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `list-sessions` | List chat sessions |
| GET | `chat-history/{session_id}` | Load a session's message history |
| GET | `list-docs/{session_id}` | Documents attached to a session |
| POST | `upload-doc/{session_id}` | Upload a document (multipart) |
| DELETE | `delete-doc` | Remove a document |
| DELETE | `delete-session/{session_id}` | Delete a session |
| POST | `/chat` | Ask a question — answers **stream** over SSE |

## Deployment

Deploys as a static SPA on **Vercel**. `vercel.json` rewrites every path to `index.html` — this SPA fallback is required for TanStack Router browser history: without it, direct loads/refreshes on `/chat/...` return 404.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Known Issues

### 1. Initial chat jitter — duplicate first message (new chat)

When starting a new chat, the first message is typed on `/chat` and handed to `/chat/{sessionId}` via `location.state.query`, where it is replayed by a mount effect in `src/routes/_layout/chat/$sessionId/index.tsx`.

Because the app is wrapped in `<StrictMode>` (`src/main.tsx`), that mount effect **double-fires in development**, which can submit the first question twice. The result: duplicate prompt/reply pairs, with one reply stuck in a `loading: true` state forever (the second SSE `stream()` call aborts the first through `useStream`'s shared `AbortController`).

**Current mitigation** — the file guards against this with an `initialQuerySubmittedRef` ref, a `cancelled` flag in the effect cleanup, and an early `if (isStreaming) return` in `onSubmit` (the Enter key still fires `onSubmit` even though the send button is disabled while loading). Do not remove these guards. The robust long-term fix is to make the initial-submit effect idempotent without relying on a ref.

### 2. Chat streaming animation bug — flicker/jitter while streaming

`message-bubble.tsx` re-mounts the Markdown node on every streamed chunk using a key that changes per chunk:

```tsx
key={msg.loading ? `s-${msg.content.length}` : "static"}
```

Re-keying remounts the node and re-triggers the `.markdown-streaming` `fade-in` animation (defined in `src/index.css`) for **every token**. Combined with the per-chunk `flushSync` in `$sessionId/index.tsx`, each token causes a full synchronous re-render plus a CSS animation restart — producing visible flicker/jitter while the answer streams.

**Fix direction** — animate opacity via a CSS transition instead of a keyed remount, and/or batch chunk updates instead of flushing synchronously per chunk.

---

<div align="center">

Made with React, TypeScript, and a whole lot of RAG. Questions? Open an issue.

</div>
