"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import { useCurtainPhysics } from "../hooks/useCurtainPhysics";

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const ANIMATION_DURATIONS = {
    darkToSpotlight: 1.5,
    spotlightFadeIn: 2.0,
    contentFadeIn: 1.0,
    spotlightLinger: 2.5,
    validationFadeIn: 0.8,
    clockFadeOut: 1.5,
    contentFadeOut: 0.5,
    spotlightExpand: 1.2,
    darknessFadeOut: 1.5,
    ambienceFadeIn: 2.5,
    spotlightFinalFade: 0.5,
    hintFadeIn: 0.7,
    curtainComplete: 1.4,
    containerFadeOut: 0.6,
    snapBack: 0.6,
    audioFadeOut: 1.0,
} as const;

const AUDIO_VOLUMES = {
    clock: 0.4,
    ambience: 0.3,
} as const;

const CURTAIN_STYLES = {
    foldGradientLeft:
        "repeating-linear-gradient(90deg, rgba(0,0,0,0.08) 0px, transparent 3px, transparent 40px, rgba(0,0,0,0.05) 42px, transparent 44px, transparent 80px)",
    foldGradientRight:
        "repeating-linear-gradient(90deg, transparent 0px, rgba(0,0,0,0.05) 38px, transparent 40px, transparent 42px, rgba(0,0,0,0.08) 80px)",
    baseGradientLeft:
        "linear-gradient(135deg, #8B1A2B 0%, #B02040 30%, #9E1B3C 60%, #7A1428 100%)",
    baseGradientRight:
        "linear-gradient(225deg, #8B1A2B 0%, #B02040 30%, #9E1B3C 60%, #7A1428 100%)",
    lightingOverlay:
        "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.15) 100%)",
    goldenTrim:
        "linear-gradient(90deg, #8B6914, #D4A94A, #F0D68A, #D4A94A, #8B6914)",
    topShadow: "linear-gradient(180deg, #2A0A12 0%, transparent 100%)",
} as const;

const SPOTLIGHT_GRADIENT = `
  radial-gradient(
    circle,
    rgba(255, 255, 255, 0.7) 0%,
    rgba(255, 250, 240, 0.55) 15%,
    rgba(255, 245, 230, 0.35) 30%,
    rgba(255, 240, 220, 0.18) 50%,
    rgba(255, 235, 210, 0.06) 70%,
    rgba(0, 0, 0, 0) 85%
  )
`;

const SPOTLIGHT_SHADOW = `
  0 0 60px 30px rgba(255, 250, 240, 0.12),
  0 0 120px 60px rgba(255, 245, 230, 0.06),
  inset 0 0 40px 15px rgba(255, 255, 255, 0.08)
`;

const PULL_THRESHOLD = 0.85;
const CURTAIN_TRAVEL_PERCENT = 0.52;
const PULL_SENSITIVITY = 0.35;
const PULL_REQUIREMENT = 0.55;

const TARGET_DATE = new Date(2026, 1, 14, 0, 0, 0);
const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const VALID_NAME = "adnan";
const ADMIN_NAME = "admin";

const MESSAGES = {
    namePlaceholder: "এখানে লেখো...",
    namePrompt: "তোমার ভালোবাসার মানুষটার নাম......",
    enterButton: "প্রবেশ করো 💕",
    pullHint: "পর্দা সরাও",
    pullInstruction: "টেনে ধরে দুদিকে সরাও",
    errorWrongName: "তুমি তার নামই জানো না? 💔",
    errorTooEarly: "এখনো সময় আসেনি... অপেক্ষা করো 💕",
    countdownLabels: {
        days: "দিন",
        hours: "ঘণ্টা",
        minutes: "মিনিট",
        seconds: "সেকেন্ড",
    },
} as const;

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface WelcomeGateProps {
    onCurtainsFullyOpen?: () => void;
    onComplete: () => void;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

type Phase = "dark" | "spotlight" | "validation" | "lights" | "pulling";

// ═══════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════

function getTimeLeft(): TimeLeft {
    const now = Date.now();
    const target = TARGET_DATE.getTime();
    const diff = Math.max(0, target - now);

    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        total: diff,
    };
}

function toBengaliNumber(str: string): string {
    return str.replace(/[0-9]/g, (d) => BENGALI_DIGITS[parseInt(d)]);
}

function padNumber(n: number): string {
    return String(n).padStart(2, "0");
}

function fadeOutAudio(audio: HTMLAudioElement | null, duration: number = ANIMATION_DURATIONS.audioFadeOut) {
    if (!audio) return;
    gsap.to(audio, {
        volume: 0,
        duration,
        onComplete: () => audio.pause(),
    });
}

