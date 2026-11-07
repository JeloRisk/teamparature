export function positiveShare(happy: number, excited: number, total: number): number | null {
    return total > 0 ? Math.round((happy + excited) / total * 100) : null
}
