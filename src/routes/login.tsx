import { supabase } from "@/lib/database";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  BarChart3,
  Bolt,
  DatabaseZap,
  FileStack,
  FolderKanban,
  ShieldCheck,
  SquareTerminal,
} from "lucide-react";
import { LoginForm } from "./auth/-components/login-form";

const featureCards = [
  {
    title: "Tenant-Safe Security",
    description:
      "Supabase authentication with strict workspace isolation for every team.",
    icon: ShieldCheck,
    styles:
      "from-violet-500/20 via-fuchsia-500/15 to-transparent border-violet-500/35 text-violet-200",
  },
  {
    title: "Rapid Document Indexing",
    description:
      "Upload PDF, DOCX, and HTML files and turn them into searchable context fast.",
    icon: FileStack,
    styles:
      "from-sky-500/20 via-cyan-500/15 to-transparent border-sky-500/35 text-sky-200",
  },
  {
    title: "Streaming Cited Answers",
    description:
      "Real-time chat responses with inline citations and source-backed traceability.",
    icon: Bolt,
    styles:
      "from-emerald-500/20 via-teal-500/15 to-transparent border-emerald-500/35 text-emerald-200",
  },
  {
    title: "Workspace Operations",
    description:
      "Manage sessions, documents, and RAG configuration from one clean interface.",
    icon: FolderKanban,
    styles:
      "from-amber-500/20 via-orange-500/15 to-transparent border-amber-500/35 text-amber-200",
  },
  {
    title: "MCP Integrations",
    description:
      "Connect external AI tools using scoped API keys and production-ready MCP endpoints.",
    icon: DatabaseZap,
    styles:
      "from-rose-500/20 via-pink-500/15 to-transparent border-rose-500/35 text-rose-200",
  },
  {
    title: "Usage Observability",
    description:
      "Track conversations, source context, and tool activity with operational visibility.",
    icon: BarChart3,
    styles:
      "from-indigo-500/20 via-blue-500/15 to-transparent border-indigo-500/35 text-indigo-200",
  },
] as const;

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      throw redirect({ to: "/" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative isolate grid min-h-svh overflow-hidden bg-background lg:grid-cols-2">
      <div className="login-hue-bg" aria-hidden="true">
        <div className="login-hue-blob login-hue-blob-1" />
        <div className="login-hue-blob login-hue-blob-2" />
        <div className="login-hue-blob login-hue-blob-3" />
      </div>

      <section className="relative z-10 flex flex-col justify-center px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-2xl space-y-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 text-primary shadow-sm">
            <SquareTerminal className="size-3.5" />
            <span className="font-serif text-3xl text-primary font-semibold leading-none">
              RAGA
            </span>
          </div>

          <div className="space-y-5">
            <h1 className="max-w-xl font-serif text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-foreground md:text-6xl">
              Build, Chat, and Ship Multi-Tenant RAG Workspaces.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-foreground/90">
              RAGA helps teams turn documents into trustworthy AI assistants
              with secure workspaces, real-time streaming chat, source-backed
              answers, and production-ready MCP integrations.
            </p>

            <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
              {featureCards.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className={`rounded-xl border bg-gradient-to-br p-3 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-lg ${feature.styles}`}
                  >
                    <div className="mb-2 inline-flex items-center gap-2">
                      <span className="inline-flex size-7 items-center justify-center rounded-lg bg-black/25 ring-1 ring-white/20">
                        <Icon className="size-4" />
                      </span>
                      <h3 className="text-sm font-semibold leading-tight text-foreground">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/85 md:text-sm">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          {/* <div className="pt-2">
            <div className="mb-4 h-px bg-border" />
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Trusted by
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-6 font-serif text-4xl leading-none text-muted-foreground/70">
              <span className="text-2xl">Acme Corp</span>
              <span className="text-2xl">Globex</span>
              <span className="text-2xl">Initech</span>
            </div>
          </div> */}
        </div>
      </section>

      <section className="relative z-10 flex items-center justify-center px-6 py-10 md:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
