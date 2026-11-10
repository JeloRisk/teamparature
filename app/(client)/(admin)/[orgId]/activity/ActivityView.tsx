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

    return <div className="-m-4 flex-1 bg-background px-4 py-6 md:-mx-10 md:px-10 sm:py-8">
    <div className="mx-auto max-w-7xl space-y-6 sm:space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
            <div>
                <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Activity history</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">A record of invitations, membership changes, and workspace updates.</p>
            </div>
            <Button variant="outline" disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh</Button>
        </header>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="space-y-4 border-b border-border p-4 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,1.5fr)_minmax(12rem,1fr)_minmax(9rem,0.8fr)_minmax(9rem,0.8fr)]">
                <div className="min-w-0 space-y-2 sm:col-span-2 xl:col-span-1">
                    <label htmlFor="activity-search" className="block text-xs font-medium text-muted-foreground">Search activity</label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
                        <Input id="activity-search" className="h-10 rounded-xl bg-background pl-9 pr-9" placeholder="Person, email, or activity…" value={search} maxLength={254} onChange={event => { setSearch(event.target.value); setPage(1) }} />
                        {search && <button type="button" aria-label="Clear search" className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-accent" onClick={() => { setSearch(""); setPage(1) }}><X className="size-4" /></button>}
                    </div>
                </div>
                <div className="space-y-2 sm:col-span-2 xl:col-span-1">
                    <label htmlFor="activity-filter" className="block text-xs font-medium text-muted-foreground">Activity type</label>
                    <select id="activity-filter" value={action} onChange={event => { setAction(event.target.value); setPage(1) }} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring">
                        <option value="all">All activity</option>
                        {Object.entries(activityActions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                </div>
                <div className="min-w-0 space-y-2"><label htmlFor="activity-start" className="block text-xs font-medium text-muted-foreground">From</label><Input id="activity-start" className="h-10 w-full min-w-0 rounded-xl bg-background" type="date" value={start} max={end || undefined} onChange={event => { setStart(event.target.value); setPage(1) }} /></div>
                <div className="min-w-0 space-y-2"><label htmlFor="activity-end" className="block text-xs font-medium text-muted-foreground">Through</label><Input id="activity-end" className="h-10 w-full min-w-0 rounded-xl bg-background" type="date" value={end} min={start || undefined} onChange={event => { setEnd(event.target.value); setPage(1) }} /></div>
            </div>
            </div>
            <p className="px-4 pt-3 text-xs text-muted-foreground lg:hidden">On narrow screens, scroll the table horizontally to view all activity details.</p>
            <Table aria-label="Workspace activity history" className="w-full min-w-[40rem] table-fixed">
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
                        <TableCell className="whitespace-normal break-words leading-snug">{activityActions[entry.action]}</TableCell>
                        <TableCell className="max-w-64 whitespace-normal break-words leading-snug">{entry.targetLabel}</TableCell>
                        <TableCell className="whitespace-normal">
                            {entry.outcome === "failed" ? <Badge variant="outline" className="border-red-200 text-red-700 dark:text-red-300">Email delivery failed</Badge>
                            : entry.outcome === "pending" ? <Badge variant="outline">Delivery pending</Badge>
                            : entry.action === "role_changed" || entry.action === "member_restored" ? <span className="text-xs capitalize text-muted-foreground">{entry.previousRole} → {entry.newRole}</span>
                            : <Badge variant="secondary">Completed</Badge>}
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
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
                <span className="text-muted-foreground">{total ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, total)} of ${total} events` : "0 events"}</span>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</Button>
                    <span>Page {page} of {Math.max(1, Math.ceil(total / 20))}</span>
                    <Button variant="outline" size="sm" disabled={loading || page * 20 >= total} onClick={() => setPage(value => value + 1)}>Next</Button>
                </div>
            </footer>
        </div>
    </div>
    </div>
}
