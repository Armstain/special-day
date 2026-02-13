"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { splitGraphemes } from "./textUtils";

// Helper to split Bangla text for char-by-char animation
const SplitText = ({ text }: { text: string }) => (
    <span className="inline-block" aria-label={text}>
        {splitGraphemes(text).map((char, i) => (
            <span key={i} className="char inline-block" style={{ opacity: 0 }}>
                {char === " " ? "\u00A0" : char}
            </span>
        ))}
    </span>
);

interface Question {
    emoji: string;
    title: string;
    options: string[];
}

const QUESTIONS: Question[] = [
    {
        emoji: "🧩",
        title: "আমাদের পুরো একটা দিন একসাথে কাটলে…",
        options: [
            "সারাদিন কথা বলতাম, থামতামই না",
            "পাশাপাশি বসে নিজ নিজ কাজ করতাম",
            "কোথাও বের হয়ে হারিয়ে যেতাম",
            "একটু দূরে থাকতাম, আবার কাছে ফিরতাম",
        ],
    },
    {
        emoji: "💫",
        title: "দূরে থাকলেও আমাদের কীটা সবচেয়ে বেশি ধরে রাখে?",
        options: [
            "রাতের লম্বা ফোন কল",
            "হঠাৎ 'মিস করছি' মেসেজ",
            "জানি আমরা শেষ পর্যন্ত একে অপরের কাছেই ফিরব",
           
        ],
    },
    {
        emoji: "💭",
        title: "আমি কয়েক ঘন্টা রিপ্লাই না দিলে…",
        options: [
            "আমি হয়তো আর আগের মতো নেই",
            "আমি ব্যস্ত, কিন্তু তোমাকেই ভাবছি",
            "আমার একটু নিজের সময় দরকার",
            "তোমার জন্য কিছু প্ল্যান করছি",
        ],
    },
    {
        emoji: "🌹",
        title: "আমাদের পারফেক্ট বিশেষ দিনটি হবে…",
        options: [
            "অনেক ড্রামাটিক, সবাই জানবে",
            "শান্ত, শুধু আমরা",
            "কোথাও দূরে, সবাইকে বাদ দিয়ে",
            "জায়গা গুরুত্বপূর্ণ না, আমরা থাকলেই যথেষ্ট",
        ],
    },
    {
        emoji: "✨",
        title: "শেষ পর্যন্ত কোন জিনিসটা সবচেয়ে বেশি গুরুত্বপূর্ণ?",
        options: [
            "সারাক্ষণ কথা বলা",
            "প্রতিদিন একে অপরকে বেছে নেওয়া",
            "সবসময় একসাথে থাকা",
            "একে অপরকে বুঝতে পারা",
        ],
    },
    {
        emoji: "🎁",
        title: "তোমার হলে আমার কোন জিনিসটা চুরি করে রাখতে?",
        options: [
          
            "আমার সময়",
            "আমার মনোযোগ",
            "আমার হৃদয়",
        ],
    },
];

const OPTION_LETTERS = ["A", "B", "C", "D"];
const STAMP_ROTATIONS = [-3, 5, -4, 3, -5, 4];

type Phase = "title" | "quiz" | "stamps";

