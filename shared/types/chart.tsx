export type ChartMode = "Date" | "Timeline"

export type LegendPosition = "top-left" | "bottom-right"

export interface StarRecord {
    date: string
    count: number
    tag?: string // release tag name
}

export interface RepoStarData {
    repo: string
    starRecords: StarRecord[]
}

export interface RepoData extends RepoStarData {
    logoUrl: string
}
