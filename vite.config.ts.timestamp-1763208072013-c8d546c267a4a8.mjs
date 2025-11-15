// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { visualizer } from "file:///home/project/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic"
    }),
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
      overlay: true,
      port: 5173
    },
    // Fix WebSocket connection issues
    watch: {
      usePolling: false
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3Qoe1xuICAgICAganN4UnVudGltZTogJ2F1dG9tYXRpYydcbiAgICB9KSxcbiAgICAvLyBCdW5kbGUgYW5hbHl6ZXIgKG9ubHkgaW4gYnVpbGQgbW9kZSlcbiAgICBwcm9jZXNzLmVudi5BTkFMWVpFICYmIHZpc3VhbGl6ZXIoe1xuICAgICAgZmlsZW5hbWU6ICdkaXN0L3N0YXRzLmh0bWwnLFxuICAgICAgb3BlbjogdHJ1ZSxcbiAgICAgIGd6aXBTaXplOiB0cnVlLFxuICAgICAgYnJvdGxpU2l6ZTogdHJ1ZVxuICAgIH0pXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBob3N0OiB0cnVlLFxuICAgIC8vIEVuYWJsZSBIVFRQLzJcbiAgICBodHRwczogZmFsc2UsXG4gICAgLy8gT3B0aW1pemUgZGV2IHNlcnZlclxuICAgIGhtcjoge1xuICAgICAgb3ZlcmxheTogdHJ1ZSxcbiAgICAgIHBvcnQ6IDUxNzNcbiAgICB9LFxuICAgIC8vIEZpeCBXZWJTb2NrZXQgY29ubmVjdGlvbiBpc3N1ZXNcbiAgICB3YXRjaDoge1xuICAgICAgdXNlUG9sbGluZzogZmFsc2VcbiAgICB9XG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgLy8gVGFyZ2V0IG1vZGVybiBicm93c2VycyBmb3Igc21hbGxlciBidW5kbGVzXG4gICAgdGFyZ2V0OiAnZXMyMDIwJyxcbiAgICAvLyBFbmFibGUgbWluaWZpY2F0aW9uXG4gICAgbWluaWZ5OiAndGVyc2VyJyxcbiAgICB0ZXJzZXJPcHRpb25zOiB7XG4gICAgICBjb21wcmVzczoge1xuICAgICAgICAvLyBSZW1vdmUgY29uc29sZS5sb2cgaW4gcHJvZHVjdGlvblxuICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsXG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsXG4gICAgICAgIC8vIFJlbW92ZSB1bnVzZWQgY29kZVxuICAgICAgICBkZWFkX2NvZGU6IHRydWUsXG4gICAgICAgIC8vIE9wdGltaXplIGNvbXBhcmlzb25zXG4gICAgICAgIGNvbXBhcmlzb25zOiB0cnVlLFxuICAgICAgICAvLyBPcHRpbWl6ZSBjb25kaXRpb25hbHNcbiAgICAgICAgY29uZGl0aW9uYWxzOiB0cnVlLFxuICAgICAgICAvLyBPcHRpbWl6ZSBsb29wc1xuICAgICAgICBsb29wczogdHJ1ZSxcbiAgICAgICAgLy8gUmVtb3ZlIHVudXNlZCB2YXJpYWJsZXNcbiAgICAgICAgdW51c2VkOiB0cnVlXG4gICAgICB9LFxuICAgICAgbWFuZ2xlOiB7XG4gICAgICAgIC8vIE1hbmdsZSBmdW5jdGlvbiBuYW1lcyBmb3Igc21hbGxlciBzaXplXG4gICAgICAgIHRvcGxldmVsOiB0cnVlXG4gICAgICB9LFxuICAgICAgZm9ybWF0OiB7XG4gICAgICAgIC8vIFJlbW92ZSBjb21tZW50c1xuICAgICAgICBjb21tZW50czogZmFsc2VcbiAgICAgIH1cbiAgICB9LFxuICAgIC8vIE9wdGltaXplIGNodW5rIHNwbGl0dGluZ1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICAvLyBNYW51YWwgY2h1bmsgc3BsaXR0aW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAvLyBSZWFjdCBlY29zeXN0ZW1cbiAgICAgICAgICAncmVhY3QtdmVuZG9yJzogWydyZWFjdCcsICdyZWFjdC1kb20nLCAncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgIC8vIFVJIGxpYnJhcmllc1xuICAgICAgICAgICd1aS12ZW5kb3InOiBbJ2ZyYW1lci1tb3Rpb24nLCAnbHVjaWRlLXJlYWN0JywgJ3Nvbm5lciddLFxuICAgICAgICAgIC8vIENoYXJ0IGxpYnJhcmllc1xuICAgICAgICAgICdjaGFydC12ZW5kb3InOiBbJ3JlY2hhcnRzJ10sXG4gICAgICAgICAgLy8gRGF0ZSB1dGlsaXRpZXNcbiAgICAgICAgICAnZGF0ZS12ZW5kb3InOiBbJ2RhdGUtZm5zJ10sXG4gICAgICAgICAgLy8gVXRpbGl0eSBsaWJyYXJpZXNcbiAgICAgICAgICAndXRpbHMtdmVuZG9yJzogWyd6dXN0YW5kJywgJ2Nsc3gnXVxuICAgICAgICB9LFxuICAgICAgICAvLyBPcHRpbWl6ZSBjaHVuayBmaWxlIG5hbWVzXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAoY2h1bmtJbmZvKSA9PiB7XG4gICAgICAgICAgY29uc3QgZmFjYWRlTW9kdWxlSWQgPSBjaHVua0luZm8uZmFjYWRlTW9kdWxlSWRcbiAgICAgICAgICAgID8gY2h1bmtJbmZvLmZhY2FkZU1vZHVsZUlkLnNwbGl0KCcvJykucG9wKCk/LnJlcGxhY2UoL1xcLlteLl0qJC8sICcnKSB8fCAnY2h1bmsnXG4gICAgICAgICAgICA6ICdjaHVuayc7XG4gICAgICAgICAgcmV0dXJuIGBqcy8ke2ZhY2FkZU1vZHVsZUlkfS1baGFzaF0uanNgO1xuICAgICAgICB9LFxuICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldEluZm8ubmFtZT8uc3BsaXQoJy4nKSB8fCBbXTtcbiAgICAgICAgICBjb25zdCBleHQgPSBpbmZvW2luZm8ubGVuZ3RoIC0gMV07XG4gICAgICAgICAgaWYgKC9wbmd8anBlP2d8c3ZnfGdpZnx0aWZmfGJtcHxpY28vaS50ZXN0KGV4dCB8fCAnJykpIHtcbiAgICAgICAgICAgIHJldHVybiBgaW1hZ2VzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoL2Nzcy9pLnRlc3QoZXh0IHx8ICcnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGBjc3MvW25hbWVdLVtoYXNoXVtleHRuYW1lXWA7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgvd29mZjI/fGVvdHx0dGZ8b3RmL2kudGVzdChleHQgfHwgJycpKSB7XG4gICAgICAgICAgICByZXR1cm4gYGZvbnRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYGFzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIC8vIEV4dGVybmFsIGRlcGVuZGVuY2llcyAoaWYgdXNpbmcgQ0ROKVxuICAgICAgZXh0ZXJuYWw6IHByb2Nlc3MuZW52LlVTRV9DRE4gPyBbXG4gICAgICAgIC8vICdyZWFjdCcsXG4gICAgICAgIC8vICdyZWFjdC1kb20nXG4gICAgICBdIDogW11cbiAgICB9LFxuICAgIC8vIFNvdXJjZSBtYXBzIGZvciBkZWJ1Z2dpbmdcbiAgICBzb3VyY2VtYXA6IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAnZGV2ZWxvcG1lbnQnLFxuICAgIC8vIE9wdGltaXplIENTU1xuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcbiAgICAvLyBSZXBvcnQgY29tcHJlc3NlZCBmaWxlIHNpemVzXG4gICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IHRydWUsXG4gICAgLy8gQ2h1bmsgc2l6ZSB3YXJuaW5nIGxpbWl0XG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgIC8vIE91dHB1dCBkaXJlY3RvcnlcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICAvLyBBc3NldHMgZGlyZWN0b3J5XG4gICAgYXNzZXRzRGlyOiAnYXNzZXRzJyxcbiAgICAvLyBDbGVhbiBvdXRwdXQgZGlyZWN0b3J5IGJlZm9yZSBidWlsZFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlXG4gIH0sXG4gIC8vIE9wdGltaXplIGRlcGVuZGVuY2llc1xuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXG4gICAgICAncmVhY3QnLFxuICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAncmVhY3Qtcm91dGVyLWRvbScsXG4gICAgICAnZnJhbWVyLW1vdGlvbicsXG4gICAgICAnbHVjaWRlLXJlYWN0JyxcbiAgICAgICdyZWNoYXJ0cycsXG4gICAgICAnZGF0ZS1mbnMnLFxuICAgICAgJ3p1c3RhbmQnLFxuICAgICAgJ3Nvbm5lcidcbiAgICBdLFxuICAgIGV4Y2x1ZGU6IFtcbiAgICAgIC8vIEV4Y2x1ZGUgbGFyZ2UgZGVwZW5kZW5jaWVzIHRoYXQgc2hvdWxkIGJlIGxvYWRlZCBkeW5hbWljYWxseVxuICAgIF1cbiAgfSxcbiAgLy8gQ1NTIG9wdGltaXphdGlvblxuICBjc3M6IHtcbiAgICAvLyBFbmFibGUgQ1NTIG1vZHVsZXNcbiAgICBtb2R1bGVzOiB7XG4gICAgICBsb2NhbHNDb252ZW50aW9uOiAnY2FtZWxDYXNlJ1xuICAgIH0sXG4gICAgLy8gUG9zdENTUyBjb25maWd1cmF0aW9uXG4gICAgcG9zdGNzczoge1xuICAgICAgcGx1Z2luczogW1xuICAgICAgICAvLyBBZGQgYXV0b3ByZWZpeGVyIGFuZCBvdGhlciBQb3N0Q1NTIHBsdWdpbnMgYXMgbmVlZGVkXG4gICAgICBdXG4gICAgfSxcbiAgICAvLyBDU1MgcHJlcHJvY2Vzc2luZ1xuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgIHNjc3M6IHtcbiAgICAgICAgLy8gU0NTUyBvcHRpb25zIGlmIHVzaW5nIFNDU1NcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIC8vIEVudmlyb25tZW50IHZhcmlhYmxlc1xuICBkZWZpbmU6IHtcbiAgICBfX0RFVl9fOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyksXG4gICAgX19QUk9EX186IEpTT04uc3RyaW5naWZ5KHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicpLFxuICAgIF9fVkVSU0lPTl9fOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5ucG1fcGFja2FnZV92ZXJzaW9uIHx8ICcxLjAuMCcpXG4gIH0sXG4gIC8vIFByZXZpZXcgc2VydmVyIGNvbmZpZ3VyYXRpb25cbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxNzMsXG4gICAgaG9zdDogdHJ1ZVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsa0JBQWtCO0FBSDNCLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxNQUNKLFlBQVk7QUFBQSxJQUNkLENBQUM7QUFBQTtBQUFBLElBRUQsUUFBUSxJQUFJLFdBQVcsV0FBVztBQUFBLE1BQ2hDLFVBQVU7QUFBQSxNQUNWLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFlBQVk7QUFBQSxJ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
