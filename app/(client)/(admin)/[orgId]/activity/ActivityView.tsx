"use client"

import { TableSkeletonRows } from "@/app/components/loading/WorkspaceSkeletons"
import { useEffect, useState } from "react"
import { Input } from "@/app/components/ui/input"
import { History, RefreshCw, Search, ArrowUp, ArrowDown, ArrowUpDown, X } from "lucide-react"
import { activityActions, type ActivityAction } from "@/lib/activity-actions"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"

type SortColumn = "actorName" | "action" | "targetLabel" | "createdAt"

interface Entry {
    _id: string
    actorName: string
    action: ActivityAction
    targetLabel: string
    previousRole?: string
    newRole?: string
    outcome: "pending" | "succeeded" | "failed"
    createdAt: string
}

const actionAccents: Record<ActivityAction, string> = {
    member_removed: "var(--mood-sad)",
    member_restored: "var(--mood-excited)",
    role_changed: "var(--mood-stressed)",
    invitation_sent: "var(--mood-excited)",
    invitation_resent: "var(--mood-happy)",
    invitation_cancelled: "var(--mood-sad)",
    workspace_updated: "var(--mood-stressed)",
}

const outcomeStyles: Record<Entry["outcome"], { label: string; className: string }> = {
    succeeded: { label: "Completed", className: "bg-[var(--mood-excited-soft)]" },
    pending: { label: "Pending", className: "bg-[var(--mood-happy-soft)]" },
    failed: { label: "Failed", className: "bg-[var(--mood-sad-soft)]" },
}

function ActionLabel({ action }: { action: ActivityAction }) {
    return <span className="inline-flex items-start gap-2">
        <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: actionAccents[action] }} />
        <span>{activityActions[action]}</span>
    </span>
}

function OutcomeBadge({ outcome, detailed = false }: { outcome: Entry["outcome"]; detailed?: boolean }) {
    const appearance = outcomeStyles[outcome]
    const label = detailed && outcome === "failed" ? "Email delivery failed" : detailed && outcome === "pending" ? "Delivery pending" : appearance.label
    return <Badge variant="outline" className={`shrink-0 border-transparent text-foreground ${appearance.className}`}>{label}</Badge>
}

