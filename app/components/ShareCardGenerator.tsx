"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { splitGraphemes } from "./textUtils";

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

type Phase = "prompt" | "celebration" | "card";

const STAMP_ROTATIONS = [-3, 4, -2, 3, -4, 5];

// ── Canvas Card Renderer ─────────────────────────────────
function renderCardToCanvas(message: string, stamps: string[] = []): HTMLCanvasElement {
    const W = 800;
    const H = 1000;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#FFF5EE");
    bg.addColorStop(0.4, "#FFB7C5");
    bg.addColorStop(1, "#D7263D");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 24);
    ctx.fill();

    // Decorative hearts (scattered)
    ctx.globalAlpha = 0.1;
    const heartPositions = [
        [120, 150, 30], [650, 200, 20], [100, 500, 25],
        [680, 450, 18], [350, 100, 22], [500, 700, 28],
        [200, 800, 20], [600, 850, 24],
    ];
    for (const [hx, hy, hs] of heartPositions) {
        drawHeartOnCanvas(ctx, hx, hy, hs);
    }
    ctx.globalAlpha = 1;

    // Main emoji
    ctx.font = "80px serif";
    ctx.textAlign = "center";
    ctx.fillText("💕", W / 2, 180);

    // Title
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold italic 56px 'Playfair Display', Georgia, serif";
    ctx.textAlign = "center";

    ctx.globalAlpha = 0.3;
    ctx.fillText("শুভ ভালোবাসা দিবস", W / 2 + 2, 292);
    ctx.globalAlpha = 1;
    ctx.fillText("শুভ ভালোবাসা দিবস", W / 2, 290);

    // Custom message or default quote
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "500 26px 'Anek Bangla', sans-serif";

    const textToDisplay = message.trim()
        ? message.trim()
        : '"দূরত্ব কোনো বিষয় না,\nযখন কেউ এতটা মানে রাখে।"';

    const lines = wrapText(ctx, textToDisplay, W - 120, 26);
    const startY = 380 - (lines.length * 36) / 2;
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], W / 2, startY + i * 36);
    }

    // Draw Stamps on canvas
    if (stamps.length > 0) {
        const stampY = 550;
        stamps.forEach((stamp, i) => {
            const x = i === 0 ? W / 2 - 200 : W / 2 + 200;
            const y = stampY + (i % 2 === 0 ? -20 : 20);

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(i === 0 ? -0.05 : 0.05);

            ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
            ctx.strokeStyle = "#D7263D";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);

            const textWidth = ctx.measureText(stamp).width;
            const boxW = Math.max(250, textWidth + 40);
            const boxH = 100;

            ctx.beginPath();
            ctx.roundRect(-boxW / 2, -boxH / 2, boxW, boxH, 12);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#D7263D";
            ctx.font = "500 20px 'Anek Bangla', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("📍 " + stamp, 0, 0);

            ctx.restore();
        });
    }

    // Date
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "500 16px 'Anek Bangla', sans-serif";
    ctx.setLineDash([]);
    ctx.fillText("♡  ১৪ ফেব্রুয়ারি, ২০২৬  ♡", W / 2, H - 80);

    // Bottom decorative line
    const lineGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
    lineGrad.addColorStop(0, "transparent");
    lineGrad.addColorStop(0.5, "rgba(255,255,255,0.3)");
    lineGrad.addColorStop(1, "transparent");
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(W * 0.2, H - 120);
    ctx.lineTo(W * 0.8, H - 120);
    ctx.stroke();

    return canvas;
}

