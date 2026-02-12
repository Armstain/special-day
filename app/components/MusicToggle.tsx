"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MusicToggle() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeRef = useRef<ReturnType<typeof setInterval>>(null);

    useEffect(() => {
        // Create audio element with a royalty-free romantic piano piece
        const audio = new Audio();
        // We use a data URI for a silent init, actual source loaded on interaction
        audio.loop = true;
        audio.volume = 0;
        audio.preload = "none";
        audioRef.current = audio;
        setIsLoaded(true);

        return () => {
            audio.pause();
            audio.src = "";
            if (fadeRef.current) clearInterval(fadeRef.current);
        };
    }, []);

    const fadeVolume = useCallback((target: number, duration: number = 800) => {
        if (!audioRef.current) return;
        if (fadeRef.current) clearInterval(fadeRef.current);

        const audio = audioRef.current;
        const step = (target - audio.volume) / (duration / 50);

        fadeRef.current = setInterval(() => {
            if (!audioRef.current) return;
            const newVol = audioRef.current.volume + step;
            if ((step > 0 && newVol >= target) || (step < 0 && newVol <= target)) {
                audioRef.current.volume = Math.max(0, Math.min(1, target));
                if (fadeRef.current) clearInterval(fadeRef.current);
                if (target === 0) audioRef.current.pause();
            } else {
                audioRef.current.volume = Math.max(0, Math.min(1, newVol));
            }
        }, 50);
    }, []);

    const toggle = useCallback(async () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            fadeVolume(0);
            setIsPlaying(false);
        } else {
            // Use a soft piano melody from a public domain source
            if (!audioRef.current.src || audioRef.current.src === "") {
                audioRef.current.src =
                    "https://cdn.pixabay.com/audio/2024/11/29/audio_d72afbcd8b.mp3";
            }
            audioRef.current.volume = 0;
            try {
                await audioRef.current.play();
                fadeVolume(0.3);
                setIsPlaying(true);
            } catch {
                // Autoplay blocked, that's fine
            }
        }
    }, [isPlaying, fadeVolume]);

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
            title={isPlaying ? "Pause Music" : "Play Music"}
        >
            {isPlaying ? (
                /* Equalizer bars */
                <div className="flex items-end gap-[2px] h-5">
                    {barDelays.map((delay, i) => (
                        <motion.div
                            key={i}
                            className="w-[3px] bg-rose-deep rounded-full"
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
                /* Play icon */
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
