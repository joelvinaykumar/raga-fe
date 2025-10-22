import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout")({
  beforeLoad: ({ context }) => {
    const auth = context.auth;
    if (!auth.isAuthenticated) {
      throw redirect({ to: "/login" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <div className="relative flex h-svh w-svw justify-between overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset>
          <main
            id="content"
            className="h-full w-full overflow-x-hidden pt-16 transition-[margin] md:overflow-y-scroll md:pt-0"
          >
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
