import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import htmlMinifier from "vite-plugin-html-minifier-terser";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ command, mode }) => {
  const isProductionBuild = command === "build" && mode === "production";

  return {
    plugins: [
      react(),
      ...(isProductionBuild
        ? [
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
            ViteImageOptimizer({
              png: { quality: 80 },
              jpeg: { quality: 80 },
              jpg: { quality: 80 },
              webp: { quality: 80 },
              avif: { quality: 50 },
            }),
          ]
        : []),
    ],

    css: {
      transformer: "lightningcss",
      lightningcss: {
        targets: { chrome: 109, safari: 15, firefox: 102, edge: 109 },
        drafts: { nesting: true, customMedia: true },
      },
    },

    build: {
      cssMinify: "lightningcss",
    },

    resolve: {
      alias: [{ find: "@", replacement: resolve(__dirname, "src") }],
    },
  };
});