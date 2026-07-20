#!/usr/bin/env node
/**
 * A package that should never be published needs BOTH "private": true
 * AND a changesets ignore entry - having only one isn't enough.
 *
 * Caught in azmara-platform: apps/docs-next had neither. changesets
 * happily bumped its version and release.yml tried to publish it to npm
 * right alongside the real packages, only caught because the publish
 * step itself failed on an unrelated auth issue at the same time - if
 * that hadn't been broken too, docs-next would have actually published.
 *
 * Also flags the opposite: a package that IS meant to publish (not
 * private) but isn't on the ignore list AND has no version - usually
 * means it's mid-scaffold and not ready to be picked up by CI yet, which
 * is fine, just flagged so it's a deliberate choice, not an oversight.
 */
// @ts-check
import path from "node:path";
import { findWorkspacePackages, getChangesetIgnoreList } from "./lib/workspace.mjs";

const root = process.argv[2] ?? process.cwd();
const packages = findWorkspacePackages(root);
const ignoreList = getChangesetIgnoreList(root);
const usesChangesets = ignoreList.length > 0 || packages.some((p) => p.pkg?.name);

const violations = [];

for (const { dir, pkg } of packages) {
  if (!pkg?.name) continue;

  const isPrivate = pkg.private === true;
  const isIgnored = ignoreList.includes(pkg.name);

  if (isPrivate && !isIgnored && usesChangesets) {
    violations.push(
      `${pkg.name}: "private": true but not on the changesets ignore list - ` +
        `changesets will still try to version-bump it (harmless on its own, but inconsistent - add it to .changeset/config.json's "ignore")`,
    );
  }

  if (!isPrivate && isIgnored) {
    // Not necessarily wrong (e.g. @azmr/ai is manually versioned on purpose),
    // but worth a visible note since it's an easy thing to forget about.
    console.log(`ℹ ${pkg.name}: publishable but changesets-ignored (manually versioned) - ${path.relative(root, dir)}`);
  }
}

if (violations.length > 0) {
  console.error(`✖ ${violations.length} publish-guard inconsistenc(ies):\n`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log("✓ No private/ignore-list inconsistencies");
