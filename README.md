# Internet Memory

> 互联网是有记忆的。

Internet Memory 是一个由用户共同维护的公开互联网记录平台。用户可以保存和整理公开互联网账号曾经公开发布过的内容，并通过时间线长期查看。第一版聚焦 X / Twitter。

本仓库处于 Phase 0：页面和记录均为 mock 数据；Google OAuth、真实 D1/R2 资源和生产部署尚未接入。

## What it is

- 一个用于长期保存公开互联网记录的公开档案。
- 用户为公开 X 账号补充档案、上传公开内容截图、填写简短说明，并可附上原始 X Post URL 与内容发生时间。
- 访客无需登录即可搜索账号、浏览时间线、查看图片及打开来源链接。

## What it is not

- 不是匿名爆料站、黑名单、人物评分网站或新闻媒体。
- 不是 AI 判定真假平台，也不是官方事实核查机构。
- 不判断谁说谎、谁造假或哪条内容绝对真实；不提供诚信评分、投票、点赞、评论或 AI 总结。

## Product principles

- 只记录已经公开发布的互联网内容，并保留提交时间、可选发生时间和原始来源。
- 默认公开浏览；写操作未来必须由 Google 登录用户发起。Google 登录不代表实名或真实性认证。
- 原始上传图片是重要数据：服务端校验类型、生成不可冲突的 R2 key，并计算 SHA-256；缩略图永不替代原图。
- 管理员处理垃圾、隐私泄露、非公开信息、无关、违法、重复或明显恶意内容，不裁定事实真假。
- 默认不公开 Google 邮箱，不信任客户端提供的用户身份。

## Architecture

- Frontend: Astro + TypeScript, React Islands for interactive controls, Tailwind CSS.
- Runtime: Cloudflare Pages static output and Pages Functions.
- Data: Cloudflare D1; image originals: Cloudflare R2.
- Authentication: Google OAuth is deferred; no provider, callback, session store or credentials are configured in Phase 0.
- Database schema lives in `migrations/`; see [architecture](docs/architecture.md) and [data model](docs/data-model.md).

Astro's current Cloudflare adapter documentation says Pages support has been removed, while Cloudflare's Pages Astro guide still documents that adapter. To avoid relying on the unsupported adapter path and retain the requested Pages Functions target, this repository uses static Astro output plus standalone Pages Functions. See the architecture note and official links there.

## Local development

Requirements: Node.js `>=22.12.0` and npm `>=9.6.5`.

```sh
npm ci
npm run dev
```

Useful checks:

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run preview` runs the built static site with Wrangler Pages Functions locally. Cloudflare bindings in `wrangler.jsonc` are placeholders; Phase 0 does not create a D1 database or R2 bucket. Do not add real credentials to `.env.example` or commit `.env` / `.dev.vars` files.

## Cloudflare deployment

Production deployment is intentionally not configured in Phase 0. For a future Pages Git integration, use:

- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

Before binding a real environment, create D1 and R2 resources explicitly, replace the placeholder D1 ID and bucket name in `wrangler.jsonc`, apply the checked-in migration, and configure secrets in Cloudflare—not in Git. Pages configuration in `wrangler.jsonc` becomes the source of truth for supported settings. No automatic production deployment is included in GitHub Actions.

## Privacy

Google email is backend identity data and is not part of public Person or Record queries. Public pages show only public-account data and submitted records. Never submit private conversations, private group chats, personal phone numbers, home addresses, identity or bank-card numbers, leaked databases, or other non-public personal information.

## Content policy

Allowed subject matter includes public X Posts, public account pages, public livestream content, public product promotions, public video screenshots, public statements and other content already published openly on the internet. Submissions must not expose non-public personal information or turn the platform into a private-information database.

Records can be `published` or `hidden`. Hiding content is a moderation action for policy/safety reasons, not a truth verdict. See [product scope](docs/product-scope.md).

## Roadmap

- **Phase 0 (this repository):** project bootstrap, schema, static page skeleton, safety-oriented validation helpers and CI.
- **Next — Phase 1:** implement Google OAuth/session boundaries and authenticated, validated D1/R2 record submission without expanding the product into ratings, voting or automated truth judgments.
