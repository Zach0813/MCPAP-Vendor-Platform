#!/usr/bin/env bash
# verify-build.sh — quick local sanity check for the MCPAP website build.
#
# Why this exists: `npm run dev` skips strict type-checks; `npm run build` does
# the full TS + ESLint pass. This script runs them individually so you can see
# *which* layer is unhappy without having to scroll through a turbopack dump.
#
# Usage:
#   bash scripts/verify-build.sh           # full verify (TS → lint → build)
#   bash scripts/verify-build.sh --quick   # TS + lint only (no full build)
#
# The .next folder on macOS FUSE mounts sometimes holds stale file handles
# after a previous build (see BUILD_FIXES_SUMMARY.md "EPERM" workaround). This
# script handles that for you by renaming instead of deleting.

set -uo pipefail

cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"
echo "▶ Working in: $PROJECT_ROOT"
echo

QUICK="${1:-}"

# ---------------------------------------------------------------------------
# Step 1: TypeScript compile-only check (fastest signal — this is what was
# silently failing before because next dev doesn't enforce strict checks).
# ---------------------------------------------------------------------------
echo "═══ [1/3] tsc --noEmit ════════════════════════════════════════════════"
if npx tsc --noEmit --pretty; then
  echo "✓ TypeScript clean"
else
  echo "✗ TypeScript errors above — fix these first, build will fail otherwise."
  exit 1
fi
echo

# ---------------------------------------------------------------------------
# Step 2: ESLint (Next 16 + flat config). Errors fail the build; warnings OK.
# ---------------------------------------------------------------------------
echo "═══ [2/3] eslint ══════════════════════════════════════════════════════"
if npx eslint . --max-warnings=999; then
  echo "✓ ESLint clean (or warnings only)"
else
  echo "✗ ESLint errors above — fix these or the build will fail."
  exit 1
fi
echo

if [ "$QUICK" = "--quick" ]; then
  echo "─── --quick mode: skipping full next build. Pre-checks passed."
  exit 0
fi

# ---------------------------------------------------------------------------
# Step 3: Full `next build`. Handle the FUSE EPERM issue by moving .next aside.
# ---------------------------------------------------------------------------
echo "═══ [3/3] next build ══════════════════════════════════════════════════"
if [ -d ".next" ]; then
  STAMP="$(date +%Y%m%d-%H%M%S)"
  echo "Moving stale .next aside as .next.stash-${STAMP} (FUSE mount workaround)..."
  mv .next ".next.stash-${STAMP}" || {
    echo "⚠ Could not mv .next — trying npm cache clean."
  }
fi

if npm run build; then
  echo
  echo "════════════════════════════════════════════════════════════════════"
  echo "✓ BUILD SUCCEEDED"
  echo "════════════════════════════════════════════════════════════════════"
  exit 0
else
  echo
  echo "════════════════════════════════════════════════════════════════════"
  echo "✗ next build failed — see output above."
  echo "════════════════════════════════════════════════════════════════════"
  exit 1
fi
