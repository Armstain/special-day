"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";

// Helper to split text
const SplitText = ({ text }: { text: string }) => (
    <span className="inline-block" aria-label={text}>
        {text.split("").map((char, i) => (
            <span key={i} className="char inline-block" style={{ opacity: 0 }}>
                {char === " " ? "\u00A0" : char}
            </span>
        ))}
    </span>
);

export default function ShareCardGenerator({ isActive = false }: { isActive?: boolean }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGenerated, setIsGenerated] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null);
    const cardWrapperRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    // GSAP animations when active
    useEffect(() => {
        if (isActive) {
            // Card entrance
            if (cardWrapperRef.current) {
                gsap.fromTo(
                    cardWrapperRef.current,
                    { scale: 0.8, opacity: 0, rotateY: 15 },
                    {
                        scale: 1,
                        opacity: 1,
                        rotateY: 0,
                        duration: 1,
                        ease: "back.out(1.4)",
                        delay: 0.5,
                    }
                );
            }

            // Title entrance
            if (titleRef.current) {
                const chars = titleRef.current.querySelectorAll(".char");
                gsap.killTweensOf(chars);
                gsap.fromTo(
                    chars,
                    { opacity: 0, y: 30, rotateX: 45 },
                    {
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        duration: 0.8,
                        stagger: 0.04,
                        ease: "power3.out",
                        delay: 0.2,
                    }
                );
            }
        }
    }, [isActive]);

    const handleDownload = useCallback(async () => {
        if (!cardRef.current || isGenerating) return;
        setIsGenerating(true);

        try {
            const html2canvas = (await import("html2canvas")).default;
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 2,
                useCORS: true,
            });
            const link = document.createElement("a");
            link.download = "valentine-card.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
            setIsGenerated(true);
        } catch (err) {
            console.error("Failed to generate card:", err);
        } finally {
            setIsGenerating(false);
        }
    }, [isGenerating]);

    return (
        <div ref={sectionRef} className="flex flex-col items-center justify-center text-center px-4 w-full">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 6 }, (_, i) => (
                    <div
                        key={`card-deco-${i}`}
                        className="absolute card-heart-float"
                        style={{
                            left: `${15 + i * 14}%`,
                            top: `${10 + (i % 3) * 30}%`,
                            animationDuration: `${5 + i}s`,
                            animationDelay: `${i * 0.4}s`,
                        }}
                    >
                        <svg width={20 + i * 5} height={20 + i * 5} viewBox="0 0 24 24" fill="#D7263D" opacity={0.08}>
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    </div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6 }}
                className="mb-8 sm:mb-10 relative z-10"
            >
                <h2
                    ref={titleRef}
                    className="text-3xl sm:text-5xl md:text-6xl font-bold italic text-charcoal mb-3 sm:mb-5"
                    style={{ fontFamily: "var(--font-serif)" }}
                >
                    <SplitText text="Our Valentine Card" />
                </h2>
                <motion.p
                    className="text-lg sm:text-xl text-charcoal/50 font-light max-w-md mx-auto"
                    initial={{ opacity: 0, y: 10 }}
                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ delay: 0.8 }} // Delayed to appear after title
                >
                    Take a piece of this moment with you
                </motion.p>
            </motion.div>

            {/* Card Preview — with GSAP entrance + hover 3D */}
            <motion.div
                ref={cardWrapperRef}
                className="w-full max-w-lg mb-8 sm:mb-10 relative z-10"
                style={{ perspective: 800, opacity: 0 }} // Start invisible for GSAP
                whileHover={{ rotateY: 5, rotateX: -3, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
                <div
                    ref={cardRef}
                    className="relative overflow-hidden rounded-3xl p-10 sm:p-14"
                    style={{
                        background: "linear-gradient(135deg, #FFF5EE 0%, #FFB7C5 40%, #D7263D 100%)",
                        minHeight: 380,
                    }}
                >
                    {/* Animated shine sweep */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 3, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                        style={{ width: "50%" }}
                    />

                    {/* Decorative hearts */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        {Array.from({ length: 8 }, (_, i) => (
                            <div
                                key={i}
                                className="absolute card-heart-float"
                                style={{
                                    left: `${10 + (i * 11) % 80}%`,
                                    top: `${5 + (i * 13) % 85}%`,
                                    opacity: 0.12 + (i % 3) * 0.04,
                                    animationDuration: `${4 + i % 3}s`,
                                    animationDelay: `${i * 0.3}s`,
                                }}
                            >
                                <svg
                                    width={14 + (i % 4) * 8}
                                    height={14 + (i % 4) * 8}
                                    viewBox="0 0 24 24"
                                    fill="white"
                                >
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            </div>
                        ))}
                    </div>

                    <div className="relative z-10 text-center flex flex-col items-center justify-center min-h-[280px]">
                        <motion.div
                            className="text-6xl sm:text-7xl mb-5"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            💕
                        </motion.div>
                        <h3
                            className="text-3xl sm:text-4xl md:text-5xl font-bold italic text-white mb-5 drop-shadow-lg"
                            style={{ fontFamily: "var(--font-serif)" }}
                        >
                            Happy Valentine&apos;s Day
                        </h3>
                        <p
                            className="text-white/90 text-lg sm:text-xl italic leading-relaxed max-w-sm drop-shadow-sm"
                            style={{ fontFamily: "var(--font-serif)" }}
                        >
                            &ldquo;Distance means so little,
                            <br />
                            when someone means so much.&rdquo;
                        </p>
                        <div className="mt-8 flex items-center gap-2 text-white/50 text-sm">
                            <span>♡</span>
                            <span style={{ fontFamily: "var(--font-serif)" }}>February 14, 2026</span>
                            <span>♡</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Download Button */}
            <motion.button
                onClick={handleDownload}
                disabled={isGenerating}
                className="glow-pulse bg-gradient-to-r from-rose-deep to-pink-soft text-white
                   px-10 py-4 sm:px-14 sm:py-5 rounded-full text-lg sm:text-xl font-semibold
                   shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 cursor-pointer relative overflow-hidden z-10"
                whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(215, 38, 61, 0.3)" }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Shine effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                />
                <span className="relative">
                    {isGenerating ? (
                        <span className="flex items-center gap-2">
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" as const }}
                                className="inline-block"
                            >
                                ✨
                            </motion.span>
                            Creating...
                        </span>
                    ) : isGenerated ? (
                        "Download Again 💝"
                    ) : (
                        "Download Card 💌"
                    )}
                </span>
            </motion.button>
        </div>
    );
}
