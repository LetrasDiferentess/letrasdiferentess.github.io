# Publishing a new Fancy Text locale

This policy applies to every locale of the main Fancy Text generator, currently `/` (pt-BR), `/us/` (en-US) and `/mx/` (es-MX).

## Mandatory publication checklist — one release, not separate follow-ups

1. Implement and verify the new canonical money tool at `/<locale>/` (or an approved final slug). It must use the existing functional generator, with actual localized UI, metadata, font priorities, and `html lang`. Do not create a locale link until its target page exists.
2. Add the **real published edition** to `data/tool-locales.json` with its exact `lang`, `path` and reader-visible `label`.
3. Update the **language chooser directly below the generator** (`.ld-locale-list`) in **EVERY existing money page**, including the newly created one. Keep all editions in registry order; set `aria-current="page"` on precisely the current edition. Make sure each page still links to `/us/library/`.
4. Update the **Research Library header** (`/us/library/` > **Text tools** > `.tool-languages`), including the new real destination, correct `lang`, reader-facing language name and the searchable `data-locale` hint. Menu search/scroll must continue working as the list approaches 17+ locales.
5. Update **reciprocal hreflang** on all money pages, with every published language and the same valid `x-default`, and keep each page's self-canonical. Add the newly published money page to `sitemap.xml` exactly once.
6. Run `node --test scripts/test-tool-locales.mjs` and the existing locale navigation, SEO, mobile/responsive and Unicode-library URL-lock checks in GitHub Actions. Correct every failure in the PR, **before merging**.
7. Merge, let GitHub Pages deploy, then **verify on Production** that the new language is listed at BOTH of the exact positions shown above, for EVERY current money page, and that all destinations respond with a working page. Verify these with a fresh retrieval, not solely the repository files or a cached browser tab.

## Design invariants

- The locale navigation must be useful to real visitors, not a list of editorial workflow statistics.
- The new local page must not alter the logic of already working tool editions or the 96 locked Unicode research articles.
- Never fabricate unpublished URLs or hrefs.
- Keep the library hub's 12 research categories and all 96 article links intact.
- For 17+ locales, compact/mobile-friendly wrapping, internal scrolling or search is required rather than unbounded rows that bury the tool or guide.
- If a locale is later withdrawn, remove it from the manifest and all other surfaces together, while handling its canonical URL and redirects intentionally.

**Automated gate:** `scripts/test-tool-locales.mjs` reads the locale manifest, discovers actual WebApplication money pages, and verifies that every money page, the library menu, reciprocal hreflang and sitemap agree. Its workflow is `.github/workflows/tool-locales.yml`. This is the repository's operational source of truth, not assistant memory.
