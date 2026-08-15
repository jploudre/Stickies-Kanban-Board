# Story e06s01 — Core: draggable titlebar on MF.Window

- **Epic:** e06 — Draggable window titlebar + drop window titling
- **BCPs:** 4
- **Status:** todo
- **Delta:** ADD (core window drag capability)

## Summary

Add a reusable drag-the-window-by-its-titlebar capability to the core `MF.Window`
component. Any window (flow-layout board or `x/y`-positioned Pomodoro window) can
be moved by pressing and dragging on its `.window-title` head. On first drag a
flow window is converted to an absolute-positioned window at its current location.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Drag window by titlebar
  Given a window is rendered with a titlebar
  When I press the titlebar and move the mouse
  Then the window follows the mouse (left/top update)
  And no text is selected while dragging
  When I release the mouse
  Then the window stays where I dropped it

Scenario: Flow window becomes draggable
  Given a flow-layout window (no x/y, centered by margin)
  When I press its titlebar and drag
  Then it is converted to absolute positioning at its current spot and moves

Scenario: Interactive titlebar children don't drag
  Given the titlebar contains a close/maximize button
  When I press a button
  Then the window does not start dragging (button click still works)
```

## Risks

- Must not collide with the Stickies note drag (`drag.js`) on shared `document`
  `mousemove`/`mouseup`.
- Converting a flow window to absolute must preserve its visual position and
  must not disturb width (`max-content`) or the `.crowded` max-width logic.

## Tasks

1. Core `MF.Window` stores `this.draggable = opts.draggable !== false`.
   **verify:** `node --test test/core-window.test.js`

2. On titlebar `mousedown` (primary button, target not an `a`/`input`/`.edit`),
   capture the window's resolved `left`/`top` (converting to absolute if needed),
   bind `document` `mousemove`/`mouseup`, add a body drag class, and move the
   window by the mouse delta. Clean up on `mouseup`.
   **verify:** `node --test test/core-window.test.js`

3. Core CSS: `.window-title` gets `cursor: move`; drag sets `user-select: none`
   on the body via the drag class.
   **verify:** rebuild + manual UAT.

4. Shared `core/theme/desktop.css`: give `body` a `min-height: 100vh` so an
   absolutely-positioned (dragged) window never collapses the desktop backdrop.
   **verify:** `make verify` + manual UAT.
