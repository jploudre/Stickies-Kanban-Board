# Story e05s02 — Promote duplicated code back into core

- **Epic:** e05 — Second app proof
- **BCPs:** 3
- **Status:** todo
- **Delta:** MODIFIED (any duplicate the second app needed is promoted into core)

## Summary

Whatever the second app had to duplicate (e05s01 task 4 / `core-gaps.md`) is a
sign the core is not yet generic. This story promotes each gap into core so
future apps never repeat the duplication, then removes the duplicate from the
second app so it consumes the promoted component. Genuinely app-specific gaps
are documented in an ADR.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Generic gaps are promoted
  Given a gap in core-gaps.md is generic (not app-specific)
  When I move it into src/core/ and update consumers
  Then both Stickies and the second app build and pass without duplication

Scenario: App-specific gaps are documented
  Given a gap is genuinely app-specific
  Then an ADR records why it stays out of core

Scenario: Everything still green
  Given the promotions are done
  When I build both apps and run the harness
  Then Preflight is green
```

## Risks

- Over-promoting app-specific logic back into core would pollute the generic
  shell — the ADR documentation step guards against silent over-generalization.

## Verification

```bash
bash tools/run-tests.sh 2>&1 | grep -i pass
python3 build.py --app stickies && python3 build.py --app <second> && make verify | grep -i 'build OK'
grep -q 'app-specific' specs/tech-architecture/adr/ADR-*.md && echo adr
```
