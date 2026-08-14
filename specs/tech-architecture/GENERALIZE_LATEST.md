# Generalizing Stickies Kanban Board into shared "Mac Fantasy App" components

Status: **planning only** — no code changes made yet.

Goal: use this app as the seed for other Mac Fantasy Apps by extracting the
**font**, **sound**, **menus** (css/js/html), and **window** (html/css/js) into
reusable pieces.

---

## What you have (and a crucial existing constraint)

- The app is developed as split files in `src/` but **shipped as ONE
  self-contained `index.html`** via `build.py`, which concatenates CSS/JS in
  `<link>`/`<script>` order and inlines all assets to `data:` URIs.
- This matters a lot for generalization: anything we extract as "shared" must
  still be composable through this same no-bundler, script-tag pipeline, and
  ideally stay inlinable into a single file.

### The current state of the four things we want to reuse

| Piece | Where it lives today | Reusable? | App-coupled? |
|---|---|---|---|
| **Font** | `css/01-fonts.css` + `assets/font-*.woff2` | Already standalone + uses `--ff` var | Low — just needs promoting to a theme layer |
| **Sound** | `<audio id="soundPopr">` in `index.html`; **hard-coded** `document.getElementById('soundPopr')` in `js/05-drag.js` | Not yet — hard-coded ID + logic | High — logic lives in Drag2 |
| **Menus** | Menu **HTML hard-coded** in `index.html`; menu **CSS** in `app.css`; click **JS hard-coded** to selectors (`.add-note-first`, `.del-board`, `.undo-board`…) in `07-app.js` | Not yet — markup+behavior tied to Stickies | Very high |
| **Window** | Board window chrome in the `#templates` board template + CSS in `app.css`; **no JS at all** (buttons are fake via CSS `::after`/`pointer-events:none`) | Not yet — no generic Window component | High |

All four are entangled with Stickies-specific code. The Cash library
(`01-lib.js`) is already perfectly generic and needs no change.

---

## Target architecture: a shared "Mac Fantasy" core + apps

```
src/
  core/                     <- REUSABLE shell (any Mac Fantasy app)
    lib.js                  <- Cash (moved, unchanged)
    util.js
    theme/
      fonts.css             <- @font-face + --ff tokens
      tokens.css            <- shared design tokens (colors/sizes) as CSS vars
      desktop.css           <- desktop bg, base reset, body
      assets/               <- font, bg, window-stripe, btn-*, icon, sounds
    menubar/
      menubar.js            <- renders menubar from a config object
      menubar.css
    window/
      window.js             <- generic Window + WindowManager
      window.css
    sound/
      sound.js              <- registry: sound.play('pop')
    shell.js                <- MF namespace, app registration API
  apps/
    stickies/
      index.html            <- composes: core + this app
      model.js  app.js  app.css
      sw.js
```

The single-file pipeline can stay: each app's `app/index.html` `<link>`s /
`<script>`s the shared core files by path, and `build.py` concatenates them the
same way. Optionally add a flag to `build.py` to pick which app to build
(default: stickies), or keep per-app build scripts. Either works without a
bundler.

---

## How to componentize each piece

### 1. Font
- Already essentially done: promote `01-fonts.css` + font assets into
  `core/theme/`.
- Formalize a small set of `tokens.css` variables (`--ff`, plus shared
  sizes/spacing) so every app inherits the same scale. Overridable per-app via
  its own scope.

### 2. Sound
- Add `core/sound/sound.js` exposing a registry: `MF.sound.register('pop', url)`
  and `MF.sound.play('pop')`.
- The `<audio>` element previously hand-placed in `index.html` gets created by
  the module (or registered from an app config), not hard-coded in markup.
- Rewire `Drag2`'s drop-popper (`05-drag.js`) to call `MF.sound.play('pop')`
  instead of `document.getElementById('soundPopr')`. This removes the only
  hard-coded audio dependency from drag code. (Also worth extracting the
  "clone-an-`<audio>`-and-pause-previous" pattern into the sound module so it's
  shared, not repeated per app.)

