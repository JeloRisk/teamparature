import { notFound } from "next/navigation"
import { fromZonedTime, formatInTimeZone } from "date-fns-tz"
import { Mood } from "@/models/Mood"
import { getWorkspaceTimezone } from "@/lib/workspace-time"
import MemberEmotionHeatmap from "./MemberEmotionHeatmap"
import { getWorkspaceMembership } from "../workspace-access"

type SearchParams = { year?: string }
type MoodEntry = { date: Date; mood: "happy" | "excited" | "neutral" | "sad" | "stressed"; rank: number }

export default async function MoodOverviewPage({ params, searchParams }: {
    params: Promise<{ orgId: string }>
    searchParams: Promise<SearchParams>
}) {
    const { orgId } = await params
    const membership = await getWorkspaceMembership(orgId)
    if (membership?.role !== "member") notFound()

    const timezone = await getWorkspaceTimezone(orgId)
    const today = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd")
    const currentYear = Number(today.slice(0, 4))
    const query = await searchParams
    const requestedYear = Number(query.year)
    const year = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= currentYear
        ? requestedYear
        : currentYear
    const start = fromZonedTime(`${year}-01-01T00:00:00`, timezone)
    const end = fromZonedTime(`${year + 1}-01-01T00:00:00`, timezone)
    const records = await Mood.find({ organization: orgId, user: membership.user, date: { $gte: start, $lt: end } })
        .select("date mood rank").sort({ date: 1 }).lean<MoodEntry[]>()
    const entries = records.map(entry => ({
        date: formatInTimeZone(entry.date, timezone, "yyyy-MM-dd"),
        mood: entry.mood,
        rank: entry.rank,
    }))

    return <MemberEmotionHeatmap year={year} currentYear={currentYear} today={today} entries={entries} />
}
