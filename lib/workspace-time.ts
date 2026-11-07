import { formatInTimeZone, fromZonedTime } from "date-fns-tz"
import { Organization } from "@/models/Organization"

export function validTimezone(value: unknown): value is string {
    if (typeof value !== "string" || value.length > 100) return false
    try {
        new Intl.DateTimeFormat("en", { timeZone: value }).format()
        return value === "UTC" || value.includes("/")
    } catch {
        return false
    }
}

export async function getWorkspaceTimezone(orgId: string) {
    const workspace = await Organization.findById(orgId).select("timezone").lean<{ timezone?: string }>()
    if (!workspace) throw new Error("Workspace not found")
    return validTimezone(workspace.timezone) ? workspace.timezone : "UTC"
}

export function workspaceDayBoundaries(timezone: string, pastDays: number, now = new Date()) {
    const localDay = formatInTimeZone(now, timezone, "yyyy-MM-dd")
    const calendar = new Date(localDay + "T00:00:00Z")
    return Array.from({ length: pastDays + 2 }, (_, i) => {
        const date = new Date(calendar)
        date.setUTCDate(date.getUTCDate() + i - pastDays)
        return fromZonedTime(date.toISOString().slice(0, 10) + "T00:00:00", timezone)
    })
}
