---
name: Expo web hydration
description: Why the Replit web preview uses single-page output instead of Expo Router static rendering.
---

For this app's Replit web preview, keep Expo web output set to `single`. Expo Router's static export emitted an empty Suspense boundary in the page HTML; React then reported error #419 and switched to client rendering.

**Why:** Static rendering did not finish the route's Suspense boundary, so the browser received an incomplete shell and logged an execution error even though it later showed the app.

**How to apply:** The Express server serves the exported SPA shell for unmatched routes, so deep links such as `/chat` continue to resolve client-side. Revisit static output only if its server-rendered boundary is repaired and verified; note that `single` output is not statically indexable by search engines.