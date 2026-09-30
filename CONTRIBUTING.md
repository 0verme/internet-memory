# Contributing

Thank you for helping preserve public internet records. Keep changes within the product boundaries in `README.md` and `docs/product-scope.md`.

## Development setup

- Node.js `>=22.12.0`
- npm `>=9.6.5`

```sh
npm ci
npm run dev
```

Before opening a pull request, run:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions runs the same checks on pull requests and pushes to `main`. It does not deploy production.

## Contribution principles

- Keep public-record capture distinct from truth adjudication. Do not add ratings, votes, likes, comments, AI summaries, counter-evidence models or automated X collection.
- Never commit secrets, `.env`, `.dev.vars`, private personal information or credentials. `.env.example` contains names only.
- Upload validation must inspect file signatures and MIME, enforce size/count limits, generate storage keys server-side and hash the original bytes. Do not trust the file extension or a client-provided user ID.
- Use prepared D1 statements. Keep Google email out of public queries and interfaces.
- Changes to `migrations/` must be forward-only and include a concise explanation in `docs/data-model.md` when they change the model.
- Treat submitted public content as untrusted. Escape rendered user text and validate outgoing source URLs.

## Content safety

Only already-public internet content is in scope. Private messages, non-public group chats, personal contact/location/identity/financial data, leaked databases and unrelated or illegal material are prohibited. Moderation handles privacy, spam, relevance, duplication and abuse—not the truth of a claim.
