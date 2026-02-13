"use client";

import { useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import gsap from "gsap";
import { splitGraphemes } from "./textUtils";

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

// Pre-generate decorative particle positions
const DECO_PARTICLES = Array.from({ length: 50 }, (_, i) => ({
    width: 4 + ((i * 3 + 2) % 10),
    left: `${((i * 37 + 7) % 100)}%`,
    top: `${((i * 47 + 11) % 100)}%`,
    colorIdx: i % 3,
    opacity: 0.12 + ((i * 7) % 5) * 0.04,
    duration: `${3 + ((i * 11) % 5)}s`,
    delay: `${((i * 0.6) % 3).toFixed(1)}s`,
}));

export default function HeroCountdown({ isActive = true }: { isActive?: boolean }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleContainerRef = useRef<HTMLDivElement>(null);
    const subtitleRef = useRef<HTMLDivElement>(null);

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

    // Subtitle fade in
    useEffect(() => {
        if (isActive && subtitleRef.current) {
            gsap.fromTo(
                subtitleRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 1, ease: "power2.out", delay: 1.2 }
            );
        }
    }, [isActive]);

    return (
        <>
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

                <div className="flex flex-col items-center">
                    <div ref={titleContainerRef} className="overflow-hidden mb-3 sm:mb-5 flex flex-col items-center gap-2">
                        <div className="text-3xl sm:text-6xl font-serif text-[#D7263D] mb-1 font-extrabold tracking-wide">
                            <SplitText text="Popy" />
                        </div>
                        <h1
                            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold italic text-charcoal flex flex-wrap justify-center gap-x-4"
                            style={{ fontFamily: "var(--font-serif)" }}
                        >
                            <SplitText text="একটা" />
                            <SplitText text="গল্প" />
                            <SplitText text="চলছে…" />
                        </h1>
                    </div>

                    <div ref={subtitleRef} style={{ opacity: 0 }}>
                        <p
                            className="text-lg sm:text-xl md:text-2xl text-charcoal/50 mb-10 sm:mb-14 max-w-xl font-light tracking-wide"
                        >
                            আজ তার আরেকটা অধ্যায়।
                        </p>

                        <div className="flex items-center gap-3 text-charcoal/30">
                            <div className="h-px w-12 bg-charcoal/15" />
                            <span className="text-sm tracking-[0.3em] font-medium">স্ক্রল করো</span>
                            <svg
                                width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                className="nav-arrow-right"
                            >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                            <div className="h-px w-12 bg-charcoal/15" />
                        </div>
                    </div>
                </div>
            </motion.div>
        </>
    );
}
