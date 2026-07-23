<div align="center">
 
# :sparkles: Release History :sparkles:
 
release-history, **a new cool history graph for download tracking**

</div>

---

## 🏗 Development

**`Star-history`** is a single **vinext** app (UI + `/svg` image API) deployed to **Cloudflare Workers**.

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) 20+
- [pnpm](https://pnpm.io/)
- Wrangler login for deploys (`npx wrangler login`)

### Local

```shell
cd gh && pnpm i && pnpm run star:generate   # needs committed star.db
cd ../frontend && pnpm i && pnpm dev
```

- Site: http://localhost:3000  
- Chart embed: `http://localhost:3000/svg?repos=owner/repo&type=Date`  
- Health: `GET /healthz`

Optional: `export GITHUB_TOKEN=ghp_...` or `frontend/token.env` (gitignored).

### Build & deploy (CI / manual)

```shell
# Generate ranking JSON consumed by the app
cd gh && pnpm i && pnpm run star:generate

# Build
cd ../frontend && pnpm i && pnpm run build

# Deploy to Cloudflare Workers
pnpm run deploy
```

GitHub Actions (`.github/workflows/deploy.yml`) runs the same flow on pushes to `main`.

**Repo secrets (Actions):**
- `CLOUDFLARE_API_TOKEN` — Workers edit permission
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account id

**Worker secret (once):**
```shell
cd frontend
echo "ghp_..." | npx wrangler secret put GITHUB_TOKEN
```

Live Worker: https://star-history.letsgovaa.workers.dev
