"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";

interface WelcomeGateProps {
    onComplete: () => void;
}

/*  ═══════════════════════════════════════════════════════
    Theatrical curtain-pull gate
    ─────────────────────────────────────────────────────
    Phase 1 – DARK          Pure black, nothing visible
    Phase 2 – SPOTLIGHT     A soft spotlight fades in center
                            revealing a short romantic line
    Phase 3 – LIGHTS ON     Curtain panels illuminate,
                            pull hint appears
    Phase 4 – PULLING       She drags to pull curtains apart.
                            Requires multiple pulls (resistance).
                            Once fully open → site revealed.
    ═══════════════════════════════════════════════════════ */

// How many total px of drag it takes to fully open (relative to vw)
const TOTAL_PULL_NEEDED_RATIO = 0.55; // 55% of viewport width total drag
// Resistance: each drag px only contributes this fraction
const DRAG_RESISTANCE = 0.35;
// How far open (0→1) before auto-completing
const AUTO_COMPLETE_THRESHOLD = 0.85;

// Curtain fold pattern — vertical gradients to simulate fabric folds
const FOLD_GRADIENT_LEFT =
    "repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0px, transparent 3px, transparent 40px, rgba(0,0,0,0.05) 42px, transparent 44px, transparent 80px)";
const FOLD_GRADIENT_RIGHT =
    "repeating-linear-gradient(90deg, transparent 0px, rgba(0,0,0,0.05) 38px, transparent 40px, transparent 42px, rgba(0,0,0,0.08) 80px)";

