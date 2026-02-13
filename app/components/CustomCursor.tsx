"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue } from "framer-motion";

interface Trail {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotate: number;
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

    useEffect(() => {
        // Don't show custom cursor on touch devices
        isTouchDevice.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice.current) return;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let isCurrentlyVisible = false;
        let isCurrentlyPointer = false;

        const handleMove = (e: MouseEvent) => {
            // Set position directly — no spring delay
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);

            if (!isCurrentlyVisible) {
                isCurrentlyVisible = true;
                setIsVisible(true);
            }

            // Check if hovering over interactive element
            const target = e.target as HTMLElement;
            const isOverInteractive = !!target.closest("a, button, input, textarea, [role='button'], .cursor-pointer");
            if (isOverInteractive !== isCurrentlyPointer) {
                isCurrentlyPointer = isOverInteractive;
                setIsPointer(isOverInteractive);
            }

            if (prefersReducedMotion) return;

            // Spawn trail particles
            const dx = e.clientX - lastTrail.current.x;
            const dy = e.clientY - lastTrail.current.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 15) {
                lastTrail.current = { x: e.clientX, y: e.clientY };
                const id = trailId.current++;

                // Add some initial velocity based on movement direction
                const vx = (Math.random() - 0.5) * 4 + dx * 0.1;
                const vy = (Math.random() - 0.2) * 2;
                const rotate = Math.random() * 360;

                setTrails((prev) => {
                    const next = [...prev, { id, x: e.clientX, y: e.clientY, vx, vy, rotate }];
                    return next.length > 25 ? next.slice(-25) : next;
                });

                setTimeout(() => {
                    setTrails((prev) => prev.filter((t) => t.id !== id));
                }, 2000);
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

    const windowHeight = typeof window !== "undefined" ? window.innerHeight : 1000;

    return (
        <>
            {/* Trail particles */}
            {trails.map((trail) => (
                <motion.div
                    key={trail.id}
                    className="fixed pointer-events-none z-[9998]"
                    style={{ left: trail.x, top: trail.y }}
                    initial={{ scale: 1, opacity: 0.8, x: 0, y: 0, rotate: trail.rotate }}
                    animate={{
                        x: trail.vx * 30,
                        y: windowHeight - trail.y - 10,
                        scale: [1, 1.2, 0.4],
                        opacity: [0.8, 0.8, 0],
                        rotate: trail.rotate + 180
                    }}
                    transition={{
                        duration: 1.5,
                        ease: "easeIn",
                        times: [0, 0.8, 1]
                    }}
                >
                    {/* Heart-shaped trail particle */}
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="#FFB7C5"
                        className="-ml-[7px] -mt-[7px]"
                        style={{
                            filter: "drop-shadow(0 0 4px rgba(255, 183, 197, 0.6))",
                        }}
                    >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </motion.div>
            ))}

            {/* Main cursor dot — directly follows mouse, no spring lag */}
            <motion.div
                className="fixed pointer-events-none z-[9999] -ml-[6px] -mt-[6px]"
                style={{ left: cursorX, top: cursorY, opacity: isVisible ? 1 : 0 }}
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
