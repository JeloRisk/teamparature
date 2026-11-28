import { cn } from "@/lib/utils"
import MoodIcon, { type MoodName } from "./MoodIcon"

export default function MoodOrbit({ className, mood = "happy" }: { className?: string; mood?: MoodName }) {
    return (
        <div aria-hidden="true" className={cn("relative h-46 min-w-0 overflow-hidden rounded-3xl bg-[#f5f8ff] [container-type:size] sm:h-66 lg:h-86", className)}>
            <div className="absolute top-1/2 left-1/2 aspect-square w-2/3 max-w-[86cqh] -translate-x-1/2 -translate-y-1/2">
                <div className="absolute -inset-x-[22%] inset-y-[3%] -rotate-28 rounded-[50%] border border-primary/25" />
                <div className="absolute -inset-x-[13%] inset-y-[9%] rotate-32 rounded-[50%] border border-[#f97316]/35" />
                <div className="absolute inset-[18%] rounded-full bg-card/75" />
                <MoodIcon mood={mood === "sad" ? "neutral" : "sad"} className="absolute top-[11%] left-[-5%] w-[32%] -rotate-12" />
                <div className="absolute top-1/2 left-1/2 w-[62%] -translate-x-1/2 -translate-y-1/2 -rotate-8">
                    <MoodIcon key={mood} mood={mood} variant="mobile" className="w-full motion-safe:animate-in motion-safe:fade-in-50 motion-safe:zoom-in-95 motion-safe:duration-200" />
                </div>
                <MoodIcon mood={mood === "stressed" ? "excited" : "stressed"} className="absolute right-[-3%] bottom-[8%] w-[30%] rotate-12" />
            </div>
        </div>
    )
}
