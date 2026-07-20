#!/usr/bin/env node
/**
 * Scans for mojibake - UTF-8 bytes that got mis-decoded as Windows-1252/
 * Latin-1 somewhere along the way (usually an editor or a copy-paste from
 * a tool that didn't declare UTF-8). Caught in azmara-platform: 5 of 7
 * published packages had "â€”" instead of "—" in their description field,
 * live on npm, for their entire publish history.
 *
 * Common patterns: an em dash (—), right single quote ('), left/right
 * double quotes ("/"), or an ellipsis (…) encoded as UTF-8 then
 * re-interpreted as Windows-1252 produces a 2-3 byte garbled sequence
 * starting with "Ã" or "â€".
 */
// @ts-check
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ?? process.cwd();

// Byte sequences that only ever appear as mojibake in practice - not
// valid/expected in any of our source text otherwise.
const MOJIBAKE_PATTERNS = [/â€”/, /â€™/, /â€œ/, /â€\x9d/, /â€¦/, /Ã©/, /Ã¨/, /Â /];

const SCAN_EXTENSIONS = [".json", ".md", ".ts", ".tsx", ".js", ".jsx"];
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", ".turbo", "build", "coverage"]);

/**
 * @param {string} dir
 * @param {string[]} [files]
 * @returns {string[]}
 */
function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".changeset") continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (SCAN_EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

/** @type {string[]} */
const violations = [];
for (const file of walk(root)) {
  const contents = fs.readFileSync(file, "utf-8");
  const lines = contents.split("\n");
  lines.forEach((line, i) => {
    for (const pattern of MOJIBAKE_PATTERNS) {
      if (pattern.test(line)) {
        violations.push(`${path.relative(root, file)}:${i + 1} - ${line.trim().slice(0, 80)}`);
        break;
      }
    }
  });
}

if (violations.length > 0) {
  console.error(`✖ Found ${violations.length} likely mojibake occurrence(s):\n`);
  for (const v of violations) console.error(`  ${v}`);
  console.error("\nThis is usually a UTF-8 file re-saved/edited as Windows-1252 or Latin-1.");
  process.exit(1);
}

console.log("✓ No mojibake found");
