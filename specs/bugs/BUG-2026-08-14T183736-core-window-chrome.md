# BUG-2026-08-14T183736: Core window chrome + base type not self-sufficient for all apps

## Problem

UAT review of the second Mac Fantasy app (Pomodoro, built from core/ alone) and the
refactored Stickies app surfaced three visual regressions:

1. **Pomodoro window close box sits in the wrong place.** The window titlebar shows
   the close box, the title, and the maximize box all *clustered near the middle* of
   the titlebar, leaving the left edge empty. Expected: the close box sits at the
   top-left corner, the title is truly centered, and the maximize box sits at the
   top-right corner.
2. **Stickies board window must not show a close/maximize box at all.** The generic
   core window constructor always injects the close and maximize buttons; Stickies
   (a flow-layout board window) should render its titlebar with no window buttons.
3. **Pomodoro uses the fallback browser font in the window titlebar, and the
   menubar titles + app-name have an unwanted underline.** A real Mac titlebar uses
   the app font and menu titles are not underlined.

## Root Cause Analysis

The generalization pass moved chrome (theme, menubar, window, sound) into `core/`,
but two things were left behind in the Stickies app-only stylesheet:

- The **base typography + link reset** (`html/body/input/textarea` font-family,
  `a { text-decoration: none }`, box resets, outline reset) still lives only in
  `stickies/app.css`. Any app built from core alone (Pomodoro) inherits the browser
  defaults: a serif fallback font in unstyled text (the window titlebar) and
  underlined anchors (the menubar titles and the app name).

- The **window close/maximize buttons** are owned by core and always rendered, but
  their default CSS uses `float: left/right` inside a `display:flex` titlebar where
  floats are inert. The three flex items (close, title, maximize) are therefore
  centered as one group, so the close box appears mid-titlebar instead of in the
  top-left corner. Stickies has no need for these buttons at all, so it carries
  local overrides to keep them out of the way — a symptom that core had no supported
  "no buttons" mode.

Risk level: **Low** — presentation-only regressions; no data/state/logic affected.

## TDD Fix Plan

1. **RED** — Core `MF.Window` honors a `buttons` option: when `{ buttons: false }`
   the built titlebar contains no `.btn-close` / `.btn-maximize` element; when the
   option is omitted (default) both are present.
   **GREEN** — In core window constructor store `this.buttons = opts.buttons !== false`,
   and only append the close/maximize anchors in `build()` when `this.buttons` is true.
   **verify**: `node --test test/core-window.test.js`

2. **RED** — Core window CSS positions the buttons at the titlebar corners so the
   title stays centered: `.btn-close` is absolutely anchored to the left edge and
   `.btn-maximize` to the right edge of the titlebar (titlebar is `position: relative`).
   **GREEN** — Update core window CSS: make `.window-title` `position: relative`, and
   set `.btn-close { position:absolute; left }` / `.btn-maximize { position:absolute; right }`.
   **verify**: rebuild + headless measurement script asserts `btn-close.x` near the
   titlebar left and `btn-maximize` near the right.

3. **RED** — Core theme provides the base typography + link reset so any app built
   from core alone gets the retro font and un-underlined anchors. Assert (headless)
   that the window titlebar font-family equals the app font and menubar anchors have
   `text-decoration: none`.
   **GREEN** — Add the base reset (font-family on `html,body,input,textarea`; padding/
   margin reset; `a{ text-decoration:none }`; outline reset) to the shared core tokens
   stylesheet; remove the now-duplicated blocks from `stickies/app.css`.
   **verify**: rebuild + headless measurement script.

4. **App wiring** — Stickies board window is created with `buttons: false`; the
   Stickies favicon second-icon insertion in the right menubar (an `<img class="icon">`
   prepended to the app-name anchor) is removed.
   **GREEN** — Edit Stickies app wiring only.
   **verify**: `make verify`

**REFACTOR** — Delete the now-dead Stickies overrides that reference `.btn-close` /
`.btn-maximize` on the board window, and drop the duplicated base-reset rules from
`stickies/app.css`. Rebuild `index.html` and refresh the build-diff reference.

## Acceptance Criteria

- [x] Pomodoro titlebar: close box at top-left, title centered, maximize at top-right; titlebar uses the app font.
- [x] Stickies board window has no close/maximize box.
- [x] Stickies right menubar shows only the app name (no second favicon icon).
- [x] Menubar menu titles and app name have no underline in both apps.
- [x] All new tests pass; existing tests still pass.
- [x] `make verify` green (build OK, byte-identical after reference refresh, all tests pass).

## Resolution

Validated 2026-08-14. Root cause: core window buttons used inert floats inside a
flex titlebar and the base typography/link reset still lived only in the Stickies
stylesheet, so any app built from core alone inherited browser defaults.

Fixes shipped:
- Core `MF.Window` honors `{ buttons: false }` (no close/maximize anchors built).
- Core window CSS absolutely anchors `.btn-close` / `.btn-maximize` to the titlebar
  corners so the title stays centered and uses the app font.
- Base typography + link reset (font, padding/margin, `a{text-decoration:none}`, outline)
  moved from `stickies/app.css` into shared `core/theme/tokens.css`; removed the
  now-dead Stickies overrides.
- Stickies board window created with `buttons: false`; second favicon icon removed
  from the right menubar.

Gates: `make verify` green (`node --check`, CSS balance, deterministic build,
byte-identical to refreshed reference, 18 tests pass on node --test). Board window
renders with no close/maximize box; Pomodoro titlebar chrome is corner-anchored.
