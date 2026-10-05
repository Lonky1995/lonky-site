# Hero top whitespace — 2026-10-05

User requested less whitespace above the hero content. Added a shared hero height `min(100svh, 780px)` and used it for the intro copy's minimum height. Taller screens now show the next section sooner instead of moving the phone/title down as the window height grows. Character, typography and pointer engine untouched.

- `npm run build`: passed including TypeScript and 57 generated pages; `git diff --check`: passed.
- Browser 1498 x 944: hero 780px, intro top 284px, phone top 176px, work starts 780px. The title and phone are visibly higher than the previous full-viewport hero.
- Browser 390 x 844: hero 780px, phone top 103px/bottom 418px, title top 524px. No overlap or horizontal overflow (client/scroll width 384px).
- Browser 1274 x 718: hero remains 718px, phone top 115px, so ordinary desktop height keeps its existing proportions.
- Pointer delivery remains active: `0.766,0.142` observed after real browser input.
- GitNexus context checked and analysis run completed. Analyzer-generated documentation statistics were restored to avoid unrelated release changes. Only scoped homepage CSS changes are included.
