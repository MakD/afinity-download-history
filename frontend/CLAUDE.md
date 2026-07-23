# CLAUDE.md

## Development Commands

- `pnpm run dev` — vinext dev server (UI + `/svg`)
- `pnpm run build` — production build
- `pnpm run deploy` — build + deploy to Cloudflare Workers
- `pnpm start` — local production server
- `pnpm run lint` — lint
- `pnpm run prettier` — format

## Architecture

Unified **vinext** app (Next.js Pages Router on Vite) deployed to **Cloudflare Workers**.

- UI: React Context store + D3 charts (`@shared/packages/xy-chart`)
- README embeds: `GET /svg?repos=owner/repo` (linkedom + D3)
- Landscape OG: `GET /svg?repos=owner/repo&style=landscape1` (`@cf-wasm/og`)
- Tokens: `GITHUB_TOKEN` wrangler secret (or `token.env` locally)
