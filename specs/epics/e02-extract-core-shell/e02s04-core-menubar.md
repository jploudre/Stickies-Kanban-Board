# Story e02s04 — Extract menubar component (MF.menubar) from config

- **Epic:** e02 — Extract core shell
- **BCPs:** 6
- **Status:** todo
- **Delta:** ADDED (`core/menubar` renders from config, action registry); REMOVED (hard-coded menu markup/handlers from app shell)

## Summary

Menu HTML is hard-coded in `index.html`; menu CSS lives in `app.css`
(`header`, `.menu`, `.dropdown`, `.menu-divider`, `.color-swatch`, `.disabled`,
`.active`, `.menu-flashing`); click JS is hard-coded to selectors in `07-app.js`
(`.add-note-first`, `.del-board`, `.undo-board`, `.redo-board`, `.add-list`,
`.set-color`). Extract `core/menubar/menubar.css` + `menubar.js` so the menubar
renders from a declarative config and routes actions through a command registry,
keeping the rendered markup visually identical.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Menubar renders from config
  Given a menu config (File/Edit/Color + right clock/app-title)
  When the app calls MF.menubar.render(config)
  Then a <header> with the same DOM classes as today is produced

Scenario: Actions route through a registry
  Given the app subscribes via MF.menubar.on('action', name => …)
  When a menu item is clicked
  Then the corresponding action handler runs, with flash/disable/checkmark behaviour preserved

Scenario: Color menu specifics
  Given a Color menu with six swatches
  When a color is chosen for a selected note
  Then the swatch checkmark and note color update as today

Scenario: Markup no longer hard-coded
  Given the refactor is done
  Then no menu markup lives in index.html (it comes from config + core)

Scenario: Visual identity preserved
  When I build and open the app
  Then the menubar looks and behaves exactly as before (UAT, build-diff wiring-only)
```

## Risks

- The Color menu's swatch/checkmark/disable-when-no-selection logic is nuanced
  — the generic component must generalize it, with menu *items* still app data.
- Any CSS move from `app.css` to `menubar.css` must keep selector specificity /
  load order identical to avoid visual drift.

## Verification

```bash
node --check src/core/menubar/menubar.js && bash tools/run-tests.sh | grep -i menubar
grep -L 'add-note-first' src/index.html && echo 'markup no longer hard-coded'
grep -L "on('click', '.del-board'" src/js/07-app.js && echo 'selector handlers replaced'
# manual UAT: open/clk every menu, check flash, undo/redo disable, color checkmarks
```
