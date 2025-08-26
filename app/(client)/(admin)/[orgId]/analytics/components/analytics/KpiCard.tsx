"use client"
import { Card, CardHeader, CardContent } from "@/app/components/ui/card"
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
        <Card className="rounded-2xl bg-white transition border border-slate-200">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
                        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
                    </div>
                    <div className={`ml-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${glow}`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
