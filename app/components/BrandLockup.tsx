import Image from "next/image"
import { cn } from "@/lib/utils"

export function BrandMark() {
    return (
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#f1f5ff]">
            <Image src="/logo.png" alt="" width={26} height={26} className="size-[26px] object-contain" />
        </span>
    )
}

export default function BrandLockup({ className, labelClassName }: { className?: string; labelClassName?: string }) {
    return (
        <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
            <BrandMark />
            <span className={cn("brand-wordmark truncate text-lg leading-tight", labelClassName)}>Teamparature</span>
        </span>
    )
}
