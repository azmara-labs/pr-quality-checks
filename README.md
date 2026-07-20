# pr-quality-checks

Shared PR quality/security checks for `azmara-labs` repos, published as
a normal npm package. Built out of real bugs found by hand in
`azmara-platform` - see each script's file header for the specific
incident that motivated it.

## Checks

| Script | What it catches |
|---|---|
| `check-encoding.mjs` | Mojibake (UTF-8 re-decoded as Windows-1252) in source/config text |
| `check-package-metadata.mjs` | Publishable packages missing required `package.json` fields |
| `check-files-consistency.mjs` | `package.json`'s `files` array listing paths that don't exist on disk |
| `check-publish-guard.mjs` | Internal packages missing `private: true` and/or a changesets ignore entry |
| `check-config-schema.mjs` | A tool config's declared `$schema` version drifting from the actually-installed tool version (currently covers Biome) |

Run them all: `node scripts/run-all.mjs <path-to-repo>` (defaults to cwd).

## Using from another repo

```bash
pnpm add -D @azmr/pr-quality-checks
```

```yaml
# in your CI workflow, after `pnpm install`
- name: Package standards
  run: node node_modules/@azmr/pr-quality-checks/scripts/run-all.mjs .
```

A cross-repo reusable GitHub Actions workflow (`workflow_call`) was the
original plan, but hit an unresolved GitHub Actions permission issue
calling a *private* repo's reusable workflow from another repo in the
same org - empty `referenced_workflows`, immediate failure, persisted
across retries even with `Settings > Actions > Access` correctly set to
`organization`. Publishing as a real npm package sidesteps the problem
entirely: it's just a normal `pnpm install`, no cross-repo Actions
permissions involved.

## Status

5 checks shipped, live on npm as `@azmr/pr-quality-checks`, consumed by
`azmara-platform`'s CI (`Test & Lint` job).

Planned but not yet built:
- Nested-config inheritance check (a nested `biome.json` not inheriting
  the root's file excludes - the actual bug that caused ~12,600
  false-positive lint findings in one session)
- Optional native-dependency type fallback check
- PR template field completeness
