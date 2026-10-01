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
//   pnpm vendor:microtonal [path-to-fork] [--branch <name>]
//       build from a local checkout (default ../microtonal) and pin it. The
//       fork must be on the expected branch (the pinned one, or --branch);
//       a clean checkout on another branch is switched to it.
//   pnpm vendor:microtonal --from-pin
//       rebuild the pinned commit, fetched from GitHub (used by CI and
//       Docker), after checking the commit is on the pinned branch
//   pnpm vendor:microtonal --ensure
//       rebuild from the pin only if the bundle is missing or was built from
//       another commit (run by pnpm build). A bundle built from the pinned
//       commit of a local checkout, even with uncommitted changes, is kept.

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
// Git-ignored record of the commit the current bundle was built from
const stampFile = join(outDir, "BUILT.json");
const REPOSITORY = "https://github.com/DMNerd/microtonal";
// Branch gv tracks when there's no pin yet and no --branch
const DEFAULT_BRANCH = "main";

const fail = (message) => {
  process.stderr.write(`vendor-microtonal: ${message}\n`);
  process.exit(1);
};
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: "utf-8", stdio: "inherit" });
const warn = (message) => process.stderr.write(`warning: ${message}\n`);
const readPin = () =>
  existsSync(pinFile) ? JSON.parse(readFileSync(pinFile, "utf-8")) : null;

// Fails unless `commit` is on `branch` of the GitHub repo, so a pin can't
// point at a commit that was never pushed there (or was rebased away).
async function checkCommitOnBranch(owner, repo, branch, commit) {
  const url = `https://api.github.com/repos/${owner}/${repo}/compare/${encodeURIComponent(branch)}...${commit}`;
  const headers = { accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const response = await fetch(url, { headers });
  if (response.status === 404) {
    fail(
      `branch ${branch} or commit ${commit.slice(0, 8)} not found on GitHub`,
    );
  }
  if (!response.ok) {
    // Most likely the unauthenticated rate limit; the tarball download below
    // still pins the exact commit, so don't block the build on this check.
    warn(`couldn't check the pinned branch (${response.status}), continuing`);
    return;
  }
  const { status } = await response.json();
  if (status !== "identical" && status !== "behind") {
    fail(
      `pinned commit ${commit.slice(0, 8)} is not on ${branch} on GitHub ` +
        `(${status}). Push the fork, then re-run pnpm vendor:microtonal.`,
    );
  }
}

// Bundle the fork at `forkDir` into vendor/microtonal. tsdown runs inside the
// fork so it uses the fork's own toolchain.
function bundle(forkDir, commit) {
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
  // Written last, so an interrupted build leaves no stamp and is redone
  writeFileSync(stampFile, `${JSON.stringify({ commit }, null, 2)}\n`);
}

async function fromPin() {
  const pin = readPin();
  if (!pin) fail(`no pin found at ${pinFile}`);
  if (pin.dirty) {
    fail(
      "the pin was made from uncommitted fork changes, so it can't be " +
        "rebuilt. Commit and push the fork, then run pnpm vendor:microtonal.",
    );
  }
  const [, owner, repo] = new URL(pin.repository).pathname.split("/");
  await checkCommitOnBranch(owner, repo, pin.branch, pin.commit);
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
    bundle(forkDir, pin.commit);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  process.stdout.write(
    `vendor/microtonal built from pinned ${pin.branch}@${pin.commit.slice(0, 8)}\n`,
  );
}

function fromCheckout(path, expectedBranch) {
  const forkDir = resolve(root, path);
  if (!existsSync(forkDir)) fail(`microtonal fork not found at ${forkDir}`);
  const git = (...args) =>
    execFileSync("git", ["-C", forkDir, ...args], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const tryGit = (...args) => {
    try {
      return git(...args);
    } catch {
      return null;
    }
  };
  const isDirty = () =>
    git("status", "--porcelain", "--untracked-files=no") !== "";

  const branch = expectedBranch ?? readPin()?.branch ?? DEFAULT_BRANCH;
  const current = git("rev-parse", "--abbrev-ref", "HEAD");
  if (current !== branch) {
    const where = current === "HEAD" ? "a detached HEAD" : `branch ${current}`;
    if (isDirty()) {
      fail(
        `the fork is on ${where}, not ${branch}, and has uncommitted ` +
          `changes. Commit or stash them and check out ${branch}, or pass ` +
          `--branch ${current === "HEAD" ? "<name>" : current} to pin that branch.`,
      );
    }
    process.stdout.write(`switching the fork from ${where} to ${branch}\n`);
    try {
      git("checkout", branch);
    } catch (error) {
      fail(`couldn't check out ${branch}: ${error.stderr?.trim() || error}`);
    }
  }

  const commit = git("rev-parse", "HEAD");
  const dirty = isDirty();

  // --from-pin downloads from GitHub, so the commit has to be pushed there
  if (tryGit("fetch", "--quiet", "origin", branch) === null) {
    warn(`couldn't fetch origin/${branch}; skipping the pushed check`);
  } else if (
    tryGit("merge-base", "--is-ancestor", commit, "FETCH_HEAD") === null
  ) {
    warn(
      tryGit("merge-base", "--is-ancestor", "FETCH_HEAD", commit) !== null
        ? `${branch}@${commit.slice(0, 8)} isn't pushed yet; push the fork ` +
            "before committing the pin, or CI and Docker can't rebuild it."
        : `local ${branch} has diverged from origin/${branch}; reconcile ` +
            "and push before committing the pin.",
    );
  } else if (git("rev-parse", "FETCH_HEAD") !== commit) {
    warn(
      `local ${branch} is behind origin/${branch}; pull the fork if you ` +
        "meant to vendor the latest commit.",
    );
  }

  bundle(forkDir, commit);
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

function isBuiltFromPin() {
  const pin = readPin();
  if (!pin || !existsSync(join(outDir, "index.mjs"))) return false;
  if (!existsSync(stampFile)) return false;
  return JSON.parse(readFileSync(stampFile, "utf-8")).commit === pin.commit;
}

const args = process.argv.slice(2);
if (args.includes("--from-pin") || args.includes("--ensure")) {
  if (args.length > 1) fail(`${args[0]} takes no other arguments`);
  if (args[0] === "--ensure" && isBuiltFromPin()) {
    process.stdout.write("vendor/microtonal is up to date with the pin\n");
  } else {
    await fromPin();
  }
} else {
  let path = "../microtonal";
  let branch;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--branch") {
      branch = args[++i];
      if (!branch) fail("--branch needs a branch name");
    } else if (args[i].startsWith("--")) {
      fail(`unknown option ${args[i]}`);
    } else {
      path = args[i];
    }
  }
  fromCheckout(path, branch);
}
