# Story e03s02 — Menubar config object replaces hard-coded markup

- **Epic:** e03 — Refactor Stickies to consume the core shell
- **BCPs:** 4
- **Status:** todo
- **Delta:** MODIFIED (menubar now comes from a config object in app code)

## Summary

e02s04 gave us `MF.menubar.render(config)`. This story makes Stickies supply its
menus as a declarative config object (title, clock, menus with actions,
dividers, warn flags, and the Color menu with six swatches) defined in
`07-app.js`/`app.js`, replacing hard-coded `<header>` markup and leftover
app-specific selector handlers.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Menus are data
  Given the menu config object is defined in app code
  When MF.menubar.render(config) runs
  Then the menubar is produced from the config, not hard-coded markup

Scenario: Commands are routed
  Given the app binds actions via MF.menubar.on('action', name => …)
  When a menu is clicked
  Then undo/redo/new-note/reset/add-list/set-color run correctly, with enable/disable and Color checkmarks intact

Scenario: No residual hard-coded menus
  Given the refactor is complete
  Then no app-menu markup/selectors remain in the app index.html
```

## Risks

- The Color menu's disable/enable + checkmark-on-hover behavior must survive the
  move to config data.

## Verification

```bash
grep -q 'MF.menubar.render' src/apps/stickies/app.js && echo config-driven
grep -q 'MF.menubar.on' src/apps/stickies/app.js && echo 'action-routed'
grep -LE 'add-note-first|del-board' src/apps/stickies/index.html && echo 'no hard-coded menus'
# manual UAT: all menus + color swatches/checkmarks behave identically
```
