export const heatmapMoods = ["happy", "excited", "neutral", "sad", "stressed"] as const
export type HeatmapMood = typeof heatmapMoods[number]

export interface HeatmapCell {
    month: number
    week: number
    total: number
    counts: Partial<Record<HeatmapMood, number>>
}

export function leadingMoods(counts: HeatmapCell["counts"]): HeatmapMood[] {
    const highest = Math.max(0, ...heatmapMoods.map(mood => counts[mood] ?? 0))
    return highest ? heatmapMoods.filter(mood => counts[mood] === highest) : []
}
