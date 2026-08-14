# Conventions

Shared rules for all AI agents working in the **Stickies Kanban Board** project.
When this file conflicts with bigpowers doctrine, the bigpowers doctrine governs.

## Conventional Commits & Semantic Versioning

All changes to this repository MUST follow the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification.

### Commit Message Format
`<type>(<scope>): <description>` (space after colon is MANDATORY)

### Types
- `feat`: New feature
- `fix`: Bug fix
- `perf`: Performance improvement
- `docs`, `chore`, `style`, `refactor`, `test`: No version bump
- `BREAKING CHANGE:` (or `!` after type): Major bump

## Git & Git Operations

- No direct work on `main`/`master`. Every task MUST start with a feature branch or worktree via `kickoff-branch`.
- **Integrate mode:** `solo-git` (set in `specs/state.yaml`). Ship with
  `bash scripts/land-branch.sh <branch> "<conventional message>"` after
  `release-branch` gates — local squash to `main`, then push. PR is optional.
- Never push directly to `main`/`master` except via `land-branch.sh`.
- **Git Attribution:** NEVER include `Co-authored-by` or any footer that
  attributes code to an AI agent. All commits appear as authored solely by the human user.
- Never call the GitHub REST API directly.
- Never create GitHub issues from automated workflows — write local `.md` files in `specs/`.

## Agent Workflow Mandates

**AGENTS MUST NEVER BYPASS THE BIGPOWERS WORKFLOW.**
- **No Direct Coding:** When a user says "build feature X", you MUST NOT write code directly.
- **Required Skills:** Route work through the appropriate bigpowers skills:
  `survey-context` (context), `plan-work` (tasks with `verify:`), `develop-tdd`
  or `execute-plan` (implement), `investigate-bug` (bugs).
- **Verification Mandate:** Every story implementation MUST end with a manual
  verification script presented to the user; wait for user confirmation (UAT)
  before declaring done.
- **Traceability Mandate:** Every story MUST have at least one `story: eNNsNN`
  tag in its implementing code or test file.

## Always Green / Shift Left

**Always Green** means Preflight is green before any forward work — not "green
enough for this task."

**Shift Left (1-10-100):** Defects cost roughly 1× to fix in development, 10× in
integration, 100× in production. Fixing a red gate now is cheaper than shipping
and debugging later.

**Preflight** — the project's full local verification stack (chained from test,
lint, and build commands recorded in CLAUDE.md). Preflight MUST pass before
kickoff, develop, or verify phases advance.

This project's Preflight today: `make verify` (node `--check` each JS file +
test build). Add real TDD tests to Preflight as they are introduced.

## Discovered Defects

Any **reproducible gate failure** encountered during unrelated work is a
discovered defect — not optional background noise.

**fix-or-log ladder (mandatory):**

1. **quick-fix** — trivial, data-only, or single-file fixes within guardrails.
2. **fix-bug** — when quick-fix guardrails abort, or the failure needs investigation (`specs/bugs/BUG-*.md` + TDD).
3. **Log** — only when reproduction is blocked after good-faith attempt; write a BUG spec and stop forward work until triaged.

Discovered fixes ship in the **same PR** but in **separate commits** (Conventional Commits).
Never narrate a failure and continue.

**Hard block:** Red Preflight blocks kickoff-branch, develop-tdd, and verify-work
forward progress until fix-or-log produces green.

### Banned dismissive phrases

Agents MUST NOT use these phrases (or close paraphrases) to ignore reproducible failures:

| Banned phrase | Required behavior instead |
|---------------|---------------------------|
| Pre-existing / pre-existing issues | Run fix-or-log; if truly unrelated, prove with a passing repro after revert |
| unrelated to this session | Same — session boundaries do not waive green gates |
| not introduced by my changes | Bisect or fix anyway; solo-default owns the whole tree |
| out of scope (ignoring a red gate) | Invoke quick-fix or fix-bug; scope-minimization never overrides Always Green |

## specs/ — All Planning Output Goes Here

Every skill that produces written output writes to `specs/` at the project root.

| Layer | File | Answers |
|-------|------|---------|
| Session | `specs/state.yaml` | Active flow, epic/bug, git, `handoff.next_skill`, workflow mode |
| Release index | `specs/release-plan.yaml` | Target version, WSJF epic list, BCP baseline per story |
| Progress | `specs/execution-status.yaml` | Flat status keys (`e01`, `e01s01`) — sole SoT for story state |
| Cycle-time ledger | `specs/metrics/cycle-times.yaml` | Per-story: BCPs, start, end, cycle minutes |
| Intention | `specs/product/*.yaml` | VISION, SCOPE, GLOSSARY |
| Epic implementation | `specs/epics/eNN-*.yaml` / `stories/` | Stories + runnable tasks with `verify:` |
| Architecture | `specs/tech-architecture/` | TECH_STACK, plans, GENERALIZE_LATEST, ADRs |

Validate YAML layout with `bash scripts/validate-specs-yaml.sh` (when present in the bigpowers install).

### next_skill signaling mandate

Critical-path skills MUST write `handoff.next_skill` to `specs/state.yaml` as
their last action. Agents MUST read `state.yaml` and follow it before asking
"what comes next?".

## Code Style

- Functions: 4–20 lines. Split if longer.
- Files: under 300 lines. Split by responsibility.
- One thing per function, one responsibility per module (SRP).
- Names: specific and unique. Avoid `data`, `handler`, `Manager`, `Service`.
- No code duplication. Extract shared logic.
- Early returns over nested ifs. Max 2 levels of indentation.
- No magic strings or numbers: extract to named constants.
- Remove dead code. Never comment it out.
- Boy Scout Rule: leave every file you touch at least as clean as you found it.
- Names describe side-effects: `saveBoard`, not `process`.
- Exception messages include the offending value and an actionable hint.

## Comments

- Keep your own comments. Never strip them on refactor.
- Write WHY, not WHAT.
- No obvious comments that restate the code.
- No commented-out code — delete it; use git history to recover.
- Complex logic includes a "Provenance" link (issue, commit SHA, or ADR).

## Tests (F.I.R.S.T)

- Tests run headless with a single command (recorded in CLAUDE.md).
- Every new function gets a test. Every bug fix gets a regression test.
- Tests are **F**ast, **I**ndependent, **R**epeatable, **S**elf-Validating, **T**imely.
- Test through public interfaces only (T8): assert on observable outcomes.
- Test boundary conditions (T5): empty input, maximum, minimum, off-by-one.
- Never skip or @ignore a test without an explicit ambiguity note (T4).
- Every change must be verifiable with a single runnable command before done.

## Dependencies

- Inject dependencies through constructor/parameter, not global/import.
- Wrap third-party libs behind a thin project-owned interface.
- No bundler / ES modules / git submodules for this project. Preserve the
  script-tag + concat single-file model.

## Structure

- Split source files under `src/` (CSS: `01-fonts`…`06-dragster`; JS:
  `01-lib`…`07-app`), assembled by `build.py` into the single-file `index.html`.
- Target layout (see `specs/tech-architecture/GENERALIZE_LATEST.md`):
  `src/core/` (reusable `MF.*` shell) + `src/apps/stickies/` (this app).
- The Cash library (`01-lib.js`) is generic. Keep it app-agnostic.

## Formatting

- Use the language default formatter where available (prettier, black).
- Keep style debates out of PRs.

## Defensive Code

The agent implements defensive code only for categories explicitly listed here.
**None apply to this project today** (pure client-side, no external services).
If app code later talks to a network/service, add the relevant category here
(Retry / Timeout / Graceful degradation).
