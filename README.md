# pr-quality-checks

Shared PR quality/security checks for `azmara-labs` repos, as reusable
GitHub Actions workflows (`workflow_call`) plus the standalone Node
scripts behind them. Built out of real bugs found by hand in
`azmara-platform` - see each script's file header for the specific
incident that motivated it.

## Checks

| Script | What it catches |
|---|---|
| `check-encoding.mjs` | Mojibake (UTF-8 re-decoded as Windows-1252) in source/config text |
| `check-package-metadata.mjs` | Publishable packages missing required `package.json` fields |
| `check-files-consistency.mjs` | `package.json`'s `files` array listing paths that don't exist on disk |
| `check-publish-guard.mjs` | Internal packages missing `private: true` and/or a changesets ignore entry |

Run them all: `node scripts/run-all.mjs <path-to-repo>` (defaults to cwd).

## Using from another repo

```yaml
jobs:
  standards:
    uses: azmara-labs/pr-quality-checks/.github/workflows/reusable-package-standards.yml@main
    secrets:
      app-private-key: ${{ secrets.CLA_BOT_PRIVATE_KEY }}
```

This repo is private, so the reusable workflow checks itself out using a
GitHub App token (same App already installed org-wide for the CLA bot) -
the default `GITHUB_TOKEN` in the calling repo can't read another
private repo on its own.

## Status

Scaffolded with the first 4 checks (package/publish hygiene). Not yet
wired into any repo's CI - `azmara-platform` should be the first
consumer, to prove the reusable-workflow pattern works before anything
else depends on it.

Planned but not yet built (see the full standards list from the
azmara-platform session that spawned this repo):
- Config-schema validation (catch a linter config silently no-oping
  forever against a mismatched tool version)
- Nested-config inheritance check (a nested `biome.json` not inheriting
  the root's file excludes)
- Optional native-dependency type fallback check
- PR template field completeness
