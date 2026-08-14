#!/usr/bin/env bash
# story: e01s02
# run-tests.sh — headless test runner for this project.
#
# Uses the built-in Node test runner (node --test) so there is no dependency to
# install. Tests live in test/ and assert pure logic through public interfaces;
# browser-coupled behavior is covered by UAT, not this harness (see CONVENTIONS
# § Tests). Core unit tests for src/core/* land in e02 onward; this harness is
# the e01s02 baseline proving headless, single-command runs work.
#
#   bash tools/run-tests.sh   # run the whole suite, exit non-zero on failure
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# test/ may not exist yet in a fresh checkout; fail loudly rather than silently.
if [ ! -d "$ROOT/test" ]; then
  echo "no test/ directory — nothing to run" >&2
  exit 0
fi

cd "$ROOT"
# No paths: node --test auto-discovers *.test.js under test/ (Node 18+).
node --test