### 3. Menus (biggest win)
- **Menubar becomes data.** Define a declarative menu config, e.g. each app
  provides:
  ```
  MF.app({ title, clock:true,
    menus: [
      { label:'File', items:[
          { label:'New Note on First List', action:'add-note-first' },
          { divider:true },
          { label:'Reset Board…', action:'delete-board', warn:true } ]},
      { label:'Edit', items:[ {label:'Undo', action:'undo'}, … ]},
      { label:'Color', color: [6 colors], items:[ … ] },  // special color-menu type
    ],
    right:[ … ] })
  ```
- **`menubar.js`** renders `<header>` + dropdowns from that config and owns the
  CSS classes (`has-dropdown`, `dropdown`, `menu-divider`, `disabled`, `active`,
  `menu-flashing`).
- **`menubar.css`** = the generic `.menu` / `.dropdown` rules currently in
  `app.css`.
- **Behavior routing** — replace the hard-coded `$('header').on('click',
  '.undo-board', …)` selectors with a command registry:
  `MF.menubar.on('action', name => …)` and apps subscribe by action name.
  `warn`, `disabled`, and checkmark marking move into the component.

### 4. Window
- Add `core/window/window.js` with a generic `Window` class:
  `new MF.Window({ title, content, width, height, position, onClose })`.
- It owns the strip-pattern titlebar, centered title, and the close/maximize
  buttons.
- Add a `WindowManager` to place windows on the desktop, handle z-index/focus,
  and (new) provide **real drag-to-move and resize** — currently absent because
  only one static window existed. Since the retro look currently uses fake CSS
  buttons, decide whether to make buttons functional (likely: yes for
  generality, keep them looking the same).
- **`window.css`** = the `.window-window-focus`, `.window-title`, stripe, and
  button rules.
- Stickies becomes just another `MF.Window` whose content is the board. This is
  the biggest generalization because the board currently *is* the window.

---

## Migration phases (each leaving the app working)

**Phase 0 — Boundary audit** (this plan): confirm what moves where. No code.

**Phase 1 — Extract the shell, identical behavior.** Move font + assets into
`core/theme/`; build `core/menubar/`, `core/window/`, `core/sound/`; rewire
`Drag2` → `MF.sound.play('pop')` and the menu handlers → command registry. Keep
the menubar markup/config *visually identical*. Rebuild `index.html` and verify
byte-identical rendering/screenshot. This validates the shell without changing
the app.

**Phase 2 — Refactor Stickies to consume the shell.** Its `index.html` shrinks
to "load core + app files"; menubar markup in `src/index.html` is replaced by a
config object in `07-app.js`; board moves into a `MF.Window`. This is the
proof-of-concept that the shell is actually generic.

**Phase 3 — Add a second app** (e.g., a minimal Notepad or Calculator) using
only `core/`. Anything the second app needs to duplicate → promote into core.
This is the real generalization test.

**Phase 4 (optional) — Desktop/icon layer.** Application icons on the desktop,
double-click to open app windows, per-app `MF.register` metadata (name, icon,
default window size).

---

## Key decisions to make before starting

1. **Namespace/module style.** Today everything is globals (`Board`, `List`,
   `Note`, `addNote`, `saveBoard`, `SKB`). Generic code should live under one
   namespace (e.g., `MF.*`). Should we also move to ES modules, or keep the
   script-tag + concat model? Given the single-file constraint and retro
   simplicity, lean **keep script-tag order + namespaced globals**, not a
   bundler/ESM.
2. **Menu config schema** — how much of the current Color menu's special
   behaviors (swatches, active checkmark, disable-when-no-selection) become
   generic component features vs. app-specific. Generalize swatches +
   checkmarks + enable/disable; the *items* stay app data.
3. **Window buttons** — make close/maximize functional now, or keep them
   decorative to preserve the exact retro look first and add behavior in a later
   phase?
4. **Repo layout** — keep the single-repo `core/` + `apps/` split, vs.
   extracting `core/` into its own repo/package (since it'll be shared across
   future "Fantasy Mac Apps"). Single-repo first is lower friction; split later
   if you create more apps.
5. **Build** — extend `build.py` with an `--app` flag vs. a small per-app build
   config. Low effort either way.
