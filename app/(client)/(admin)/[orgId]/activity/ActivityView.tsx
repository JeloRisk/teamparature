"use client"

import { TableSkeletonRows } from "@/app/components/loading/WorkspaceSkeletons"
import { useEffect, useState } from "react"
import { Input } from "@/app/components/ui/input"
import { History, RefreshCw, Search, ArrowUp, ArrowDown, ArrowUpDown, X, SlidersHorizontal, Mail, Settings2, Users } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/app/components/ui/sheet"
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

const actionIcons: Record<ActivityAction, typeof History> = {
    member_removed: Users,
    member_restored: Users,
    role_changed: Users,
    invitation_sent: Mail,
    invitation_resent: Mail,
    invitation_cancelled: Mail,
    workspace_updated: Settings2,
}

const outcomeStyles: Record<Entry["outcome"], { label: string; className: string }> = {
    succeeded: { label: "Completed", className: "bg-muted text-muted-foreground" },
    pending: { label: "Pending", className: "bg-[var(--mood-happy-soft)] text-foreground" },
    failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
}

function ActionLabel({ action }: { action: ActivityAction }) {
    const Icon = actionIcons[action]
    return <span className="inline-flex items-start gap-2">
        <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span>{activityActions[action]}</span>
    </span>
}

function OutcomeBadge({ outcome, detailed = false }: { outcome: Entry["outcome"]; detailed?: boolean }) {
    const appearance = outcomeStyles[outcome]
    const label = detailed && outcome === "failed" ? "Email delivery failed" : detailed && outcome === "pending" ? "Delivery pending" : appearance.label
    return <Badge variant="outline" className={`max-w-full shrink-0 rounded-full border-transparent px-2 whitespace-normal ${appearance.className}`}>{label}</Badge>
}

