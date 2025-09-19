// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
import { visualizer } from "file:///home/project/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
import { splitVendorChunkPlugin } from "file:///home/project/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    // Split vendor chunks for better caching
    splitVendorChunkPlugin(),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInXG5pbXBvcnQgeyBzcGxpdFZlbmRvckNodW5rUGx1Z2luIH0gZnJvbSAndml0ZSdcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIC8vIFNwbGl0IHZlbmRvciBjaHVua3MgZm9yIGJldHRlciBjYWNoaW5nXG4gICAgc3BsaXRWZW5kb3JDaHVua1BsdWdpbigpLFxuICAgIC8vIEJ1bmRsZSBhbmFseXplciAob25seSBpbiBidWlsZCBtb2RlKVxuICAgIHByb2Nlc3MuZW52LkFOQUxZWkUgJiYgdmlzdWFsaXplcih7XG4gICAgICBmaWxlbmFtZTogJ2Rpc3Qvc3RhdHMuaHRtbCcsXG4gICAgICBvcGVuOiB0cnVlLFxuICAgICAgZ3ppcFNpemU6IHRydWUsXG4gICAgICBicm90bGlTaXplOiB0cnVlXG4gICAgfSlcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICAgIGhvc3Q6IHRydWUsXG4gICAgLy8gRW5hYmxlIEhUVFAvMlxuICAgIGh0dHBzOiBmYWxzZSxcbiAgICAvLyBPcHRpbWl6ZSBkZXYgc2VydmVyXG4gICAgaG1yOiB7XG4gICAgICBvdmVybGF5OiB0cnVlXG4gICAgfVxuICB9LFxuICBidWlsZDoge1xuICAgIC8vIFRhcmdldCBtb2Rlcm4gYnJvd3NlcnMgZm9yIHNtYWxsZXIgYnVuZGxlc1xuICAgIHRhcmdldDogJ2VzMjAyMCcsXG4gICAgLy8gRW5hYmxlIG1pbmlmaWNhdGlvblxuICAgIG1pbmlmeTogJ3RlcnNlcicsXG4gICAgdGVyc2VyT3B0aW9uczoge1xuICAgICAgY29tcHJlc3M6IHtcbiAgICAgICAgLy8gUmVtb3ZlIGNvbnNvbGUubG9nIGluIHByb2R1Y3Rpb25cbiAgICAgICAgZHJvcF9jb25zb2xlOiB0cnVlLFxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxuICAgICAgICAvLyBSZW1vdmUgdW51c2VkIGNvZGVcbiAgICAgICAgZGVhZF9jb2RlOiB0cnVlLFxuICAgICAgICAvLyBPcHRpbWl6ZSBjb21wYXJpc29uc1xuICAgICAgICBjb21wYXJpc29uczogdHJ1ZSxcbiAgICAgICAgLy8gT3B0aW1pemUgY29uZGl0aW9uYWxzXG4gICAgICAgIGNvbmRpdGlvbmFsczogdHJ1ZSxcbiAgICAgICAgLy8gT3B0aW1pemUgbG9vcHNcbiAgICAgICAgbG9vcHM6IHRydWUsXG4gICAgICAgIC8vIFJlbW92ZSB1bnVzZWQgdmFyaWFibGVzXG4gICAgICAgIHVudXNlZDogdHJ1ZVxuICAgICAgfSxcbiAgICAgIG1hbmdsZToge1xuICAgICAgICAvLyBNYW5nbGUgZnVuY3Rpb24gbmFtZXMgZm9yIHNtYWxsZXIgc2l6ZVxuICAgICAgICB0b3BsZXZlbDogdHJ1ZVxuICAgICAgfSxcbiAgICAgIGZvcm1hdDoge1xuICAgICAgICAvLyBSZW1vdmUgY29tbWVudHNcbiAgICAgICAgY29tbWVudHM6IGZhbHNlXG4gICAgICB9XG4gICAgfSxcbiAgICAvLyBPcHRpbWl6ZSBjaHVuayBzcGxpdHRpbmdcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgLy8gTWFudWFsIGNodW5rIHNwbGl0dGluZyBmb3IgYmV0dGVyIGNhY2hpbmdcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgLy8gUmVhY3QgZWNvc3lzdGVtXG4gICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAvLyBVSSBsaWJyYXJpZXNcbiAgICAgICAgICAndWktdmVuZG9yJzogWydmcmFtZXItbW90aW9uJywgJ2x1Y2lkZS1yZWFjdCcsICdzb25uZXInXSxcbiAgICAgICAgICAvLyBDaGFydCBsaWJyYXJpZXNcbiAgICAgICAgICAnY2hhcnQtdmVuZG9yJzogWydyZWNoYXJ0cyddLFxuICAgICAgICAgIC8vIERhdGUgdXRpbGl0aWVzXG4gICAgICAgICAgJ2RhdGUtdmVuZG9yJzogWydkYXRlLWZucyddLFxuICAgICAgICAgIC8vIFV0aWxpdHkgbGlicmFyaWVzXG4gICAgICAgICAgJ3V0aWxzLXZlbmRvcic6IFsnenVzdGFuZCcsICdjbHN4J11cbiAgICAgICAgfSxcbiAgICAgICAgLy8gT3B0aW1pemUgY2h1bmsgZmlsZSBuYW1lc1xuICAgICAgICBjaHVua0ZpbGVOYW1lczogKGNodW5rSW5mbykgPT4ge1xuICAgICAgICAgIGNvbnN0IGZhY2FkZU1vZHVsZUlkID0gY2h1bmtJbmZvLmZhY2FkZU1vZHVsZUlkXG4gICAgICAgICAgICA/IGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZC5zcGxpdCgnLycpLnBvcCgpPy5yZXBsYWNlKC9cXC5bXi5dKiQvLCAnJykgfHwgJ2NodW5rJ1xuICAgICAgICAgICAgOiAnY2h1bmsnO1xuICAgICAgICAgIHJldHVybiBganMvJHtmYWNhZGVNb2R1bGVJZH0tW2hhc2hdLmpzYDtcbiAgICAgICAgfSxcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcbiAgICAgICAgICBjb25zdCBpbmZvID0gYXNzZXRJbmZvLm5hbWU/LnNwbGl0KCcuJykgfHwgW107XG4gICAgICAgICAgY29uc3QgZXh0ID0gaW5mb1tpbmZvLmxlbmd0aCAtIDFdO1xuICAgICAgICAgIGlmICgvcG5nfGpwZT9nfHN2Z3xnaWZ8dGlmZnxibXB8aWNvL2kudGVzdChleHQgfHwgJycpKSB7XG4gICAgICAgICAgICByZXR1cm4gYGltYWdlcy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKC9jc3MvaS50ZXN0KGV4dCB8fCAnJykpIHtcbiAgICAgICAgICAgIHJldHVybiBgY3NzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoL3dvZmYyP3xlb3R8dHRmfG90Zi9pLnRlc3QoZXh0IHx8ICcnKSkge1xuICAgICAgICAgICAgcmV0dXJuIGBmb250cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdYDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGBhc3NldHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXWA7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAvLyBFeHRlcm5hbCBkZXBlbmRlbmNpZXMgKGlmIHVzaW5nIENETilcbiAgICAgIGV4dGVybmFsOiBwcm9jZXNzLmVudi5VU0VfQ0ROID8gW1xuICAgICAgICAvLyAncmVhY3QnLFxuICAgICAgICAvLyAncmVhY3QtZG9tJ1xuICAgICAgXSA6IFtdXG4gICAgfSxcbiAgICAvLyBTb3VyY2UgbWFwcyBmb3IgZGVidWdnaW5nXG4gICAgc291cmNlbWFwOiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyxcbiAgICAvLyBPcHRpbWl6ZSBDU1NcbiAgICBjc3NDb2RlU3BsaXQ6IHRydWUsXG4gICAgLy8gUmVwb3J0IGNvbXByZXNzZWQgZmlsZSBzaXplc1xuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiB0cnVlLFxuICAgIC8vIENodW5rIHNpemUgd2FybmluZyBsaW1pdFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICAvLyBPdXRwdXQgZGlyZWN0b3J5XG4gICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgLy8gQXNzZXRzIGRpcmVjdG9yeVxuICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgLy8gQ2xlYW4gb3V0cHV0IGRpcmVjdG9yeSBiZWZvcmUgYnVpbGRcbiAgICBlbXB0eU91dERpcjogdHJ1ZVxuICB9LFxuICAvLyBPcHRpbWl6ZSBkZXBlbmRlbmNpZXNcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxuICAgICAgJ2ZyYW1lci1tb3Rpb24nLFxuICAgICAgJ2x1Y2lkZS1yZWFjdCcsXG4gICAgICAncmVjaGFydHMnLFxuICAgICAgJ2RhdGUtZm5zJyxcbiAgICAgICd6dXN0YW5kJyxcbiAgICAgICdzb25uZXInXG4gICAgXSxcbiAgICBleGNsdWRlOiBbXG4gICAgICAvLyBFeGNsdWRlIGxhcmdlIGRlcGVuZGVuY2llcyB0aGF0IHNob3VsZCBiZSBsb2FkZWQgZHluYW1pY2FsbHlcbiAgICBdXG4gIH0sXG4gIC8vIENTUyBvcHRpbWl6YXRpb25cbiAgY3NzOiB7XG4gICAgLy8gRW5hYmxlIENTUyBtb2R1bGVzXG4gICAgbW9kdWxlczoge1xuICAgICAgbG9jYWxzQ29udmVudGlvbjogJ2NhbWVsQ2FzZSdcbiAgICB9LFxuICAgIC8vIFBvc3RDU1MgY29uZmlndXJhdGlvblxuICAgIHBvc3Rjc3M6IHtcbiAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgLy8gQWRkIGF1dG9wcmVmaXhlciBhbmQgb3RoZXIgUG9zdENTUyBwbHVnaW5zIGFzIG5lZWRlZFxuICAgICAgXVxuICAgIH0sXG4gICAgLy8gQ1NTIHByZXByb2Nlc3NpbmdcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBzY3NzOiB7XG4gICAgICAgIC8vIFNDU1Mgb3B0aW9ucyBpZiB1c2luZyBTQ1NTXG4gICAgICB9XG4gICAgfVxuICB9LFxuICAvLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbiAgZGVmaW5lOiB7XG4gICAgX19ERVZfXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09ICdkZXZlbG9wbWVudCcpLFxuICAgIF9fUFJPRF9fOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nKSxcbiAgICBfX1ZFUlNJT05fXzogSlNPTi5zdHJpbmdpZnkocHJvY2Vzcy5lbnYubnBtX3BhY2thZ2VfdmVyc2lvbiB8fCAnMS4wLjAnKVxuICB9LFxuICAvLyBQcmV2aWV3IHNlcnZlciBjb25maWd1cmF0aW9uXG4gIHByZXZpZXc6IHtcbiAgICBwb3J0OiA0MTczLFxuICAgIGhvc3Q6IHRydWVcbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLGtCQUFrQjtBQUMzQixTQUFTLDhCQUE4QjtBQUp2QyxJQUFNLG1DQUFtQztBQU96QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUE7QUFBQSxJQUVOLHVCQUF1QjtBQUFBO0FBQUEsSUFFdkIsUUFBUSxJQUFJLFdBQVcsV0FBVztBQUFBLE1BQ2hDLFVBQVU7QUFBQSxNQUNWLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFlBQVk7QUFBQSxJQUNkLENBQUM7QUFBQSxFQUNILEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUEsSUFFTixPQUFPO0FBQUE7QUFBQSxJQUVQLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBO0FBQUEsSUFFTCxRQUFRO0FBQUE7QUFBQSxJQUVSLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQTtBQUFBLFFBRVIsY0FBYztBQUFBLFFBQ2QsZUFBZTtBQUFBO0FBQUEsUUFFZixXQUFXO0FBQUE7QUFBQSxRQUVYLGFBQWE7QUFBQTtBQUFBLFFBRWIsY0FBYztBQUFBO0FBQUEsUUFFZCxPQUFPO0FBQUE7QUFBQSxRQUVQLFFBQVE7QUFBQSxNQUNWO0FBQUEsTUFDQSxRQUFRO0FBQUE7QUFBQSxRQUVOLFVBQVU7QUFBQSxNQUNaO0FBQUEsTUFDQSxRQUFRO0FBQUE7QUFBQSxRQUVOLFVBQVU7QUFBQSxNQUNaO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQSxRQUVOLGNBQWM7QUFBQTtBQUFBLFVBRVosZ0JBQWdCLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBO0FBQUEsVUFFekQsYUFBYSxDQUFDLGlCQUFpQixnQkFBZ0IsUUFBUTtBQUFBO0FBQUEsVUFFdkQsZ0JBQWdCLENBQUMsVUFBVTtBQUFBO0FBQUEsVUFFM0IsZUFBZSxDQUFDLFVBQVU7QUFBQTtBQUFBLFVBRTFCLGdCQUFnQixDQUFDLFdBQVcsTUFBTTtBQUFBLFFBQ3BDO0FBQUE7QUFBQSxRQUVBLGdCQUFnQixDQUFDLGNBQWM7QUFDN0IsZ0JBQU0saUJBQWlCLFVBQVUsaUJBQzdCLFVBQVUsZUFBZSxNQUFNLEdBQUcsRUFBRSxJQUFJLEdBQUcsUUFBUSxZQUFZLEVBQUUsS0FBSyxVQUN0RTtBQUNKLGlCQUFPLE1BQU0sY0FBYztBQUFBLFFBQzdCO0FBQUEsUUFDQSxnQkFBZ0IsQ0FBQyxjQUFjO0FBQzdCLGdCQUFNLE9BQU8sVUFBVSxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDNUMsZ0JBQU0sTUFBTSxLQUFLLEtBQUssU0FBUyxDQUFDO0FBQ2hDLGNBQUksa0NBQWtDLEtBQUssT0FBTyxFQUFFLEdBQUc7QUFDckQsbUJBQU87QUFBQSxVQUNUO0FBQ0EsY0FBSSxPQUFPLEtBQUssT0FBTyxFQUFFLEdBQUc7QUFDMUIsbUJBQU87QUFBQSxVQUNUO0FBQ0EsY0FBSSxzQkFBc0IsS0FBSyxPQUFPLEVBQUUsR0FBRztBQUN6QyxtQkFBTztBQUFBLFVBQ1Q7QUFDQSxpQkFBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUE7QUFBQSxNQUVBLFVBQVUsUUFBUSxJQUFJLFVBQVU7QUFBQTtBQUFBO0FBQUEsTUFHaEMsSUFBSSxDQUFDO0FBQUEsSUFDUDtBQUFBO0FBQUEsSUFFQSxXQUFXLFFBQVEsSUFBSSxhQUFhO0FBQUE7QUFBQSxJQUVwQyxjQUFjO0FBQUE7QUFBQSxJQUVkLHNCQUFzQjtBQUFBO0FBQUEsSUFFdEIsdUJBQXVCO0FBQUE7QUFBQSxJQUV2QixRQUFRO0FBQUE7QUFBQSxJQUVSLFdBQVc7QUFBQTtBQUFBLElBRVgsYUFBYTtBQUFBLEVBQ2Y7QUFBQTtBQUFBLEVBRUEsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQTtBQUFBLElBRVQ7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLEtBQUs7QUFBQTtBQUFBLElBRUgsU0FBUztBQUFBLE1BQ1Asa0JBQWtCO0FBQUEsSUFDcEI7QUFBQTtBQUFBLElBRUEsU0FBUztBQUFBLE1BQ1AsU0FBUztBQUFBO0FBQUEsTUFFVDtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEscUJBQXFCO0FBQUEsTUFDbkIsTUFBTTtBQUFBO0FBQUEsTUFFTjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLFFBQVE7QUFBQSxJQUNOLFNBQVMsS0FBSyxVQUFVLFFBQVEsSUFBSSxhQUFhLGFBQWE7QUFBQSxJQUM5RCxVQUFVLEtBQUssVUFBVSxRQUFRLElBQUksYUFBYSxZQUFZO0FBQUEsSUFDOUQsYUFBYSxLQUFLLFVBQVUsUUFBUSxJQUFJLHVCQUF1QixPQUFPO0FBQUEsRUFDeEU7QUFBQTtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
