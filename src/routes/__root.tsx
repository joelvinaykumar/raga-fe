import { TooltipProvider } from "@/components/ui/tooltip";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";

interface AuthState {
  isAuthenticated: boolean;
  // other auth-related data
}

interface AuthContext {
  auth: AuthState;
}

export const Route = createRootRouteWithContext<AuthContext>()({
  component: () => {
    return (
      <>
        <TooltipProvider delayDuration={0}>
          <Outlet />
        </TooltipProvider>
        {/* <TanStackRouterDevtools /> */}
      </>
    );
  },
});
