import { supabase } from "@/lib/database";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/callback")({
  beforeLoad: async ({ search }) => {
    const code = (search as any).code;

    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      throw redirect({ to: "/" });
    }

    throw redirect({ to: "/login" });
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Processing ...</div>;
}
