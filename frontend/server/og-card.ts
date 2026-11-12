import { render, CustomFont } from "@cf-wasm/og/node";
import { buildLandscape1 } from "@shared/packages/card-landscape1";
import { renderRadarSvg } from "@shared/packages/radar-svg";
import type { RepoAttributes } from "@shared/types/gh";
import { readFile } from "node:fs/promises";
import path from "node:path";

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

async function loadBytes(file: string): Promise<ArrayBuffer> {
  const buf = await readFile(path.join(process.cwd(), "assets", file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
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
      const buf = await loadBytes("logo-icon.png");
      return `data:image/png;base64,${bytesToBase64(buf)}`;
    })();
  }
  return logoBase64Promise;
}

function toBase64(svg: string): string {
  return bytesToBase64(new TextEncoder().encode(svg).buffer);
}

export function initOgAssets() {}

export async function renderOgCard(data: OgCardInput): Promise<string> {
  let radarSvgBase64: string | null = null;
  if (data.attributes && Object.values(data.attributes).some((v) => v > 0)) {
    const radarSvg = renderRadarSvg(data.attributes, 400);
    radarSvgBase64 = `data:image/svg+xml;base64,${toBase64(radarSvg)}`;
  }

  const logoBase64 = await getLogoBase64();
  const vnode = buildLandscape1({ ...data, radarSvgBase64, logoBase64 });

  const result = render(vnode as any, {
    width: 1200,
    height: 630,
    fonts: [
      new CustomFont("xkcd", () => loadBytes("xkcd.ttf"), { weight: 400, style: "normal" }),
      new CustomFont("Inter", () => loadBytes("Inter.ttf"), { weight: 400, style: "normal" }),
    ],
    format: "svg",
  });

  const svg = await result.asSvg();
  return svg.image;
}