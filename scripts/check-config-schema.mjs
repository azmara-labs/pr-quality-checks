#!/usr/bin/env node
/**
 * Catches a linter/formatter config whose declared schema version has
 * drifted from the actually-installed tool version.
 *
 * Caught in azmara-platform: biome.json's "$schema" pointed at
 * "https://biomejs.dev/schemas/1.9.4/schema.json" for months after
 * @biomejs/biome was bumped 1.9.4 -> 2.5.4 in an unrelated dependency
 * upgrade. Every single "biome check"/"biome format" invocation crashed
 * on a config-parse error (unknown key "ignore", deprecated "recommended"
 * field) the entire time - "pnpm lint" was never actually running, just
 * failing immediately, and nothing caught it because there was no
 * branch protection requiring it to pass yet.
 *
 * Currently covers Biome specifically, since it's the concrete tool that
 * embeds a literal version number in its schema URL. The REGISTRY array
 * below is where a future tool with the same pattern would be added.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ?? process.cwd();

const REGISTRY = [
  {
    tool: "biome",
    packageName: "@biomejs/biome",
    configFileNames: ["biome.json", "biome.jsonc"],
    schemaVersionPattern: /schemas\/(\d+)\.(\d+)\.(\d+)\/schema\.json/,
  },
];

function findConfigFiles(dir, fileNames, results = [], depth = 0) {
  if (depth > 3) return results; // don't wander into node_modules-depth territory
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name.startsWith(".turbo")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findConfigFiles(full, fileNames, results, depth + 1);
    } else if (fileNames.includes(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function getInstalledVersion(root, packageName) {
  // Prefer the actually-resolved version in node_modules over the semver
  // range in package.json - that's what's really running.
  const nodeModulesPkg = path.join(root, "node_modules", ...packageName.split("/"), "package.json");
  if (fs.existsSync(nodeModulesPkg)) {
    try {
      return JSON.parse(fs.readFileSync(nodeModulesPkg, "utf-8")).version;
    } catch {
      // fall through
    }
  }
  return null;
}

const violations = [];

for (const { tool, packageName, configFileNames, schemaVersionPattern } of REGISTRY) {
  const installedVersion = getInstalledVersion(root, packageName);
  if (!installedVersion) continue; // tool isn't used in this repo

  const configFiles = findConfigFiles(root, configFileNames);
  const [installedMajor] = installedVersion.split(".");

  for (const configFile of configFiles) {
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    } catch {
      violations.push(`${path.relative(root, configFile)}: not valid JSON - can't check its schema version`);
      continue;
    }

    const schema = config.$schema;
    if (!schema) continue; // no schema declared, nothing to compare

    const match = schema.match(schemaVersionPattern);
    if (!match) continue; // schema URL doesn't follow the versioned pattern we know how to parse

    const schemaVersion = `${match[1]}.${match[2]}.${match[3]}`;
    if (match[1] !== installedMajor) {
      violations.push(
        `${path.relative(root, configFile)}: $schema declares ${tool} ${schemaVersion}, but ${packageName}@${installedVersion} is installed ` +
          `(major version mismatch - this WILL cause config-parse errors, not just a cosmetic mismatch). Run '${tool} migrate --write' or update $schema manually.`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error(`✖ ${violations.length} config-schema version mismatch(es):\n`);
  for (const v of violations) console.error(`  ${v}`);
  process.exit(1);
}

console.log("✓ All known config schemas match their installed tool version");
