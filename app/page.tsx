"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, Info, MessagesSquare, ShieldCheck, Smile, UsersRound } from "lucide-react"
import BrandLockup from "@/app/components/BrandLockup"
import MoodIcon, { type MoodName } from "@/app/components/MoodIcon"
import PublicHeader from "@/app/components/PublicHeader"
import PublicMoodOrbit from "@/app/components/PublicMoodOrbit"
import { Button } from "@/app/components/ui/button"
import { cn } from "@/lib/utils"

const moods: { value: MoodName; label: string }[] = [
    { value: "happy", label: "Happy" },
    { value: "excited", label: "Excited" },
    { value: "neutral", label: "Neutral" },
    { value: "sad", label: "Sad" },
    { value: "stressed", label: "Stressed" },
]

type MoodSelection = {
    mood: MoodName
    onMoodChange: (mood: MoodName) => void
}

function MoodChoices({ mood, onMoodChange, name, compact = false }: MoodSelection & { name: string; compact?: boolean }) {
    return (
        <fieldset className={cn("min-w-0", compact && "mx-auto max-w-64")}>
            <legend className="sr-only">{compact ? "Choose the mood shown in the orbit" : "Choose a mood for the demo"}</legend>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {moods.map(option => (
                    <label key={option.value} className="relative min-w-0">
                        <input type="radio" name={name} value={option.value} checked={mood === option.value} onChange={() => onMoodChange(option.value)} className="peer sr-only" />
                        <span
                            style={compact ? undefined : { backgroundColor: `var(--mood-${option.value}-soft)` }}
                            className={cn(
                                "flex cursor-pointer touch-manipulation flex-col items-center justify-center rounded-xl border border-transparent hover:brightness-95 peer-checked:border-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                                compact ? "min-h-11 hover:bg-muted peer-checked:bg-accent" : "min-h-19 gap-0.5 border-border text-[10px] leading-4 font-semibold peer-checked:ring-1 peer-checked:ring-primary sm:min-h-23 sm:gap-1 sm:text-xs"
                            )}
                        >
                            <MoodIcon mood={option.value} variant="mobile" className={compact ? "size-8" : "size-8 sm:size-10"} />
                            <span className={compact ? "sr-only" : undefined}>{option.label}</span>
                        </span>
                    </label>
                ))}
            </div>
        </fieldset>
    )
}

function CheckInDemo({ mood, onMoodChange }: MoodSelection) {
    const [intensity, setIntensity] = useState(3)
    const moodLabel = moods.find(option => option.value === mood)?.label

    return (
        <section aria-labelledby="check-in-demo-heading" className="min-w-0 rounded-2xl border border-border bg-card px-3.5 py-4 sm:px-6 sm:py-6 md:px-4 lg:px-6">
            <div className="mb-4 flex items-center justify-between gap-2">
                <h3 id="check-in-demo-heading" className="text-lg leading-tight sm:text-xl">Try a mood check-in</h3>
                <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">Demo</span>
            </div>
            <MoodChoices mood={mood} onMoodChange={onMoodChange} name="demo-mood" />
            <fieldset className="mt-5 min-w-0 border-t border-border pt-4">
                <legend className="sr-only">How strong is that feeling?</legend>
                <div aria-hidden="true" className="mb-2.5 flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-semibold">How strong is that feeling?</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{intensity} of 5</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {[1, 2, 3, 4, 5].map(level => (
                        <label key={level} className="relative min-w-0">
                            <input type="radio" name="demo-intensity" value={level} aria-label={`Intensity ${level} of 5`} checked={intensity === level} onChange={() => setIntensity(level)} className="peer sr-only" />
                            <span className="grid min-h-11 cursor-pointer touch-manipulation place-items-center rounded-xl bg-muted text-sm font-semibold tabular-nums text-muted-foreground hover:bg-accent peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                                {level}
                            </span>
                        </label>
                    ))}
                </div>
            </fieldset>
            <p role="status" aria-atomic="true" className="mt-4 rounded-xl bg-muted px-3 py-3 text-sm leading-6 text-muted-foreground">
                You selected <strong className="text-foreground">{moodLabel}</strong> at intensity <strong className="text-foreground">{intensity} of 5</strong>.
            </p>
        </section>
    )
}

const steps = [
    { icon: Smile, title: "Check in daily", description: "Invite your teammates to pick a mood, rate how strongly they feel it, and add a note if they like." },
    { icon: CalendarDays, title: "Spot patterns over time", description: "Workspace owners can compare mood counts and participation across dates in Analytics." },
    { icon: MessagesSquare, title: "Talk about what changed", description: "Bring a pattern you noticed to your next team conversation and ask what helped or what’s been hard." },
]

