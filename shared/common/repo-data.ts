import type { RepoCardData } from "../types/gh.js";

const DEFAULT_MIN_STARS = 50000;

export interface RepoStore {
  min_stars: number;
  repos: RepoCardData[];
  getRepo(name: string): RepoCardData | null;
}

type ReposFile = {
  min_stars?: number;
  repos?: RepoCardData[];
};

/**
 * Build a repo store from JSON (Workers-safe — no fs).
 * Callers should pass data imported via `@gh-data/repos.json`.
 */
export function loadRepos(raw?: ReposFile | null): RepoStore {
  let min_stars = DEFAULT_MIN_STARS;
  let repos: RepoCardData[] = [];
  const repoMap = new Map<string, RepoCardData>();

  try {
    min_stars = raw?.min_stars ?? DEFAULT_MIN_STARS;
    repos = raw?.repos ?? [];
    for (const r of repos) {
      repoMap.set(r.name.toLowerCase(), r);
    }
    if (repos.length > 0) {
      console.log(`Loaded ${repos.length} repos into RepoStore`);
    }
  } catch (err) {
    console.warn(`Failed to load repos:`, err);
  }

  return {
    min_stars,
    repos,
    getRepo: (name: string) => repoMap.get(name.toLowerCase()) ?? null,
  };
}
