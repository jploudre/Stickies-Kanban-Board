# Story e02s02 — Promote theme/font layer into core/theme/

- **Epic:** e02 — Extract core shell
- **BCPs:** 2
- **Status:** todo
- **Delta:** ADDED (`core/theme/` with fonts + shared tokens)

## Summary

Promote `01-fonts.css` + font assets into `src/core/theme/` and add
`tokens.css` defining shared design tokens (`--ff` plus shared sizes/spacing)
as CSS variables that every app inherits and can override locally — additive,
no visual change.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Theme lives in core
  Given the font layer is in src/core/theme/
  Then fonts.css and the woff2 assets exist there

Scenario: Shared tokens exist
  Given tokens.css is loaded before app CSS
  Then --ff and shared size/spacing variables are defined

Scenario: Rendering unchanged
  Given fonts/tokens load in the same effective order
  When I build
  Then the shipped artifact is byte-identical (build-diff clean)
```

## Verification

```bash
test -f src/core/theme/fonts.css && test -f src/core/theme/assets/font-espy-regular.woff2 && echo ok
grep -q -- '--ff' src/core/theme/tokens.css && echo ok
bash tools/build-diff.sh && echo identical
```
