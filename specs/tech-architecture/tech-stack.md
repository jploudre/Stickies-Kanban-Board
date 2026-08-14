# Project Context

Stickies Kanban Board — "fantasy retro Mac" single-file kanban app. See
`GENERALIZE_LATEST.md` for the generalization design plan this doc supports.

## Stack

- **Language:** Vanilla JavaScript (no framework, no TypeScript). Mix of ES5
  constructor patterns (`function Note()`), ES6 classes (`class Storage`),
  and modern syntax (arrow functions, template literals, `Object.assign`).
  Served via script tags in dependency order, not modules.
- **Markup/Style:** Hand-written HTML + a single CSS file. All retro styling
  via pixel assets (woff2 fonts, gif backgrounds, png sprites).
- **DOM library:** **Cash** (a jQuery-like alternative) — fully minified, in
  `src/js/01-lib.js`; exposes the global `$`. Generic and app-agnostic.
- **Build:** Python 3 (`build.py`) + `Makefile` wrapper. No bundler, no npm.
  `build.py` concatenates CSS links and JS scripts into one `index.html` and
  inlines every asset to a `data:` URI.
- **Runtime:** Browser only. Uses a Service Worker (`sw.js`) for offline + a
  PWA manifest (generated at runtime). Persistence via `localStorage`.
- **No test infrastructure** exists today; `make verify` only syntax-checks JS
  and confirms the build is up to date.

## Architecture

### Entry point & data flow

```
src/index.html (dev shell)
   └─ registers CSS <link>s + JS <script>s in order (01-lib → 07-app)
        └─ build.py concatenates + inlines → single index.html (deliverable)

Init sequence (07-app.js, bottom):
  SKB.storage = new StorageLocal()
  SKB.storage.open()                → load config + board index from localStorage
  initDragAndDrop()                 → wire Drag2 for notes
  load active board OR create welcome demo board
  showBoard(true)                   → clone #templates into .wrap
  menubar clock, PWA manifest, sw.js registration, layout adjustments
```

**DOM is the source of truth.** The in-memory model (`Board`/`List`/`Note`) is
reconstructed *from the DOM* on every save (`saveBoard()` walks `.list`/`.note`
elements), not incrementally updated. Editing happens in contenteditable/DOM,
and the board blob is re-serialized wholesale.

### Modules (load order)

| File | Responsibility |
|------|----------------|
| `src/js/01-lib.js` | **Cash** DOM library (generic; defines `$` global) |
| `src/js/02-util.js` | `Number.prototype.clamp`, `confirm`/`alert` patch |
| `src/js/03-state.js` | `AppConfig`, `BoardMeta`, `Storage`/`StorageLocal` (localStorage persistence, revisioned undo history) |
| `src/js/04-model.js` | Domain model: `Note`, `List`, `Board` (+ `addList`/`addNote`) |
| `src/js/05-drag.js` | `Drag2` — drag-and-drop (prime → dragster → swap animation → drop sound) |
| `src/js/06-varadjust.js` | `VarAdjust` — drag-to-adjust (unused in current UI) |
| `src/js/07-app.js` | App: SKB object, all event handlers, menus, editing, layout, init |

### Persistence model (StorageLocal)

- Keys: `stickiesboard.config`, `stickiesboard.board.<id>.meta`,
  `stickiesboard.board.<id>.<rev>` (revisioned blobs).
- **Undo/redo = revision history.** Each `saveBoard()` writes a new revision;
  `BoardMeta.history` tracks up to `maxUndo` (20) revisions. Undo/redo moves
  the `current` pointer across revisions; superseded revisions are trimmed.
- `Board()` blobs carry a `format` tag; loader accepts legacy formats
  `20190412`, `20251115`, and current `SKB.blobVersion`.

### UI structure

- **Menubar** (`header > .menu`): fixed black bar with File / Edit / Color
  dropdowns + right-side clock and app title. Menu HTML is **hard-coded** in
  `src/index.html`; click behavior is hard-coded to selectors in `07-app.js`.
- **Board/window** (`.board.window`): a "window" chrome — titlebar with fake
  close/maximize buttons, stripe styling — whose content is the kanban board.
  The board *is* the window today (there is no separate window abstraction).
- **Lists + notes** cloned from `#templates` at runtime; `.note-<color>` class
  drives note color; drag-and-drop reorders via `Drag2`.
- **Color**: 6 colors (yellow/blue/green/pink/purple/gray), each with a swatch
  class; applied to notes and the drag ghost.

## Conventions (Observed)

- **Namespacing:** app state lives on the global `SKB` object; classes scoped
  one-per-file. Lots of free-floating globals (`Board`, `List`, `Note`,
  `addNote`, `saveBoard`, `StorageLocal`) with no shared namespace.
- **DOM-first:** read current state from the DOM; the model is rebuilt on save
  rather than kept authoritative.
