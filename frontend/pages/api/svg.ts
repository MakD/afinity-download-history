import type { NextApiRequest, NextApiResponse } from "next";
import { optimize } from "svgo";
import { parseHTML } from "linkedom";
import XYChart from "@shared/packages/xy-chart";
import { convertDataToChartData, getRepoData } from "@shared/common/chart";
import { ChartMode } from "@shared/types/chart";
import { loadRepos } from "@shared/common/repo-data";
import reposJson from "@gh-data/repos.json";
import cache, {
  ogCardCache,
  svgCache,
  recordCacheHit,
  recordCacheMiss,
} from "../../server/cache";
import {
  getChartWidthWithSize,
  fixSvgCasing,
  getBase64Image,
} from "../../server/utils";
import { getNextToken, markTokenExhausted, ensureTokensInitialized, githubAuthHeader } from "../../server/token";
import { CHART_SIZES, MAX_REQUEST_AMOUNT, MAX_REPOS_PER_REQUEST } from "../../server/const";
import { initOgAssets, renderOgCard } from "../../server/og-card";

const SVG_HEADERS = {
  "Content-Type": "image/svg+xml;charset=utf-8",
  "Cache-Control": "public, s-maxage=86400, max-age=86400",
} as const;

const repoStore = loadRepos(reposJson as any);
initOgAssets();

