import utils from "./utils"

const API_PER_PAGE = 100 // GitHub API max items per request
const REQUEST_TIMEOUT_MS = 15000 // 15s timeout for GitHub API calls

type ApiResponse<T> = {
  data: T
  status: number
  headers: Record<string, string>
}

async function githubGet<T>(url: string, token?: string, accept = "application/vnd.github.v3.star+json"): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    headers: {
      Accept: accept,
      "User-Agent": "star-history-svg",
      ...(token
        ? {
            Authorization: token.startsWith("github_pat_")
              ? `Bearer ${token}`
              : `token ${token}`,
          }
        : {}),
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  const headers: Record<string, string> = {}
  res.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value
  })

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = (await res.json()) as { message?: string }
      if (body?.message) message = body.message
    } catch {
      // ignore JSON parse errors
    }
    throw {
      status: res.status,
      message,
      data: [],
    }
  }

  const data = (await res.json()) as T
  return { data, status: res.status, headers }
}

namespace api {
  export async function getRepoStargazers(repo: string, token?: string, page?: number) {
    let url = `https://api.github.com/repos/${repo}/stargazers?per_page=${API_PER_PAGE}`

    if (page !== undefined) {
      url = `${url}&page=${page}`
    }
    return githubGet(url, token)
  }

  export async function getRepoStargazersCount(repo: string, token?: string) {
    const { data } = await githubGet<{ stargazers_count: number }>(`https://api.github.com/repos/${repo}`, token)
    return data.stargazers_count
  }

  export async function getRepoStarRecords(repo: string, token: string, maxRequestAmount: number) {
    const patchRes = await getRepoStargazers(repo, token)

    const headerLink = patchRes.headers["link"] || ""

    let pageCount = 1
    const regResult = /next.*&page=(\d*).*last/.exec(headerLink)

    if (regResult) {
      if (regResult[1] && Number.isInteger(Number(regResult[1]))) {
        pageCount = Number(regResult[1])
      }
    }

    if (pageCount === 1 && Array.isArray(patchRes?.data) && patchRes.data.length === 0) {
      throw {
        status: patchRes.status,
        data: [],
      }
    }

    const requestPages: number[] = []
    if (pageCount < maxRequestAmount) {
      requestPages.push(...utils.range(1, pageCount))
    } else {
      utils.range(1, maxRequestAmount).map((i) => {
        requestPages.push(Math.round((i * pageCount) / maxRequestAmount) - 1)
      })
      if (!requestPages.includes(1)) {
        requestPages[0] = 1
      }
    }

    const resArray = await Promise.all(
      requestPages.map((page) => {
        return getRepoStargazers(repo, token, page)
      })
    )

    const starRecordsMap: Map<string, number> = new Map()

    if (requestPages.length < maxRequestAmount) {
      const starRecordsData: {
        starred_at: string
      }[] = []
      resArray.map((res) => {
        const { data } = res
        starRecordsData.push(...(data as { starred_at: string }[]))
      })
      for (let i = 0; i < starRecordsData.length; ) {
        starRecordsMap.set(utils.getDateString(starRecordsData[i].starred_at), i + 1)
        i += Math.floor(starRecordsData.length / maxRequestAmount) || 1
      }
    } else {
      resArray.map(({ data }, index) => {
        const pageData = data as { starred_at: string }[]
        if (pageData.length > 0) {
          const starRecord = pageData[0]
          const pageStartPosition = API_PER_PAGE * (requestPages[index] - 1)
          starRecordsMap.set(utils.getDateString(starRecord.starred_at), pageStartPosition)
        }
      })
    }

    const starAmount = await getRepoStargazersCount(repo, token)
    starRecordsMap.set(utils.getDateString(Date.now()), starAmount)

    const starRecords: {
      date: string
      count: number
    }[] = []

    starRecordsMap.forEach((v, k) => {
      starRecords.push({
        date: k,
        count: v,
      })
    })

    return starRecords
  }

  export async function getRepoLogoUrl(repo: string, token?: string): Promise<string> {
    const owner = repo.split("/")[0]
    const { data } = await githubGet<{ avatar_url: string }>(`https://api.github.com/users/${owner}`, token)
    return data.avatar_url
  }

  interface GitHubReleaseAsset {
    download_count?: number
  }

  interface GitHubRelease {
    tag_name: string
    draft?: boolean
    published_at: string | null
    created_at: string
    assets?: GitHubReleaseAsset[]
  }

  export async function getRepoReleases(repo: string, token?: string, page = 1) {
    const url = `https://api.github.com/repos/${repo}/releases?per_page=${API_PER_PAGE}&page=${page}`
    return githubGet<GitHubRelease[]>(url, token, "application/vnd.github+json")
  }

  /**
   * Fetch all published releases and build a cumulative download history.
   * Each point is a release: count = sum of asset download_count for that
   * release plus all earlier releases (chronological order).
   */
  export async function getRepoReleaseDownloadRecords(repo: string, token = "") {
    const releases: GitHubRelease[] = []
    let page = 1

    while (true) {
      const { data, headers, status } = await getRepoReleases(repo, token, page)

      if (page === 1 && (!data || data.length === 0)) {
        throw {
          status,
          data: [],
        }
      }

      releases.push(...data)

      const headerLink = headers["link"] || ""
      const hasNext = /rel="next"/.test(headerLink)
      if (!hasNext || data.length < API_PER_PAGE) {
        break
      }
      page += 1
    }

    const published = releases
      .filter((release) => !release.draft)
      .map((release) => {
        const releaseDownloads = (release.assets || []).reduce((sum, asset) => sum + (asset.download_count || 0), 0)
        return {
          tag: release.tag_name,
          date: utils.getDateString(release.published_at || release.created_at),
          releaseDownloads,
          publishedAt: new Date(release.published_at || release.created_at).getTime(),
        }
      })
      .sort((a, b) => a.publishedAt - b.publishedAt)

    if (published.length === 0) {
      throw {
        status: 501,
        data: [],
      }
    }

    let cumulative = 0
    return published.map(({ tag, date, releaseDownloads }) => {
      cumulative += releaseDownloads
      return {
        date,
        count: cumulative,
        tag,
      }
    })
  }
}

export default api
