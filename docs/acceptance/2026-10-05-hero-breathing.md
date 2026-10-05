# Hero breathing trajectory

- Scope: add continuous idle motion to the approved folding camera head; preserve pointer following, layout and homepage content.
- Motion: continuous 6.2-second phase; horizontal drift +/-3 px, vertical drift 0 to -8 px, nod +/-0.9 deg and roll +/-1.1 deg. Pointer activity attenuates breathing to 35 percent, blending over 280 ms; existing 32 ms pointer damping remains. No phase restart on mouse move/stop.
- Performance: compositor transforms only, no React state per frame. Stop RAF while hidden, offscreen, or reduced-motion preference is enabled. Phase freezes during suspension to avoid resume jumps.
- Build: npm run build passed with TypeScript and all 57 generated pages. Targeted ESLint and git diff --check passed.
- Desktop browser: pointer remained 0.000,0.000 while head transform changed between samples. For example, translate3d(2.10455px,-6.85061px,0) -> translate3d(2.06586px,-6.90048px,0), with changed nod/roll. Native pointer input produced 0.757,-0.499 and gaze translate(6.05419px,-2.99419px).
- Offscreen browser: hero bottom -1440; head transform identical in two samples separated by 1.5 seconds, confirming RAF suspension. Returning to hero resumed motion.
- Mobile browser: 390 x 844; page content/scroll widths both 384 px. Animated head bottom 344.93 vs title top 523.52; full camera visible, no overlap or overflow.
- GitNexus context checked, local index refreshed; server graph remains tied to an old checkout, current source was inspected. Analyzer-only AGENTS/CLAUDE statistic changes restored.