export default function ActivityView({ orgId, timezone }: { orgId: string; timezone: string }) {
    const [action, setAction] = useState("all")
    const [search, setSearch] = useState("")
    const [start, setStart] = useState("")
    const [end, setEnd] = useState("")
    const [sort, setSort] = useState<SortColumn>("createdAt")
    const [order, setOrder] = useState<"asc" | "desc">("desc")
    const [page, setPage] = useState(1)
    const [revision, setRevision] = useState(0)
    const [entries, setEntries] = useState<Entry[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)
        setLoading(true)
        setError("")
        async function load() {
            try {
                const query = new URLSearchParams({ action, page: String(page), search, start, end, sort, order })
                const res = await fetch(`/api/orgs/${orgId}/activity?${query}`, { signal: controller.signal })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Could not load activity")
                if (controller.signal.aborted) return
                const pages = Math.max(1, Math.ceil(data.total / 20))
                if (page > pages) { setPage(pages); return }
                setEntries(data.activities)
                setTotal(data.total)
            } catch (error) {
                if (controller.signal.reason !== "unmounted")
                    setError(error instanceof Error && error.name !== "AbortError" ? error.message : "The request timed out. Please try again.")
            } finally {
                clearTimeout(timeout)
                if (controller.signal.reason !== "unmounted") setLoading(false)
            }
        }
        const debounce = setTimeout(load, 250)
        return () => { clearTimeout(debounce); clearTimeout(timeout); controller.abort("unmounted") }
    }, [orgId, action, page, revision, search, start, end, sort, order])

    function changeSort(column: SortColumn) {
        setOrder(sort === column ? (order === "asc" ? "desc" : "asc") : column === "createdAt" ? "desc" : "asc")
        setSort(column)
        setPage(1)
    }

    const columns: { key: SortColumn; label: string }[] = [
        { key: "actorName", label: "Who" },
        { key: "action", label: "Activity" },
        { key: "targetLabel", label: "Member / target" },
        { key: "createdAt", label: "When" },
    ]
    const activityGroups = entries.reduce<{ key: string; label: string; entries: Entry[] }[]>((groups, entry) => {
        const date = new Date(entry.createdAt)
        const key = date.toLocaleDateString("en-US", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" })
        let group = groups[groups.length - 1]
        if (!group || group.key !== key) {
            group = {
                key,
                label: date.toLocaleDateString(undefined, { timeZone: timezone, weekday: "long", month: "long", day: "numeric", year: "numeric" }),
                entries: [],
            }
            groups.push(group)
        }
        group.entries.push(entry)
        return groups
    }, [])
    const columnWidths: Record<SortColumn, string> = {
        actorName: "w-[19%]",
        action: "w-[21%]",
        targetLabel: "w-[27%]",
        createdAt: "w-[17%]",
    }
    function sortableHeader(column: typeof columns[number]) {
        const active = sort === column.key
        const Icon = active ? order === "asc" ? ArrowUp : ArrowDown : ArrowUpDown
        const nextOrder = active ? (order === "asc" ? "descending" : "ascending") : column.key === "createdAt" ? "descending" : "ascending"
        return <TableHead key={column.key} className={columnWidths[column.key]} aria-sort={active ? order === "asc" ? "ascending" : "descending" : "none"}>
            <button type="button" onClick={() => changeSort(column.key)}
                className={`group -ml-2 flex items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-ring ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                aria-label={`Sort by ${column.label}, ${nextOrder}`}>
                {column.label}<Icon className={`size-3.5 ${active ? "opacity-100" : "opacity-40 group-hover:opacity-100"}`} aria-hidden="true" />
            </button>
        </TableHead>
    }

    return <div className="dashboard-reference-theme mobile-page -m-4 min-w-0 flex-1 bg-background px-4 py-5 sm:py-8 md:-mx-10 md:px-10">
    <div className="mobile-page-content mx-auto min-w-0 max-w-7xl space-y-4 sm:space-y-5">
        <header className="mobile-page-header flex flex-wrap items-start justify-between gap-3 pb-1 sm:items-end sm:gap-4 sm:pb-2">
            <div>
                <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Activity history</h1>
                <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">A record of invitations, membership changes, and workspace updates.</p>
            </div>
            <Button variant="outline" className="min-h-10 rounded-xl border-border bg-card" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </header>
        <section aria-label="Activity filters" className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1.5fr)_minmax(12rem,1fr)_minmax(9rem,0.8fr)_minmax(9rem,0.8fr)]">
                <div className="min-w-0 space-y-2 md:col-span-2 xl:col-span-1">
                    <label htmlFor="activity-search" className="block text-xs font-medium text-muted-foreground">Search activity</label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
                        <Input id="activity-search" className="h-11 rounded-xl border-border bg-background pl-9 pr-9" placeholder="Person, email, or activity…" value={search} maxLength={254} onChange={event => { setSearch(event.target.value); setPage(1) }} />
                        {search && <button type="button" aria-label="Clear search" className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-accent" onClick={() => { setSearch(""); setPage(1) }}><X className="size-4" /></button>}
                    </div>
                </div>
                <div className="min-w-0 space-y-2 md:col-span-2 xl:col-span-1">
                    <label htmlFor="activity-filter" className="block text-xs font-medium text-muted-foreground">Activity type</label>
                    <select id="activity-filter" value={action} onChange={event => { setAction(event.target.value); setPage(1) }} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">
                        <option value="all">All activity</option>
                        {Object.entries(activityActions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                </div>
                <div className="grid min-w-0 grid-cols-2 gap-3 md:col-span-2 xl:col-span-2">
                    <div className="min-w-0 space-y-2"><label htmlFor="activity-start" className="block text-xs font-medium text-muted-foreground">From</label><Input id="activity-start" className="h-11 w-full min-w-0 rounded-xl border-border bg-background px-2.5 sm:px-3" type="date" value={start} max={end || undefined} onChange={event => { setStart(event.target.value); setPage(1) }} /></div>
                    <div className="min-w-0 space-y-2"><label htmlFor="activity-end" className="block text-xs font-medium text-muted-foreground">Through</label><Input id="activity-end" className="h-11 w-full min-w-0 rounded-xl border-border bg-background px-2.5 sm:px-3" type="date" value={end} min={start || undefined} onChange={event => { setEnd(event.target.value); setPage(1) }} /></div>
                </div>
            </div>
        </section>
        <section aria-label="Workspace activity history" className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="hidden overflow-x-auto md:block">
            <Table aria-label="Workspace activity history" className="w-full min-w-[48rem] table-fixed">
                <TableHeader><TableRow className="bg-muted/40">
                    {columns.slice(0, 3).map(sortableHeader)}
                    <TableHead className="w-[16%] text-xs font-semibold text-muted-foreground">Details</TableHead>
                    {sortableHeader(columns[3])}
                </TableRow></TableHeader>
                <TableBody>
                    {loading ? <TableSkeletonRows label="Loading activity history" />
                    : error ? <TableRow><TableCell colSpan={5} className="py-10 text-center"><p role="alert">{error}</p><Button variant="outline" className="mt-3" onClick={() => setRevision(value => value + 1)}>Retry</Button></TableCell></TableRow>
                    : entries.length ? entries.map(entry => <TableRow key={entry._id}>
                        <TableCell className="font-medium">{entry.actorName}</TableCell>
                        <TableCell className="whitespace-normal break-words leading-snug"><ActionLabel action={entry.action} /></TableCell>
                        <TableCell className="max-w-64 whitespace-normal break-words leading-snug">{entry.targetLabel}</TableCell>
                        <TableCell className="whitespace-normal">
                            {entry.action === "role_changed" || entry.action === "member_restored"
                                ? <span className="inline-flex rounded-lg bg-[var(--mood-stressed-soft)] px-2 py-1 text-xs font-medium text-foreground">{entry.previousRole} → {entry.newRole}</span>
                                : <OutcomeBadge outcome={entry.outcome} detailed />}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                            <time dateTime={entry.createdAt} title={new Date(entry.createdAt).toLocaleString(undefined, { timeZone: timezone, dateStyle: "full", timeStyle: "short" })} className="whitespace-nowrap">
                                {new Date(entry.createdAt).toLocaleDateString(undefined, { timeZone: timezone, month: "short", day: "numeric", year: "numeric" })}
                                <span className="mt-0.5 block font-medium text-foreground/80">{new Date(entry.createdAt).toLocaleTimeString(undefined, { timeZone: timezone, hour: "numeric", minute: "2-digit" })}</span>
                            </time>
                        </TableCell>
                    </TableRow>)
                    : <TableRow><TableCell colSpan={5} className="py-12 text-center"><History className="mx-auto mb-3 size-7 text-muted-foreground" /><p className="font-medium">{search || action !== "all" || start || end ? "No matching activity" : "No activity recorded yet"}</p><p className="mt-1 text-sm text-muted-foreground">{search || action !== "all" || start || end ? "Try clearing a filter or broadening the date range." : "Only actions recorded since Activity History was enabled are available."}</p></TableCell></TableRow>}
                </TableBody>
            </Table>
            </div>
            <div className="md:hidden" aria-live="polite">
                {loading ? <p role="status" className="px-4 py-8 text-center text-sm text-muted-foreground">Loading activity history…</p>
                : error ? <div className="px-4 py-8 text-center"><p role="alert" className="text-sm">{error}</p><Button variant="outline" className="mt-3 rounded-xl" onClick={() => setRevision(value => value + 1)}>Retry</Button></div>
                : activityGroups.length ? activityGroups.map(group => <section key={group.key} aria-label={group.label} className="border-b border-border last:border-b-0">
                    <h3 className="bg-secondary/50 px-4 py-2.5 text-sm font-semibold text-secondary-foreground">{group.label}</h3>
                    <div className="divide-y divide-border">
                        {group.entries.map(entry => <article key={entry._id} className="space-y-2 px-4 py-4">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="break-words text-base font-semibold leading-6 text-foreground"><ActionLabel action={entry.action} /></p>
                                    <p className="mt-1.5 break-all rounded-lg bg-secondary/50 px-2.5 py-1.5 text-sm leading-5 text-foreground">{entry.targetLabel}</p>
                                </div>
                                <OutcomeBadge outcome={entry.outcome} />
                            </div>
                            {(entry.action === "role_changed" || entry.action === "member_restored") && <p className="inline-flex rounded-lg bg-[var(--mood-stressed-soft)] px-2 py-1 text-xs font-medium text-foreground">{entry.previousRole} → {entry.newRole}</p>}
                            <p className="text-xs text-muted-foreground">By {entry.actorName} <span aria-hidden="true">·</span> {new Date(entry.createdAt).toLocaleTimeString(undefined, { timeZone: timezone, hour: "numeric", minute: "2-digit" })}</p>
                        </article>)}
                    </div>
                </section>)
                : <div className="px-4 py-10 text-center"><History className="mx-auto mb-3 size-7 text-muted-foreground" /><p className="font-medium">{search || action !== "all" || start || end ? "No matching activity" : "No activity recorded yet"}</p><p className="mt-1 text-sm text-muted-foreground">{search || action !== "all" || start || end ? "Try clearing a filter or broadening the date range." : "Only actions recorded since Activity History was enabled are available."}</p></div>}
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
                <span className="text-muted-foreground">{total ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} of ${total} events` : "0 events"}</span>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</Button>
                    <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}</span>
                    <Button variant="outline" size="sm" disabled={loading || page * 20 >= total} onClick={() => setPage(value => value + 1)}>Next</Button>
                </div>
            </footer>
        </section>
    </div>
    </div>
}
