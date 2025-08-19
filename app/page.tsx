"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Activity, UserCheck, Lightbulb } from "lucide-react";
import gsap from "gsap";
import Image from 'next/image';
import { useRouter } from 'next/navigation';


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

  const features = [
    {
      icon: <Activity className="w-12 h-12 text-blue-500 mb-4" />,
      title: "Track Trends",
      description: "Visualize your team's mood and energy over time.",
    },
    {
      icon: <UserCheck className="w-12 h-12 text-orange-500 mb-4" />,
      title: "Anonymous Logging",
      description: "Encourage honesty with anonymous check-ins.",
    },
    {
      icon: <Lightbulb className="w-12 h-12 text-blue-500 mb-4" />,
      title: "Smart Suggestions",
      description: "Receive actionable tips to improve team performance.",
    },
  ];

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
    <main className="bg-blue-50 min-h-screen flex flex-col font-sans relative overflow-hidden">
      <>
        <header className="w-full py-5 px-6 md:px-24 flex items-center justify-between fixed bg-white shadow top-0 z-50">
          {/* Logo */}
          <div className="text-2xl font-bold text-blue-600 flex-shrink-0 flex items-center gap-2">
            <Image src="/logo.png" alt="Teamparature Logo" width={36} height={36} />

            Teamparature
          </div>

          {/* Desktop Nav - Centered with flex-grow */}
          <nav className="hidden md:flex flex-grow justify-center items-center gap-8 text-gray-700 font-medium">
            <a href="#features" className="hover:text-blue-500 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-500 transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-blue-500 transition-colors">Contact</a>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4 flex-shrink-0">
            <button onClick={() => router.push('/login')} className="px-5 py-2.5 text-gray-700 rounded-full font-medium hover:bg-gray-100 transition-all">Login</button>
            <Button className="bg-blue-500 text-white hover:bg-blue-600 px-6 py-2 rounded-lg font-bold">
              Register
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-800"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <div className={`md:hidden fixed inset-0 bg-white/90 backdrop-blur-xl z-40 flex flex-col items-center justify-center gap-6 transition-opacity duration-300 ease-in-out ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-gray-700 hover:text-blue-500 transition-colors">Features</a>
          <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-gray-700 hover:text-blue-500 transition-colors">Pricing</a>
          <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-lg font-medium text-gray-700 hover:text-blue-500 transition-colors">Contact</a>

          <button onClick={() => { router.push('/login'); setIsMenuOpen(false); }} className="w-48 px-6 py-3 text-gray-700 rounded-full font-medium bg-gray-100 hover:bg-gray-200 transition-all">
            Login
          </button>
          <button onClick={() => { router.push('/register'); setIsMenuOpen(false); }} className="w-48 px-6 py-3 bg-blue-500 text-white rounded-lg font-bold shadow-lg hover:bg-blue-600 transition-all">
            Register
          </button>
        </div>
      </>

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
          Real-time insights into your team's mood and energy for better collaboration and happiness.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center relative z-10">
          <Button className="bg-blue-500 text-white hover:bg-blue-600 font-bold px-6 py-3 rounded-lg shadow-lg">
            Get Started
          </Button>
          <Button className="bg-orange-500 text-white hover:bg-orange-600 font-bold px-6 py-3 rounded-lg shadow-lg">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-24 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-gray-900">
          Why Your Team Needs Teamparature
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="p-6">
            <span className="text-4xl sm:text-5xl mb-4 block">📊</span>
            <h3 className="text-xl font-semibold mb-2">Data-Driven Decisions</h3>
            <p className="text-gray-700">Understand your team’s mood and energy before problems arise.</p>
          </div>
          <div className="p-6">
            <span className="text-4xl sm:text-5xl mb-4 block">🤫</span>
            <h3 className="text-xl font-semibold mb-2">Honest Feedback</h3>
            <p className="text-gray-700">Anonymous logging ensures honesty without fear of judgment.</p>
          </div>
          <div className="p-6">
            <span className="text-4xl sm:text-5xl mb-4 block">💡</span>
            <h3 className="text-xl font-semibold mb-2">Smart Insights</h3>
            <p className="text-gray-700">Receive actionable tips based on real-time trends.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-gray-700 py-10 text-center flex flex-col items-center gap-2 border-t border-gray-200 relative z-10 px-6">
        <p>© 2025 Teamparature. All rights reserved.</p>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-6">
          <a href="#" className="hover:text-blue-500 transition-colors font-medium">Privacy</a>
          <a href="#" className="hover:text-blue-500 transition-colors font-medium">Terms</a>
          <a href="#" className="hover:text-blue-500 transition-colors font-medium">Support</a>
        </div>
      </footer>
    </main>
  );
}



{/* Features */ }
{/* <section id="features" className="px-8 md:px-24 py-24 relative z-10">
        <h2 className="text-4xl font-bold text-center mb-16 text-gray-900">
          Why Teamparature?
        </h2>
        <div className="grid md:grid-cols-3 gap-12">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center text-center hover:scale-105 transition-transform duration-300"
            >
              {feature.icon}
              <h3 className="text-xl md:text-2xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
              <p className="text-gray-700">{feature.description}</p>
            </div>
          ))}
        </div>
      </section> */}
{/* <section className="px-8 md:px-24 py-24 bg-gray-50 text-gray-900">
        <h2 className="text-4xl font-bold text-center mb-16">How Teamparature Works</h2>
        <div className="grid md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
            <Activity className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Log Mood</h3>
            <p className="text-gray-700">Team members log their mood and energy levels daily or weekly.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
            <UserCheck className="w-12 h-12 text-orange-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Track Trends</h3>
            <p className="text-gray-700">Visual dashboards show mood & energy trends for each team and project.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow">
            <Lightbulb className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Get Suggestions</h3>
            <p className="text-gray-700">Smart tips and nudges help improve team morale and collaboration.</p>
          </div>
        </div>
      </section> */}

