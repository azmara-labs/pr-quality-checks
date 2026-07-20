#!/usr/bin/env node
/**
 * Every publishable workspace package needs a minimum set of metadata
 * fields. Caught in azmara-platform: @azmr/ai was missing homepage,
 * repository, author, and keywords entirely - inconsistent with every
 * other package, and worse UX on its npm page.
 *
 * Skips private packages (internal apps aren't going to npm, so their
 * metadata doesn't matter the same way) and anything without a "name"
 * field at all (not a real package).
 */
// @ts-check
import path from "node:path";
import { findWorkspacePackages } from "./lib/workspace.mjs";

const root = process.argv[2] ?? process.cwd();
const REQUIRED_FIELDS = ["name", "version", "description", "license", "author", "homepage", "repository", "keywords"];

const packages = findWorkspacePackages(root);
const violations = [];

for (const { dir, pkg, parseError } of packages) {
  if (parseError) {
    violations.push(`${path.relative(root, dir)}: package.json failed to parse`);
    continue;
  }
  if (!pkg?.name) continue;
  if (pkg.private) continue;

  const missing = REQUIRED_FIELDS.filter((field) => {
    const value = pkg[field];
    if (value === undefined || value === null) return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === "string" && value.trim() === "") return true;
    return false;
  });

  if (missing.length > 0) {
    violations.push(`${pkg.name}: missing ${missing.join(", ")}`);
  }

  if (pkg.repository && typeof pkg.repository === "object" && !pkg.repository.directory) {
    violations.push(`${pkg.name}: repository field has no "directory" - link on npm won't point at the right subfolder`);
  }
}

if (violations.length > 0) {
  console.error(`✖ ${violations.length} publishable package(s) with incomplete metadata:\n`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log(`✓ All ${packages.filter((p) => p.pkg && !p.pkg.private).length} publishable packages have complete metadata`);