function drawHeartOnCanvas(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    const s = size * 0.5;
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s, -s * 0.5, -s, s * 0.6, 0, s);
    ctx.bezierCurveTo(s, s * 0.6, s, -s * 0.5, 0, s * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, _fontSize: number): string[] {
    const paragraphs = text.split("\n");
    const lines: string[] = [];
    for (const para of paragraphs) {
        const words = para.split(" ");
        let current = "";
        for (const word of words) {
            const test = current ? `${current} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
    }
    return lines;
}

// ── Pre-generated celebration hearts ─────────────────────
const CELEBRATION_HEARTS = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: ((i * 41 + 7) % 100),
    color: ["#D7263D", "#FFB7C5", "#FFD166", "#ff6b8a", "#ff9eb5"][i % 5],
    delay: (i * 0.04).toFixed(2),
    duration: (2 + (i % 15) / 10).toFixed(1),
    size: 8 + (i % 12),
    rotate: ((i * 30) % 360),
}));

export default function ShareCardGenerator({ isActive = false, answers = [] }: { isActive?: boolean; answers?: string[] }) {
    const [phase, setPhase] = useState<Phase>("prompt");
    const [customMessage, setCustomMessage] = useState("");
    const [selectedStamps, setSelectedStamps] = useState<string[]>([]);
    const [isDownloading, setIsDownloading] = useState(false);
    const [noButtonOffset, setNoButtonOffset] = useState({ x: 0, y: 0 });
    const sectionRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const cardTitleRef = useRef<HTMLDivElement>(null);

    // GSAP title entrance for prompt
    useEffect(() => {
        if (isActive && phase === "prompt" && titleRef.current) {
            const chars = titleRef.current.querySelectorAll(".char");
            gsap.killTweensOf(chars);
            gsap.fromTo(
                chars,
                { opacity: 0, y: 30, rotateX: 45 },
                {
                    opacity: 1, y: 0, rotateX: 0,
                    duration: 0.8, stagger: 0.04,
                    ease: "power3.out", delay: 0.2,
                }
            );
        }
    }, [isActive, phase]);

    // Card title entrance
    useEffect(() => {
        if (isActive && phase === "card" && cardTitleRef.current) {
            const chars = cardTitleRef.current.querySelectorAll(".char");
            gsap.killTweensOf(chars);
            gsap.fromTo(
                chars,
                { opacity: 0, y: 20, scale: 0.8 },
                {
                    opacity: 1, y: 0, scale: 1,
                    duration: 0.6, stagger: 0.03,
                    ease: "back.out(1.5)", delay: 0.2,
                }
            );
        }
    }, [isActive, phase]);

    const handleYes = useCallback(() => {
        setPhase("celebration");
        setTimeout(() => setPhase("card"), 3000);
    }, []);

    const handleNoHover = useCallback(() => {
        const maxX = 200;
        const maxY = 100;
        setNoButtonOffset({
            x: (Math.random() - 0.5) * maxX * 2,
            y: (Math.random() - 0.5) * maxY * 2,
        });
    }, []);

    const toggleStamp = useCallback((stamp: string) => {
        setSelectedStamps((prev) => {
            if (prev.includes(stamp)) {
                return prev.filter((s) => s !== stamp);
            }
            if (prev.length >= 2) return prev;
            return [...prev, stamp];
        });
    }, []);

    const handleDownload = useCallback(() => {
        setIsDownloading(true);
        try {
            const canvas = renderCardToCanvas(customMessage, selectedStamps);
            const link = document.createElement("a");
            link.download = "valentine-card.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (err) {
            console.error("Failed to generate card:", err);
        } finally {
            setIsDownloading(false);
        }
    }, [customMessage, selectedStamps]);

    return (
        <div ref={sectionRef} className="flex flex-col items-center justify-center text-center px-4 w-full">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 8 }, (_, i) => (
                    <div
                        key={`card-deco-${i}`}
                        className="absolute card-heart-float"
                        style={{
                            left: `${15 + i * 11}%`,
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

            <AnimatePresence mode="wait">
                {/* ═══ PHASE 1: Valentine Prompt ═══ */}
                {phase === "prompt" && (
                    <motion.div
                        key="prompt"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8, y: -30 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col items-center relative z-10"
                    >
                        {/* Big animated heart */}
                        <motion.div
                            className="text-7xl sm:text-8xl md:text-9xl mb-8"
                            animate={{ scale: [1, 1.15, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                            💝
                        </motion.div>

                        {/* Title */}
                        <h2
                            ref={titleRef}
                            className="text-4xl sm:text-5xl md:text-7xl font-bold italic text-charcoal mb-4 sm:mb-6"
                            style={{ fontFamily: "var(--font-serif)" }}
                        >
                            <SplitText text="তুমি কি" />
                            <br />
                            <SplitText text="আমার ভ্যালেন্টাইন?" />
                        </h2>

                        <motion.p
                            className="text-lg sm:text-xl text-charcoal/50 font-light mb-12 sm:mb-16 max-w-md"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                        >
                            বুদ্ধি করে বেছে নাও... বা চেষ্টা করো 😉
                        </motion.p>

                        {/* Yes / No Buttons */}
                        <div className="flex items-center gap-6 sm:gap-10 relative">
                            <motion.button
                                className="px-12 py-4 sm:px-16 sm:py-5 rounded-full text-xl sm:text-2xl font-bold text-white
                                           shadow-xl cursor-pointer relative overflow-hidden"
                                style={{
                                    background: "linear-gradient(135deg, #D7263D, #ff6b8a)",
                                    boxShadow: "0 10px 40px rgba(215, 38, 61, 0.4)",
                                }}
                                whileHover={{
                                    scale: 1.1,
                                    boxShadow: "0 15px 50px rgba(215, 38, 61, 0.5)",
                                }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleYes}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                            >
                                {/* Shine sweep */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                                    animate={{ x: ["-100%", "200%"] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                    style={{ width: "50%" }}
                                />
                                <span className="relative">হ্যাঁ! 💕</span>
                            </motion.button>

                            {/* No button that dodges */}
                            <div className="relative" style={{ width: 120, height: 50 }}>
                                <button
                                    className="absolute px-8 py-3 sm:px-10 sm:py-4 rounded-full text-base sm:text-lg font-medium
                                               text-charcoal/60 border-2 border-charcoal/15 bg-white/60
                                               backdrop-blur-sm cursor-pointer select-none whitespace-nowrap"
                                    style={{
                                        left: `${noButtonOffset.x}px`,
                                        top: `${noButtonOffset.y}px`,
                                        transition: "left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                    }}
                                    onMouseEnter={handleNoHover}
                                    onTouchStart={handleNoHover}
                                >
                                    না 😢
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ═══ PHASE 2: Celebration ═══ */}
                {phase === "celebration" && (
                    <motion.div
                        key="celebration"
                        className="flex flex-col items-center relative z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Sun burst */}
                        <motion.div
                            className="absolute rounded-full"
                            style={{
                                width: 600,
                                height: 600,
                                background: "radial-gradient(circle, rgba(255,209,102,0.4) 0%, rgba(255,209,102,0.1) 40%, transparent 70%)",
                            }}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: [0, 2.5], opacity: [0, 1, 0.6] }}
                            transition={{ duration: 2, ease: "easeOut" }}
                        />

                        {/* Hearts rain */}
                        <div className="fixed inset-0 pointer-events-none z-50">
                            {CELEBRATION_HEARTS.map((h) => (
                                <div
                                    key={h.id}
                                    className="absolute confetti-fall"
                                    style={{
                                        left: `${h.x}%`,
                                        top: -20,
                                        animationDelay: `${h.delay}s`,
                                        animationDuration: `${h.duration}s`,
                                        ["--confetti-rotate" as string]: `${h.rotate}deg`,
                                    }}
                                >
                                    <svg width={h.size} height={h.size} viewBox="0 0 24 24" fill={h.color}>
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                    </svg>
                                </div>
                            ))}
                        </div>

                        {/* Yay text */}
                        <motion.div
                            className="text-6xl sm:text-8xl md:text-9xl font-bold italic text-rose-deep relative z-10"
                            style={{ fontFamily: "var(--font-serif)" }}
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.3 }}
                        >
                            ইয়ে! 💕
                        </motion.div>

                        <motion.p
                            className="text-xl sm:text-2xl text-charcoal/60 mt-6 font-light"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            জানতাম তুমি হ্যাঁ বলবে ✨
                        </motion.p>
                    </motion.div>
                )}

                {/* ═══ PHASE 3: Card Creator with Stamp Picker ═══ */}
                {phase === "card" && (
                    <motion.div
                        key="card"
                        className="flex flex-col items-center relative z-10 w-full max-w-4xl px-2"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        {/* Title — compact */}
                        <div ref={cardTitleRef} className="mb-4">
                            <h2
                                className="text-2xl sm:text-3xl md:text-4xl font-bold italic text-charcoal mb-1"
                                style={{ fontFamily: "var(--font-serif)" }}
                            >
                                <SplitText text="তোমার ভ্যালেন্টাইন কার্ড" />
                            </h2>
                            <motion.p
                                className="text-sm sm:text-base text-charcoal/50 font-light"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                স্ট্যাম্প বেছে নাও, বার্তা লেখো, আর কার্ড ডাউনলোড করো 💌
                            </motion.p>
                        </div>

                        {/* ── Main Layout: Stamps + Message side by side ── */}
                        <motion.div
                            className="w-full flex flex-col md:flex-row gap-4 mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {/* Left: Stamp Picker — BADGE STYLE */}
                            {answers.length > 0 && (
                                <div className="md:w-1/2 w-full">
                                    <div
                                        className="rounded-2xl p-4 h-full"
                                        style={{
                                            background: "rgba(255,245,238,0.7)",
                                            backdropFilter: "blur(10px)",
                                            border: "1px solid rgba(255,183,197,0.3)",
                                            boxShadow: "0 4px 20px rgba(215,38,61,0.06)",
                                        }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-bold text-rose-deep flex items-center gap-1.5">
                                                📌 স্ট্যাম্প বাছাই করো
                                            </h4>
                                            <span className={`
                                                text-xs font-bold px-2 py-0.5 rounded-full transition-colors
                                                ${selectedStamps.length === 2
                                                    ? "bg-green-500/15 text-green-600"
                                                    : "bg-rose-deep/10 text-rose-deep"
                                                }
                                            `}>
                                                {selectedStamps.length}/2 ✓
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-charcoal/40 mb-3">
                                            কার্ডে যোগ করতে ২টি ট্যাপ করো
                                        </p>

                                        {/* Stamp badges — flex wrap grid */}
                                        <div className="flex flex-wrap gap-2.5 justify-center">
                                            {answers.map((answer, i) => {
                                                const isSelected = selectedStamps.includes(answer);
                                                const isDisabled = !isSelected && selectedStamps.length >= 2;
                                                return (
                                                    <motion.button
                                                        key={i}
                                                        onClick={() => toggleStamp(answer)}
                                                        disabled={isDisabled}
                                                        className="stamp-badge cursor-pointer"
                                                        whileHover={!isDisabled ? { scale: 1.08 } : {}}
                                                        whileTap={!isDisabled ? { scale: 0.93 } : {}}
                                                        style={{
                                                            transform: `rotate(${STAMP_ROTATIONS[i % STAMP_ROTATIONS.length]}deg)`,
                                                        }}
                                                    >
                                                        <div
                                                            className={`
                                                                px-3 py-2.5 rounded-xl
                                                                border-2 border-dashed
                                                                text-xs sm:text-sm font-medium
                                                                max-w-[170px] text-center
                                                                transition-all duration-300
                                                                ${isSelected
                                                                    ? "border-rose-deep bg-rose-deep text-white shadow-lg ring-3 ring-rose-deep/25 scale-105"
                                                                    : isDisabled
                                                                        ? "border-charcoal/15 bg-charcoal/5 text-charcoal/25 cursor-not-allowed"
                                                                        : i % 2 === 0
                                                                            ? "border-rose-deep/50 bg-rose-deep/8 text-rose-deep hover:bg-rose-deep/15 shadow-sm"
                                                                            : "border-pink-soft bg-pink-soft/20 text-charcoal/70 hover:bg-pink-soft/35 shadow-sm"
                                                                }
                                                            `}
                                                        >
                                                            <span className="block text-base mb-0.5">
                                                                {isSelected ? "💖" : isDisabled ? "🔒" : "📍"}
                                                            </span>
                                                            <span className="leading-tight block">
                                                                &ldquo;{answer}&rdquo;
                                                            </span>
                                                        </div>
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Right: Message Textarea */}
                            <div className={answers.length > 0 ? "md:w-1/2 w-full" : "w-full max-w-md"}>
                                <div
                                    className="rounded-2xl p-4 h-full flex flex-col"
                                    style={{
                                        background: "rgba(255,245,238,0.7)",
                                        backdropFilter: "blur(10px)",
                                        border: "1px solid rgba(255,183,197,0.3)",
                                        boxShadow: "0 4px 20px rgba(215,38,61,0.06)",
                                    }}
                                >
                                    <h4 className="text-sm font-bold text-rose-deep mb-2">
                                        ✏️ তোমার বার্তা লেখো
                                    </h4>
                                    <textarea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder="এখানে তোমার বার্তা লেখো... ✨"
                                        maxLength={200}
                                        className="w-full flex-1 px-4 py-3 rounded-xl text-sm sm:text-base text-charcoal
                                                   placeholder-charcoal/30 resize-none focus:outline-none
                                                   focus:ring-2 focus:ring-rose-deep/30 transition-all"
                                        style={{
                                            background: "rgba(255,255,255,0.6)",
                                            border: "1px solid rgba(255,183,197,0.2)",
                                            fontFamily: "var(--font-serif)",
                                            minHeight: 100,
                                        }}
                                        rows={3}
                                    />
                                    <p className="text-right text-[11px] text-charcoal/30 mt-0.5">
                                        {customMessage.length}/200
                                    </p>

                                    {/* Selected stamps preview in message area */}
                                    {selectedStamps.length > 0 && (
                                        <div className="mt-2 flex gap-2 flex-wrap">
                                            {selectedStamps.map((stamp, i) => (
                                                <motion.div
                                                    key={stamp}
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="px-2.5 py-1 bg-rose-deep/10 border border-dashed border-rose-deep/30 rounded-lg text-rose-deep text-[11px] sm:text-xs font-medium flex items-center gap-1"
                                                    style={{
                                                        transform: `rotate(${STAMP_ROTATIONS[i]}deg)`,
                                                    }}
                                                >
                                                    💖 {stamp}
                                                    <button
                                                        onClick={() => toggleStamp(stamp)}
                                                        className="ml-0.5 w-3.5 h-3.5 rounded-full bg-rose-deep/20 text-rose-deep text-[9px] flex items-center justify-center hover:bg-rose-deep/40 transition-colors cursor-pointer"
                                                    >
                                                        ×
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                        {/* Download Button — always visible */}
                        <motion.button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="glow-pulse bg-gradient-to-r from-rose-deep to-pink-soft text-white
                               px-10 py-3.5 sm:px-14 sm:py-4 rounded-full text-base sm:text-lg font-semibold
                               shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 cursor-pointer relative overflow-hidden"
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(215, 38, 61, 0.3)" }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            {/* Shine effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                initial={{ x: "-100%" }}
                                whileHover={{ x: "100%" }}
                                transition={{ duration: 0.6 }}
                            />
                            <span className="relative">
                                {isDownloading ? (
                                    <span className="flex items-center gap-2">
                                        <motion.span
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" as const }}
                                            className="inline-block"
                                        >
                                            ✨
                                        </motion.span>
                                        তৈরি হচ্ছে...
                                    </span>
                                ) : (
                                    "কার্ড ডাউনলোড করো 💌"
                                )}
                            </span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
