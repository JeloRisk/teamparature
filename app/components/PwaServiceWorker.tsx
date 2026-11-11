"use client"

import { useEffect } from "react"

export default function PwaServiceWorker() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            void navigator.serviceWorker.register("/service-worker.js", { scope: "/" }).catch(() => {})
        }
    }, [])

    return null
}
