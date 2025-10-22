import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
// Import the generated route tree
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { ThemeProvider } from "./contexts/theme-context";
import { useAuth } from "./hooks/use-auth";
import { AuthProvider } from "./contexts/auth-context";

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
    <>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster closeButton position="top-right" />
        </QueryClientProvider>
      </ThemeProvider>
    </>,
  );
}