export default function WelcomeGate({ onComplete }: WelcomeGateProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const leftCurtainRef = useRef<HTMLDivElement>(null);
    const rightCurtainRef = useRef<HTMLDivElement>(null);
    const spotlightRef = useRef<HTMLDivElement>(null);
    const messageRef = useRef<HTMLDivElement>(null);
    const hintRef = useRef<HTMLDivElement>(null);
    const curtainOverlayRef = useRef<HTMLDivElement>(null);

    const [phase, setPhase] = useState<"dark" | "spotlight" | "lights" | "pulling">("dark");

    // Pulling state (refs for perf — no re-renders during drag)
    const totalProgress = useRef(0);          // 0 → 1 cumulative progress
    const dragging = useRef(false);
    const dragStartX = useRef(0);
    const dragSessionDelta = useRef(0);       // current drag session accumulated
    const dismissedRef = useRef(false);
    const phaseRef = useRef(phase);

    useEffect(() => { phaseRef.current = phase; }, [phase]);

    // ─── Phase orchestration ────────────────────────────
    useEffect(() => {
        const tl = gsap.timeline();

        // Phase 1 → 2: Spotlight fades in after 1s
        tl.to({}, { duration: 1.0, onComplete: () => setPhase("spotlight") });

        // Spotlight circle and message
        tl.fromTo(
            spotlightRef.current,
            { opacity: 0, scale: 0.3 },
            { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" },
            "+=0.1"
        );
        tl.fromTo(
            messageRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
            "-=0.8"
        );

        // Phase 2 → 3: After message lingers, "lights on" — curtains revealed
        tl.to({}, {
            duration: 2.0,
            onComplete: () => setPhase("lights"),
        });

        // Illuminate curtains (reduce the darkness overlay)
        tl.to(curtainOverlayRef.current, {
            opacity: 0,
            duration: 1.2,
            ease: "power2.inOut",
        });

        // Fade spotlight message out as full scene reveals
        tl.to(spotlightRef.current, {
            opacity: 0,
            scale: 1.3,
            duration: 0.8,
            ease: "power2.in",
        }, "-=1.0");

        // Show pull hint
        tl.fromTo(
            hintRef.current,
            { opacity: 0, y: 15 },
            {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.out",
                onComplete: () => setPhase("pulling"),
            },
        );
    }, []);

    // ─── Apply curtain position based on progress ───────
    const applyCurtainPosition = useCallback((progress: number) => {
        if (!leftCurtainRef.current || !rightCurtainRef.current) return;
        const vw = window.innerWidth;
        const maxTravel = vw * 0.52; // each curtain can travel 52% of vw
        const offset = progress * maxTravel;

        gsap.set(leftCurtainRef.current, { x: -offset });
        gsap.set(rightCurtainRef.current, { x: offset });

        // As curtains open, a warm light bleeds through the gap
        if (hintRef.current) {
            gsap.set(hintRef.current, { opacity: Math.max(0, 1 - progress * 2) });
        }
    }, []);

    // ─── Complete the opening ───────────────────────────
    const completeOpen = useCallback(() => {
        if (dismissedRef.current) return;
        dismissedRef.current = true;

        const vw = window.innerWidth;
        const tl = gsap.timeline({ onComplete: () => onComplete() });

        // Curtains fly fully off screen
        tl.to(leftCurtainRef.current, {
            x: -(vw * 0.6),
            duration: 0.7,
            ease: "power3.in",
        }, 0);
        tl.to(rightCurtainRef.current, {
            x: vw * 0.6,
            duration: 0.7,
            ease: "power3.in",
        }, 0);
        tl.to(containerRef.current, {
            opacity: 0,
            duration: 0.4,
        }, 0.5);
    }, [onComplete]);

    // ─── Snap curtain to current progress (with bounce) ─
    const snapToProgress = useCallback(() => {
        if (!leftCurtainRef.current || !rightCurtainRef.current) return;
        const vw = window.innerWidth;
        const maxTravel = vw * 0.52;
        const offset = totalProgress.current * maxTravel;

        gsap.to(leftCurtainRef.current, {
            x: -offset,
            duration: 0.4,
            ease: "elastic.out(1, 0.6)",
        });
        gsap.to(rightCurtainRef.current, {
            x: offset,
            duration: 0.4,
            ease: "elastic.out(1, 0.6)",
        });
    }, []);

    // ─── Pointer handlers ───────────────────────────────
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (phaseRef.current !== "pulling" || dismissedRef.current) return;
        dragging.current = true;
        dragStartX.current = e.clientX;
        dragSessionDelta.current = 0;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging.current || dismissedRef.current) return;
        const dx = e.clientX - dragStartX.current;
        const absDx = Math.abs(dx);
        const vw = window.innerWidth;
        const totalNeeded = vw * TOTAL_PULL_NEEDED_RATIO;

        // Apply resistance — raw drag is dampened
        const effectiveDelta = (absDx * DRAG_RESISTANCE) / totalNeeded;
        const newProgress = Math.min(1, totalProgress.current + effectiveDelta - dragSessionDelta.current);
        dragSessionDelta.current = effectiveDelta;

        applyCurtainPosition(Math.max(0, newProgress));
    }, [applyCurtainPosition]);

    const handlePointerUp = useCallback(() => {
        if (!dragging.current || dismissedRef.current) return;
        dragging.current = false;

        // Commit the drag session delta to total progress
        totalProgress.current = Math.min(1, totalProgress.current + dragSessionDelta.current);
        dragSessionDelta.current = 0;

        if (totalProgress.current >= AUTO_COMPLETE_THRESHOLD) {
            completeOpen();
        } else {
            // Snap to current accumulated position (doesn't reset!)
            snapToProgress();
        }
    }, [completeOpen, snapToProgress]);

    // ─── Touch handlers (for mobile) ────────────────────
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let touchStartX = 0;
        let tsd = 0;

        const onTouchStart = (e: TouchEvent) => {
            if (phaseRef.current !== "pulling" || dismissedRef.current) return;
            touchStartX = e.touches[0].clientX;
            tsd = 0;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (phaseRef.current !== "pulling" || dismissedRef.current) return;
            e.preventDefault();
            const dx = e.touches[0].clientX - touchStartX;
            const absDx = Math.abs(dx);
            const vw = window.innerWidth;
            const totalNeeded = vw * TOTAL_PULL_NEEDED_RATIO;

            const effectiveDelta = (absDx * DRAG_RESISTANCE) / totalNeeded;
            const newProg = Math.min(1, totalProgress.current + effectiveDelta - tsd);
            tsd = effectiveDelta;
            applyCurtainPosition(Math.max(0, newProg));
        };

        const onTouchEnd = () => {
            if (phaseRef.current !== "pulling" || dismissedRef.current) return;
            totalProgress.current = Math.min(1, totalProgress.current + tsd);
            tsd = 0;

            if (totalProgress.current >= AUTO_COMPLETE_THRESHOLD) {
                completeOpen();
            } else {
                snapToProgress();
            }
        };

        container.addEventListener("touchstart", onTouchStart, { passive: true });
        container.addEventListener("touchmove", onTouchMove, { passive: false });
        container.addEventListener("touchend", onTouchEnd, { passive: true });

        return () => {
            container.removeEventListener("touchstart", onTouchStart);
            container.removeEventListener("touchmove", onTouchMove);
            container.removeEventListener("touchend", onTouchEnd);
        };
    }, [applyCurtainPosition, completeOpen, snapToProgress]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[200] select-none overflow-hidden"
            style={{ touchAction: "none", background: "#000" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {/* ═══ Spotlight (Phase 2) ═══ */}
            <div
                ref={spotlightRef}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center text-center pointer-events-none"
                style={{ opacity: 0 }}
            >
                {/* Spotlight circle glow */}
                <div
                    className="absolute rounded-full"
                    style={{
                        width: 350,
                        height: 350,
                        background: "radial-gradient(circle, rgba(255,245,238,0.18) 0%, rgba(255,183,197,0.08) 40%, transparent 70%)",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                    }}
                />
                {/* Message text */}
                <div ref={messageRef} style={{ opacity: 0 }}>
                    <p
                        className="text-3xl sm:text-5xl md:text-6xl font-bold italic text-white/90 mb-3"
                        style={{
                            fontFamily: "var(--font-serif)",
                            textShadow: "0 0 40px rgba(255,183,197,0.4), 0 0 80px rgba(215,38,61,0.2)",
                        }}
                    >
                        তোমার জন্য...
                    </p>
                    <p
                        className="text-base sm:text-lg text-white/40 tracking-[0.3em]"
                    >
                        💕
                    </p>
                </div>
            </div>

            {/* ═══ Left Curtain ═══ */}
            <div
                ref={leftCurtainRef}
                className="absolute top-0 left-0 h-full z-20"
                style={{
                    width: "51%", // slight overlap at seam
                    background: "linear-gradient(135deg, #8B1A2B 0%, #B02040 30%, #9E1B3C 60%, #7A1428 100%)",
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    boxShadow: "4px 0 30px rgba(0,0,0,0.5)",
                }}
            >
                {/* Fabric fold pattern */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: FOLD_GRADIENT_LEFT }}
                />
                {/* Velvet sheen */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.15) 100%)",
                    }}
                />
                {/* Gold trim at bottom */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-3 sm:h-4"
                    style={{
                        background: "linear-gradient(90deg, #8B6914, #D4A94A, #F0D68A, #D4A94A, #8B6914)",
                        opacity: 0.6,
                    }}
                />
                {/* Gold tassel fringe top */}
                <div
                    className="absolute top-0 left-0 right-0 h-8 sm:h-12"
                    style={{
                        background: "linear-gradient(180deg, #2A0A12 0%, transparent 100%)",
                    }}
                />
                {/* Valance / pelmet top accent */}
                <div
                    className="absolute top-0 left-0 right-0 h-2 sm:h-3"
                    style={{
                        background: "linear-gradient(90deg, #8B6914, #D4A94A, #F0D68A, #D4A94A, #8B6914)",
                        opacity: 0.5,
                    }}
                />
            </div>

            {/* ═══ Right Curtain ═══ */}
            <div
                ref={rightCurtainRef}
                className="absolute top-0 right-0 h-full z-20"
                style={{
                    width: "51%",
                    background: "linear-gradient(225deg, #8B1A2B 0%, #B02040 30%, #9E1B3C 60%, #7A1428 100%)",
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    boxShadow: "-4px 0 30px rgba(0,0,0,0.5)",
                }}
            >
                {/* Fabric fold pattern */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: FOLD_GRADIENT_RIGHT }}
                />
                {/* Velvet sheen */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.15) 100%)",
                    }}
                />
                {/* Gold trim at bottom */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-3 sm:h-4"
                    style={{
                        background: "linear-gradient(90deg, #8B6914, #D4A94A, #F0D68A, #D4A94A, #8B6914)",
                        opacity: 0.6,
                    }}
                />
                {/* Top accent */}
                <div
                    className="absolute top-0 left-0 right-0 h-8 sm:h-12"
                    style={{
                        background: "linear-gradient(180deg, #2A0A12 0%, transparent 100%)",
                    }}
                />
                <div
                    className="absolute top-0 left-0 right-0 h-2 sm:h-3"
                    style={{
                        background: "linear-gradient(90deg, #8B6914, #D4A94A, #F0D68A, #D4A94A, #8B6914)",
                        opacity: 0.5,
                    }}
                />
            </div>

            {/* ═══ Darkness overlay (hides curtains until "lights on") ═══ */}
            <div
                ref={curtainOverlayRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "#000",
                    opacity: 1,
                    zIndex: 25,
                }}
            />

            {/* ═══ Pull Hint (Phase 3+) ═══ */}
            <div
                ref={hintRef}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3 pointer-events-none"
                style={{ opacity: 0 }}
            >
                {/* Animated arrows pointing outward */}
                <div className="flex items-center gap-4 sm:gap-8">
                    <svg
                        width="28" height="28" viewBox="0 0 24 24" fill="none"
                        stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        className="nav-arrow-left"
                    >
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    <span
                        className="text-sm sm:text-base tracking-[0.25em] font-medium text-white/50"
                        style={{ fontFamily: "var(--font-serif)" }}
                    >
                        পর্দা সরাও
                    </span>
                    <svg
                        width="28" height="28" viewBox="0 0 24 24" fill="none"
                        stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        className="nav-arrow-right"
                    >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </div>
                <p className="text-xs text-white/25 tracking-widest">
                    টেনে ধরে দুদিকে সরাও
                </p>
            </div>
        </div>
    );
}