export default function LandingPage() {
    const [mood, setMood] = useState<MoodName>("happy")

    return (
        <div className="brand-light-surface dashboard-reference-theme public-brand min-h-svh bg-background text-foreground">
            <PublicHeader>
                <nav aria-label="Product" className="hidden items-center gap-5 text-sm font-medium text-muted-foreground sm:flex">
                    <a href="#how-it-works" className="rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">How it works</a>
                    <a href="#data-visibility" className="rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">Privacy</a>
                </nav>
                <Link href="/login" className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    Sign in
                </Link>
            </PublicHeader>

            <main>
                <section aria-labelledby="landing-heading" className="border-b border-border bg-muted/45">
                    <div className="mx-auto grid max-w-6xl items-center gap-4 px-5 pt-9 pb-6 sm:gap-6 sm:px-8 sm:pt-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-9 md:py-12 lg:gap-16 lg:py-14">
                        <div className="min-w-0">
                            <h1 id="landing-heading" className="public-display max-w-lg text-balance text-[clamp(2.45rem,5.3vw,4.25rem)] leading-[1.07]">
                                See how your <span className="text-primary">team feels.</span>
                            </h1>
                            <p className="mt-4 max-w-sm text-pretty text-base leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
                                Give teammates a quick daily mood check-in. Use trends in mood and participation to guide your next team conversation.
                            </p>
                            <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 sm:mt-7 sm:gap-x-4">
                                <Button asChild className="min-h-11 rounded-lg px-2.5 text-xs font-semibold shadow-none sm:px-5 sm:text-sm">
                                    <Link href="/register">Create a workspace <ArrowRight className="size-3.5 sm:size-4" aria-hidden="true" /></Link>
                                </Button>
                                <a href="#how-it-works" className="inline-flex min-h-11 items-center rounded-lg text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring sm:px-1.5 sm:text-sm">
                                    How it works
                                </a>
                            </div>
                        </div>
                        <div id="features" className="min-w-0">
                            <PublicMoodOrbit mood={mood} className="h-[clamp(10.5rem,34vw,21rem)] rounded-none bg-transparent" />
                            <MoodChoices mood={mood} onMoodChange={setMood} name="orbit-mood" compact />
                        </div>
                    </div>
                </section>

                <div className="mx-auto max-w-6xl px-5 sm:px-8">
                    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="grid scroll-mt-8 items-center gap-7 py-10 sm:py-16 md:grid-cols-2 md:gap-10 lg:gap-16">
                        <div>
                            <h2 id="how-it-works-heading" className="max-w-md text-balance text-3xl leading-tight sm:text-4xl">Turn daily check-ins into better conversations.</h2>
                            <ol role="list" className="mt-6 space-y-5 sm:mt-8 sm:space-y-6">
                                {steps.map(({ icon: Icon, title, description }) => (
                                    <li key={title} className="flex gap-3.5">
                                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                                            <Icon className="size-4" aria-hidden="true" />
                                        </span>
                                        <div>
                                            <h3 className="text-base">{title}</h3>
                                            <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <CheckInDemo mood={mood} onMoodChange={setMood} />
                    </section>

                    <section id="data-visibility" aria-labelledby="privacy-heading" className="scroll-mt-8 border-t border-border py-10 sm:py-14">
                        <h2 id="privacy-heading" className="text-balance text-3xl leading-tight">Who can see your check-ins?</h2>
                        <div className="mt-5 grid gap-3 text-sm leading-6 sm:mt-6 sm:grid-cols-2 sm:gap-4">
                            <div className="rounded-xl border border-border p-4 sm:p-5">
                                <UsersRound className="mb-3 size-5 text-primary" aria-hidden="true" />
                                <h3 className="text-base">Workspace owners</h3>
                                <p className="mt-1 max-w-md text-muted-foreground">See combined mood counts and participation trends in team analytics.</p>
                            </div>
                            <div className="rounded-xl border border-border p-4 sm:p-5">
                                <ShieldCheck className="mb-3 size-5 text-primary" aria-hidden="true" />
                                <h3 className="text-base">Team members</h3>
                                <p className="mt-1 max-w-md text-muted-foreground">Review your own check-in history. Individual notes stay out of team analytics.</p>
                            </div>
                        </div>
                        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                            <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                            In a very small team, patterns may make individual responses easier to infer.
                        </p>
                    </section>

                    <section aria-labelledby="get-started-heading" className="mb-9 grid min-w-0 items-center gap-3 rounded-2xl border border-primary/15 bg-accent px-5 pt-4 pb-8 text-center sm:px-8 md:mb-14 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:gap-6 md:px-10 md:py-9 md:text-left lg:px-14 lg:py-10">
                        <PublicMoodOrbit mood={mood} className="mx-auto h-28 w-full max-w-64 rounded-none bg-transparent md:order-last md:h-52 md:max-w-80 lg:h-56" />
                        <div className="min-w-0">
                            <h2 id="get-started-heading" className="mx-auto max-w-[19ch] text-balance text-3xl leading-tight md:mx-0 md:text-4xl lg:text-[2.75rem]">A better team conversation starts with <span className="text-primary">a check-in.</span></h2>
                            <p className="mx-auto mt-3 max-w-[43ch] text-pretty text-sm leading-6 text-muted-foreground md:mx-0 md:text-base">Create a workspace, invite your teammates, and give everyone a moment to share how they feel.</p>
                            <Link href="/register" className="group mt-6 inline-flex min-h-11 items-center gap-2.5 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
                                Create a workspace <ArrowRight className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                            </Link>
                        </div>
                    </section>
                </div>
            </main>

            <footer id="contact" className="border-t border-border">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-5 gap-y-2 px-5 py-5 text-xs text-muted-foreground sm:px-8">
                    <Link href="/" aria-label="Teamparature home" className="inline-flex min-h-11 items-center rounded-lg text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                        <BrandLockup labelClassName="text-base" />
                    </Link>
                    <nav aria-label="Footer" className="flex gap-4">
                        <a href="#data-visibility" className="inline-flex min-h-11 items-center hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">Privacy</a>
                        <Link href="/login" className="inline-flex min-h-11 items-center hover:text-primary focus-visible:outline-2 focus-visible:outline-ring">Sign in</Link>
                    </nav>
                </div>
            </footer>
        </div>
    )
}

