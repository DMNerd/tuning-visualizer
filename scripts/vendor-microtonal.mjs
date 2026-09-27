// Builds vendor/microtonal from the microtonal fork of Tonal
// (https://github.com/DMNerd/microtonal).
//
// The fork isn't published yet, and its packages depend on each other by
// their @tonaljs/* names, so gv can't install it from git. Instead we bundle
// the fork's `tonal` entry point (all packages, from source) into one ESM file
// plus bundled type declarations.
//
// The bundle is git-ignored; only vendor/microtonal/SOURCE.json is committed.
// It pins the fork commit the bundle was built from, like a lockfile entry.
//
// Usage:
//   pnpm vendor:microtonal [path-to-fork]  build from a local checkout
//                                          (default ../microtonal) and pin it
//   pnpm vendor:microtonal --from-pin      rebuild the pinned commit, fetched
//                                          from GitHub (used by CI and Docker)

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "vendor/microtonal");
const pinFile = join(outDir, "SOURCE.json");
const REPOSITORY = "https://github.com/DMNerd/microtonal";

const fail = (message) => {
  process.stderr.write(`vendor-microtonal: ${message}\n`);
  process.exit(1);
};
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: "utf-8", stdio: "inherit" });

// Bundle the fork at `forkDir` into vendor/microtonal. tsdown runs inside the
// fork so it uses the fork's own toolchain.
function bundle(forkDir) {
  const entry = join(forkDir, "packages/tonal/index.ts");
  if (!existsSync(entry)) fail(`microtonal fork not found at ${forkDir}`);

  // Start from an empty folder, keeping only the pin
  mkdirSync(outDir, { recursive: true });
  for (const file of readdirSync(outDir)) {
    if (file !== "SOURCE.json") rmSync(join(outDir, file), { recursive: true });
  }

  const tmp = mkdtempSync(join(tmpdir(), "vendor-microtonal-"));
  const config = join(tmp, "tsdown.config.mjs");
  // Every package of the fork is inlined (they import each other as
  // @tonaljs/*); the RegExp can't go through JSON, so it's added separately.
  writeFileSync(
    config,
    `const base = ${JSON.stringify({
      entry: { index: entry },
      outDir,
      format: "esm",
      platform: "neutral",
      hash: false,
      clean: false,
      dts: { eager: true },
    })};
export default { ...base, deps: { alwaysBundle: [/^@tonaljs\\//] } };
`,
  );
  try {
    run(
      "npx",
      [
        "tsdown",
        "-c",
        config,
        "--config-loader",
        "native",
        "--logLevel",
        "warn",
      ],
      join(forkDir, "packages/tonal"),
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

async function fromPin() {
  if (!existsSync(pinFile)) fail(`no pin found at ${pinFile}`);
  const pin = JSON.parse(readFileSync(pinFile, "utf-8"));
  if (pin.dirty) {
    fail(
      "the pin was made from uncommitted fork changes, so it can't be " +
        "rebuilt. Commit and push the fork, then run pnpm vendor:microtonal.",
    );
  }
  const [, owner, repo] = new URL(pin.repository).pathname.split("/");
  const url = `https://codeload.github.com/${owner}/${repo}/tar.gz/${pin.commit}`;

  const tmp = mkdtempSync(join(tmpdir(), "microtonal-src-"));
  try {
    const response = await fetch(url);
    if (!response.ok) fail(`download failed (${response.status}): ${url}`);
    const archive = join(tmp, "src.tar.gz");
    writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
    run("tar", ["-xzf", archive, "-C", tmp]);
    const forkDir = join(tmp, `${repo}-${pin.commit}`);
    run("npm", ["ci", "--no-audit", "--no-fund", "--loglevel=error"], forkDir);
    bundle(forkDir);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  process.stdout.write(
    `vendor/microtonal built from pinned ${pin.branch}@${pin.commit.slice(0, 8)}\n`,
  );
}

function fromCheckout(path) {
  const forkDir = resolve(root, path);
  const git = (...args) =>
    execFileSync("git", ["-C", forkDir, ...args], {
      encoding: "utf-8",
    }).trim();
  const commit = git("rev-parse", "HEAD");
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const dirty = git("status", "--porcelain", "--untracked-files=no") !== "";

  bundle(forkDir);
  writeFileSync(
    pinFile,
    `${JSON.stringify(
      {
        repository: REPOSITORY,
        branch,
        commit,
        dirty,
        note: "Pin written by scripts/vendor-microtonal.mjs. Do not edit by hand.",
      },
      null,
      2,
    )}\n`,
  );
  process.stdout.write(
    `vendor/microtonal updated from ${branch}@${commit.slice(0, 8)}\n`,
  );
  if (dirty) {
    process.stderr.write(
      "warning: the fork has uncommitted changes. CI and Docker rebuild the " +
        "pinned commit, so commit and push the fork, then re-run this.\n",
    );
  }
}

const arg = process.argv[2];
if (arg === "--from-pin") {
  await fromPin();
} else {
  fromCheckout(arg ?? "../microtonal");
}
