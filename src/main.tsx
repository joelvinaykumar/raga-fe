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
const queryClient = new QueryClient();

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
            position="top-right"
            theme="system"
            toastOptions={{
              className:
                "font-serif border border-[#ccc3d4]/40 dark:border-[#2d2a2e]/60 text-[#1e1b19] dark:text-[#f4ece8] shadow-lg rounded-xl pointer-events-auto",
              descriptionClassName:
                "font-sans text-xs text-[#7b7483] dark:text-[#9c95a6]",
              style: {
                background: "hsl(var(--popover))",
                backgroundColor: "hsl(var(--popover))",
                color: "hsl(var(--popover-foreground))",
                opacity: 1,
              },
              actionButtonStyle: {
                backgroundColor: "#340075",
                color: "#ffffff",
                fontFamily: "var(--font-sans)",
                borderRadius: "8px",
              },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}
