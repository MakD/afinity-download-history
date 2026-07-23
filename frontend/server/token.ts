import logger from "./logger";

const savedTokens: string[] = [];
let index = 0;
let initPromise: Promise<void> | null = null;

const COOLDOWN_MS = 15 * 60 * 1000;
const exhaustedUntil = new Map<string, number>();

async function readCloudflareSecret(): Promise<string[]> {
  try {
    // Preferred on Workers — bindings/secrets live on `env`.
    const { env } = (await import("cloudflare:workers")) as {
      env: Record<string, string | undefined>;
    };
    const value = env.GITHUB_TOKENS || env.GITHUB_TOKEN || env.GH_TOKEN || "";
    if (!value.trim()) return [];
    return value
      .split(/[\r\n,]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function collectProcessEnvTokens(): string[] {
  const fromEnv =
    process.env.GITHUB_TOKENS ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    "";
  if (!fromEnv.trim()) return [];
  return fromEnv
    .split(/[\r\n,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

async function readTokenFile(): Promise<string[]> {
  try {
    const fs = await import("node:fs");
    const envFilePath = process.env.ENVPATH || "./token.env";
    if (!fs.existsSync(envFilePath)) return [];
    return fs
      .readFileSync(envFilePath)
      .toString()
      .split(/\r?\n/)
      .map((t) => t.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export const ensureTokensInitialized = async () => {
  if (savedTokens.length > 0) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const tokenList = [
      ...new Set([
        ...(await readCloudflareSecret()),
        ...collectProcessEnvTokens(),
        ...(await readTokenFile()),
      ]),
    ];

    if (tokenList.length === 0) {
      logger.warn(
        "No GitHub tokens found (set GITHUB_TOKEN wrangler secret). /svg will use anonymous GitHub API (low rate limit)."
      );
      return;
    }

    // Trust configured secrets — don't burn rate limit validating each token at boot.
    savedTokens.push(...tokenList);
    logger.info(`Loaded ${savedTokens.length} GitHub token(s)`);
  })();

  return initPromise;
};

export const markTokenExhausted = (token: string) => {
  if (!token) return;
  exhaustedUntil.set(token, Date.now() + COOLDOWN_MS);
  logger.warn(
    `Token ${token.slice(0, 8)}... rate-limited, cooling down for ${COOLDOWN_MS / 60000}m`
  );
};

export const getNextToken = (): string | null => {
  if (savedTokens.length === 0) {
    return "";
  }
  const now = Date.now();
  for (let i = 0; i < savedTokens.length; i++) {
    index = (index + 1) % savedTokens.length;
    const token = savedTokens[index];
    const until = exhaustedUntil.get(token);
    if (!until || now >= until) {
      if (until) exhaustedUntil.delete(token);
      return token;
    }
  }
  return null;
};

/** Authorization header value for classic (`ghp_`) or fine-grained (`github_pat_`) tokens. */
export function githubAuthHeader(token: string): Record<string, string> {
  if (!token) return {};
  const scheme = token.startsWith("github_pat_") ? "Bearer" : "token";
  return { Authorization: `${scheme} ${token}` };
}
