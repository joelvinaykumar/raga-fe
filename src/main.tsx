import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
// Import the generated route tree
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { ThemeProvider } from "./contexts/theme-context";
import { AuthProvider, useAuth } from "./contexts/auth-context";

// Create a new router instance
const router = createRouter({ routeTree, context: { auth: undefined! } });
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
    },
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }

  interface HistoryState {
    // Define the properties of your location state here
    query: string;
    // Add other state properties as needed
  }
}

function MainApp() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

// Render the app
const rootElement = document.getElementById("app")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster
            closeButton
            position="bottom-right"
            richColors
            theme="system"
            toastOptions={{
              classNames: {
                toast:
                  "group toast font-sans rounded-xl border p-4 shadow-xl flex gap-3 pointer-events-auto backdrop-blur-md transition-all duration-300",
                title: "font-serif text-sm font-semibold tracking-tight",
                description:
                  "font-sans text-xs text-muted-foreground leading-normal",
                actionButton:
                  "font-sans text-xs font-semibold rounded-lg bg-[#340075] text-white hover:bg-[#200050] transition-colors px-3 py-1.5",
                cancelButton:
                  "font-sans text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 transition-colors px-3 py-1.5",
                default: "bg-background/95 border-border text-foreground",
                success:
                  "!bg-emerald-50/95 dark:!bg-emerald-950/30 !border-emerald-500/30 !text-emerald-900 dark:!text-emerald-300",
                error:
                  "!bg-rose-50/95 dark:!bg-rose-950/30 !border-rose-500/30 !text-rose-900 dark:!text-rose-300",
                warning:
                  "!bg-amber-50/95 dark:!bg-amber-950/30 !border-amber-500/30 !text-amber-900 dark:!text-amber-300",
                info: "!bg-sky-50/95 dark:!bg-sky-950/30 !border-sky-500/30 !text-sky-900 dark:!text-sky-300",
              },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
