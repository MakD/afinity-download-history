import { render, CustomFont } from "@cf-wasm/og/workerd";
import { buildLandscape1 } from "@shared/packages/card-landscape1";
import { renderRadarSvg } from "@shared/packages/radar-svg";
import type { RepoAttributes } from "@shared/types/gh";
import xkcdUrl from "../assets/xkcd.ttf?url";
import interUrl from "../assets/Inter.ttf?url";
import logoUrl from "../assets/logo-icon.png?url";

export interface OgCardInput {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  license: string | null;
  created_at: string | null;
  avatarBase64: string;
  attributes: RepoAttributes | null;
  rank: number | null;
}

let logoBase64Promise: Promise<string> | null = null;

function toPathname(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return new URL(url).pathname;
  }
  return url.startsWith("/") ? url : `/${url}`;
}

async function loadBytes(url: string): Promise<ArrayBuffer> {
  // On Workers, Vite emits asset URLs like `/_next/static/….ttf` — fetch via ASSETS.
  try {
    const { env } = (await import("cloudflare:workers")) as {
      env: { ASSETS?: { fetch: (req: Request) => Promise<Response> } };
    };
    if (env.ASSETS) {
      const path = toPathname(url);
      const res = await env.ASSETS.fetch(new Request(`https://assets.local${path}`));
      if (res.ok) return res.arrayBuffer();
    }
  } catch {
    // Not on Workers / ASSETS unavailable
  }

  // Node / absolute URL fallback
  const absolute =
    url.startsWith("http://") || url.startsWith("https://")
      ? url
      : new URL(url, "http://127.0.0.1:8787").href;
  const res = await fetch(absolute);
  if (!res.ok) {
    throw new Error(`Failed to load asset ${url}: ${res.status}`);
  }
  return res.arrayBuffer();
}

function bytesToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function getLogoBase64(): Promise<string> {
  if (!logoBase64Promise) {
    logoBase64Promise = (async () => {
      const buf = await loadBytes(logoUrl);
      return `data:image/png;base64,${bytesToBase64(buf)}`;
    })();
  }
  return logoBase64Promise;
}

function toBase64(svg: string): string {
  return bytesToBase64(new TextEncoder().encode(svg).buffer);
}

/** No-op kept for call-site compatibility; assets load lazily. */
export function initOgAssets() {}

export async function renderOgCard(data: OgCardInput): Promise<string> {
  let radarSvgBase64: string | null = null;
  if (data.attributes && Object.values(data.attributes).some((v) => v > 0)) {
    const radarSvg = renderRadarSvg(data.attributes, 400);
    radarSvgBase64 = `data:image/svg+xml;base64,${toBase64(radarSvg)}`;
  }

  const logoBase64 = await getLogoBase64();
  const vnode = buildLandscape1({
    ...data,
    radarSvgBase64,
    logoBase64,
  });

  const result = render(vnode as any, {
    width: 1200,
    height: 630,
    fonts: [
      new CustomFont("xkcd", () => loadBytes(xkcdUrl), { weight: 400, style: "normal" }),
      new CustomFont("Inter", () => loadBytes(interUrl), { weight: 400, style: "normal" }),
    ],
    format: "svg",
  });

  const svg = await result.asSvg();
  return svg.image;
}
