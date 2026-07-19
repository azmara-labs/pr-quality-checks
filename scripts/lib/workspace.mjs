import fs from "node:fs";
import path from "node:path";

/**
 * Finds package.json files under the given glob-ish directory patterns
 * (e.g. ["packages/*", "apps/*"]) relative to cwd. No real glob engine -
 * just one-level wildcard expansion, since that's all every azmara-labs
 * workspace layout has needed so far.
 */
export function findWorkspacePackages(root, patterns = ["packages/*", "apps/*"]) {
  const results = [];

  for (const pattern of patterns) {
    const [dir] = pattern.split("/*");
    const base = path.join(root, dir);
    if (!fs.existsSync(base)) continue;

    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const pkgDir = path.join(base, entry.name);
      const pkgJsonPath = path.join(pkgDir, "package.json");
      if (!fs.existsSync(pkgJsonPath)) continue;

      const raw = fs.readFileSync(pkgJsonPath, "utf-8");
      let pkg;
      try {
        pkg = JSON.parse(raw);
      } catch {
        results.push({ dir: pkgDir, pkgJsonPath, raw, pkg: null, parseError: true });
        continue;
      }
      results.push({ dir: pkgDir, pkgJsonPath, raw, pkg, parseError: false });
    }
  }

  return results;
}

/** Reads .changeset/config.json's ignore list, or [] if changesets isn't used. */
export function getChangesetIgnoreList(root) {
  const configPath = path.join(root, ".changeset", "config.json");
  if (!fs.existsSync(configPath)) return [];
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return config.ignore ?? [];
  } catch {
    return [];
  }
}

export function fail(messages) {
  for (const m of messages) console.error(`✖ ${m}`);
  process.exit(1);
}

export function ok(label) {
  console.log(`✓ ${label}`);
}
