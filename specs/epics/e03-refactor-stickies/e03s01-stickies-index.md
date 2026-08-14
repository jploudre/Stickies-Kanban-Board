# Story e03s01 — Shrink Stickies index.html to load core + app only

- **Epic:** e03 — Refactor Stickies to consume the core shell
- **BCPs:** 3
- **Status:** todo
- **Delta:** MODIFIED (app shell shrinks to "load core + app files")

## Summary

After e02 the core files live in `src/core/`. This story makes
`src/apps/stickies/` the app shell: its `index.html` composes `core/` files plus
Stickies-specific files (`model.js`, `app.js`, `app.css`, `sw.js`), referencing
shared core by path. The single-file build still concatenates them into one
`index.html`.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Stickies is an app on core
  Given the app files live under src/apps/stickies/
  When the shell index.html composes core + app files in dependency order
  Then the app builds to a single index.html via build.py

Scenario: App functions identically
  Given the app is rebuilt from the composed shell
  When I use it
  Then board/list/note behaviour is unchanged (UAT, build-diff guard)
```

## Risks

- Path rewiring across the split could break asset inlining or load order —
  covered by build-diff guard + UAT.

## Verification

```bash
test -f src/apps/stickies/app.js && echo ok
grep -q 'core' src/apps/stickies/index.html && echo 'core composed'
bash tools/build-diff.sh && echo 'app builds from core+app'
```
