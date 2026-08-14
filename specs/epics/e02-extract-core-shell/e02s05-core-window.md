# Story e02s05 — Extract window component (MF.Window) + window CSS

- **Epic:** e02 — Extract core shell
- **BCPs:** 5
- **Status:** todo
- **Delta:** ADDED (`core/window/` generic Window + WindowManager + window.css)

## Summary

Window chrome (`.window`, `.window-focus`, `.window-title`, `.window-content`,
`.btn-close`, `.btn-maximize`) lives in `app.css`; the board template in
`index.html` uses it; there is no generic Window JS. Extract `core/window/
window.css` and a generic `MF.Window` class (title, content, strip pattern,
centered title, window buttons) plus a `WindowManager` (placement, z-order,
focus) so any app can put content in a window. Retro look preserved; buttons
remain decorative/identical in this phase.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Window is a reusable component
  Given core/window/ exists
  Then a MF.Window accepts { title, content, width, height, position, onClose }
  And a MF.WindowManager places/orders windows

Scenario: Window chrome CSS is in core
  Given the window styles are extracted
  Then generic .window* rules live in core/window/window.css, not app.css
  And .board.window-specific overrides remain in app.css

Scenario: No behaviour change
  Given the board still renders as a window
  When I build and open the app
  Then it looks and behaves identically to before (UAT, build-diff wiring-only)
```

## Risks

- Extracting `.window*` CSS without dragging in `.board` coupling must keep
  specificity/order identical for the existing board window.
- The board currently *is* the window (no separate window object); this story
  only extracts the reusable component, not yet the board-as-window refactor
  (that is e03s03).

## Verification

```bash
test -f src/core/window/window.css && echo ok
node --check src/core/window/window.js && bash tools/run-tests.sh | grep -i 'window.*pass'
# manual UAT: window chrome renders identically
```
