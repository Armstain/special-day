"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { splitGraphemes } from "./textUtils";

interface Memory {
    id: number;
    x: number;
    y: number;
    mobileX: number;
    mobileY: number;
    title: string;
    date: string;
    description: string;
    icon: string;
}

// ── CUSTOMIZE YOUR MEMORIES HERE ─────────────────────────────
const MEMORIES: Memory[] = [
    {
        id: 1, x: 18, y: 32, mobileX: 20, mobileY: 25,
        title: "বাসের সেই দিন",
        date: "২৮ আগস্ট",
        description: "একটা বাস। দুজন মানুষ। ভাগ্য চুপচাপ লিখছিল।",
        icon: "🚌",
    },
    {
        id: 2, x: 40, y: 30, mobileX: 75, mobileY: 32,
        title: "তোমার কণ্ঠ",
        date: "২৩ সেপ্টেম্বর",
        description: "তোমার কণ্ঠ। প্রথমবার। তারপর আর নীরবতা ছিল না।",
        icon: "🎵",
    },
    {
        id: 3, x: 65, y: 36, mobileX: 25, mobileY: 39,
        title: "Love you",
        date: "১৮ ডিসেম্বর",
        description: "আমি বলেছিলাম — \"Love you.\" শব্দের চেয়ে অনুভূতি ভারী ছিল।",
        icon: "💜",
    },
    {
        id: 4, x: 82, y: 38, mobileX: 80, mobileY: 46,
        title: "ছয়বার বলেছিলাম",
        date: "২৬ ডিসেম্বর",
        description: "ছয়বার বলেছিলাম। কারণ একবারে বিশ্বাস হচ্ছিল না কতটা সত্যি।",
        icon: "💫",
    },
    {
        id: 5, x: 25, y: 58, mobileX: 20, mobileY: 53,
        title: "আটবার ভালোবাসি",
        date: "৭ জানুয়ারি",
        description: "তুমি আটবার \"ভালোবাসি\" বলেছিলে। প্রতিটা শব্দ আমার ভিতরে জায়গা করে নিয়েছিল।",
        icon: "❤️",
    },
    {
        id: 6, x: 52, y: 52, mobileX: 75, mobileY: 60,
        title: "সময় থেমেছিল",
        date: "১২ জানুয়ারি",
        description: "সময় থেমেছিল। শুধু আমরা চলছিলাম।",
        icon: "⏳",
    },
    {
        id: 7, x: 75, y: 64, mobileX: 25, mobileY: 67,
        title: "তোমার চোখের জল",
        date: "২১ জানুয়ারি",
        description: "তোমার চোখের জল। আমার ভয় — আমি যেন কখনো কারণ না হই।",
        icon: "🥺",
    },
    {
        id: 8, x: 38, y: 76, mobileX: 80, mobileY: 74,
        title: "সাত ঘণ্টা",
        date: "১ ফেব্রুয়ারি",
        description: "সাত ঘণ্টা। দূরত্ব ছিল। কিন্তু আলাদা ছিলাম না।",
        icon: "🌉",
    },
    {
        id: 9, x: 62, y: 82, mobileX: 50, mobileY: 81,
        title: "তুমি আমার নক্ষত্র",
        date: "১৩ ফেব্রুয়ারি",
        description: "এই আকাশ বানাচ্ছি। কারণ তুমি আমার নক্ষত্র।",
        icon: "✨",
    },
];

// Helper to split text
const SplitText = ({ text }: { text: string }) => (
    <span className="inline-block" aria-label={text}>
        {splitGraphemes(text).map((char, i) => (
            <span key={i} className="char inline-block" style={{ opacity: 0 }}>
                {char === " " ? "\u00A0" : char}
            </span>
        ))}
    </span>
);

/* ── Shooting star ── */
function ShootingStar({ delay }: { delay: number }) {
    const startX = useMemo(() => Math.random() * 60, []);
    const startY = useMemo(() => Math.random() * 30, []);
    const repeatDelay = useMemo(() => 8 + Math.random() * 12, []);

    return (
        <div
            className="absolute w-[2px] h-[2px] bg-white rounded-full shooting-star"
            style={{
                left: `${startX}%`,
                top: `${startY}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${1.2 + repeatDelay}s`,
            }}
        >
            <div
                className="absolute top-0 right-0 w-[60px] h-[1px]"
                style={{
                    background: "linear-gradient(to left, white, transparent)",
                    transformOrigin: "right center",
                    transform: "rotate(-35deg)",
                }}
            />
        </div>
    );
}

