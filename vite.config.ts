import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // Bundle analyzer - generates stats.html in dist
    visualizer({
      filename: "stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: ["localhost", "127.0.0.1"],
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
      "/ws": { target: "ws://localhost:3001", ws: true },
      "/uploads": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
      process.env.VITE_API_BASE_URL ||
        (process.env.NODE_ENV === "production"
          ? "https://www.cortexbuildpro.com"
          : "http://localhost:3001"),
    ),
  },
  build: {
    emptyOutDir: true,
    target: "es2020",
    minify: "esbuild",
    // web-ifc WASM is ~2MB and lazy-loaded with BIMViewer — expected for IFC parsing
    chunkSizeWarningLimit: 3000,
    // Generate sourcemaps for production debugging
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
    // Divide chunks further for better caching
    rollupOptions: {
      output: {
        // Consistent chunk naming for long-term caching
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        // Manual chunk splitting for optimal bundle sizes
        manualChunks(id: string) {
          const normalizedId = id.replaceAll("\\", "/");
          const inPkg = (pkg: string) =>
            normalizedId.includes(`/node_modules/${pkg}/`);
          // Heavy 3D/chart libraries - lazy loaded
          if (inPkg("recharts") || inPkg("d3") || inPkg("three")) return "charts";
          // Icon library - lazy loaded
          if (inPkg("lucide-react")) return "icons";
          // React core - long-term cached (exact package path; avoids react-router, etc.)
          if (inPkg("react") || inPkg("react-dom")) return "vendor-react";
          // TanStack Query - separate chunk
          if (inPkg("@tanstack")) return "vendor-tanstack";
          // Zod validation - lazy loaded
          if (inPkg("zod")) return "validation";
          // Date utilities
          if (inPkg("date-fns") || inPkg("dayjs") || inPkg("moment"))
            return "date-libs";
          // i18n libraries
          if (inPkg("i18next") || inPkg("react-i18next")) return "i18n";
          // Form libraries
          if (inPkg("react-hook-form") || inPkg("zod")) return "forms";
          // Router
          if (inPkg("react-router")) return "router";
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
      "sonner",
    ],
    exclude: ["@rolldown/binding-linux-arm64-gnu"],
    // Prebuild dependencies for faster dev server startup
    esbuildOptions: {
      target: "es2020",
    },
  },
  // Preview server configuration
  preview: {
    port: 4173,
    cors: true,
  },
});
