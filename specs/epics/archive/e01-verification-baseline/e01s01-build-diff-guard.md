# Story e01s01 — Byte-identical / build-diff guard for extraction safety

- **Epic:** e01 — Verification baseline
- **BCPs:** 3
- **Status:** todo
- **Delta:** MODIFIED (build/verify tooling gains a byte-diff guard)

## Summary

The generalization moves source files into `src/core/` and rewires module load
order. Phase-1 extraction MUST be behaviour-identical, yet nothing today asserts
that the built single-file artifact is unchanged by pure file moves / wiring.
This story adds a guard that fails the build when the shipped `index.html` bytes
drift for reasons other than intentional behaviour change.

## User value

Gives the refactor a safety net: an automatic "did the app just change by
accident?" check, so extraction can proceed under green gates instead of blind.

## Scope

- In: a build-diff tool (hash reference vs rebuilt artifact), wired into Preflight (`make verify`), plus a negative-path test proving it fires.
- Out: pixel/screenshot diffing (deferred), real unit-test framework (e01s02).

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Clean build matches reference
  Given source files are moved / rewired without behaviour change
  When I run the build-diff guard
  Then it reports the built index.html is byte-identical and the build is green

Scenario: Guard fires on unexpected change
  Given a source file's bytes are altered (planted change)
  When I run the build-diff guard --self-test
  Then it reports the drift and fails, proving the guard is live
```

## Risks

- Wiring-only reorders could legitimately change bytes (e.g. asset inlining
  order) — the guard must distinguish intentional change from accidental. Soft
  flag first if needed, document in the tool.

## Verification

```bash
bash tools/build-diff.sh           # write reference hash (first run)
bash tools/build-diff.sh           # expect "clean"
bash tools/build-diff.sh --self-test   # expect guard fires on planted change
make verify                         # guard is part of Preflight
```
