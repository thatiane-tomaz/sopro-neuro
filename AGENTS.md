# AGENTS.md

- Content gating goes through `useContentAccess().ensureContentAccess({ source, sample })`; pass a stable sample id from `src/lib/freeSamples.ts` so free-sample claims (table `free_content_claims`, one row per user and kind) stay consistent across screens. Why: one place decides subscription vs free sample vs paywall.
- Pure business rules live in `src/lib/` and are tested with `bun test` under `tests/` (outside `src` so the app typecheck ignores `bun:test`). Why: no test framework is installed in the app.
- Neo Explica stories: one row per story in `neo_explica` (folder `pasta` in private bucket `neo-explica`, slides = image files sorted by name); per-user card state in `neo_explica_estado`, opens in `neo_explica_views`; rotation rule in `src/lib/neoExplica.ts`. Why: content team uploads images without code changes and the card choice stays testable.
- No offline service worker: `public/sw.js` is a kill-switch that clears old cached versions; home-screen install uses `public/manifest.webmanifest` only. Why: the old offline cache kept phones on stale versions after publishing.
