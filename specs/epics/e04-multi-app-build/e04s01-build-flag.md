# Story e04s01 — build.py --app flag / per-app build config

- **Epic:** e04 — Multi-app no-bundler build
- **BCPs:** 4
- **Status:** todo
- **Delta:** MODIFIED (build.py accepts an app flag / per-app config)

## Summary

`build.py` currently concatenates `css/` and `js/` from `src/` into one root
`index.html`. After e03 there is a `core/` + an `apps/` tree, and several apps
must each build to their own single-file `index.html` (default: stickies). Keep
the no-bundler, inline-to-data-URI model; the build regexes `css/` links and
`js/` scripts in the app shell `index.html`, so core + app files are composed in
that shell.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Build targets an app
  Given the app flag / build config
  When I run python3 build.py --app <app>
  Then it produces that app's single-file index.html with assets inlined

Scenario: Default unchanged
  Given no --app flag
  When I build
  Then the root deliverable is produced identically (make/build work, verify green)

Scenario: Core + app assets inline
  Given a build for an app
  Then both core/theme and app assets resolve to data: URIs
```

## Risks

- The asset-inline regex must generalize across source dirs (`core/theme`,
  `apps/*/assets`) without losing any asset reference.

## Verification

```bash
python3 build.py --app stickies --out /tmp/app1.html && echo built
grep -q 'data:' /tmp/app1.html && echo 'assets inlined'
make verify 2>&1 | grep -i 'build OK'
grep -q -- '--app' README.md && echo documented
```
