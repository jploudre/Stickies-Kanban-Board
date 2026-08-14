#!/usr/bin/env bash
# story: e01s01
# build-diff.sh — guard that the shipped single-file index.html is byte-identical
# to a stored reference. Used by the generalization refactor so that moving files
# into src/core/ or rewiring load order cannot silently change the artifact bytes.
#
# Modes:
#   (no arg) / check  - if no reference hash exists, write one and report; else
#                       rebuild and fail (exit 1) if bytes drifted.
#   --write           - (re)write the reference hash from the current build.
#   --self-test       - plant a byte change in a throwaway build and confirm the
#                       guard detects the drift (negative-path regression).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="$ROOT/.buildbase"
REF="$BASE/index.sha256"
mkdir -p "$BASE"

build_artifact() {
  # Deterministic concat+inline build into the given out path (never touches
  # the committed index.html unless out IS index.html).
  (cd "$ROOT" && python3 build.py --out "$1" >/dev/null 2>&1)
}

sha() { sha256sum "$1" | awk '{print $1}'; }

cmd_check() {
  if [ ! -f "$REF" ]; then
    cmd_write
    return 0
  fi
  local tmp="/tmp/_builddiff_check.html"
  build_artifact "$tmp"
  local got want
  got="$(sha "$tmp")"
  want="$(cat "$REF")"
  if [ "$got" != "$want" ]; then
    echo "DRIFT: index.html bytes changed ($got != $want) — stop and review before proceeding" >&2
    exit 1
  fi
  echo "clean: index.html byte-identical to reference"
}

cmd_write() {
  local tmp="/tmp/_builddiff_write.html"
  build_artifact "$tmp"
  sha "$tmp" > "$REF"
  echo "reference hash written: $(cat "$REF")"
}

cmd_selftest() {
  if [ ! -f "$REF" ]; then
    cmd_write
  fi
  local tmp="/tmp/_builddiff_selftest.html"
  build_artifact "$tmp"
  printf '/* planted drift */\n' >> "$tmp"   # simulate an unintended byte change
  local bad want
  bad="$(sha "$tmp")"
  want="$(cat "$REF")"
  if [ "$bad" = "$want" ]; then
    echo "SELFTEST FAIL: planted drift was not detected" >&2
    exit 1
  fi
  echo "SELFTEST OK: guard fires on planted byte change"
}

case "${1:-check}" in
  --write|write|--init) cmd_write ;;
  --self-test|selftest) cmd_selftest ;;
  check|-c|"")          cmd_check ;;
  *)
    echo "usage: $0 [check|--write|--self-test]" >&2
    exit 2
    ;;
esac
