# Story e06s03 — Persist window position per app

- **Epic:** e06 — Draggable window titlebar + drop window titling
- **BCPs:** 3
- **Status:** todo
- **Delta:** ADD (window position persistence)

## Summary

Persist each window's on-screen position so a dragged window reopens where the
user left it after a reload. Core `MF.Window` gains an opt-in `rememberKey`: when
set, it restores a saved position at construction and saves the position when a
titlebar drag ends. Each app opts in with a namespaced localStorage key.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Saves position on drag
  Given a draggable window with a rememberKey
  When I drag its titlebar and release
  Then the new {x, y} is written to localStorage under the key

Scenario: Restores saved position
  Given a saved position exists under the window's rememberKey
  When the window is created
  Then it opens at the saved {x, y}

Scenario: No saved position -> default layout
  Given no saved position exists
  When the window is created
  Then it keeps its default x/y (flow center for the board)
```

Also: **cursor fix** — remove `cursor: move` from `.window-title` so the
titlebar shows the usual cursor (Firefox renders `move` as four-direction arrows).

## Tasks

1. Core `MF.Window`: add `rememberKey` option; static `Window.savePos(key,x,y)` /
   `Window.loadPos(key)` built on `localStorage` in try/catch; restore saved pos
   in the constructor before build; save on drag end.
   **verify:** `node --test test/core-window.test.js`

2. Core `MF.WindowManager.add`: when placing an explicitly-positioned (x/y) window
   absolutely, also clear its flow centering margin so a restored position is exact.
   **verify:** `node --test test/core-window.test.js`

3. Core CSS: remove `cursor: move` from `.window-title`.
   **verify:** rebuild; no `cursor: move` in window.css.

4. Apps opt in: Stickies board window `rememberKey: 'stickiesboard.window.pos'`;
   Pomodoro window `rememberKey: 'pomodoro.window.pos'`.
   **verify:** `make verify` + manual UAT in both apps.
