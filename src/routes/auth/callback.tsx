import { supabase } from "@/lib/database";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/callback")({
  beforeLoad: async ({ search }) => {
    const code = (search as any).code;

    if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("OAuth callback exchange failed => ", error);
        throw redirect({ to: "/login" });
      }

      if (data.session) {
        throw redirect({ to: "/" });
      }
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
