// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import htmlMinifier from "vite-plugin-html-minifier-terser";
import csp from "vite-plugin-csp-guard";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Development CSP: allow HMR websockets and localhost fetches.
const devPolicy = {
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'"],
  "img-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "ws://localhost:*",
    "ws://127.0.0.1:*",
    "http://localhost:*",
    "http://127.0.0.1:*",
  ],
  "font-src": ["'self'"],
  "frame-ancestors": ["'self'"],
};

// Production CSP: tighten as needed for your external CDNs/APIs.
const prodPolicy = {
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'"],
  "img-src": ["'self'", "data:"],
  "connect-src": ["'self'"],
  "font-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "frame-ancestors": ["'self'"],
};

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";

  return {
    plugins: [
      react(),
      htmlMinifier({
        minifyOptions: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true,
          minifyCSS: true,
          minifyJS: true,
        },
      }),
      csp({
        policy: isDev ? devPolicy : prodPolicy,
        sri: true, // enable Subresource Integrity
      }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  };
});
