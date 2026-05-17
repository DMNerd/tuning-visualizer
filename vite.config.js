import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import htmlMinifier from "vite-plugin-html-minifier-terser";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { VitePWA } from "vite-plugin-pwa";
import { sri } from "vite-plugin-sri3";
import { compression } from "vite-plugin-compression2";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

function resolveAppVersion() {
  const packageVersion = packageJson.version;

  if (packageVersion && packageVersion !== "0.0.0") {
    return packageVersion;
  }

  try {
    return execSync("git describe --tags --always --dirty", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return packageVersion || "unknown";
  }
}

const appVersion = resolveAppVersion();

export default defineConfig(({ command, mode }) => {
  const isProductionBuild = command === "build" && mode === "production";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: "auto",
        includeAssets: [
          "favicon.svg",
          "apple-touch-icon.png",
          "maskable-icon.svg",
          "safari-pinned-tab.svg",
        ],
        manifest: {
          name: "Tuning Visualizer",
          short_name: "TuningViz",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#101214",
          theme_color: "#ff6a00",
          icons: [
            {
              src: "/maskable-icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "/maskable-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,svg,png,webmanifest}"],
          cleanupOutdatedCaches: true,
          navigateFallback: "/index.html",
        },
        devOptions: {
          enabled: false,
        },
      }),
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
            sri(),
            compression({
              algorithms: ["gzip", "brotliCompress"],
              exclude: [/\.(png|jpe?g|webp|avif|gif|woff2?)$/i],
              deleteOriginalAssets: false,
            }),
          ]
        : []),
    ],

    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    },

    css: {
      transformer: "lightningcss",
      lightningcss: {
        targets: { chrome: 109, safari: 15, firefox: 102, edge: 109 },
        drafts: { nesting: true, customMedia: true },
      },
    },

    build: {
      cssMinify: "lightningcss",
      rolldownOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) {
              return;
            }

            if (id.includes("/react/") || id.includes("/react-dom/")) {
              return "react-core";
            }

            if (
              id.includes("/react-icons/") ||
              id.includes("/react-hot-toast/") ||
              id.includes("/clsx/")
            ) {
              return "ui-kit";
            }

            if (id.includes("/fuse.js/")) {
              return "search";
            }

            if (id.includes("/json-edit-react/")) {
              return "editor";
            }

            if (id.includes("/zustand/")) {
              return "state";
            }

            return "vendor";
          },
        },
      },
    },

    resolve: {
      alias: [{ find: "@", replacement: resolve(__dirname, "src") }],
    },
  };
});
