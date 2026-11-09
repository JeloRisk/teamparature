interface KpiCardProps {
    title: string;
    value: string | number;
    sub?: string;
}

export default function KpiCard({ title, value, sub }: KpiCardProps) {
    return (
        <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-foreground">{value}</p>
            {sub && <p className="mt-1.5 max-w-[28ch] text-sm leading-5 text-muted-foreground">{sub}</p>}
        </div>
    );
}
