#!/usr/bin/env node
/**
 * If package.json's "files" array lists a path, it should actually exist.
 * npm silently skips missing entries rather than erroring on publish -
 * caught in azmara-platform: every package listed "LICENSE" in files,
 * but none of them actually had one on disk. Every published tarball
 * had been missing its license file for its entire history and nothing
 * ever failed loudly about it.
 *
 * Only checks static path entries (no glob support needed yet - none of
 * our packages use them). "dist" is allowed to be absent since it's a
 * build output, not something expected to exist at check time.
 */
import fs from "node:fs";
import path from "node:path";
import { findWorkspacePackages } from "./lib/workspace.mjs";

const root = process.argv[2] ?? process.cwd();
const BUILD_OUTPUT_DIRS = new Set(["dist", "build", "lib"]);

const packages = findWorkspacePackages(root);
const violations = [];

for (const { dir, pkg } of packages) {
  if (!pkg?.files || !Array.isArray(pkg.files)) continue;

  for (const entry of pkg.files) {
    if (BUILD_OUTPUT_DIRS.has(entry)) continue;
    if (entry.includes("*")) continue; // glob patterns not checked

    const entryPath = path.join(dir, entry);
    if (!fs.existsSync(entryPath)) {
      violations.push(`${pkg.name}: files lists "${entry}" but it doesn't exist at ${path.relative(root, entryPath)}`);
    }
  }
}

if (violations.length > 0) {
  console.error(`✖ ${violations.length} files-array inconsistenc(ies) - these entries will be silently skipped on publish:\n`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log("✓ All declared files entries exist on disk");
