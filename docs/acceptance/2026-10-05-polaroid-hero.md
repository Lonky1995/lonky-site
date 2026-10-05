# Approved folding instant-camera hero

- Scope: replace iPhone head with the approved cream/silver folding instant camera. Preserve grey reference jacket, homepage content and compact hero height.
- Asset: `public/images/polaroid-head.webp` (1200 x 800 transparent WebP, about 68 KiB). Generated with built-in imagegen from the approved design; lens is empty for live HTML gaze overlay. Prompt: recreate only the approved folding camera, transparent background, remove body/UI and painted face, preserve angle/material/model and pale lower film seam.
- Motion: direct pointer-driven requestAnimationFrame damping (32 ms), camera yaw/pitch/roll and separate lens gaze; occasional CSS blink. Reduced motion and hidden/offscreen stop handling retained. No video seek or per-frame React state.
- Build: npm run build passed TypeScript and all 57 generated pages. Targeted ESLint and git diff --check passed.
- Desktop browser: 1274 x 718, camera joins collar cleanly. Pointer right input 0.758,-0.444 -> yaw 10.6082 deg; opposite input -0.683,-0.528 -> gaze -5.46591px,-3.1657px. No old phone DOM remains.
- Mobile browser: 390 x 844, actual content width and scroll width both 384 px; head stage bottom 345.33, title top 523.52. Full camera silhouette, title and three identity tags visible. Portrait moved 30 px left to keep folded side within the screen.
- Medium browser: 900 x 800, no content overflow, camera stays beside text.
- Regression: scroll-to-work link reaches #work; manual LonkyClaw selection works, automatic carousel subsequently changes selection; Crypto and about render after page scrolling. All five homepage sections remain present.
- GitNexus context checked and local analyze completed. MCP server context still describes an old checkout; source inspection used for current component. Analyzer-only AGENTS/CLAUDE stats edits restored.
