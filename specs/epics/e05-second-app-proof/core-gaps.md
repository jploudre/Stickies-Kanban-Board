# Core gaps discovered by the second-app proof (e05s01 task 4 / e05s02)

Record anything the second "Mac Fantasy App" had to duplicate or re-invent
instead of reusing from core. Each entry is a promotion candidate for e05s02.

## Format

- **Component:** <what was duplicated>
- **Where:** <file in the second app>
- **Why generic:** <why it belongs in core>
- **Status:** open | promoted | adr-appspecific

## Gaps

- **Component:** Countdown time formatting (mm:ss)
- **Where:** test/smoke.test.js (and needed by apps/pomodoro)
- **Why generic:** Any countdown/clock app needs it; it was already duplicated
  in the smoke test before the Pomodoro existed.
- **Status:** promoted — `MF.formatClock` in `src/core/util.js` (node-safe);
  smoke test and the Pomodoro app both consume it from core.

- **Component:** Retro desktop background (bg-desktop.gif + body rule)
- **Where:** apps/stickies/app.css
- **Why generic:** Every Mac Fantasy app wants the same retro desktop instead of
  duplicating the rule and asset.
- **Status:** promoted — `src/core/theme/desktop.css` + asset in
  `src/core/theme/assets/`; both apps link it from their shells.

- **Component:** Shared retro pop/chime sound asset
- **Where:** apps/stickies/assets/sound-pop.wav
- **Why generic:** Stickies uses it as the drop pop; Pomodoro uses it as the
  session-end chime — one shared retro sound for the whole family.
- **Status:** promoted — asset in `src/core/sound/assets/sound-pop.wav`;
  Stickies registers `pop` and Pomodoro registers `chime`, both from core.

- **Component:** App favicon (favicon-16/32.png)
- **Where:** apps/stickies/index.html
- **Why generic:** It is app identity, not shared chrome.
- **Status:** adr-appspecific — stays app-side by design (per-app identity;
  documented rather than promoted).
