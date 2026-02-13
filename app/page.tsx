"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import Lenis from "lenis";
import { toBengaliNumber } from "./components/textUtils";

// Dynamic SSR-free imports
const FloatingHearts = dynamic(() => import("./components/FloatingHearts"), { ssr: false });
const CustomCursor = dynamic(() => import("./components/CustomCursor"), { ssr: false });
const CursorDropShapes = dynamic(() => import("./components/CursorDropShapes"), { ssr: false });
const HeroCountdown = dynamic(() => import("./components/HeroCountdown"), { ssr: false });
const SecretMessage = dynamic(() => import("./components/SecretMessage"), { ssr: false });
const MemoryMap = dynamic(() => import("./components/MemoryMap"), { ssr: false });
const EmotionalGame = dynamic(() => import("./components/EmotionalGame"), { ssr: false });
const MusicToggle = dynamic(() => import("./components/MusicToggle"), { ssr: false });
const ShareCardGenerator = dynamic(() => import("./components/ShareCardGenerator"), { ssr: false });
const WelcomeGate = dynamic(() => import("./components/WelcomeGate"), { ssr: false });

const SECTIONS = [
  { id: "hero", label: "♡", name: "স্বাগতম" },
  { id: "letter", label: "✉", name: "চিঠি" },
  { id: "stars", label: "★", name: "স্মৃতি" },
  { id: "bridge", label: "🧩", name: "খেলা" },
  { id: "card", label: "❤", name: "কার্ড" },
  { id: "footer", label: "💕", name: "চিরদিন" },
];

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [collectedStamps, setCollectedStamps] = useState<string[]>([]);

  const trackRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const currentRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const total = SECTIONS.length;

  // Keep refs in sync with state
  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    isAnimatingRef.current = isAnimating;
  }, [isAnimating]);

  // ── Animate to section ──
  const goTo = useCallback(
    (index: number) => {
      if (isAnimatingRef.current || index < 0 || index >= total || index === currentRef.current) return;
      setIsAnimating(true);
      isAnimatingRef.current = true;

      const prevIndex = currentRef.current;
      const direction = index > prevIndex ? 1 : -1;
      const track = trackRef.current;
      if (!track) return;

      // Fade out current section content
      const currentPanel = track.children[prevIndex] as HTMLElement;
      const nextPanel = track.children[index] as HTMLElement;
      const currentContent = currentPanel?.querySelector(".section-content") as HTMLElement;
      const nextContent = nextPanel?.querySelector(".section-content") as HTMLElement;

      const tl = gsap.timeline({
        onComplete: () => {
          setCurrent(index);
          currentRef.current = index;
          setIsAnimating(false);
          isAnimatingRef.current = false;
        },
      });

      // Fade out current content with a smooth easing
      if (currentContent) {
        tl.to(currentContent, {
          opacity: 0,
          scale: 0.92,
          x: direction * -60,
          duration: 0.4,
          ease: "power2.in",
        }, 0);
      }

      // Slide the track — this is the main smooth scroll transition
      tl.to(track, {
        x: `-${index * 100}vw`,
        duration: 1.0,
        ease: "power3.inOut",
      }, 0.1);

      // Fade in next content with a smooth reveal
      if (nextContent) {
        gsap.set(nextContent, { opacity: 0, scale: 0.92, x: direction * 60 });
        tl.to(nextContent, {
          opacity: 1,
          scale: 1,
          x: 0,
          duration: 0.55,
          ease: "power2.out",
        }, 0.6);
      }
    },
    [total]
  );

  const goNext = useCallback(() => goTo(currentRef.current + 1), [goTo]);
  const goPrev = useCallback(() => goTo(currentRef.current - 1), [goTo]);

  // ── Keyboard navigation ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev]);

  // ── Lenis smooth scroll for wheel/trackpad ──
  useEffect(() => {
    // Removed scrollAccumulator as we now use immediate velocity checks
    // let scrollAccumulator = 0;
    // let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    const lenis = new Lenis({
      wrapper: window as unknown as HTMLElement,
      content: document.documentElement,
      duration: 1.4,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Override default scroll — capture Lenis virtual scroll for our section navigation
    lenis.on("scroll", ({ velocity }: { velocity: number }) => {
      // If currently animating, ignore scroll events to prevent double-skipping
      if (isAnimatingRef.current) return;

      // Threshold check: trigger only on significant scroll
      if (Math.abs(velocity) > 0.8) {
        if (velocity > 0) goNext();
        else goPrev();
      }
    });

    // Sync Lenis with GSAP ticker
    gsap.ticker.lagSmoothing(500, 33); // Re-enable lag smoothing for slower PCs
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);

    // Prevent native scroll on the viewport
    const preventScroll = (e: WheelEvent) => {
      e.preventDefault();
    };
    window.addEventListener("wheel", preventScroll, { passive: false });

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      gsap.ticker.remove(tickerCallback);
      window.removeEventListener("wheel", preventScroll);
      // Removed scrollTimeout cleanup
    };
  }, [goNext, goPrev]);

  // ── Touch swipe navigation ──
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      // Determine swipe direction: allow both horizontal and vertical swipes
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Threshold for swipe
      if (Math.max(absDx, absDy) > 50) {
        // Horizontal swipe dominance
        if (absDx > absDy) {
          if (dx < 0) goNext();
          else goPrev();
        }
        // Vertical swipe dominance (natural scroll feel)
        else {
          if (dy < 0) goNext(); // Swipe up -> move down (next)
          else goPrev(); // Swipe down -> move up (prev)
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goNext, goPrev]);

  // ── Initialize first section ──
  useEffect(() => {
    if (trackRef.current) {
      gsap.set(trackRef.current, { x: 0 });
      const firstContent = trackRef.current.querySelector(".section-content") as HTMLElement;
      if (firstContent) {
        gsap.set(firstContent, { opacity: 1, scale: 1, x: 0 });
      }
    }
  }, []);

  const progress = ((current) / (total - 1)) * 100;
  const isStarSection = current === 2;

  return (
    <div className="journey-viewport">
      <CustomCursor />
      <CursorDropShapes />
      <FloatingHearts />
      <MusicToggle />

      {/* ── Welcome Gate Overlay ── */}
      {showWelcome && (
        <WelcomeGate onComplete={() => setShowWelcome(false)} />
      )}

      <div className={`fixed top-0 left-0 right-0 h-0.75 z-101 bg-charcoal/5 transition-opacity duration-700 ${showWelcome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div
          className="h-full rounded-r-full transition-all duration-700 ease-in-out"
          style={{
            background: "linear-gradient(90deg, #D7263D, #FFB7C5, #FFD166)",
            width: `${progress}%`,
          }}
        />
      </div>

      <motion.div
        className={`fixed top-5 left-5 sm:top-7 sm:left-8 z-101 flex items-center gap-3 ${showWelcome ? 'opacity-0 pointer-events-none' : ''}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: showWelcome ? 0 : 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <span
          className={`text-sm font-medium tracking-widest transition-colors duration-500
            ${isStarSection ? "text-white/40" : "text-charcoal/30"}`}
        >
          <span className={`text-lg font-bold ${isStarSection ? "text-gold" : "text-rose-deep"}`}>
            {toBengaliNumber(String(current + 1).padStart(2, "0"))}
          </span>
          {" / "}
          {toBengaliNumber(String(total).padStart(2, "0"))}
        </span>
      </motion.div>

      <nav className={`fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-101 flex flex-col items-center gap-5 transition-opacity duration-700 ${showWelcome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {SECTIONS.map((sec, i) => (
          <motion.button
            key={sec.id}
            onClick={() => goTo(i)}
            title={sec.name}
            className="group relative flex items-center cursor-pointer p-1"
            whileHover={{ scale: 1.3 }}
            whileTap={{ scale: 0.9 }}
          >
            {/* Active ring pulse */}
            <AnimatePresence>
              {current === i && (
                <motion.span
                  className={`absolute rounded-full ${i === 2 ? "bg-gold/20" : "bg-rose-deep/20"}`}
                  initial={{ width: 8, height: 8, opacity: 0 }}
                  animate={{
                    width: [12, 26, 12],
                    height: [12, 26, 12],
                    opacity: [0.6, 0, 0.6],
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ left: "50%", top: "50%", x: "-50%", y: "-50%" }}
                />
              )}
            </AnimatePresence>

            {/* Dot */}
            <motion.span
              className="block rounded-full"
              animate={{
                width: current === i ? 14 : 8,
                height: current === i ? 14 : 8,
                backgroundColor:
                  i === 2
                    ? current === i ? "#FFD166" : "rgba(255,255,255,0.35)"
                    : current === i ? "#D7263D" : "rgba(34,34,40,0.2)",
                boxShadow:
                  current === i
                    ? i === 2
                      ? "0 0 14px rgba(255,209,102,0.7)"
                      : "0 0 14px rgba(215,38,61,0.7)"
                    : "0 0 0 transparent",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            />

            {/* Tooltip */}
            <span
              className={`absolute right-full mr-3 text-xs px-2.5 py-1 rounded-md whitespace-nowrap
                opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                ${i === 2
                  ? "bg-white/10 text-white/70 backdrop-blur-md"
                  : "bg-charcoal/80 text-white/90"
                }`}
            >
              {sec.name}
            </span>
          </motion.button>
        ))}
      </nav>

      <div className={`fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-101 flex items-center gap-4 sm:gap-6 transition-opacity duration-700 ${showWelcome ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <motion.button
          onClick={goPrev}
          disabled={current === 0 || isAnimating}
          className={`group flex items-center gap-2 px-5 py-3 sm:px-7 sm:py-3.5 rounded-full
            font-medium text-sm sm:text-base transition-all duration-300 cursor-pointer
            disabled:opacity-0 disabled:pointer-events-none
            ${isStarSection
              ? "bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-md border border-white/10"
              : "bg-white/70 text-charcoal/80 hover:bg-white hover:text-charcoal shadow-lg hover:shadow-xl backdrop-blur-sm border border-pink-soft/30"
            }`}
          whileHover={{ scale: 1.05, x: -3 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: current === 0 ? 0 : 1, y: current === 0 ? 10 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="nav-arrow-left"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          <span className="hidden sm:inline">পেছনে</span>
        </motion.button>

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium tracking-wide
              ${isStarSection
                ? "bg-white/5 text-gold/70 border border-gold/20 backdrop-blur-md"
                : "bg-rose-deep/10 text-rose-deep/70 border border-rose-deep/15"
              }`}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            {SECTIONS[current].label} {SECTIONS[current].name}
          </motion.div>
        </AnimatePresence>

        <motion.button
          onClick={goNext}
          disabled={current === total - 1 || isAnimating}
          className={`group flex items-center gap-2 px-5 py-3 sm:px-7 sm:py-3.5 rounded-full
            font-medium text-sm sm:text-base transition-all duration-300 cursor-pointer
            disabled:opacity-0 disabled:pointer-events-none
            ${isStarSection
              ? "bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-md border border-white/10"
              : "bg-linear-to-r from-rose-deep to-pink-soft text-white shadow-lg hover:shadow-xl hover:shadow-rose-deep/20"
            }`}
          whileHover={{ scale: 1.05, x: 3 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: current === total - 1 ? 0 : 1, y: current === total - 1 ? 10 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="hidden sm:inline">পরেরটি</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="nav-arrow-right"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </motion.button>
      </div>

      {/* ── Horizontal Track ───────────────────────────── */}
      <div ref={trackRef} className="journey-track">
        {/* Section 1: Hero */}
        <section className="panel panel-hero">
          <div className="section-content w-full h-full flex items-center justify-center">
            <HeroCountdown isActive={current === 0} />
          </div>
        </section>

        {/* Section 2: Secret Letter */}
        <section className="panel panel-letter">
          <div className="section-content w-full h-full flex items-center justify-center">
            <SecretMessage isActive={current === 1} />
          </div>
        </section>

        {/* Section 3: Constellation */}
        <section className="panel panel-stars">
          <div className="section-content w-full h-full relative">
            <MemoryMap isActive={current === 2} />
          </div>
        </section>

        {/* Section 4: Emotional Game (Puzzle) */}
        <section className="panel panel-bridge">
          <div className="section-content w-full h-full flex items-center justify-center">
            <EmotionalGame
              isActive={current === 3}
              onNext={(allAnswers) => {
                setCollectedStamps(allAnswers);
                goNext();
              }}
            />
          </div>
        </section>

        {/* Section 5: Card Generator */}
        <section className="panel panel-card">
          <div className="section-content w-full h-full flex items-center justify-center">
            <ShareCardGenerator isActive={current === 4} answers={collectedStamps} />
          </div>
        </section>

        {/* Section 6: Footer */}
        <section className="panel panel-footer">
          <div className="section-content w-full h-full flex flex-col items-center justify-center text-center px-4">
            <motion.div
              className="text-6xl sm:text-7xl mb-8"
              animate={{ scale: [1, 1.15, 1, 1.08, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              💕
            </motion.div>
            <p
              className="text-charcoal/40 text-xl sm:text-2xl italic max-w-md"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              এই গল্পটা এখানেই শেষ না।
            </p>
            <motion.p
              className="text-charcoal/25 text-sm mt-6 tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              ...............
            </motion.p>
          </div>
        </section>
      </div>
    </div>
  );
}
