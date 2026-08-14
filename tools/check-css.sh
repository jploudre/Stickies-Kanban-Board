#!/usr/bin/env bash
# check-css.sh — every CSS file under src/ must have balanced braces.
# Guards against malformed CSS creeping into the split sources (a dangling
# brace silently discards every rule after it once concatenated into the
# single-file artifact). Added after the menubar.css extraction defect.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bad=0
while IFS= read -r f; do
  o=$(grep -o '{' "$f" | wc -l)
  c=$(grep -o '}' "$f" | wc -l)
  if [ "$o" != "$c" ]; then
    echo "UNBALANCED CSS: $f ($o open / $c close)" >&2
    bad=1
  fi
done < <(find src -name '*.css' | sort)

if [ "$bad" -eq 1 ]; then
  echo "CSS brace check FAILED" >&2
  exit 1
fi
echo "CSS braces OK ($(find src -name '*.css' | wc -l | tr -d ' ') files balanced)"
