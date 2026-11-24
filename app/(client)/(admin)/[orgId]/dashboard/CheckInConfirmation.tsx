import MoodIcon from "@/app/components/MoodIcon"
import type { OwnCheckIn } from "@/app/stores/useMoodStore"
import { Check } from "lucide-react"

export default function CheckInConfirmation({ checkIn, timezone }: { checkIn?: OwnCheckIn | null; timezone?: string }) {
    return (
        <div role="status" className="flex items-center gap-3">
            {checkIn ? (
                <MoodIcon mood={checkIn.mood} variant="mobile" className="size-12 shrink-0" />
            ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-primary">
                    <Check className="size-4" aria-hidden="true" />
                </span>
            )}
            <div className="min-w-0">
                <p className="font-semibold leading-5">Checked in today</p>
                {checkIn && <p className="mt-0.5 text-sm text-muted-foreground">
                    <span className="capitalize">{checkIn.mood}</span>
                    {" · "}
                    <time dateTime={checkIn.date}>
                        {new Date(checkIn.date).toLocaleTimeString(undefined, { timeZone: timezone, hour: "numeric", minute: "2-digit" })}
                    </time>
                </p>}
            </div>
        </div>
    )
}
