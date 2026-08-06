import { supabase } from "@/lib/database";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { SquareTerminal } from "lucide-react";
import { LoginForm } from "./auth/-components/login-form";

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
    <div className="grid min-h-svh bg-background lg:grid-cols-2">
      <section className="flex flex-col justify-center px-6 py-10 md:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-2xl space-y-10">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-white px-3 py-1.5 text-primary shadow-sm">
            <SquareTerminal className="size-3.5" />
            <span className="font-serif text-3xl font-semibold leading-none">
              NexusRAG
            </span>
          </div>

          <div className="space-y-5">
            <h1 className="max-w-xl font-serif text-5xl font-bold leading-[1.05] tracking-[-0.02em] text-foreground md:text-6xl">
              Deploy Portable RAG Pipelines in Seconds.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-foreground/90">
              The developer-first platform for building, deploying, and
              observing Retrieval-Augmented Generation systems with
              enterprise-grade fidelity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-primary bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/90"
            >
              Start Building Free
            </button>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-primary bg-white px-6 py-3 text-base font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-primary/5"
            >
              View Documentation
            </a>
          </div>

          <div className="pt-2">
            <div className="mb-4 h-px bg-border" />
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
              Trusted by
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-6 font-serif text-4xl leading-none text-muted-foreground/70">
              <span className="text-2xl">Acme Corp</span>
              <span className="text-2xl">Globex</span>
              <span className="text-2xl">Initech</span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-10 md:px-10 lg:px-16">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
