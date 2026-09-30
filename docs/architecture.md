# Architecture

## Phase 0 shape

```text
Browser
  ├─ Astro static pages (/, /@demo, /record/demo, /submit)
  ├─ React Islands (search and local-only submission-flow preview)
  └─ Cloudflare Pages Functions (baseline response headers only)
       ├─ D1 binding: DB (template; no database created)
       └─ R2 binding: RECORD_IMAGES (template; no bucket created)
```

Astro renders the public mock routes at build time. React is limited to interactive UI. The form preview does not upload files, create accounts or persist submissions. Public pages and mock records contain no real user-submitted content. A static `404.html` prevents Pages from treating unknown paths as an SPA fallback to the homepage.

## Cloudflare compatibility decision

The current [Astro Cloudflare adapter guide](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) states that the adapter no longer supports Cloudflare Pages and recommends Workers. Cloudflare's [Pages Astro deployment guide](https://developers.cloudflare.com/pages/framework-guides/deploy-an-astro-site/) still describes adapter-based Pages SSR. To honor the project's Pages Functions requirement without depending on that conflicting/removed adapter path, this bootstrap uses Astro's static output and standalone Pages Functions in `functions/`, configured through [`wrangler.jsonc`](../wrangler.jsonc).

Cloudflare Pages continues to support static build output and Pages Functions; its [Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/) accepts `pages_build_output_dir`, D1 bindings and R2 bindings. Runtime/dynamic rendering is deferred to Pages Functions rather than Astro SSR. The current `/@demo` and `/record/demo` routes are prerendered examples; Phase 1 must define how arbitrary public profiles/records are served at request time.

Astro uses `build.format: 'file'` with `trailingSlash: 'never'` so Cloudflare Pages' [clean URL behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/) maps built `.html` files to the requested extensionless paths (`/@demo`, `/record/demo`, `/submit`). Canonical URLs are normalized to those public paths rather than generated `.html` filenames.

## Data flow planned for Phase 1

1. Anonymous requests read only `published` records and public person fields through Pages Functions and parameterized D1 queries.
2. Write requests require a verified Google OAuth session; account email stays private. OAuth state and cookie protections are mandatory.
3. Upload requests authenticate before accepting bytes. The server limits attachment count/size, verifies signatures against allowed JPEG/PNG/WebP MIME types, calculates SHA-256 and dimensions, creates a server-generated key under `records/<yyyy>/<mm>/<record_uuid>/<attachment_uuid>.<ext>`, and stores the untouched original in R2.
4. D1 stores public record metadata and the original object's key/hash. Future thumbnails use separate keys and never replace the original.
5. Moderation changes `records.status` to `hidden`; it does not declare content true or false.

No X API, automatic X scraping, video upload, independent server, queue, Redis, external database, OAuth integration, production D1 or production R2 is part of Phase 0.

## Security baseline and extension points

- `functions/_middleware.ts` adds security headers and `noindex` headers for submission/login/API paths. CSP restricts resource origins, but permits inline Astro island bootstrap/style snippets required by this static build; before real user content is accepted, evaluate nonce/hash-based CSP and verify hydration in the deployed runtime.
- Pure helpers in `src/lib/validation.ts` check X handles, X Post URLs, descriptions, file extensions/MIME/signatures and bounded upload size. They are not a substitute for repeating checks server-side.
- `src/lib/security.ts` contains testable OAuth-state and session-cookie primitives only; no OAuth callback or session persistence is wired.
- `src/lib/repositories/records.ts` demonstrates parameterized, public-only D1 record access and has a fake-D1 unit test.
- Do not accept user IDs, R2 keys, MIME claims or visibility status as trusted client authority. All hide/delete actions must be authorized server-side. Add rate-limit policy at the Pages Function boundary when write APIs are introduced.

## SEO and caching

- Public person/record mock pages define canonical, description, Open Graph and Twitter Card metadata.
- `/submit`, `/login` and `/api/*` use `noindex`; `robots.txt` disallows them.
- Public content remains indexable. Do not publish email addresses or internal identifiers in page metadata.
- Confirm canonical `site` in `astro.config.mjs` before choosing a production hostname; `internet-memory.pages.dev` is a project-name placeholder until Pages exists.

## Local and production configuration

`wrangler.jsonc` records the intended Pages output directory and D1/R2 binding names. The D1 ID is a visibly fake all-zero UUID and the R2 bucket name is a template; neither resource exists. Replace them only after explicit Phase 1 provisioning. The checked-in CI builds/tests only and cannot deploy production.