/* ── Interactive Star ──────────────────────────────── */
function Star({
    memory,
    onClick,
    isActive,
    index,
    sectionActive,
    x,
    y,
}: {
    memory: Memory;
    onClick: () => void;
    isActive: boolean;
    index: number;
    sectionActive: boolean;
    x: number;
    y: number;
}) {
    const starRef = useRef<HTMLButtonElement>(null);

    // GSAP entrance animation
    useEffect(() => {
        if (starRef.current && sectionActive) {
            gsap.fromTo(
                starRef.current,
                { scale: 0, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.6,
                    ease: "back.out(2)",
                    delay: 0.5 + index * 0.15,
                }
            );
        }
    }, [index, sectionActive]);

    return (
        <button
            ref={starRef}
            className="absolute group z-20 cursor-pointer star-button"
            style={{ left: `${x}%`, top: `${y}%`, opacity: 0 }}
            onClick={onClick}
        >
            {/* Soft glow ring — CSS animation instead of Framer Motion */}
            <span
                className="absolute -inset-6 sm:-inset-8 rounded-full star-glow"
                style={{
                    background: isActive
                        ? "radial-gradient(circle, rgba(255,209,102,0.5) 0%, transparent 70%)"
                        : "radial-gradient(circle, rgba(255,209,102,0.12) 0%, transparent 70%)",
                    animationDuration: `${2.5 + memory.id * 0.3}s`,
                }}
            />

            {/* Ripple effect on active — CSS animation */}
            {isActive && (
                <span className="absolute -inset-4 sm:-inset-6 rounded-full border border-gold/40 star-ripple" />
            )}

            {/* Star core */}
            <span
                className="relative block rounded-full transition-all duration-300"
                style={{
                    width: isActive ? 14 : 10,
                    height: isActive ? 14 : 10,
                    backgroundColor: isActive ? "#FFD166" : "#ffffff",
                    boxShadow: isActive
                        ? "0 0 20px #FFD166, 0 0 50px rgba(255,209,102,0.4)"
                        : "0 0 8px #fff, 0 0 18px rgba(255,255,255,0.3)",
                }}
            />

            {/* Hover label */}
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-3 text-white/50 text-[11px] sm:text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity tracking-wide">
                {memory.title}
            </span>
        </button>
    );
}

// Pre-generate background star positions at module level 
const BG_STAR_COUNT = 100;
const bgStarData = Array.from({ length: BG_STAR_COUNT }, (_, i) => ({
    size: (((i * 7 + 3) % 5) * 0.4 + 0.5).toFixed(1),
    left: ((i * 37 + 13) % 100).toFixed(1),
    top: ((i * 53 + 7) % 100).toFixed(1),
    delay: ((i * 0.31) % 5).toFixed(2),
    duration: (1.5 + ((i * 17) % 30) / 10).toFixed(1),
}));

