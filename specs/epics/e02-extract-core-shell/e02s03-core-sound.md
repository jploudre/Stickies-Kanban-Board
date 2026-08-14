# Story e02s03 — Extract sound module (MF.sound) and rewire Drag2

- **Epic:** e02 — Extract core shell
- **BCPs:** 4
- **Status:** todo
- **Delta:** MODIFIED (Drag2 drop calls `MF.sound.play('pop')`; no hard-coded audio id)

## Summary

The pop sound is hard-coded: `<audio id="soundPopr">` in `index.html` and
`document.getElementById('soundPopr')` + a clone-and-pause-previous pattern in
`Drag2.stopDragging()` (`05-drag.js`). Extract a `core/sound/sound.js` exposing
`MF.sound.register(name, url)` and `MF.sound.play(name)`, have the audio element
created by the module (not hand-placed in markup), and rewire the drop sound.

## Acceptance criteria (Gherkin)

```gherkin
Scenario: Sound is a reusable registry
  Given the sound module is loaded
  When the app registers the 'pop' sound
  Then MF.sound.play('pop') plays it, cloning and pausing any previous

Scenario: Drag2 uses the registry
  Given a note is dropped after a swap
  Then Drag2 calls MF.sound.play('pop'), with no document.getElementById('soundPopr')
  And no hard-coded <audio id="soundPopr"> remains in index.html

Scenario: Sound behaviour unchanged
  Given the wiring is refactored
  When a note is dropped
  Then the pop plays identically to before (UAT)
```

## Risks

- Audio autoplay policies / readiness checks (`readyState`) must be preserved so
  the sound still fires on drop without breaking on slow loads.

## Verification

```bash
node --check src/core/sound/sound.js && bash tools/run-tests.sh | grep -i sound
grep -L 'soundPopr' src/index.html && echo 'no hard-coded audio id'
grep -L "getElementById('soundPopr')" src/js/05-drag.js && echo cleaner
# manual UAT: drag a note, hear pop
```
