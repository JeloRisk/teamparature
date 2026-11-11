import { Card } from "@/app/components/ui/card"

interface KpiCardProps {
    title: string;
    value: string | number;
    sub?: string;
}

export default function KpiCard({ title, value, sub }: KpiCardProps) {
    return (
        <Card className="h-full min-w-0 gap-0 rounded-2xl border-border p-4 sm:p-6">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="analytics-kpi-value mt-3 text-3xl font-semibold leading-none tracking-tight tabular-nums text-foreground">{value}</p>
            {sub && <p className="mt-3 max-w-[28ch] text-sm leading-5 text-muted-foreground">{sub}</p>}
        </Card>
    );
}