function fadeInAudio(audio: HTMLAudioElement | null, targetVolume: number, duration: number) {
    if (!audio) return;
    audio.play().catch(() => { });
    gsap.to(audio, { volume: targetVolume, duration });
}

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

export default function WelcomeGate({ onCurtainsFullyOpen, onComplete }: WelcomeGateProps) {
    const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const leftCurtainRef = useRef<HTMLDivElement>(null);
    const rightCurtainRef = useRef<HTMLDivElement>(null);
    const spotlightRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const validationRef = useRef<HTMLDivElement>(null);
    const hintRef = useRef<HTMLDivElement>(null);
    const darknessRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const clockAudioRef = useRef<HTMLAudioElement | null>(null);
    const ambienceAudioRef = useRef<HTMLAudioElement | null>(null);
    const phaseRef = useRef<Phase>("dark");
    const shakeTimeoutRef = useRef<number | undefined>(undefined);
    const audioUnlockedRef = useRef(false);
    const curtainOpenHandledRef = useRef(false);

    // State
    const [phase, setPhase] = useState<Phase>("dark");
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);
    const [nameInput, setNameInput] = useState("");
    const [shaking, setShaking] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [timerDone, setTimerDone] = useState(false);

    // Keep phase ref in sync
    useEffect(() => {
        phaseRef.current = phase;
    }, [phase]);

    // Curtain physics hook
    const {
        handlePointerDown: physicsPointerDown,
        handlePointerMove: physicsPointerMove,
        handlePointerUp: physicsPointerUp,
        dismissed,
    } = useCurtainPhysics({
        leftRef: leftCurtainRef,
        rightRef: rightCurtainRef,
        containerRef: containerRef,
        onComplete: () => {
            if (!curtainOpenHandledRef.current) {
                curtainOpenHandledRef.current = true;
                onCurtainsFullyOpen?.();
            }

            fadeOutAudio(clockAudioRef.current);
            fadeOutAudio(ambienceAudioRef.current);
            setTimeout(onComplete, ANIMATION_DURATIONS.audioFadeOut * 1000);
        },
    });

    // ═══════════════════════════════════════════════════════
    // AUDIO INITIALIZATION
    // ═══════════════════════════════════════════════════════

    useEffect(() => {
        const clockAudio = new Audio(`${publicBasePath}/cinematic-clock-ticking.mp3`);
        clockAudio.loop = true;
        clockAudio.volume = 0;
        clockAudioRef.current = clockAudio;

        const ambienceAudio = new Audio(`${publicBasePath}/ambience_music.mp3`);
        ambienceAudio.loop = true;
        ambienceAudio.volume = 0;
        ambienceAudioRef.current = ambienceAudio;

        return () => {
            clockAudio.pause();
            clockAudio.src = "";
            ambienceAudio.pause();
            ambienceAudio.src = "";
        };
    }, [publicBasePath]);

    // ═══════════════════════════════════════════════════════
    // AUDIO UNLOCK ON USER GESTURE
    // ═══════════════════════════════════════════════════════

    const ensureAudioPlaying = useCallback(() => {
        if (audioUnlockedRef.current) return;
        audioUnlockedRef.current = true;

        // Retry playing any audio that was blocked by autoplay policy
        [clockAudioRef.current, ambienceAudioRef.current].forEach(audio => {
            if (audio && audio.paused) {
                audio.play().catch(() => { });
            }
        });
    }, []);

    // ═══════════════════════════════════════════════════════
    // COUNTDOWN TIMER
    // ═══════════════════════════════════════════════════════

    useEffect(() => {
        const timer = setInterval(() => {
            const tl = getTimeLeft();
            setTimeLeft(tl);
            if (tl.total === 0) {
                setTimerDone(true);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // ═══════════════════════════════════════════════════════
    // PHASE ORCHESTRATION
    // ═══════════════════════════════════════════════════════

    useEffect(() => {
        const tl = gsap.timeline();

        // Phase 1 → 2: Transition to spotlight
        tl.to({}, {
            duration: ANIMATION_DURATIONS.darkToSpotlight,
            onComplete: () => {
                setPhase("spotlight");
                fadeInAudio(clockAudioRef.current, AUDIO_VOLUMES.clock, 2);
                fadeInAudio(
                    ambienceAudioRef.current,
                    AUDIO_VOLUMES.ambience,
                    ANIMATION_DURATIONS.ambienceFadeIn
                );
            },
        });

        // Spotlight appearance
        tl.fromTo(
            spotlightRef.current,
            { opacity: 0, scale: 0.3 },
            {
                opacity: 1,
                scale: 1,
                duration: ANIMATION_DURATIONS.spotlightFadeIn,
                ease: "power2.out"
            },
            "+=0.1"
        );

        // Countdown content fade in
        tl.fromTo(
            contentRef.current,
            { opacity: 0, scale: 0.7 },
            {
                opacity: 1,
                scale: 1,
                duration: ANIMATION_DURATIONS.contentFadeIn,
                ease: "back.out(1.4)"
            },
            "-=1.0"
        );

        // Phase 2 → 3: Transition to validation
        tl.to({}, {
            duration: ANIMATION_DURATIONS.spotlightLinger,
            onComplete: () => setPhase("validation"),
        });

        // Validation prompt fade in
        tl.fromTo(
            validationRef.current,
            { opacity: 0, y: 25 },
            {
                opacity: 1,
                y: 0,
                duration: ANIMATION_DURATIONS.validationFadeIn,
                ease: "power2.out",
                onComplete: () => inputRef.current?.focus(),
            }
        );

        return () => {
            tl.kill();
        };
    }, []);

    // ═══════════════════════════════════════════════════════
    // PROCEED TO CURTAIN PHASE
    // ═══════════════════════════════════════════════════════

    const proceedToLights = useCallback(() => {
        const tl = gsap.timeline();

        // Fade out spotlight content
        tl.to([contentRef.current, validationRef.current], {
            opacity: 0,
            scale: 0.9,
            duration: ANIMATION_DURATIONS.contentFadeOut,
            ease: "power2.in",
        });

        // Expand spotlight
        tl.to(
            spotlightRef.current,
            {
                scale: 4,
                opacity: 0.6,
                duration: ANIMATION_DURATIONS.spotlightExpand,
                ease: "power2.inOut",
            },
            "-=0.2"
        );

        // Fade out darkness overlay (lights up stage)
        tl.to(
            darknessRef.current,
            {
                opacity: 0,
                duration: ANIMATION_DURATIONS.darknessFadeOut,
                ease: "power2.inOut",
                onStart: () => {
                    // Ambience continues playing 
                },
            },
            "-=0.8"
        );

        // Fade out spotlight
        tl.to(spotlightRef.current, {
            opacity: 0,
            duration: ANIMATION_DURATIONS.spotlightFinalFade,
        });

        tl.add(() => setPhase("lights"));

        // Show pull hint
        tl.fromTo(
            hintRef.current,
            { opacity: 0, y: 15 },
            {
                opacity: 1,
                y: 0,
                duration: ANIMATION_DURATIONS.hintFadeIn,
                ease: "power2.out",
                onComplete: () => setPhase("pulling"),
            }
        );
    }, []);

    // ═══════════════════════════════════════════════════════
    // NAME VALIDATION
    // ═══════════════════════════════════════════════════════

    const triggerShake = useCallback((message: string) => {
        setErrorMsg(message);
        setShaking(true);

        clearTimeout(shakeTimeoutRef.current);
        shakeTimeoutRef.current = window.setTimeout(() => {
            setShaking(false);
        }, 500);
    }, []);

    const handleNameSubmit = useCallback(() => {
        const name = nameInput.trim().toLowerCase();

        if (name === ADMIN_NAME) {
            proceedToLights();
            return;
        }

        if (name === VALID_NAME) {
            if (timerDone) {
                proceedToLights();
            } else {
                triggerShake(MESSAGES.errorTooEarly);
            }
            return;
        }

        triggerShake(MESSAGES.errorWrongName);
    }, [nameInput, timerDone, proceedToLights, triggerShake]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") {
                handleNameSubmit();
            }
        },
        [handleNameSubmit]
    );

    // ═══════════════════════════════════════════════════════
    // POINTER HANDLERS (GATED BY PHASE)
    // ═══════════════════════════════════════════════════════

    const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
            if (phaseRef.current !== "pulling") return;
            physicsPointerDown(e);
        },
        [physicsPointerDown]
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (phaseRef.current !== "pulling") return;
            physicsPointerMove(e);
        },
        [physicsPointerMove]
    );

    const handlePointerUp = useCallback(() => {
        if (phaseRef.current !== "pulling") return;
        physicsPointerUp();
    }, [physicsPointerUp]);

    // ═══════════════════════════════════════════════════════
    // TOUCH HANDLERS (MOBILE)
    // ═══════════════════════════════════════════════════════

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let touchStartX = 0;
        let progress = 0;

        const handleTouchStart = (e: TouchEvent) => {
            if (phaseRef.current !== "pulling" || dismissed.current) return;
            touchStartX = e.touches[0].clientX;
            progress = 0;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (phaseRef.current !== "pulling" || dismissed.current) return;
            e.preventDefault();

            const dx = Math.abs(e.touches[0].clientX - touchStartX);
            const vw = window.innerWidth;
            const totalNeeded = vw * PULL_REQUIREMENT;

            progress = (dx * PULL_SENSITIVITY) / totalNeeded;

            if (leftCurtainRef.current && rightCurtainRef.current) {
                const maxTravel = vw * CURTAIN_TRAVEL_PERCENT;
                const offset = Math.min(1, progress) * maxTravel;
                gsap.set(leftCurtainRef.current, { x: -offset });
                gsap.set(rightCurtainRef.current, { x: offset });
            }
        };

        const handleTouchEnd = () => {
            if (phaseRef.current !== "pulling" || dismissed.current) return;

            if (progress >= PULL_THRESHOLD) {
                // Complete the curtain pull
                if (dismissed.current) return;
                dismissed.current = true;

                const vw = window.innerWidth;
                const tl = gsap.timeline({
                    onComplete: () => {
                        if (!curtainOpenHandledRef.current) {
                            curtainOpenHandledRef.current = true;
                            onCurtainsFullyOpen?.();
                        }

                        fadeOutAudio(clockAudioRef.current);
                        fadeOutAudio(ambienceAudioRef.current);
                        setTimeout(onComplete, ANIMATION_DURATIONS.audioFadeOut * 1000);
                    },
                });

                tl.to(
                    leftCurtainRef.current,
                    { x: -(vw * 0.6), duration: ANIMATION_DURATIONS.curtainComplete, ease: "expo.inOut" },
                    0
                );
                tl.to(
                    rightCurtainRef.current,
                    { x: vw * 0.6, duration: ANIMATION_DURATIONS.curtainComplete, ease: "expo.inOut" },
                    0
                );
                tl.to(
                    containerRef.current,
                    { opacity: 0, duration: ANIMATION_DURATIONS.containerFadeOut },
                    1.0
                );
            } else {
                // Snap back
                if (leftCurtainRef.current && rightCurtainRef.current) {
                    gsap.to(leftCurtainRef.current, {
                        x: 0,
                        duration: ANIMATION_DURATIONS.snapBack,
                        ease: "expo.out",
                    });
                    gsap.to(rightCurtainRef.current, {
                        x: 0,
                        duration: ANIMATION_DURATIONS.snapBack,
                        ease: "expo.out",
                    });
                }
            }

            progress = 0;
        };

        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchmove", handleTouchMove, { passive: false });
        container.addEventListener("touchend", handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
            container.removeEventListener("touchend", handleTouchEnd);
        };
    }, [onComplete, onCurtainsFullyOpen, dismissed]);

    // Cleanup shake timeout
    useEffect(() => {
        return () => {
            clearTimeout(shakeTimeoutRef.current);
        };
    }, []);

    // ═══════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════

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
            {/* Left Curtain */}
            <div
                ref={leftCurtainRef}
                className="absolute top-0 left-0 h-full z-20"
                style={{
                    width: "51%",
                    background: CURTAIN_STYLES.baseGradientLeft,
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    boxShadow: "4px 0 30px rgba(0,0,0,0.5)",
                }}
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: CURTAIN_STYLES.foldGradientLeft }}
                />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: CURTAIN_STYLES.lightingOverlay }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-3 sm:h-4"
                    style={{ background: CURTAIN_STYLES.goldenTrim, opacity: 0.6 }}
                />
                <div
                    className="absolute top-0 left-0 right-0 h-8 sm:h-12"
                    style={{ background: CURTAIN_STYLES.topShadow }}
                />
                <div
                    className="absolute top-0 left-0 right-0 h-2 sm:h-3"
                    style={{ background: CURTAIN_STYLES.goldenTrim, opacity: 0.5 }}
                />
            </div>

            {/* Right Curtain */}
            <div
                ref={rightCurtainRef}
                className="absolute top-0 right-0 h-full z-20"
                style={{
                    width: "51%",
                    background: CURTAIN_STYLES.baseGradientRight,
                    willChange: "transform",
                    backfaceVisibility: "hidden",
                    boxShadow: "-4px 0 30px rgba(0,0,0,0.5)",
                }}
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: CURTAIN_STYLES.foldGradientRight }}
                />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: CURTAIN_STYLES.lightingOverlay }}
                />
                <div
                    className="absolute bottom-0 left-0 right-0 h-3 sm:h-4"
                    style={{ background: CURTAIN_STYLES.goldenTrim, opacity: 0.6 }}
                />
                <div
                    className="absolute top-0 left-0 right-0 h-8 sm:h-12"
                    style={{ background: CURTAIN_STYLES.topShadow }}
                />
                <div
                    className="absolute top-0 left-0 right-0 h-2 sm:h-3"
                    style={{ background: CURTAIN_STYLES.goldenTrim, opacity: 0.5 }}
                />
            </div>

            {/* Darkness Overlay */}
            <div
                ref={darknessRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "rgba(0, 0, 0, 0.92)",
                    zIndex: 25,
                }}
            />

            {/* Circular Spotlight */}
            <div
                ref={spotlightRef}
                className="absolute z-30 pointer-events-none"
                style={{
                    opacity: 0,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "min(75vw, 75vh)",
                    height: "min(75vw, 75vh)",
                    borderRadius: "50%",
                    background: SPOTLIGHT_GRADIENT,
                    boxShadow: SPOTLIGHT_SHADOW,
                    mixBlendMode: "screen",
                }}
            />

            {/* Countdown Content */}
            <div
                ref={contentRef}
                className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center text-center pointer-events-none"
                style={{ opacity: 0 }}
            >
                <div className="flex items-center gap-2 sm:gap-4 md:gap-5">
                    {(["hours", "minutes", "seconds"] as const).map((unit, idx) => (
                        <div key={unit} className="flex items-center gap-2 sm:gap-4 md:gap-5">
                            {idx > 0 && (
                                <span className="bat-signal-text text-4xl sm:text-5xl font-light -mt-5 opacity-100">
                                    :
                                </span>
                            )}
                            <div className="flex flex-col items-center">
                                <span
                                    className="bat-signal-text text-5xl sm:text-7xl md:text-7xl font-bold"
                                    style={{ fontFamily: "var(--font-serif)" }}
                                >
                                    {toBengaliNumber(padNumber(timeLeft[unit]))}
                                </span>
                                <span className="bat-signal-label text-[10px] sm:text-xs font-medium mt-1">
                                    {MESSAGES.countdownLabels[unit]}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Name Validation */}
            <div
                ref={validationRef}
                className="absolute left-1/2 top-[65%] -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center text-center"
                style={{ opacity: 0 }}
            >
                <p
                    className="text-base sm:text-xl md:text-2xl text-white/60 mb-5 sm:mb-6 italic"
                    style={{
                        fontFamily: "var(--font-serif)",
                        textShadow: "0 0 30px rgba(255,183,197,0.25)",
                    }}
                >
                    {MESSAGES.namePrompt}
                </p>

                <div className={`flex flex-col items-center gap-3 ${shaking ? "input-shake" : ""}`}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={nameInput}
                        onFocus={ensureAudioPlaying}
                        onChange={(e) => {
                            ensureAudioPlaying();
                            setNameInput(e.target.value);
                            setErrorMsg("");
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={MESSAGES.namePlaceholder}
                        className="w-56 sm:w-72 px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-white/5 border border-white/15
              text-white text-center text-base sm:text-lg placeholder-white/20
              focus:outline-none focus:border-white/30 focus:bg-white/8
              transition-all duration-300 backdrop-blur-sm"
                        style={{
                            fontFamily: "var(--font-serif)",
                            caretColor: "#FFB7C5",
                        }}
                        autoComplete="off"
                    />

                    <button
                        onClick={() => { ensureAudioPlaying(); handleNameSubmit(); }}
                        className="px-6 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/80
              hover:bg-white/15 hover:border-white/30 active:scale-95
              transition-all duration-300 text-sm sm:text-base font-medium tracking-wide"
                        style={{ fontFamily: "var(--font-serif)" }}
                    >
                        {MESSAGES.enterButton}
                    </button>

                    {errorMsg && (
                        <p
                            className="text-xs sm:text-sm text-rose-300/80 mt-1"
                            style={{ fontFamily: "var(--font-serif)" }}
                        >
                            {errorMsg}
                        </p>
                    )}
                </div>
            </div>

            {/* Pull Hint */}
            <div
                ref={hintRef}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3 pointer-events-none"
                style={{ opacity: 0 }}
            >
                <div className="flex items-center gap-4 sm:gap-8">
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="nav-arrow-left"
                    >
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                    <span
                        className="text-sm sm:text-base tracking-[0.25em] font-medium text-white/50"
                        style={{ fontFamily: "var(--font-serif)" }}
                    >
                        {MESSAGES.pullHint}
                    </span>
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="nav-arrow-right"
                    >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </div>
                <p className="text-xs text-white/25 tracking-widest">
                    {MESSAGES.pullInstruction}
                </p>
            </div>
        </div>
    );
}