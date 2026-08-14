# Stickies Kanban Board — Claude Code

Read CONVENTIONS.md before any GitHub or git operation.

<!-- BEGIN bigpowers:project -->
## Project
A "fantasy retro Mac" kanban board (System 7 / Mac OS 8 mashup) shipped as one
self-contained `index.html`. Being generalized into reusable "Mac Fantasy App"
components (theme, menubar, window, sound) under a shared `MF.*` core + app shell.

Stack: HTML / CSS / vanilla JS (namespaced globals, script-tag concat) / Python 3 build script

## Commands
| Action | Command |
|--------|---------|
| Run (dev) | `make dev` (serves `src/` at http://localhost:8000) |
| Build | `make` or `python3 build.py` |
| Verify | `make verify` (node `--check` each JS + test build) |
| Test | none yet — TDD infra to be added |
| Lint | none yet |
| Preflight | `make verify` (full-green gate today) |
| CI | n/a (no remote CI configured) |

## Architecture
`src/` holds split source files — CSS layers (`01-fonts`…`06-dragster`) and JS
(`01-lib` Cash, `02-util`, `03-state`, `04-model`, `05-drag`, `06-varadjust`,
`07-app`) — under a global `SKB`/`Board`/`List`/`Note` namespace. `build.py`
concatenates CSS/JS in `<link>`/`<script>` order and inlines all assets to
`data:` URIs, producing the single-file `index.html` deliverable. Target: a
reusable `MF.*` "Mac Fantasy" `core/` (theme, menubar, window, sound) with
`apps/stickies` consuming it — see `specs/tech-architecture/GENERALIZE_LATEST.md`.

## Conventions
- Development edits split files under `src/`; the shipped artifact is always the
  single-file `index.html` produced by `build.py`. Never break this pipeline.
- Preserve the retro pixel aesthetic and identical rendering of the existing app.
- Shared/core code lives under the `MF.*` namespace.
- All planning output goes to `specs/` before code.

## Never
- Never introduce a bundler, ES module build step, or git submodules.
- Never break the single-file `index.html` deliverable.
- Never change the existing app's visual/retro rendering during refactor.
- Never dismiss reproducible gate failures as pre-existing or out of scope.
- Never proceed on a red Preflight — invoke quick-fix or fix-bug first.

## Agent Rules
- **Workflow Mandate:** You MUST use the bigpowers skills (e.g. `plan-work`, `develop-tdd`, `orchestrate-project`) to perform tasks. DO NOT write code directly in response to a user prompt like "build this feature".
- **Always Green:** Preflight must be green before forward work. Reproducible gate failures require **fix-or-log** (quick-fix → fix-bug) per CONVENTIONS § Discovered Defects.
- Read `specs/` before writing code.
- All planning and specifications MUST be written to `specs/` (`product/SCOPE_LATEST.yaml`, `release-plan.yaml`, `epics/`) before any code is generated.
- Write the minimum code that solves the stated problem. Nothing extra.
- Run tests/verify after every change. Show evidence before declaring done.
- One clarifying question beats a wrong assumption baked into 200 lines.
<!-- END bigpowers:project -->

<!-- BEGIN bigpowers:context-routing -->
| Glob | Routing |
|------|---------|
| (none) | Single-project workspace; no sub-AGENTS.md routing. |
<!-- END bigpowers:context-routing -->

<!-- BEGIN bigpowers:learned-preferences -->
## Learned User Preferences
- (none recorded yet)

## Workspace Facts
- (none recorded yet)
<!-- END bigpowers:learned-preferences -->