export default function EmotionalGame({ isActive = false, onNext }: { isActive?: boolean; onNext?: (allAnswers: string[]) => void }) {
    const [phase, setPhase] = useState<Phase>("title");
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

    const titleRef = useRef<HTMLHeadingElement>(null);
    const stampsRef = useRef<HTMLDivElement>(null);
    const sectionRef = useRef<HTMLDivElement>(null);
    const answersRef = useRef<string[]>([]);

    // Keep answersRef in sync
    useEffect(() => { answersRef.current = answers; }, [answers]);

    // GSAP title entrance animation
    useEffect(() => {
        if (titleRef.current && isActive && phase === "title") {
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
                    stagger: 0.04,
                    ease: "back.out(1.5)",
                    delay: 0.3,
                }
            );
        }
    }, [isActive, phase]);

    // Stamp pop animation (GSAP)
    useEffect(() => {
        if (phase === "stamps" && stampsRef.current) {
            const ctx = gsap.context(() => {
                const stamps = stampsRef.current?.querySelectorAll(".stamp-badge");
                if (stamps && stamps.length > 0) {
                    gsap.fromTo(
                        stamps,
                        { scale: 0, opacity: 0 },
                        {
                            scale: 1,
                            opacity: 1,
                            duration: 0.5,
                            stagger: 0.2,
                            ease: "back.out(2.5)",
                            delay: 0.3,
                        }
                    );
                }
            }, stampsRef);

            return () => {
                ctx.revert();
            };
        }
    }, [phase]);

    const startTransition = useCallback(() => {
        setPhase("stamps");
    }, []);

    // Handle option selection
    const selectOption = useCallback((optionText: string, idx: number) => {
        if (selectedIdx !== null) return;
        setSelectedIdx(idx);
        const newAnswers = [...answers, optionText];
        setAnswers(newAnswers);

        setTimeout(() => {
            setSelectedIdx(null);
            if (currentQ < QUESTIONS.length - 1) {
                setCurrentQ((prev) => prev + 1);
            } else {
                startTransition();
            }
        }, 600);
    }, [answers, currentQ, selectedIdx, startTransition]);

    const restart = useCallback(() => {
        setPhase("title");
        setCurrentQ(0);
        setAnswers([]);
        setSelectedIdx(null);
    }, []);

    return (
        <div ref={sectionRef} className="flex flex-col items-center justify-center text-center px-4 w-full h-full relative">
            {/* Background decorative elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 10 }, (_, i) => (
                    <div
                        key={`game-deco-${i}`}
                        className="absolute rounded-full hero-deco-float"
                        style={{
                            width: 80 + ((i * 47 + 13) % 180),
                            height: 80 + ((i * 53 + 7) % 180),
                            left: `${((i * 41 + 11) % 100)}%`,
                            top: `${((i * 37 + 17) % 100)}%`,
                            background: `radial-gradient(circle, ${i % 3 === 0 ? "rgba(215,38,61,0.06)" : i % 3 === 1 ? "rgba(255,209,102,0.05)" : "rgba(255,183,197,0.06)"}, transparent)`,
                            animationDuration: `${8 + (i % 5)}s`,
                            animationDelay: `${i * 0.4}s`,
                        }}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* ═══ TITLE SCREEN ═══ */}
                {phase === "title" && (
                    <motion.div
                        key="title"
                        initial={{ opacity: 0, y: 30 }}
                        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center w-full max-w-3xl relative z-10"
                    >
                        <motion.span
                            className="text-6xl sm:text-7xl md:text-8xl mb-6 sm:mb-8 inline-block"
                            animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" as const }}
                        >
                            💝
                        </motion.span>

                        <h2
                            ref={titleRef}
                            className="text-2xl sm:text-4xl md:text-5xl font-bold italic text-charcoal mb-4 sm:mb-6 "
                            style={{ fontFamily: "var(--font-serif)" }}
                        >
                            <SplitText text="এই মুহূর্তে যদি শুধু আমরা থাকতাম…" />
                        </h2>

                        <motion.p
                            className="text-lg sm:text-xl text-charcoal/50 font-light mb-10 sm:mb-14 max-w-lg"
                            initial={{ opacity: 0, y: 15 }}
                            animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                            transition={{ delay: 0.8 }}
                        >
                            একটা একটা করে বেছে নাও।
                        </motion.p>

                        <motion.button
                            onClick={() => setPhase("quiz")}
                            className="glow-pulse bg-linear-to-r from-rose-deep to-pink-soft text-white px-12 py-4 sm:px-14 sm:py-5 rounded-full font-semibold text-lg sm:text-xl shadow-xl hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden"
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(215, 38, 61, 0.3)" }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ delay: 1.1 }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                                initial={{ x: "-100%" }}
                                whileHover={{ x: "100%" }}
                                transition={{ duration: 0.6 }}
                            />
                            <span className="relative">শুরু করি 💕</span>
                        </motion.button>
                    </motion.div>
                )}

                {/* ═══ QUIZ QUESTIONS ═══ */}
                {phase === "quiz" && (
                    <motion.div
                        key={`quiz-${currentQ}`}
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="flex flex-col items-center w-full max-w-lg relative z-10 px-2"
                    >
                        {/* Progress indicator */}
                        <div className="flex items-center gap-2 mb-6">
                            {QUESTIONS.map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="rounded-full"
                                    animate={{
                                        width: i === currentQ ? 28 : 8,
                                        height: 8,
                                        backgroundColor: i < currentQ ? "#D7263D" : i === currentQ ? "#D7263D" : "rgba(215,38,61,0.2)",
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                />
                            ))}
                        </div>

                        {/* Question number badge */}
                        <motion.div
                            className="text-3xl sm:text-4xl mb-4"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        >
                            {QUESTIONS[currentQ].emoji}
                        </motion.div>

                        {/* Question text */}
                        <motion.h3
                            className="text-xl sm:text-2xl md:text-3xl font-semibold text-charcoal mb-8 sm:mb-10 leading-relaxed"
                            style={{ fontFamily: "var(--font-serif)" }}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            &ldquo;{QUESTIONS[currentQ].title}&rdquo;
                        </motion.h3>

                        {/* Options */}
                        <div className="flex flex-col gap-3 w-full">
                            {QUESTIONS[currentQ].options.map((opt, idx) => {
                                const isSelected = selectedIdx === idx;
                                return (
                                    <motion.button
                                        key={`${currentQ}-${idx}`}
                                        onClick={() => selectOption(opt, idx)}
                                        disabled={selectedIdx !== null}
                                        className={`relative w-full text-left px-5 py-4 sm:px-6 sm:py-5 rounded-2xl border-2 
                                            transition-all duration-300 cursor-pointer group
                                            ${isSelected
                                                ? "border-rose-deep bg-rose-deep/10 shadow-lg shadow-rose-deep/15"
                                                : "border-pink-soft/40 bg-white/50 hover:border-rose-deep/60 hover:bg-white/80 hover:shadow-md"
                                            }
                                            backdrop-blur-sm disabled:cursor-default`}
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + idx * 0.08, duration: 0.3 }}
                                        whileHover={selectedIdx === null ? { scale: 1.02, x: 4 } : {}}
                                        whileTap={selectedIdx === null ? { scale: 0.98 } : {}}
                                    >
                                        <div className="flex items-center gap-3 sm:gap-4">
                                            <span
                                                className={`flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-sm font-bold
                                                    transition-all duration-300
                                                    ${isSelected
                                                        ? "bg-rose-deep text-white scale-110"
                                                        : "bg-pink-soft/30 text-charcoal/60 group-hover:bg-rose-deep/20 group-hover:text-rose-deep"
                                                    }`}
                                            >
                                                {OPTION_LETTERS[idx]}
                                            </span>
                                            <span
                                                className={`text-base sm:text-lg font-medium transition-colors duration-300
                                                    ${isSelected ? "text-rose-deep" : "text-charcoal/80 group-hover:text-charcoal"}`}
                                            >
                                                {opt}
                                            </span>
                                        </div>
                                        {isSelected && (
                                            <motion.div
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xl"
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                            >
                                                💗
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}




                {/* ═══ STAMPS OVERVIEW ═══ */}
                {phase === "stamps" && (
                    <motion.div
                        key="stamps"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center relative z-10 max-w-2xl w-full px-2"
                    >
                        <motion.h3
                            className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-deep mb-3"
                            style={{ fontFamily: "var(--font-serif)" }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            তোমার উত্তরগুলো 💌
                        </motion.h3>
                        <motion.p
                            className="text-charcoal/50 text-base sm:text-lg mb-8 italic"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            দেখো তুমি কী কী বলেছো…
                        </motion.p>

                        <div ref={stampsRef} className="flex flex-wrap justify-center gap-4 sm:gap-5 mb-10">
                            {answers.map((answer, i) => (
                                <div
                                    key={i}
                                    className="stamp-badge"
                                    style={{
                                        transform: `rotate(${STAMP_ROTATIONS[i % STAMP_ROTATIONS.length]}deg)`,
                                        transition: "transform 0.3s ease",
                                    }}
                                >
                                    <div
                                        className={`
                                            px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl
                                            border-2 border-dashed
                                            text-sm sm:text-base font-medium
                                            max-w-[200px] text-center
                                            shadow-md
                                            ${i % 2 === 0
                                                ? "border-rose-deep/60 bg-rose-deep/8 text-rose-deep"
                                                : "border-pink-soft bg-pink-soft/20 text-charcoal/80"
                                            }
                                        `}
                                    >
                                        <span className="block text-lg mb-1">📍</span>
                                        &ldquo;{answer}&rdquo;
                                    </div>
                                </div>
                            ))}
                        </div>

                        <motion.button
                            onClick={() => onNext?.(answersRef.current)}
                            className="mt-8 bg-rose-deep text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:bg-rose-deep/90 transition-all cursor-pointer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            সামনে এগোই ✨
                        </motion.button>

                        <motion.button
                            onClick={restart}
                            className="mt-4 text-sm text-charcoal/40 hover:text-rose-deep underline underline-offset-4 transition-colors cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                        >
                            আবার খেলো
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
