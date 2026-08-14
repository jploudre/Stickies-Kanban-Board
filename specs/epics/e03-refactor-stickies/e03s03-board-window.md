# Story e03s03 — Board becomes a MF.Window

- **Epic:** e03 — Refactor Stickies to consume the core shell
- **BCPs:** 5
- **Status:** todo
- **Delta:** MODIFIED (board rendered as a MF.Window)

## Summary

e02s05 gave us `MF.Window`. This story makes the Stickies board the *content* of
a `MF.Window` instance (`new MF.Window({ title: board title, content: <board
html> })`) via `MF.WindowManager`, instead of the board markup carrying its own
`.board.window` chrome. Window buttons stay presentational per the retro look
unless the second-app proof later makes them functional.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Board is window content
  Given the app creates a MF.Window
  When it mounts the board html as the window content
  Then the board renders inside the window chrome with a titlebar

Scenario: Title editing preserved
  Given the window title reflects the board title
  When I click it
  Then it enters the click-to-edit flow exactly as today

Scenario: Board behaviour unchanged
  Given the board is now a MF.Window
  When I use the app
  Then drag/drop, editing, lists, notes, and reset behave identically (UAT, build-diff guard)
```

## Risks

- The window titlebar currently doubles as the board-title editor; moving the
  board into a generic Window must not break the title-edit wiring.

## Verification

```bash
grep -q 'new MF.Window' src/apps/stickies/app.js && echo 'board is a window'
grep -q 'board.title' src/apps/stickies/app.js && echo 'title wired'
# manual UAT: board in window, drag/drop, editing, lists, notes, reset
```
