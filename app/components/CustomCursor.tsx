"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

interface Trail {
    id: number;
    x: number;
    y: number;
}

export default function CustomCursor() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const [trails, setTrails] = useState<Trail[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [isPointer, setIsPointer] = useState(false);
    const trailId = useRef(0);
    const lastTrail = useRef({ x: 0, y: 0 });
    const isTouchDevice = useRef(false);

    // Smooth spring-based follow
    const springX = useSpring(cursorX, { stiffness: 300, damping: 28, mass: 0.5 });
    const springY = useSpring(cursorY, { stiffness: 300, damping: 28, mass: 0.5 });

    useEffect(() => {
        // Don't show custom cursor on touch devices
        isTouchDevice.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice.current) return;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let isCurrentlyVisible = false;
        let isCurrentlyPointer = false;

        const handleMove = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);

            // Only update state when visibility actually changes (avoid redundant re-renders)
            if (!isCurrentlyVisible) {
                isCurrentlyVisible = true;
                setIsVisible(true);
            }

            // Check if hovering over interactive element
            const target = e.target as HTMLElement;
            const isOverInteractive = !!target.closest("a, button, input, [role='button'], .cursor-pointer");
            if (isOverInteractive !== isCurrentlyPointer) {
                isCurrentlyPointer = isOverInteractive;
                setIsPointer(isOverInteractive);
            }

            if (prefersReducedMotion) return;

            // Spawn trail particles
            const dx = e.clientX - lastTrail.current.x;
            const dy = e.clientY - lastTrail.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 20) {
                lastTrail.current = { x: e.clientX, y: e.clientY };
                const id = trailId.current++;
                setTrails((prev) => {
                    const next = [...prev, { id, x: e.clientX, y: e.clientY }];
                    // Keep max 15 trails (reduced from 25 for perf)
                    return next.length > 15 ? next.slice(-15) : next;
                });
                setTimeout(() => {
                    setTrails((prev) => prev.filter((t) => t.id !== id));
                }, 700);
            }
        };

        const handleLeave = () => {
            isCurrentlyVisible = false;
            setIsVisible(false);
        };
        const handleEnter = () => {
            isCurrentlyVisible = true;
            setIsVisible(true);
        };

        window.addEventListener("mousemove", handleMove, { passive: true });
        document.addEventListener("mouseleave", handleLeave);
        document.addEventListener("mouseenter", handleEnter);

        return () => {
            window.removeEventListener("mousemove", handleMove);
            document.removeEventListener("mouseleave", handleLeave);
            document.removeEventListener("mouseenter", handleEnter);
        };
    }, [cursorX, cursorY]);

    // Don't render on touch devices
    if (typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0)) {
        return null;
    }

    return (
        <>
            {/* Trail particles */}
            {trails.map((trail) => (
                <motion.div
                    key={trail.id}
                    className="fixed pointer-events-none z-[9998]"
                    style={{ left: trail.x, top: trail.y }}
                    initial={{ scale: 1, opacity: 0.7 }}
                    animate={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                >
                    {/* Heart-shaped trail particle */}
                    <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="#FFB7C5"
                        className="-ml-[5px] -mt-[5px]"
                        style={{
                            filter: "drop-shadow(0 0 4px rgba(255, 183, 197, 0.6))",
                        }}
                    >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </motion.div>
            ))}

            {/* Main cursor dot */}
            <motion.div
                className="fixed pointer-events-none z-[9999] -ml-[6px] -mt-[6px]"
                style={{ left: springX, top: springY, opacity: isVisible ? 1 : 0 }}
            >
                <motion.div
                    className="rounded-full"
                    animate={{
                        width: isPointer ? 40 : 12,
                        height: isPointer ? 40 : 12,
                        marginLeft: isPointer ? -14 : 0,
                        marginTop: isPointer ? -14 : 0,
                        backgroundColor: isPointer
                            ? "rgba(215, 38, 61, 0.15)"
                            : "rgba(215, 38, 61, 0.9)",
                        border: isPointer
                            ? "2px solid rgba(215, 38, 61, 0.5)"
                            : "2px solid rgba(215, 38, 61, 0)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    style={{
                        boxShadow: isPointer
                            ? "0 0 20px rgba(215, 38, 61, 0.2)"
                            : "0 0 12px rgba(215, 38, 61, 0.5), 0 0 4px rgba(255, 183, 197, 0.8)",
                    }}
                />
            </motion.div>
        </>
    );
}
