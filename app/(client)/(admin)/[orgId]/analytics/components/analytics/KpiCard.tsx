"use client"
import { Card, CardContent } from "@/app/components/ui/card"
import { ReactNode } from "react";

interface KpiCardProps {
    title: string;
    value: string | number;
    sub?: string;
    glow?: string;
    icon?: ReactNode;

}

export default function KpiCard({ title, value, sub, glow, icon }: KpiCardProps) {
    return (
        <Card className="rounded-2xl bg-card dark:bg-card transition border border-border dark:border-border">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">{title}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-foreground">{value}</p>
                        {sub && <p className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">{sub}</p>}
                    </div>
                    <div className={`ml-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br dark:bg-none ${glow}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
