import Image from "next/image"
import Link from "next/link"

export default function AuthBrandPanel() {
    return (
        <aside className="relative flex w-full flex-col justify-between overflow-hidden rounded-[28px] border border-white bg-gradient-to-br from-[#fbfcff] via-[#edf2ff] to-[#dfe7ff] px-8 pb-9 pt-8 text-[#25264e] xl:px-12 xl:pb-10 xl:pt-10">
            <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full bg-[#b7c8ff]/35 blur-3xl" />
            <svg aria-hidden="true" viewBox="0 0 160 70" className="pointer-events-none absolute right-4 top-12 h-16 w-28 fill-white/65">
                <path d="M8 59c7-19 23-23 37-19C61 11 97 14 110 38c19-1 33 6 40 21Z" />
            </svg>
            <svg aria-hidden="true" viewBox="0 0 160 70" className="pointer-events-none absolute right-6 top-52 h-9 w-20 fill-white/50">
                <path d="M8 59c7-19 23-23 37-19C61 11 97 14 110 38c19-1 33 6 40 21Z" />
            </svg>
            <Link href="/" aria-label="Teamparature home" className="relative z-10 mb-10 inline-flex w-fit items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5d61f5]">
                <Image src="/logo.png" alt="" width={34} height={34} />
                <span className="text-lg font-semibold tracking-tight text-[#5474ff]">Teamparature</span>
            </Link>
            <div className="relative z-10">
                <svg aria-hidden="true" viewBox="0 0 48 40" className="mb-2 -ml-5 h-9 w-11 text-[#8785ff]" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
                    <path d="m8 29 11 6M20 11l8 14M40 6l1 17" />
                </svg>
                <h2 className="max-w-md text-3xl font-bold leading-[1.12] tracking-tight xl:text-[36px]">
                    Keep your team at the <span className="text-[#5d61f5]">perfect temperature.</span>
                </h2>
                <p className="mt-5 max-w-sm text-sm leading-7 text-[#606c92]">
                    A simple daily check-in helps you understand how your team feels and start more thoughtful conversations.
                </p>
            </div>

            <div aria-hidden="true" className="pointer-events-none relative -mx-8 mt-4 h-44 shrink-0 xl:-mx-12 xl:h-48">
                <svg viewBox="0 0 700 260" preserveAspectRatio="none" className="absolute inset-0 size-full">
                    <defs>
                        <linearGradient id="auth-sun" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#f6d590" /><stop offset="1" stopColor="#fff0cb" /></linearGradient>
                        <linearGradient id="auth-hills-back" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c6d5ff" /><stop offset="1" stopColor="#edf2ff" /></linearGradient>
                        <linearGradient id="auth-hills-front" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#aabfff" /><stop offset="1" stopColor="#edf2ff" stopOpacity="0" /></linearGradient>
                    </defs>
                    <circle cx="535" cy="118" r="67" fill="url(#auth-sun)" />
                    <path d="M0 175C95 120 150 85 245 140S355 122 420 105S520 178 590 125S665 105 700 120V260H0Z" fill="url(#auth-hills-back)" />
                    <path d="M0 190C80 140 120 200 180 180S290 125 365 150S460 206 535 145S635 40 700 70V260H0Z" fill="url(#auth-hills-front)" />
                </svg>
            </div>

        </aside>
    )
}