- **Templates:** reusable markup lives in `<div id="templates">` and is
  deep-cloned by selector (`$tNote`, `$tList`, `$tBoard`).
- **Event handling:** delegated `$(...).on('click', '.selector', ...)` with
  classes (`add-note-first`, `del-board`, `undo-board`, `mov-list-l`, …)
  as the action hook. Actions flash via a `menu-flashing` class.
- **Styling:** CSS custom property `--ff` for the font; single `app.css`
  contains desktop, menubar, window, board, list, note, and drag rules
  together. Fake window buttons use `::after` background sprites.
- **Comment style:** many commented-out legacy features remain as
  documentation of what was removed ("Raw note toggle removed", "setRevealState
  removed"). Tabs used alongside spaces inconsistently.

### Error handling

- Global `window.onerror` and `window.addEventListener('error')` both `alert()`
  the message (unless the `easyMartina` escape flag is set during a fatal init).
- Errors are commonly **thrown as strings** (`throw 'Invalid boardId in ...'`),
  not `Error` objects, and are caught only where convenient. No structured
  error taxonomy, no logging.

### Type safety

- **None.** Dynamic JS, no types, no interfaces, no linting. Parameters are
  positionally documented by name only.

### Observability

- **None.** No logging, no telemetry, no structured output. The only "signal"
  is the on-error alert box. (Consistent with the retro single-file ethos.)

### Testing

- **None.** Not even a smoke test. `make verify` does JS syntax checking +
  build sanity only.

### API shapes

- No backend/API. Internal "contracts" are the persisted blob shapes
  (config + board revisions) and the DOM class/selector conventions. Casing is
  camelCase in JS and multi-word-dash in DOM classes (`add-note-first`,
  `window-focus`).

## Signals / Active Considerations

- **Generalization target (in flight):** `GENERALIZE_LATEST.md` plans to extract
  a reusable `MF.*` "Mac Fantasy App" `core/` (theme, menubar, window, sound)
  from the app-coupled pieces, keeping the script-tag + concat build. This
  doc vouches for that plan's four extraction targets:
  - **Font** — already standalone `01-fonts.css` + `--ff` var; promotes into a theme layer.
  - **Sound** — `<audio id="soundPopr">` hard-coded in `index.html` and fetched
    via `document.getElementById('soundPopr')` inside `Drag2.stopDragging()`
    in `05-drag.js` (the only hard-coded audio dependency in drag code).
  - **Menus** — markup hard-coded in `index.html`; CSS intermingled in
    `app.css` (header/menu/dropdown/swatch rules); click JS hard-coded to
    selectors in `07-app.js`.
  - **Window** — `.window`/`.window-title`/`.btn-close`/`.btn-maximize` CSS in
    `app.css`; buttons are **fake** (`pointer-events: none`, sprite via
    `::after`); no generic Window/WindowManager JS exists.
- **Debt hotspot — `07-app.js` (1072 lines):** Far over the 300-line cap. Holds
  SKB state, all menu/editing/layout event handlers, color logic, clock, PWA
  manifest, SW registration, and init. The generalization naturally splits
  this by moving menu→`MF.menubar`, window→`MF.Window`, sound→`MF.sound`.
- **`app.css` (1014 lines):** Interleaves desktop, menubar, window, board,
  list, note, and drag rules; must be segmented for core extraction.
- **Drag2 audio coupling (`05-drag.js`):** Contains a clone-an-`<audio>` +
  pause-previous pattern that belongs in a shared sound module; it also carries
  a static `Drag2.lastAudioClone` for clone cleanup.
- **Build pipeline constraint:** `build.py` regexes only `<link ... css/...>`
  and `<script src="js/...">` in `src/index.html`. Any core/app split must keep
  the concat-into-one-file model working (per-app index or build flag decision
  is open in the plan).
- **`VarAdjust` (`06-varadjust.js`) appears unused** by the current UI — a
  candidate for dead-code cleanup (Boy Scout) or promotion into core if a
  drag-to-adjust control is desired later.
- **`tools/split.py`** is a one-off that produced `src/` from the original
  single file; no ongoing role.

## Bridge to the plan

The four reusable pieces in `GENERALIZE_LATEST.md` map onto concrete,
app-coupled code here:

| Piece | App-coupled today | Extract to |
|-------|-------------------|------------|
| Font | `src/css/01-fonts.css` + `assets/font-*.woff2` | `core/theme/` |
| Sound | `#soundPopr` in `index.html` + `Drag2.stopDragging` in `05-drag.js` | `core/sound/` |
| Menus | `index.html` markup + `app.css` rules + `07-app.js` handlers | `core/menubar/` |
| Window | `.window*` CSS in `app.css` + board template in `index.html` | `core/window/` |

Namespacing decision (from the plan): keep script-tag order + namespaced
globals (`MF.*`), no ESM/bundler — consistent with the single-file constraint.
