"use client"

import { useEffect, useState } from "react"
import { Download, Share } from "lucide-react"
import { Button } from "@/app/components/ui/button"

type InstallPromptEvent = Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export default function InstallAppCard() {
    const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
    const [installed, setInstalled] = useState(false)
    const [isIOS, setIsIOS] = useState(false)
    const [installError, setInstallError] = useState(false)

    useEffect(() => {
        const standalone = window.matchMedia("(display-mode: standalone)").matches ||
            ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
        setInstalled(standalone)
        setIsIOS(/iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
            (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1))

        const onInstallAvailable = (event: Event) => {
            event.preventDefault()
            setInstallPrompt(event as InstallPromptEvent)
        }
        const onInstalled = () => {
            setInstalled(true)
            setInstallPrompt(null)
        }

        window.addEventListener("beforeinstallprompt", onInstallAvailable)
        window.addEventListener("appinstalled", onInstalled)
        return () => {
            window.removeEventListener("beforeinstallprompt", onInstallAvailable)
            window.removeEventListener("appinstalled", onInstalled)
        }
    }, [])

    if (installed) return null

    const install = async () => {
        if (!installPrompt) return
        setInstallError(false)
        try {
            await installPrompt.prompt()
            const choice = await installPrompt.userChoice
            if (choice.outcome === "accepted") setInstalled(true)
            setInstallPrompt(null)
        } catch {
            setInstallError(true)
        }
    }

    return <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-labelledby="install-app-heading">
        <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary" aria-hidden="true">
                {isIOS ? <Share className="size-5" /> : <Download className="size-5" />}
            </span>
            <div className="min-w-0 flex-1">
                <h2 id="install-app-heading" className="text-base font-semibold">Take Teamparature with you</h2>
                {installPrompt ? <>
                    <p className="mt-1 text-sm text-muted-foreground">Add it to your home screen for a focused, app-like experience.</p>
                    <Button type="button" onClick={install} className="mt-3 h-11 rounded-xl px-4">Install app</Button>
                    {installError && <p role="alert" className="mt-2 text-sm text-destructive">Couldn’t open the install prompt. Try your browser menu instead.</p>}
                </> : isIOS ? <p className="mt-1 text-sm text-muted-foreground">Tap Share in Safari, then choose “Add to Home Screen.”</p> : <p className="mt-1 text-sm text-muted-foreground">Use your browser menu to add this page to your home screen.</p>}
            </div>
        </div>
    </section>
}
