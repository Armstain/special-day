"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

export default function MusicToggle() {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fadeRef = useRef<ReturnType<typeof setInterval>>(null);

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

    useEffect(() => {
        const audio = new Audio("/Abar.mp3");
        audio.loop = true;
        audio.volume = 0;
        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = "";
            if (fadeRef.current) clearInterval(fadeRef.current);
        };
    }, [fadeVolume]);

    const toggle = useCallback(async () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            fadeVolume(0);
            setIsPlaying(false);
        } else {
            audioRef.current.volume = 0;
            try {
                await audioRef.current.play();
                fadeVolume(0.04); // 5% volume
                setIsPlaying(true);
            } catch {
                // Autoplay blocked
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
