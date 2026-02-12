"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { splitGraphemes, toBengaliNumber } from "./textUtils";

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

export default function DistanceBridge({ isActive = false }: { isActive?: boolean }) {
    const [place1, setPlace1] = useState("");
    const [place2, setPlace2] = useState("");
    const [calculated, setCalculated] = useState(false);
    const [distance, setDistance] = useState(0);
    const [displayedDistance, setDisplayedDistance] = useState(0);
    const sectionRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    const calculateDistance = () => {
        if (!place1.trim() || !place2.trim()) return;
        const seed = place1.length + place2.length;
        const randomDist = Math.floor(200 + (seed * 123) % 8000);
        setDistance(randomDist);
        setDisplayedDistance(0);
        setCalculated(true);
    };

    // Animate distance counter
    useEffect(() => {
        if (calculated && distance > 0) {
            const duration = 2000;
            const start = Date.now();
            const animate = () => {
                const elapsed = Date.now() - start;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out quad
                const eased = 1 - (1 - progress) * (1 - progress);
                setDisplayedDistance(Math.floor(eased * distance));
                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        }
    }, [calculated, distance]);

    // GSAP title entrance
    useEffect(() => {
        if (titleRef.current && isActive) {
            const chars = titleRef.current.querySelectorAll(".char");
            gsap.killTweensOf(chars);
            gsap.fromTo(
                chars,
                { opacity: 0, scale: 0, rotation: -45 },
                {
                    opacity: 1,
                    scale: 1,
                    rotation: 0,
                    duration: 0.6,
                    stagger: 0.05,
                    ease: "back.out(1.5)",
                    delay: 0.3,
                }
            );
        }
    }, [isActive]);

    const reset = () => {
        setCalculated(false);
        setPlace1("");
        setPlace2("");
        setDisplayedDistance(0);
    };

    return (
        <div ref={sectionRef} className="flex flex-col items-center justify-center text-center px-4 w-full">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 8 }, (_, i) => (
                    <div
                        key={`bridge-deco-${i}`}
                        className="absolute rounded-full hero-deco-float"
                        style={{
                            width: 100 + ((i * 47 + 13) % 200),
                            height: 100 + ((i * 53 + 7) % 200),
                            left: `${((i * 41 + 11) % 100)}%`,
                            top: `${((i * 37 + 17) % 100)}%`,
                            background: `radial-gradient(circle, ${i % 2 === 0 ? "rgba(215,38,61,0.05)" : "rgba(255,209,102,0.05)"}, transparent)`,
                            animationDuration: `${8 + (i % 4)}s`,
                            animationDelay: `${i * 0.5}s`,
                        }}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {!calculated ? (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center w-full max-w-xl relative z-10"
                    >
                        <motion.span
                            className="text-6xl sm:text-7xl md:text-8xl mb-6 sm:mb-8 inline-block"
                            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
                        >
                            🌍
                        </motion.span>

                        <h2
                            ref={titleRef}
                            className="text-3xl sm:text-5xl md:text-6xl font-bold italic text-charcoal mb-4 sm:mb-6"
                            style={{ fontFamily: "var(--font-serif)" }}
                        >
                            <SplitText text="দূরত্বের সেতু" />
                        </h2>
                        <motion.p
                            className="text-lg sm:text-xl text-charcoal/50 font-light mb-10 sm:mb-14 max-w-lg"
                            initial={{ opacity: 0, y: 15 }}
                            animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                            transition={{ delay: 0.6 }}
                        >
                            আমরা কত দূরে আছি? দেখো তো, ভালোবাসা কত সহজে সব দূরত্ব পেরিয়ে যায়।
                        </motion.p>

                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center w-full mb-8 sm:mb-10">
                            <motion.input
                                type="text"
                                placeholder="আমার শহর"
                                className="w-full sm:w-56 px-6 py-4 rounded-2xl border-2 border-pink-soft/50 focus:border-rose-deep focus:ring-4 focus:ring-rose-deep/10 outline-none bg-white/60 backdrop-blur-sm transition-all text-center text-lg"
                                value={place1}
                                onChange={(e) => setPlace1(e.target.value)}
                                whileFocus={{ scale: 1.02, boxShadow: "0 8px 30px rgba(215, 38, 61, 0.12)" }}
                            />
                            <motion.span
                                className="text-3xl text-rose-deep"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                ❤️
                            </motion.span>
                            <motion.input
                                type="text"
                                placeholder="তোমার শহর"
                                className="w-full sm:w-56 px-6 py-4 rounded-2xl border-2 border-pink-soft/50 focus:border-rose-deep focus:ring-4 focus:ring-rose-deep/10 outline-none bg-white/60 backdrop-blur-sm transition-all text-center text-lg"
                                value={place2}
                                onChange={(e) => setPlace2(e.target.value)}
                                whileFocus={{ scale: 1.02, boxShadow: "0 8px 30px rgba(215, 38, 61, 0.12)" }}
                            />
                        </div>

                        <motion.button
                            onClick={calculateDistance}
                            disabled={!place1 || !place2}
                            className="glow-pulse bg-linear-to-r from-rose-deep to-pink-soft text-white px-12 py-4 sm:px-14 sm:py-5 rounded-full font-semibold text-lg sm:text-xl shadow-xl hover:shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer relative overflow-hidden"
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(215, 38, 61, 0.3)" }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                                initial={{ x: "-100%" }}
                                whileHover={{ x: "100%" }}
                                transition={{ duration: 0.6 }}
                            />
                            <span className="relative">আমাদের যুক্ত করো 💕</span>
                        </motion.button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-col items-center relative z-10"
                    >
                        {/* Animated path */}
                        <div className="relative w-80 sm:w-96 h-40 mb-8 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 320 120">
                                <motion.path
                                    d="M 20,90 Q 160,10 300,90"
                                    fill="none"
                                    stroke="rgba(215, 38, 61, 0.25)"
                                    strokeWidth="2"
                                    strokeDasharray="6 6"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, ease: "easeOut" as const }}
                                />
                                {/* Glowing line on top */}
                                <motion.path
                                    d="M 20,90 Q 160,10 300,90"
                                    fill="none"
                                    stroke="rgba(215, 38, 61, 0.6)"
                                    strokeWidth="1"
                                    filter="url(#glow)"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 2, ease: "easeOut" as const, delay: 0.3 }}
                                />
                                <defs>
                                    <filter id="glow">
                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                            </svg>
                            <motion.div
                                className="absolute text-3xl sm:text-4xl"
                                initial={{ left: "5%", top: "65%" }}
                                animate={{
                                    left: ["5%", "48%", "90%"],
                                    top: ["65%", "5%", "65%"],
                                }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" as const }}
                            >
                                ✈️
                            </motion.div>
                        </div>

                        <motion.h3
                            className="text-2xl sm:text-3xl font-medium text-charcoal mb-4"
                            style={{ fontFamily: "var(--font-serif)" }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {place1} <span className="text-rose-deep mx-3">❤️</span> {place2}
                        </motion.h3>

                        <motion.div
                            className="text-6xl sm:text-7xl md:text-8xl font-bold text-rose-deep mb-6"
                            style={{ fontFamily: "var(--font-serif)" }}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.3 }}
                        >
                            {toBengaliNumber(displayedDistance.toLocaleString())} কি.মি.
                        </motion.div>

                        <motion.p
                            className="text-charcoal/60 italic text-lg sm:text-xl max-w-md mx-auto mb-10 leading-relaxed"
                            style={{ fontFamily: "var(--font-serif)" }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            &ldquo;প্রতিটা কিলোমিটার শুধু একটা কথা মনে করায়—দেখা হলে তোমাকে আরও জোরে জড়িয়ে ধরবো।&rdquo;
                        </motion.p>

                        <motion.button
                            onClick={reset}
                            className="text-sm text-charcoal/40 hover:text-rose-deep underline underline-offset-4 transition-colors cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            আরেকটি শহর দিয়ে দেখো
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
