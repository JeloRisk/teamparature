import { Thermometer } from "lucide-react"
import { Skeleton } from "@/app/components/ui/skeleton"
import { TableCell, TableRow } from "@/app/components/ui/table"

const card = "rounded-3xl border border-border bg-card p-5 sm:p-6"

function Heading() {
    return <div aria-hidden="true" className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3"><Skeleton className="h-7 w-56 max-w-full" /><Skeleton className="h-3 w-64 max-w-full" /></div>
        <Skeleton className="h-10 w-36 rounded-xl" />
    </div>
}

export function ChartSkeleton() {
    return <div role="status" aria-label="Loading chart" className="space-y-5">
        <Skeleton className="h-4 w-36" />
        <div aria-hidden="true" className="flex h-48 items-end gap-3 border-b border-border px-2 pb-2">
            {[45, 60, 40, 75, 55, 80, 65].map((height, index) => <Skeleton key={index} className="flex-1 rounded-t-xl rounded-b-sm" style={{ height: `${height}%` }} />)}
        </div>
        <div className="flex justify-center gap-4"><Skeleton className="h-2 w-14" /><Skeleton className="h-2 w-14" /><Skeleton className="h-2 w-14" /></div>
    </div>
}

export function CheckInSkeleton() {
    return <div role="status" aria-label="Loading your check-in" className="space-y-6">
        <div className="flex items-center gap-2"><Thermometer className="size-4 text-primary/60" aria-hidden="true" /><Skeleton className="h-4 w-32" /></div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => <div key={i} className="flex flex-col items-center gap-3 rounded-xl border border-border p-3">
                <Skeleton className="size-10 rounded-full" /><Skeleton className="h-2 w-10" />
            </div>)}
        </div>
        <div className="space-y-3"><Skeleton className="h-3 w-44" /><div className="grid grid-cols-5 gap-2">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-11 rounded-xl" />)}</div></div>
        <div className="space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className="h-24 w-full rounded-xl" /></div>
        <Skeleton className="h-11 w-full rounded-xl sm:w-40" />
    </div>
}

export function DashboardSkeleton() {
    return <div role="status" aria-label="Loading workspace dashboard" className="max-w-7xl space-y-5 py-3">
        <Heading />
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
            <div className={`${card} space-y-4 bg-gradient-to-br from-card to-accent/50 sm:col-span-3`}>
                <div className="flex items-center gap-2"><Thermometer className="size-5 text-primary/60" aria-hidden="true" /><Skeleton className="h-4 w-36" /></div>
                <Skeleton className="h-12 w-32" /><Skeleton className="h-3 w-3/4" />
            </div>
            {Array.from({ length: 3 }, (_, i) => <div key={i} className={`${card} space-y-3`}><Skeleton className="size-10 rounded-2xl" /><Skeleton className="h-8 w-16" /><Skeleton className="h-3 w-24" /></div>)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
            <div className={card}><CheckInSkeleton /></div>
            <div className={card}><ChartSkeleton /></div>
        </div>
    </div>
}

export function AnalyticsSkeleton() {
    return <div role="status" aria-label="Loading team analytics" className="space-y-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className={`${card} space-y-4`}><Skeleton className="h-3 w-32" /><Skeleton className="h-8 w-24" /><Skeleton className="h-2 w-40 max-w-full" /></div>)}</div>
        <div className="grid gap-5 lg:grid-cols-2">
            <div className={`${card} space-y-6`}><Skeleton className="h-4 w-40" /><Skeleton className="mx-auto size-44 rounded-full" /></div>
            <div className={card}><ChartSkeleton /></div>
        </div>
        <div className={card}><ChartSkeleton /></div>
    </div>
}

export function TableSkeletonRows({ columns = 5, rows = 6, label = "Loading records" }: { columns?: number; rows?: number; label?: string }) {
    return <>{Array.from({ length: rows }, (_, row) => <TableRow key={row}>
        {Array.from({ length: columns }, (_, column) => <TableCell key={column} className="py-5">
            {row === 0 && column === 0 && <span role="status" className="sr-only">{label}</span>}
            <Skeleton className={column === 0 ? "h-4 w-28" : column === columns - 1 ? "h-6 w-20 rounded-full" : "h-3 w-32"} />
        </TableCell>)}
    </TableRow>)}</>
}

export function MembersSkeleton() {
    return <div role="status" aria-label="Loading workspace people" className="max-w-6xl space-y-6 py-4">
        <Heading />
        <div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <div key={i} className={`${card} flex items-center gap-4`}><Skeleton className="size-10 rounded-xl" /><div className="space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-7 w-12" /></div></div>)}</div>
        <div className="flex gap-3"><Skeleton className="h-10 w-56 rounded-xl" /><Skeleton className="h-10 w-36 rounded-xl" /></div>
        <div className={`${card} space-y-5`}>{Array.from({ length: 6 }, (_, i) => <div key={i} className="flex items-center gap-5 border-b border-border pb-4"><Skeleton className="size-10 shrink-0 rounded-xl" /><Skeleton className="h-3 w-1/3" /><Skeleton className="ml-auto h-6 w-20 rounded-full" /></div>)}</div>
    </div>
}


export function ActivitySkeleton() {
    return <div role="status" aria-label="Loading activity history" className="max-w-6xl space-y-6 py-4">
        <Heading />
        <div className={`${card} flex flex-wrap gap-3`}><Skeleton className="h-10 min-w-48 flex-1 rounded-xl" /><Skeleton className="h-10 w-40 rounded-xl" /><Skeleton className="h-10 w-40 rounded-xl" /></div>
        <div className={`${card} space-y-5`}>
            <div className="flex gap-6 border-b border-border pb-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-3 flex-1" />)}</div>
            {Array.from({ length: 6 }, (_, i) => <div key={i} className="flex gap-6 border-b border-border pb-4"><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 flex-1" /><Skeleton className="hidden h-4 flex-1 sm:block" /><Skeleton className="h-4 w-24" /></div>)}
        </div>
    </div>
}

export function OverviewSkeleton() {
    return <div role="status" aria-label="Loading personal mood overview" className="max-w-6xl space-y-6 py-5">
        <Heading />
        <div className={`${card} space-y-5`}>
            <div className="flex justify-between border-b border-border pb-4"><Skeleton className="h-5 w-44" /><Skeleton className="h-5 w-12" /></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">{Array.from({ length: 7 }, (_, i) => <div key={i} className="flex flex-col items-center gap-3 rounded-xl border border-border p-4">
                <Skeleton className="h-3 w-10" /><Skeleton className="size-10 rounded-full" /><Skeleton className="h-2 w-14" /><Skeleton className="h-2 w-6" />
            </div>)}</div>
        </div>
    </div>
}

export function SettingsSkeleton() {
    return <div role="status" aria-label="Loading workspace settings" className="max-w-3xl space-y-6 py-4">
        <Heading />
        <div className={`${card} space-y-6`}>
            <Skeleton className="h-5 w-40" />
            {[0, 1, 2].map(i => <div key={i} className="space-y-3"><Skeleton className="h-3 w-28" /><Skeleton className={`${i === 1 ? "h-24" : "h-10"} w-full rounded-xl`} /></div>)}
            <Skeleton className="ml-auto h-10 w-36 rounded-xl" />
        </div>
    </div>
}
