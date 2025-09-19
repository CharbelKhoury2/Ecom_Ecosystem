// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { visualizer } from "file:///home/project/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    // Bundle analyzer (only in build mode)
    process.env.ANALYZE && visualizer({
      filename: "dist/stats.html",
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    port: 5173,
    host: true,
    // Enable HTTP/2
    https: false,
    // Optimize dev server
    hmr: {
      overlay: true
    }
  },
  build: {
    // Target modern browsers for smaller bundles
    target: "es2020",
    // Enable minification
    minify: "terser",
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        drop_debugger: true,
        // Remove unused code
        dead_code: true,
        // Optimize comparisons
        comparisons: true,
        // Optimize conditionals
        conditionals: true,
        // Optimize loops
        loops: true,
        // Remove unused variables
        unused: true
      },
      mangle: {
        // Mangle function names for smaller size
        toplevel: true
      },
      format: {
        // Remove comments
        comments: false
      }
    },
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React ecosystem
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // UI libraries
          "ui-vendor": ["framer-motion", "lucide-react", "sonner"],
          // Chart libraries
          "chart-vendor": ["recharts"],
          // Date utilities
          "date-vendor": ["date-fns"],
          // Utility libraries
          "utils-vendor": ["zustand", "clsx"]
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split("/").pop()?.replace(/\.[^.]*$/, "") || "chunk" : "chunk";
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || "")) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext || "")) {
            return `css/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext || "")) {
            return `fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      },
      // External dependencies (if using CDN)
      external: process.env.USE_CDN ? [
        // 'react',
        // 'react-dom'
      ] : []
    },
    // Source maps for debugging
    sourcemap: process.env.NODE_ENV === "development",
    // Optimize CSS
    cssCodeSplit: true,
    // Report compressed file sizes
    reportCompressedSize: true,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1e3,
    // Output directory
    outDir: "dist",
    // Assets directory
    assetsDir: "assets",
    // Clean output directory before build
    emptyOutDir: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "framer-motion",
      "lucide-react",
      "recharts",
      "date-fns",
      "zustand",
      "sonner"
    ],
    exclude: [
      // Exclude large dependencies that should be loaded dynamically
    ]
  },
  // CSS optimization
  css: {
    // Enable CSS modules
    modules: {
      localsConvention: "camelCase"
    },
    // PostCSS configuration
    postcss: {
      plugins: [
        // Add autoprefixer and other PostCSS plugins as needed
      ]
    },
    // CSS preprocessing
    preprocessorOptions: {
      scss: {
        // SCSS options if using SCSS
      }
    }
  },
  // Environment variables
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    __PROD__: JSON.stringify(process.env.NODE_ENV === "production"),
    __VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0")
  },
  // Preview server configuration
  preview: {
    port: 4173,
    host: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICAvLyBCdW5kbGUgYW5hbHl6ZXIgKG9ubHkgaW4gYnVpbGQgbW9kZSlcbiAgICBwcm9jZXNzLmVudi5BTkFMWVpFICYmIHZpc3VhbGl6ZXIoe1xuICAgICAgZmlsZW5hbWU6ICdkaXN0L3N0YXRzLmh0bWwnLFxuICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgIGd6aXBTaXplOiB0cnVlLFxuICAgICAgYnJvdGxpU2l6ZTogdHJ1ZVxuICAgIH0pXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBob3N0OiB0cnVlLFxuICAgIC8vIEVuYWJsZSBIVFRQLzJcbiAgICBodHRwczogZmFsc2UsXG4gICAgLy8gT3B0aW1pemUgZGV2IHNlcnZlclxuICAgIGhtcjoge1xuICAgICAgb3ZlcmxheTogdHJ1ZVxuICAgIH1cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICAvLyBUYXJnZXQgbW9kZXJuIGJyb3dzZXJzIGZvciBzbWFsbGVyIGJ1bmRsZXNcbiAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICAgIC8vIEVuYWJsZSBtaW5pZmljYXRpb25cbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIC8vIFJlbW92ZSBjb25zb2xlLmxvZyBpbiBwcm9kdWN0aW9uXG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgICAgLy8gUmVtb3ZlIHVudXNlZCBjb2RlXG4gICAgICAgIGRlYWRfY29kZTogdHJ1ZSxcbiAgICAgICAgLy8gT3B0aW1pemUgY29tcGFyaXNvbnNcbiAgICAgICAgY29tcGFyaXNvbnM6IHRydWUsXG4gICAgICAgIC8vIE9wdGltaXplIGNvbmRpdGlvbmFsc1xuICAgICAgICBjb25kaXRpb25hbHM6IHRydWUsXG4gICAgICAgIC8vIE9wdGltaXplIGxvb3BzXG4gICAgICAgIGxvb3BzOiB0cnVlLFxuICAgICAgICAvLyBSZW1vdmUgdW51c2VkIHZhcmlhYmxlc1xuICAgICAgICB1bnVzZWQ6IHRydWVcbiAgICAgIH0sXG4gICAgICBtYW5nbGU6IHtcbiAgICAgICAgLy8gTWFuZ2xlIGZ1bmN0aW9uIG5hbWVzIGZvciBzbWFsbGVyIHNpemVcbiAgICAgICAgdG9wbGV2ZWw6IHRydWVcbiAgICAgIH0sXG4gICAgICBmb3JtYXQ6IHtcbiAgICAgICAgLy8gUmVtb3ZlIGNvbW1lbnRzXG4gICAgICAgIGNvbW1lbnRzOiBmYWxzZVxuICAgICAgfVxuICAgIH0sXG4gICAgLy8gT3B0aW1pemUgY2h1bmsgc3BsaXR0aW5nXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIC8vIE1hbnVhbCBjaHVuayBzcGxpdHRpbmcgZm9yIGJldHRlciBjYWNoaW5nXG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIFJlYWN0IGVjb3N5c3RlbVxuICAgICAgICAgICdyZWFjdC12ZW5kb3InOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgLy8gVUkgbGlicmFyaWVzXG4gICAgICAgICAgJ3VpLXZlbmRvcic6IFsnZnJhbWVyLW1vdGlvbicsICdsdWNpZGUtcmVhY3QnLCAnc29ubmVyJ10sXG4gICAgICAgICAgLy8gQ2hhcnQgbGlicmFyaWVzXG4gICAgICAgICAgJ2NoYXJ0LXZlbmRvcic6IFsncmVjaGFydHMnXSxcbiAgICAgICAgICAvLyBEYXRlIHV0aWxpdGllc1xuICAgICAgICAgICdkYXRlLXZlbmRvcic6IFsnZGF0ZS1mbnMnXSxcbiAgICAgICAgICAvLyBVdGlsaXR5IGxpYnJhcmllc1xuICAgICAgICAgICd1dGlscy12ZW5kb3InOiBbJ3p1c3RhbmQnLCAnY2xzeCddXG4gICAgICAgIH0sXG4gICAgICAgIC8vIE9wdGltaXplIGNodW5rIGZpbGUgbmFtZXNcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6IChjaHVua0luZm8pID0+IHtcbiAgICAgICAgICBjb25zdCBmYWNhZGVNb2R1bGVJZCA9IGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZFxuICAgICAgICAgICAgPyBjaHVua0luZm8uZmFjYWRlTW9kdWxlSWQuc3BsaXQoJy8nKS5wb3AoKT8ucmVwbGFjZSgvXFwuW14uXSokLywgJycpIHx8ICdjaHVuaydcbiAgICAgICAgICAgIDogJ2NodW5rJztcbiAgICAgICAgICByZXR1cm4gYGpzLyR7ZmFjYWRlTW9kdWxlSWR9LVtoYXNoXS5qc2A7XG4gICAgICAgIH0sXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAoYXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgY29uc3QgaW5mbyA9IGFzc2V0SW5mby5uYW1lPy5zcGxpdCgnLicpIHx8IFtdO1xuICAgICAgICAgIGNvbnN0IGV4dCA9IGluZm9baW5mby5sZW5ndGggLSAxXTtcbiAgICAgICAgICBpZiAoL3BuZ3xqcGU/Z3xzdmd8Z2lmfHRpZmZ8Ym1wfGljby9pLnRlc3QoZXh0IHx8ICcnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGBpbWFnZXMvW25hbWVdLVtoYXNoXVtleHRuYW1lXWA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgvY3NzL2kudGVzdChleHQgfHwgJycpKSB7XG4gICAgICAgICAgICByZXR1cm4gYGNzcy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKC93b2ZmMj98ZW90fHR0ZnxvdGYvaS50ZXN0KGV4dCB8fCAnJykpIHtcbiAgICAgICAgICAgIHJldHVybiBgZm9udHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXWA7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBgYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgLy8gRXh0ZXJuYWwgZGVwZW5kZW5jaWVzIChpZiB1c2luZyBDRE4pXG4gICAgICBleHRlcm5hbDogcHJvY2Vzcy5lbnYuVVNFX0NETiA/IFtcbiAgICAgICAgLy8gJ3JlYWN0JyxcbiAgICAgICAgLy8gJ3JlYWN0LWRvbSdcbiAgICAgIF0gOiBbXVxuICAgIH0sXG4gICAgLy8gU291cmNlIG1hcHMgZm9yIGRlYnVnZ2luZ1xuICAgIHNvdXJjZW1hcDogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcsXG4gICAgLy8gT3B0aW1pemUgQ1NTXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxuICAgIC8vIFJlcG9ydCBjb21wcmVzc2VkIGZpbGUgc2l6ZXNcbiAgICByZXBvcnRDb21wcmVzc2VkU2l6ZTogdHJ1ZSxcbiAgICAvLyBDaHVuayBzaXplIHdhcm5pbmcgbGltaXRcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXG4gICAgLy8gT3V0cHV0IGRpcmVjdG9yeVxuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIC8vIEFzc2V0cyBkaXJlY3RvcnlcbiAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxuICAgIC8vIENsZWFuIG91dHB1dCBkaXJlY3RvcnkgYmVmb3JlIGJ1aWxkXG4gICAgZW1wdHlPdXREaXI6IHRydWVcbiAgfSxcbiAgLy8gT3B0aW1pemUgZGVwZW5kZW5jaWVzXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICdyZWFjdCcsXG4gICAgICAncmVhY3QtZG9tJyxcbiAgICAgICdyZWFjdC1yb3V0ZXItZG9tJyxcbiAgICAgICdmcmFtZXItbW90aW9uJyxcbiAgICAgICdsdWNpZGUtcmVhY3QnLFxuICAgICAgJ3JlY2hhcnRzJyxcbiAgICAgICdkYXRlLWZucycsXG4gICAgICAnenVzdGFuZCcsXG4gICAgICAnc29ubmVyJ1xuICAgIF0sXG4gICAgZXhjbHVkZTogW1xuICAgICAgLy8gRXhjbHVkZSBsYXJnZSBkZXBlbmRlbmNpZXMgdGhhdCBzaG91bGQgYmUgbG9hZGVkIGR5bmFtaWNhbGx5XG4gICAgXVxuICB9LFxuICAvLyBDU1Mgb3B0aW1pemF0aW9uXG4gIGNzczoge1xuICAgIC8vIEVuYWJsZSBDU1MgbW9kdWxlc1xuICAgIG1vZHVsZXM6IHtcbiAgICAgIGxvY2Fsc0NvbnZlbnRpb246ICdjYW1lbENhc2UnXG4gICAgfSxcbiAgICAvLyBQb3N0Q1NTIGNvbmZpZ3VyYXRpb25cbiAgICBwb3N0Y3NzOiB7XG4gICAgICBwbHVnaW5zOiBbXG4gICAgICAgIC8vIEFkZCBhdXRvcHJlZml4ZXIgYW5kIG90aGVyIFBvc3RDU1MgcGx1Z2lucyBhcyBuZWVkZWRcbiAgICAgIF1cbiAgICB9LFxuICAgIC8vIENTUyBwcmVwcm9jZXNzaW5nXG4gICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xuICAgICAgc2Nzczoge1xuICAgICAgICAvLyBTQ1NTIG9wdGlvbnMgaWYgdXNpbmcgU0NTU1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG4gIGRlZmluZToge1xuICAgIF9fREVWX186IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnKSxcbiAgICBfX1BST0RfXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdwcm9kdWN0aW9uJyksXG4gICAgX19WRVJTSU9OX186IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lm5wbV9wYWNrYWdlX3ZlcnNpb24gfHwgJzEuMC4wJylcbiAgfSxcbiAgLy8gUHJldmlldyBzZXJ2ZXIgY29uZmlndXJhdGlvblxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogNDE3MyxcbiAgICBob3N0OiB0cnVlXG4gIH1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyxrQkFBa0I7QUFIM0IsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBO0FBQUEsSUFFTixRQUFRLElBQUksV0FBVyxXQUFXO0FBQUEsTUFDaEMsVUFBVTtBQUFBLE1BQ1YsTUFBTTtBQUFBLE1BQ04sVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLElBQ2QsQ0FBQztBQUFBLEVBQ0gsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUE7QUFB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
