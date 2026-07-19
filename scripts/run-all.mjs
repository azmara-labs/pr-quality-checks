#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const root = process.argv[2] ?? process.cwd();

const CHECKS = [
  "check-encoding.mjs",
  "check-package-metadata.mjs",
  "check-files-consistency.mjs",
  "check-publish-guard.mjs",
];

let failed = false;

for (const check of CHECKS) {
  console.log(`\n── ${check} ${"─".repeat(Math.max(0, 50 - check.length))}`);
  try {
    execFileSync("node", [path.join(scriptsDir, check), root], { stdio: "inherit" });
  } catch {
    failed = true;
  }
}

console.log();
if (failed) {
  console.error("✖ One or more standards checks failed - see above");
  process.exit(1);
}
console.log("✓ All standards checks passed");
