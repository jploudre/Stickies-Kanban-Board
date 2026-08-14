# Story e05s01 — Build minimal second app from core/ alone

- **Epic:** e05 — Second app proof
- **BCPs:** 6
- **Status:** todo
- **Delta:** ADDED (minimal second app from core only)

## Summary

The real generalization test. Build one minimal second "Mac Fantasy App" (e.g.
a small Notepad or Calculator) using only `core/`: `MF` namespace, theme,
menubar from config, and a `MF.Window`, plus its own tiny app files. It must
build to its own single-file `index.html` via the e04 build flag. Any code it
has to duplicate instead of reuse is a core gap for e05s02.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Second app builds from core
  Given the second app composes core + its own minimal files
  When I run python3 build.py --app <second>
  Then it produces its own single-file index.html

Scenario: App reuses core components
  Given the app is written with core available
  Then it composes MF.menubar, MF.Window, MF.sound, and theme rather than re-implementing them

Scenario: App functions
  Given the app is built
  When I open it
  Then it presents a retro-Mac window with a menubar and works as intended

Scenario: Gaps are logged
  Given the second app needed something not in core
  Then it is recorded as a promotion candidate (core-gaps.md)
```

## Risks

- The second app may reveal that pieces the plan assumed were generic (e.g.
  window resize/drag, a notepad textarea) are actually app-coupled — exactly
  what this proof is for; those surface as e05s02 promotions.

## Verification

```bash
python3 build.py --app pomodoro --out /tmp/pomodoro.html && echo built
grep -qE 'MF\.(menubar|Window|sound)' src/apps/pomodoro/app.js && echo reuses-core
bash tools/run-tests.sh 2>&1 | grep -i pass
test -f specs/epics/e05-second-app-proof/core-gaps.md && echo gaps-logged
```
