import { Card } from "@/app/components/ui/card"

interface KpiCardProps {
    title: string;
    value: string | number;
    sub?: string;
    mobileSub?: string;
    indicatorPercent?: number | null;
    moodEmoji?: string;
    indicatorColor?: string;
}

export default function KpiCard({ title, value, sub, mobileSub, indicatorPercent, moodEmoji, indicatorColor }: KpiCardProps) {
    return (
        <Card className="h-full min-w-0 gap-0 rounded-2xl border-border p-4 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="analytics-kpi-value mt-3 text-[1.75rem] font-semibold leading-none tracking-tight tabular-nums text-primary sm:text-3xl">{value}</p>
            {sub && <p className="mt-2 max-w-[28ch] text-xs leading-5 text-muted-foreground sm:mt-3 sm:text-sm"><span className="sm:hidden">{mobileSub ?? sub}</span><span className="hidden sm:inline">{sub}</span></p>}
            {indicatorPercent !== undefined && <div className="mt-4 flex items-center gap-2.5" aria-label={`${Math.round(indicatorPercent ?? 0)} percent positive mood check-ins`}>
                <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${Math.round(indicatorPercent ?? 0)}%`}>
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(0, Math.min(100, indicatorPercent ?? 0))}%`, backgroundColor: indicatorColor ?? "var(--mood-happy)" }} />
                </div>
                {moodEmoji && <span className="text-lg leading-none" aria-hidden="true">{moodEmoji}</span>}
            </div>}
        </Card>
    );
}