function sendText(res: NextApiResponse, status: number, message: string) {
  res.status(status).setHeader("Content-Type", "text/plain; charset=utf-8").send(message);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendText(res, 405, "Method Not Allowed");
  }

  await ensureTokensInitialized();

  const query = req.query;
  const reposParam = typeof query.repos === "string" ? query.repos : Array.isArray(query.repos) ? query.repos[0] : "";

  if (!reposParam) {
    return sendText(res, 400, "Repo name required");
  }

  // Normalize repo names for cache efficiency (GitHub is case-insensitive).
  const normalized = reposParam
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean)
    .join(",");
  if (normalized !== reposParam) {
    const url = new URL(req.url || "/svg", `http://${req.headers.host || "localhost"}`);
    url.searchParams.set("repos", normalized);
    // Preserve path used by client (/svg or /api/svg).
    const pathname = (req.url || "").split("?")[0] || "/svg";
    res.writeHead(301, { Location: `${pathname}?${url.searchParams.toString()}` });
    return res.end();
  }

  const repos = normalized.split(",").filter(Boolean);
  if (repos.length > MAX_REPOS_PER_REQUEST) {
    return sendText(res, 400, `Too many repos: max ${MAX_REPOS_PER_REQUEST} per request`);
  }

  const style = typeof query.style === "string" ? query.style : "";
  if (style === "landscape1") {
    const repo = repos[0];
    const cardData = repoStore.getRepo(repo);
    if (!cardData) {
      return sendText(res, 404, `Repo not found in gh dataset: ${repo}`);
    }

    const cachedCard = ogCardCache.get(repo);
    if (cachedCard) {
      recordCacheHit("ogCard");
      res.writeHead(200, SVG_HEADERS);
      return res.end(cachedCard);
    }
    recordCacheMiss("ogCard");

    const token = getNextToken();
    if (token === null) {
      return sendText(res, 503, "All GitHub API tokens are rate-limited, try again later");
    }
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${repo}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "star-history-svg",
          ...githubAuthHeader(token),
        },
        signal: AbortSignal.timeout(15000),
      });
      if (ghRes.status === 403 && token) {
        markTokenExhausted(token);
      }
      if (!ghRes.ok) {
        return sendText(res, ghRes.status, `GitHub API: ${ghRes.statusText}`);
      }
      const gh = (await ghRes.json()) as any;
      const avatarBase64 = await getBase64Image(`${gh.owner.avatar_url}&s=200`);
      const svg = await renderOgCard({
        name: gh.full_name,
        description: gh.description,
        stars: gh.stargazers_count,
        forks: gh.forks_count,
        language: gh.language,
        license: gh.license?.spdx_id || null,
        created_at: gh.created_at,
        avatarBase64,
        attributes: cardData.attributes,
        rank: cardData.rank,
      });
      ogCardCache.set(repo, svg);
      res.writeHead(200, SVG_HEADERS);
      return res.end(svg);
    } catch (error: any) {
      const status = error.status || 500;
      return sendText(res, status, `Failed to generate card: ${error.message}`);
    }
  }

  const theme = typeof query.theme === "string" ? query.theme : "";
  const transparent = typeof query.transparent === "string" ? query.transparent : "";
  const typeParam = typeof query.type === "string" ? query.type : "";
  const logscaleParam = query.logscale;
  const legendParam = typeof query.legend === "string" ? query.legend : "";
  let type: ChartMode = "Date";
  let size = typeof query.size === "string" ? query.size : "";

  if (typeParam) {
    const lowerType = typeParam.toLowerCase();
    if (lowerType === "timeline") {
      type = "Timeline";
    } else if (lowerType === "date") {
      type = "Date";
    }
  } else if (query.timeline !== undefined) {
    type = "Timeline";
  } else if (query.date !== undefined) {
    type = "Date";
  }

  const useLogScale = logscaleParam !== undefined && logscaleParam !== "false";

  let legendPosition: "top-left" | "bottom-right" = "top-left";
  if (legendParam === "bottom-right") {
    legendPosition = "bottom-right";
  }

  if (!CHART_SIZES.includes(size)) {
    size = "laptop";
  }

  const svgCacheKey = `${repos.join(",")}|${type}|${size}|${theme}|${transparent}|${legendPosition}|${useLogScale}`;
  const cachedSvg = svgCache.get(svgCacheKey);
  if (cachedSvg) {
    recordCacheHit("svgChart");
    res.writeHead(200, SVG_HEADERS);
    return res.end(cachedSvg);
  }
  recordCacheMiss("svgChart");

  const repoData = [];
  const nodataRepos = [];

  for (const repo of repos) {
    const cacheData = cache.get(repo);
    if (cacheData) {
      recordCacheHit("starData");
      repoData.push({
        repo,
        starRecords: cacheData.starRecords,
        logoUrl: cacheData.logoUrl,
      });
    } else {
      recordCacheMiss("starData");
      nodataRepos.push(repo);
    }
  }

  if (nodataRepos.length > 0) {
    const token = getNextToken();
    if (token === null) {
      return sendText(res, 503, "All GitHub API tokens are rate-limited, try again later");
    }

    try {
      const data = await getRepoData(nodataRepos, token, MAX_REQUEST_AMOUNT);

      await Promise.all(
        data.map(async (d) => {
          d.logoUrl = await getBase64Image(`${d.logoUrl}&size=22`);
          cache.set(d.repo, {
            starRecords: d.starRecords,
            starAmount: d.starRecords[d.starRecords.length - 1].count,
            logoUrl: d.logoUrl,
          });
          repoData.push(d);
        })
      );
    } catch (error: any) {
      const status = error.status || 400;
      const message = error.message || "Some unexpected error happened, try again later";
      if (status === 403 && token) {
        markTokenExhausted(token);
      }
      return sendText(res, status, message);
    }
  }

  const { document } = parseHTML("<!DOCTYPE html><html><body></body></html>");
  const body = document.querySelector("body");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as unknown as SVGSVGElement;

  if (!body || !svg) {
    return sendText(res, 500, "Failed to create DOM with linkedom");
  }

  body.append(svg);
  svg.setAttribute("width", `${getChartWidthWithSize(size)}`);
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  try {
    XYChart(
      svg,
      {
        title: "Download History",
        xLabel: type === "Date" ? "Date" : "Timeline",
        yLabel: "Downloads",
        data: convertDataToChartData(repoData, type),
        showDots: false,
        transparent: transparent.toLowerCase() === "true",
        theme: theme === "dark" ? "dark" : "light",
      },
      {
        xTickLabelType: type === "Date" ? "Date" : "Number",
        chartWidth: getChartWidthWithSize(size),
        useLogScale: useLogScale,
        legendPosition: legendPosition,
      }
    );
  } catch (error) {
    return sendText(res, 500, `Failed to generate chart, ${error}`);
  }

  const svgContent = fixSvgCasing(svg.outerHTML);
  let optimized = svgContent;
  try {
    optimized = optimize(svgContent, { multipass: true }).data;
  } catch {
    // svgo is best-effort on Workers
  }
  svgCache.set(svgCacheKey, optimized);

  res.writeHead(200, SVG_HEADERS);
  return res.end(optimized);
}
