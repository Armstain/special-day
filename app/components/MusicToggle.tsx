"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface MusicToggleProps {
    shouldStart?: boolean;
}

const clampVolume = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export default function MusicToggle({ shouldStart = false }: MusicToggleProps) {
    const audioBasePath =
        typeof window !== "undefined" && window.location.pathname.startsWith("/special-day")
            ? "/special-day"
            : "";
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeRafRef = useRef<number | null>(null);
    const shouldAutoplayWhenUnlockedRef = useRef(false);

    const cancelFade = useCallback(() => {
        if (fadeRafRef.current !== null) {
            cancelAnimationFrame(fadeRafRef.current);
            fadeRafRef.current = null;
        }
    }, []);

    const fadeTo = useCallback(
        (target: number, duration: number = 800, onComplete?: () => void) => {
            const audio = audioRef.current;
            if (!audio) return;

            cancelFade();

            const from = clampVolume(audio.volume);
            const to = clampVolume(target);
            const safeDuration = duration > 0 ? duration : 1;
            const start = performance.now();

            const tick = (now: number) => {
                const elapsed = now - start;
                const progress = Math.min(1, Math.max(0, elapsed / safeDuration));
                const nextVolume = clampVolume(from + (to - from) * progress);
                audio.volume = nextVolume;

                if (progress < 1) {
                    fadeRafRef.current = requestAnimationFrame(tick);
                } else {
                    audio.volume = to;
                    fadeRafRef.current = null;
                    onComplete?.();
                }
            };

            fadeRafRef.current = requestAnimationFrame(tick);
        },
        [cancelFade]
    );

    useEffect(() => {
        const audio = new Audio(`${audioBasePath}/abar.mp3`);
        audio.loop = true;
        audio.volume = clampVolume(0);
        audio.preload = "auto";
        audioRef.current = audio;

        const syncPlayingState = () => setIsPlaying(!audio.paused);
        audio.addEventListener("play", syncPlayingState);
        audio.addEventListener("pause", syncPlayingState);
        audio.addEventListener("ended", syncPlayingState);

        return () => {
            audio.removeEventListener("play", syncPlayingState);
            audio.removeEventListener("pause", syncPlayingState);
            audio.removeEventListener("ended", syncPlayingState);
            cancelFade();
            audio.pause();
            audio.removeAttribute("src");
            audio.load();
        };
    }, [cancelFade, audioBasePath]);

    const playWithFadeIn = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio) return false;
        if (!audio.paused) return true;

        audio.volume = clampVolume(0);
        try {
            await audio.play();
            fadeTo(0.22);
            shouldAutoplayWhenUnlockedRef.current = false;
            return true;
        } catch {
            shouldAutoplayWhenUnlockedRef.current = true;
            return false;
        }
    }, [fadeTo]);

    const stopWithFadeOut = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || audio.paused) return;

        fadeTo(0, 700, () => {
            audio.pause();
            audio.currentTime = audio.currentTime;
        });
    }, [fadeTo]);

    useEffect(() => {
        if (!shouldStart) return;
        void playWithFadeIn();
    }, [shouldStart, playWithFadeIn]);

    useEffect(() => {
        const tryUnlockPlayback = () => {
            if (!shouldStart) return;
            void playWithFadeIn();
        };

        window.addEventListener("pointerdown", tryUnlockPlayback, { passive: true });
        window.addEventListener("keydown", tryUnlockPlayback);
        window.addEventListener("touchstart", tryUnlockPlayback, { passive: true });

        return () => {
            window.removeEventListener("pointerdown", tryUnlockPlayback);
            window.removeEventListener("keydown", tryUnlockPlayback);
            window.removeEventListener("touchstart", tryUnlockPlayback);
        };
    }, [shouldStart, playWithFadeIn]);

    const toggle = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!audio.paused) {
            stopWithFadeOut();
        } else {
            await playWithFadeIn();
        }
    }, [playWithFadeIn, stopWithFadeOut]);

    const barDelays = [0, 0.15, 0.3, 0.1, 0.25];
    const barHeights = [14, 20, 10, 16, 12];

    return (
        <motion.button
            onClick={toggle}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 
                 glass-card rounded-full w-12 h-12 sm:w-14 sm:h-14
                 flex items-center justify-center gap-1
                 hover:shadow-lg transition-shadow cursor-pointer
                 border border-pink-soft/50"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            title={isPlaying ? "সুর থামাও" : "সুর চালাও"}
        >
            {isPlaying ? (
                <div className="flex items-end gap-0.5 h-5">
                    {barDelays.map((delay, i) => (
                        <motion.div
                            key={i}
                            className="w-0.75 bg-rose-deep rounded-full"
                            style={{ height: 4 }}
                            animate={{
                                height: [4, barHeights[i], 4],
                            }}
                            transition={{
                                duration: 0.6 + delay,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay,
                            }}
                        />
                    ))}
                </div>
            ) : (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="var(--color-rose-deep)"
                    className="ml-0.5"
                >
                    <path d="M8 5v14l11-7z" />
                </svg>
            )}
        </motion.button>
    );
}
