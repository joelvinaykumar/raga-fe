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

- **Streaming chat** — answers stream in over SSE, rendered live as GitHub-Flavored Markdown (tables, code blocks, lists, and inline citations with source-preview tooltips).
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

### High-Level Diagram

```mermaid
flowchart LR
  subgraph Browser["Client | React SPA"]
    A["Vite + React 18 + TS | src/main.tsx"]
    B["TanStack Router | file-based routes"]
    C["Protected App Shell | _layout.tsx"]
    D["Dashboard | select KB + model + query"]
    E["KB Workspace | /knowledge-base/:kbId"]
    F["Hooks Orchestrator | useKnowledgeBaseWorkspace"]
    G["Chat Session Hook | useChatSession"]
    H["Config Hook"]
    I["Files Hook"]
    J["MCP Hook"]
    K["TanStack Query | server-state cache"]
    L["Auth Context + Zustand | auth/session flags"]
    M["Axios Client | REST + interceptors"]
    N["SSE Stream Client | /chat streaming"]

    A --> B --> C
    C --> D
    C --> E
    E --> F
    F --> G
    F --> H
    F --> I
    F --> J
    F --> K
    G --> N
    F --> M
    C --> L
  end

  subgraph Auth["Identity"]
    S["Supabase Auth"]
  end

  subgraph BE["Backend | raga-be | FastAPI"]
    P["REST APIs | /rag/*, /documents, /history, /me"]
    Q["Chat API | POST /chat | SSE/JSON"]
  end

  subgraph Data["Data + Retrieval"]
    R["SQLite metadata/state"]
    T["Chroma vector store"]
    U["LLM provider"]
  end

  L <--> S
  M --> P
  N --> Q
  P --> R
  P --> T
  Q --> R
  Q --> T
  Q --> U
```

### Sequence Diagram

```mermaid
sequenceDiagram
  participant U as User
  participant FE as raga-fe
  participant SB as Supabase
  participant API as FastAPI
  participant VS as Chroma
  participant LLM as Model

  U->>FE: Open app
  FE->>SB: getSession()
  SB-->>FE: session/token
  FE->>API: GET /rag/all | Bearer token
  API-->>FE: knowledge bases

  U->>FE: Choose KB + model + prompt
  FE->>API: GET /rag/:kbId + /documents + /chat-history/:sessionId
  API-->>FE: workspace data

  U->>FE: Submit question
  FE->>API: POST /chat | kbId + sessionId + top_k + model
  API->>VS: retrieve chunks
  API->>LLM: generate grounded answer
  API-->>FE: stream chunks + citations + ui meta
  FE-->>U: live-rendered response
```

Key entry points:

- `src/main.tsx` — router + providers (auth, theme, query).
- `src/routes/**` — file-based routes; `_layout.tsx` is a pathless, authenticated layout.
- `src/routes/_layout/dashboard/index.tsx` — the dashboard for selecting knowledge base + model.
- `src/routes/_layout/knowledge-base/$kbId/index.tsx` — workspace route with chat + config + files + MCP dialogs.
- `src/routes/_layout/knowledge-base/$kbId/-hooks/use-knowledge-base-workspace.ts` — orchestration hook for workspace state.
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

> Note: the husky pre-commit hook runs `bun x lint-staged` during commits.

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

## Known Bugs

### MCP connection — authentication still needs work

The MCP connection flow is buggy and not yet production-ready. Authentication for MCP clients (API-key provisioning/validation and scoped access) is incomplete and needs further work before it can be relied on.

**Fix direction** — harden the MCP auth path: robust API-key issuance/rotation, consistent header validation on the server, and clear error handling on the client.

## Upcoming Features

- **Team collaboration in RAG** — shared knowledge bases, role-based access, and collaborative workspace activity.
- **Agentic RAG** — tool-using autonomous retrieval/action flows for multi-step tasks.
- **Expanded file format support** — first-class ingestion for `.md`, `.docx`, and `.txt` files.

---

<div align="center">

Made with React, TypeScript, and a whole lot of RAG. Questions? Open an issue.

</div>
