# Story e02s01 — Move Cash lib + util into core/ unchanged

- **Epic:** e02 — Extract core shell
- **BCPs:** 2
- **Status:** todo
- **Delta:** RENAMED (`src/js/01-lib.js` → `src/core/lib.js`, unchanged); ADDED MF shell bootstrap

## Summary

Cash (`01-lib.js`) and the generic util (`02-util.js`) are already app-agnostic.
Move them into `src/core/` unchanged, and add `src/core/shell.js` defining the
`MF` namespace with an app-registration API so core modules can publish under it.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Cash and util are in core, byte-identical
  Given the files are moved to src/core/
  When I compare to the committed originals
  Then they match byte-for-byte

Scenario: MF namespace exists
  Given shell.js is loaded
  Then window.MF is defined and exposes an app registration function

Scenario: App still builds identically after rewiring
  Given script tags now point at core/ files in the same order
  When I build
  Then the shipped index.html is byte-identical to the reference (build-diff clean)
```

## Risks

- Changing script load order / paths could reorder the concatenated output —
  mitigated by the build-diff guard (e01s01).

## Verification

```bash
diff <(git show HEAD:src/js/01-lib.js) src/core/lib.js && echo unchanged
node --check src/core/shell.js
bash tools/build-diff.sh && echo identical
```
