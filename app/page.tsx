"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/app/components/ui/button";
import gsap from "gsap";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from "lucide-react";


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


export default function LandingPage() {
  const router = useRouter();

  const emojiRefs = useRef<HTMLSpanElement[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  const addEmojiRef = (el: HTMLSpanElement) => {
    if (el && !emojiRefs.current.includes(el)) emojiRefs.current.push(el);
  };
  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isMenuOpen]);

  useEffect(() => {
    // Animate each emoji in random paths
    emojiRefs.current.forEach((el) => {
      gsap.to(el, {
        x: "+=" + (Math.random() * 100 - 50),
        y: "+=" + (Math.random() * 80 - 40),
        rotation: Math.random() * 360 - 180,
        repeat: -1,
        yoyo: true,
        duration: 3 + Math.random() * 4,
        ease: "sine.inOut",
      });
    });
  }, []);

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



  const emojis = [
    { char: "🔥", size: 40 },
    { char: "❄️", size: 36 },
    { char: "🔥", size: 32 },
    { char: "❄️", size: 28 },
    { char: "🔥", size: 36 },
    { char: "❄️", size: 32 },
  ];

  const bgBlobs = [
    { color: "rgba(59, 130, 246, 0.25)", size: 300, top: "10%", left: "5%" },
    { color: "rgba(251, 146, 60, 0.25)", size: 400, top: "50%", left: "70%" },
    { color: "rgba(59, 130, 246, 0.25)", size: 250, top: "70%", left: "20%" },
  ];

  return (
    <main className="landing-page bg-blue-50 text-gray-900 [color-scheme:light] min-h-screen flex flex-col font-sans relative overflow-hidden">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-blue-100/80 bg-white/90 px-5 py-3 shadow-sm backdrop-blur-xl sm:px-8 lg:px-16">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <Link href="/" aria-label="Teamparature home" className="flex shrink-0 items-center gap-2 text-xl font-bold tracking-tight text-blue-700">
              <Image src="/logo.png" alt="" width={34} height={34} />
              Teamparature
            </Link>
            <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
              <a href="#features" className="transition-colors hover:text-blue-600">Features</a>
              <a href="#how-it-works" className="transition-colors hover:text-blue-600">How it works</a>
            </nav>
            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <button onClick={() => router.push("/login")} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">Log in</button>
              <Button onClick={() => router.push("/register")} className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700">Create workspace</Button>
            </div>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-xl p-2 text-slate-700 transition hover:bg-blue-50 md:hidden" aria-label={isMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMenuOpen}>
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </header>

        <div className={`fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-white/95 px-6 backdrop-blur-xl transition-all duration-300 md:hidden ${isMenuOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"}`}>
          <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg font-semibold text-slate-700">Features</a>
          <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-lg font-semibold text-slate-700">How it works</a>
          <button onClick={() => { router.push("/login"); setIsMenuOpen(false) }} className="w-full max-w-xs rounded-xl border border-blue-200 py-3 font-semibold text-blue-700">Log in</button>
          <Button onClick={() => { router.push("/register"); setIsMenuOpen(false) }} className="w-full max-w-xs rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">Create workspace</Button>
        </div>

      {/* Hero Section - min-h-screen ensures it fills the viewport */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-24 md:py-36 min-h-screen overflow-hidden">
        {/* Background Blobs */}
        {bgBlobs.map((b, idx) => (
          <div
            key={idx}
            className="absolute rounded-full pointer-events-none filter blur-3xl"
            style={{
              width: b.size,
              height: b.size,
              top: b.top,
              left: b.left,
              backgroundColor: b.color,
            }}
          />
        ))}

        {/* Floating Emojis */}
        <div className="absolute inset-0 z-0">
          {emojis.map((e, idx) => (
            <span
              key={idx}
              ref={addEmojiRef}
              className="absolute pointer-events-none select-none"
              style={{
                fontSize: `${e.size}px`,
                top: `${Math.random() * 70 + 10}%`,
                left: `${Math.random() * 80 + 10}%`,
              }}
            >
              {e.char}
            </span>
          ))}
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-gray-900 max-w-3xl relative z-10 px-4">
          Keep Your Team at the Perfect Temperature
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-700 mt-6 max-w-2xl relative z-10 px-4">
          Real-time insights into your team&aposs mood and energy for better collaboration and happiness.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center relative z-10">
          <Button onClick={() => router.push("/register")} className="bg-blue-500 text-white hover:bg-blue-600 font-semibold px-7 py-3 rounded-xl shadow-lg shadow-blue-500/20">
            Create your workspace
          </Button>
          <Button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} variant="outline" className="border-blue-200 bg-white/70 text-gray-800 hover:bg-white font-semibold px-7 py-3 rounded-xl">
            Explore features
          </Button>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 relative overflow-hidden bg-[#f4f6ff] px-6 py-24 md:px-12 md:py-32">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-24 size-96 rounded-full bg-blue-200/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-0 size-80 rounded-full bg-orange-200/35 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div data-reveal className="landing-reveal">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">A daily moment, made easy</p>
            <h2 className="mt-5 max-w-xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">Notice the feeling. Make room for the conversation.</h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">A quick check-in helps people pause and reflect. Over time, the team can see patterns without reducing anyone to a number.</p>
            <a href="#how-it-works" className="mt-8 inline-flex items-center gap-2 font-semibold text-blue-700 transition hover:gap-3">How it works <ArrowRight className="size-4" /></a>
          </div>

          <div data-reveal className="landing-reveal relative mx-auto w-full max-w-2xl">
            <div aria-hidden="true" className="absolute -inset-4 rotate-[-3deg] rounded-[2rem] bg-gradient-to-br from-blue-200/70 via-white to-orange-200/70" />
            <div className="relative rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_30px_90px_-45px_rgba(46,67,140,0.42)] sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">A check-in can be simple</p><h3 className="mt-2 text-xl font-bold text-slate-950">How are you feeling today?</h3></div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">Example</span>
              </div>
              <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-3">
                {[["🙂", "Happy", "bg-amber-50"], ["🤩", "Excited", "bg-orange-50"], ["😐", "Neutral", "bg-slate-100"], ["😔", "Sad", "bg-blue-50"], ["😣", "Stressed", "bg-indigo-50"]].map(([emoji, mood, color]) => (
                  <div key={mood} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/80 ${color} px-1 py-3 sm:min-h-24`}><span className="text-2xl sm:text-3xl">{emoji}</span><span className="text-[10px] font-semibold text-slate-700 sm:text-xs">{mood}</span></div>
                ))}
              </div>
              <div className="mt-7 border-t border-slate-100 pt-5">
                <div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-800">How strong is that feeling?</span><span className="text-slate-500">3 of 5</span></div>
                <div className="mt-3 flex gap-2">{[1,2,3,4,5].map((level) => <span key={level} className={`grid h-9 flex-1 place-items-center rounded-xl text-sm font-semibold ${level === 3 ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-500"}`}>{level}</span>)}</div>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#f6f7fb] p-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-lg shadow-sm">✦</span><p className="text-sm leading-6 text-slate-600">A small pause to check in with yourself.</p></div>
              <p className="mt-4 text-center text-xs text-slate-400">Illustrative example · no real team data</p>
            </div>
            <div aria-hidden="true" className="absolute -right-5 -top-7 grid size-14 place-items-center rounded-2xl border border-white bg-white text-2xl shadow-lg shadow-blue-950/10">❄️</div>
            <div aria-hidden="true" className="absolute -bottom-5 -left-5 grid size-14 place-items-center rounded-2xl border border-white bg-white text-2xl shadow-lg shadow-orange-950/10">🔥</div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-white px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div data-reveal className="landing-reveal max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">Thoughtfully simple</p>
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

      <section id="contact" className="bg-gradient-to-b from-white via-blue-50/40 to-white px-6 pb-24 pt-16 md:px-12 md:pb-28 md:pt-24">
        <div data-reveal className="landing-reveal relative mx-auto grid min-h-[30rem] max-w-7xl items-center overflow-hidden rounded-[2rem] border border-white/10 bg-[#171a2b] px-7 py-12 shadow-[0_30px_90px_-42px_rgba(23,26,43,0.7)] sm:px-12 md:grid-cols-[1.1fr_0.9fr] md:px-16 md:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-[-8rem] size-96 rounded-full bg-blue-600/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-[-10rem] size-96 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="relative z-10 flex flex-col justify-center py-4 md:min-h-[22rem]">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-200"><span className="size-2 rounded-full bg-orange-400" />A calmer way to check in</p>
            <h2 className="mt-5 max-w-2xl text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-[2.8rem]">Make space for your team to be heard.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">Create a workspace and build a check-in rhythm that works for your team.</p>
            <div className="mt-8"><Button onClick={() => router.push("/register")} className="rounded-xl bg-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-400">Create workspace <ArrowRight className="ml-2 size-4" aria-hidden="true" /></Button></div>
          </div>
          <div aria-hidden="true" className="relative mx-auto mt-8 flex aspect-square w-full max-w-[19rem] items-center justify-center md:mt-0 md:max-w-[21rem]">
            <div className="absolute inset-0 rounded-full border border-white/10" />
            <div className="absolute inset-[12%] rounded-full border border-blue-200/15" />
            <div className="absolute inset-[25%] rounded-full bg-gradient-to-br from-blue-500/20 via-white/[0.04] to-orange-400/20 blur-sm" />
            <div className="relative grid size-36 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-6xl shadow-[0_0_80px_rgba(96,133,255,0.15)] backdrop-blur sm:size-40">🌡️</div>
            <span className="absolute right-[10%] top-[16%] grid size-12 place-items-center rounded-2xl border border-white/10 bg-[#22263a] text-xl shadow-xl">❄️</span>
            <span className="absolute bottom-[15%] left-[9%] grid size-12 place-items-center rounded-2xl border border-white/10 bg-[#22263a] text-xl shadow-xl">🔥</span>
            <span className="absolute bottom-[16%] right-[4%] size-2 rounded-full bg-orange-300 shadow-[0_0_18px_rgba(253,186,116,0.8)]" />
          </div>
        </div>
      </section>

      <footer className="border-t border-blue-100 bg-white px-6 py-8 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Link href="/" className="flex items-center gap-2 font-semibold text-blue-700">
            <Image src="/logo.png" alt="" width={28} height={28} />Teamparature
          </Link>
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600">How it works</a>
            <button onClick={() => router.push("/login")} className="hover:text-blue-600">Log in</button>
          </nav>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} Teamparature</p>
        </div>
      </footer>
    </main>
  );
}

