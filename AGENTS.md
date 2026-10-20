# AGENTS.md

- Content gating goes through `useContentAccess().ensureContentAccess({ source, sample })`; pass a stable sample id from `src/lib/freeSamples.ts` so free-sample claims (table `free_content_claims`, one row per user and kind) stay consistent across screens. Why: one place decides subscription vs free sample vs paywall.
- Pure business rules live in `src/lib/` and are tested with `bun test` under `tests/` (outside `src` so the app typecheck ignores `bun:test`). Why: no test framework is installed in the app.
