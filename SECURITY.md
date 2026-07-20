# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities privately - **do not** open a public issue.

**Email:** gazmutech@gmail.com

Include:
- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code, if applicable)
- The version of `@azmr/pr-quality-checks` affected

We aim to acknowledge reports within 3 business days and to keep you updated as the issue is triaged and fixed.

## Supported Versions

Only the latest published version on npm is supported with security fixes. Please upgrade rather than requesting a backported patch for an older version.

## What This Repo Already Does

- `npm run check-types` (`tsc --noEmit` over JSDoc-annotated scripts) and the standards checks themselves run in CI on every PR, and again in `release.yml` before publish
- Zero runtime dependencies - nothing to inherit vulnerabilities from at install time
- `npm publish` runs via GitHub OIDC trusted publishing with provenance, not a long-lived npm token
- Branch protection on `main` requires PRs, a passing `Self-check` status check, and blocks force-pushes/deletion

## Scope

This policy covers the `@azmr/pr-quality-checks` package and this repository. Vulnerabilities in third-party dependencies should ideally be reported upstream to their own maintainers.
