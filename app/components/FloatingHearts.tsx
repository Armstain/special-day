"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Heart {
    id: number;
    x: number;
    y: number;
    size: number;
    duration: number;
    delay: number;
    opacity: number;
}

interface ClickHeart {
    id: number;
    x: number;
    y: number;
}

interface BurstParticle {
    id: number;
    x: number;
    y: number;
    tx: number;
    ty: number;
}

const HeartSVG = ({ size, color = "#D7263D", opacity = 0.5 }: { size: number; color?: string; opacity?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} opacity={opacity}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

export default function FloatingHearts() {
    const [bgHearts] = useState<Heart[]>(() =>
        Array.from({ length: 10 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 12 + Math.random() * 24,
            duration: 10 + Math.random() * 12,
            delay: Math.random() * 10,
            opacity: 0.15 + Math.random() * 0.25,
        }))
    );

    const [clickHearts, setClickHearts] = useState<ClickHeart[]>([]);
    const [burstParticles, setBurstParticles] = useState<BurstParticle[]>([]);
    const idRef = useRef(100);

    const spawnHeart = useCallback((x: number, y: number) => {
        const id = idRef.current++;
        setClickHearts((prev) => [...prev, { id, x, y }]);
        setTimeout(() => {
            setClickHearts((prev) => prev.filter((h) => h.id !== id));
        }, 2000);
    }, []);

    const spawnBurst = useCallback((x: number, y: number) => {
        const baseId = idRef.current;
        idRef.current += 8;
        const particles: BurstParticle[] = Array.from({ length: 8 }, (_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 40 + Math.random() * 60;
            return {
                id: baseId + i,
                x, y,
                tx: Math.cos(angle) * dist,
                ty: Math.sin(angle) * dist,
            };
        });
        setBurstParticles((prev) => [...prev, ...particles]);
        setTimeout(() => {
            setBurstParticles((prev) => prev.filter((p) => !particles.find((pp) => pp.id === p.id)));
        }, 800);
    }, []);

    // Use window event listeners to not block scroll
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            spawnHeart(e.clientX, e.clientY);
        };

        const handleDblClick = (e: MouseEvent) => {
            spawnBurst(e.clientX, e.clientY);
        };

        window.addEventListener("click", handleClick);
        window.addEventListener("dblclick", handleDblClick);

        return () => {
            window.removeEventListener("click", handleClick);
            window.removeEventListener("dblclick", handleDblClick);
        };
    }, [spawnHeart, spawnBurst]);

    return (
        <>
            {/* Background floating hearts — pointer-events-none so scroll works */}
            <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
                {bgHearts.map((heart) => (
                    <div
                        key={heart.id}
                        className="absolute"
                        style={{
                            left: `${heart.x}%`,
                            bottom: `-${heart.size}px`,
                            animation: `float-up ${heart.duration}s linear ${heart.delay}s infinite`,
                            opacity: heart.opacity,
                        }}
                    >
                        <HeartSVG size={heart.size} color="#FFB7C5" opacity={1} />
                    </div>
                ))}
            </div>

            {/* Click-spawned hearts */}
            <AnimatePresence>
                {clickHearts.map((h) => (
                    <motion.div
                        key={h.id}
                        className="fixed pointer-events-none z-[60]"
                        style={{ left: h.x - 12, top: h.y - 12 }}
                        initial={{ y: 0, opacity: 1, scale: 0.5 }}
                        animate={{ y: -150, opacity: 0, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.8, ease: "easeOut" }}
                    >
                        <HeartSVG size={24} color="#D7263D" opacity={0.8} />
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Burst particles */}
            <AnimatePresence>
                {burstParticles.map((p) => (
                    <motion.div
                        key={p.id}
                        className="fixed pointer-events-none z-[60]"
                        style={{ left: p.x - 6, top: p.y - 6 }}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        <HeartSVG size={12} color="#D7263D" opacity={0.9} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </>
    );
}
