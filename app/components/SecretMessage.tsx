"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import gsap from "gsap";
import { splitGraphemes } from "./textUtils";

const MESSAGE_LINES = [
    "ভালোবাসাবাসির জন্য অনন্তকালের প্রয়োজন নেই,",
    "একটি মুহূর্তই যথেষ্ট।",
    "সেই মুহূর্তটা আমি তোমাকেই দিতে চাই।",
    "",
    "সারাটা জীবন আমার পাশে থেকো।",
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

export default function SecretMessage({ isActive = false }: { isActive?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [typingComplete, setTypingComplete] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
    const sectionRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);

    // Mouse tilt
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const rotateX = useTransform(mouseY, [-200, 200], [2, -2]);
    const rotateY = useTransform(mouseX, [-200, 200], [-2, 2]);

    const fullText = MESSAGE_LINES.join("\n");

    const startTyping = useCallback(() => {
        setDisplayedText("");
        setIsTyping(true);
        setTypingComplete(false);

        let index = 0;
        const type = () => {
            if (index < fullText.length) {
                setDisplayedText(fullText.slice(0, index + 1));
                index++;
                timerRef.current = setTimeout(type, 55 + Math.random() * 25);
            } else {
                setIsTyping(false);
                setTypingComplete(true);
            }
        };
        timerRef.current = setTimeout(type, 500);
    }, [fullText]);

    const handleOpen = useCallback(() => {
        setIsOpen(true);
        startTyping();
    }, [startTyping]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setDisplayedText("");
        setIsTyping(false);
        setTypingComplete(false);
        if (timerRef.current) clearTimeout(timerRef.current);
    }, []);

    // GSAP text reveal animation when active
    useEffect(() => {
        if (isActive && titleRef.current) {
            const chars = titleRef.current.querySelectorAll(".char");
            gsap.killTweensOf(chars);
            gsap.fromTo(
                chars,
                { opacity: 0, y: 20, rotateX: 90 },
                {
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    duration: 0.6,
                    stagger: 0.02,
                    ease: "power2.out",
                    delay: 0.2
                }
            );
        }
    }, [isActive]);

    // Mouse move for tilt
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const rect = sectionRef.current?.getBoundingClientRect();
            if (!rect) return;
            mouseX.set(e.clientX - (rect.left + rect.width / 2));
            mouseY.set(e.clientY - (rect.top + rect.height / 2));
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX, mouseY]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <>
            <div ref={sectionRef} className="flex flex-col items-center text-center px-4">
                {/* Decorative particles — CSS animated */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {Array.from({ length: 12 }, (_, i) => (
                        <div
                            key={`letter-deco-${i}`}
                            className="absolute card-heart-float"
                            style={{
                                left: `${10 + ((i * 31 + 7) % 80)}%`,
                                top: `${10 + ((i * 43 + 13) % 80)}%`,
                                animationDuration: `${4 + (i % 3)}s`,
                                animationDelay: `${(i * 0.4) % 3}s`,
                            }}
                        >
                            <svg width={8 + ((i * 5) % 12)} height={8 + ((i * 5) % 12)} viewBox="0 0 24 24" fill="#D7263D" opacity={0.12}>
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.8 }}
                    className="mb-8 sm:mb-12"
                >
                    <motion.span
                        className="text-6xl sm:text-7xl md:text-8xl inline-block"
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" as const }}
                    >
                        💌
                    </motion.span>
                </motion.div>

                <h2
                    ref={titleRef}
                    className="text-3xl sm:text-5xl md:text-6xl font-bold italic text-charcoal mb-5 sm:mb-8"
                    style={{ fontFamily: "var(--font-serif)" }}
                >
                    <SplitText text="তোমার জন্য চিঠি" />
                </h2>

                <motion.p
                    className="text-lg sm:text-xl text-charcoal/50 font-light max-w-md mx-auto mb-10 sm:mb-14"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                >
                    কিছু কথা ধীরে পড়লেই সবচেয়ে বেশি ছুঁয়ে যায়
                </motion.p>

                <motion.button
                    onClick={handleOpen}
                    className="group glow-pulse rounded-full bg-linear-to-br from-rose-deep to-pink-soft
                     px-10 py-5 sm:px-14 sm:py-6 text-white font-semibold text-lg sm:text-xl
                     shadow-xl hover:shadow-2xl transition-shadow cursor-pointer relative overflow-hidden"
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(215, 38, 61, 0.35)" }}
                    whileTap={{ scale: 0.95 }}
                    style={{ rotateX, rotateY, perspective: 600 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                    />
                    <span className="relative flex items-center gap-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        চিঠিটা খুলে দেখো
                    </span>
                </motion.button>
            </div>


            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-40 bg-charcoal/40 backdrop-blur-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                        />

                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="rounded-3xl p-4 sm:p-6 md:p-6 bg-cream/95 max-w-2xl w-full relative overflow-hidden bottom-10"
                                initial={{ scale: 0.85, y: 60, rotateX: 15 }}
                                animate={{ scale: 1, y: 0, rotateX: 0 }}
                                exit={{ scale: 0.85, y: 60, rotateX: -15 }}
                                transition={{ type: "spring", stiffness: 250, damping: 30 }}
                                style={{ perspective: 800 }}
                            >
                                {/* ... content ... */}
                                <div className="text-center mb-8 sm:mb-10">
                                    <h3
                                        className="text-2xl sm:text-3xl md:text-4xl font-bold italic text-charcoal mt-4"
                                        style={{ fontFamily: "var(--font-serif)" }}
                                    >
                                        শুধু তোমার জন্য
                                    </h3>
                                </div>

                                <div
                                    className="text-center text-xl sm:text-2xl md:text-3xl leading-relaxed sm:leading-loose text-charcoal/85 italic whitespace-pre-line min-h-50"
                                    style={{ fontFamily: "var(--font-serif)" }}
                                >
                                    {displayedText}
                                    {(isTyping || typingComplete) && (
                                        <span className="typewriter-cursor" />
                                    )}
                                </div>
                                <motion.div className="text-center mt-8 sm:mt-10 text-rose-deep/40">
                                    <span className="text-base sm:text-lg italic" style={{ fontFamily: "var(--font-serif)" }}>
                                        — ভালোবাসা রইলো, সবসময় 💕
                                    </span>
                                </motion.div>
                                <motion.button
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-charcoal/10 text-charcoal/60 hover:bg-charcoal/20 hover:text-charcoal transition-colors cursor-pointer text-lg"
                                >
                                    ✕
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
