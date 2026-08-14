# Story e01s02 — Minimal headless TDD harness, single command

- **Epic:** e01 — Verification baseline
- **BCPs:** 3
- **Status:** todo
- **Delta:** ADDED (TDD infrastructure, folded into Preflight)

## Summary

There is no test infrastructure. As core modules (sound, menubar, window) are
extracted they must be testable headlessly with a single command, per
CONVENTIONS.md § Tests. This story stands up a minimal, dependency-free harness
that loads plain JS core files and asserts outcomes, invoked by one command in
`make verify`.

## User value

Every core module gets an observable "it works" assertion, so the generalization
is verified at each step rather than only by manual UAT.

## Scope

- In: a minimal headless runner (one command), a smoke fixture proving it loads core JS, folded into Preflight.
- Out: full framework (Jest/Vitest), DOM simulation of the whole app (that is `verify-work`), browser screenshot tests.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Harness runs core tests headlessly
  Given a pure core module and its test fixture
  When I run bash tools/run-tests.sh
  Then it loads the core JS, runs assertions, and reports pass

Scenario: Harness is part of Preflight
  Given the harness exists
  When I run make verify
  Then the test command executes and reports passing tests
```

## Risks

- Core JS is written for the browser (uses `window`, `document`). Pure logic
  must be extracted so it loads without a DOM; browser-coupled behavior is
  covered by UAT, not this harness.

## Verification

```bash
bash tools/run-tests.sh    # expect pass
make verify                # harness runs inside Preflight
```
