import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // The router plugin must run before the React plugin, and
    // `autoCodeSplitting` moves each route's component into its own lazy chunk
    // so unrelated routes (e.g. chat/knowledge-base) aren't in the initial JS.
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    visualizer({
      template: "treemap", // or sunburst, network
      filename: "./dist/stats.html", // or false to not emit
      open: true, // Open the generated file in the browser
      gzipSize: true, // Show gzip size
      brotliSize: true, // Show brotli size
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Only pin the big, long-lived libraries that are ALREADY part of the
        // eager initial load (shared by every route) into their own stable
        // vendor chunks — so an app-code change doesn't bust their browser
        // cache. Crucially, we DON'T use a catch-all `return "vendor"`: forcing
        // every node_module into one named chunk would drag dynamic-only deps
        // (e.g. the lazy markdown renderer) out of their lazy chunk and make
        // them eager again. Returning `undefined` lets Rollup keep its
        // automatic per-entry splitting, which preserves the lazy markdown chunk.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)
          ) {
            return "vendor-react";
          }
          if (id.includes("@tanstack")) return "vendor-tanstack";
          if (id.includes("@supabase")) return "vendor-supabase";

          // Everything else (including the lazy markdown stack) is left to
          // Rollup's default chunking so lazy boundaries stay intact.
          return undefined;
        },
      },
    },
  },
  preview: {
    allowedHosts: ["raga-fe.up.railway.app"],
  },
});
