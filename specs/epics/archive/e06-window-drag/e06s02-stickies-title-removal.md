# Story e06s02 — App: remove the editable board-title window titlebar (stickies)

- **Epic:** e06 — Draggable window titlebar + drop window titling
- **BCPs:** 4
- **Status:** todo
- **Delta:** MODIFIED (board window titlebar is static, non-editable)

## Summary

Remove the "title the window" capability left over from the multi-board era. The
board window titlebar should display a static, non-editable title (the app name);
clicking it no longer opens a board-title editor. The board model keeps its
`title` for persistence and the document title; only the in-window editing UI is
removed. The titlebar is now a clean drag handle (e06s01).

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Titlebar is static
  Given a board window is shown
  Then its titlebar shows a static title (no editable input)
  When I click the titlebar
  Then no edit field appears and the window drags instead

Scenario: Board persistence unchanged
  Given I edit notes/lists
  Then the board still saves with its title
  And the document title still reflects the board
```

## Tasks

1. `showBoard` creates the window with a static `title` (the app name) instead of
   `titleEl` plus an edit input; drop the now-unused `$title`/`$edit` locals.
   **verify:** `node --check src/apps/stickies/app.js`

2. Remove the board-title click-to-edit, keydown, blur, and input-resize event
   handlers from `app.js`.
   **verify:** `grep -q 'window-title.head .edit' src/apps/stickies/app.js` fails.

3. Remove the board-title titlebar editing CSS blocks from `app.css` (the
   `.edit`, `.editing` title/input overrides and `cursor: pointer` on the title).
   **verify:** `grep -q 'window-title.head > .edit' src/apps/stickies/app.css` fails.
