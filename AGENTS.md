# Repository guardrails: Unicode research library

Before editing or adding a Unicode research article under /us/, read:
- data/unicode-library-96.lock.json
- docs/UNICODE_LIBRARY_LINK_POLICY.md

NON-NEGOTIABLE OWNER INSTRUCTIONS:

1. The 96 canonical article URLs and 12 category associations are LOCKED. Never infer, invent, rename or add an article URL. Any canonical change requires explicit approval by the website owner.
2. Cross-links to other research articles are allowed only if the target URL is in the locked registry AND marked PUBLISHED, with a corresponding published HTML file. PLANNED URLs must not be clickable links.
3. Approved other internal links are /us/ (money tool), /us/library/ (library hub), including anchors under the hub. All internal links must have clean URLs WITHOUT query strings or GPT/ChatGPT tracking parameters.
4. All external website links from research articles must have rel="nofollow". For target="_blank", use rel="nofollow noopener noreferrer". Remove all UTM, GPT, ChatGPT and other tracking parameters before linking.
5. Publishing an article requires adding its index.html at the exact registered path, marking it PUBLISHED and linking it from its proper category on the library hub in the same change.
6. Do not alter the Brazil homepage or US money tool when preparing technical library content unless separately requested.
7. OWNER UPDATE (2026-10-25, Batch 2): When a research article is genuinely relevant to the existing US Fancy Text tool, naturally include a useful contextual internal link to the exact canonical /us/ URL. Do not force this link into unrelated topics; never keyword-stuff, insert tracking, or add nofollow to the internal link. Keep articles independently useful and substantive. This grants permission to LINK to the tool, not to modify its code or homepage.


Run these checks before merging any research content:
- node scripts/check-unicode-library-links.mjs
- node --test scripts/test-unicode-library-links.mjs

The canonical registry, NOT ChatGPT memory, is the source of truth.

## MANDATORY: Every newly published Fancy Text locale

When adding or removing a money tool language, READ `docs/TOOL_LOCALE_PUBLISH_POLICY.md` and update in the SAME PR:
- `data/tool-locales.json`, the source-of-truth list of published editions.
- The language selector BELOW THE TOOL (`.ld-locale-list`) on **EVERY** money page, including the new local.
- The Research Library header **Text tools** dropdown (`/us/library/`, `.tool-languages`).
- Reciprocal hreflang across all money pages and `sitemap.xml`.
- CI and live smoke validation that all menu targets exist and appear on mobile and desktop.
Never merge a local tool if any of the two reader-visible menus omits it. Run `node --test scripts/test-tool-locales.mjs`. Do not modify the locked 96 research articles while doing this.