export default function ActivityView({ orgId, timezone }: { orgId: string; timezone: string }) {
    const [action, setAction] = useState("all")
    const [search, setSearch] = useState("")
    const [start, setStart] = useState("")
    const [end, setEnd] = useState("")
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [draftAction, setDraftAction] = useState("all")
    const [draftStart, setDraftStart] = useState("")
    const [draftEnd, setDraftEnd] = useState("")
    const filterCount = Number(action !== "all") + Number(Boolean(start)) + Number(Boolean(end))
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
                className={`group -ml-2 flex min-h-9 items-center gap-2 rounded-lg px-2 text-xs font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                aria-label={`Sort by ${column.label}, ${nextOrder}`}>
                {column.label}<Icon className={`size-3.5 ${active ? "opacity-100" : "opacity-40 group-hover:opacity-100"}`} aria-hidden="true" />
            </button>
        </TableHead>
    }

    return <div className="dashboard-reference-theme workspace-page-surface workspace-home-brand mobile-page activity-page -m-4 min-w-0 flex-1 px-4 py-4 sm:py-7 md:-mx-10 md:px-10">
    <div className="mobile-page-content mx-auto min-w-0 max-w-6xl space-y-4 sm:space-y-5">
        <header className="workspace-section-header flex items-center justify-between gap-3 border-b border-border pb-3 sm:pb-4">
            <div className="min-w-0">
                <h1 className="text-xl font-semibold leading-tight tracking-tight sm:text-3xl">Activity history</h1>
                <p className="mt-1.5 hidden max-w-2xl text-sm text-muted-foreground sm:block">Invitations, member changes, and workspace updates.</p>
            </div>
            <Button variant="outline" aria-label="Refresh activity" className="size-11 shrink-0 rounded-xl border-border bg-card p-0 sm:w-auto sm:px-3" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw aria-hidden="true" className={`size-4 ${loading ? "motion-safe:animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh</span></Button>
        </header>
        <section aria-label="Activity filters" className="@container sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:p-4">
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 @3xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,0.85fr)]">
                <div className="min-w-0 space-y-2">
                    <label htmlFor="activity-search" className="sr-only sm:not-sr-only sm:block sm:text-xs sm:font-medium sm:text-muted-foreground">Search activity</label>
                    <div className="flex items-center gap-2"><div className="relative min-w-0 flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <Input id="activity-search" className="h-11 rounded-xl border-border bg-card pl-9 pr-11" placeholder="Search activity…" value={search} maxLength={254} onChange={event => { setSearch(event.target.value); setPage(1) }} />
                        {search && <button type="button" aria-label="Clear search" className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-xl text-muted-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring" onClick={() => { setSearch(""); setPage(1) }}><X aria-hidden="true" className="size-4" /></button>}
                    </div><Button variant="outline" className={`h-11 shrink-0 rounded-xl px-3 text-sm sm:hidden ${filterCount ? "border-primary/35 bg-accent text-accent-foreground" : "bg-card"}`} onClick={() => { setDraftAction(action); setDraftStart(start); setDraftEnd(end); setFiltersOpen(true) }}><SlidersHorizontal className="size-4" aria-hidden="true" />Filters{filterCount > 0 && <span className="min-w-5 rounded-full bg-primary px-1.5 text-xs tabular-nums text-primary-foreground">{filterCount}</span>}</Button></div>
                </div>
                <div className="hidden min-w-0 space-y-2 sm:block">
                    <label htmlFor="activity-filter" className="block text-xs font-medium text-muted-foreground">Activity type</label>
                    <select id="activity-filter" value={action} onChange={event => { setAction(event.target.value); setPage(1) }} className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">
                        <option value="all">All activity</option>
                        {Object.entries(activityActions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                </div>
                <div className="hidden min-w-0 grid-cols-2 gap-3 sm:col-span-2 sm:grid">
                    <div className="min-w-0 space-y-2"><label htmlFor="activity-start" className="block text-xs font-medium text-muted-foreground">From</label><Input id="activity-start" className="h-11 w-full min-w-0 rounded-xl border-border bg-card px-3" type="date" value={start} max={end || undefined} onChange={event => { setStart(event.target.value); setPage(1) }} /></div>
                    <div className="min-w-0 space-y-2"><label htmlFor="activity-end" className="block text-xs font-medium text-muted-foreground">Through</label><Input id="activity-end" className="h-11 w-full min-w-0 rounded-xl border-border bg-card px-3" type="date" value={end} min={start || undefined} onChange={event => { setEnd(event.target.value); setPage(1) }} /></div>
                </div>
            </div>
        </section>
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetContent side="bottom" className="max-h-[90dvh] gap-0 rounded-t-2xl border-0 [&>button]:size-10 [&>button]:top-6 [&>button]:right-3 [&>button]:flex [&>button]:items-center [&>button]:justify-center">
                <div aria-hidden="true" className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/30" />
                <SheetHeader className="border-b border-border pr-16"><SheetTitle className="text-lg">Activity filters</SheetTitle><SheetDescription>Choose the activity and dates to show.</SheetDescription></SheetHeader>
                <form className="flex min-h-0 flex-1 flex-col" onSubmit={event => { event.preventDefault(); setAction(draftAction); setStart(draftStart); setEnd(draftEnd); setPage(1); setFiltersOpen(false) }}>
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                        <div className="space-y-2"><label htmlFor="mobile-activity-type" className="block text-sm font-medium">Activity type</label><select id="mobile-activity-type" value={draftAction} onChange={event => setDraftAction(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-base"><option value="all">All activity</option>{Object.entries(activityActions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
                        <fieldset className="min-w-0 space-y-3">
                            <div className="grid min-w-0 grid-cols-2 gap-3">
                                <div className="min-w-0 space-y-2"><label htmlFor="mobile-activity-from" className="block text-sm font-medium">Start date</label><Input id="mobile-activity-from" aria-describedby="activity-date-help" type="date" className="h-11 w-full min-w-0 rounded-xl px-2 text-base" value={draftStart} max={draftEnd || undefined} onChange={event => setDraftStart(event.target.value)} /></div>
                                <div className="min-w-0 space-y-2"><label htmlFor="mobile-activity-through" className="block text-sm font-medium">End date</label><Input id="mobile-activity-through" aria-describedby="activity-date-help" type="date" className="h-11 w-full min-w-0 rounded-xl px-2 text-base" value={draftEnd} min={draftStart || undefined} onChange={event => setDraftEnd(event.target.value)} /></div>
                            </div>
                            {(draftStart || draftEnd) && <button type="button" className="min-h-10 rounded-lg px-2 text-sm font-medium text-primary focus-visible:outline-2 focus-visible:outline-ring" onClick={() => { setDraftStart(""); setDraftEnd("") }}>Clear dates</button>}
                        </fieldset>
                    </div>
                    <div className="flex gap-3 border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"><Button type="button" variant="outline" className="min-h-11 flex-1 rounded-xl" onClick={() => { setDraftAction("all"); setDraftStart(""); setDraftEnd(""); setAction("all"); setStart(""); setEnd(""); setPage(1) }}>Reset</Button><Button type="submit" className="min-h-11 flex-1 rounded-xl">Apply filters</Button></div>
                </form>
            </SheetContent>
        </Sheet>
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
                                ? <span className="inline-flex rounded-lg bg-muted px-2 py-1 text-xs font-medium text-foreground">{entry.previousRole} → {entry.newRole}</span>
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
                    <h3 className="border-b border-border bg-muted/50 px-4 py-2 text-xs font-semibold tracking-wide text-foreground sm:px-5">{group.label}</h3>
                    <div className="divide-y divide-border">
                        {group.entries.map(entry => <article key={entry._id} className="space-y-1.5 px-4 py-3 sm:px-5 sm:py-3.5">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="break-words text-sm font-semibold leading-5 text-foreground"><ActionLabel action={entry.action} /></p>
                                    <p className="mt-0.5 break-words text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]">{entry.targetLabel}</p>
                                </div>
                                <OutcomeBadge outcome={entry.outcome} />
                            </div>
                            {(entry.action === "role_changed" || entry.action === "member_restored") && <p className="inline-flex rounded-lg bg-muted px-2 py-1 text-xs font-medium text-foreground">{entry.previousRole} → {entry.newRole}</p>}
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