export default function MemoryMap({ isActive = false }: { isActive?: boolean }) {
    const [activeMemory, setActiveMemory] = useState<number | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const active = MEMORIES.find((m) => m.id === activeMemory);
    const titleRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize(); // Check on mount
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getCoords = (m: Memory) => ({
        x: isMobile ? m.mobileX : m.x,
        y: isMobile ? m.mobileY : m.y,
    });

    // Title GSAP entrance
    useEffect(() => {
        if (titleRef.current && isActive) {
            const chars = titleRef.current.querySelectorAll(".char");
            gsap.killTweensOf(chars);
            gsap.fromTo(
                chars,
                { opacity: 0, y: -20, scale: 0 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.5,
                    stagger: 0.05,
                    ease: "back.out(2)",
                    delay: 0.3,
                }
            );
        }
    }, [isActive]);

    return (
        <>
            {/* ── Title ──────────────────────────────────────── */}
            <div ref={titleRef} className="absolute top-8 sm:top-14 left-0 right-0 z-30 text-center px-4 pointer-events-none">
                <h2
                    className="text-3xl sm:text-5xl md:text-7xl font-bold italic text-white/90 mb-2 sm:mb-3"
                    style={{
                        fontFamily: "var(--font-serif)",
                        textShadow: "0 0 40px rgba(255,209,102,0.15)",
                    }}
                >
                    <SplitText text="আমাদের আকাশে লেখা তারিখগুলো" />
                </h2>
                <p
                    className="text-sm sm:text-lg text-white/35 font-light tracking-widest transition-opacity duration-1000"
                    style={{ opacity: isActive ? 1 : 0, transitionDelay: "1.5s" }}
                >
                    প্রতিটা তারা এক একটা তারিখ — ছুঁয়ে দেখো
                </p>
            </div>

            {/* ── Twinkling background stars — CSS-only animation ── */}
            <div className="absolute inset-0 pointer-events-none">
                {bgStarData.map((star, i) => (
                    <div
                        key={`bg-${i}`}
                        className="absolute rounded-full bg-white twinkle-star"
                        style={{
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            left: `${star.left}%`,
                            top: `${star.top}%`,
                            animationDelay: `${star.delay}s`,
                            animationDuration: `${star.duration}s`,
                        }}
                    />
                ))}
            </div>

            {/* ── Shooting stars ─────────────────────────────── */}
            <ShootingStar delay={2} />
            <ShootingStar delay={5} />
            <ShootingStar delay={9} />
            <ShootingStar delay={13} />
            <ShootingStar delay={18} />

            {/* ── Nebula glow — CSS animation instead of Framer Motion ── */}
            <div
                className="absolute w-[500px] h-[500px] rounded-full opacity-[0.06] blur-[100px] pointer-events-none nebula-pulse"
                style={{
                    background: "radial-gradient(circle, #FFB7C5, transparent)",
                    left: "20%",
                    top: "30%",
                    animationDuration: "10s",
                }}
            />
            <div
                className="absolute w-[400px] h-[400px] rounded-full opacity-[0.04] blur-[80px] pointer-events-none nebula-pulse"
                style={{
                    background: "radial-gradient(circle, #FFD166, transparent)",
                    right: "15%",
                    top: "50%",
                    animationDuration: "12s",
                    animationDelay: "2s",
                }}
            />

            {/* ── Constellation lines ────────────────────────── */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {MEMORIES.slice(0, -1).map((m, i) => {
                    const next = MEMORIES[i + 1];
                    const currCoords = getCoords(m);
                    const nextCoords = getCoords(next);
                    return (
                        <motion.line
                            key={m.id}
                            x1={`${currCoords.x}%`}
                            y1={`${currCoords.y}%`}
                            x2={`${nextCoords.x}%`}
                            y2={`${nextCoords.y}%`}
                            stroke="white"
                            strokeWidth="0.5"
                            strokeDasharray="4 6"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={isActive ? { pathLength: 1, opacity: 0.15 } : { pathLength: 0, opacity: 0 }}
                            transition={{ delay: 1.5 + i * 0.3, duration: 0.8 }}
                        />
                    );
                })}
            </svg>

            {/* ── Interactive Stars ──────────────────────────── */}
            {MEMORIES.map((memory, index) => {
                const { x, y } = getCoords(memory);
                return (
                    <Star
                        key={memory.id}
                        memory={memory}
                        isActive={activeMemory === memory.id}
                        onClick={() => setActiveMemory(memory.id)}
                        index={index}
                        sectionActive={isActive}
                        x={x}
                        y={y}
                    />
                );
            })}

            {/* ── Memory Popup ───────────────────────────────── */}
            <AnimatePresence>
                {active && (
                    <>
                        <motion.div
                            className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveMemory(null)}
                        />
                        <div className="absolute inset-0 z-40 flex items-center justify-center p-6 pointer-events-none">
                            <motion.div
                                className="pointer-events-auto rounded-3xl p-8 sm:p-12 max-w-md w-full text-center relative overflow-hidden"
                                style={{
                                    background: "rgba(255,255,255,0.95)",
                                    backdropFilter: "blur(20px)",
                                    boxShadow: "0 25px 60px rgba(0,0,0,0.3), 0 0 40px rgba(255,209,102,0.1)",
                                }}
                                initial={{ opacity: 0, scale: 0.8, y: 40, rotateX: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 40, rotateX: -10 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                {/* Top accent bar */}
                                <motion.div
                                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-deep via-gold to-pink-soft"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    style={{ transformOrigin: "left" }}
                                />

                                <motion.span
                                    className="text-5xl sm:text-6xl block mb-5"
                                    initial={{ scale: 0, rotate: -30 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", delay: 0.1 }}
                                >
                                    {active.icon}
                                </motion.span>
                                <motion.h3
                                    className="text-2xl sm:text-3xl font-bold text-charcoal mb-2"
                                    style={{ fontFamily: "var(--font-serif)" }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    {active.title}
                                </motion.h3>
                                <motion.p
                                    className="text-xs sm:text-sm font-bold text-rose-deep uppercase tracking-[0.2em] mb-5"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.25 }}
                                >
                                    {active.date}
                                </motion.p>
                                <motion.p
                                    className="text-charcoal/70 text-base sm:text-lg leading-relaxed italic"
                                    style={{ fontFamily: "var(--font-serif)" }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    &ldquo;{active.description}&rdquo;
                                </motion.p>

                                <motion.button
                                    className="mt-8 text-sm text-charcoal/30 hover:text-rose-deep transition-colors underline underline-offset-4 cursor-pointer"
                                    onClick={() => setActiveMemory(null)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    বন্ধ করো
                                </motion.button>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Bottom badge ───────────────────────────────── */}
            <div
                className="absolute bottom-6 sm:bottom-10 left-0 right-0 z-10 text-center transition-opacity duration-1000"
                style={{ opacity: isActive ? 1 : 0, transitionDelay: "3s" }}
            >
                <span className="text-white/20 text-xs tracking-[0.3em] uppercase">
                    আমাদের আকাশে {MEMORIES.length}টি ঝলমলে স্মৃতি
                </span>
            </div>
        </>
    );
}
