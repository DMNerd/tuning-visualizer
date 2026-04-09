import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import htmlMinifier from "vite-plugin-html-minifier-terser";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

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
