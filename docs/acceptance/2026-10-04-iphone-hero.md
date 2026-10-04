# iPhone hero follow-up — 2026-10-04

## Scope

- Replace the hero's remote seek-driven CRT video with a locally composed CSS 3D iPhone head and a grayscale suit portrait.
- Remove the entire hero motion instruction/button strip.
- Pointer position controls yaw, pitch, small roll and eye gaze. Animation uses requestAnimationFrame, time-based 32 ms damping, and transforms only; pointer movement does not update React state.
- Stop work when the hero is outside the viewport or the document is hidden. Respect reduced-motion preference. Touch scrolling is left to the browser.
- Body asset generated for this character, encoded as transparent WebP, 308318 bytes. No remote video dependency remains.
- Mobile character is placed above the title and fades into the existing neutral background.

## Local acceptance

- `npm run build -- --webpack`: passed, including TypeScript and all 57 generated pages. Local webpack is required because this host lacks the native Next SWC package.
- `npx eslint components/home/RobotBackdrop.tsx components/home/Hero.tsx`: passed.
- Real browser mouse drag: pointer position changed from `0.805,0.194` to `0.178,-0.555`; yaw changed from approximately +11.12 degrees to -4.56 degrees, pitch from -2.72 to +7.77 degrees. Eye translation also changed. This verifies actual event delivery and real-time DOM transforms, not a video time-seek.
- Hero has zero buttons, no `.hint`, and no `<video>`.
- Mobile 390 x 844: no horizontal overflow (client width = scroll width = 384 including browser scrollbar), head bottom approximately 482 px, title top approximately 588 px, no head/title overlap.
- Mobile 320 x 740: no horizontal overflow (client width = scroll width = 314).
- Vertical scroll from hero reaches work; further scroll reaches timeline and contact. Project carousel advances without clicks and is not paused. Existing content of all five sections present in accessibility tree.
- Browser error/warning log: empty during local acceptance.
- Reduced-motion, visibility and intersection cleanup checked in source; OS media preference was not toggled during browser acceptance. No measured FPS claim.

## Evidence

- `/Users/lonky/.codex/visualizations/2026/10/04/01a10678-81ca-7e11-869f-608c8457aa8e/iphone-desktop-preview.png`
- `/Users/lonky/.codex/visualizations/2026/10/04/01a10678-81ca-7e11-869f-608c8457aa8e/iphone-mobile.png`

GitNexus index was stale. Requested reindex failed with `TypeError: bar.log is not a function`; its graph could not resolve the new RobotBackdrop. Direct source search confirmed the only caller is Hero. Scope is limited to the two hero components, scoped homepage CSS, and a new local image.
