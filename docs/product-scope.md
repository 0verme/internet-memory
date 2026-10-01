# Product scope

## Purpose

“互联网是有记忆的。” Internet Memory is a community-maintained public archive for already-published internet material, initially focused on public X/Twitter accounts and posts. It records content and source context over time; it does not decide what is true.

## In scope for the first product version

- Google-authenticated users create or supplement a public X account profile.
- Submitters attach screenshots of public internet material, write a short description, optionally add an original X Post URL and an optional occurrence time, then publish.
- Anyone can search public X accounts, view a profile timeline, open original images and follow original source links.
- Administrators can hide `published` records by changing status to `hidden` when responding to spam, privacy exposure, non-public information, irrelevant/illegal/duplicate/clearly abusive material.

## Explicitly out of scope

- Truth/lie/fraud/scam verdicts, official fact-checking, personality or honesty scores, blacklists and “number of scandals”.
- True/false voting, likes, comments, AI summaries, Community Notes, evidence/counter-evidence, topic/event aggregation.
- Anonymous tips, automatic X scraping, X API integration, video/audio/PDF/archive uploads or private-content collection.
- Real-name verification: Google login only establishes an authenticated account.

## Content boundary

Allowed: public X Posts and profile pages, public livestream material, product promotions, public-video screenshots, public statements and other content already publicly published online.

Prohibited: private-message screenshots (including WeChat DMs), non-public group chats, private phone numbers, home addresses, identity documents, bank-card information, leaked databases or other non-public personal information. The platform records public internet history; it must not become a private-information database.

## Publication and moderation

The first schema uses only `published` and `hidden`. Public pages show published records; hidden records are omitted from public read APIs. Moderators assess policy/safety, privacy exposure, spam, relevance, legality, duplication and obvious abuse—not whether a statement is true. Google account email is not public profile data.

## Phase 0 behavior

The repository currently contains static mock pages and a local-only submission wizard preview. No Google sign-in, upload, publication, D1/R2 storage or production deployment works yet. Those are not simulated as successful server operations.
