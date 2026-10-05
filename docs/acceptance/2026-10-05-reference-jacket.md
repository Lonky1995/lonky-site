# Reference jacket replacement — 2026-10-05

## Scope

Reference: user attachment `codex-clipboard-6e99e3cf-913f-41e2-8753-f515389e6510.png`.
Replace the narrow tailored/open-collar torso with the screenshot's roomy light-grey outer jacket, wide lapels and white shirt buttoned to the top. Preserve the light iPhone head, identity tags, pointer engine and below-the-fold content. Shift desktop torso slightly down to expose the collar; keep mobile positioning.

Final asset: `public/images/iphone-jacket.webp`, transparent WebP, 158648 bytes. The clothing was reconstructed from the reference using the built-in image_gen tool, not taken as an unchanged pixel crop. No CLI image generation used.

## Final image prompt

Use the attached screenshot as the exact CLOTHING REFERENCE. Extract and reconstruct ONLY its headless torso as a transparent website character asset. The user wants THIS loose relaxed retro outer jacket and THIS white shirt, NOT a modern tailored business suit. Preserve reference's wide soft shoulders, roomy boxy casual shape, broad rounded notched lapels, single relaxed outer jacket layer, no waist suppression, no shiny tailoring, no pocket square. Most important: white shirt fully BUTTONED TO THE VERY TOP, both collar points flat and closed around the neck, visible center row of small white buttons. No open neckline, no V shape, no exposed chest. Replace any visible skin with a short smooth light-grey neutral neck placeholder. Remove the CRT computer head entirely; no head, face, phone, monitor or screen in output. No screenshot border, no black bars, no background, no text. The resulting front-facing headless torso silhouette is centered, portrait canvas, broad shoulders and arms cropped around lower torso. Neck at top center with minimal empty space, shoulders extend to near both canvas edges. Match the screenshot's LIGHT SILVER GREY jacket and milky white shirt, gentle soft lighting, matte softly illustrated shading with very subdued felt texture, no highly detailed photorealistic weave, no pores, no dark charcoal, no dramatic shadows. Style faithful to the screenshot's approachable loose vintage outfit and soft high-key monochrome look. Output high quality clean transparent cutout with no surrounding background or UI. Same reference outfit, not a new invented formal suit.

## Verification

GitNexus context checked; reindex attempted and failed with the existing `bar.log is not a function` error. Direct source inspection used. Only scoped hero CSS, a new local asset, and release manifest are affected.

Local build (`npm run build`) passed including TypeScript and 57 generated pages. Browser visual check confirmed the screenshot-style lapels and closed collar are visible below the phone. Pointer input produced `0.789,0.138`. Mobile 390 x 844 has no horizontal overflow (client/scroll width 384px); phone bottom about 482px is above title top about 588px. Vertical scroll reaches work. Browser error log empty. No interaction code changes.
