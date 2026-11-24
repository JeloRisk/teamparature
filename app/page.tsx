"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import BrandLockup from "@/app/components/BrandLockup";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Thermometer } from "lucide-react";
import MoodIcon, { type MoodName } from "@/app/components/MoodIcon";


const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
  </svg>
);

const demoMoods: { value: MoodName; label: string; color: string }[] = [
  { value: "happy", label: "Happy", color: "bg-[var(--mood-happy-soft)]" },
  { value: "excited", label: "Excited", color: "bg-[var(--mood-excited-soft)]" },
  { value: "neutral", label: "Neutral", color: "bg-[var(--mood-neutral-soft)]" },
  { value: "sad", label: "Sad", color: "bg-[var(--mood-sad-soft)]" },
  { value: "stressed", label: "Stressed", color: "bg-[var(--mood-stressed-soft)]" },
];


export default function LandingPage() {
  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [demoMood, setDemoMood] = useState<MoodName>("happy");
  const [demoIntensity, setDemoIntensity] = useState(3);
  const demoMoodLabel = demoMoods.find((mood) => mood.value === demoMood)?.label ?? "Happy";

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>(".landing-page [data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("landing-motion-ready");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -36px 0px" });

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("landing-motion-ready");
    };
  }, []);

  return (
    <main className="landing-page brand-light-surface dashboard-reference-theme relative flex min-h-screen flex-col overflow-hidden bg-background font-sans text-foreground">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-card px-5 py-3 sm:px-8 lg:px-16">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <Link href="/" aria-label="Teamparature home" className="shrink-0 rounded-lg text-primary focus-visible:outline-2 focus-visible:outline-ring">
              <BrandLockup />
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
              <a href="#features" className="transition-colors hover:text-blue-600">Features</a>
              <a href="#how-it-works" className="transition-colors hover:text-blue-600">How it works</a>
              <a href="#data-visibility" className="transition-colors hover:text-blue-600">Data & privacy</a>
            </nav>
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <button onClick={() => router.push("/login")} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">Log in</button>
              <Button onClick={() => router.push("/register")} className="rounded-xl px-5 py-2.5 font-semibold">Create a workspace</Button>
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-xl p-2 text-slate-700 transition hover:bg-blue-50 md:hidden" aria-label={isMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMenuOpen} aria-controls="landing-mobile-navigation">
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </header>

        <nav id="landing-mobile-navigation" aria-label="Mobile navigation" className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-white px-6 transition-all duration-300 md:hidden ${isMenuOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"}`}>
          <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg font-semibold text-slate-700">Features</a>
          <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-lg font-semibold text-slate-700">How it works</a>
          <a href="#data-visibility" onClick={() => setIsMenuOpen(false)} className="text-lg font-semibold text-slate-700">Data & privacy</a>
          <button onClick={() => { router.push("/login"); setIsMenuOpen(false) }} className="w-full max-w-xs rounded-xl border border-blue-200 py-3 font-semibold text-blue-700">Log in</button>
          <Button onClick={() => { router.push("/register"); setIsMenuOpen(false) }} className="w-full max-w-xs rounded-xl py-3 font-semibold">Create a workspace</Button>
        </nav>

      <section className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 pb-12 pt-24 sm:px-8 sm:pb-20 sm:pt-32 lg:grid-cols-2 lg:gap-14 lg:px-12">
        <div className="min-w-0">
          <h1 className="max-w-xl text-4xl leading-[1.08] sm:text-5xl lg:text-6xl">
            Understand how your team is feeling.
          </h1>
          <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
            A quick daily mood check-in helps teams notice patterns and start better conversations.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button onClick={() => router.push("/register")} className="min-h-11 rounded-xl px-5 font-semibold">
              Create a workspace <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <a href="#how-it-works" className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-primary hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">See how it works</a>
          </div>
        </div>
          <div id="features" className="min-w-0 scroll-mt-24">
            <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg leading-tight sm:text-xl">Try a mood check-in</h2>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">Demo</span>
              </div>
              <div role="group" aria-label="Choose a mood" className="mt-4 grid grid-cols-5 gap-1 sm:gap-2">
                {demoMoods.map(({ value, label, color }) => (
                  <button key={value} type="button" onClick={() => setDemoMood(value)} aria-pressed={demoMood === value} className={`flex min-h-20 min-w-0 flex-col items-center justify-center gap-2 rounded-xl border py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:min-h-24 ${color} ${demoMood === value ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"}`}><MoodIcon mood={value} variant="mobile" className="size-8 sm:size-10" /><span className="max-w-full break-words text-[10px] font-semibold text-foreground sm:text-xs">{label}</span></button>
                ))}
              </div>
              <div className="mt-7 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-800">How strong is that feeling?</span><span className="text-slate-500">{demoIntensity} of 5</span></div>
                <div role="group" aria-label="Choose feeling intensity" className="mt-3 flex gap-2">{[1,2,3,4,5].map((level) => <button key={level} type="button" onClick={() => setDemoIntensity(level)} aria-pressed={demoIntensity === level} aria-label={`Intensity ${level} of 5`} className={`grid h-9 flex-1 place-items-center rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${demoIntensity === level ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-800"}`}>{level}</button>)}</div>
              </div>
              <div aria-live="polite" className="mt-5 flex items-center gap-3 rounded-2xl bg-[#f6f7fb] p-4"><p className="text-sm leading-6 text-slate-600">You selected <span className="font-semibold text-slate-800">{demoMoodLabel}</span> at intensity <span className="font-semibold text-slate-800">{demoIntensity} of 5</span>.</p></div>
            </div>
          </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-white px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div data-reveal className="landing-reveal max-w-2xl">
            {/* <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">Thoughtfully simple</p> */}
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">A healthier rhythm, one check-in at a time.</h2>
          </div>
          <div className="mt-12 grid border-t border-slate-200 md:grid-cols-3">
            {[["01", "Check in", "Choose a mood and intensity in a few moments. Notes are optional."], ["02", "Notice patterns", "Use trends and participation to see how the team is doing over time."], ["03", "Start a conversation", "Treat the data as a prompt to listen, not a verdict about anyone."]].map(([number, title, copy], index) => (
              <article data-reveal key={number} className={`landing-reveal border-b border-slate-200 py-7 md:border-b-0 md:py-8 ${index > 0 ? "md:border-l md:pl-8" : "md:pr-8"}`} style={{ transitionDelay: `${index * 100}ms` }}>
                <span className="text-sm font-bold tracking-[0.18em] text-blue-700">{number}</span><h3 className="mt-5 text-xl font-bold text-slate-950">{title}</h3><p className="mt-3 max-w-sm text-sm leading-7 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="data-visibility" className="scroll-mt-24 bg-[#f4f6ff] px-6 py-20 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-slate-950 sm:text-4xl">Clear about what workspace owners can see.</h2>
          <div className="space-y-4 text-base leading-7 text-slate-700">
            <p>Owners see aggregate mood counts and participation trends. Individual check-in notes aren’t included in team analytics.</p>
            <p>Each person can view their own check-in history. In a very small team, group patterns may still make individual responses easier to infer.</p>
            <p className="text-sm text-slate-600">Use team trends as a starting point for conversation, not as a verdict about anyone.</p>
          </div>
        </div>
      </section>

      <section id="contact" className="bg-gradient-to-b from-white via-blue-50/40 to-white px-6 pb-24 pt-16 md:px-12 md:pb-28 md:pt-24">
        <div data-reveal className="landing-reveal relative mx-auto grid min-h-[30rem] max-w-7xl items-center overflow-hidden rounded-[2rem] border border-white/10 bg-[#171a2b] px-7 py-12 shadow-[0_30px_90px_-42px_rgba(23,26,43,0.7)] sm:px-12 md:grid-cols-[1.1fr_0.9fr] md:px-16 md:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-[-8rem] size-96 rounded-full bg-blue-600/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-[-10rem] size-96 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-center py-4 md:min-h-[22rem]">
            {/* <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-200"><span className="size-2 rounded-full bg-orange-400" />A calmer way to check in</p> */}
            <h2 className="mt-5 max-w-2xl text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-[2.8rem]">Make space for your team to be heard.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">Create a workspace and build a check-in rhythm that works for your team.</p>
            <div className="mt-8"><Button onClick={() => router.push("/register")} className="rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-400">Create a workspace <ArrowRight className="ml-2 size-4" aria-hidden="true" /></Button></div>
          </div>
          <div aria-hidden="true" className="relative mx-auto mt-8 flex aspect-square w-full max-w-[19rem] items-center justify-center md:mt-0 md:max-w-[21rem]">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-[12%] rounded-full border border-blue-200/15" />
            <div className="absolute inset-[25%] rounded-full bg-gradient-to-br from-blue-500/20 via-white/[0.04] to-orange-400/20 blur-sm" />
            <div className="relative grid size-36 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-6xl shadow-[0_0_80px_rgba(96,133,255,0.15)] backdrop-blur sm:size-40"><Thermometer className="size-20 text-blue-100" strokeWidth={1.4} /></div>
            <span className="absolute bottom-[16%] right-[4%] size-2 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(253,186,116,0.8)]" />
          </div>
        </div>
      </section>

      <footer className="border-t border-blue-100 bg-white px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Link href="/" className="flex items-center gap-2 font-semibold text-blue-700">
            <BrandLockup />
          </Link>
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600">How it works</a>
            <a href="#data-visibility" className="hover:text-blue-600">Data & privacy</a>
            <button onClick={() => router.push("/login")} className="hover:text-blue-600">Log in</button>
          </nav>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Teamparature</p>
        </div>
      </footer>
    </main>
  );
}

