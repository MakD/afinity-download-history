export type DurationUnitType = "day" | "week" | "month" | "year"

const DAY_MS = 1000 * 60 * 60 * 24

export const getTimestampFormatUnit = (timestamp: number): DurationUnitType => {
  const days = timestamp / DAY_MS
  if (days / 365 > 1) return "year"
  if (days / 30 > 1) return "month"
  if (days / 7 > 1) return "week"
  return "day"
}

const getFormatTimeline = (timestamp: number, type: DurationUnitType = "day") => {
  if (timestamp === 0) {
    return "day one"
  }

  const seconds = Math.floor(timestamp / 1000)
  const days = Math.floor(seconds / 60 / 60 / 24)
  const weeks = Math.floor(days / 7)
  const months = (days / 30).toFixed(0)
  const years = (days / 365).toFixed(0)

  if (type === "day") {
    if (days === 1) {
      return "a day"
    }
    return `${days} days`
  } else if (type === "week") {
    if (weeks === 1) {
      return "a week"
    }
    return `${weeks} weeks`
  } else if (type === "month") {
    if (Number(months) === 1) {
      return "a month"
    }
    return `${months} months`
  } else {
    if (Number(years) === 1) {
      return "a year"
    }
    return `${years} years`
  }
}

export default getFormatTimeline
