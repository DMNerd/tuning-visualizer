// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import htmlMinifier from "vite-plugin-html-minifier-terser";
import csp from "vite-plugin-csp-guard";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function makePolicy(isDev) {
  const base = {
    "default-src": ["'self'"],
    "script-src": ["'self'"],
    "style-src-elem": ["'self'", "'unsafe-inline'"],
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": ["'self'", "data:"],
    "connect-src": ["'self'"],
    "font-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
  };
  if (isDev) {
    base["connect-src"].push(
      "ws://localhost:*",
      "ws://127.0.0.1:*",
      "http://localhost:*",
      "http://127.0.0.1:*",
    );
  }
  return base;
}

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
        policy: makePolicy(isDev),
        sri: true,
      }),
    ],

    // 👇 Lightning CSS config
    css: {
      // Use Lightning CSS instead of PostCSS for transforms
      transformer: "lightningcss",
      // Also use Lightning CSS as the CSS minifier
      // (so JS can still use terser/esbuild independently)
      lightningcss: {
        // Match your supported browsers for prefixing/polyfills
        // Examples:
        // targets: { chrome: 109, safari: 15, firefox: 102, edge: 109 },
        // OR a Browserslist-style string:
        // targets: ">= 0.25%",
        drafts: {
          // You use nesting across layout.css — keep it on
          nesting: true,
          // Handy if you decide to use @custom-media
          customMedia: true,
        },
        // Optional: enable/adjust CSS Modules behavior if you use them
        // cssModules: { pattern: "[name]_[local]__[hash]" },
        // Optional: minify in dev too (off by default)
        // minify: !isDev ? true : false,
      },
    },

    // Fine-grained control: ensure CSS minification also uses Lightning CSS
    build: {
      cssMinify: "lightningcss",
    },

    resolve: {
      alias: { "@": resolve(__dirname, "src") },
    },
  };
});
