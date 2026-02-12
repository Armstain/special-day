"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import gsap from "gsap";
import { splitGraphemes, toBengaliNumber } from "./textUtils";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function getTimeLeft(): TimeLeft {
    const target = new Date(2026, 1, 14, 0, 0, 0).getTime();
    const now = Date.now();
    const diff = Math.max(0, target - now);
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
    };
}

// Helper to split text into spans for GSAP animation
const SplitText = ({ text, className }: { text: string, className?: string }) => {
    return (
        <span className={`inline-block ${className || ""}`} aria-label={text}>
            {splitGraphemes(text).map((char, i) => (
                <span key={i} className="char inline-block" style={{ opacity: 0, display: "inline-block" }}>
                    {char === " " ? "\u00A0" : char}
                </span>
            ))}
        </span>
    );
};

// Pre-generate confetti data at module level to avoid re-creation
const CONFETTI_DATA = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: ((i * 37 + 13) % 100),
    color: ["#D7263D", "#FFB7C5", "#FFD166", "#ff6b8a", "#ff9eb5", "#fff"][i % 6],
    delay: ((i * 0.02) % 0.8).toFixed(2),
    duration: (2.5 + (i % 20) / 10).toFixed(1),
    rotate: ((i * 36) % 720),
    size: 6 + (i % 10),
}));

function ConfettiBurst() {
    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {CONFETTI_DATA.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-sm confetti-fall"
                    style={{
                        left: `${p.x}%`,
                        top: -10,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        ["--confetti-rotate" as string]: `${p.rotate}deg`,
                    }}
                />
            ))}
        </div>
    );
}

function CountdownDigit({ value, label }: { value: number; label: string }) {
    const valueRef = useRef<HTMLSpanElement>(null);
    const prevValue = useRef(value);

    // GSAP animation for digit change — scale + opacity only (no y) to prevent layout shift
    useEffect(() => {
        if (value !== prevValue.current && valueRef.current) {
            gsap.fromTo(
                valueRef.current,
                { opacity: 0, scale: 0.6 },
                { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)" }
            );
            prevValue.current = value;
        }
    }, [value]);

    return (
        <div className="flex flex-col items-center gap-2 sm:gap-3">
            <div
                className="glass-card rounded-2xl sm:rounded-3xl px-4 py-3 sm:px-8 sm:py-6 md:px-10 md:py-8 min-w-17.5 sm:min-w-27.5 md:min-w-32.5 transition-transform duration-200 hover:scale-[1.08]"
            >
                <span
                    ref={valueRef}
                    className="block text-4xl sm:text-6xl md:text-8xl font-bold text-rose-deep text-center"
                    style={{
                        fontFamily: "var(--font-serif)",
                        fontVariantNumeric: "tabular-nums",
                    }}
                >
                    {toBengaliNumber(String(value).padStart(2, "0"))}
                </span>
            </div>
            <span className="text-xs sm:text-sm md:text-base font-semibold tracking-[0.2em] uppercase text-rose-deep/60">
                {label}
            </span>
        </div>
    );
}

// Pre-generate decorative particle positions (deterministic, no Math.random in render)
const DECO_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
    width: 4 + ((i * 3 + 2) % 10),
    left: `${((i * 37 + 7) % 100)}%`,
    top: `${((i * 47 + 11) % 100)}%`,
    colorIdx: i % 3,
    opacity: 0.12 + ((i * 7) % 5) * 0.04,
    duration: `${3 + ((i * 11) % 5)}s`,
    delay: `${((i * 0.6) % 3).toFixed(1)}s`,
}));

export default function HeroCountdown({ isActive = true }: { isActive?: boolean }) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);
    const [isComplete, setIsComplete] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const titleContainerRef = useRef<HTMLDivElement>(null);

    // Mouse parallax
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-300, 300], [3, -3]);
    const rotateY = useTransform(mouseX, [-300, 300], [-3, 3]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            mouseX.set(e.clientX - centerX);
            mouseY.set(e.clientY - centerY);
        };
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    // GSAP Text Stagger Animation
    useEffect(() => {
        if (isActive && titleContainerRef.current) {
            const chars = titleContainerRef.current.querySelectorAll(".char");
            gsap.killTweensOf(chars);
            gsap.fromTo(
                chars,
                { opacity: 0, y: 50, rotateX: -90 },
                {
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    duration: 0.8,
                    stagger: 0.03,
                    ease: "back.out(1.7)",
                    delay: 0.2
                }
            );
        }
    }, [isActive]);

    useEffect(() => {
        const timer = setInterval(() => {
            const tl = getTimeLeft();
            setTimeLeft(tl);
            if (tl.days + tl.hours + tl.minutes + tl.seconds === 0) {
                setIsComplete(true);
                setShowConfetti(true);
                clearInterval(timer);
                setTimeout(() => setShowConfetti(false), 5000);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            {showConfetti && <ConfettiBurst />}

            {/* Background decorative particles — CSS animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {DECO_PARTICLES.map((p, i) => (
                    <div
                        key={`deco-${i}`}
                        className="absolute rounded-full hero-deco-float"
                        style={{
                            width: p.width,
                            height: p.width,
                            left: p.left,
                            top: p.top,
                            background: p.colorIdx === 0 ? "#D7263D" : p.colorIdx === 1 ? "#FFB7C5" : "#FFD166",
                            opacity: p.opacity,
                            animationDuration: p.duration,
                            animationDelay: p.delay,
                        }}
                    />
                ))}
            </div>

            <motion.div
                ref={containerRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                style={{ rotateX, rotateY, perspective: 1000 }}
                className="flex flex-col items-center text-center px-4"
            >
                <div className="text-6xl sm:text-7xl md:text-8xl mb-6 sm:mb-8 hero-heartbeat">
                    💕
                </div>

                {!isComplete ? (
                    <div className="flex flex-col items-center">
                        <div ref={titleContainerRef} className="overflow-hidden mb-3 sm:mb-5">
                            <h1
                                className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold italic text-charcoal flex flex-wrap justify-center gap-x-4"
                                style={{ fontFamily: "var(--font-serif)" }}
                            >
                                <SplitText text="প্রতিটি" />
                                <SplitText text="মুহূর্ত" />
                                <SplitText text="কাছে" />
                            </h1>
                        </div>

                        <motion.p
                            className="text-lg sm:text-xl md:text-2xl text-charcoal/50 mb-10 sm:mb-14 max-w-xl font-light tracking-wide"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.8 }}
                        >
                            অপেক্ষার প্রহর গুনছি সেই বিশেষ দিনের জন্য
                        </motion.p>

                        <div className="flex items-center gap-3 sm:gap-5 md:gap-8">
                            <CountdownDigit value={timeLeft.days} label="দিন" />
                            <span className="text-3xl sm:text-5xl text-rose-deep/30 font-light -mt-8">:</span>
                            <CountdownDigit value={timeLeft.hours} label="ঘণ্টা" />
                            <span className="text-3xl sm:text-5xl text-rose-deep/30 font-light -mt-8">:</span>
                            <CountdownDigit value={timeLeft.minutes} label="মিনিট" />
                            <span className="text-3xl sm:text-5xl text-rose-deep/30 font-light -mt-8">:</span>
                            <CountdownDigit value={timeLeft.seconds} label="সেকেন্ড" />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold italic text-rose-deep mb-8 block">
                            <SplitText text="শুভ ভালোবাসা দিবস" />
                        </h1>
                    </div>
                )}
            </motion.div>
        </>
    );
}
