"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
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
  const [musicStarted, setMusicStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [collectedStamps, setCollectedStamps] = useState<string[]>([]);
  const [footerHearts, setFooterHearts] = useState<Array<{
    x: string;
    rotate: number;
    duration: number;
    delay: number;
    fontSize: number;
  }>>([]);

  const trackRef = useRef<HTMLDivElement>(null);
  const [showNav, setShowNav] = useState(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Generate random footer hearts only on client mount to avoid hydration mismatch
  useEffect(() => {
    const hearts = Array.from({ length: 15 }, () => ({
      x: Math.random() * 100 + "vw",
      rotate: Math.random() * 360,
      duration: 10 + Math.random() * 10,
      delay: Math.random() * 5,
      fontSize: 20 + Math.random() * 40,
    }));
    setFooterHearts(hearts);
  }, []);

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

  // ── Wheel scroll — one slide per scroll gesture ──
  useEffect(() => {
    let cooldown = false;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (cooldown || isAnimatingRef.current) return;

      // Determine dominant axis
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(delta) < 30) return; // ignore tiny ticks

      cooldown = true;
      if (delta > 0) goNext();
      else goPrev();

      // Cooldown prevents rapid-fire multi-slide jumps
      setTimeout(() => { cooldown = false; }, 800);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [goNext, goPrev]);

  // ── Show / hide sidebar nav on mouse activity ──
  useEffect(() => {
    const handleMouseMove = () => {
      setShowNav(true);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
      navTimerRef.current = setTimeout(() => setShowNav(false), 2000);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

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
      <MusicToggle shouldStart={musicStarted} />

      {/* ── Welcome Gate Overlay ── */}
      {showWelcome && (
        <WelcomeGate
          onCurtainsFullyOpen={() => setMusicStarted(true)}
          onComplete={() => setShowWelcome(false)}
        />
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

      {/* ── Side navigation dots (auto-hide) ── */}
      <nav
        className={`fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-101 flex flex-col items-center gap-5
          transition-opacity duration-500 ${showWelcome ? 'opacity-0 pointer-events-none' : ''}
          ${showNav ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
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
          <div className="section-content w-full h-full flex flex-col items-center justify-center text-center px-4 relative">
            {/* Background floating hearts for footer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {footerHearts.map((heart, i) => (
                <motion.div
                  key={`footer-heart-${i}`}
                  className="absolute text-rose-deep/5"
                  initial={{ y: "100vh", x: heart.x, opacity: 0 }}
                  animate={{
                    y: "-10vh",
                    opacity: [0, 0.4, 0],
                    rotate: heart.rotate
                  }}
                  transition={{
                    duration: heart.duration,
                    repeat: Infinity,
                    delay: heart.delay,
                    ease: "linear"
                  }}
                  style={{ fontSize: heart.fontSize }}
                >
                  ❤
                </motion.div>
              ))}
            </div>

            <motion.div
              className="relative mb-8 sm:mb-12"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* Circular Text "To Be Continued" */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <svg viewBox="0 0 100 100" width="160" height="160" className="opacity-20">
                  <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                  <text>
                    <textPath href="#circlePath" fill="#D7263D" className="text-[10px] fon-bold tracking-[0.2em] uppercase">
                      • To Be Continued • To Be Continued • To Be Continued
                    </textPath>
                  </text>
                </svg>
              </motion.div>

              <motion.div
                className="text-7xl sm:text-8xl md:text-9xl relative z-10 drop-shadow-2xl"
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                💖
              </motion.div>
            </motion.div>

            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-bold italic text-charcoal mb-6 sm:mb-8"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              এই গল্পটা এখানেই শেষ না।
            </h2>

            <p className="text-charcoal/60 text-lg sm:text-xl max-w-lg leading-relaxed mb-10 sm:mb-14">
              প্রতিটা দিনই আমাদের জন্য বিশেষ,<br />
              আজ শুধু একটু মনে করিয়ে দেয়া।<br />
              <span className="block mt-4 text-rose-deep font-medium">— শুধু তোমার জন্য</span>
            </p>

            <motion.button
              onClick={() => goTo(0)}
              className="group relative px-8 py-3 rounded-full border border-charcoal/10 bg-white/50 backdrop-blur-sm 
                           hover:bg-rose-deep hover:border-rose-deep hover:text-white transition-all duration-300
                           text-charcoal/60 font-medium tracking-wide text-sm sm:text-base cursor-pointer overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-rotate-180 transition-transform duration-500">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                শুরু থেকে দেখো
              </span>
            </motion.button>

            <div className="absolute bottom-6 text-charcoal/10 text-xs tracking-[0.5em] uppercase">
              Forever & Always
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
